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
    // Mk4 canonical names with old-name fallback
    const fw = data.stack?.framework || data.stack?.frontend;
    if (fw && fw !== 'None') filledSlots++;
    const css = data.stack?.css || data.stack?.css_framework;
    if (css && css !== 'None') filledSlots++;
    if (data.stack?.ui_library && data.stack.ui_library !== 'None') filledSlots++;
    const st = data.stack?.state || data.stack?.state_management;
    if (st && st !== 'None') filledSlots++;
    if (data.stack?.backend && data.stack.backend !== 'None') filledSlots++;
    if (data.stack?.runtime && data.stack.runtime !== 'None') filledSlots++;
    const db = data.stack?.db || data.stack?.database;
    if (db && db !== 'None') filledSlots++;
    if (data.stack?.build && data.stack.build !== 'None') filledSlots++;
    const pm = data.stack?.pkg_manager || data.stack?.package_manager;
    if (pm && pm !== 'npm') filledSlots++;
    const api = data.stack?.api || data.stack?.api_type;
    if (api && api !== 'REST') filledSlots++;
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