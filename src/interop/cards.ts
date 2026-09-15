import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';
import { deprecate } from 'node:util';
import { parse } from 'yaml';
import type { FafData } from '../core/types.js';
import { makeDirInside, readUtf8, resolveInside } from '../core/safe-write.js';
import { writeRendered, type RenderedResult } from '../core/render-hash.js';
import { upsertJsonRows } from '../core/json-edit.js';
import {
  A2A_PROTOCOL_VERSION,
  FAF_MEDIA_TYPES,
  a2aDoors,
  projectA2ACard,
  type FafaDoc,
  type ProjectedA2A,
} from './pack.js';
import {
  fafContextBlock,
  buildServerCard,
  hasRegistryMark,
  hasServerCardMark,
  registryMeta,
  registryName,
  registryTitle,
  type ServerCardOptions,
} from './servercard.js';

/** A2A extension URI — dereference, not the MCP `_meta` key `one.faf/context`. */
export const A2A_CONTEXT_URI = 'https://faf.one/ext/context/v1';
// The .fafa types, the A2A card core and its helpers live in pack.ts (pure, no
// Node built-ins) so the CLI and a browser front door share one projector.
export {
  A2A_PROTOCOL_BINDING,
  A2A_PROTOCOL_VERSION,
  FAF_MEDIA_TYPES,
  a2aEndpoints,
  a2aDoors,
} from './pack.js';
export type { FafaAgent, FafaCapability, FafaEndpoint, FafaDoc, ProjectedA2A } from './pack.js';

export type CardTarget = 'a2a' | 'mcp' | 'registry' | 'catalog';
export const CARD_TARGETS: CardTarget[] = ['a2a', 'mcp', 'registry', 'catalog'];

export interface ProjectCardsOptions extends ServerCardOptions {
  /** Public URL of the emitted A2A card (catalog row). */
  a2aCardUrl?: string;
  /** Caller-supplied A2A door when `.fafa` has no `endpoints[].protocol: a2a`. */
  doorUrl?: string;
}

export interface CatalogEntry {
  identifier: string;
  displayName?: string;
  type: string;
  description?: string;
  url: string;
  updatedAt?: string;
}

export interface AiCatalog {
  specVersion: string;
  host?: Record<string, unknown>;
  entries: CatalogEntry[];
  [key: string]: unknown;
}

export interface ProjectedCards {
  block: Record<string, unknown>;
  a2a?: ProjectedA2A;
  mcp?: Record<string, unknown>;
  registry?: {
    name: string;
    title?: string;
    _meta: Record<string, unknown>;
  };
  catalog?: CatalogEntry[];
}

export function readFafa(path: string): FafaDoc {
  // A .fafa that links out of its folder is refused (SafePathError), never read:
  // a hostile repo's agent.fafa -> ~/.aws/credentials would otherwise be parsed
  // and quoted in an error. A link to a same-name file inside the folder is fine.
  return parse(readUtf8(resolveInside(dirname(path), basename(path)))) as FafaDoc;
}

/** Discover agent.fafa / .fafa (cwd, then one parent). */
export function findFafaFile(dir: string = process.cwd()): string | null {
  const candidates = ['agent.fafa', '.fafa'];
  for (const name of candidates) {
    const full = join(dir, name);
    if (existsSync(full)) {return full;}
  }
  const parent = dirname(dir);
  if (parent !== dir) {
    for (const name of candidates) {
      const full = join(parent, name);
      if (existsSync(full)) {return full;}
    }
  }
  return null;
}

/**
 * The A2A extension's own `params` — a superset of {@link fafContextBlock},
 * enriched with `.fafa`-specific identity that only makes sense for an agent
 * card (agentId, passport, the full FAF media-type family). Nests the base
 * block's `faf`/`mediaType` under `provenance` rather than flattening them,
 * per the extension's own shape (`§7` of the field mapping). Not shared with
 * the MCP Server Card / registry `_meta` block, which stay on the plain
 * {@link fafContextBlock} shape — {@link assertSameBlock} checks the two
 * agree on the underlying pointer, not on being byte-identical.
 */
