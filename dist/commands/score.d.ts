/**
 * 🎯 faf score - Scoring Command
 * Calculates .faf completeness score with detailed breakdown
 */
interface ScoreOptions {
    details?: boolean;
    minimum?: string;
}
export declare function scoreFafFile(file?: string, options?: ScoreOptions): Promise<void>;
export {};
//# sourceMappingURL=score.d.ts.map