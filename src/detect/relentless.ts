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
  const set = (k: keyof SeededContextDetailed, v: SourcedValue | null): void => {
    if (v) {out[k] = v;}
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
  return txt
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comment blocks (asset notes, TODOs — not prose)
    .split('\n')
    .filter((l) => !/^\s*\[!\[/.test(l) && !/^\s*!\[/.test(l)) // badge lines
    .join('\n')
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // inline images/badges
    .trim();
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[#*`>]/g, '').trim().slice(0, 280);
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
function section(readme: string, names: string): { body: string; heading: string } | null {
  const re = new RegExp(`##?\\s+(${names})\\s*\\n+([\\s\\S]+?)(?:\\n\\n|\\n##?|$)`, 'i');
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
function isNonProseIntro(p: string): boolean {
  const t = p.trim();
  // Blockquote callout — GitHub admonitions (> [!NOTE] / > [!WARNING]) included
  if (/^>/.test(t)) {return true;}
  // Pre-release / status banner phrasing
  if (/\b(nightly (release|build)|pre-?release|work[-\s]in[-\s]progress|rough edges|early (access|testing|preview)|use at your own risk|not (yet )?production[-\s]?ready|expect (rough|breaking)|experimental release)\b/i.test(t)) {return true;}
  // Nav / link row: 3+ short fragments split on · or |
  const frags = t.split(/[·|]/).map((s) => s.trim()).filter(Boolean);
  if (frags.length >= 3 && frags.every((f) => f.length <= 24)) {return true;}
  return false;
}

function extractWhat(pkg: PkgJson | null, readme: string): SourcedValue | null {
  if (pkg?.description && pkg.description.length > 20) {return sv(clean(pkg.description), 'package.json:description', 0.95);}
  const sec = section(readme, 'Purpose|What|About|Overview|Description');
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  const firstReal = readme
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .find((p) => p.length > 30 && !p.startsWith('#') && !isNonProseIntro(p));
  // No sentence-pattern fallback ("solves the problem of…"): a guess is slop.
  return firstReal ? sv(clean(firstReal), 'README:first-paragraph', 0.5) : null;
}

function extractWho(readme: string): SourcedValue | null {
  // A named section only. A "built for <role>" sentence is a guess: it gave
  // fragments like "any developer;" — the human names the audience in faf go.
  const sec = section(readme, 'Audience|Who|Who is this for|Who it.s for');
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractWhy(readme: string): SourcedValue | null {
  // A named section only. The "our mission is" sentence pattern was a guess
  // that matched "Permission is hereby granted" in MIT licence text.
  const sec = section(readme, 'Why|Mission|Motivation|Rationale|Vision');
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractWhen(readme: string): SourcedValue | null {
  // A named section only. The "production since…" sentence pattern was a guess.
  const sec = section(readme, 'Timeline|Status|Release|Roadmap');
  return sec ? sv(sec.body, `README:## ${sec.heading}`, 0.8) : null;
}

function extractHow(readme: string): SourcedValue | null {
  // How it works: the mechanism (the faf schema's meaning). How to use or
  // install it (## Usage, ## Install) and package.json scripts are misplaced
  // here — they belong to commands.* — so only a section about how it works
  // suggests this slot.
  const arch = section(readme, 'Architecture|Approach|How it works|Methodology|How');
  return arch ? sv(arch.body, `README:## ${arch.heading}`, 0.7) : null;
}
