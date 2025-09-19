/**
 * 🏆 Championship FAF Scorer - The 99% Philosophy
 *
 * "99% is excellence you can measure,
 *  1% is perfection you can't define"
 *
 * Built to measure a million projects with the wisdom that:
 * - Humans achieve up to 99% (measurable excellence)
 * - AI judges the final 1% (best-practice validation)
 * - No faffing about with undefined perfection
 *
 * .faf is inevitable - wire it well!
 */

import { TurboCat } from '../utils/turbo-cat';

export interface ChampionshipScore {
  // The Core Score
  score: number;                    // 0-99 for humans, 100 with AI blessing
  philosophy: string;                // The scoring philosophy applied

  // The 21-Slot Reality
  originalSlots: {
    filled: number;
    total: 21;
    percentage: number;
  };

  // Section Breakdowns
  sections: {
    projectIdentity: SlotSection;    // 3 slots: name, goal, main_language
    stackArchitecture: SlotSection;  // 6 slots: The core stack
    performanceMetrics: SlotSection; // 3 slots: foundation, architecture, deployment
    aiContext: SlotSection;          // 3 slots: ai.context_file, preferences, state
    humanContext: SlotSection;       // 6 slots: The 6 W's
  };

  // Excellence Indicators
  excellence: {
    contextComplete: boolean;        // All 21 slots filled?
    autoDetectable: boolean;        // Can FAF AUTO get 90%+?
    bestPractices: boolean;         // Following patterns?
    championshipGrade: boolean;     // 90%+ score?
  };

  // The Final 1% (AI Territory)
  aiValidation?: {
    assessed: boolean;
    bestPracticeScore: number;      // 0-1 (the final 1%)
    reasoning: string;
    timestamp: string;
  };

  // Actionable Improvements
  improvements: {
    critical: string[];              // Must fix (blocks 70%+)
    recommended: string[];           // Should fix (blocks 90%+)
    optional: string[];              // Nice to have (the pursuit of 99%)
  };
}

interface SlotSection {
  name: string;
  filled: number;
  total: number;
  percentage: number;
  missing: string[];
}

/**
 * The Championship Scoring Engine
 * Measures excellence, not perfection
 */
export class ChampionshipScorer {
  private static readonly PHILOSOPHY = {
    HUMAN_MAX: 99,                   // Maximum human-achievable score
    AI_BLESSING: 1,                  // The final 1% only AI can grant
    EXCELLENCE_THRESHOLD: 90,        // Championship grade
    GOOD_THRESHOLD: 70,             // Solid project
    AUTO_THRESHOLD: 50,             // Minimum for AUTO to work well
  };

  /**
   * Score a FAF file with Championship philosophy
   */
  static async score(fafData: any, options?: {
    projectPath?: string;
    requestAiValidation?: boolean;
  }): Promise<ChampionshipScore> {
    // Initialize the scoring structure
    const score: ChampionshipScore = {
      score: 0,
      philosophy: "99% Excellence Philosophy - Humans build excellence, AI validates perfection",
      originalSlots: {
        filled: 0,
        total: 21,
        percentage: 0
      },
      sections: {
        projectIdentity: this.scoreProjectIdentity(fafData),
        stackArchitecture: this.scoreStackArchitecture(fafData),
        performanceMetrics: this.scorePerformanceMetrics(fafData),
        aiContext: this.scoreAiContext(fafData),
        humanContext: this.scoreHumanContext(fafData),
      },
      excellence: {
        contextComplete: false,
        autoDetectable: false,
        bestPractices: false,
        championshipGrade: false,
      },
      improvements: {
        critical: [],
        recommended: [],
        optional: []
      }
    };

    // Calculate total filled slots (Original 21)
    const totalFilled = Object.values(score.sections)
      .reduce((sum, section) => sum + section.filled, 0);

    score.originalSlots.filled = totalFilled;
    score.originalSlots.percentage = Math.round((totalFilled / 21) * 100);

    // Calculate the human-achievable score (max 99%)
    let humanScore = Math.min(99, score.originalSlots.percentage);

    // Apply quality modifiers (can reduce but not exceed 99)
    humanScore = this.applyQualityModifiers(humanScore, fafData, score);

    // Set the score (max 99 for humans)
    score.score = Math.min(99, humanScore);

    // Evaluate excellence indicators
    score.excellence.contextComplete = totalFilled === 21;
    score.excellence.autoDetectable = score.score >= this.PHILOSOPHY.AUTO_THRESHOLD;
    score.excellence.championshipGrade = score.score >= this.PHILOSOPHY.EXCELLENCE_THRESHOLD;
    score.excellence.bestPractices = this.checkBestPractices(fafData);

    // Generate improvements based on score
    this.generateImprovements(score, fafData);

    // The Final 1% - Only if requested and score is 99
    if (options?.requestAiValidation && score.score === 99) {
      score.aiValidation = await this.requestAiValidation(fafData);
      if (score.aiValidation?.bestPracticeScore === 1) {
        score.score = 100;  // The only way to achieve 100%
        score.philosophy = "100% Achieved - AI-validated championship perfection!";
      }
    }

    return score;
  }

