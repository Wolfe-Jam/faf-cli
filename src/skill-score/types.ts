// Types for the WJTTC skill-scorer (static grade + safety gate).
// Ported from faf-skill-scorer (rules.mjs / engine.mjs) — the STATIC half of the
// WJTTC suite (BRAKE / AERO / static-PIT). Behavioral modules (ENGINE / TYRE) are
// declared for transparency but are NOT statically scored — they are the ACTIVATION
// gate, which a CLI command cannot run (no agent harness) → always 'pending' here.

/** A single rule's verdict. `na` = not applicable (excluded from the fraction). */
export type Verdict = 'pass' | 'fail' | 'beat' | 'na';

/** State of a headline gate. `pending` = not yet evaluated (the CLI activation gate). */
export type GateState = 'pass' | 'fail' | 'pending';

/** The three statically-scored WJTTC modules. */
export type ModuleName = 'BRAKE' | 'AERO' | 'PIT';

/** The pinned command + tool surface a skill's ghost-checks resolve against. */
export interface Inventory {
  version: string;
  faf_commands: string[];
  mcp_tools: string[];
}

/** The loaded skill + scoring context a rule reads. */
export interface SkillContext {
  dir: string;
  name: string;
  raw: string;
  fm: Record<string, string>;
  fmKeys: string[];
  body: string;
  /** Code spans (fenced blocks + inline backticks) joined with a ` ;; ` sentinel. */
  code: string;
  lines: number;
  tokens: number;
  /** references/ · scripts/ · assets/ paths the body points at. */
  refs: string[];
  fileExists: (rel: string) => boolean;
  inv: Inventory;
}

/** What a rule returns when run. */
export interface RuleResult {
  verdict: Verdict;
  detail: string;
  fix?: string;
}

/** A single static rule (data, not buried logic — append to teach the scorer). */
export interface Rule {
  id: string;
  module: ModuleName;
  title: string;
  /** A fatal rule failing trips the SAFETY gate (off the grid). */
  fatal?: boolean;
  /** A sign-off rule failing needs human review (does not gate). */
  signoff?: boolean;
  run(ctx: SkillContext): RuleResult;
}

/** A scored rule row. */
export interface Row {
  id: string;
  module: ModuleName;
  title: string;
  verdict: Verdict;
  detail: string;
  fix?: string;
  fatal: boolean;
  signoff: boolean;
}

/** Aggregated score for one module. */
export interface ModuleScore {
  score: number;
  max: number;
  frac: number;
  rows: Row[];
  applicable: number;
  passed: number;
  fatalFail: boolean;
}

/** The two headline gates of the gate model. */
export interface Gates {
  safety: GateState;
  activation: GateState;
  activationRuns: string | null;
}

/** A behavioral module — declared, not statically scored. */
export interface BehavioralModule {
  module: string;
  weight: number;
  title: string;
}

/** Resolved tier name + work-surface symbol (✪ ★ ◆ ◇ ● ○ ♡ — never 🏆 on work surfaces). */
export interface TierMark {
  name: string;
  symbol: string;
}

/** The full scorer output. */
export interface ScorerOutput {
  scorerVersion: string;
  invVersion: string;
  skill: string;
  modScores: Record<string, ModuleScore>;
  /** 0-100 — the durable, readable static grade (weights sum to 100). */
  grade: number;
  gradeMax: number;
  staticSubtotal: number;
  staticMax: number;
  gates: Gates;
  /** grade===100 && safety pass && activation pass — always false here (activation pending). */
  flies: boolean;
  behavioral: BehavioralModule[];
  tier: TierMark;
  nextTier: TierMark | null;
  fatal: boolean;
  signoffs: Row[];
  /** Back-compat alias for `grade`. */
  provisional: number;
}
