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
}

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
  if (trimmed.length > EXTRACTION_LIMITS.MAX_LENGTH) {return false;}
  if (SLOP_PATTERNS.some((re) => re.test(trimmed))) {return false;}
  // Reject if text is mostly markdown structure (links, lists, tables)
  if (/^[\s|\-*+]/.test(trimmed)) {return false;}
  if (trimmed.split('\n').length > 4) {return false;} // multi-paragraph blob
  return true;
}
