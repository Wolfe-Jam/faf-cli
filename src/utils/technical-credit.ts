/**
 * 💎 Technical Credit System - Revolutionary credit generation instead of debt
 * Transform developer psychology from anxiety to confidence
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { 
  FAF_COLORS, 
  FAF_ICONS, 
  BRAND_MESSAGES 
} from './championship-style';

export interface TechnicalCredit {
  current: number;                 // Current credit balance
  earned: CreditSource[];          // How credit was earned
  impact: string[];               // Improvements unlocked
  trending: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface CreditSource {
  action: string;                 // "improved_context_quality"
  points: number;                // Credit points earned
  timestamp: Date;               // When earned
  impact: string;                // Description of improvement
  category: CreditCategory;       // Type of improvement
}

export type CreditCategory = 
  | 'context_improvement'     // Better .faf quality
  | 'ai_compatibility'        // AI happiness boost
  | 'performance'            // Speed improvements
  | 'completeness'           // More complete context
  | 'sync_harmony'           // Bi-directional sync success
  | 'stack_discovery'        // New stack identified
  | 'trust_building';        // Trust score improvements

// Credit scoring system
const CREDIT_VALUES: Record<CreditCategory, number> = {
  context_improvement: 5,
  ai_compatibility: 8,
  performance: 3,
  completeness: 6,
  sync_harmony: 4,
  stack_discovery: 7,
  trust_building: 10
};

/**
 * Get technical credit cache file path
 */
function getCreditCachePath(): string {
  const cacheDir = path.join(os.homedir(), '.faf-cli-cache');
  return path.join(cacheDir, 'technical-credit.json');
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  const cacheDir = path.dirname(getCreditCachePath());
  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory already exists, ignore
  }
}

/**
 * Load current technical credit status
 */
export async function loadTechnicalCredit(fafPath?: string): Promise<TechnicalCredit> {
  try {
    const cachePath = getCreditCachePath();
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const allCredits = JSON.parse(cacheData);
    
    // Get credit for specific project or global
    const projectKey = fafPath ? path.resolve(fafPath) : 'global';
    const credit = allCredits[projectKey];
    
    if (!credit) {
      return createInitialCredit();
    }
    
    // Convert timestamps back to Date objects
    credit.lastUpdated = new Date(credit.lastUpdated);
    credit.earned = credit.earned.map((source: { timestamp: string }) => ({
      ...source,
      timestamp: new Date(source.timestamp)
    }));
    
    return credit;
  } catch {
    return createInitialCredit();
  }
}

/**
 * Create initial credit state
 */
function createInitialCredit(): TechnicalCredit {
  return {
    current: 0,
    earned: [],
    impact: [],
    trending: 'stable',
    lastUpdated: new Date()
  };
}

/**
 * Award technical credit for specific actions
 */
