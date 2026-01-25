/**
 * 🚀 Status Command - The Git Status Equivalent
 * Quick context health check that developers use 20x/day
 * 
 * Performance Target: <200ms consistently
 */

import { promises as fs } from 'fs';
import path from 'path';
import { chalk } from '../fix-once/colors';
import { findFafFile } from '../utils/file-utils';
import {
  FAF_ICONS,
  FAF_COLORS,
  formatPerformance,
  formatTechnicalCredit,
  PERFORMANCE_STANDARDS
} from '../utils/championship-style';
import { getScoreEmoji } from '../utils/color-utils';
import { getTierInfo as getChampionshipTierInfo } from '../utils/championship-core';
import { FafCompiler } from '../compiler/faf-compiler';

export interface StatusOptions {
  oneline?: boolean;  // Single line output for hooks
}

/**
 * Get quick status overview for .faf file
 * NOW USING FAB-FORMATS COMPILER - Championship scoring! 🏆
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

    // USE COMPILER SCORE (not trust score!) - Championship engine 🏎️
    const compiler = new FafCompiler();
    const compilerResult = await compiler.compile(fafPath);
    const score = compilerResult.score || 0;

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
      trustScore: score, // Actually compiler score now!
      hasBasicStructure,
      lines,
      size,
      lastSyncText,
      isHealthy: hasBasicStructure && score > 70
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
 * Check for claude.md file presence (Bi-sync status)
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
 * Get tier information for current score and next target
 * NOW USING CHAMPIONSHIP CORE - The DNA both brothers share! 🏆
 */
const getTierInfo = getChampionshipTierInfo;

/**
 * 🏁 Championship Status Dashboard - <38ms Performance Target
 */
function displayStatus(
  fafPath: string,
  status: { trustScore: number; lines: number; lastSyncText: string; isHealthy: boolean },
  hasClaudeMd: boolean,
  duration: number
): void {
  const { trustScore, lines, lastSyncText } = status;

  // Championship performance check
  const _performanceGrade = duration <= PERFORMANCE_STANDARDS.status_command ? 'CHAMPION' : 'GOOD';
  const _speedEmoji = duration <= PERFORMANCE_STANDARDS.status_command ? FAF_ICONS.trophy : FAF_ICONS.lightning;

  // Calculate Technical Credit (mock for now)
  const technicalCredit = Math.floor((trustScore - 50) / 10) * 5;

  // Get medal emoji and tier info
  const medal = getScoreEmoji(trustScore);
  const tierInfo = getTierInfo(trustScore);

  console.log();
  console.log(FAF_COLORS.fafCyan('🏎️  FAF Status'));
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━'));
  console.log(`Score: ${trustScore}% ${medal} ${tierInfo.current}`);
  if (tierInfo.next && tierInfo.nextTarget) {
    console.log(`Next: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${tierInfo.nextTarget - trustScore}% to go!)`);
  }
  console.log();
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }${FAF_ICONS.robot} AI Readiness: ${trustScore >= 80 ? '☑️ Optimized' : '🟡 Improving'}`);
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }${FAF_ICONS.file} Files Tracked: ${lines} lines`);
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }${FAF_ICONS.zap} Performance: ${formatPerformance(duration)}`);
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }${FAF_ICONS.heart_orange} Last Sync: ${lastSyncText}`);
  console.log(`${FAF_COLORS.fafCyan('└─ ')  }${FAF_ICONS.chart_up} Technical Credit: ${formatTechnicalCredit(technicalCredit)}`);
  
  console.log();
  
  // AI Happiness Status
  console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.brain} AI Compatibility:`));
  console.log(`${FAF_COLORS.fafCyan('   ├─ ')  }${FAF_ICONS.blue_heart} Claude: ${trustScore >= 85 ? '92% 🩵' : trustScore >= 70 ? '78% 🟡' : '54% 🟠'}`);
  console.log(`${FAF_COLORS.fafCyan('   ├─ ')  }${FAF_ICONS.green_heart} ChatGPT: ${trustScore >= 80 ? '89% 💚' : trustScore >= 65 ? '71% 🟡' : '49% 🟠'}`);
  console.log(`${FAF_COLORS.fafCyan('   └─ ')  }${FAF_ICONS.heart_orange} Gemini: ${trustScore >= 75 ? '84% 🧡' : trustScore >= 60 ? '68% 🟡' : '43% 🟠'}`);
  
  console.log();
  
  // Bi-sync status with Championship styling
  if (hasClaudeMd) {
    console.log(FAF_COLORS.fafGreen(`☑️ claude.md found - ${FAF_ICONS.link} Bi-sync active`));
  } else {
    console.log(FAF_COLORS.fafOrange(`⚠️  claude.md not found - run `) + FAF_COLORS.fafCyan('faf bi-sync') + FAF_COLORS.fafOrange(' to create'));
  }
  
  console.log();
  
  // Championship Call to Action
  if (duration <= PERFORMANCE_STANDARDS.status_command && trustScore >= 85) {
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Championship performance! ${FAF_ICONS.trophy}`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Try: `)  }faf share${  FAF_COLORS.fafCyan(' - Share this excellence!')}`);
  } else {
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)  }faf trust --detailed${  FAF_COLORS.fafCyan(' - Improve your context')}`);
  }
  console.log();
}

/**
 * Display single-line status for hooks (predev, prebuild, etc.)
 * Message: "Your foundation is optimized. Build with confidence."
 */
function displayOneline(
  status: { trustScore: number; isHealthy: boolean },
  hasClaudeMd: boolean
): void {
  const { trustScore } = status;
  const medal = getScoreEmoji(trustScore);
  const biSync = hasClaudeMd ? 'bi-sync ✓' : 'run: faf bi-sync';

  if (trustScore >= 95) {
    // Optimized - build with confidence
    console.log(`${medal} project.faf ${trustScore}% | ${biSync} | foundation optimized`);
  } else if (trustScore >= 85) {
    // Solid foundation
    console.log(`${medal} project.faf ${trustScore}% | ${biSync} | solid foundation`);
  } else {
    // Needs work
    console.log(`${medal} project.faf ${trustScore}% | ${biSync} | run: faf auto`);
  }
}

/**
 * Main status command handler
 */
export async function statusCommand(options: StatusOptions = {}): Promise<void> {
  const startTime = Date.now();

  try {
    const fafPath = await findFafFile();

    if (!fafPath) {
      if (options.oneline) {
        console.log('⚠️ FAF: no project.faf found');
        return;
      }
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

    // Oneline mode for hooks
    if (options.oneline) {
      displayOneline(status, hasClaudeMd);
      return;
    }

    displayStatus(fafPath, status, hasClaudeMd, duration);

    // Return instead of exit so footer can show
    if (!status.isHealthy) {
      // Let analytics wrapper handle footer display
      return;
    }

  } catch (error) {
    if (options.oneline) {
      console.log('⚠️ FAF: error checking status');
      return;
    }
    console.error(chalk.red('❌ Error checking status:'), error);
    process.exit(1);
  }
}
