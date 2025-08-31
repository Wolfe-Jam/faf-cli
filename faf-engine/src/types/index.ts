/**
 * 🎯 .faf-engine Type Definitions
 * Universal types for platform-agnostic Context-On-Demand
 */

// Core .faf Data Structure
export interface FafData {
  // AI-First Scoring
  ai_scoring_system?: string;
  ai_score?: string;
  ai_confidence?: string;
  
  // Instant Context
  instant_context?: {
    what_building: string;
    tech_stack: string;
    main_language: string;
    deployment: string;
    key_files: string[];
  };
  
  // Project Details
  project?: {
    name: string;
    goal: string;
    main_language: string;
    generated: string;
  };
  
  // Technical Stack
  stack?: {
    frontend?: string;
    css_framework?: string;
    ui_library?: string;
    state_management?: string;
    backend?: string;
    runtime?: string;
    database?: string;
    build?: string;
    package_manager?: string;
    api_type?: string;
    hosting?: string;
    cicd?: string;
  };
  
  // Human Context (6 W's)
  human_context?: {
    who?: string;
    what?: string;
    why?: string;
    where?: string;
    when?: string;
    how?: string;
  };
  
  // Files & Intelligence
  files?: FileIntelligence[];
  
  // Additional fields
  [key: string]: any;
}

// File Intelligence
export interface FileIntelligence {
  path: string;
  type: string;
  purpose: string;
  intelligenceBonus: number;
  framework?: string;
}

// Scoring Result
export interface FafScore {
  totalScore: number;
  filledSlots: number;
  totalSlots: number;
  sectionScores: Record<string, SectionScore>;
  suggestions: string[];
  confidence: 'LOW' | 'MODERATE' | 'GOOD' | 'HIGH' | 'VERY_HIGH';
}

export interface SectionScore {
  percentage: number;
  filled: number;
  total: number;
  missing: string[];
}

// Validation Result
export interface FafValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score?: FafScore;
}

// Engine Configuration
export interface EngineOptions {
  projectDir?: string;
  platform?: 'cli' | 'vercel' | 'web' | 'custom';
  adapter?: PlatformAdapter;
  cache?: boolean;
  verbose?: boolean;
  strict?: boolean;
}

// Platform Adapter Interface
export interface PlatformAdapter {
  name: string;
  initialize(): Promise<void>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  findFiles(pattern: string): Promise<string[]>;
  getProjectRoot(): string;
  getEnvironment(): Record<string, string>;
}

// Engine Configuration
export interface FafConfig {
  version: string;
  engineName: string;
  platform: string;
  features: {
    fabFormats: boolean;
    contextOnDemand: boolean;
    aiEnhancement: boolean;
    autoDiscovery: boolean;
  };
  scoring: {
    method: 'slot-based' | 'weighted' | 'hybrid';
    minScore: number;
    maxScore: number;
  };
}

// Format Discovery
export interface FormatDiscovery {
  fileName: string;
  formatType: string;
  frameworks: string[];
  slotMappings: Record<string, string>;
  priority: number;
  intelligence: 'low' | 'medium' | 'high' | 'very-high' | 'ultra-high';
  confirmed: boolean;
  filePath: string;
}

// Context-On-Demand Result
export interface ContextOnDemandResult {
  context: FafData;
  score: FafScore;
  discovery: FormatDiscovery[];
  recommendations: string[];
  confidence: number;
}