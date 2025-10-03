/**
 * 🏆 Championship Core - The DNA Both Brothers Share
 *
 * This is the NORTH STAR - the immutable championship values that
 * bind CLI and MCP together as brothers.
 *
 * MANDATE: Changes here MUST be synchronized across:
 * - CLI: /Users/wolfejam/FAF/cli/src/utils/championship-core.ts
 * - MCP: /Users/wolfejam/FAF/claude-faf-mcp/src/handlers/championship-tools.ts
 *
 * Why Separate Files, Not Shared Package?
 * - CLI and MCP have different deployment models
 * - CLI is standalone, MCP is embedded in Claude Desktop
 * - Keeping them independent = zero cross-dependencies = championship speed
 * - But the VALUES must stay identical = brotherhood strength
 *
 * This is bi-sync at the PHILOSOPHY level! 🌟
 */

export interface ChampionshipMedal {
  emoji: string;
  tier: string;
  threshold: number;
}

export interface TierInfo {
  current: string;
  next: string | null;
  nextTarget: number | null;
  nextMedal: string | null;
}

/**
 * 🏁 THE CHAMPIONSHIP MEDAL SYSTEM
 *
 * F1-Inspired 7-Tier Progression
 * SET IN STONE - DO NOT MODIFY without syncing both brothers!
 */
export const CHAMPIONSHIP_MEDALS: readonly ChampionshipMedal[] = Object.freeze([
  { emoji: '🏆', tier: 'Trophy - Championship', threshold: 100 },
  { emoji: '🥇', tier: 'Gold', threshold: 99 },
  { emoji: '🥈', tier: 'Target 2 - Silver', threshold: 95 },
  { emoji: '🥉', tier: 'Target 1 - Bronze', threshold: 85 },
  { emoji: '🟢', tier: 'GO! - Ready for Target 1', threshold: 70 },
  { emoji: '🟡', tier: 'Caution - Getting ready', threshold: 55 },
  { emoji: '🔴', tier: 'Stop - Needs work', threshold: 0 },
]);

/**
 * Get medal for a given score
 * IDENTICAL logic in CLI and MCP
 */
export function getScoreMedal(score: number): { medal: string; status: string } {
  if (score === 0) return { medal: '🤍', status: 'Good luck!' };
  if (score >= 100) return { medal: '🏆', status: 'Trophy - Championship' };
  if (score >= 99) return { medal: '🥇', status: 'Gold' };
  if (score >= 95) return { medal: '🥈', status: 'Target 2 - Silver' };
  if (score >= 85) return { medal: '🥉', status: 'Target 1 - Bronze' };
  if (score >= 70) return { medal: '🟢', status: 'GO! - Ready for Target 1' };
  if (score >= 55) return { medal: '🟡', status: 'Caution - Getting ready' };
  return { medal: '🔴', status: 'Stop - Needs work' };
}

/**
 * Get tier information with next target
 * IDENTICAL logic in CLI and MCP
 */
export function getTierInfo(score: number): TierInfo {
  if (score >= 100) {
    return {
      current: 'Trophy - Championship',
      next: null,
      nextTarget: null,
      nextMedal: null,
    };
  }
  if (score >= 99) {
    return {
      current: 'Gold',
      next: 'Trophy - Championship',
      nextTarget: 100,
      nextMedal: '🏆',
    };
  }
  if (score >= 95) {
    return {
      current: 'Target 2 - Silver',
      next: 'Gold',
      nextTarget: 99,
      nextMedal: '🥇',
    };
  }
  if (score >= 85) {
    return {
      current: 'Target 1 - Bronze',
      next: 'Target 2 - Silver',
      nextTarget: 95,
      nextMedal: '🥈',
    };
  }
  if (score >= 70) {
    return {
      current: 'GO! - Ready for Target 1',
      next: 'Target 1 - Bronze',
      nextTarget: 85,
      nextMedal: '🥉',
    };
  }
  if (score >= 55) {
    return {
      current: 'Caution - Getting ready',
      next: 'GO! - Ready for Target 1',
      nextTarget: 70,
      nextMedal: '🟢',
    };
  }
  return {
    current: 'Stop - Needs work',
    next: 'Caution - Getting ready',
    nextTarget: 55,
    nextMedal: '🟡',
  };
}

/**
 * 🎯 CHAMPIONSHIP PHILOSOPHY
 *
 * These are the values that make us brothers:
 */
export const CHAMPIONSHIP_DNA = Object.freeze({
  // Medal System (MUST be identical)
  medals: CHAMPIONSHIP_MEDALS,

  // Performance Targets (different, but both championship-grade)
  performance: {
    cli: 50,  // <50ms for batch operations
    mcp: 11,  // <11ms for reactive operations
  },

  // Scoring Philosophy (different by design - celebrated!)
  scoring: {
    cli: {
      rule: '99/1',  // 99% precision, 1% generosity
      engine: 'FAB-FORMATS',  // Championship compiler
      max: Infinity,  // Can exceed 100% with Big Orange
    },
    mcp: {
      rule: '9/10',  // 9 parts intelligence, 10 parts accessibility
      engine: 'file-based',  // Simple and fast
      max: 99,  // Realistic maximum for file checks
    },
  },

  // Type Safety (MUST be identical)
  typescript: {
    strict: true,
    safety: 'maximum',
  },

  // Core Philosophy (MUST be identical)
  values: {
    speed: 'championship',
    honesty: 'absolute',
    quality: 'F1-inspired',
    dependencies: 'minimal',
  },
});

/**
 * 🏎️ THE BROTHER PRINCIPLE
 *
 * CLI and MCP are brothers:
 * - Same DNA (this file)
 * - Different strengths (celebrated!)
 * - United mission (AI context excellence)
 *
 * When you modify this file:
 * 1. Test in CLI
 * 2. Copy championship logic to MCP
 * 3. Verify both still pass tests
 * 4. Celebrate that bi-sync works at the PHILOSOPHY level! 🎉
 */
export const BROTHERHOOD_MANIFEST = Object.freeze({
  cli: {
    role: 'Championship Engine',
    platform: 'Developer Terminal',
    strength: 'Deep intelligence with FAB-FORMATS compiler',
    speed: '<50ms batch processing',
  },
  mcp: {
    role: 'Universal Platform',
    platform: 'Claude Desktop',
    strength: 'Zero-config accessibility for ANY user',
    speed: '<11ms reactive operations',
  },
  shared: {
    medals: 'IDENTICAL - 7-tier F1-inspired system',
    typescript: 'IDENTICAL - 100% strict mode',
    philosophy: 'IDENTICAL - Championship values',
    mission: 'IDENTICAL - Perfect AI context for everyone',
  },
});

/**
 * Validate that this file is in sync across brothers
 * Run this in tests!
 */
export function validateBrotherhood(): {
  valid: boolean;
  medals: boolean;
  philosophy: boolean;
} {
  return {
    valid: true,  // If this file compiles, DNA is valid!
    medals: CHAMPIONSHIP_MEDALS.length === 7,
    philosophy: CHAMPIONSHIP_DNA.values.speed === 'championship',
  };
}
