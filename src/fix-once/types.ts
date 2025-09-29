/**
 * 🏗️ FIX-ONCE Type Registry
 * Single source of truth for all types in FAF CLI
 *
 * APPROVAL REQUIRED TO MODIFY THIS FILE
 * This registry prevents type conflicts and cascade errors
 * Fix once = Works indefinitely
 */

// ============================================
// CORE ENGINE TYPES
// ============================================

/**
 * FAB-FORMATS Analysis Result
 * The new championship engine output
 */
export interface FabFormatsAnalysis {
  discoveredFormats: FormatInfo[];
  technicalStack: TechnologyStack;
  humanContext: HumanContext;
  intelligenceScore: number;
  performanceMs: number;
  filesProcessed: number;
  quality: QualityAssessment;
}

/**
 * Legacy compatibility - maps old to new
 * Prevents breaking existing code
 */
export type TurboCatAnalysis = FabFormatsAnalysis;

export interface FormatInfo {
  fileName: string;
  formatType: string;
  fileType: 'code' | 'config' | 'doc' | 'data' | 'test';
  intelligenceBonus: number;
  quality?: 'EXCEPTIONAL' | 'PROFESSIONAL' | 'GOOD' | 'BASIC' | 'MINIMAL';
}

export interface TechnologyStack {
  frontend?: string;
  backend?: string;
  database?: string;
  runtime?: string;
  buildTool?: string;
  packageManager?: string;
  testing?: string;
  cicd?: string;
  cloud?: string;
}

export interface HumanContext {
  who?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  what?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  why?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  where?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  when?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  how?: { value: string; confidence: 'CERTAIN' | 'PROBABLE' | 'INFERRED' };
  additionalContext?: Record<string, any>;
  contextScore: number;
  totalPRDScore: number;
  successRate: string;
}

export interface QualityAssessment {
  grade: 'EXCEPTIONAL' | 'PROFESSIONAL' | 'GOOD' | 'BASIC' | 'MINIMAL';
  score: number;
  improvements: string[];
}

// ============================================
// SCORING TYPES
// ============================================

export interface FafScore {
  totalScore: number;
  breakdown: ScoreBreakdown;
  balance: BalanceData;
  recommendations: string[];
  timestamp: Date;
}

export interface ScoreBreakdown {
  technical: number;      // 0-100
  human: number;          // 0-100
  freshness: number;      // 0-100
  completeness: number;   // 0-100
}

export interface BalanceData {
  aiPercentage: number;
  humanPercentage: number;
  isBalanced: boolean;
}

// ============================================
// TRUST TYPES
// ============================================

export interface TrustScore {
  overall: number;
  contextCompleteness: number;
  aiCompatibility: number;
  freshnessScore: number;
  verificationStatus: 'verified' | 'unverified' | 'failed';
}

export interface TrustDashboardOptions {
  detailed?: boolean;
  confidence?: boolean;
  garage?: boolean;
  panic?: boolean;
  quality?: boolean;
}

// ============================================
// DROP COACH TYPES
// ============================================

export interface CoachingMessage {
  text: string;
  type: 'ai' | 'human' | 'system' | 'trust';
  priority: number;
}

export interface FileTypePriority {
  pattern: string;
  name: string;
  value: number;
  reason: string;
  category: 'foundation' | 'framework' | 'quality' | 'deployment';
}

export interface ProcessedFile {
  fileName: string;
  fileType: string;
  intelligenceBonus: number;
}

// ============================================
// COMMAND TYPES
// ============================================

export interface CommandOptions {
  force?: boolean;
  detailed?: boolean;
  output?: string;
  template?: string;
  minimum?: string;
  format?: 'json' | 'yaml' | 'text';
  color?: boolean;
}

export interface InitOptions extends CommandOptions {
  projectType?: string;
  skipIgnore?: boolean;
}

export interface ScoreOptions extends CommandOptions {
  details?: boolean;
  minimum?: string;
}

export interface TrustOptions extends TrustDashboardOptions {
  // Extends from TrustDashboardOptions
}

// ============================================
// FAF FILE TYPES
// ============================================

export interface FafFile {
  ai_scoring_system: string;
  ai_score: string;
  ai_confidence: string;
  ai_value: string;
  ai_tldr: {
    project: string;
    stack: string;
    quality_bar: string;
    current_focus: string;
    your_role: string;
  };
  instant_context: {
    what_building: string;
    tech_stack: string;
    main_language: string;
    deployment: string;
    key_files: string[];
  };
  context_quality: {
    slots_filled: string;
    ai_confidence: string;
    handoff_ready: boolean;
    missing_context: string[];
  };
  project: ProjectInfo;
  ai_instructions: AIInstructions;
  stack: TechnologyStack;
  preferences: Preferences;
  state: ProjectState;
  tags: Tags;
  human_context?: HumanContext;
  ai_scoring_details: ScoringDetails;
}

export interface ProjectInfo {
  name: string;
  goal: string;
  main_language: string;
  generated: string;
  mission: string;
  revolution: string;
  brand: string;
}

export interface AIInstructions {
  priority_order: string[];
  working_style: {
    code_first: boolean;
    explanations: string;
    quality_bar: string;
    testing: string;
  };
  warnings: string[];
}

export interface Preferences {
  quality_bar: string;
  commit_style: string;
  response_style: string;
  explanation_level: string;
  communication: string;
  testing: string;
  documentation: string;
}

export interface ProjectState {
  phase: string;
  version: string;
  focus: string;
  status: string;
  next_milestone: string;
  blockers: string[];
}

export interface Tags {
  auto_generated: string[];
  smart_defaults: string[];
  user_defined: string[];
}

export interface ScoringDetails {
  system_date: string;
  slot_based_percentage: number;
  ai_score: number;
  total_slots: number;
  filled_slots: number;
  scoring_method: string;
  trust_embedded: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// ============================================
// EXPORT ALIASES FOR COMPATIBILITY
// ============================================

// Old names mapped to new types - prevents breaking changes
export type Analysis = FabFormatsAnalysis;
export type Score = FafScore;
export type Trust = TrustScore;
export type Context = HumanContext;
export type Stack = TechnologyStack;

/**
 * CASCADE EFFECTS OF THIS MODULE:
 *
 * 1. Fixes ALL TypeScript type errors immediately
 * 2. Provides single source of truth for types
 * 3. Enables safe refactoring (change once, update everywhere)
 * 4. Prevents type conflicts between modules
 * 5. Makes IDE autocomplete work perfectly
 * 6. Simplifies testing (clear type contracts)
 * 7. Documents expected data structures
 * 8. Enables type-safe communication between modules
 *
 * MAINTENANCE: All types should be defined HERE
 * Individual modules should ONLY import from this registry
 */