/**
 * `faf log` — the score TIMELINE of your project's context.
 *
 * Walks every commit that touched project.faf, scores each version through the
 * kernel, and renders the score progression with the per-commit delta:
 *
 *   project.faf — score timeline (3 commits)
 *      100%   +19   2026-06-26  ccc0000  🏆 TROPHY  add ci + why
 *       81%    +7   2026-06-20  bbb0000  ● GREEN    add build
 *       74%   new   2026-06-18  aaa0000  ● GREEN    init context
 *
 * Proof-Over-Time for the context score — the TAF-family idea applied to the
 * .faf score itself. The git history is append-only, so the timeline can't be
 * gamed: anyone can score green once; the trend is the asset.
 */
import { execFileSync } from 'child_process';
import { relative } from 'path';
import { findFafFile } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { getTier, tierBadge } from '../core/tiers.js';

export interface LogEntry {
  hex: string;
  date: string;
  subject: string;
  score: number;
  /** Score change vs the next-older version. null for the origin (no older neighbor). */
  delta: number | null;
  /** True when this is the first commit that ever introduced project.faf. */
  first: boolean;
}

/** Score a raw .faf YAML via the kernel. 0 for empty/unscorable — never throws. */
function safeScore(raw: string): number {
  if (!raw.trim()) {return 0;}
  try {
    return scoreFafYaml(raw).score ?? 0;
  } catch {
    return 0;
  }
}

const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

/**
 * Build the timeline from a NEWEST-FIRST list of commits (as `git log` emits).
 * Each entry's delta is measured against the next-older version; the last entry
 * (no older neighbor) is the origin. Pure apart from the kernel score.
 */
export function buildTimeline(
  commits: { hex: string; date: string; subject: string; raw: string }[],
): LogEntry[] {
  const scored = commits.map((c) => ({ ...c, score: safeScore(c.raw) }));
  return scored.map((c, i) => {
    const older = scored[i + 1];
    return {
      hex: c.hex,
      date: c.date,
      subject: c.subject,
      score: c.score,
      delta: older ? c.score - older.score : null,
      first: !older,
    };
  });
}

/** Render the timeline as a human-readable progression (newest-first by default). */
export function renderTimeline(entries: LogEntry[], fafName = 'project.faf'): string {
  if (entries.length === 0) {return `${fafName} — no history (no commits touch it yet)`;}
  const lines: string[] = [];
  lines.push(`${fafName} — score timeline (${entries.length} commit${entries.length === 1 ? '' : 's'})`);
  lines.push('');
  for (const e of entries) {
    const score = `${String(e.score).padStart(3)}%`;
    // origin → "new"; unchanged → a quiet "·" so the real movers (+56 / −37) pop.
    const delta = e.first ? ' new ' : e.delta === 0 ? '   ·' : signed(e.delta!).padStart(4);
    // Fixed-width, ANSI-free columns first (score · delta · date · hex) so the
    // timeline scans cleanly; the colored tier badge + subject trail after.
    lines.push(`  ${score}  ${delta}  ${e.date}  ${e.hex}  ${tierBadge(getTier(e.score))}  ${e.subject}`);
  }
  return lines.join('\n');
}

/** Read project.faf at a git ref via `git show` (no shell). '' if absent at the ref. */
function readFafAtRef(ref: string, repoRel: string, cwd: string): string {
  try {
    return execFileSync('git', ['show', `${ref}:${repoRel}`], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return '';
  }
}

export interface LogOptions {
  /** Max commits to display (default 20). */
  limit?: string;
  /** Show all commits, no cap. */
  all?: boolean;
  /** Oldest-first instead of newest-first. */
  reverse?: boolean;
  json?: boolean;
}

export function logCommand(options: LogOptions = {}, cwd: string = process.cwd()): void {
  const fafPath = findFafFile(cwd);
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  let top: string;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    console.error('Error: not a git repository — faf log reads the .faf score across git history.');
    process.exit(2);
    return;
  }
  const repoRel = relative(top, fafPath as string).split('\\').join('/');

  const limit = options.all ? 0 : Math.max(0, parseInt(options.limit ?? '20', 10) || 20);

  // All commit metadata that touched the file (newest-first). Cheap — no scoring yet.
  // --follow spans renames so the timeline covers the file's whole life, not just
  // since its current name. \x1f (unit separator) keeps subjects with pipes intact.
  // Fail-open to an empty history on any git error — never crash the timeline.
  let raw = '';
  try {
    raw = execFileSync(
      'git',
      ['log', '--follow', '--format=%h%x1f%ad%x1f%s', '--date=short', '--', repoRel],
      { cwd, encoding: 'utf-8' },
    );
  } catch {
    raw = '';
  }
  const all = raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hex, date, subject] = line.split('\x1f');
      return { hex, date, subject: subject ?? '' };
    });

  // Score the display window + one older neighbour (for the boundary delta), so a
  // capped view still shows a correct delta on its oldest row, and only the TRUE
  // origin is flagged `first`.
  const fetchN = limit > 0 ? Math.min(all.length, limit + 1) : all.length;
  const withRaw = all.slice(0, fetchN).map((c) => ({ ...c, raw: readFafAtRef(c.hex, repoRel, cwd) }));
  const built = buildTimeline(withRaw);
  let entries = limit > 0 ? built.slice(0, limit) : built;
  if (options.reverse) {entries = [...entries].reverse();}

  const total = all.length;
  if (options.json) {
    console.log(JSON.stringify({ file: repoRel, total, count: entries.length, entries }, null, 2));
  } else {
    let out = renderTimeline(entries, repoRel.split('/').pop() ?? 'project.faf');
    // No silent truncation — say when the window is capped, and how to see all.
    if (limit > 0 && total > entries.length) {
      out += `\n\n  … showing ${entries.length} of ${total} commits — \`faf log --all\` for the full timeline.`;
    }
    console.log(out);
  }
}
