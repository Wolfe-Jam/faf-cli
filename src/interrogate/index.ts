/**
 * Repo interrogation orchestrator — runs all extractors and merges results.
 *
 * Two classes of extractor:
 *   - PROSE (README, Cargo.toml description) → `project.goal` + `human_context`.
 *     README wins on overlap because its prose is most likely hand-curated.
 *   - FILE-FACTS (docker-compose services, Makefile targets, .env.example) →
 *     `stack.*` + `commands.*` + `security.*`. These are ground truth pulled
 *     straight from config — they win over README guesses and over the
 *     presence-only detectors in scanner.ts (wired in assemble.ts).
 *
 * The orchestrator never overwrites with a non-empty value — earlier extractors
 * win; later ones fill empties only.
 */

import type { ExtractedContext } from './types.js';
import { interrogateReadme } from './readme.js';
import { interrogateCargo } from './cargo.js';
import { interrogateCompose } from './compose.js';
import { interrogateBuildFiles } from './build-files.js';
import { interrogateEnv } from './env.js';

export type { ExtractedContext } from './types.js';
export { interrogateReadme } from './readme.js';
export { interrogateCargo } from './cargo.js';
export { interrogateCompose } from './compose.js';
export { interrogateBuildFiles } from './build-files.js';
export { interrogateEnv } from './env.js';

/** Merge `b` into `a` — only fill empties in `a`, never overwrite. */
function mergeFillEmpty(a: ExtractedContext, b: ExtractedContext): ExtractedContext {
  const out: ExtractedContext = {
    project: { ...(b.project ?? {}), ...(a.project ?? {}) },
    human_context: { ...(b.human_context ?? {}), ...(a.human_context ?? {}) },
    stack: { ...(b.stack ?? {}), ...(a.stack ?? {}) },
    commands: { ...(b.commands ?? {}), ...(a.commands ?? {}) },
    security: { ...(b.security ?? {}), ...(a.security ?? {}) },
  };
  // Strip empty sub-objects for clean equality semantics.
  for (const k of ['project', 'human_context', 'stack', 'commands', 'security'] as const) {
    if (out[k] && Object.keys(out[k] as object).length === 0) {delete out[k];}
  }
  return out;
}

/** Run all repo interrogators and return merged context. */
export function interrogateRepo(dir: string): ExtractedContext {
  return [
    interrogateReadme(dir),   // prose — highest precedence for goal + 6Ws
    interrogateCargo(dir),
    interrogateCompose(dir),  // file-facts — stack.*
    interrogateBuildFiles(dir), // file-facts — commands.*
    interrogateEnv(dir),      // file-facts — security.*
  ].reduce(mergeFillEmpty, {} as ExtractedContext);
}