function fafaExtensionParams(
  fafa: FafaDoc,
  faf: FafData,
  opts: ProjectCardsOptions,
): Record<string, unknown> {
  const block = fafContextBlock(faf, opts);
  const agent = fafa.agent ?? {};
  const params: Record<string, unknown> = {
    fafaSpecVersion: String(fafa.version ?? A2A_PROTOCOL_VERSION),
    mediaTypes: [...FAF_MEDIA_TYPES],
    provenance: { faf: block.faf, mediaType: block.mediaType },
    generated: block.generated,
  };
  if (agent.id) {params.agentId = agent.id;}
  const passport = homepageWellKnown(fafa, 'fafa');
  if (passport) {params.passport = passport;}
  return params;
}

/** Build the A2A Agent Card (JSON) from a .fafa + .faf: the core card
 *  ({@link projectA2ACard}) carrying FAF's context extension. */
export function buildA2ACard(
  fafa: FafaDoc,
  faf: FafData,
  opts: ProjectCardsOptions = {},
): ProjectedA2A {
  // Checked before the extension is built, so a card with no door fails the
  // same way it always has, before anything reads the .faf.
  if (a2aDoors(fafa, opts).length === 0) {
    throw new Error(
      "No A2A endpoint in .fafa (need endpoints[].protocol: a2a + location). Will not invent a door.",
    );
  }
  return projectA2ACard(fafa, {
    doorUrl: opts.doorUrl,
    extensions: [
      {
        uri: A2A_CONTEXT_URI,
        description: 'FAF passport and project DNA as typed parts',
        required: false,
        params: fafaExtensionParams(fafa, faf, opts),
      },
    ],
  });
}

/** @deprecated Use {@link buildA2ACard}. Removed in the next major. */
export const generateA2ACard = deprecate(
  buildA2ACard,
  'faf-cli: generateA2ACard is deprecated, use buildA2ACard',
  'FAF0003',
);

function catalogHost(fafa: FafaDoc): string {
  const homepage = fafa.agent?.homepage;
  if (!homepage) {return 'local';}
  try {
    return new URL(homepage).hostname.replace(/^www\./, '');
  } catch {
    return 'local';
  }
}

function catalogA2AUrl(fafa: FafaDoc, opts: ProjectCardsOptions): string {
  if (opts.a2aCardUrl) {return opts.a2aCardUrl;}
  const homepage = fafa.agent?.homepage;
  if (homepage) {
    try {
      return new URL('/.well-known/agent-card.json', homepage).href;
    } catch { /* fall through */ }
  }
  return '/.well-known/agent-card.json';
}

export function catalogEntriesFor(
  fafa: FafaDoc,
  faf: FafData,
  opts: ProjectCardsOptions = {},
): CatalogEntry[] {
  const host = catalogHost(fafa);
  const agent = fafa.agent ?? {};
  const slug = String(agent.name ?? 'agent');
  const now = opts.now ?? (faf.generated as string | undefined) ?? new Date().toISOString();
  const entries: CatalogEntry[] = [];

  if (a2aDoors(fafa, opts).length > 0) {
    entries.push({
      identifier: `urn:air:${host}:a2a:${slug}`,
      displayName: String(agent.displayName ?? agent.name ?? 'A2A Agent Card'),
      type: 'application/a2a-agent-card+json',
      description: 'A2A v1.0 Agent Card. Projected from .fafa.',
      url: catalogA2AUrl(fafa, opts),
      updatedAt: now,
    });
  }

  const fafaUrl = homepageWellKnown(fafa, 'fafa');
  if (fafaUrl) {
    entries.push({
      identifier: `urn:air:${host}:agent:${slug}`,
      displayName: String(agent.displayName ?? agent.name ?? '.fafa'),
      type: 'application/vnd.fafa+yaml',
      description: 'FAF agent passport (.fafa).',
      url: fafaUrl,
      updatedAt: now,
    });
  }

  return entries;
}

function homepageWellKnown(fafa: FafaDoc, name: string): string | undefined {
  const homepage = fafa.agent?.homepage;
  if (!homepage) {return undefined;}
  try {
    return new URL(`/.well-known/${name}`, homepage).href;
  } catch {
    return undefined;
  }
}

/** The row in `entries` that is faf's own row `row`: the one whose
 *  identifier is exactly faf's (`urn:air:<host>:a2a:<slug>` or
 *  `urn:air:<host>:agent:<slug>`). Never matched by type or URL — a row of
 *  yours for another agent, or another card of the same type, is not faf's. */
function catalogMatchIndex(entries: CatalogEntry[], row: CatalogEntry): number {
  return entries.findIndex((e) => e.identifier === row.identifier);
}

