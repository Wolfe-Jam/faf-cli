/**
 * 🎨 Color Accessibility Utilities
 * Provides colorblind-friendly and no-color support
 */

import { chalk } from '../fix-once/colors';

export type ColorScheme = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';

// Global color settings
let globalColorEnabled = true;
let globalColorScheme: ColorScheme = 'normal';
const _USE_NATIVE = false; // Reserved for future native color support

export function setColorOptions(enabled: boolean, scheme: ColorScheme = 'normal') {
  globalColorEnabled = enabled;
  globalColorScheme = scheme;
  
  // Disable chalk globally if no-color is requested
  if (!enabled) {
    chalk.level = 0;
  }
}

// Score-specific colors that work across all color schemes
export function getScoreColor(percentage: number): (text: string) => string {
  if (!globalColorEnabled) {
    return (text: string) => text;
  }
  
  // Color schemes optimized for different types of colorblindness
  switch (globalColorScheme) {
    case 'deuteranopia': // Red-green colorblind (most common)
      if (percentage >= 90) {return chalk.blue;}
      if (percentage >= 70) {return chalk.yellow;}
      return chalk.magenta;
      
    case 'protanopia': // Red colorblind  
      if (percentage >= 90) {return chalk.blue;}
      if (percentage >= 70) {return chalk.yellow;}
      return chalk.cyan;
      
    case 'tritanopia': // Blue-yellow colorblind (rare)
      if (percentage >= 90) {return chalk.green;}
      if (percentage >= 70) {return chalk.magenta;}
      return chalk.red;
      
    case 'normal':
    default:
      if (percentage >= 90) {return chalk.green;}
      if (percentage >= 70) {return chalk.yellow;}
      return chalk.red;
  }
}

// Championship Medal System
export function getScoreEmoji(percentage: number, useEmoji: boolean = true): string {
  if (!globalColorEnabled || !useEmoji) {
    if (percentage >= 100) {return '[TROPHY]';}
    if (percentage >= 99) {return '[GOLD]';}
    if (percentage >= 95) {return '[SILVER]';}
    if (percentage >= 85) {return '[BRONZE]';}
    return '[IN_PROGRESS]';
  }

  if (percentage >= 100) {return '🏆';}  // Trophy - 100% with 50|50 balance
  if (percentage >= 99) {return '🥇';}   // Gold - 99%
  if (percentage >= 95) {return '🥈';}   // Silver (Target 2) - 95%
  if (percentage >= 85) {return '🥉';}   // Bronze (Target 1) - 85%
  if (percentage >= 70) {return '🟢';}   // GO! - Ready for Target 1
  if (percentage >= 55) {return '🟡';}   // Getting ready
  return '🔴';                            // Stop - Needs work
}

// Simplified color utilities
export const colors = {
  success: (text: string) => !globalColorEnabled ? text : chalk.green(text),
  warning: (text: string) => !globalColorEnabled ? text : chalk.yellow(text),
  error: (text: string) => !globalColorEnabled ? text : chalk.red(text),
  info: (text: string) => !globalColorEnabled ? text : chalk.cyan(text),
  highlight: (text: string) => !globalColorEnabled ? text : chalk.blue(text),
  dim: (text: string) => !globalColorEnabled ? text : chalk.gray(text),
};