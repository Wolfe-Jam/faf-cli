/**
 * TAF Star Rating - Universal quality signal
 *
 * Pass rate → star count (0-5, 0.5 increments)
 * ★★★★★ is instantly understood by everyone.
 *
 * MCP-portable: pure functions, no side effects
 */

import { TAFFile } from './types';

export interface StarRating {
  stars: number;    // 0-5, 0.5 increments
  display: string;  // ★★★★½
  label: string;    // "5.0 stars" or "4.5 stars"
}

/**
 * Calculate star rating from pass rate (0-1)
 */
export function calculateStarRating(passRate: number): StarRating {
  let stars: number;

  if (passRate >= 1.0) {
    stars = 5.0;
  } else if (passRate >= 0.95) {
    stars = 4.5;
  } else if (passRate >= 0.85) {
    stars = 4.0;
  } else if (passRate >= 0.70) {
    stars = 3.5;
  } else if (passRate >= 0.55) {
    stars = 3.0;
  } else if (passRate >= 0.40) {
    stars = 2.5;
  } else if (passRate >= 0.20) {
    stars = 2.0;
  } else if (passRate > 0) {
    stars = 1.0;
  } else {
    stars = 0.0;
  }

  return {
    stars,
    display: formatStarsDisplay(stars),
    label: `${stars.toFixed(1)} stars`,
  };
}

/**
 * Format star count as unicode display string
 *
 * ★ = filled, ½ = half, ☆ = empty
 */
export function formatStarsDisplay(stars: number): string {
  const full = Math.floor(stars);
  const hasHalf = stars % 1 !== 0;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return '★'.repeat(full) + (hasHalf ? '½' : '') + '☆'.repeat(empty);
}

/**
 * Calculate star rating from TAF file data
 * Returns null if no test history
 */
export function calculateStarRatingFromTAF(taf: TAFFile): StarRating | null {
  if (!taf.test_history || taf.test_history.length === 0) {
    return null;
  }

  // Use latest run
  const latest = taf.test_history[taf.test_history.length - 1];
  if (!latest.tests || latest.tests.total === 0) {
    return null;
  }

  const passRate = latest.tests.passed / latest.tests.total;
  return calculateStarRating(passRate);
}
