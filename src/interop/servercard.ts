import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';

/**
 * Generate an MCP Server Card (SEP-2127) from a .faf.
 *
 * The card is a published discovery manifest. By design it carries the FAF
 * context-block in `_meta["one.faf/context"]` — so every Server Card produced
 * through FAF ships FAF context by default. The block is byte-identical to the
 * one in faf-server-card-ref and to `.fafa` provenance: one context, every door.
 *
 * Honest-first: no score is baked (it would go stale on disk); the block points
 * to the .faf and asserts the score is deterministic. The card omits `remotes`
 * unless a deployment URL is supplied — it must not claim an endpoint it lacks.
 */

export interface ServerCardOptions {
  /** Pointer to the .faf context (default: ./project.faf). */
  fafPointer?: string;
  /** Optional live endpoint; adds a streamable-http remote when set. */
  remoteUrl?: string;
  /** Override timestamp (tests); otherwise .faf `generated`, else now. */
  now?: string;
}

const MEDIA_TYPE = 'application/vnd.faf+yaml';
const SCHEMA = 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json';
const NAME_RE = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;

/** Derive a reverse-DNS `namespace/name` for the card. */
function serverName(data: FafData): string {
  const raw = String(data.project?.name ?? 'project').trim();
  if (raw.includes('/') && NAME_RE.test(raw)) return raw; // already namespaced

  const homepage = (data.project?.homepage ??
    data.project?.website ??
    data.project?.url) as string | undefined;
  let ns = 'local';
  if (homepage) {
    try {
      const host = new URL(homepage).hostname.replace(/^www\./, '');
      ns = host.split('.').reverse().join('.'); // faf.one -> one.faf
    } catch {
      /* keep 'local' */
    }
  }
  const name = raw.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '') || 'project';
  return `${ns}/${name}`;
}

/** Server Card `description` is capped at 100 chars; never empty. */
function clampDescription(data: FafData): string {
  const src = String(
    data.project?.goal ?? data.context ?? data.project?.name ?? 'MCP server',
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (!src) return 'MCP server';
  return src.length <= 100 ? src : src.slice(0, 97).trimEnd() + '...';
}

/**
 * The canonical FAF context-block — the value of `_meta["one.faf/context"]`,
 * identical across every surface (Server Card, registry `server.json`, `.fafa`):
 * one context, every door. Honest-first: no score baked (it would go stale on
 * disk); it points to the .faf and asserts the score is deterministic.
 */
export function fafContextBlock(
  data: FafData,
  opts: ServerCardOptions = {},
): Record<string, unknown> {
  return {
    faf: opts.fafPointer ?? './project.faf',
    mediaType: MEDIA_TYPE,
    iana: `https://www.iana.org/assignments/media-types/${MEDIA_TYPE}`,
    deterministic: true,
    generated:
      (data.generated as string | undefined) ?? opts.now ?? new Date().toISOString(),
  };
}

/** Build the Server Card object from .faf data. */
export function generateServerCard(
  data: FafData,
  opts: ServerCardOptions = {},
): Record<string, unknown> {
  const card: Record<string, unknown> = {
    $schema: SCHEMA,
    name: serverName(data),
    version: String(data.project?.version ?? '0.1.0'),
    description: clampDescription(data),
  };

  const title = data.project?.name as string | undefined;
  if (title && title.length <= 100) card.title = title;

  const homepage = (data.project?.homepage ??
    data.project?.website ??
    data.project?.url) as string | undefined;
  if (homepage) card.websiteUrl = homepage;

  if (opts.remoteUrl) {
    card.remotes = [{ type: 'streamable-http', url: opts.remoteUrl }];
  }

  // The canonical FAF context-block — parity with faf-server-card-ref + .fafa.
  card._meta = { 'one.faf/context': fafContextBlock(data, opts) };

  return card;
}

export const REGISTRY_PUBLISHER_KEY = 'io.modelcontextprotocol.registry/publisher-provided';
const REGISTRY_META_CAP = 4096; // official registry cap on publisher-provided JSON (bytes)

/**
 * Build the `_meta` for an MCP Registry `server.json`.
 *
 * The SAME canonical context-block as the Server Card, but nested under
 * `io.modelcontextprotocol.registry/publisher-provided` — the ONLY `_meta` key
 * the official registry preserves on publish. Top-level keys (the way the card
 * carries `one.faf/context`) are silently dropped by the registry. Throws if the
 * block exceeds the registry's 4KB cap. Merge the result into an existing
 * `server.json` `_meta`; don't regenerate the manifest (packages/mcpb are tuned).
 */
export function registryMeta(
  data: FafData,
  opts: ServerCardOptions = {},
): Record<string, unknown> {
  const provided = { 'one.faf/context': fafContextBlock(data, opts) };
  const bytes = new TextEncoder().encode(JSON.stringify(provided)).length;
  if (bytes > REGISTRY_META_CAP) {
    throw new Error(
      `publisher-provided _meta is ${bytes}B — exceeds the registry ${REGISTRY_META_CAP}B cap`,
    );
  }
  return { [REGISTRY_PUBLISHER_KEY]: provided };
}

/** The canonical reverse-DNS registry name, e.g. `one.faf/claude-faf-mcp`. */
export function registryName(data: FafData): string {
  return serverName(data);
}

/** Write the Server Card to a `server-card` file. Returns the path.
 *  Per experimental-ext-server-card#22 the reserved location is
 *  `<streamable-http-url>/server-card` (no longer `.well-known`); serve the
 *  emitted file there as `application/mcp-server-card+json`. */
export function writeServerCard(
  dir: string,
  data: FafData,
  opts: ServerCardOptions = {},
): string {
  const card = generateServerCard(data, opts);
  const out = join(dir, 'server-card');
  writeFileSync(out, JSON.stringify(card, null, 2) + '\n', 'utf-8');
  return out;
}
