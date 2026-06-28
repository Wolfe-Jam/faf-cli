/**
 * WJTTC — `faf hooks` (faf-cli 7.0 "The GIT Version", build #4)
 *
 * A pre-commit CONTEXT GUARD. The tests are deliberately user-first: the point
 * isn't "does it work on a clean FAF repo" — it's "does it behave for a real dev
 * with husky, an existing hook, no `faf` on PATH, a first commit, or a tool that
 * just errored." The cardinal rule under test: a guard must NEVER break a
 * legitimate commit because the tool failed — only a deliberate --strict
 * regression blocks.
 *
 * Tiers:
 *   🛑 BRAKE  — fail OPEN: untracked/born-here/not-a-repo/crash never block
 *   ⚙️ ENGINE — install/uninstall: idempotent · no-clobber · refuse hooksPath · executable
 *   🌬️ AERO   — warn vs strict wording, status
 *   🛞 TYRE   — REAL git commit: strict blocks a regression; warn/improve/no-verify/absent-faf pass
 */
import { describe, test, expect } from 'bun:test';
import { execFileSync, spawnSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, statSync, chmodSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { installHooks, uninstallHooks, hooksRun, hooksStatus } from '../../src/commands/hooks.js';

const MIN = `project:\n  name: demo\n  goal: a tool\n  type: cli\n`;
const FULL = `project:\n  name: demo\n  goal: a tool that ships\n  main_language: TypeScript\n  type: cli\nstack:\n  build: vite\n  cicd: GitHub Actions\nhuman_context:\n  who: devs\n  why: ship faster\n`;

const CLI = join(import.meta.dir, '../../src/cli.ts');
const LOCAL_RUNNER = `${process.execPath} ${CLI} hooks-run`; // points the hook at THIS cli

const mk = (tag: string) => {
  let dir = join(tmpdir(), `faf-hooks-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  dir = realpathSync.native(dir); // resolve symlinks AND Windows 8.3 short names (RUNNER~1) → matches git
  const g = (a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe', encoding: 'utf-8' });
  g(['init', '-q']); g(['config', 'user.email', 't@t.t']); g(['config', 'user.name', 't']);
  return { dir, g };
};
const hookPath = (dir: string) => join(dir, '.git', 'hooks', 'pre-commit');
const stage = (dir: string, g: (a: string[]) => string, body: string) => {
  writeFileSync(join(dir, 'project.faf'), body); g(['add', 'project.faf']);
};
const commit = (dir: string, msg: string, flags: string[] = []): { ok: boolean; out: string } => {
  // spawnSync (not execFileSync) so we capture BOTH streams on success AND failure —
  // the warn-mode ⚠ lands on the hook's stderr even when the commit is allowed.
  const r = spawnSync('git', ['commit', '-m', msg, ...flags], { cwd: dir, encoding: 'utf-8' });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const capture = (fn: () => void): string => {
  const logs: string[] = [];
  const ol = console.log, oe = console.error;
  console.log = (...a: unknown[]) => { logs.push(a.join(' ')); };
  console.error = (...a: unknown[]) => { logs.push(a.join(' ')); };
  try { fn(); } finally { console.log = ol; console.error = oe; }
  return logs.join('\n');
};
// hooksRun/hooksStatus take an explicit cwd — tests pass it directly rather than
// mutating global process.cwd() (which races with bun's concurrent file runner).

describe('WJTTC — faf hooks', () => {
  // ── ⚙️ ENGINE — install / uninstall ─────────────────────────────────────────
  describe('⚙️ ENGINE — install / uninstall', () => {
    test('installs an executable hook that is staged-gated and PATH-guarded', () => {
      const { dir } = mk();
      try {
        expect(installHooks(dir, { runnerCmd: LOCAL_RUNNER })).toBe(true);
        const hook = readFileSync(hookPath(dir), 'utf-8');
        expect(hook).toContain('# >>> faf >>>');
        expect(hook).toContain('command -v'); // PATH guard — skip if faf absent
        expect(hook).toContain('grep -qE'); // only run when a .faf is staged
        expect(hook).toContain('|| true'); // warn mode never blocks
        expect(statSync(hookPath(dir)).mode & 0o111).toBeGreaterThan(0); // executable
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--strict writes a blocking line; re-install switches mode in place (no dup)', () => {
      const { dir } = mk();
      try {
        installHooks(dir, { runnerCmd: LOCAL_RUNNER });               // warn
        installHooks(dir, { strict: true, runnerCmd: LOCAL_RUNNER }); // → strict
        const hook = readFileSync(hookPath(dir), 'utf-8');
        expect(hook).toContain('--strict || exit 1');
        expect(hook).not.toContain('|| true');                       // mode replaced, not appended
        expect(hook.match(/# >>> faf >>>/g)).toHaveLength(1);         // exactly one block
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('NEVER clobbers an existing user pre-commit hook', () => {
      const { dir } = mk();
      try {
        writeFileSync(hookPath(dir), '#!/bin/sh\necho "my linter"\nexit 0\n');
        chmodSync(hookPath(dir), 0o755);
        installHooks(dir, { runnerCmd: LOCAL_RUNNER });
        const hook = readFileSync(hookPath(dir), 'utf-8');
        expect(hook).toContain('echo "my linter"'); // user content preserved
        expect(hook).toContain('# >>> faf >>>');     // our block appended
        // uninstall removes ONLY our block
        uninstallHooks(dir);
        const after = readFileSync(hookPath(dir), 'utf-8');
        expect(after).toContain('echo "my linter"');
        expect(after).not.toContain('# >>> faf >>>');
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('REFUSES when core.hooksPath is set (husky/lefthook own hooks) — writes nothing', () => {
      const { dir, g } = mk();
      try {
        g(['config', 'core.hooksPath', '.husky']);
        const out = capture(() => {
          expect(installHooks(dir, { runnerCmd: LOCAL_RUNNER })).toBe(false);
        });
        expect(out).toMatch(/core\.hooksPath/);
        expect(existsSync(hookPath(dir))).toBe(false); // did not touch the default hooks dir
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('REFUSES a --strict install when the runner lacks hooks-run (would block commits)', () => {
      const { dir } = mk();
      try {
        let ok = true;
        const out = capture(() => { ok = installHooks(dir, { strict: true, runnerCmd: 'faf-NOPE hooks-run' }); });
        expect(ok).toBe(false);                       // refused
        expect(out).toMatch(/BLOCK/i);                // told why
        expect(existsSync(hookPath(dir))).toBe(false); // no dangerous hook written
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('warn install with an unsupported runner still installs, but warns', () => {
      const { dir } = mk();
      try {
        let ok = false;
        const out = capture(() => { ok = installHooks(dir, { runnerCmd: 'faf-NOPE hooks-run' }); });
        expect(ok).toBe(true);                          // warn mode is harmless → still installs
        expect(out).toMatch(/no-ops until you upgrade/i);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('install outside a git repo returns false, no crash', () => {
      const dir = join(tmpdir(), `faf-norepo-${Date.now()}`); mkdirSync(dir, { recursive: true });
      try {
        const out = capture(() => expect(installHooks(dir, { runnerCmd: LOCAL_RUNNER })).toBe(false));
        expect(out).toMatch(/not a git repository/i);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });

  // ── 🛑 BRAKE — hooksRun fails OPEN ──────────────────────────────────────────
  describe('🛑 BRAKE — the guard fails open', () => {
    test('untracked project.faf (never git-added) → silent pass, no throw', () => {
      const { dir } = mk();
      try {
        writeFileSync(join(dir, 'project.faf'), FULL); // on disk, NOT staged/tracked
        let captured = '';
        captured = capture(() => hooksRun({ strict: true }, dir));
        expect(captured).toBe(''); // not in index → nothing to guard
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('born-here (no HEAD version) is an improvement, never a regression', () => {
      const { dir, g } = mk();
      try {
        writeFileSync(join(dir, 'readme.md'), 'x'); g(['add', 'readme.md']); g(['commit', '-q', '-m', 'base']);
        stage(dir, g, FULL); // project.faf added for the first time
        let out = '';
        out = capture(() => hooksRun({ strict: true }, dir));
        expect(out).toContain('✓'); // 0% → N%, not a block
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('not-a-git-repo → hooksRun is a silent no-op', () => {
      const dir = join(tmpdir(), `faf-norepo2-${Date.now()}`); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'project.faf'), FULL);
      try {
        let out = '';
        out = capture(() => hooksRun({ strict: true }, dir));
        expect(out).toBe('');
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });

  // ── 🌬️ AERO — status ────────────────────────────────────────────────────────
  describe('🌬️ AERO — status', () => {
    test('status reports installed mode + hooksPath conflict', () => {
      const { dir, g } = mk();
      try {
        let out = capture(() => hooksStatus(dir));
        expect(out).toMatch(/installed:\s*no/i);
        installHooks(dir, { strict: true, runnerCmd: LOCAL_RUNNER });
        out = capture(() => hooksStatus(dir));
        expect(out).toMatch(/strict/i);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });

  // ── 🛞 TYRE — REAL git commits ──────────────────────────────────────────────
  describe('🛞 TYRE — real git commit behaviour', () => {
    test('STRICT blocks a commit that regresses the score', () => {
      const { dir, g } = mk();
      try {
        stage(dir, g, FULL); g(['commit', '-q', '-m', 'baseline (high score)']);
        installHooks(dir, { strict: true, runnerCmd: LOCAL_RUNNER });
        stage(dir, g, MIN); // regress
        const r = commit(dir, 'drop context');
        expect(r.ok).toBe(false);            // commit BLOCKED
        expect(r.out).toMatch(/regress|blocked/i);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('WARN informs but never blocks the same regression', () => {
      const { dir, g } = mk();
      try {
        stage(dir, g, FULL); g(['commit', '-q', '-m', 'baseline']);
        installHooks(dir, { runnerCmd: LOCAL_RUNNER }); // warn
        stage(dir, g, MIN);
        const r = commit(dir, 'drop context');
        expect(r.ok).toBe(true);             // commit ALLOWED
        expect(r.out).toMatch(/regress/i);   // but warned
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('STRICT lets an improving commit through', () => {
      const { dir, g } = mk();
      try {
        stage(dir, g, MIN); g(['commit', '-q', '-m', 'baseline (low)']);
        installHooks(dir, { strict: true, runnerCmd: LOCAL_RUNNER });
        stage(dir, g, FULL); // improve
        const r = commit(dir, 'enrich context');
        expect(r.ok).toBe(true);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('faf NOT on PATH → the guard skips, commit proceeds even in strict', () => {
      const { dir, g } = mk();
      try {
        stage(dir, g, FULL); g(['commit', '-q', '-m', 'baseline']);
        installHooks(dir, { strict: true, runnerCmd: 'faf-DEFINITELY-NOT-INSTALLED hooks-run' });
        stage(dir, g, MIN); // would regress IF the guard ran
        const r = commit(dir, 'drop context, no faf');
        expect(r.ok).toBe(true); // command -v guard skipped it — never break a commit over a missing tool
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--no-verify bypasses the strict guard (git-native escape hatch)', () => {
      const { dir, g } = mk();
      try {
        stage(dir, g, FULL); g(['commit', '-q', '-m', 'baseline']);
        installHooks(dir, { strict: true, runnerCmd: LOCAL_RUNNER });
        stage(dir, g, MIN);
        const r = commit(dir, 'override', ['--no-verify']);
        expect(r.ok).toBe(true);
        expect(r.out).not.toMatch(/regress/i); // hook never ran
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('an existing user hook STILL runs alongside the faf block', () => {
      const { dir, g } = mk();
      try {
        // user hook drops a flag file when it runs
        writeFileSync(hookPath(dir), `#!/bin/sh\ntouch "${join(dir, 'USER_HOOK_RAN')}"\n`);
        chmodSync(hookPath(dir), 0o755);
        stage(dir, g, FULL); g(['commit', '-q', '-m', 'baseline']);
        installHooks(dir, { runnerCmd: LOCAL_RUNNER }); // append, warn
        stage(dir, g, MIN);
        const r = commit(dir, 'change');
        expect(r.ok).toBe(true);
        expect(existsSync(join(dir, 'USER_HOOK_RAN'))).toBe(true); // user hook preserved + executed
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });
});
