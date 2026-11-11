/**
 * Relentless — the 6-W human-context extractor. "Never gives up on finding
 * context" (the v5 RelentlessContextExtractor), rewritten v6-native + sync and
 * realigned to FAF's no-guess doctrine: it reads EVERY source (manifest +
 * README, tiered) but FILLS ONLY from sourced evidence. The v5 INFERRED tiers
 * (guess from project name / tech stack) are deliberately dropped —
 * sourced-or-empty; `faf go` is where the human confirms.
 *
 * Pairs with Turbo-Cat: Turbo-Cat fills STACK slots from file formats;
 * Relentless fills the 6 HUMAN-CONTEXT slots (who/what/why/where/when/how) by
 * reading. WHO is the target AUDIENCE (not the package author — a v5 conflation
 * this rewrite corrects).
 */

import { readRepoFile } from '../core/safe-write.js';
import { dropSetextTitle, firstSentence, isCallout, isValidExtraction, EXTRACTION_LIMITS, SECTION_HEADINGS } from '../interrogate/types.js';

interface PkgJson {
  description?: string;
  keywords?: string[];
}

export interface SeededContext {
  who?: string;
  what?: string;
  why?: string;
  where?: string;
  when?: string;
  how?: string;
}

/**
 * A sourced 6-W value WITH its provenance — where it came from and how much to
 * trust it. The honesty gate: a fill the human can audit before confirming.
 *   - `source`: the artifact + locus it was relocated from, e.g.
 *     'package.json:description' or 'README:## Why'. If we can't name a source,
 *     we don't emit a value — sourced-or-empty, never invented.
 *   - `confidence`: 0..1 by source quality (structured field > named section >
 *     first paragraph). A signal for the seeded/confirm UI, not a score.
 *     No sentence-pattern guesses: a guess is slop, and no suggestion beats one.
 */
export interface SourcedValue {
  value: string;
  source: string;
  confidence: number;
}

export interface SeededContextDetailed {
  who?: SourcedValue;
  what?: SourcedValue;
  why?: SourcedValue;
  where?: SourcedValue;
  when?: SourcedValue;
  how?: SourcedValue;
}

const sv = (value: string, source: string, confidence: number): SourcedValue => ({ value, source, confidence });

/**
 * The 6-W extractor WITH provenance — each slot carries {value, source,
 * confidence}. This is the auditable form: the seeded/confirm UI can show the
 * human WHERE a value was relocated from before they accept it.
 */
/** `toolingRoot`: the repo root's package.json is a tooling shell (polyglot repo
 *  — real code is in sibling dirs), so its description describes the
 *  tooling, not the product. Skip package.json-sourced context; README only. */
export interface RelentlessOpts { toolingRoot?: boolean }

export function relentlessContextDetailed(dir: string, opts: RelentlessOpts = {}): SeededContextDetailed {
  const pkg = opts.toolingRoot ? null : readPkg(dir);
  const readme = cleanReadme(dir);
  const out: SeededContextDetailed = {};
  // One gate for every source (interrogate/types.ts): slop and markup never
  // become a suggestion, whichever extractor found them.
  const set = (k: keyof SeededContextDetailed, v: SourcedValue | null): void => {
    if (v && isValidExtraction(v.value)) {out[k] = v;}
  };

  set('what', extractWhat(pkg, readme));
  set('who', extractWho(readme));
  set('why', extractWhy(readme));
  // No `where`: nothing Relentless reads says where a project runs. The README
  // interrogator's named ## Deployment / ## Hosting section suggests it.
  set('when', extractWhen(readme));
  set('how', extractHow(readme));

  return out;
}

/**
 * The bare 6-W extractor — values only, backward-compatible. A pure projection
 * of `relentlessContextDetailed` (single internal source; identical output to
 * the pre-provenance version). Existing consumers (claude-faf-mcp's faf_auto)
 * keep working unchanged; opt into provenance via the Detailed form.
 */
export function relentlessContext(dir: string, opts: RelentlessOpts = {}): SeededContext {
  const detailed = relentlessContextDetailed(dir, opts);
  const seed: SeededContext = {};
  (Object.keys(detailed) as (keyof SeededContextDetailed)[]).forEach((k) => {
    const sourced = detailed[k];
    if (sourced) {seed[k] = sourced.value;}
  });
  return seed;
}

function readPkg(dir: string): PkgJson | null {
  const text = readRepoFile(dir, 'package.json');
  if (text === null) {return null;}
  try {
    return JSON.parse(text) as PkgJson;
  } catch {
    return null;
  }
}

