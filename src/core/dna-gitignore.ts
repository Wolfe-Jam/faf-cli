import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { isAbsolute, join } from 'path';

/**
 * `.faf-dna` is the birth certificate: the honest first score, which cannot be
 * recreated. Gitignored, it is lost on a fresh clone, a new machine or
 * `git clean -X`. Keeping it local is fine with a named reason: a `#` comment
 * on the line just above the ignore line. faf says so only when there is none.
 *
 * Returns the ignore rule as `source:line: pattern` when `.faf-dna` in `dir` is
 * ignored with no reason given, else null. Not a git repo, no git, or a tracked
 * `.faf-dna` (git does not apply ignore rules to it) → null.
 */
export function dnaIgnoredWithoutReason(dir: string): string | null {
  const r = spawnSync('git', ['check-ignore', '-v', '--', '.faf-dna'], { cwd: dir, encoding: 'utf-8' });
  if (r.status !== 0 || typeof r.stdout !== 'string') {return null;}
  // "<source>:<line>:<pattern>\t<path>"; source may be relative to the repo top.
  const match = /^(.*):(\d+):(.*)\t/.exec(r.stdout);
  if (!match) {return null;}
  const [, source, lineText, pattern] = match;
  if (pattern.startsWith('!')) {return null;}
  if (hasReasonAbove(dir, source, Number(lineText))) {return null;}
  return `${source}:${lineText}: ${pattern}`;
}

/** True when the line above `line` in `source` is a `#` comment (the named reason). */
function hasReasonAbove(dir: string, source: string, line: number): boolean {
  if (line < 2) {return false;}
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf-8' });
  const candidates = isAbsolute(source)
    ? [source]
    : [join(dir, source), ...(top.status === 0 ? [join(top.stdout.trim(), source)] : [])];
  for (const path of candidates) {
    try {
      const above = readFileSync(path, 'utf-8').split(/\r?\n/)[line - 2] ?? '';
      return above.trim().startsWith('#');
    } catch {
      // try the next candidate
    }
  }
  return false;
}

/** The one-line warning, or null when there is nothing to say. */
export function dnaGitignoreWarning(dir: string): string | null {
  const rule = dnaIgnoredWithoutReason(dir);
  if (!rule) {return null;}
  return `.faf-dna is gitignored (${rule}): a fresh clone loses the birth certificate. Commit it, or put the reason in a # comment above that line.`;
}
