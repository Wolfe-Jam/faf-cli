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
  /** Dot-path in .faf YAML (e.g. "project.name") — current on-wire identifier
   *  used for read/write and kernel scoring. */
  path: string;
  /** Mk4 canonical dot-path (forward spec). Defined for slots where the
   *  current `path` is a legacy name pending lockstep rename with
   *  faf-scoring-kernel + xai-faf-rust. See issue #66. */
  canonical?: string;
  /** Human description */
  description: string;
  /** Canonical short display label for emitted AI-context files (CLAUDE / AGENTS /
   *  copilot-instructions / GEMINI / .cursorrules). The single source of truth for
   *  how a slot is labelled — e.g. `cicd` → "CI/CD", `api_type` → "API". */
  label?: string;
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
  /**
   * When true, the score is INHERITED from a source codebase (declared via
   * `app_type: about` + `about.source_score` in project.faf). The scorer
   * did NOT calculate this — the owner attested to it. About Repos are
   * documentation surfaces, not apps.
   *
   * Set by scoreFafYaml when the input declares `app_type: about`.
   * Consumers (TAF receipt generation, display logic) should distinguish
   * inherited scores from calculated ones — they're qualitatively different
   * artifacts. See memory/private-source-public-about-pattern.md.
   */
  inherited?: boolean;
  /**
   * For inherited scores: the owner/repo the About Repo represents.
   * Format: "owner/repo" (e.g. "Wolfe-Jam/faf-mcpaas"). Required when
   * `inherited: true` per schema validation.
   */
  represents?: string;
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
  /**
   * Top-level app_type — drives slot selection in APP_TYPE_CATEGORIES.
   * Special value `'about'` is a non-app representation (see `about` block).
   */
  app_type?: string;
  /**
   * About Repo declaration block. Present when `app_type: about`. Lets the
   * repo represent a private codebase: scorer short-circuits and emits
   * `source_score` as the score. See memory/private-source-public-about-pattern.md.
   */
  about?: {
    /** Required: "owner/repo" pointing at the private source codebase. */
    represents?: string;
    /** Optional: owner-attested score of the source (0-100). Missing = score "—". */
    source_score?: number;
  };
  stack?: Record<string, unknown>;
  human_context?: Record<string, unknown>;
  monorepo?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  // FAFB top-level keys (read by faf-rust-sdk's compile_fafb to produce
  // multi-section binaries instead of META-only).
  /** TECH_STACK section content — flat list of technology components */
  tech_stack?: string[];
  /** KEY_FILES section — list of important file paths */
  key_files?: string[];
  /** COMMANDS section — build/test/lint/dev command map */
  commands?: Record<string, string>;
  /** ARCHITECTURE section — free-form structural description (user-fill) */
  architecture?: string;
  /** CONTEXT section — free-form additional signal (user-fill, NOT human_context) */
  context?: string;
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
