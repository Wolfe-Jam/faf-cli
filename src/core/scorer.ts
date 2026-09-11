import type { KernelScoreResult, ScoreResult } from './types.js';
import { getTier, TIERS } from './tiers.js';
import * as kernel from '../wasm/kernel.js';
import { aboutFromYaml } from './about.js';

/** A score as text for display: `85%`, or `unknown (—)` when the result says
 *  the score is not known (`unknown: true` — an About Repo with no
 *  source_score). Never `-1%`. */
export function scoreText(result: Pick<ScoreResult, 'score' | 'unknown'>): string {
  return result.unknown ? 'unknown (—)' : `${result.score}%`;
}

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
 * About is a repo role, not an app_type. The signal is the `about:` block
 * (`about.represents`). The scorer reads `about.source_score` and emits
 * that directly — no slot scoring, no kernel call.
 *
 * Optional: `about.source_score: <number>` — without it the score is not
 * known: the result carries `unknown: true` (with score -1 and a White tier
 * as placeholders). Render that as "unknown" (—), never as "-1/100" or "-1%".
 *
 * Doctrine: memory/private-source-public-about-pattern.md.
 *
 * For apps: delegates to kernel.score() + enrichScore().
 */
export function scoreFafYaml(yaml: string): ScoreResult {
  const about = aboutFromYaml(yaml);
  if (about) {
    const score = about.sourceScore;
    return {
      score,
      tier: score >= 0 ? getTier(score) : TIERS[TIERS.length - 1],
      populated: 0,
      empty: 0,
      ignored: 0,
      active: 0,
      total: 0,
      slots: {},
      inherited: true,
      represents: about.represents,
      ...(score < 0 ? { unknown: true } : {}),
    };
  }

  return enrichScore(kernel.score(yaml));
}
