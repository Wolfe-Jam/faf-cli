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

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface PkgJson {
  description?: string;
  repository?: string | { url?: string };
  homepage?: string;
  scripts?: Record<string, string>;
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
 *     heuristic match). A signal for the seeded/confirm UI, not a score.
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
export function relentlessContextDetailed(dir: string): SeededContextDetailed {
  const pkg = readPkg(dir);
  const readme = cleanReadme(dir);
  const out: SeededContextDetailed = {};
  const set = (k: keyof SeededContextDetailed, v: SourcedValue | null): void => {
    if (v) {out[k] = v;}
  };

  set('what', extractWhat(pkg, readme));
  set('who', extractWho(readme));
  set('why', extractWhy(readme));
  set('where', extractWhere(pkg, readme));
  set('when', extractWhen(readme));
  set('how', extractHow(pkg, readme));

  return out;
}

/**
 * The bare 6-W extractor — values only, backward-compatible. A pure projection
 * of `relentlessContextDetailed` (single internal source; identical output to
 * the pre-provenance version). Existing consumers (claude-faf-mcp's faf_auto)
 * keep working unchanged; opt into provenance via the Detailed form.
 */
export function relentlessContext(dir: string): SeededContext {
  const detailed = relentlessContextDetailed(dir);
  const seed: SeededContext = {};
  (Object.keys(detailed) as (keyof SeededContextDetailed)[]).forEach((k) => {
    const sourced = detailed[k];
    if (sourced) {seed[k] = sourced.value;}
  });
  return seed;
}

function readPkg(dir: string): PkgJson | null {
  const p = join(dir, 'package.json');
  if (!existsSync(p)) {return null;}
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as PkgJson;
  } catch {
    return null;
  }
}

/** README with HTML tags + badge lines stripped (so we don't seed shields.io noise). */
function cleanReadme(dir: string): string {
  const p = join(dir, 'README.md');
  if (!existsSync(p)) {return '';}
  let txt: string;
  try {
    txt = readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
  return txt
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

/** First `## Section` body matching any of the pipe-listed names (min 20 chars).
 *  Returns the cleaned body AND the matched heading (for provenance labels). */
function section(readme: string, names: string): { body: string; heading: string } | null {
  const re = new RegExp(`##?\\s+(${names})\\s*\\n+([\\s\\S]+?)(?:\\n\\n|\\n##?|$)`, 'i');
  const m = readme.match(re);
  return m && m[2] && m[2].trim().length > 20 ? { body: clean(m[2]), heading: m[1].trim() } : null;
}

/** First capturing-group match across patterns whose capture meets minLen. */
function firstMatch(text: string, patterns: RegExp[], minLen = 30): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && m[1].trim().length >= minLen) {return clean(m[1]);}
  }
  return null;
}

function extractWhat(pkg: PkgJson | null, readme: string): SourcedValue | null {
  if (pkg?.description && pkg.description.length > 20) {return sv(clean(pkg.description), 'package.json:description', 0.95);}
  const sec = section(readme, 'Purpose|What|About|Overview|Description');
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  const firstReal = readme
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 30 && !p.startsWith('#'));
  if (firstReal) {return sv(clean(firstReal), 'README:first-paragraph', 0.5);}
  const fm = firstMatch(readme, [
    /(?:core|main|primary)\s+(?:problem|challenge)(?:\s+is)?\s*:?\s*([^.\n]{30,})/i,
    /solves?\s+(?:the\s+)?(?:problem\s+of\s+)?([^.\n]{30,})/i,
  ]);
  return fm ? sv(fm, 'README:problem-heuristic', 0.6) : null;
}

function extractWho(readme: string): SourcedValue | null {
  const sec = section(readme, 'Audience|Who|Who is this for|Who it.s for');
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  const fm = firstMatch(
    readme,
    [
      /\b(?:designed|built|made)\s+for\s+((?:developers?|teams?|engineers?|builders?|founders?)[^.\n]{0,80})/i,
      /\bfor\s+((?:developers?|teams?|engineers?|builders?|founders?)[^.\n]{0,80})/i,
    ],
    8,
  );
  return fm ? sv(fm, 'README:audience-heuristic', 0.6) : null;
}

function extractWhy(readme: string): SourcedValue | null {
  const sec = section(readme, 'Why|Mission|Motivation|Rationale|Vision');
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  // DECLARATIVE only — "our mission is X", "the goal is X", "Mission: X". The
  // bare noun is NOT enough: "(name + goal + the six Ws)" must not match (it did,
  // and grabbed the rest of the line — a real bug the provenance dogfood caught).
  const fm = firstMatch(readme, [
    /(?:our\s+|the\s+)?(?:mission|purpose|goal)\s+is\s+([^.\n]{30,})/i,
    /\b(?:mission|purpose|goal)\s*:\s*([^.\n]{30,})/i,
    /(?:built|created|designed)\s+(?:because|to)\s+([^.\n]{30,})/i,
  ]);
  return fm ? sv(fm, 'README:mission-heuristic', 0.6) : null;
}

function extractWhere(pkg: PkgJson | null, readme: string): SourcedValue | null {
  const repo = typeof pkg?.repository === 'string' ? pkg.repository : pkg?.repository?.url;
  if (repo) {return sv(clean(repo.replace(/^git\+/, '').replace(/\.git$/, '')), 'package.json:repository', 0.95);}
  if (pkg?.homepage) {return sv(clean(pkg.homepage), 'package.json:homepage', 0.9);}
  const fm = firstMatch(
    readme,
    [/\b(?:deployed|hosted|available|published)\s+(?:on|at|via)\s+([^.\n]{4,80})/i],
    4,
  );
  return fm ? sv(fm, 'README:deploy-heuristic', 0.6) : null;
}

function extractWhen(readme: string): SourcedValue | null {
  const sec = section(readme, 'Timeline|Status|Release|Roadmap');
  if (sec) {return sv(sec.body, `README:## ${sec.heading}`, 0.8);}
  const fm = firstMatch(
    readme,
    [
      /\b(production\s+since\s+[^.\n]{4,60})/i,
      /\b((?:in\s+)?(?:production|beta|alpha|development)\s+since\s+[^.\n]{4,60})/i,
      /\bsince\s+((?:[A-Z][a-z]+\s+)?\d{4}[^.\n]{0,40})/,
    ],
    4,
  );
  return fm ? sv(fm, 'README:since-heuristic', 0.6) : null;
}

function extractHow(pkg: PkgJson | null, readme: string): SourcedValue | null {
  const scripts = pkg?.scripts ? Object.keys(pkg.scripts) : [];
  const run = ['start', 'dev', 'build'].filter((s) => scripts.includes(s));
  if (run.length) {return sv(clean(run.map((s) => `npm run ${s}`).join(', ')), 'package.json:scripts', 0.9);}
  const usage = section(readme, 'Usage|Getting Started|Install|Installation|Quick Start');
  if (usage) {return sv(usage.body, `README:## ${usage.heading}`, 0.8);}
  const arch = section(readme, 'Architecture|Approach|How it works|Methodology|How');
  return arch ? sv(arch.body, `README:## ${arch.heading}`, 0.7) : null;
}
