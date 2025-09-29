/**
 * Public Types for FAF Engine MK3
 * These are the only types exposed to consumers
 */

export interface ScoreResult {
  score: number;           // 0-105
  checksum: string;       // Verification hash
  timestamp: number;      // Unix timestamp
  performance: number;    // Time taken in ms
  grade?: string;         // Optional grade (Bronze/Silver/Gold/Trophy)
}

export interface AnalysisResult {
  formats: FormatInfo[];
  intelligence: IntelligenceData;
  quality: QualityInfo;
  performanceMs: number;
}

export interface CompileResult {
  score: ScoreResult;
  analysis: AnalysisResult;
  verification: VerificationInfo;
}

export interface EngineOptions {
  projectDir?: string;
  verbose?: boolean;
  includeAnalysis?: boolean;
}

// Simplified public types (hiding implementation details)
export interface FormatInfo {
  type: string;
  count: number;
  quality: string;
}

export interface IntelligenceData {
  extracted: boolean;
  confidence: number;
  stack?: string[];
}

export interface QualityInfo {
  level: string;
  score: number;
}

export interface VerificationInfo {
  valid: boolean;
  checksum: string;
  engine: string;
}