/**
 * WJTTC — `faf diff` (faf-cli 7.0 "The GIT Version", build #1)
 *
 * The headline GIT-native feature: a SEMANTIC context diff between two `.faf`
 * versions — slot-by-slot changes (registry-labelled) + a deterministic score
 * delta. "git diff for your project's DNA." Engine reuses slots.ts
 * (SLOTS + readSlotValue + isPlaceholder); refs read via `git show <ref>:…`.
 *
 * Tiers:
 *   🛑 BRAKE  — never crash on empty / born-here / missing slots
 *   ⚙️ ENGINE — the slot diff (kinds + registry labels) + score delta + render
 *   🌬️ AERO   — edge: no-change, value-identical, ordering by category
 *   🛞 TYRE   — real git repo: commit .faf → edit → diff HEAD..worktree
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  diffSlots, computeFafDiff, renderFafDiff, diffCommand, diffDriverCommand, type FafDiff,
} from '../../src/commands/diff.js';

const A = {
  project: { name: 'demo', goal: 'a tool', main_language: 'TypeScript' },
  stack: { build: 'tsc', api_type: 'REST' },
  human_context: { who: 'devs' },
};
const B = {
  project: { name: 'demo', goal: 'a better tool', main_language: 'TypeScript' },
  stack: { build: 'vite', api_type: 'REST', cicd: 'GitHub Actions' },
  human_context: { who: 'devs', why: 'ship faster' },
};
const yaml = (o: any) => `project:\n  name: ${o.project.name}\n  goal: ${o.project.goal}\n  main_language: ${o.project.main_language}\n  type: cli\nstack:\n${Object.entries(o.stack).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\nhuman_context:\n${Object.entries(o.human_context).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`;

describe('WJTTC — faf diff', () => {
  // ── ⚙️ ENGINE ─────────────────────────────────────────────────────────────
  describe('⚙️ ENGINE — the slot diff', () => {
    test('detects changed / added slots with registry labels', () => {
      const { changes } = diffSlots(A as any, B as any);
      const by = (path: string) => changes.find((c) => c.path === path);

      expect(by('project.goal')).toMatchObject({ kind: 'changed', from: 'a tool', to: 'a better tool' });
      expect(by('stack.build')).toMatchObject({ kind: 'changed', from: 'tsc', to: 'vite', label: 'Build' });
      expect(by('stack.cicd')).toMatchObject({ kind: 'added', to: 'GitHub Actions', label: 'CI/CD' }); // registry label
      expect(by('human_context.why')).toMatchObject({ kind: 'added', to: 'ship faster', label: 'Why' });
    });

    test('unchanged slots produce no change entry', () => {
      const { changes } = diffSlots(A as any, B as any);
      expect(changes.find((c) => c.path === 'stack.api_type')).toBeUndefined(); // REST → REST
      expect(changes.find((c) => c.path === 'project.main_language')).toBeUndefined(); // TS → TS
    });

    test('removed slot is detected', () => {
      const { changes } = diffSlots(B as any, A as any); // reverse: B → A loses cicd + why
      expect(changes.find((c) => c.path === 'stack.cicd')).toMatchObject({ kind: 'removed', from: 'GitHub Actions' });
      expect(changes.find((c) => c.path === 'human_context.why')).toMatchObject({ kind: 'removed', from: 'ship faster' });
    });

    test('filled-slot counts', () => {
      const { filledBase, filledTarget } = diffSlots(A as any, B as any);
      expect(filledTarget).toBeGreaterThan(filledBase); // B has cicd + why
    });

    test('slotignored = no real context: absent→slotignored is silent, real→slotignored is a removal', () => {
      const withReal = { stack: { build: 'tsc' } };
      const withIgnore = { stack: { build: 'slotignored' } };
      const absent = { stack: {} };
      // absent → slotignored: not a change (scoping a slot out isn't new context)
      expect(diffSlots(absent as any, withIgnore as any).changes.find((c) => c.path === 'stack.build')).toBeUndefined();
      // real → slotignored: the context was removed
      expect(diffSlots(withReal as any, withIgnore as any).changes.find((c) => c.path === 'stack.build'))
        .toMatchObject({ kind: 'removed', from: 'tsc' });
      // slotignored → real: the context was added
      expect(diffSlots(withIgnore as any, withReal as any).changes.find((c) => c.path === 'stack.build'))
        .toMatchObject({ kind: 'added', to: 'tsc' });
    });

    test('computeFafDiff adds a kernel score delta (scoreDelta = target - base)', () => {
      const diff = computeFafDiff(yaml(A), yaml(B));
      expect(typeof diff.scoreBase).toBe('number');
      expect(typeof diff.scoreTarget).toBe('number');
      expect(diff.scoreDelta).toBe(diff.scoreTarget - diff.scoreBase);
      expect(diff.changes.length).toBeGreaterThan(0);
    });
  });

  // ── 🛑 BRAKE ──────────────────────────────────────────────────────────────
  describe('🛑 BRAKE — never crashes on empty / born-here', () => {
    test('empty base (born here) → every filled target slot is "added", no throw', () => {
      expect(() => computeFafDiff('', yaml(B))).not.toThrow();
      const diff = computeFafDiff('', yaml(B));
      expect(diff.changes.every((c) => c.kind === 'added')).toBe(true);
      expect(diff.scoreBase).toBe(0);
    });

    test('both empty → no changes, no throw', () => {
      const diff = computeFafDiff('', '');
      expect(diff.changes).toEqual([]);
      expect(diff.scoreDelta).toBe(0);
    });

    test('malformed YAML does not crash the score', () => {
      expect(() => computeFafDiff('::: not yaml :::', yaml(B))).not.toThrow();
    });
  });

  // ── 🌬️ AERO ───────────────────────────────────────────────────────────────
  describe('🌬️ AERO — render & edges', () => {
    test('renderFafDiff shows the score line, refs, markers, labels', () => {
      const diff = computeFafDiff(yaml(A), yaml(B));
      const out = renderFafDiff(diff, 'HEAD', '(working tree)');
      expect(out).toContain('HEAD → (working tree)');
      expect(out).toMatch(/Score:.*→.*%/);
      expect(out).toContain('Build');   // a changed label
      expect(out).toContain('CI/CD');   // an added label (registry)
      expect(out).toContain('vite');    // the new value
    });

    test('identical .faf → no slot changes, zero score delta', () => {
      const diff = computeFafDiff(yaml(A), yaml(A));
      expect(diff.changes).toEqual([]);
      expect(diff.scoreDelta).toBe(0);
    });
  });

  // ── 🛞 TYRE ───────────────────────────────────────────────────────────────
  describe('🛞 TYRE — real git repo (commit → edit → diff)', () => {
    let dir: string;
    let cwd: string;
    beforeEach(() => {
      dir = join(tmpdir(), `faf-diff-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      mkdirSync(dir, { recursive: true });
      const g = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
      g(['init', '-q']);
      g(['config', 'user.email', 't@t.t']); g(['config', 'user.name', 't']);
      writeFileSync(join(dir, 'project.faf'), yaml(A));
      g(['add', 'project.faf']); g(['commit', '-q', '-m', 'a']);
      writeFileSync(join(dir, 'project.faf'), yaml(B)); // edit, uncommitted
      cwd = process.cwd();
      process.chdir(dir);
    });
    afterEach(() => { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); });

    test('faf diff (HEAD vs working tree) prints the real context delta', () => {
      const logs: string[] = [];
      const orig = console.log;
      console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
      try { diffCommand(undefined, {}); } finally { console.log = orig; }
      const out = logs.join('\n');
      expect(out).toContain('Build');           // tsc → vite
      expect(out).toContain('vite');
      expect(out).toContain('CI/CD');            // added
      expect(out).toMatch(/Score:.*→/);
    });

    test('--json emits a structured delta', () => {
      const logs: string[] = [];
      const orig = console.log;
      console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
      try { diffCommand(undefined, { json: true }); } finally { console.log = orig; }
      const parsed = JSON.parse(logs.join('\n'));
      expect(parsed.base).toBe('HEAD');
      expect(Array.isArray(parsed.changes)).toBe(true);
      expect(parsed.changes.some((c: any) => c.path === 'stack.build')).toBe(true);
    });
  });

  // ── 🛞 TYRE — the git diff driver (build #2: native git integration) ─────────
  describe('🛞 TYRE — git diff-driver (GIT_EXTERNAL_DIFF)', () => {
    const tmp = (tag: string) => join(tmpdir(), `faf-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const capture = (fn: () => void): string => {
      const logs: string[] = [];
      const orig = console.log;
      console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
      try { fn(); } finally { console.log = orig; }
      return logs.join('\n');
    };

    test('diffDriverCommand renders the delta from the 7-arg protocol', () => {
      const oldF = tmp('old'); const newF = tmp('new');
      writeFileSync(oldF, yaml(A)); writeFileSync(newF, yaml(B));
      // git calls: <path> <old-file> <old-hex> <old-mode> <new-file> <new-hex> <new-mode>
      const argv = ['project.faf', oldF, 'aaaaaaa1', '100644', newF, 'bbbbbbb2', '100644'];
      const out = capture(() => diffDriverCommand(argv));
      try {
        expect(out).toContain('Build');   // tsc → vite
        expect(out).toContain('vite');
        expect(out).toContain('CI/CD');    // added
        expect(out).toMatch(/Score:.*→/);
        expect(out).toContain('aaaaaaa'); // short old hex as the base label
      } finally { rmSync(oldF, { force: true }); rmSync(newF, { force: true }); }
    });

    test('diffDriverCommand treats /dev/null (added file) as born-here', () => {
      const newF = tmp('new'); writeFileSync(newF, yaml(B));
      const argv = ['project.faf', '/dev/null', '00000000', '.', newF, 'bbbbbbb2', '100644'];
      const out = capture(() => diffDriverCommand(argv));
      try {
        expect(out).toContain('(absent)'); // all-zero hex → absent label
        expect(out).toContain('(added)');
      } finally { rmSync(newF, { force: true }); }
    });

    test('native `git diff` renders the semantic .faf delta via the installed driver', () => {
      const dir = tmp('repo'); mkdirSync(dir, { recursive: true });
      const g = (a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe', encoding: 'utf-8' });
      g(['init', '-q']); g(['config', 'user.email', 't@t.t']); g(['config', 'user.name', 't']);
      writeFileSync(join(dir, 'project.faf'), yaml(A));
      g(['add', 'project.faf']); g(['commit', '-q', '-m', 'a']);
      // install the driver, pointed at the LOCAL cli (end users get the global `faf`)
      const cli = join(import.meta.dir, '../../src/cli.ts');
      g(['config', 'diff.faf.command', `bun ${cli} diff-driver`]);
      writeFileSync(join(dir, '.gitattributes'), '*.faf diff=faf\n');
      writeFileSync(join(dir, 'project.faf'), yaml(B)); // uncommitted edit
      const out = execFileSync('git', ['diff'], { cwd: dir, encoding: 'utf-8' });
      try {
        expect(out).toContain('Score:');  // semantic delta, NOT git's line diff
        expect(out).toContain('Build');
        expect(out).toContain('vite');
        expect(out).not.toContain('+  cicd: GitHub Actions'); // the raw line diff is replaced
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });
});
