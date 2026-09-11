import { join } from 'path';
import { deprecate } from 'node:util';
import type { FafData } from '../core/types.js';
import { safeReplaceOwned } from '../core/safe-write.js';
import { editJsonText } from '../core/json-edit.js';

/**
 * Build an MCP Server Card (SEP-2127) from a .faf.
 *
 * The card is a published discovery manifest. By design it carries the FAF
 * context-block in `_meta["one.faf/context"]` — so every Server Card produced
 * through FAF ships FAF context by default. This emitter is the SINGLE SOURCE of
 * the block — faf-server-card-ref and `.fafa` provenance compose it (never
 * hand-roll), so every surface is byte-identical by construction: one context,
 * one source, every door.
 *
 * Honest-first: no score is baked (it would go stale on disk); the block points
 * to the .faf and asserts the score is deterministic. The card omits `remotes`
 * unless a deployment URL is supplied — it must not claim an endpoint it lacks.
 */

export interface ServerCardOptions {
  /** Pointer to the .faf context (default: ./project.faf). Pass an absolute URL
   *  for a remote/served card (e.g. faf-server-card-ref at context.faf.one). */
  fafPointer?: string;
  /** Optional live endpoint; adds a streamable-http remote when set. */
  remoteUrl?: string;
  /** Optional "verify the score here" URL — makes verify-don't-trust actionable
   *  (faf-server-card-ref uses https://faf.one). Omitted from the block if unset. */
  scoreEndpoint?: string;
  /** Override timestamp (tests); otherwise .faf `generated`, else now. */
  now?: string;
}

const MEDIA_TYPE = 'application/vnd.faf+yaml';
const SCHEMA = 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json';
const NAME_RE = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;

/** Derive a reverse-DNS `namespace/name` for the card. */
function serverName(data: FafData): string {
  const raw = String(data.project?.name ?? 'project').trim();
  if (raw.includes('/') && NAME_RE.test(raw)) {return raw;} // already namespaced

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
  if (!src) {return 'MCP server';}
  return src.length <= 100 ? src : `${src.slice(0, 97).trimEnd()  }...`;
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
    ...(opts.scoreEndpoint ? { scoreEndpoint: opts.scoreEndpoint } : {}),
    generated:
      (data.generated as string | undefined) ?? opts.now ?? new Date().toISOString(),
  };
}

/** Build the Server Card object from .faf data. */
export function buildServerCard(
  data: FafData,
  opts: ServerCardOptions = {},
): Record<string, unknown> {
  const card: Record<string, unknown> = {
    $schema: SCHEMA,
    name: serverName(data),
    version: String(data.project?.version ?? '0.1.0'),
    description: clampDescription(data),
  };

  const title = registryTitle(data) ?? (data.project?.name as string | undefined);
  if (title && title.length <= 100) {card.title = title;}

  const homepage = (data.project?.homepage ??
    data.project?.website ??
    data.project?.url) as string | undefined;
  if (homepage) {card.websiteUrl = homepage;}

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

/** The canonical reverse-DNS registry name, e.g. `one.faf/claude-faf-mcp`.
 *
 *  HOMEPAGE REQUIRED: the namespace is derived from `project.homepage`'s host
 *  (faf.one -> one.faf). With no homepage/website/url the namespace falls back
 *  to `local/<name>`. This can't silently ship — the migration is guarded
 *  (`rewrite-server-json.ts` refuses any name that isn't `one.faf/*`) — but set
 *  `homepage: https://faf.one` in the .faf to get the correct `one.faf/<name>`. */
export function registryName(data: FafData): string {
  return serverName(data);
}

/** The display title for a registry `server.json` — the human-readable card name
 *  (e.g. "Claude FAF"), sourced from `project.title` in the .faf. This is the
 *  SINGLE SOURCE of the title across the fleet: JS emitters import it, and the
 *  `faf server-card` CLI uses it so Python/Rust repos compose the identical
 *  value (compose-not-fork). Distinct from `registryName` (the reverse-DNS id).
 *  Returns undefined when unset or >100 chars (the registry cap) so the field is
 *  omitted rather than shipped invalid — GitHub's registry then derives a name
 *  from the namespace, so set `project.title` to control the display. */
export function registryTitle(data: FafData): string | undefined {
  const raw = (data.project as { title?: unknown } | undefined)?.title;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t && t.length <= 100) {return t;}
  }
  return undefined;
}

