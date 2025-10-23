/**
 * BIG ORANGE 🍊 - Core Types
 * Domain model for .faf context comparison
 */

export interface ProjectAnalysis {
  path: string;
  birthScore: number;              // Current .faf completeness (0-100)
  championshipScore: number;       // Target score (typically 99)
  gaps: Gap[];
  timestamp: Date;
}

export interface Gap {
  category: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  impact: string;
}

export interface ComparisonRequest {
  projectPath?: string;
  leftScore: number;               // Adjustable score (default: birthScore or 0)
  rightScore: number;              // Adjustable score (default: 99)
  prompt: string;
}

export interface ComparisonResults {
  sessionId: string;
  timestamp: Date;
  projectAnalysis?: ProjectAnalysis;
  leftWindow: WindowResults;
  rightWindow: WindowResults;
  delta: DeltaMetrics;
}

export interface WindowResults {
  fafScore: number;                // 0-100, from FafCompiler
  aiResponse: string;              // Raw Claude response
  timeToComplete: number;          // Seconds
  emoji: string;                   // Championship emoji from FafCompiler
  fafMetadata?: {                  // Optional: from FafCompiler
    filled: number;
    total: number;
    checksum: string;
  };
}

export interface DeltaMetrics {
  timeSaved: number;               // Seconds (left - right)
  scoreImprovement: number;        // Percentage points (right - left)
  verdict: string;                 // Human-readable summary
}

export interface FafInstance {
  score: number;                   // 0-100 completeness
  content: string;                 // Generated .faf file content
  metadata: {
    framework?: string;
    language?: string;
    styling?: string;
    patterns?: string[];
    conventions?: string[];
    quality_bar?: string;
    slots_filled?: number;
    total_slots?: number;
  };
}
