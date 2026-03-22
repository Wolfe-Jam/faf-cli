// All shared TypeScript types for faf-cli v6

/** State of a single slot in a .faf file */
export type SlotState = 'populated' | 'empty' | 'slotignored';

/** Category grouping for slots */
export type SlotCategory =
  | 'project'
  | 'human'
  | 'frontend'
  | 'backend'
  | 'universal'
  | 'enterprise_infra'
  | 'enterprise_app'
  | 'enterprise_ops';

/** A single slot definition */
export interface SlotDef {
  /** Slot number (1-33) */
  index: number;
  /** Dot-path in .faf YAML (e.g. "project.name") */
  path: string;
  /** Human description */
  description: string;
  /** Category this slot belongs to */
  category: SlotCategory;
}

/** Result from WASM kernel score_faf / score_faf_enterprise */
export interface KernelScoreResult {
  score: number;
  tier: string;
  populated: number;
  empty: number;
  ignored: number;
  active: number;
  total: number;
  slots: Record<string, SlotState>;
}

/** Enriched score result for display */
export interface ScoreResult {
  score: number;
  tier: TierInfo;
  populated: number;
  empty: number;
  ignored: number;
  active: number;
  total: number;
  slots: Record<string, SlotState>;
}

/** Tier boundary info */
export interface TierInfo {
  name: string;
  threshold: number;
  /** Display indicator (branded glyphs + ANSI color) */
  indicator: string;
}

/** Parsed .faf file data */
export interface FafData {
  faf_version?: string;
  project?: {
    name?: string;
    goal?: string;
    main_language?: string;
    type?: string;
    [key: string]: unknown;
  };
  stack?: Record<string, unknown>;
  human_context?: Record<string, unknown>;
  monorepo?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  [key: string]: unknown;
}

/** FAFb binary info from kernel */
export interface FafbInfo {
  header: {
    magic: string;
    version: number;
    flags: number;
    section_count: number;
    crc32: number;
  };
  sections: Array<{
    name: string;
    priority: number;
    offset: number;
    length: number;
    classification: string;
  }>;
  content?: string;
}

/** Framework detection result */
export interface DetectedFramework {
  name: string;
  slug: string;
  category: string;
  confidence: number;
  version?: string;
}

/** Signal types for framework detection */
export type SignalType = 'dependency' | 'file' | 'devDependency';

export interface Signal {
  type: SignalType;
  key?: string;
  pattern?: string;
}

export interface FrameworkSignature {
  name: string;
  slug: string;
  category: string;
  signals: Signal[];
}