  /**
   * Score Project Identity (3 slots)
   */
  private static scoreProjectIdentity(fafData: any): SlotSection {
    const section: SlotSection = {
      name: 'Project Identity',
      filled: 0,
      total: 3,
      percentage: 0,
      missing: []
    };

    // Check the 3 identity slots
    if (fafData.project?.name) section.filled++;
    else section.missing.push('project.name');

    if (fafData.project?.goal) section.filled++;
    else section.missing.push('project.goal');

    if (fafData.project?.main_language &&
        fafData.project.main_language !== 'Unknown') section.filled++;
    else section.missing.push('project.main_language');

    section.percentage = Math.round((section.filled / section.total) * 100);
    return section;
  }

  /**
   * Score Stack Architecture (6 slots from Original 21)
   */
  private static scoreStackArchitecture(fafData: any): SlotSection {
    const section: SlotSection = {
      name: 'Stack Architecture',
      filled: 0,
      total: 6,
      percentage: 0,
      missing: []
    };

    // The Original 6 stack slots (not the extended 12+)
    const original6 = ['frontend', 'backend', 'runtime', 'build', 'package_manager', 'api_type'];

    original6.forEach(field => {
      if (fafData.stack?.[field] &&
          fafData.stack[field] !== 'None' &&
          fafData.stack[field] !== 'Unknown') {
        section.filled++;
      } else {
        section.missing.push(`stack.${field}`);
      }
    });

    section.percentage = Math.round((section.filled / section.total) * 100);
    return section;
  }

  /**
   * Score Performance Metrics (3 slots)
   */
  private static scorePerformanceMetrics(fafData: any): SlotSection {
    const section: SlotSection = {
      name: 'Performance Metrics',
      filled: 0,
      total: 3,
      percentage: 0,
      missing: []
    };

    if (fafData.scores?.foundation > 0) section.filled++;
    else section.missing.push('scores.foundation');

    if (fafData.scores?.architecture > 0) section.filled++;
    else section.missing.push('scores.architecture');

    if (fafData.scores?.deployment > 0) section.filled++;
    else section.missing.push('scores.deployment');

    section.percentage = Math.round((section.filled / section.total) * 100);
    return section;
  }

  /**
   * Score AI Context (3 slots)
   */
  private static scoreAiContext(fafData: any): SlotSection {
    const section: SlotSection = {
      name: 'AI Context',
      filled: 0,
      total: 3,
      percentage: 0,
      missing: []
    };

    if (fafData.ai?.context_file) section.filled++;
    else section.missing.push('ai.context_file');

    if (fafData.preferences?.quality_bar) section.filled++;
    else section.missing.push('preferences.quality_bar');

    if (fafData.state?.phase) section.filled++;
    else section.missing.push('state.phase');

    section.percentage = Math.round((section.filled / section.total) * 100);
    return section;
  }

  /**
   * Score Human Context (The 6 W's)
   */
  private static scoreHumanContext(fafData: any): SlotSection {
    const section: SlotSection = {
      name: 'Human Context (6 Ws)',
      filled: 0,
      total: 6,
      percentage: 0,
      missing: []
    };

    const sixWs = ['who', 'what', 'why', 'where', 'when', 'how'];

    sixWs.forEach(w => {
      const value = fafData.human_context?.[w];
      if (value && value !== 'Not specified' &&
          (typeof value === 'string' || typeof value === 'object')) {
        section.filled++;
      } else {
        section.missing.push(`human_context.${w} (${w.toUpperCase()})`);
      }
    });

    section.percentage = Math.round((section.filled / section.total) * 100);
    return section;
  }

  /**
   * Apply quality modifiers that can reduce score
   */
  private static applyQualityModifiers(baseScore: number, fafData: any, score: ChampionshipScore): number {
    let modifiedScore = baseScore;

    // Penalty for stale timestamp (over 30 days old)
    if (fafData.generated || fafData.project?.generated) {
      const generated = new Date(fafData.generated || fafData.project?.generated);
      const daysSinceGenerated = (Date.now() - generated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceGenerated > 30) {
        modifiedScore -= 5;
        score.improvements.recommended.push('Update .faf file (over 30 days old)');
      }
    }

    // Penalty for no AI instructions (important for AI context)
    if (!fafData.ai_instructions && modifiedScore > 70) {
      modifiedScore -= 3;
      score.improvements.recommended.push('Add ai_instructions for better AI collaboration');
    }

    // Bonus for having TURBO-CAT discovery data
    if (fafData.turbo_cat?.discovered_formats?.length > 50) {
      modifiedScore = Math.min(99, modifiedScore + 2);
    }

    return Math.max(0, modifiedScore);
  }

