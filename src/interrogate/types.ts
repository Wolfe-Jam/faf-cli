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
 *  (regex source, case-insensitive; groups must be non-capturing). Left out,
 *  because they usually hold a misplaced fact: Release / Roadmap (the release
 *  process, future plans), History (a changelog), Design (visual design),
 *  About (the author), Users (an adopters list). */
export const SECTION_HEADINGS = {
  goal: ['use\\s+cases?', 'goals?'],
  what: ['description', 'overview', 'purpose', 'introduction', 'what', 'what\\s+is\\s+(?!new\\b)\\S+', 'what\\s+it\\s+does'],
  who: ['audience', 'target\\s+audience', 'for\\s+whom', 'who', 'who\\s+is\\s+(?:this|it)\\s+for', 'who\\s+it.s\\s+for'],
  why: ['why', 'why\\s+(?:use\\s+)?(?!not\\b)\\S+', 'motivations?', '(?:the\\s+)?problem', 'rationale', 'mission', 'vision'],
  where: ['deployment', 'where', 'where\\s+it\\s+runs', 'hosting', 'platforms', 'supported\\s+platforms', 'platform\\s+support'],
  when: ['status', '(?:project|current)\\s+status', 'timeline', 'since', 'launched'],
  how: ['architecture', 'how', 'how\\s+it\\s+works', 'how\\s+does\\s+it\\s+work', 'under\\s+the\\s+hood', 'internals', 'approach', 'methodology'],
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
  // Greetings, not facts: "Welcome to…", "To all who come…: welcome."
  /^(welcome|hello|hi|thanks|thank\s+you)\b/i,
  /\bwelcome[.!]?$/i,
  // Legal lines: the licence file says them
  /^(copyright\b|\(c\)|©)/i,
  /\ball\s+rights\s+reserved\b/i,
  /^(licen[cs]ed\s+under|permission\s+is\s+hereby)\b/i,
  // Install and contribute lines: misplaced (commands.*, CONTRIBUTING)
  /\b(npm|pnpm|yarn|bun)\s+(i|install|add)\s|\bpip3?\s+install\s|\bcargo\s+(add|install)\s|\bgo\s+(get|install)\s|\bbrew\s+install\s/i,
  /^please\b/i,
  // A call to action: where to read next, not what the project is
  /\bto get started\b|\bread the (docs|documentation|guide)\b|\bcheck out (the|our)\b/i,
  // A quotation (a motto), not a fact
  /^["“'‘][\s\S]*["”'’]$/,
  // A question is not a fact; a text that runs on (a line broken after a
  // dash or a comma) is a fragment
  /\?$/,
  /(&mdash;|&ndash;|[—–,;]|\s-)\s*$/,
  // A monorepo root's description says where the code is, not the goal
  /^(the\s+)?mono-?repo\s+(for|of|containing|with)\b/i,
];

/** A callout or banner, not a description: a GitHub admonition, a warning
 *  sign, or pre-release phrasing ("Nightly release, expect rough edges"). */
export function isCallout(t: string): boolean {
  return /^\[!/.test(t) || /^(⚠|🚧|❗|⛔|❌|🛑)/u.test(t) ||
    /\b(nightly (release|build)|pre-?release|work[-\s]in[-\s]progress|rough edges|early (access|testing|preview)|use at your own risk|not (yet )?production[-\s]?ready|expect (rough|breaking)|experimental release)\b/i.test(t);
}

/** Lines without a setext title at the top ("Title" over "-----" or
 *  "=====") — it is the title, not the first paragraph. */
export function dropSetextTitle(lines: string[]): string[] {
  const first = lines.findIndex((l) => l.trim() !== '');
  if (first >= 0 && /^[-=]{3,}\s*$/.test(lines[first + 1] ?? '')) {return lines.slice(first + 2);}
  return lines;
}

/** Validate extracted text against the no-guess/no-slop doctrine */
export function isValidExtraction(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < EXTRACTION_LIMITS.MIN_LENGTH) {return false;}
  // Too long is documentation, not a slot: rejected, never cut.
  if (trimmed.length > EXTRACTION_LIMITS.MAX_LENGTH) {return false;}
  if (SLOP_PATTERNS.some((re) => re.test(trimmed))) {return false;}
  // Reject if text is mostly markdown structure (links, lists, tables)
  // A table row or a list item ("**Bold** lead" is prose, not a list)
  if (/^(\||[-*+](\s|$))/.test(trimmed)) {return false;}
  if (trimmed.split('\n').length > 4) {return false;} // multi-paragraph blob
  if (isStructure(trimmed)) {return false;}
  return true;
}

/** The first sentence of `text` — whole, ending at its own full stop — or
 *  null when there is none, or when it is a question (not a fact). For a
 *  first paragraph too long to be a slot: its opening sentence is usually the
 *  fact ("Flask is a lightweight WSGI web application framework."), and a
 *  whole sentence is never a cut. A stop after `e.g.`, `i.e.`, `vs.`, `Dr.`
 *  or an ellipsis does not end it; after `etc.` or initials (`U.S.`) it ends
 *  only when the next word starts a sentence. */
export function firstSentence(text: string): string | null {
  const t = text.trim();
  // Any word may start the next sentence: tool names are often lowercase
  // ("ripgrep is…", "yq uses…").
  const stop = /[.!?…]+(?=\s+\S|\s*$)/g;
  for (let m = stop.exec(t); m; m = stop.exec(t)) {
    const end = m.index + m[0].length;
    const head = t.slice(0, end);
    if (end < t.length) {
      const next = t.slice(end).trimStart();
      if (/(\.\.\.|…)$/.test(head)) {continue;}
      if (/\b(e\.g|i\.e|vs|cf|approx|dr|mr|mrs|ms|st|jr|sr|no|fig)\.$/i.test(head)) {continue;}
      if (/(\betc\.|(?:\b[A-Za-z]\.){2,})$/.test(head) && /^[a-z]/.test(next)) {continue;}
    }
    return head.endsWith('?') ? null : head;
  }
  return null;
}

/** Markup, not prose: HTML, a code fence, a setext underline, a list or a
 *  numbered item, a link row, or a list intro ending in ":". None of these is
 *  ever the fact for a slot. */
function isStructure(t: string): boolean {
  // Block HTML (banners, tables, line breaks). Inline formatting (<b>, <a>,
  // <code>) is prose that reads as its words; Vec<u8> is a type, not a tag.
  if (BLOCK_HTML.test(t)) {return true;}
  if (t.includes('```')) {return true;}
  if (/(^|\s)[-=]{3,}(\s|$)/.test(t)) {return true;}
  if (/^\d+\.\s/.test(t)) {return true;}
  if (/:\s*$/.test(t)) {return true;}
  // A nav row: 3+ short fragments split on | · •
  const frags = t.split(/\s[|·•]\s/).map((f) => f.trim()).filter(Boolean);
  if (frags.length >= 3 && frags.every((f) => f.length <= 24)) {return true;}
  return linkShare(t) > 0.5;
}

const BLOCK_HTML = /<\/?(?:p|div|img|br|hr|h[1-6]|picture|source|table|thead|tbody|tr|td|th|ul|ol|li|dl|dt|dd|details|summary|section|header|footer|center|video|iframe|svg|blockquote|pre)\b[^>]*>/i;

/** The share of `t`, read as prose, that is the words of markdown links —
 *  one inline link in a tagline is fine; a row of links is navigation. */
function linkShare(t: string): number {
  const noImages = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  const linkWords = [...noImages.matchAll(/\[([^\]]*)\]\([^)]*\)/g)].map((m) => m[1]).join('');
  const prose = noImages.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
  if (!prose) {return t.trim() ? 1 : 0;}
  return linkWords.length / prose.length;
}
