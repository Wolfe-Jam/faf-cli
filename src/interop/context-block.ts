/**
 * FAF's context block — what BEST adds to a card. Pure (no Node built-ins), so
 * `faf cards` and the browser-safe pack projector add the same block.
 *
 * The cards ladder: an agent.fafa gives the plain cards (BETTER); a project.faf,
 * resident and used, adds this block to each of them (BEST) — the A2A card's
 * context extension, the Server Card's `_meta["one.faf/context"]`, the registry
 * `server.json`'s publisher-provided `_meta`.
 */
import type { FafData } from '../core/types.js';

/** project.faf's IANA media type. */
export const FAF_MEDIA_TYPE = 'application/vnd.faf+yaml';

/** A2A extension URI — dereference, not the MCP `_meta` key `one.faf/context`. */
export const A2A_CONTEXT_URI = 'https://faf.one/ext/context/v1';

export const REGISTRY_PUBLISHER_KEY = 'io.modelcontextprotocol.registry/publisher-provided';
const REGISTRY_META_CAP = 4096; // official registry cap on publisher-provided JSON (bytes)

export interface ContextBlockOptions {
  /** Pointer to the .faf context (default: ./project.faf). Pass an absolute URL
   *  for a remote/served card (e.g. faf-server-card-ref at context.faf.one). */
  fafPointer?: string;
  /** Optional "verify the score here" URL — makes verify-don't-trust actionable
   *  (faf-server-card-ref uses https://faf.one). Omitted from the block if unset. */
  scoreEndpoint?: string;
  /** Override timestamp (tests); otherwise .faf `generated`, else now. */
  now?: string;
}

/**
 * The canonical FAF context-block — the value of `_meta["one.faf/context"]`,
 * identical across every surface (Server Card, registry `server.json`, `.fafa`):
 * one context, every door. Honest-first: no score baked (it would go stale on
 * disk); it points to the .faf and asserts the score is deterministic.
 */
export function fafContextBlock(
  data: FafData,
  opts: ContextBlockOptions = {},
): Record<string, unknown> {
  return {
    faf: opts.fafPointer ?? './project.faf',
    mediaType: FAF_MEDIA_TYPE,
    iana: `https://www.iana.org/assignments/media-types/${FAF_MEDIA_TYPE}`,
    deterministic: true,
    ...(opts.scoreEndpoint ? { scoreEndpoint: opts.scoreEndpoint } : {}),
    generated:
      (data.generated as string | undefined) ?? opts.now ?? new Date().toISOString(),
  };
}

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
  opts: ContextBlockOptions = {},
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
