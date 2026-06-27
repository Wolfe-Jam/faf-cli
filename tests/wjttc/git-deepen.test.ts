/**
 * WJTTC — `faf git` deepened on-ramp (#38) + 7.0 surface cohesion.
 *
 * `faf git <url>` used to silently CLOBBER your project.faf and only ever pull
 * the default branch. Deepened to: refuse-to-overwrite (--force to override),
 * --output, --stdout (inspect without writing), and --ref for VERSIONED context
 * (any branch/tag). Plus `faf --help` now groups the git-native surface so it
 * reads as a unit. Tests avoid the network — the clone is the only net call.
 *
 * Tiers:
 *   ⚙️ ENGINE — resolveGitTarget (no-clobber) + cloneArgs (--ref plumbing)
 *   🛞 TYRE   — `faf --help` presents the Git-native group (real subprocess)
 */
import { describe, test, expect } from 'bun:test';
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolveGitTarget, cloneArgs, repoNameFromUrl } from '../../src/commands/git.js';

const tmp = (tag: string) => join(tmpdir(), `faf-gitdeepen-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const CLI = join(import.meta.dir, '../../src/cli.ts');

describe('WJTTC — faf git (deepened) + 7.0 cohesion', () => {
  // ── ⚙️ ENGINE — no-clobber safety ───────────────────────────────────────────
  describe('⚙️ ENGINE — resolveGitTarget', () => {
    test('refuses to overwrite an existing project.faf', () => {
      const dir = tmp('clob'); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'project.faf'), 'existing context');
      try {
        expect(() => resolveGitTarget({}, dir)).toThrow(/already exists/i);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--force replaces it; returns the default path', () => {
      const dir = tmp('force'); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'project.faf'), 'existing');
      try {
        expect(resolveGitTarget({ force: true }, dir).outputPath).toBe(join(dir, 'project.faf'));
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--output writes elsewhere, leaving project.faf untouched', () => {
      const dir = tmp('out'); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'project.faf'), 'existing'); // present, but we target elsewhere
      try {
        expect(resolveGitTarget({ output: 'sub/other.faf' }, dir).outputPath).toBe(join(dir, 'sub/other.faf'));
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });

    test('--stdout → null path (print, never write)', () => {
      expect(resolveGitTarget({ stdout: true }, '/anywhere').outputPath).toBeNull();
    });

    test('a clean dir → default path, no throw', () => {
      const dir = tmp('clean'); mkdirSync(dir, { recursive: true });
      try {
        expect(resolveGitTarget({}, dir).outputPath).toBe(join(dir, 'project.faf'));
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  });

  // ── ⚙️ ENGINE — versioned context (--ref) ───────────────────────────────────
  describe('⚙️ ENGINE — cloneArgs', () => {
    test('no ref → shallow clone, no --branch', () => {
      expect(cloneArgs('https://x/y.git', '/tmp/z')).toEqual([
        'clone', '--depth', '1', '--', 'https://x/y.git', '/tmp/z',
      ]);
    });
    test('ref → --branch pins the branch/tag (versioned context)', () => {
      const a = cloneArgs('https://x/y.git', '/tmp/z', 'v1.2.0');
      expect(a).toContain('--branch');
      expect(a[a.indexOf('--branch') + 1]).toBe('v1.2.0');
    });
  });

  // ── ⚙️ ENGINE — the project is named after the repo, not the clone dir ───────
  describe('⚙️ ENGINE — repoNameFromUrl', () => {
    test('pulls the repo name from a normalized clone URL', () => {
      expect(repoNameFromUrl('https://github.com/octocat/Hello-World.git')).toBe('Hello-World');
      expect(repoNameFromUrl('https://github.com/owner/my.repo.git')).toBe('my.repo');
      expect(repoNameFromUrl('https://example.com/a/b/c.git')).toBe('c');
    });
  });

  // ── 🛞 TYRE — cohesion in `faf --help` ──────────────────────────────────────
  describe('🛞 TYRE — faf --help presents the git-native group', () => {
    test('--help lists the Git-native section (diff/log/hooks/git)', () => {
      const r = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf-8' });
      const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
      expect(out).toMatch(/Git-native/i);
      expect(out).toContain('faf diff');
      expect(out).toContain('faf log');
      expect(out).toContain('faf hooks');
      expect(out).toMatch(/Context what Git is to Versions/);
    });
  });
});
