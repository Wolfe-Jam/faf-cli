/**
 * 🏁 Championship Style Guide - Revolutionary AI-Context Infrastructure
 * Visual Identity System for FAF CLI v2.0.0
 * 
 * Color Trinity: 🩵 AI Precision + 💚 Solution Bridge + 🧡 Human Energy
 */

import { colors } from '../fix-once/colors';

// 🎨 Championship Color Trinity (v2.0.0 White Stripe Edition)
export const FAF_COLORS = {
  // Primary Color Palette
  cyan: '#00CCFF',      // 🩵 Championship AI Precision
  white: '#FFFFFF',     // ⚪ Championship Victory (replaced green)
  orange: '#FF4500',    // 🧡 Championship Orange

  // Color functions for CLI (using fix-once system)
  fafCyan: colors.fafCyan,
  fafWhite: colors.fafWhite,
  fafGreen: colors.fafGreen,
  fafOrange: colors.fafOrange,

  // Gradient simulation for CLI (fallback to single colors)
  gradient: (text: string) => colors.championship(text), // Championship cyan
};

/**
 * ⚡ FAF Icons & Emoji System
 * 
 * ⛔ LOCKED STANDARDS - DO NOT MODIFY
 * These emojis are FINAL and IMMUTABLE as per EMOJI-STANDARDS.md
 * Any changes will be rejected in code review.
 * 
 * 🚫 FORBIDDEN: Never use 🎯 (target) - explicitly rejected
 * ☑️ See EMOJI-STANDARDS.md for complete approved list
 */
export const FAF_ICONS = {
  // Core System - LOCKED
  lightning: '⚡️',        // Performance/Speed
  rocket: '🚀',           // Launch/Initialization  
  precision: '⌚️',        // Precision/Accuracy
  trophy: '🏆',           // Achievement/Success
  checkered_flag: '🏁',   // Racing/Competition
  
  // AI & Intelligence
  robot: '🤖',            // AI Integration
  brain: '🧠',            // Intelligence
  crystal_ball: '🔮',     // Prediction/Analysis
  gem: '💎',              // Premium/Quality
  magic_wand: '🪄',       // AI Magic
  
  // Trust & Quality
  heart_orange: '🧡',     // Trust/Human Connection
  green_heart: '💚',      // Health/Good Status
  blue_heart: '🩵',       // AI/Technical Excellence
  shield: '🛡️',          // Protection/Security
  star: '⭐',             // Rating/Excellence
  
  // Progress & Status
  chart_up: '📈',         // Improvement/Growth
  fire: '🔥',             // High Performance
  zap: '⚡',              // Speed/Energy
  sparkles: '✨',         // Discovery/New
  party: '🎉',            // Celebration/Success
  balance: '⚖️',          // AI|HUMAN Balance
  
  // Technical
  gear: '⚙️',             // Configuration
  magnify: '🔍',          // Scanning/Analysis
  file: '📄',             // Documents/Files
  folder: '📁',           // Directory/Organization
  link: '🔗',             // Connection/Integration
  
  // New command icons
  magnifying_glass: '🔍', // Search
  clipboard: '📝',        // Todo/Tasks
  broom: '🧹',           // Clear/Clean
  pencil: '✏️',          // Edit
  dna: '🧬',             // DNA/Lifecycle
  turbo_cat: '😽',        // TURBO-CAT mascot
};

// 📊 Status Color Coding
export const STATUS_COLORS = {
  // Trust Levels
  trust_excellent: '🟢',   // 90-100% (Green)
  trust_good: '🟡',        // 70-89%  (Yellow)
  trust_medium: '🟠',      // 50-69%  (Orange)
  trust_low: '🔴',         // 0-49%   (Red)
  
  // Performance
  fast: '🟢',              // <50ms   (Green)
  medium: '🟡',            // 50-200ms (Yellow)
  slow: '🟠',              // 200ms+  (Orange)
  
  // AI Status
  ai_happy: '😊',          // High trust
  ai_neutral: '😐',        // Medium trust
  ai_confused: '😕',       // Low trust
};

// 🏎️ F1-Inspired Performance Standards
export const PERFORMANCE_STANDARDS = {
  // Championship Speed Targets
  status_command: 38,        // ms - Faster than git status
  trust_dashboard: 40,       // ms - Real-time trust calculation
  stack_detection: 50,       // ms - Instant stack recognition
  context_generation: 200,   // ms - Full context rebuild
  
  // Quality Gates
  minimum_trust: 60,         // % - Below this triggers improvement
  target_trust: 85,          // % - Optimal AI compatibility
  excellence_trust: 95,      // % - Championship performance
};

