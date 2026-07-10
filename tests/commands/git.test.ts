import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { detectStack } from '../../src/detect/stack.js';
import { FAF_VERSION } from '../../src/core/version.js';
import { parse } from 'yaml';

describe('TYRE: git command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-git-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('detectStack works on a directory with package.json', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'git-test-app',
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    }));

    const data = detectStack(testDir);
    expect(data.project?.name).toBe('git-test-app');
    expect(data.faf_version).toBe(FAF_VERSION);
  });

  test('detectStack handles empty directory', () => {
    const data = detectStack(testDir);
    expect(data.faf_version).toBe(FAF_VERSION);
    expect(data.project).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase D — gitCommand network-failure resilience
  // ──────────────────────────────────────────────────────────────────

  test('gitCommand() with no URL → exits 1 with usage error', async () => {
    const { gitCommand } = await import('../../src/commands/git.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      gitCommand('');
      throw new Error('expected process.exit');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_1__');
    }
    errSpy.mockRestore();
    exitSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/Please provide a GitHub URL/);
  });

  test('gitCommand() with unreachable URL → exits 1 with friendly message (no raw stack)', async () => {
    const { gitCommand } = await import('../../src/commands/git.js');
    const errs: string[] = [];
    const logs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      // Use a guaranteed-bogus host. .invalid is RFC 2606 reserved — never
      // resolves anywhere, so DNS will fail fast (no internet needed).
      gitCommand('https://this-host-does-not-exist.invalid/never/ever');
      throw new Error('expected process.exit');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_1__');
    }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();
    // Friendly error includes "could not clone" and the URL we passed
    const allErr = errs.join('\n');
    expect(allErr).toMatch(/could not clone/);
    expect(allErr).toContain('this-host-does-not-exist.invalid');
  });

  test('gitCommand() prints "cloning" progress to stderr, never stdout (keeps --stdout clean)', async () => {
    const { gitCommand } = await import('../../src/commands/git.js');
    const errs: string[] = [];
    const logs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      // .invalid fails fast (no network) — but the progress line prints BEFORE the clone,
      // so we still capture which stream it took. --stdout reserves stdout for the .faf.
      gitCommand('https://this-host-does-not-exist.invalid/never/ever', { stdout: true });
    } catch { /* exits on clone failure — expected; the progress line already printed */ }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/cloning/);       // progress → stderr
    expect(logs.join('\n')).not.toMatch(/cloning/);   // never → stdout (that leak was the bug)
  });

  test('gitCommand() with malformed URL → exits 1 (not a process crash)', async () => {
    const { gitCommand } = await import('../../src/commands/git.js');
    const errSpy = spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      gitCommand('not-a-url-at-all');
      throw new Error('expected process.exit');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_1__');
    }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('git clone and detect roundtrip on local repo', () => {
    // Create a fake local git repo to clone
    const repoDir = join(testDir, 'source-repo');
    mkdirSync(repoDir);
    execSync(`git init ${repoDir}`, { stdio: 'pipe' });
    // CI runners have no global git identity; set it locally so the commit succeeds.
    execSync(`git -C ${repoDir} config user.email "test@faf.one" && git -C ${repoDir} config user.name "faf-test"`, { stdio: 'pipe' });
    writeFileSync(join(repoDir, 'package.json'), JSON.stringify({ name: 'local-repo' }));
    execSync(`git -C ${repoDir} add -A && git -C ${repoDir} commit -m "init"`, { stdio: 'pipe' });

    // Clone it
    const cloneDir = join(testDir, 'cloned');
    execSync(`git clone ${repoDir} ${cloneDir}`, { stdio: 'pipe' });

    const data = detectStack(cloneDir);
    expect(data.project?.name).toBe('local-repo');
  });
});
