import type { TierInfo } from './types.js';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

/** Tier boundaries — ordered from highest to lowest
 *
 * Indicators:
 *   🏆 trophy (earned at 100%)
 *   ★ filled star (gold — orange)
 *   ◆ filled diamond (silver — cyan)
 *   ◇ open diamond (bronze — cyan)
 *   ● filled circle (mid tiers)
 *   ○ open circle (low — dim)
 *   ♡ heart (empty — good luck)
 */
export const TIERS: TierInfo[] = [
  { name: 'TROPHY', indicator: `${orange('🏆')} ${orange('TROPHY')}`, threshold: 100 },
  { name: 'GOLD',   indicator: `${orange(bold('★'))} ${orange('GOLD')}`,    threshold: 99 },
  { name: 'SILVER', indicator: `${fafCyan('◆')} ${fafCyan('SILVER')}`, threshold: 95 },
  { name: 'BRONZE', indicator: `${fafCyan('◇')} ${fafCyan('BRONZE')}`, threshold: 85 },
  { name: 'GREEN',  indicator: `${bold('●')} GREEN`,                   threshold: 70 },
  { name: 'YELLOW', indicator: `${dim('●')} YELLOW`,                   threshold: 55 },
  { name: 'RED',    indicator: `${dim('○')} RED`,                      threshold: 1 },
  { name: 'WHITE',  indicator: `${dim('♡')}`,                          threshold: 0 },
];

/** Get the display badge for a tier */
export function tierBadge(tier: TierInfo): string {
  return tier.indicator;
}

/** Get tier info for a given score */
export function getTier(score: number): TierInfo {
  for (const tier of TIERS) {
    if (score >= tier.threshold) {return tier;}
  }
  return TIERS[TIERS.length - 1]; // White
}

/** Get the next tier above the current score (for progress display) */
export function getNextTier(score: number): TierInfo | null {
  const current = getTier(score);
  const idx = TIERS.indexOf(current);
  return idx > 0 ? TIERS[idx - 1] : null;
}