export async function awardCredit(
  action: string,
  category: CreditCategory,
  impact: string,
  fafPath?: string
): Promise<number> {
  try {
    await ensureCacheDir();
    
    // Load current credit
    const credit = await loadTechnicalCredit(fafPath);
    
    // Calculate points
    const points = CREDIT_VALUES[category];
    
    // Add new credit source
    const newSource: CreditSource = {
      action,
      points,
      timestamp: new Date(),
      impact,
      category
    };
    
    credit.earned.push(newSource);
    credit.current += points;
    credit.impact.push(impact);
    credit.lastUpdated = new Date();
    
    // Calculate trending
    const recentEarnings = credit.earned
      .filter(s => Date.now() - s.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .reduce((sum, s) => sum + s.points, 0);
    
    if (recentEarnings > 20) {
      credit.trending = 'up';
    } else if (recentEarnings < 5) {
      credit.trending = 'down';
    } else {
      credit.trending = 'stable';
    }
    
    // Save updated credit (will silently fail if no permissions)
    await saveTechnicalCredit(credit, fafPath);

    // Check if we can actually write to cache before showing message
    const cacheDir = path.join(require('os').homedir(), '.faf-cli-cache');
    try {
      await fs.access(cacheDir, fs.constants.W_OK);
      // Only show achievement message if we have write access
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.gem} ${BRAND_MESSAGES.achievement} +${points} points`));
      console.log(FAF_COLORS.fafCyan(`└─ ${impact}`));
    } catch {
      // No write access - skip the message
    }

    return points;
  } catch (error) {
    // Silently fail - technical credit is optional
    return 0;
  }
}

/**
 * Save technical credit to cache
 */
async function saveTechnicalCredit(credit: TechnicalCredit, fafPath?: string): Promise<void> {
  try {
    const cachePath = getCreditCachePath();
    
    // Load existing cache
    let allCredits: Record<string, TechnicalCredit> = {};
    try {
      const existing = await fs.readFile(cachePath, 'utf-8');
      allCredits = JSON.parse(existing);
    } catch {
      // Cache doesn't exist yet, start fresh
    }
    
    // Update credit for specific project or global
    const projectKey = fafPath ? path.resolve(fafPath) : 'global';
    allCredits[projectKey] = credit;
    
    // Save updated cache
    await fs.writeFile(cachePath, JSON.stringify(allCredits, null, 2));
  } catch (error) {
    // Silently fail - technical credit is optional and shouldn't scare newbies
    // The error is usually just permission issues in sandboxed environments
  }
}

/**
 * Display technical credit dashboard
 */
export async function displayCreditDashboard(fafPath?: string): Promise<void> {
  const credit = await loadTechnicalCredit(fafPath);
  
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.gem} Technical Credit Dashboard`));
  console.log(FAF_COLORS.fafCyan('├─────────────────────────────────'));
  
  // Current balance with trending indicator
  const trendingEmoji = credit.trending === 'up' ? '📈' : 
                       credit.trending === 'down' ? '📉' : '➡️';
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Balance: ${FAF_COLORS.fafGreen(`${credit.current} credits`)} ${trendingEmoji}`);
  
  // Credit level
  const level = getCreditLevel(credit.current);
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Level: ${level.name} ${level.emoji}`);
  
  // Recent earnings
  const recentEarnings = credit.earned
    .filter(s => Date.now() - s.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000)
    .length;
    
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Recent Activity: ${recentEarnings} actions (7 days)`);
  
  // Top credit sources
  if (credit.earned.length > 0) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Top Sources:`);
    
    const topSources = credit.earned
      .slice(-3)
      .reverse();
      
    topSources.forEach(source => {
      const timeAgo = getTimeAgo(source.timestamp);
      console.log(`${FAF_COLORS.fafCyan('│  ')}+${source.points} ${source.impact} (${timeAgo})`);
    });
  }
  
  console.log(FAF_COLORS.fafCyan('└─────────────────────────────────'));
  
  // Championship message
  if (credit.current >= 100) {
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} ${BRAND_MESSAGES.podium_celebration}`));
  } else if (credit.trending === 'up') {
    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.chart_up} Keep building credit! Next milestone: ${getNextMilestone(credit.current)} credits`));
  }
}

/**
 * Get credit level based on points
 */
function getCreditLevel(points: number): { name: string; emoji: string } {
  if (points >= 200) {
    return { name: 'Championship', emoji: '🏆' };
  }
  if (points >= 100) {
    return { name: 'Professional', emoji: '💎' };
  }
  if (points >= 50) {
    return { name: 'Advanced', emoji: '⚡️' };
  }
  if (points >= 20) {
    return { name: 'Developing', emoji: '🚀' };
  }
  if (points >= 5) {
    return { name: 'Started', emoji: '🌱' };
  }
  return { name: 'Beginner', emoji: '🏁' };
}

/**
 * Get next milestone
 */
function getNextMilestone(current: number): number {
  const milestones = [5, 20, 50, 100, 200];
  return milestones.find(m => m > current) || current + 100;
}

/**
 * Get human readable time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${diffDays}d ago`;
}

/**
 * Auto-award credit for common actions
 */
export async function autoAwardCredit(
  trigger: 'init_success' | 'score_improved' | 'sync_success' | 'validation_passed' | 'ai_happy',
  fafPath?: string
): Promise<void> {
  const actions: Record<typeof trigger, { action: string; category: CreditCategory; impact: string }> = {
    init_success: {
      action: 'Created .faf file',
      category: 'context_improvement',
      impact: 'Perfect AI context established'
    },
    score_improved: {
      action: 'Improved context score',
      category: 'completeness',
      impact: 'Better AI understanding achieved'
    },
    sync_success: {
      action: 'Synchronized files',
      category: 'sync_harmony',
      impact: 'Bi-sync harmony maintained'
    },
    validation_passed: {
      action: 'Validation successful',
      category: 'context_improvement',
      impact: 'Context quality verified'
    },
    ai_happy: {
      action: 'AI happiness improved',
      category: 'ai_compatibility',
      impact: 'AI trust and confidence boosted'
    }
  };
  
  const config = actions[trigger];
  await awardCredit(config.action, config.category, config.impact, fafPath);
}