/** The parsed JSON in `bytes`, or undefined when they are not JSON. */
function jsonOf(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes).replace(/^\uFEFF/, ''));
  } catch {
    return undefined;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** True when `bytes` are a Server Card faf wrote: JSON carrying the FAF
 *  context-block at `_meta["one.faf/context"]`, as every card faf has
 *  written does. */
export function hasServerCardMark(bytes: Uint8Array): boolean {
  const j = jsonOf(bytes);
  return isObj(j) && isObj(j._meta) && isObj(j._meta['one.faf/context']);
}

/** True when `bytes` are a registry `server.json` carrying faf's identity:
 *  `_meta[REGISTRY_PUBLISHER_KEY]["one.faf/context"]`. */
export function hasRegistryMark(bytes: Uint8Array): boolean {
  const j = jsonOf(bytes);
  const provided = isObj(j) && isObj(j._meta) ? j._meta[REGISTRY_PUBLISHER_KEY] : undefined;
  return isObj(provided) && isObj(provided['one.faf/context']);
}

/** Options for the card writers ({@link writeServerCard}, `faf cards`). */
export interface CardWriteOptions {
  /** Replace a file already there even when it has no faf mark — the explicit
   *  overwrite (`--force`). Default: such a file is refused and left as it is. */
  force?: boolean;
}

/** Write the Server Card to a `server-card` file. Returns the path.
 *  Per experimental-ext-server-card#22 the reserved location is
 *  `<streamable-http-url>/server-card` (no longer `.well-known`); serve the
 *  emitted file there as `application/mcp-server-card+json`.
 *
 *  A `server-card` already there is replaced only when faf wrote it (it
 *  carries `_meta["one.faf/context"]`); a hand-written card is refused
 *  (SafePathError `not-owned`) and left byte for byte, unless `force`. The
 *  write is atomic and never goes through a link that leaves `dir` or dangles. */
export function writeServerCard(
  dir: string,
  data: FafData,
  opts: ServerCardOptions = {},
  write: CardWriteOptions = {},
): string {
  const card = buildServerCard(data, opts);
  const out = join(dir, 'server-card');
  safeReplaceOwned(out, `${JSON.stringify(card, null, 2)  }\n`, {
    root: dir,
    owns: hasServerCardMark,
    mark: 'FAF context-block (`_meta["one.faf/context"]`)',
    force: write.force,
  });
  return out;
}

/** The identity faf owns in a registry `server.json`. */
export interface ServerJsonIdentity {
  /** The reverse-DNS registry name ({@link registryName}). */
  name: string;
  /** The display title ({@link registryTitle}); when undefined the file's own title is kept. */
  title?: string;
  /** A version to set (`--set-version`); when undefined the file's own is kept. */
  version?: string;
  /** The `_meta` faf writes ({@link registryMeta}). */
  meta: Record<string, unknown>;
}

/**
 * Put faf's identity into the text of a registry `server.json`, changing
 * nothing else: the `name` value, the `title` (only when faf has one — the
 * file's own title is kept otherwise), a `version` asked for, and the keys of
 * faf's context-block under `_meta[REGISTRY_PUBLISHER_KEY]["one.faf/context"]`.
 * Each is a text edit of that one value, or the key added when missing; no
 * field is deleted, and every other byte — key order, a 20-digit number, an
 * array on one line, spacing, CRLF — stays as it was. Throws a JsonEditError,
 * changing nothing, when the text cannot be edited that way (not valid JSON,
 * not an object, a key repeated on the way, a `_meta` that is not an object).
 */
export function patchServerJson(text: string, identity: ServerJsonIdentity): { text: string; changed: boolean } {
  const patch: Record<string, unknown> = {
    name: identity.name,
    title: identity.title,
    version: identity.version,
    _meta: identity.meta,
  };
  return editJsonText(text, patch, {
    '': { name: ['$schema'], title: ['name'], version: ['description', 'title', 'name'] },
  });
}

/** @deprecated Use {@link buildServerCard}. Removed in the next major. */
export const generateServerCard = deprecate(
  buildServerCard,
  'faf-cli: generateServerCard is deprecated, use buildServerCard',
  'FAF0002',
);
