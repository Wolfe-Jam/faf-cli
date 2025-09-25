/**
 * @faf/core types - Zero dependency type definitions
 */

export interface FafData {
  faf_version?: string;
  format_version?: number;
  project?: {
    name?: string;
    description?: string;
    goal?: string;
  };
  instant_context?: {
    what_building?: string;
    main_language?: string;
    frameworks?: string;
    tech_stack?: string;
    context_for_ai?: string;
  };
  paths?: {
    root?: string;
    src?: string;
    tests?: string;
    config?: string;
  };
  key_files?: Array<{
    path: string;
    purpose?: string;
    ai_instructions?: string;
  }>;
  context_quality?: {
    overall_assessment?: string;
    missing_crucial_info?: string[];
    score?: number;
  };
  metadata?: {
    last_updated?: string;
    generated_by?: string;
    [key: string]: any;
  };
  faf_score?: number;
  faf_slot_percentages?: Record<string, number>;
  [key: string]: any;
}

export interface ScoreResult {
  totalScore: number;
  breakdown: {
    fileScore: number;
    slotScore: number;
    contextScore: number;
    formatBonus: number;
  };
  details: {
    filledSlots: number;
    totalSlots: number;
    keyFiles: number;
    hasContext: boolean;
    hasQuality: boolean;
  };
  recommendations: string[];
}

export interface SlotDefinition {
  required: boolean;
  weight: number;
  description: string;
}