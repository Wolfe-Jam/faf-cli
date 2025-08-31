/**
 * Score Calculator for .faf data
 */

import type { FafData, FafScore, SectionScore } from '../types';

export class ScoreCalculator {
  calculate(data: FafData): FafScore {
    // Check for embedded score first (COUNT ONCE architecture)
    if (data.ai_score && data.ai_scoring_system === '2025-08-30') {
      const embeddedScore = parseInt(data.ai_score.toString().replace('%', ''));
      return {
        totalScore: embeddedScore,
        filledSlots: data.ai_scoring_details?.filled_slots || 0,
        totalSlots: data.ai_scoring_details?.total_slots || 21,
        sectionScores: {},
        suggestions: [],
        confidence: this.getConfidenceLevel(embeddedScore)
      };
    }
    
    // Calculate score from slots
    let filledSlots = 0;
    const totalSlots = 21; // Base slots (15 PC + 6 PD)
    
    // Count Project Components (15 slots)
    if (data.project?.name) filledSlots++;
    if (data.project?.goal) filledSlots++;
    if (data.project?.main_language) filledSlots++;
    if (data.stack?.frontend && data.stack.frontend !== 'None') filledSlots++;
    if (data.stack?.css_framework && data.stack.css_framework !== 'None') filledSlots++;
    if (data.stack?.ui_library && data.stack.ui_library !== 'None') filledSlots++;
    if (data.stack?.state_management && data.stack.state_management !== 'None') filledSlots++;
    if (data.stack?.backend && data.stack.backend !== 'None') filledSlots++;
    if (data.stack?.runtime && data.stack.runtime !== 'None') filledSlots++;
    if (data.stack?.database && data.stack.database !== 'None') filledSlots++;
    if (data.stack?.build && data.stack.build !== 'None') filledSlots++;
    if (data.stack?.package_manager && data.stack.package_manager !== 'npm') filledSlots++;
    if (data.stack?.api_type && data.stack.api_type !== 'REST') filledSlots++;
    if (data.stack?.hosting && data.stack.hosting !== 'None') filledSlots++;
    if (data.stack?.cicd && data.stack.cicd !== 'None') filledSlots++;
    
    // Count Human Context (6 slots)
    if (data.human_context?.who && data.human_context.who !== 'Not specified') filledSlots++;
    if (data.human_context?.what && data.human_context.what !== 'Not specified') filledSlots++;
    if (data.human_context?.why && data.human_context.why !== 'Not specified') filledSlots++;
    if (data.human_context?.where && data.human_context.where !== 'Not specified') filledSlots++;
    if (data.human_context?.when && data.human_context.when !== 'Not specified') filledSlots++;
    if (data.human_context?.how && data.human_context.how !== 'Not specified') filledSlots++;
    
    const totalScore = Math.round((filledSlots / totalSlots) * 100);
    
    return {
      totalScore,
      filledSlots,
      totalSlots,
      sectionScores: this.calculateSectionScores(data),
      suggestions: this.generateSuggestions(data, filledSlots, totalSlots),
      confidence: this.getConfidenceLevel(totalScore)
    };
  }
  
  private calculateSectionScores(_data: FafData): Record<string, SectionScore> {
    return {
      project_components: {
        percentage: 0,
        filled: 0,
        total: 15,
        missing: []
      },
      project_details: {
        percentage: 0,
        filled: 0,
        total: 6,
        missing: []
      }
    };
  }
  
  private generateSuggestions(_data: FafData, filled: number, total: number): string[] {
    const suggestions: string[] = [];
    if (filled < total) {
      suggestions.push(`Add ${total - filled} more context slots`);
    }
    return suggestions;
  }
  
  private getConfidenceLevel(score: number): 'LOW' | 'MODERATE' | 'GOOD' | 'HIGH' | 'VERY_HIGH' {
    if (score >= 90) return 'VERY_HIGH';
    if (score >= 80) return 'HIGH';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'MODERATE';
    return 'LOW';
  }
}