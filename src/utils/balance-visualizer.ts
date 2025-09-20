/**
 * 🎯 AI|HUMAN Balance Visualizer
 * Visual-only gamification that drives +144% human context completion
 * The 50/50 eternal truth: AI detects tech (50%), humans provide meaning (50%)
 */

const chalk = require('chalk');

export interface BalanceData {
  aiPercentage: number;
  humanPercentage: number;
  isBalanced: boolean;
}

export class BalanceVisualizer {
  private static readonly BAR_WIDTH = 40;
  private static readonly CYAN = '#00FFFF';
  private static readonly ORANGE = '#FFA500';
  private static readonly GREEN = '#00FF00';

  /**
   * Calculate balance from FAF data
   * Matches fafdev.tools calculation - INDEPENDENT percentages
   * AI: How complete is technical context (0-100%)
   * HUMAN: How complete is human context (0-100%)
   * Perfect balance when both are high and similar
   */
  static calculateBalance(fafData: any): BalanceData {
    // AI fields (technical detection) - what AI can detect
    const aiFields = [
      'stack.frontend',
      'stack.backend',
      'stack.database',
      'stack.runtime',
      'stack.build',
      'stack.package_manager',
      'project.main_language',
      'project.generated',
      'ai_instructions',
      'preferences.quality_bar',
      'state.version',
      'state.phase'
    ];

    // HUMAN fields (context meaning) - what humans provide
    const humanFields = [
      'human_context.who',
      'human_context.what',
      'human_context.why',
      'human_context.where',
      'human_context.when',
      'human_context.how',
      'project.goal',
      'project.mission',
      'state.focus',
      'state.next_milestone',
      'state.blockers',
      'preferences.communication'
    ];

    let aiFilledCount = 0;
    let humanFilledCount = 0;

    // Count AI fields
    aiFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], fafData);
      if (value && value !== 'None' && value !== 'Not specified' && value !== '') {
        aiFilledCount++;
      }
    });

    // Count HUMAN fields
    humanFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], fafData);
      if (value && value !== 'Not specified' && value !== '') {
        humanFilledCount++;
      }
    });

    // Calculate INDEPENDENT percentages (like fafdev.tools)
    const aiPercentage = Math.round((aiFilledCount / aiFields.length) * 100);
    const humanPercentage = Math.round((humanFilledCount / humanFields.length) * 100);

    // Perfect balance when both are high and within 10% of each other
    const isBalanced =
      Math.abs(aiPercentage - humanPercentage) <= 10 &&
      aiPercentage >= 50 &&
      humanPercentage >= 50;

    return {
      aiPercentage,
      humanPercentage,
      isBalanced
    };
  }

  /**
   * Generate the visual balance bar
   * Matches fafdev.tools - single bar showing AI|HUMAN proportion
   */
  static generateBalanceBar(balance: BalanceData): string {
    const { aiPercentage, humanPercentage, isBalanced } = balance;

    // Calculate proportional split (matching fafdev.tools logic)
    const totalContext = aiPercentage + humanPercentage;
    let aiProportion: number;
    let humanProportion: number;

    if (totalContext === 0) {
      aiProportion = 50;
      humanProportion = 50;
    } else {
      aiProportion = Math.round((aiPercentage / totalContext) * 100);
      humanProportion = 100 - aiProportion;
    }

    // Build the visual bar
    const lines: string[] = [];

    // Header matching fafdev.tools style
    lines.push('');
    if (isBalanced) {
      lines.push(chalk.green.bold('   PRD Balance'));
    } else {
      lines.push(chalk.white.bold('   AI|HUMAN CONTEXT BALANCE'));
    }
    lines.push('');

    // Build the single unified bar
    const aiBarWidth = Math.round((aiProportion / 100) * this.BAR_WIDTH);
    const humanBarWidth = this.BAR_WIDTH - aiBarWidth;

    let barLine = '   ';

    // GREEN celebration when perfectly balanced!
    if (isBalanced) {
      // Entire bar turns GREEN for perfect balance
      barLine += chalk.green('█'.repeat(this.BAR_WIDTH));
    } else {
      // Normal cyan/orange split when not balanced
      if (aiBarWidth > 0 && humanBarWidth > 0) {
        barLine += chalk.cyan('█'.repeat(aiBarWidth));
        barLine += chalk.yellow('█'.repeat(humanBarWidth));
      } else if (aiBarWidth > 0) {
        barLine += chalk.cyan('█'.repeat(this.BAR_WIDTH));
      } else {
        barLine += chalk.yellow('█'.repeat(this.BAR_WIDTH));
      }
    }

    lines.push(barLine);

    // Guidance text
    lines.push('');
    if (isBalanced) {
      lines.push(chalk.gray('   ⚖️ PERFECT BALANCE!'));
    } else {
      lines.push(chalk.gray('   DROP FILES OR ADD CONTEXT TO SEE AI/HUMAN BALANCE'));
    }

    // Status message
    lines.push('');
    if (isBalanced) {
      lines.push(chalk.green('   ✅ Your context is perfectly balanced!'));
      lines.push(chalk.green('   🏆 AI understands your tech, you provide the meaning'));
    } else if (aiPercentage > humanPercentage + 20) {
      lines.push(chalk.yellow('   📝 Add more human context (who, what, why, etc.)'));
      lines.push(chalk.gray('   💡 AI detected your tech, now tell your story'));
    } else if (humanPercentage > aiPercentage + 20) {
      lines.push(chalk.yellow('   🔧 Add more technical details (stack, dependencies)'));
      lines.push(chalk.gray('   💡 Great story, now specify the implementation'));
    } else if (aiPercentage < 30 && humanPercentage < 30) {
      lines.push(chalk.red('   ⚠️  Both AI and HUMAN context are low'));
      lines.push(chalk.gray('   💡 Start by filling in basic project info'));
    } else {
      lines.push(chalk.cyan('   🎯 Getting closer to balance!'));
      lines.push(chalk.gray(`   📊 AI: ${aiPercentage}% | HUMAN: ${humanPercentage}%`));
    }

    return lines.join('\n');
  }

  /**
   * Generate a compact balance indicator for inline display
   */
  static generateCompactBalance(balance: BalanceData): string {
    const { aiPercentage, humanPercentage, isBalanced } = balance;

    if (isBalanced) {
      return chalk.green('⚖️ BALANCED');
    }

    const aiColor = chalk.cyan;
    const humanColor = chalk.yellow;

    return `${aiColor(`AI:${aiPercentage}%`)} | ${humanColor(`HUMAN:${humanPercentage}%`)}`;
  }

  /**
   * Get balance achievement message for gamification
   */
  static getAchievementMessage(balance: BalanceData): string | null {
    const { isBalanced, aiPercentage, humanPercentage } = balance;

    if (isBalanced && aiPercentage >= 80 && humanPercentage >= 80) {
      return chalk.green.bold('🏆 CHAMPION BALANCE - Both AI and HUMAN above 80%!');
    } else if (isBalanced) {
      return chalk.green('✨ Balance achieved! Keep adding context to reach Champion status');
    } else if (Math.abs(aiPercentage - humanPercentage) <= 5) {
      return chalk.yellow('🔥 So close to perfect balance! Just a few more fields...');
    }

    return null;
  }
}