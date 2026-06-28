/**
 * WJTTC — `faf log` (faf-cli 7.0 "The GIT Version", build #3)
 *
 * The score TIMELINE: walk every commit that touched project.faf, score each
 * version, render the progression (81% → 92% → 100% 🏆) with the per-commit
 * delta. Proof-Over-Time for the context score — the TAF-family idea applied to
 * the .faf score itself. The append-only git history can't be gamed.
 *
 * Tiers:
 *   🛑 BRAKE  — empty history / not-a-repo never crash
 *   ⚙️ ENGINE — buildTimeline: score per commit + delta vs older neighbor + origin flag
 *   🌬️ AERO   — render: score, tier, delta, hex, date, (new) origin marker
 *   🛞 TYRE   — real git repo: 3 evolving commits → real progression + --json
 */
import { describe, test, expect } from 'bun:test';
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildTimeline, renderTimeline, logCommand, type LogEntry } from '../../src/commands/log.js';

const MIN = `project:\n  name: demo\n  goal: a tool\n  type: cli\n`;
const MID = `project:\n  name: demo\n  goal: a tool\n  main_language: TypeScript\n  type: cli\nstack:\n  build: tsc\n`;
const FULL = `project:\n  name: demo\n  goal: a tool that ships\n  main_language: TypeScript\n  type: cli\nstack:\n  build: vite\n  cicd: GitHub Actions\nhuman_context:\n  who: devs\n  why: ship faster\n`;

const tmp = (tag: string) => join(tmpdir(), `faf-log-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const capture = (fn: () => void): string => {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
  try { fn(); } finally { console.log = orig; }
  return logs.join('\n');
};

describe('WJTTC — faf log', () => {
  // ── ⚙️ ENGINE ─────────────────────────────────────────────────────────────
  describe('⚙️ ENGINE — buildTimeline', () => {
    test('scores each commit; delta = score − older neighbor; origin flagged', () => {
      // newest-first, as `git log` emits
      const commits = [
        { hex: 'ccc0000', date: '2026-06-26', subject: 'add ci + why', raw: FULL },
        { hex: 'bbb0000', date: '2026-06-20', subject: 'add build', raw: MID },
        { hex: 'aaa0000', date: '2026-06-18', subject: 'init', raw: MIN },
      ];
      const t = buildTimeline(commits);
      expect(t).toHaveLength(3);
      // the oldest is the origin: no older neighbor → delta null, first true
      expect(t[2]).toMatchObject({ first: true, delta: null });
      // newer commits carry a real delta vs the version below them
      expect(t[0].delta).toBe(t[0].score - t[1].score);
      expect(t[1].delta).toBe(t[1].score - t[2].score);
      t.forEach((e) => expect(typeof e.score).toBe('number'));
      // more complete context never scores lower than the minimal origin
      expect(t[0].score).toBeGreaterThanOrEqual(t[2].score);
    });

    test('single commit → that commit is the origin', () => {
      const t = buildTimeline([{ hex: 'aaa0000', date: '2026-06-18', subject: 'init', raw: MID }]);
      expect(t).toHaveLength(1);
      expect(t[0]).toMatchObject({ first: true, delta: null });
    });
  });

  // ── 🌬️ AERO ───────────────────────────────────────────────────────────────
  describe('🌬️ AERO — renderTimeline', () => {
    test('shows score, tier, signed delta, hex, date, subject, origin marker', () => {
      const entries: LogEntry[] = [
        { hex: 'ccc0000', date: '2026-06-26', subject: 'add ci', score: 100, delta: 19, first: false },
        { hex: 'aaa0000', date: '2026-06-18', subject: 'init', score: 81, delta: null, first: true },
      ];
      const out = renderTimeline(entries);
      expect(out).toContain('100%');
      expect(out).toContain('TROPHY');     // tier name via the badge
      expect(out).toContain('+19');        // signed delta
      expect(out).toContain('ccc0000');
      expect(out).toContain('2026-06-26');
      expect(out).toContain('add ci');
      expect(out).toMatch(/new/i);         // origin marker (no delta)
    });

    test('empty history renders a friendly line, not a crash', () => {
      expect(renderTimeline([])).toMatch(/no history/i);
    });
  });

  // ── 🛞 TYRE ───────────────────────────────────────────────────────────────
  describe('🛞 TYRE — real git repo (3 evolving commits)', () => {
    const setup = (): string => {
      let dir = tmp('repo');
      mkdirSync(dir, { recursive: true });
      dir = realpathSync.native(dir); // resolve symlinks AND Windows 8.3 short names (RUNNER~1) → matches git

      const g = (a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
      g(['init', '-q']); g(['config', 'user.email', 't@t.t']); g(['config', 'user.name', 't']);
      const commit = (body: string, msg: string) => {
        writeFileSync(join(dir, 'project.faf'), body);
        g(['add', 'project.faf']); g(['commit', '-q', '-m', msg]);
      };
      commit(MIN, 'init context');
      commit(MID, 'add build');
      commit(FULL, 'add ci + why');
      return dir;
    };

    // NB: logCommand takes an explicit cwd — tests never mutate global process.cwd()
    // (that races with the ~20 other chdir-using suites under bun's concurrency).
    test('renders the real score progression across the 3 commits', () => {
      const dir = setup();
      try {
        const out = capture(() => logCommand({}, dir));
        expect(out).toContain('score timeline');
        expect(out).toContain('add ci + why'); // newest subject
        expect(out).toContain('init context'); // oldest subject
        expect(out).toMatch(/new/i);           // origin marker on the first commit
        expect(out).toMatch(/\d+%/);           // scores present
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--json emits the structured timeline (newest-first, origin flagged, total)', () => {
      const dir = setup();
      try {
        const out = capture(() => logCommand({ json: true }, dir));
        const parsed = JSON.parse(out);
        expect(parsed.count).toBe(3);
        expect(parsed.total).toBe(3);                               // full history size
        expect(parsed.entries[0].subject).toBe('add ci + why');     // newest first
        expect(parsed.entries[2].first).toBe(true);                 // origin
        expect(parsed.entries[2].delta).toBeNull();
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('an explicit cap says so — no SILENT truncation', () => {
      const dir = setup(); // 3 commits
      try {
        const out = capture(() => logCommand({ limit: '2' }, dir));
        expect(out).toMatch(/showing 2 of 3/); // honest about the window
        expect(out).toContain('--all');        // and how to see the rest
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('a non-numeric -n falls back gracefully, never crashes', () => {
      const dir = setup();
      try {
        let out = '';
        expect(() => { out = capture(() => logCommand({ limit: 'abc' }, dir)); }).not.toThrow();
        expect(out).toContain('score timeline');
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });
});
