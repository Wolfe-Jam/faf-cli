/**
 * 💎 Technical Credit Command - Show credit dashboard and manage credits
 */

import { displayCreditDashboard, loadTechnicalCredit } from '../utils/technical-credit';
import { findFafFile } from '../utils/file-utils';
import { 
  FAF_COLORS, 
  FAF_ICONS, 
  BRAND_MESSAGES 
} from '../utils/championship-style';

export interface CreditCommandOptions {
  detailed?: boolean;
  history?: boolean;
  clear?: boolean;
}

/**
 * Main credit command handler
 */
export async function creditCommand(options: CreditCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    // Find .faf file for project-specific credits
    const fafPath = await findFafFile();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.gem} Technical Credit System`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')  }${BRAND_MESSAGES.optimization}`);
    
    if (options.detailed) {
      await showDetailedCredit(fafPath || undefined);
    } else if (options.history) {
      await showCreditHistory(fafPath || undefined);
    } else if (options.clear) {
      await clearCreditHistory();
    } else {
      await displayCreditDashboard(fafPath || undefined);
    }
    
    const duration = Date.now() - startTime;
    console.log();
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)  }faf credit --detailed${  FAF_COLORS.fafCyan(' - See credit breakdown')}`);
    
    // Performance celebration
    if (duration < 40) {
      console.log(FAF_COLORS.fafGreen(`${BRAND_MESSAGES.speed_result} ${duration}ms dashboard load!`));
    }
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Credit system error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Show detailed credit breakdown
 */
async function showDetailedCredit(fafPath?: string): Promise<void> {
  const credit = await loadTechnicalCredit(fafPath);
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }Detailed Credit Analysis:`);
  console.log(FAF_COLORS.fafCyan('│'));
  
  // Credit by category
  const categoryTotals = new Map<string, number>();
  credit.earned.forEach(source => {
    const current = categoryTotals.get(source.category) || 0;
    categoryTotals.set(source.category, current + source.points);
  });
  
  if (categoryTotals.size > 0) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')  }Credits by Category:`);
    
    Array.from(categoryTotals.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, points]) => {
        const emoji = getCategoryEmoji(category);
        console.log(`${FAF_COLORS.fafCyan('│  ')  }${emoji} ${category}: ${FAF_COLORS.fafGreen(`${points} credits`)}`);
      });
  }
  
  console.log(FAF_COLORS.fafCyan('│'));
  
  // Impact achievements
  if (credit.impact.length > 0) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')  }Impact Achievements:`);
    
    const recentImpacts = credit.impact.slice(-5);
    recentImpacts.forEach(impact => {
      console.log(`${FAF_COLORS.fafCyan('│  ')  }${FAF_ICONS.star} ${impact}`);
    });
    
    if (credit.impact.length > 5) {
      const remaining = credit.impact.length - 5;
      console.log(`${FAF_COLORS.fafCyan('│  ')  }... and ${remaining} more achievements`);
    }
  }
}

/**
 * Show credit earning history
 */
async function showCreditHistory(fafPath?: string): Promise<void> {
  const credit = await loadTechnicalCredit(fafPath);
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')  }Credit History:`);
  
  if (credit.earned.length === 0) {
    console.log(`${FAF_COLORS.fafCyan('│  ')  }No credits earned yet. Start building with:`);
    console.log(`${FAF_COLORS.fafCyan('│  ')  }• ${  FAF_COLORS.fafOrange('faf init')  } - Create perfect AI context`);
    console.log(`${FAF_COLORS.fafCyan('│  ')  }• ${  FAF_COLORS.fafOrange('faf score')  } - Improve completeness`);
    console.log(`${FAF_COLORS.fafCyan('│  ')  }• ${  FAF_COLORS.fafOrange('faf bi-sync')  } - Enable bi-directional sync`);
    return;
  }
  
  // Show last 10 credit earnings
  const recentEarnings = credit.earned.slice(-10).reverse();
  
  recentEarnings.forEach((source, index) => {
    const emoji = getCategoryEmoji(source.category);
    const timeAgo = getTimeAgo(source.timestamp);
    const connector = index === recentEarnings.length - 1 ? '└─' : '├─';
    
    console.log(`${FAF_COLORS.fafCyan(`│  ${connector} `)  
                }${emoji} +${source.points} ${source.action} (${timeAgo})`);
    console.log(FAF_COLORS.fafCyan('│     ') + FAF_COLORS.fafGreen(source.impact));
  });
  
  if (credit.earned.length > 10) {
    const remaining = credit.earned.length - 10;
    console.log(`${FAF_COLORS.fafCyan('│  ')  }... and ${remaining} more credit actions`);
  }
}

/**
 * Clear credit history
 */
async function clearCreditHistory(): Promise<void> {
  // This is a placeholder - in a real implementation, we'd ask for confirmation
  console.log(`${FAF_COLORS.fafOrange('├─ ')  }Credit history clearing not implemented yet`);
  console.log(`${FAF_COLORS.fafCyan('│  ')  }Credits are permanent achievements - no clearing needed!`);
  console.log(`${FAF_COLORS.fafCyan('│  ')  }Your technical credit represents real improvements made`);
}

/**
 * Get emoji for credit category
 */
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    context_improvement: '📝',
    ai_compatibility: '🤖',
    performance: '⚡️',
    completeness: '📊',
    sync_harmony: '🔗',
    stack_discovery: '🔍',
    trust_building: '🛡️'
  };
  
  return emojis[category] || '💎';
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
  
  if (diffMins < 60) {return `${diffMins}m ago`;}
  if (diffHours < 24) {return `${diffHours}h ago`;}
  return `${diffDays}d ago`;
}