  /**
   * Check if project follows best practices
   */
  private static checkBestPractices(fafData: any): boolean {
    const practices = [
      fafData.preferences?.quality_bar === 'zero_errors',
      fafData.preferences?.testing === 'required',
      fafData.state?.phase !== undefined,
      fafData.ai?.context_file === 'CLAUDE.md',
      fafData.project?.main_language !== 'Unknown',
    ];

    const followedCount = practices.filter(p => p).length;
    return followedCount >= 4;  // At least 4/5 best practices
  }

  /**
   * Generate improvement suggestions based on score
   */
  private static generateImprovements(score: ChampionshipScore, fafData: any): void {
    // Critical improvements (blocking 70%+)
    if (score.score < 70) {
      if (score.sections.projectIdentity.filled < 2) {
        score.improvements.critical.push('Define project identity (name, goal, language)');
      }
      if (score.sections.humanContext.filled < 3) {
        score.improvements.critical.push('Add human context (WHO, WHAT, WHY minimum)');
      }
      if (score.sections.stackArchitecture.filled < 3) {
        score.improvements.critical.push('Specify tech stack (frontend, backend, build minimum)');
      }
    }

    // Recommended improvements (blocking 90%+)
    if (score.score < 90) {
      score.sections.humanContext.missing.forEach(field => {
        score.improvements.recommended.push(`Add ${field}`);
      });

      if (!fafData.ai_instructions) {
        score.improvements.recommended.push('Add AI instructions for optimal collaboration');
      }
    }

    // Optional improvements (the pursuit of 99%)
    if (score.score < 99) {
      if (!fafData.preferences?.commit_style) {
        score.improvements.optional.push('Define commit style preference');
      }
      if (!fafData.state?.next_milestone) {
        score.improvements.optional.push('Set next milestone');
      }
      // Only suggest the truly optional extended fields
      if (score.originalSlots.filled === 21) {
        score.improvements.optional.push('All 21 slots filled! Consider adding extended context');
      }
    }
  }

  /**
   * Request AI validation for the final 1%
   * This is where AI judges if the project meets best practices
   */
  private static async requestAiValidation(fafData: any): Promise<ChampionshipScore['aiValidation']> {
    // In a real implementation, this would call an AI service
    // For now, we'll simulate the validation logic

    const validation = {
      assessed: true,
      bestPracticeScore: 0,
      reasoning: '',
      timestamp: new Date().toISOString()
    };

    // AI checks for championship-grade patterns
    const checks = {
      hasZeroErrors: fafData.preferences?.quality_bar === 'zero_errors',
      hasRequiredTesting: fafData.preferences?.testing === 'required',
      hasClaudeContext: fafData.ai?.context_file === 'CLAUDE.md',
      hasClearGoal: fafData.project?.goal?.length > 20,
      hasCompleteDocs: fafData.human_context?.what && fafData.human_context?.why,
      followsConventions: fafData.preferences?.commit_style !== undefined,
      hasProperStructure: fafData.state?.phase !== undefined,
    };

    const passedChecks = Object.values(checks).filter(c => c).length;
    const totalChecks = Object.keys(checks).length;

    // AI grants the 1% only for true excellence
    if (passedChecks === totalChecks) {
      validation.bestPracticeScore = 1;
      validation.reasoning = "Championship-grade project meeting all best practices. The final 1% granted.";
    } else {
      validation.bestPracticeScore = passedChecks / totalChecks;
      validation.reasoning = `Good project, but not quite championship grade. ${passedChecks}/${totalChecks} best practices met.`;
    }

    return validation;
  }

  /**
   * The 99% Philosophy Summary
   */
  static getPhilosophy(): string {
    return `
🏆 THE 99% PHILOSOPHY

"My race-strategy in-fact design-for-life is 99% -
 the last 1% is the futile pursuit of perfection which defies definition.
 I gave the 1% to Claude to fathom."

SCORING REALITY:
• 0-29%   = Needs work
• 30-49%  = Getting there
• 50-69%  = Solid foundation
• 70-89%  = Good project
• 90-98%  = Excellent project
• 99%     = Maximum human achievement
• 100%    = AI-validated perfection (rare)

REMEMBER:
- Don't chase undefined perfection
- Build excellence you can measure
- Ship at 99% and move to the next
- Let AI ponder the philosophical 1%

"One man's perfection is 1000 others' imperfection"

FAF: Built to measure a million projects with wisdom.
.faf is inevitable - excellence is achievable.
`;
  }
}

/**
 * Export the main scoring function for compatibility
 */
export async function calculateChampionshipScore(
  fafData: any,
  projectPath?: string,
  requestAiValidation?: boolean
): Promise<ChampionshipScore> {
  return ChampionshipScorer.score(fafData, {
    projectPath,
    requestAiValidation
  });
}

// Export for backwards compatibility
export default ChampionshipScorer;