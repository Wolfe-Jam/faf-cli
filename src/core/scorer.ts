import type { KernelScoreResult, ScoreResult } from './types.js';
import { getTier, TIERS } from './tiers.js';
import * as kernel from '../wasm/kernel.js';

/** Convert kernel result into enriched ScoreResult */
export function enrichScore(kernel: KernelScoreResult): ScoreResult {
  return {
    score: kernel.score,
    tier: getTier(kernel.score),
    populated: kernel.populated,
    empty: kernel.empty,
    ignored: kernel.ignored,
    active: kernel.active,
    total: kernel.total,
    slots: kernel.slots,
  };
}

/**
 * Score a .faf YAML string with About-Repo short-circuit.
 *
 * About Repos (app_type: about) are documentation surfaces, not apps.
 * They DISPLAY the source codebase's Trophy, they don't earn one. The
 * scorer reads `about.source_score` from the project.faf and emits that
 * directly — no slot scoring, no kernel call.
 *
 * Truth-printing is preserved by owner accountability: the score is
 * their attestation of the source's score; they're on the hook if it's wrong.
 *
 * Required for about: `app_type: about` + `about.represents: <owner>/<repo>`.
 * Optional: `about.source_score: <number>` — without it, score is -1
 * (renders as "—" honest unknown).
 *
 * Doctrine: memory/private-source-public-about-pattern.md.
 *
 * For non-about types: delegates to kernel.score() + enrichScore().
 */
export function scoreFafYaml(yaml: string): ScoreResult {
  // Light regex detection — avoids pulling in a full YAML parser on the
  // hot path. Matches `app_type: about` at the document root (line start).
  const isAboutType = /^\s*app_type:\s*about\s*$/m.test(yaml);

  if (isAboutType) {
    // Read declared source_score under the `about:` block.
    const sourceScoreMatch = yaml.match(/^\s+source_score:\s*(\d+)\s*$/m);
    const declared = sourceScoreMatch ? parseInt(sourceScoreMatch[1], 10) : -1;
    const score = (declared >= 0 && declared <= 100) ? declared : -1;
    // Read `about.represents` for downstream consumers (TAF receipts etc.).
    const representsMatch = yaml.match(/^\s+represents:\s*(\S+)\s*$/m);
    const represents = representsMatch ? representsMatch[1] : undefined;
    // About repos have no scored slots — return a ScoreResult with zeroed
    // counts but a real score+tier. White ♡ when source_score unknown.
    // `inherited: true` flags this as an attested score, not calculated —
    // TAF + display code can distinguish.
    return {
      score,
      tier: score >= 0 ? getTier(score) : TIERS[TIERS.length - 1], // White when unknown
      populated: 0,
      empty: 0,
      ignored: 0,
      active: 0,
      total: 0,
      slots: {},
      inherited: true,
      represents,
    };
  }

  // Normal app: kernel does the math.
  return enrichScore(kernel.score(yaml));
}