/** README with HTML tags + badge lines stripped (so we don't seed shields.io noise). */
function cleanReadme(dir: string): string {
  const txt = readRepoFile(dir, 'README.md');
  if (txt === null) {return '';}
  // A setext title ("Title" over "---") is the title, not the first paragraph.
  return dropSetextTitle(txt
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comment blocks (asset notes, TODOs — not prose)
    .split('\n'))
    .filter((l) => !/^\s*\[!\[/.test(l) && !/^\s*!\[/.test(l) && !/^\s*\[[^\]]+\]:\s*\S/.test(l) && !/^\s*https?:\/\/\S*\)?\s*$/.test(l)) // badges, ref-defs, wrapped badge URL tails
    .join('\n')
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // inline images/badges
    .trim();
}

function clean(text: string): string {
  // No cut at 280: text that long is rejected by the gate, never trimmed
  // mid-word into a suggestion.
  return text.replace(/\s+/g, ' ').replace(/[#*`>]/g, '').trim();
}

/** Share of a string's characters that sit inside markdown/inline links. */
function linkDensity(s: string): number {
  if (!s) {return 0;}
  const linked = (s.match(/\[[^\]]*\]\([^)]*\)/g) ?? []).join('').length;
  return linked / s.length;
}

/** First `## Section` body matching any of the pipe-listed names (min 20 chars).
 *  Returns the cleaned body AND the matched heading (for provenance labels).
 *  Rejects link-list bodies (nav / roadmap-link rows are not prose). */
function section(readme: string, names: readonly string[]): { body: string; heading: string } | null {
  // The whole heading line must be one of `names` (a trailing ':' or '?'
  // allowed) — "How to install" is not "How".
  const re = new RegExp(`^#{1,6}\\s+(${names.join('|')})\\s*[:?]?\\s*\\n+([\\s\\S]+?)(?:\\n\\n|\\n#|(?![\\s\\S]))`, 'im');
  const m = readme.match(re);
  if (!m || !m[2] || m[2].trim().length <= 20 || linkDensity(m[2]) > 0.4) {return null;}
  return { body: clean(m[2]), heading: m[1].trim() };
}

/**
 * True when a README intro paragraph is a callout / nav row / pre-release
 * banner rather than a description. These sit above the real first prose on
 * many repos (future-agi opens with a `> ⚠️ Nightly release…` blockquote) and
 * must not seed `human_context.what`.
 */
/** Markdown reference-definition block (`[label]: url`), not prose. */
function isReferenceDefinitionBlock(p: string): boolean {
  const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => /^\[[^\]]+\]:\s*\S/.test(l));
}

/** Folded badge continuation: one or more bare `https://…)` tokens, no real sentence. */
function isBadgeUrlMash(p: string): boolean {
  const t = p.trim();
  if (!/^https?:\/\//.test(t)) {return false;}
  return t.replace(/https?:\/\/\S+\)?/g, ' ').replace(/\s+/g, ' ').trim() === '';
}

function isNonProseIntro(p: string): boolean {
  const t = p.trim();
  if (isReferenceDefinitionBlock(t)) {return true;}
  if (isBadgeUrlMash(t)) {return true;}
  // Blockquote callout — GitHub admonitions (> [!NOTE] / > [!WARNING]) included
  if (/^>/.test(t)) {return true;}
  // Code fence, list, numbered item or table: structure, not prose
  if (/^(```|~~~|[-*+]\s|\d+\.\s|\|)/.test(t)) {return true;}
  // Pre-release / status banner phrasing
  if (isCallout(t)) {return true;}
  // Nav / link row: 3+ short fragments split on · or |
  const frags = t.split(/[·|]/).map((s) => s.trim()).filter(Boolean);
  if (frags.length >= 3 && frags.every((f) => f.length <= 24)) {return true;}
  return false;
}

function extractWhat(pkg: PkgJson | null, readme: string): SourcedValue | null {
  if (pkg?.description && pkg.description.length > 20) {return sv(clean(pkg.description), 'package.json:description', 0.95);}
  const sec = section(readme, SECTION_HEADINGS.what);
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  // Only the prose before the first section: a short tagline must not let a
  // ## Why or ## Usage body stand in as `what`.
  const intro = readme.split(/^#{2,6}\s/m)[0];
  const firstReal = intro
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .find((p) => p.length > 30 && !p.startsWith('#') && !isNonProseIntro(p));
  // No sentence-pattern fallback ("solves the problem of…"): a guess is slop.
  if (!firstReal) {return null;}
  const para = clean(firstReal);
  if (para.length <= EXTRACTION_LIMITS.MAX_LENGTH) {return sv(para, 'README:first-paragraph', 0.5);}
  // Too long to be `what`: its first sentence, whole, may be.
  const sentence = firstSentence(para);
  return sentence ? sv(sentence, 'README:first-sentence', 0.5) : null;
}

function extractWho(readme: string): SourcedValue | null {
  // A named section only. A "built for <role>" sentence is a guess: it gave
  // fragments like "any developer;" — the human names the audience in faf go.
  const sec = section(readme, SECTION_HEADINGS.who);
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractWhy(readme: string): SourcedValue | null {
  // A named section only. The "our mission is" sentence pattern was a guess
  // that matched "Permission is hereby granted" in MIT licence text.
  const sec = section(readme, SECTION_HEADINGS.why);
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractWhen(readme: string): SourcedValue | null {
  // A named section only. The "production since…" sentence pattern was a guess.
  const sec = section(readme, SECTION_HEADINGS.when);
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractHow(readme: string): SourcedValue | null {
  // How it works: the mechanism (the faf schema's meaning). How to use or
  // install it (## Usage, ## Install) and package.json scripts are misplaced
  // here — they belong to commands.* — so only a section about how it works
  // suggests this slot.
  const arch = section(readme, SECTION_HEADINGS.how);
  return arch ? sv(arch.body, `README:## ${arch.heading}`, 0.7) : null;
}
