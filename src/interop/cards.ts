import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';
import { deprecate } from 'node:util';
import { parse } from 'yaml';
import type { FafData } from '../core/types.js';
import { makeDirInside, readUtf8, resolveInside } from '../core/safe-write.js';
import { writeRendered, type RenderedResult } from '../core/render-hash.js';
import { editJsonText, upsertJsonRows } from '../core/json-edit.js';
import {
  a2aDoors,
  ardHints,
  catalogHost,
  catalogRows,
  fafaContextExtension,
  hasRegistryEntry,
  mcpRemotes,
  projectA2ACard,
  projectServerCard,
  registryIdentity,
  type CatalogHost,
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
import { A2A_CONTEXT_URI } from './context-block.js';

export { A2A_CONTEXT_URI } from './context-block.js';
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

export type CardTarget = 'a2a' | 'mcp' | 'registry' | 'catalog' | 'ard';
export const CARD_TARGETS: CardTarget[] = ['a2a', 'mcp', 'registry', 'catalog', 'ard'];

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
  /** ARD's search hints — on the ARD manifest's rows only. */
  tags?: string[];
  representativeQueries?: string[];
}

export interface AiCatalog {
  specVersion: string;
  host?: Record<string, unknown>;
  entries: CatalogEntry[];
  [key: string]: unknown;
}

export interface ProjectedCards {
  /** faf's context block — only when a project.faf was given (BEST). */
  block?: Record<string, unknown>;
  a2a?: ProjectedA2A;
  mcp?: Record<string, unknown>;
  registry?: {
    name: string;
    title?: string;
    /** FAF's context block (BEST); absent from a plain registry identity (BETTER). */
    _meta?: Record<string, unknown>;
  };
  catalog?: CatalogEntry[];
  /** The same rows, carrying ARD's search hints — the ARD manifest. */
  ard?: CatalogEntry[];
  /** Who publishes the catalog — written only into a catalog that names
   *  nobody yet. An existing `host` is the site's, and is never touched. */
  catalogHost?: CatalogHost;
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

/** Build the A2A Agent Card (JSON) from a .fafa: the core card
 *  ({@link projectA2ACard}). With a project.faf (BEST) it carries FAF's
 *  context extension; with none (BETTER) it is the plain A2A card — the
 *  .fafa is its source, and nothing on it points at a project.faf. */
export function buildA2ACard(
  fafa: FafaDoc,
  faf?: FafData,
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
    extensions: faf ? [fafaContextExtension(fafa, faf, opts)] : [],
  });
}

/** @deprecated Use {@link buildA2ACard}. Removed in the next major. */
export const generateA2ACard = deprecate(
  buildA2ACard,
  'faf-cli: generateA2ACard is deprecated, use buildA2ACard',
  'FAF0003',
);

/**
 * The catalog rows for this agent — the pack projector's own
 * ({@link catalogRows}), so `faf cards` and the pack list the same rows: the
 * A2A card (when the `.fafa` names an A2A door), the Server Card (when it names
 * a remote MCP URL) and the `.fafa` itself, keyed
 * `urn:air:{publisher}:{namespace}:{name}`, where the publisher is the domain
 * the `.fafa` *declares* (`agent.id`'s urn:air, `metadata.cards.domain`, else
 * the homepage host) and the name is the handle.
 *
 * Throws, rather than inventing either half, when the `.fafa` names no domain:
 * an identifier is a catalog's primary key, and `urn:air:local:…` published to
 * the world is worse than a refusal a line of YAML fixes.
 */
