import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, utimesSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFaf, readFaf, readFafRaw } from '../../src/interop/faf.js';
import { generateClaudeMd, writeClaudeMd } from '../../src/interop/claude.js';

describe('sync command — generateClaudeMd output contract', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  test('push generates CLAUDE.md from .faf with project metadata', () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'sync-test', goal: 'Testing sync', main_language: 'TypeScript' },
    });

    const data = { faf_version: '2.5.0', project: { name: 'sync-test', goal: 'Testing sync', main_language: 'TypeScript' } };
    const content = generateClaudeMd(data);
    writeClaudeMd(testDir, content);

    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);
    const md = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('sync-test');
    expect(md).toContain('BI-SYNC ACTIVE');
  });

  test('generateClaudeMd skips slotignored values', () => {
    const data = {
      faf_version: '2.5.0',
      project: { name: 'cli-tool', main_language: 'TypeScript' },
      stack: { frontend: 'slotignored', backend: 'slotignored', runtime: 'Node.js' },
    };
    const content = generateClaudeMd(data);
    expect(content).not.toContain('slotignored');
    expect(content).toContain('Node.js');
  });

  test('generateClaudeMd handles empty project gracefully', () => {
    const data = { faf_version: '2.5.0', project: {} };
    expect(() => generateClaudeMd(data)).not.toThrow();
    const content = generateClaudeMd(data);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  test('generateClaudeMd output is deterministic for same input', () => {
    const data = {
      faf_version: '2.5.0',
      project: { name: 'deterministic', goal: 'same in same out' },
    };
    const a = generateClaudeMd(data);
    const b = generateClaudeMd(data);
    expect(a).toBe(b);
  });
});

describe('sync command — error paths', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-sync-err-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  test('syncCommand() in dir without .faf → exits 2 with clear error', async () => {
    const { syncCommand } = await import('../../src/commands/sync.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      syncCommand();
      throw new Error('expected process.exit');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_2__');
    }
    errSpy.mockRestore();
    exitSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/project\.faf not found/);
  });
});

describe('sync command — direction logic (auto / push / pull)', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-sync-dir-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  test('auto sync writes CLAUDE.md when none exists (push direction)', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'auto-test', main_language: 'TypeScript' },
    });
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(false);

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'auto' });
    logSpy.mockRestore();

    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);
  });

  test('explicit push always writes CLAUDE.md from .faf', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'push-test' },
    });
    // Pre-existing CLAUDE.md with stale content
    writeFileSync(join(testDir, 'CLAUDE.md'), '# stale content\n');

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'push' });
    logSpy.mockRestore();

    const md = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('push-test');
    expect(md).not.toContain('stale content');
  });

  test('explicit pull updates .faf from CLAUDE.md', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'old-name' },
    });
    // Place a CLAUDE.md with newer project metadata.
    // Generate via the same helper so the parse expectations align.
    const newData = { faf_version: '2.5.0', project: { name: 'new-name', goal: 'pulled goal' } };
    writeFileSync(join(testDir, 'CLAUDE.md'), generateClaudeMd(newData));

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'pull' });
    logSpy.mockRestore();

    const updated = readFaf(join(testDir, 'project.faf'));
    expect(updated.project?.name).toBe('new-name');
  });

  test('pull with no CLAUDE.md → error message, no crash', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'lonely' },
    });
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(false);

    const { syncCommand } = await import('../../src/commands/sync.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    expect(() => syncCommand({ direction: 'pull' })).not.toThrow();
    errSpy.mockRestore();
    logSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/CLAUDE\.md not found/);
  });

  test('auto with newer CLAUDE.md prefers pull direction', async () => {
    // Write .faf first, then CLAUDE.md with a later mtime
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'old' },
    });
    // Force .faf mtime to be older
    const past = new Date(Date.now() - 60_000);
    utimesSync(join(testDir, 'project.faf'), past, past);

    const newData = { faf_version: '2.5.0', project: { name: 'newer-from-md' } };
    writeFileSync(join(testDir, 'CLAUDE.md'), generateClaudeMd(newData));
    // CLAUDE.md mtime is now (newer)

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'auto' });
    logSpy.mockRestore();

    // With CLAUDE.md newer than .faf, auto should pull → .faf gets updated
    const updated = readFaf(join(testDir, 'project.faf'));
    expect(updated.project?.name).toBe('newer-from-md');
  });
});
