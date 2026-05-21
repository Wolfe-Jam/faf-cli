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

export function relentlessContext(dir: string): SeededContext {
  const pkg = readPkg(dir);
  const readme = cleanReadme(dir);
  const seed: SeededContext = {};
  const set = (k: keyof SeededContext, v: string | null): void => {
    if (v) {seed[k] = v;}
  };

  set('what', extractWhat(pkg, readme));
  set('who', extractWho(readme));
  set('why', extractWhy(readme));
  set('where', extractWhere(pkg, readme));
  set('when', extractWhen(readme));
  set('how', extractHow(pkg, readme));

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

/** First `## Section` body matching any of the pipe-listed names (min 20 chars). */
function section(readme: string, names: string): string | null {
  const re = new RegExp(`##?\\s+(?:${names})\\s*\\n+([\\s\\S]+?)(?:\\n\\n|\\n##?|$)`, 'i');
  const m = readme.match(re);
  return m && m[1] && m[1].trim().length > 20 ? clean(m[1]) : null;
}

/** First capturing-group match across patterns whose capture meets minLen. */
function firstMatch(text: string, patterns: RegExp[], minLen = 30): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && m[1].trim().length >= minLen) {return clean(m[1]);}
  }
  return null;
}

function extractWhat(pkg: PkgJson | null, readme: string): string | null {
  if (pkg?.description && pkg.description.length > 20) {return clean(pkg.description);}
  const sec = section(readme, 'Purpose|What|About|Overview|Description');
  if (sec) {return sec;}
  const firstReal = readme
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 30 && !p.startsWith('#'));
  if (firstReal) {return clean(firstReal);}
  return firstMatch(readme, [
    /(?:core|main|primary)\s+(?:problem|challenge)(?:\s+is)?\s*:?\s*([^.\n]{30,})/i,
    /solves?\s+(?:the\s+)?(?:problem\s+of\s+)?([^.\n]{30,})/i,
  ]);
}

function extractWho(readme: string): string | null {
  const sec = section(readme, 'Audience|Who|Who is this for|Who it.s for');
  if (sec) {return sec;}
  return firstMatch(
    readme,
    [
      /\b(?:designed|built|made)\s+for\s+((?:developers?|teams?|engineers?|builders?|founders?)[^.\n]{0,80})/i,
      /\bfor\s+((?:developers?|teams?|engineers?|builders?|founders?)[^.\n]{0,80})/i,
    ],
    8,
  );
}

function extractWhy(readme: string): string | null {
  const sec = section(readme, 'Why|Mission|Motivation|Rationale|Vision');
  if (sec) {return sec;}
  return firstMatch(readme, [
    /(?:our\s+)?(?:mission|purpose|goal)(?:\s+is)?\s*:?\s*([^.\n]{30,})/i,
    /(?:built|created|designed)\s+(?:because|to)\s+([^.\n]{30,})/i,
  ]);
}

function extractWhere(pkg: PkgJson | null, readme: string): string | null {
  const repo = typeof pkg?.repository === 'string' ? pkg.repository : pkg?.repository?.url;
  if (repo) {return clean(repo.replace(/^git\+/, '').replace(/\.git$/, ''));}
  if (pkg?.homepage) {return clean(pkg.homepage);}
  return firstMatch(
    readme,
    [/\b(?:deployed|hosted|available|published)\s+(?:on|at|via)\s+([^.\n]{4,80})/i],
    4,
  );
}

function extractWhen(readme: string): string | null {
  const sec = section(readme, 'Timeline|Status|Release|Roadmap');
  if (sec) {return sec;}
  return firstMatch(
    readme,
    [
      /\b(production\s+since\s+[^.\n]{4,60})/i,
      /\b((?:in\s+)?(?:production|beta|alpha|development)\s+since\s+[^.\n]{4,60})/i,
      /\bsince\s+((?:[A-Z][a-z]+\s+)?\d{4}[^.\n]{0,40})/,
    ],
    4,
  );
}

function extractHow(pkg: PkgJson | null, readme: string): string | null {
  const scripts = pkg?.scripts ? Object.keys(pkg.scripts) : [];
  const run = ['start', 'dev', 'build'].filter((s) => scripts.includes(s));
  if (run.length) {return clean(run.map((s) => `npm run ${s}`).join(', '));}
  const usage = section(readme, 'Usage|Getting Started|Install|Installation|Quick Start');
  if (usage) {return usage;}
  return section(readme, 'Architecture|Approach|How it works|Methodology|How');
}
