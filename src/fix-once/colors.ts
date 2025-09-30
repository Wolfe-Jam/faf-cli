/**
 * 🎨 FIX-ONCE Color System - NATIVE ANSI EDITION
 * Single source of truth for all colors in FAF CLI
 *
 * CHALK HAS BEEN CHALKED OFF! ✅
 * Using native ANSI escape codes - ZERO dependencies
 * Fix once = Works FOREVER
 */

/**
 * ANSI Escape Codes Reference
 * No more pink surprises, no more chalk bugs!
 */
const ANSI = {
  // Reset
  reset: '\x1b[0m',

  // Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // 256 color mode for orange (closest to #FF6B35)
  orange: '\x1b[38;5;208m', // Orange in 256 color mode
};

/**
 * Helper to wrap text in ANSI codes
 */
function ansi(text: string, ...codes: string[]): string {
  // NO_COLOR environment variable support
  if (process.env.NO_COLOR) {
    return text;
  }
  return `${codes.join('')}${text}${ANSI.reset}`;
}

/**
 * Universal color system - CHALK FREE! 🎉
 * Never import chalk again - this is all we need
 */
export const colors = {
  // Primary brand colors
  primary: (text: string): string => ansi(text, ANSI.cyan),
  secondary: (text: string): string => ansi(text, ANSI.yellow),
  success: (text: string): string => ansi(text, ANSI.green),
  error: (text: string): string => ansi(text, ANSI.red),
  warning: (text: string): string => ansi(text, ANSI.yellow),

  // Semantic colors
  info: (text: string): string => ansi(text, ANSI.blue),
  muted: (text: string): string => ansi(text, ANSI.gray),
  bright: (text: string): string => ansi(text, ANSI.white),
  dim: (text: string): string => ansi(text, ANSI.dim),
  highlight: (text: string): string => ansi(text, ANSI.yellow, ANSI.bold),

  // Style modifiers
  bold: (text: string): string => ansi(text, ANSI.bold),
  italic: (text: string): string => ansi(text, ANSI.italic),
  underline: (text: string): string => ansi(text, ANSI.underline),

  // FAF specific colors (Championship theme)
  fafCyan: (text: string): string => ansi(text, ANSI.cyan),
  fafOrange: (text: string): string => ansi(text, ANSI.orange), // True FAF Orange (256 color)
  fafGreen: (text: string): string => ansi(text, ANSI.green),
  fafWhite: (text: string): string => ansi(text, ANSI.white),

  // Special effects
  championship: (text: string): string => ansi(text, ANSI.bold, ANSI.cyan),
  trust: (text: string): string => ansi(text, ANSI.bold, ANSI.green),
  score: (text: string): string => {
    const match = text.match(/(\d+)%/);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 85) return ansi(text, ANSI.green);
      if (score >= 70) return ansi(text, ANSI.yellow);
      return ansi(text, ANSI.red);
    }
    return text;
  },

  // NO_COLOR support (accessibility)
  strip: (text: string): string => {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }
};

/**
 * Color bars for visualizations
 * Used by AI|HUMAN balance and other displays
 */
export const bars = {
  filled: '█',
  empty: '░',

  cyan: (length: number): string => colors.fafCyan(bars.filled.repeat(length)),
  orange: (length: number): string => colors.fafOrange(bars.filled.repeat(length)),
  green: (length: number): string => colors.success(bars.filled.repeat(length)),

  // Balanced bar (green when perfect)
  balanced: (length: number, isBalanced: boolean): string => {
    const bar = bars.filled.repeat(length);
    return isBalanced ? colors.success(bar) : colors.primary(bar);
  }
};

/**
 * Get color based on score/percentage
 * Centralizes all score-based coloring logic
 */
export function getScoreColor(score: number): (text: string) => string {
  if (score >= 85) return colors.success;
  if (score >= 70) return colors.warning;
  if (score >= 50) return colors.secondary;
  return colors.error;
}

/**
 * Format score with appropriate color
 * Single place for all score formatting
 */
export function formatScore(score: number, prefix: string = 'Score'): string {
  const color = getScoreColor(score);
  return color(`${prefix}: ${score}%`);
}

/**
 * Trust level formatting
 * Centralizes trust dashboard colors
 */
export function getTrustColor(trustLevel: number): (text: string) => string {
  if (trustLevel >= 85) return colors.trust;
  if (trustLevel >= 70) return colors.warning;
  if (trustLevel >= 50) return colors.secondary;
  return colors.error;
}

/**
 * Trust emoji based on level
 * Single source for trust indicators
 */
export function getTrustEmoji(trustLevel: number): string {
  if (trustLevel >= 85) return '🧡';
  if (trustLevel >= 70) return '🟡';
  if (trustLevel >= 50) return '🟠';
  return '🔴';
}

// Export default for convenience
export default colors;

/**
 * CASCADE EFFECTS OF CHALKING OFF CHALK:
 *
 * 1. NO MORE PINK SURPRISES! Colors work correctly
 * 2. ZERO dependency on chalk - one less thing to break
 * 3. Faster startup - no chalk loading
 * 4. Smaller package size - no chalk bloat
 * 5. Works in ALL environments - just ANSI codes
 * 6. NO_COLOR still supported for accessibility
 * 7. Future proof - ANSI codes are eternal
 *
 * MAINTENANCE: This file should NEVER import from other modules
 * It should be the LOWEST level dependency
 *
 * CHALK STATUS: ❌ CHALKED OFF!
 * DC STATUS: 1/3 dependencies eliminated! 🏁
 */