export function catalogEntriesFor(
  fafa: FafaDoc,
  faf: FafData = {},
  opts: ProjectCardsOptions = {},
): CatalogEntry[] {
  return catalogRows(fafa, ['a2a', 'server_card'], {
    now: opts.now ?? (faf.generated as string | undefined) ?? new Date().toISOString(),
    a2aCardUrl: opts.a2aCardUrl,
    doorUrl: opts.doorUrl,
  });
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
 *  (title, tags) stays; any other faf row is appended. `host` names the
 *  publisher on a catalog that names none — an existing one is the site's own
 *  and stays as it is. */
export function upsertCatalog(
  existing: AiCatalog | undefined,
  incoming: CatalogEntry[],
  host?: CatalogHost,
): AiCatalog {
  const opened: AiCatalog = existing
    ? { ...existing, entries: [...(existing.entries ?? [])] }
    : { specVersion: '1.0', entries: [] };
  // A host the catalog already names is the site's own — never overwritten.
  // A missing one is added where the spec shows it: straight after specVersion.
  const base: AiCatalog =
    host && opened.host === undefined
      ? (({ specVersion, ...rest }) => ({ specVersion, host: { ...host }, ...rest }))(opened)
      : opened;
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

/** faf's rows as they will be written over `text`'s: a row whose url and type
 *  are unchanged keeps the updatedAt it has (a run that changes nothing writes
 *  nothing); a row whose url or type changed is stamped `changedAt`, so a
 *  reader that refreshes on updatedAt sees the change. New rows keep their own.
 *  `text` that is not JSON is left to upsertJsonRows, which reports it. */
function restamp(text: string, incoming: CatalogEntry[], changedAt: string): CatalogEntry[] {
  let existing: CatalogEntry[] = [];
  try {
    const entries = (JSON.parse(text.replace(/^\uFEFF/, '')) as { entries?: unknown }).entries;
    existing = Array.isArray(entries) ? (entries as CatalogEntry[]) : [];
  } catch {
    return incoming;
  }
  return incoming.map((row) => {
    const old = existing.find((e) => e && typeof e === 'object' && e.identifier === row.identifier);
    if (!old) {return row;}
    const same = old.url === row.url && old.type === row.type;
    return { ...row, updatedAt: same ? (old.updatedAt ?? row.updatedAt) : changedAt };
  });
}

/**
 * {@link upsertCatalog} as a text edit of the catalog's JSON: faf's own rows
 * (identifier exactly faf's) get their url / type / updatedAt values changed
 * in place, faf's other rows are appended after the last entry, and every
 * other byte — your rows, their order and layout, other keys — stays. With no
 * text (no catalog yet) a new catalog is returned. `host` names the publisher
 * (AI Catalog Level 2 "discoverable") and is added, after `specVersion`, only
 * to a catalog that names none: a `host` already in the file is the site's own
 * and is left byte for byte. Throws a JsonEditError, changing nothing, when
 * the catalog cannot be edited that way (not a JSON object, `entries` not an
 * array, faf's row there twice, …).
 */
export function upsertCatalogText(
  text: string | null,
  incoming: CatalogEntry[],
  host?: CatalogHost,
  changedAt: string = new Date().toISOString(),
): { text: string; changed: boolean } {
  if (text === null) {
    const fresh = { specVersion: '1.0', ...(host ? { host } : {}), entries: incoming };
    return { text: `${JSON.stringify(fresh, null, 2)}\n`, changed: true };
  }
  const rows = upsertJsonRows(text, 'entries', restamp(text, incoming, changedAt) as unknown as Record<string, unknown>[], {
    id: 'identifier',
    update: CATALOG_ROW_UPDATES,
  });
  if (!host || namesHost(rows.text)) {return rows;}
  const named = editJsonText(rows.text, { host }, { '': { host: ['specVersion'] } });
  return { text: named.text, changed: rows.changed || named.changed };
}

/** True when the catalog JSON already names a `host` — any value, including
 *  null or one the spec would refuse. Whatever is there is the site's. */
function namesHost(text: string): boolean {
  try {
    const doc = JSON.parse(text) as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(doc, 'host');
  } catch {
    return true; // Unparseable: add nothing.
  }
}

/** The cards an agent.fafa gives with no project.faf (BETTER): the A2A card
 *  (when it names an A2A door), the MCP Server Card (when it names a remote MCP
 *  URL), the registry server.json (a remote or a package), the AI Catalog, ARD. */
export function betterTargets(fafa: FafaDoc, opts: ProjectCardsOptions = {}): CardTarget[] {
  return [
    ...(a2aDoors(fafa, opts).length > 0 ? ['a2a' as const] : []),
    ...(mcpRemotes(fafa).length > 0 ? ['mcp' as const] : []),
    ...(hasRegistryEntry(fafa) ? ['registry' as const] : []),
    'catalog',
    'ard',
  ];
}

/**
 * Project the cards. The ladder — BETTER is the .fafa, BEST is project.faf:
 * an agent.fafa alone gives the plain cards ({@link betterTargets}); a
 * project.faf, resident and used, adds FAF's context block to each (the A2A
 * card's extension, the Server Card's and server.json's `_meta`). A card's
 * identity comes from the .fafa at both rungs. With a project.faf and no MCP
 * endpoint in the .fafa (an MCP server's own repo), the Server Card and the
 * registry identity come from project.faf, as `faf server-card` writes them.
 */
export function projectCards(input: {
  /** project.faf — absent means BETTER. */
  faf?: FafData;
  fafa?: FafaDoc;
  targets?: CardTarget[];
  opts?: ProjectCardsOptions;
}): ProjectedCards {
  const opts = input.opts ?? {};
  const faf = input.faf;
  const fafa = input.fafa;
  const all = faf ? CARD_TARGETS : fafa ? betterTargets(fafa, opts) : [];
  const wanted = new Set(input.targets?.length ? input.targets : all);
  const out: ProjectedCards = {};
  if (faf) {out.block = fafContextBlock(faf, opts);}

  if (wanted.has('mcp')) {
    if (fafa && mcpRemotes(fafa).length > 0) {
      out.mcp = projectServerCard(fafa, faf, opts);
    } else if (faf) {
      out.mcp = buildServerCard(faf, opts);
    } else {
      throw new Error('A Server Card needs an MCP endpoint at an http(s) URL in the .fafa, or a project.faf.');
    }
  }
  if (wanted.has('registry')) {
    if (fafa && hasRegistryEntry(fafa)) {
      out.registry = { ...registryIdentity(fafa), ...(faf ? { _meta: registryMeta(faf, opts) } : {}) };
    } else if (faf) {
      const title = registryTitle(faf);
      out.registry = {
        name: registryName(faf),
        ...(title ? { title } : {}),
        _meta: registryMeta(faf, opts),
      };
    } else {
      throw new Error('A registry entry needs a package or a remote MCP URL in the .fafa, or a project.faf.');
    }
  }

  if (wanted.has('a2a') || wanted.has('catalog') || wanted.has('ard')) {
    if (!input.fafa) {
      if (input.targets?.some((t) => t === 'a2a' || t === 'catalog' || t === 'ard')) {
        throw new Error('A2A/catalog/ARD require a .fafa (agent.fafa). Will not invent an agent.');
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
      out.a2a = buildA2ACard(input.fafa, faf, opts);
    }
  }

  if ((wanted.has('catalog') || wanted.has('ard')) && input.fafa) {
    const rows = catalogEntriesFor(input.fafa, faf, opts);
    if (wanted.has('catalog')) {out.catalog = rows;}
    if (wanted.has('ard')) {
      // ARD builds on ai-catalog: the same rows, carrying the hints its
      // semantic index is built from.
      const hints = ardHints(input.fafa);
      out.ard = rows.map((r) => ({ ...r, ...hints }));
    }
    const host = catalogHost(input.fafa);
    if (host) {out.catalogHost = host;}
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
  // BETTER: no project.faf, so no block on any card.
  if (!cards.block) {return;}
  const want = JSON.stringify(cards.block);
  const got: string[] = [];
  if (cards.mcp) {
    const meta = cards.mcp._meta as { 'one.faf/context': unknown };
    got.push(JSON.stringify(meta['one.faf/context']));
  }
  if (cards.registry?._meta) {
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
    const ext = cards.a2a.capabilities.extensions?.find((e) => e.uri === A2A_CONTEXT_URI);
    if (!ext) {throw new Error('A2A card has no FAF context extension, but a project.faf was given');}
    const params = ext.params as {
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