/** Upsert projector entries into an existing catalog. Leaves every other row
 *  alone: a row is faf's only when its identifier is exactly faf's (never by
 *  type or URL). On match, only url / type / updatedAt move — host copy
 *  (title, tags) stays; any other faf row is appended. */
export function upsertCatalog(existing: AiCatalog | undefined, incoming: CatalogEntry[]): AiCatalog {
  const base: AiCatalog = existing
    ? { ...existing, entries: [...(existing.entries ?? [])] }
    : { specVersion: '1.0', entries: [] };
  for (const row of incoming) {
    const i = catalogMatchIndex(base.entries, row);
    if (i >= 0) {
      base.entries[i] = {
        ...base.entries[i],
        url: row.url,
        type: row.type,
        ...(row.updatedAt ? { updatedAt: row.updatedAt } : {}),
      };
    } else {
      base.entries.push(row);
    }
  }
  return base;
}

/** The keys of a catalog row faf updates in place (its own row only). */
const CATALOG_ROW_UPDATES = ['url', 'type', 'updatedAt'] as const;

/**
 * {@link upsertCatalog} as a text edit of the catalog's JSON: faf's own rows
 * (identifier exactly faf's) get their url / type / updatedAt values changed
 * in place, faf's other rows are appended after the last entry, and every
 * other byte — your rows, their order and layout, other keys — stays. With no
 * text (no catalog yet) a new catalog is returned. Throws a JsonEditError,
 * changing nothing, when the catalog cannot be edited that way (not a JSON
 * object, `entries` not an array, faf's row there twice, …).
 */
export function upsertCatalogText(text: string | null, incoming: CatalogEntry[]): { text: string; changed: boolean } {
  if (text === null) {
    return { text: `${JSON.stringify({ specVersion: '1.0', entries: incoming }, null, 2)}\n`, changed: true };
  }
  return upsertJsonRows(text, 'entries', incoming as unknown as Record<string, unknown>[], {
    id: 'identifier',
    update: CATALOG_ROW_UPDATES,
  });
}

export function projectCards(input: {
  faf: FafData;
  fafa?: FafaDoc;
  targets?: CardTarget[];
  opts?: ProjectCardsOptions;
}): ProjectedCards {
  const opts = input.opts ?? {};
  const wanted = new Set(input.targets?.length ? input.targets : CARD_TARGETS);
  const block = fafContextBlock(input.faf, opts);
  const out: ProjectedCards = { block };

  if (wanted.has('mcp')) {
    out.mcp = buildServerCard(input.faf, opts);
  }
  if (wanted.has('registry')) {
    const title = registryTitle(input.faf);
    out.registry = {
      name: registryName(input.faf),
      ...(title ? { title } : {}),
      _meta: registryMeta(input.faf, opts),
    };
  }

  if (wanted.has('a2a') || wanted.has('catalog')) {
    if (!input.fafa) {
      if (input.targets?.includes('a2a') || input.targets?.includes('catalog')) {
        throw new Error('A2A/catalog require a .fafa (agent.fafa). Will not invent an agent.');
      }
    }
  }

  if (wanted.has('a2a') && input.fafa) {
    if (a2aDoors(input.fafa, opts).length === 0) {
      if (input.targets?.includes('a2a')) {
        throw new Error(
          "No A2A endpoint in .fafa (need endpoints[].protocol: a2a + location). Will not invent a door.",
        );
      }
    } else {
      out.a2a = buildA2ACard(input.fafa, input.faf, opts);
    }
  }

  if (wanted.has('catalog') && input.fafa) {
    out.catalog = catalogEntriesFor(input.fafa, input.faf, opts);
  }

  assertSameBlock(out);
  return out;
}

/**
 * Same underlying context on every emitted door. MCP and registry carry
 * {@link fafContextBlock} byte-identically. A2A's extension params are a
 * deliberate, richer superset (agentId, passport, mediaTypes — see
 * {@link fafaExtensionParams}), so the check there is narrower: its nested
 * `provenance.faf` / `provenance.mediaType` must match the same block's
 * `faf` / `mediaType` — the same pointer, not a byte-identical payload.
 */
