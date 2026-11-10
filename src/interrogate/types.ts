/**
 * Repo interrogation — extract slot content from README, Cargo.toml,
 * package.json, etc., without guessing or substituting generic slop.
 *
 * Contract (per faf-auto-no-guess-no-slop doctrine):
 *   - Each slot has a per-slot evidence anchor
 *   - If the anchor is missing → leave empty (do NOT synthesize from other slots)
 *   - If the anchor is present but content is generic / too long / structural →
 *     leave empty (do NOT settle for slop)
 *   - Empty is honest; wrong is a lie
 *
 * Per goal-is-not-a-6w doctrine:
 *   - `project.goal` is the elevator pitch / use case — its own anchor
 *   - Each `human_context.*` 6W has its own anchor
 *   - No slot inherits from / is split-extracted from another
 */

/** Content extracted from a single source file (README, Cargo.toml, etc.) */
export interface ExtractedContext {
  project?: {
    /** One-line elevator pitch / use case. README first prose paragraph,
     *  ## Use Case section, or Cargo.toml description. */
    goal?: string;
  };
  human_context?: {
    /** Audience — "## Audience" / "for {audience}" patterns */
    who?: string;
    /** What's being built — "## About" / "## Description" / "X is..." */
    what?: string;
    /** Motivation — "## Why" / "## Motivation" / "Problem:" */
    why?: string;
    /** Where it runs — "## Deployment" / "## Where" / install-target */
    where?: string;
    /** Status / timeline — "## Status" / "Production since" / version line */
    when?: string;
    /** Approach — "## Architecture" / "## How it works" */
    how?: string;
  };
  /** Stack facts pulled from real config files (docker-compose services, …).
   *  Higher-precedence than README prose or presence-only guesses for these. */
  stack?: {
    database?: string;
    cache?: string;
    search?: string;
    storage?: string;
    hosting?: string;
    runtime?: string;
  };
  /** Real project commands from Makefile / justfile / Taskfile targets. */
  commands?: Record<string, string>;
  /** Secrets handling — from .env.example / .env.sample presence. */
  security?: {
    secrets?: string;
    example?: string;
  };
}

/** The README headings that hold each slot's fact — one list, shared by the
 *  README interrogator and Relentless. Each is matched as the whole heading
 *  (regex source, case-insensitive). Release / Roadmap are not here: they are
 *  the release process and future plans, not the stage. */
export const SECTION_HEADINGS = {
  goal: ['use\\s+cases?', 'goal'],
  what: ['about', 'description', 'overview', 'purpose', 'what', 'what\\s+is\\s+this', 'what\\s+it\\s+does'],
  who: ['audience', 'users', 'for\\s+whom', 'who', 'who\\s+is\\s+this\\s+for', 'who\\s+it.s\\s+for'],
  why: ['why', 'motivation', 'problem', 'rationale', 'mission', 'vision'],
  where: ['deployment', 'where', 'where\\s+it\\s+runs', 'hosting'],
  when: ['status', 'history', 'timeline', 'since', 'launched'],
  how: ['architecture', 'how', 'how\\s+it\\s+works', 'approach', 'design', 'methodology'],
} as const;

/** Confidence threshold rules for extracted text — empty if violated */
export const EXTRACTION_LIMITS = {
  /** Minimum length for a slot to be considered worth filling (in chars) */
  MIN_LENGTH: 8,
  /** Maximum length — anything longer is documentation, not a slot fill */
  MAX_LENGTH: 280,
} as const;

/** Generic slop patterns — extracted text matching these is rejected */
export const SLOP_PATTERNS: readonly RegExp[] = [
  /^(see|see\s+the?)\s+readme/i,
  /^(tbd|todo|fixme|coming\s+soon)\b/i,
  /^(software|application|app|project|tool|library|framework)\.?$/i,
  /^(for\s+users|for\s+developers)\.?$/i,
  /^(description|goal|name|title)\.?$/i,
  /^lorem\s+ipsum/i,
  /^example(\s+\w+)?\.?$/i,
];

/** Validate extracted text against the no-guess/no-slop doctrine */
export function isValidExtraction(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < EXTRACTION_LIMITS.MIN_LENGTH) {return false;}
  // Too long is documentation, not a slot: rejected, never cut.
  if (trimmed.length > EXTRACTION_LIMITS.MAX_LENGTH) {return false;}
  if (SLOP_PATTERNS.some((re) => re.test(trimmed))) {return false;}
  // Reject if text is mostly markdown structure (links, lists, tables)
  if (/^[\s|\-*+]/.test(trimmed)) {return false;}
  if (trimmed.split('\n').length > 4) {return false;} // multi-paragraph blob
  if (isStructure(trimmed)) {return false;}
  return true;
}

/** The first sentence of `text` — whole, ending at its own full stop — or
 *  null when there is no sentence end. For a first paragraph too long to be
 *  a slot: its opening sentence is usually the fact ("Flask is a lightweight
 *  WSGI web application framework."), and a whole sentence is never a cut. */
export function firstSentence(text: string): string | null {
  // Any word may start the next sentence: tool names are often lowercase
  // ("ripgrep is…", "yq uses…").
  const m = text.trim().match(/^([\s\S]+?[.!?])(?=\s+\S|\s*$)/);
  return m ? m[1].trim() : null;
}

/** Markup, not prose: HTML, a code fence, a setext underline, a list or a
 *  numbered item, a link row, or a list intro ending in ":". None of these is
 *  ever the fact for a slot. */
function isStructure(t: string): boolean {
  if (/<\/?[a-z][\w-]*(\s[^>]*)?\/?>/i.test(t) || /&(?:[a-z]{2,8}|#\d+);/i.test(t)) {return true;}
  if (t.includes('```')) {return true;}
  if (/(^|\s)[-=]{4,}(\s|$)/.test(t)) {return true;}
  if (/^\d+\.\s/.test(t)) {return true;}
  if (/:\s*$/.test(t)) {return true;}
  return linkShare(t) > 0.4;
}

/** The share of `t` taken by markdown links and images. */
function linkShare(t: string): number {
  const links = t.match(/!?\[[^\]]*\]\([^)]*\)/g) ?? [];
  return links.join('').length / t.length;
}
