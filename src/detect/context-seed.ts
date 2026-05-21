/**
 * Context Seeder — restores the "relentless" 6-W extraction the v6.0 rewrite
 * dropped (RelentlessContextExtractor). SEED-AND-SUGGEST: pulls candidate
 * human_context values from authoritative sources (manifest) and softer ones
 * (README), so `faf auto` gives the human a head start. `faf go` remains the
 * place the human CONFIRMS the 6 W's — this only seeds from real evidence
 * (sourced-or-empty; never guesses).
 *
 * Tiers (per v5): manifest = CERTAIN seed; README section/intro = PROBABLE
 * suggestion. Only what/where/how/why/who that have a real source are returned.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface PkgJson {
  description?: string;
  repository?: string | { url?: string };
  homepage?: string;
  scripts?: Record<string, string>;
  bin?: string | Record<string, string>;
  keywords?: string[];
}

export interface SeededContext {
  who?: string;
  what?: string;
  why?: string;
  where?: string;
  how?: string;
}

export function seedHumanContext(dir: string): SeededContext {
  const pkg = readPkg(dir);
  const readme = cleanReadme(dir);
  const seed: SeededContext = {};

  const what = extractWhat(pkg, readme);
  if (what) seed.what = what;
  const where = extractWhere(pkg);
  if (where) seed.where = where;
  const how = extractHow(pkg, readme);
  if (how) seed.how = how;
  const why = extractWhy(readme);
  if (why) seed.why = why;
  const who = extractWho(readme);
  if (who) seed.who = who;

  return seed;
}

function readPkg(dir: string): PkgJson | null {
  const p = join(dir, 'package.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as PkgJson;
  } catch {
    return null;
  }
}

/** README with HTML tags + badge lines stripped (so we don't seed shields.io noise). */
function cleanReadme(dir: string): string {
  const p = join(dir, 'README.md');
  if (!existsSync(p)) return '';
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

function section(readme: string, names: string): string | null {
  const re = new RegExp(`##?\\s+(?:${names})\\s*\\n+([\\s\\S]+?)(?:\\n\\n|\\n##?|$)`, 'i');
  const m = readme.match(re);
  return m && m[1] && m[1].trim().length > 20 ? clean(m[1]) : null;
}

function extractWhat(pkg: PkgJson | null, readme: string): string | null {
  // TIER 1 — authoritative: package.json description
  if (pkg?.description && pkg.description.length > 20) return clean(pkg.description);
  // TIER 2 — README Purpose/What/About/Overview section
  const sec = section(readme, 'Purpose|What|About|Overview|Description');
  if (sec) return sec;
  // TIER 3 — README first real content paragraph (skip headings + badges)
  const paras = readme
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#'));
  const firstReal = paras.find((p) => p.length > 30);
  if (firstReal) return clean(firstReal);
  return null;
}

function extractWhere(pkg: PkgJson | null): string | null {
  const repo = typeof pkg?.repository === 'string' ? pkg.repository : pkg?.repository?.url;
  if (repo) return clean(repo.replace(/^git\+/, '').replace(/\.git$/, ''));
  if (pkg?.homepage) return clean(pkg.homepage);
  return null;
}

function extractHow(pkg: PkgJson | null, readme: string): string | null {
  const scripts = pkg?.scripts ? Object.keys(pkg.scripts) : [];
  const run = ['start', 'dev', 'build'].filter((s) => scripts.includes(s));
  if (run.length) return clean(run.map((s) => `npm run ${s}`).join(', '));
  const sec = section(readme, 'Usage|Getting Started|Install|Installation|Quick Start');
  if (sec) return sec;
  return null;
}

function extractWhy(readme: string): string | null {
  return section(readme, 'Why|Motivation|Rationale|Problem');
}

function extractWho(readme: string): string | null {
  // "for <developers/teams/...>" patterns — softest, only on clear evidence.
  const m = readme.match(/\bfor\s+((?:developers?|teams?|engineers?|builders?)[^.\n]{0,80})/i);
  return m ? clean(m[1]) : null;
}
