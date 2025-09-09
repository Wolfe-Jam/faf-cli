/**
 * 🚀 Status Command - The Git Status Equivalent
 * Quick context health check that developers use 20x/day
 * 
 * Performance Target: <200ms consistently
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { findFafFile } from '../utils/file-utils';
import { calculateTrustScore } from './trust';

export interface StatusOptions {
  // Minimal options for speed
}

/**
 * Get quick status overview for .faf file
 */
async function getQuickStatus(fafPath: string) {
  try {
    const stats = await fs.stat(fafPath);
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    
    // Quick health indicators
    const hasBasicStructure = fafContent.includes('project:') && fafContent.includes('metadata:');
    const lines = fafContent.split('\n').length;
    const size = stats.size;
    const lastModified = stats.mtime;
    
    // Quick trust calculation (simplified for speed)
    const trustScore = await calculateTrustScore(fafPath);
    
    // Calculate time since last modification
    const now = new Date();
    const timeDiff = now.getTime() - lastModified.getTime();
    const minutesAgo = Math.floor(timeDiff / (1000 * 60));
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    
    let lastSyncText = '';
    if (daysAgo > 0) {
      lastSyncText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    } else if (hoursAgo > 0) {
      lastSyncText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    } else if (minutesAgo > 0) {
      lastSyncText = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
    } else {
      lastSyncText = 'just now';
    }
    
    return {
      trustScore: trustScore.overall,
      hasBasicStructure,
      lines,
      size,
      lastSyncText,
      isHealthy: hasBasicStructure && trustScore.overall > 70
    };
  } catch {
    return {
      trustScore: 0,
      hasBasicStructure: false,
      lines: 0,
      size: 0,
      lastSyncText: 'unknown',
      isHealthy: false
    };
  }
}

/**
 * Check for claude.md file presence (Siamese Twin status)
 */
async function checkClaudeMd(projectDir: string) {
  try {
    const claudeMdPath = path.join(projectDir, 'claude.md');
    await fs.access(claudeMdPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Display status dashboard (git status equivalent)
 */
function displayStatus(
  fafPath: string, 
  status: { trustScore: number; lines: number; lastSyncText: string; isHealthy: boolean }, 
  hasClaudeMd: boolean, 
  duration: number
): void {
  const { trustScore, lines, lastSyncText } = status;
  
  // Health indicator
  let healthEmoji = '🟢';
  let healthText = 'EXCELLENT';
  let healthColor = chalk.green.bold;
  
  if (trustScore >= 90) {
    healthEmoji = '🟢';
    healthText = 'EXCELLENT';
    healthColor = chalk.green.bold;
  } else if (trustScore >= 75) {
    healthEmoji = '🟡';
    healthText = 'GOOD';
    healthColor = chalk.yellow.bold;
  } else if (trustScore >= 50) {
    healthEmoji = '🟠';
    healthText = 'NEEDS WORK';
    healthColor = chalk.yellow.bold;
  } else {
    healthEmoji = '🔴';
    healthText = 'POOR';
    healthColor = chalk.red.bold;
  }
  
  console.log();
  console.log(chalk.cyan('┌─ FAF Status ──────────────────────┐'));
  console.log(chalk.cyan('│') + healthColor(` ${healthEmoji} Context Health: ${trustScore}% ${healthText}`) + ' '.repeat(Math.max(0, 34 - ` ${healthEmoji} Context Health: ${trustScore}% ${healthText}`.length)) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ` 📁 Files Tracked: ${lines} lines` + ' '.repeat(Math.max(0, 34 - ` 📁 Files Tracked: ${lines} lines`.length)) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ` 🔄 Last Sync: ${lastSyncText}` + ' '.repeat(Math.max(0, 34 - ` 🔄 Last Sync: ${lastSyncText}`.length)) + chalk.cyan('│'));
  
  // AI Ready status
  const aiReadyText = trustScore >= 80 ? '🤖 AI Ready: Claude, ChatGPT, Gemini' : '🤖 AI Ready: Needs improvement';
  console.log(chalk.cyan('│') + ` ${aiReadyText}` + ' '.repeat(Math.max(0, 34 - ` ${aiReadyText}`.length)) + chalk.cyan('│'));
  
  // Performance indicator
  const perfText = `⚡ Performance: <${duration}ms`;
  console.log(chalk.cyan('│') + ` ${perfText}` + ' '.repeat(Math.max(0, 34 - ` ${perfText}`.length)) + chalk.cyan('│'));
  console.log(chalk.cyan('└────────────────────────────────────┘'));
  
  // Siamese Twin status
  if (hasClaudeMd) {
    console.log(chalk.green('✅ claude.md found - Siamese twins active'));
  } else {
    console.log(chalk.yellow('⚠️  claude.md not found - run `faf sync --twins` to create'));
  }
  
  console.log();
  console.log(chalk.dim('💡 Try: faf explain "What does this project do?"'));
  console.log();
}

/**
 * Main status command handler
 */
export async function statusCommand(options: StatusOptions = {}): Promise<void> {
  const startTime = Date.now();
  
  try {
    const fafPath = await findFafFile();
    
    if (!fafPath) {
      console.log(chalk.red('❌ No .faf file found'));
      console.log(chalk.dim('💡 Run `faf init` to get started'));
      process.exit(1);
    }
    
    const projectDir = path.dirname(fafPath);
    const [status, hasClaudeMd] = await Promise.all([
      getQuickStatus(fafPath),
      checkClaudeMd(projectDir)
    ]);
    
    const duration = Date.now() - startTime;
    
    displayStatus(fafPath, status, hasClaudeMd, duration);
    
    // Exit code based on health
    if (!status.isHealthy) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error checking status:'), error);
    process.exit(1);
  }
}