import type { KernelScoreResult, ScoreResult } from './types.js';
import { getTier } from './tiers.js';

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
