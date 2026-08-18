import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { parse } from 'yaml';
import type { FafData } from '../core/types.js';
import {
  fafContextBlock,
  generateServerCard,
  registryMeta,
  registryName,
  registryTitle,
  type ServerCardOptions,
} from './servercard.js';

/** A2A extension URI — dereference, not the MCP `_meta` key `one.faf/context`. */
export const A2A_CONTEXT_URI = 'https://faf.one/context';
export const A2A_PROTOCOL_BINDING = 'JSONRPC';
export const A2A_PROTOCOL_VERSION = '1.0';

export type CardTarget = 'a2a' | 'mcp' | 'registry' | 'catalog';
export const CARD_TARGETS: CardTarget[] = ['a2a', 'mcp', 'registry', 'catalog'];

export interface FafaAgent {
  name?: string;
  displayName?: string;
  id?: string;
  vendor?: string;
  version?: string;
  description?: string;
  homepage?: string;
}

export interface FafaCapability {
  name?: string;
  description?: string;
  tags?: unknown;
}

export interface FafaEndpoint {
  protocol?: string;
  transport?: string;
  location?: string;
  version?: string;
}

export interface FafaDoc {
  agent?: FafaAgent;
  capabilities?: FafaCapability[];
  endpoints?: FafaEndpoint[];
  provenance?: Record<string, unknown>;
  metadata?: { persona?: string };
  [key: string]: unknown;
}

export interface ProjectCardsOptions extends ServerCardOptions {
  /** Public URL of the emitted A2A card (catalog row). */
  a2aCardUrl?: string;
}

export interface ProjectedA2A {
  name: string;
  description: string;
  supportedInterfaces: Array<{
    url: string;
    protocolBinding: string;
    protocolVersion: string;
  }>;
  provider: { organization: string; url: string };
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
    extensions: Array<{
      uri: string;
      description: string;
      required: boolean;
      params: Record<string, unknown>;
    }>;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
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
  return parse(readFileSync(path, 'utf-8')) as FafaDoc;
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

export function a2aEndpoints(fafa: FafaDoc): FafaEndpoint[] {
  return (fafa.endpoints ?? []).filter(
    (e) => String(e.protocol ?? '').toLowerCase() === 'a2a' && e.location,
  );
}

export function generateA2ACard(
  fafa: FafaDoc,
  faf: FafData,
  opts: ProjectCardsOptions = {},
): ProjectedA2A {
  const agent = fafa.agent ?? {};
  const doors = a2aEndpoints(fafa);
  if (doors.length === 0) {
    throw new Error(
      "No A2A endpoint in .fafa (need endpoints[].protocol: a2a + location). Will not invent a door.",
    );
  }
  const name = String(agent.displayName ?? fafa.metadata?.persona ?? agent.name ?? '').trim();
  const description = String(agent.description ?? '').trim();
  const version = String(agent.version ?? '').trim();
  const organization = String(agent.vendor ?? '').trim();
  const homepage = String(agent.homepage ?? '').trim();
  if (!name || !description || !version || !organization || !homepage) {
    throw new Error(
      'A2A card needs agent.displayName|name, description, version, vendor, homepage in .fafa',
    );
  }

  const block = fafContextBlock(faf, opts);
  const skills = (fafa.capabilities ?? []).map((c) => {
    const id = String(c.name ?? '').trim();
    if (!id) {throw new Error('A2A skill missing capabilities[].name');}
    const tags = Array.isArray(c.tags) ? c.tags.map(String) : [];
    return {
      id,
      name: id,
      description: String(c.description ?? '').trim() || id,
      tags,
    };
  });

  return {
    name,
    description,
    supportedInterfaces: doors.map((e) => ({
      url: String(e.location),
      protocolBinding: A2A_PROTOCOL_BINDING,
      protocolVersion: String(e.version ?? A2A_PROTOCOL_VERSION),
    })),
    provider: { organization, url: homepage },
    version,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
      extensions: [
        {
          uri: A2A_CONTEXT_URI,
          description:
            'FAF context provenance — the durable context block (one context, every door).',
          required: false,
          params: block,
        },
      ],
    },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills,
  };
}

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

  if (a2aEndpoints(fafa).length > 0) {
    entries.push({
      identifier: `urn:air:${host}:a2a:${slug}`,
      displayName: String(agent.displayName ?? agent.name ?? 'A2A Agent Card'),
      type: 'application/json',
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

function catalogMatchIndex(entries: CatalogEntry[], row: CatalogEntry): number {
  const exact = entries.findIndex((e) => e.identifier === row.identifier);
  if (exact >= 0) {return exact;}
  if (row.type === 'application/json' || row.identifier.includes(':a2a:')) {
    return entries.findIndex(
      (e) =>
        e.identifier.includes(':a2a:') ||
        String(e.url ?? '').includes('agent-card.json'),
    );
  }
  if (row.type === 'application/vnd.fafa+yaml') {
    return entries.findIndex((e) => e.type === 'application/vnd.fafa+yaml');
  }
  return -1;
}

/** Upsert projector entries into an existing catalog. Leaves unknown rows alone.
 *  On match, only url / type / updatedAt move — host copy (title, tags) stays. */
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
    out.mcp = generateServerCard(input.faf, opts);
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
    if (a2aEndpoints(input.fafa).length === 0) {
      if (input.targets?.includes('a2a')) {
        throw new Error(
          "No A2A endpoint in .fafa (need endpoints[].protocol: a2a + location). Will not invent a door.",
        );
      }
    } else {
      out.a2a = generateA2ACard(input.fafa, input.faf, opts);
    }
  }

  if (wanted.has('catalog') && input.fafa) {
    out.catalog = catalogEntriesFor(input.fafa, input.faf, opts);
  }

  assertSameBlock(out);
  return out;
}

/** Byte-identical context block on every emitted door. */
export function assertSameBlock(cards: ProjectedCards): void {
  const want = JSON.stringify(cards.block);
  const got: string[] = [];
  if (cards.a2a) {
    got.push(JSON.stringify(cards.a2a.capabilities.extensions[0].params));
  }
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
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
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
