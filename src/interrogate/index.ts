/**
 * Repo interrogation orchestrator — runs all extractors and merges results.
 *
 * Order of precedence: extractors that run first WIN (their non-empty values
 * are kept; later extractors fill only empties). README is highest-precedence
 * because its prose is most likely to be hand-curated; manifest fields
 * (Cargo.toml description, package.json description) are fallbacks.
 *
 * The orchestrator never overwrites with empty — only fills empties.
 */

import type { ExtractedContext } from './types.js';
import { interrogateReadme } from './readme.js';
import { interrogateCargo } from './cargo.js';

export type { ExtractedContext } from './types.js';
export { interrogateReadme } from './readme.js';
export { interrogateCargo } from './cargo.js';

/** Merge `b` into `a` — only fill empties in `a`, never overwrite. */
function mergeFillEmpty(a: ExtractedContext, b: ExtractedContext): ExtractedContext {
  const out: ExtractedContext = {
    project: { ...(b.project ?? {}), ...(a.project ?? {}) },
    human_context: { ...(b.human_context ?? {}), ...(a.human_context ?? {}) },
  };
  // Strip empties for clean equality semantics
  if (out.project && Object.keys(out.project).length === 0) {delete out.project;}
  if (out.human_context && Object.keys(out.human_context).length === 0) {delete out.human_context;}
  return out;
}

/** Run all repo interrogators and return merged context. */
export function interrogateRepo(dir: string): ExtractedContext {
  // README wins on overlapping slots; Cargo.toml fills any remaining empties.
  return mergeFillEmpty(interrogateReadme(dir), interrogateCargo(dir));
}