// 🎮 Brand Messaging
export const BRAND_MESSAGES = {
  // CLI Headers
  primary: "AI needed a format, it got one— .faf",
  technical: "Foundational AI-context Format",
  performance: "F1-Inspired Software Engineering",
  
  // Success Messages
  achievement: "Technical Credit 💎 +1",
  improvement: "Trust Score Improved! 🧡",
  discovery: "New Stack Discovered! 💎",
  speed_result: "⌚️ <40ms - FAST AF!",
  
  // Special Moments
  magic_healing: "🪄 Self-healing activated!",
  breakthrough: "💥 BREAKTHROUGH! Massive improvement!",
  podium_celebration: "🍾 Podium finish! Championship performance!",
  
  // Call to Action
  sharing: "Send them the .faf 🚀",
  optimization: "Zero context debt 💎",
  ecosystem: "Making AI development better for everyone 🏁"
};

/**
 * Generate simple help header (clean and focused)
 */
export function generateHelpHeader(): string {
  return `${FAF_COLORS.fafCyan('┌─────────────────────────────────────────┐')}
${FAF_COLORS.fafCyan('│')}                                         ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}             ${FAF_COLORS.fafOrange('=== H E L P ===')}             ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}                                         ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}   AI needed a format, it got one— .faf  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}  ─────────────────────────────────────  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}    🌐 Foundational AI-context Format    ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}                                         ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('└─────────────────────────────────────────┘')}`;
}

/**
 * Generate static championship header (with optional scoreboard title)
 */
export function generateFAFHeader(scoreboardTitle?: string): string {
  const version = require('../../package.json').version;

  // Title line above ASCII box (scoreboard or default)
  const titleLine = scoreboardTitle
    ? `${scoreboardTitle}\n`
    : '🏎️⚡️ FAF Championship Edition 🏁\n\n';

  return `
${titleLine}${FAF_COLORS.fafCyan('┌─────────────────────────────────────────┐')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafWhite('███████')}${FAF_COLORS.fafWhite('╗')} ${FAF_COLORS.fafWhite('█████')}${FAF_COLORS.fafWhite('╗')} ${FAF_COLORS.fafWhite('███████')}${FAF_COLORS.fafWhite('╗')}  🏎️⚡️🏁  v${version} ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafCyan('██')}${FAF_COLORS.fafWhite('╔════╝')}${FAF_COLORS.fafCyan('██')}${FAF_COLORS.fafWhite('╔══')}${FAF_COLORS.fafCyan('██')}${FAF_COLORS.fafWhite('╗')}${FAF_COLORS.fafCyan('██')}${FAF_COLORS.fafWhite('╔════╝')}                ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafCyan('█████')}${FAF_COLORS.fafWhite('╗  ')}${FAF_COLORS.fafCyan('███████')}${FAF_COLORS.fafWhite('║')}${FAF_COLORS.fafCyan('█████')}${FAF_COLORS.fafWhite('╗')}                  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('╔══╝  ')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('╔══')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('║')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('╔══╝')}                  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('║     ')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('║  ')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('║')}${FAF_COLORS.fafOrange('██')}${FAF_COLORS.fafWhite('║')}                     ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')} ${FAF_COLORS.fafWhite('╚═╝     ╚═╝  ╚═╝╚═╝')}                     ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}                                         ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}   AI needed a format, it got one— .faf  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}  ─────────────────────────────────────  ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('│')}    🌐 Foundational AI-context Format    ${FAF_COLORS.fafCyan('│')}
${FAF_COLORS.fafCyan('└─────────────────────────────────────────┘')}`;
}

// 🏁 Default ASCII Art Header (for backwards compatibility)
export const FAF_HEADER = generateFAFHeader();

// 📊 Trust Level Formatter
export function formatTrustLevel(trustScore: number): string {
  if (trustScore >= 90) {
    return `${trustScore}% ${STATUS_COLORS.trust_excellent} (Excellence)`;
  } else if (trustScore >= 70) {
    return `${trustScore}% ${STATUS_COLORS.trust_good} (Good)`;
  } else if (trustScore >= 50) {
    return `${trustScore}% ${STATUS_COLORS.trust_medium} (Improving)`;
  } else {
    return `${trustScore}% ${STATUS_COLORS.trust_low} (Needs work)`;
  }
}

// ⚡ Performance Formatter
export function formatPerformance(timeMs: number): string {
  if (timeMs < 50) {
    return `${timeMs}ms ${STATUS_COLORS.fast} ${FAF_ICONS.lightning}`;
  } else if (timeMs < 200) {
    return `${timeMs}ms ${STATUS_COLORS.medium}`;
  } else {
    return `${timeMs}ms ${STATUS_COLORS.slow}`;
  }
}

// 🤖 AI Happiness Formatter
export function formatAIHappiness(score: number): string {
  if (score >= 80) {
    return `${STATUS_COLORS.ai_happy} AI loves your context!`;
  } else if (score >= 60) {
    return `${STATUS_COLORS.ai_neutral} AI understands your context`;
  } else {
    return `${STATUS_COLORS.ai_confused} AI needs better context`;
  }
}

// 💎 Technical Credit Formatter
export function formatTechnicalCredit(credit: number): string {
  if (credit > 0) {
    return `${FAF_ICONS.chart_up} +${credit} ${FAF_ICONS.gem}`;
  } else if (credit === 0) {
    return `${credit} (neutral)`;
  } else {
    return `${credit} (debt)`;
  }
}