export function assertSameBlock(cards: ProjectedCards): void {
  const want = JSON.stringify(cards.block);
  const got: string[] = [];
  if (cards.mcp) {
    const meta = cards.mcp._meta as { 'one.faf/context': unknown };
    got.push(JSON.stringify(meta['one.faf/context']));
  }
  if (cards.registry) {
    const pp = cards.registry._meta['io.modelcontextprotocol.registry/publisher-provided'] as {
      'one.faf/context': unknown;
    };
    got.push(JSON.stringify(pp['one.faf/context']));
  }
  for (const g of got) {
    if (g !== want) {
      throw new Error('context block drifted across card targets — one projector, one block');
    }
  }
  if (cards.a2a) {
    const params = cards.a2a.capabilities.extensions[0].params as {
      provenance?: { faf?: unknown; mediaType?: unknown };
    };
    const block = cards.block as { faf?: unknown; mediaType?: unknown };
    if (
      params.provenance?.faf !== block.faf ||
      params.provenance?.mediaType !== block.mediaType
    ) {
      throw new Error('A2A extension provenance drifted from the context block — one context, every door');
    }
  }
}

/** True when `bytes` are an A2A Agent Card faf wrote: JSON whose
 *  `capabilities.extensions` carry the FAF context extension
 *  ({@link A2A_CONTEXT_URI}), as every card faf has written does. */
export function hasA2ACardMark(bytes: Uint8Array): boolean {
  let j: unknown;
  try {
    j = JSON.parse(new TextDecoder().decode(bytes).replace(/^\uFEFF/, ''));
  } catch {
    return false;
  }
  const caps = typeof j === 'object' && j !== null ? (j as { capabilities?: { extensions?: unknown } }).capabilities : undefined;
  const exts = caps?.extensions;
  return Array.isArray(exts) && exts.some(e => typeof e === 'object' && e !== null && (e as { uri?: unknown }).uri === A2A_CONTEXT_URI);
}

/** True when `bytes` carry any of faf's card marks: the MCP Server Card's
 *  `_meta["one.faf/context"]`, a registry server.json's publisher-provided
 *  `one.faf/context`, or the A2A card's FAF context extension. */
export function hasFafCardMark(bytes: Uint8Array): boolean {
  return hasServerCardMark(bytes) || hasRegistryMark(bytes) || hasA2ACardMark(bytes);
}

/** Options for {@link writeJson}. */
export interface WriteJsonOptions {
  /** True when the bytes already at the path carry faf's older mark (a file
   *  faf wrote before render hashes). Default: one of faf's card marks
   *  ({@link hasFafCardMark}). */
  owns?: (existing: Buffer) => boolean;
  /** faf's mark in words, for the refusal. */
  mark?: string;
  /** Replace a file faf cannot prove it wrote anyway — the explicit overwrite (`--force`). */
  force?: boolean;
}

/** Write `value` as JSON (2-space, final newline) with faf's render hash at
 *  `_meta["one.faf/render"]` — atomically, and never through a link that
 *  leaves `root` (default: the file's own folder) or dangles. The folder is
 *  created when missing, never through a link that leaves `root`. A file
 *  already there is replaced only when it is byte for byte what faf last wrote
 *  (its render hash still fits); a file edited since, one without faf's mark,
 *  or one from before 7.13 that is not exactly this JSON is refused
 *  (SafePathError `not-owned`) and left byte for byte, unless `force`.
 *  Returns what it did: `created`, `updated`, or `unchanged` (the file
 *  already held exactly these bytes, and nothing was written). */
export function writeJson(path: string, value: unknown, root?: string, write: WriteJsonOptions = {}): RenderedResult {
  makeDirInside(root ?? dirname(path), dirname(path));
  return writeRendered(path, `${JSON.stringify(value, null, 2)}\n`, {
    root: root ?? dirname(path),
    format: 'json',
    hasMark: write.owns ?? hasFafCardMark,
    mark: write.mark ?? 'FAF context-block (a faf card mark)',
    force: write.force,
  }).result;
}

/** True when `bytes` are JSON laid out exactly as faf writes it (2-space
 *  JSON and a final newline), so re-writing it loses nothing: no hand
 *  formatting, no repeated key, no number JSON cannot hold exactly. */
export function isFafJsonLayout(bytes: Uint8Array): boolean {
  const text = new TextDecoder().decode(bytes);
  try {
    return `${JSON.stringify(JSON.parse(text), null, 2)}\n` === text;
  } catch {
    return false;
  }
}

export function parseTargets(raw?: string): CardTarget[] | undefined {
  if (!raw) {return undefined;}
  const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const bad = parts.filter((p) => !CARD_TARGETS.includes(p as CardTarget));
  if (bad.length) {
    throw new Error(`unknown card target: ${bad.join(', ')} (use ${CARD_TARGETS.join(',')})`);
  }
  return parts as CardTarget[];
}
