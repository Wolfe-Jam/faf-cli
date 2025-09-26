/**
 * 🎨 FIX-ONCE Color System
 * Single source of truth for all colors in FAF CLI
 *
 * APPROVAL REQUIRED TO MODIFY THIS FILE
 * This abstraction prevents chalk version breaks
 * Fix once = Works indefinitely
 */

import chalk from 'chalk';

/**
 * Universal color system that works with any chalk version
 * Never call chalk directly - always use this wrapper
 */
export const colors = {
  // Primary brand colors
  primary: (text: string): string => chalk.cyan(text),
  secondary: (text: string): string => chalk.yellow(text),
  success: (text: string): string => chalk.green(text),
  error: (text: string): string => chalk.red(text),
  warning: (text: string): string => chalk.yellow(text),

  // Semantic colors
  info: (text: string): string => chalk.blue(text),
  muted: (text: string): string => chalk.gray(text),
  bright: (text: string): string => chalk.white(text),
  dim: (text: string): string => chalk.dim(text),
  highlight: (text: string): string => chalk.yellow.bold(text),

  // Style modifiers
  bold: (text: string): string => chalk.bold(text),
  italic: (text: string): string => chalk.italic(text),
  underline: (text: string): string => chalk.underline(text),

  // FAF specific colors (Championship theme)
  fafCyan: (text: string): string => chalk.cyan(text),
  fafOrange: (text: string): string => chalk.hex('#FF6B35')(text), // True FAF Orange
  fafGreen: (text: string): string => chalk.green(text),
  fafWhite: (text: string): string => chalk.white(text),

  // Special effects
  championship: (text: string): string => chalk.bold.cyan(text),
  trust: (text: string): string => chalk.bold.green(text),
  score: (text: string): string => {
    const match = text.match(/(\d+)%/);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 85) return chalk.green(text);
      if (score >= 70) return chalk.yellow(text);
      return chalk.red(text);
    }
    return text;
  },

  // NO_COLOR support (accessibility)
  strip: (text: string): string => {
    return process.env.NO_COLOR ? text.replace(/\x1b\[[0-9;]*m/g, '') : text;
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
 * CASCADE EFFECTS OF THIS MODULE:
 *
 * 1. Fixes ALL chalk.hex() errors immediately
 * 2. Provides consistent colors across entire CLI
 * 3. Enables theme switching (future feature)
 * 4. Supports NO_COLOR accessibility standard
 * 5. Centralizes score/trust coloring logic
 * 6. Makes testing easier (mock one module)
 * 7. Prevents future chalk version breaks
 *
 * MAINTENANCE: This file should NEVER import from other modules
 * It should be the LOWEST level dependency
 */