/**
 * 🎯 .faf Scoring Calculator
 * Advanced scoring algorithm based on your stone-cold testing feedback
 */
export interface SectionScore {
    percentage: number;
    filled: number;
    total: number;
    missing: string[];
}
export interface ScoreResult {
    totalScore: number;
    filledSlots: number;
    totalSlots: number;
    sectionScores: Record<string, SectionScore>;
    suggestions: string[];
    qualityIndicators: {
        hasAiInstructions: boolean;
        hasHumanContext: boolean;
        hasFreshTimestamp: boolean;
        hasQualityPreferences: boolean;
    };
}
/**
 * Calculate comprehensive .faf score
 */
export declare function calculateFafScore(fafData: any): ScoreResult;
//# sourceMappingURL=score-calculator.d.ts.map