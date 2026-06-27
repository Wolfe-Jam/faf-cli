import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, utimesSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFaf, readFaf, readFafRaw } from '../../src/interop/faf.js';
import { generateClaudeMd, writeClaudeMd } from '../../src/interop/claude.js';

describe('ENGINE: sync command — generateClaudeMd output contract', () => {
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

  test('generateClaudeMd labels are registry-sourced (API, CI/CD, Framework), acronym fallback', () => {
    const data = {
      faf_version: '2.5.0',
      project: { name: 'cli-tool', main_language: 'TypeScript' },
      stack: { api_type: 'MCP', runtime: 'Node.js', cicd: 'GitHub Actions', frontend: 'Svelte', mcp_sdk: '1.0' },
    };
    const content = generateClaudeMd(data);
    expect(content).toContain('**API:** MCP');              // registry: api_type → "API"
    expect(content).toContain('**CI/CD:** GitHub Actions'); // registry: cicd → "CI/CD" (was "Cicd")
    expect(content).toContain('**Framework:** Svelte');     // registry: frontend → "Framework"
    expect(content).toContain('**Runtime:** Node.js');
    expect(content).toContain('**MCP SDK:** 1.0');          // off-registry key → acronym fallback
    expect(content).not.toContain('**Api Type:**');
    expect(content).not.toContain('**Cicd:**');
  });

  test('generateClaudeMd handles empty project gracefully', () => {
    const data = { faf_version: '2.5.0', project: {} };
    expect(() => generateClaudeMd(data)).not.toThrow();
    const content = generateClaudeMd(data);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  test('generateClaudeMd output is stable across calls (modulo timestamp)', () => {
    // generateClaudeMd embeds a `Last Sync: <ISO timestamp>` line, so byte-
    // identical determinism is not a real invariant. What IS invariant is
    // that the structural content (project metadata, sync marker, body) stays
    // the same — only the timestamp moves. Strip the timestamp line and
    // assert the rest matches.
    const data = {
      faf_version: '2.5.0',
      project: { name: 'deterministic', goal: 'same in same out' },
    };
    // Strip ISO 8601 timestamps (the only non-deterministic content). Robust
    // to which marker text the implementation uses around the timestamp.
    const stripTimestamp = (s: string) => s.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/g, '<TS>');
    const a = stripTimestamp(generateClaudeMd(data));
    const b = stripTimestamp(generateClaudeMd(data));
    expect(a).toBe(b);
  });
});

describe('BRAKE: sync command — error paths', () => {
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

describe('TYRE: sync command — direction logic (auto / push / pull)', () => {
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

  test('explicit push regenerates the faf block from .faf, preserves user content', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'push-test' },
    });
    // faf-managed CLAUDE.md: stale content INSIDE the block + user content OUTSIDE it
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '<!-- faf:start -->\nstale block content\n<!-- faf:end -->\n\n## My Notes\nKEEP THIS\n',
    );

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'push' });
    logSpy.mockRestore();

    const md = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('push-test');          // fresh .faf pushed into the block
    expect(md).not.toContain('stale block content'); // stale BLOCK content replaced
    expect(md).toContain('KEEP THIS');          // user content preserved (non-destructive)
  });

  // v6.6.0+ Trophy gate: pull (MD → .faf) is Trophy-gated. Below 100%, the
  // gate blocks with a helpful message and exits 1. At 100%, pull unlocks.
  // Per memory/trophy-is-the-target.md — "Bi-sync — formalised as a
  // Trophy-gated unlocked feature."

  test('pull at sub-Trophy is blocked with helpful message (v6.6 gate)', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'old-name' }, // sub-Trophy by design
    });
    const newData = { faf_version: '2.5.0', project: { name: 'new-name', goal: 'pulled goal' } };
    writeFileSync(join(testDir, 'CLAUDE.md'), generateClaudeMd(newData));

    const { syncCommand } = await import('../../src/commands/sync.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);

    try {
      syncCommand({ direction: 'pull' });
      throw new Error('expected process.exit');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_1__');
    }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();

    expect(errs.join('\n')).toMatch(/blocked.*Trophy/);
    expect(errs.join('\n')).toMatch(/backfill only runs at 100%/);

    // .faf should be UNCHANGED — gate fires before any write.
    const unchanged = readFaf(join(testDir, 'project.faf'));
    expect(unchanged.project?.name).toBe('old-name');
  });

  test('pull at sub-Trophy with no CLAUDE.md still blocks on Trophy gate first', async () => {
    // Gate fires before CLAUDE.md existence check — the partial-.faf is the
    // safety failure, not the missing MD. Order matters.
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'lonely' },
    });
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(false);

    const { syncCommand } = await import('../../src/commands/sync.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);

    try {
      syncCommand({ direction: 'pull' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_1__');
    }
    errSpy.mockRestore();
    logSpy.mockRestore();
    exitSpy.mockRestore();

    expect(errs.join('\n')).toMatch(/blocked.*Trophy/);
  });

  // ─── #63: auto sync is one-way push (.faf → CLAUDE.md), regardless of mtime ───
  // Doctrine: "FAF defines. MD instructs." — .faf is the FCL canonical truth;
  // CLAUDE.md is a downstream prose surface that READS .faf. mtime-based "newer
  // wins" silently overwrote canonical .faf content (issue #63).
  // Use `faf sync --pull` for the explicit legacy bootstrap case.

  test('#63: auto sync never pulls from CLAUDE.md, even when CLAUDE.md is newer', async () => {
    // Write .faf with canonical content
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'canonical-name', goal: 'canonical goal phrasing' },
    });
    // Force .faf mtime to be older
    const past = new Date(Date.now() - 60_000);
    utimesSync(join(testDir, 'project.faf'), past, past);

    // Author a CLAUDE.md (newer mtime) with divergent prose
    const drift = { faf_version: '2.5.0', project: { name: 'drifted-md-name', goal: 'rephrased prose' } };
    writeFileSync(join(testDir, 'CLAUDE.md'), generateClaudeMd(drift));

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'auto' });
    logSpy.mockRestore();

    // Critical: .faf must NOT be overwritten by the newer CLAUDE.md.
    const after = readFaf(join(testDir, 'project.faf'));
    expect(after.project?.name).toBe('canonical-name');
    expect(after.project?.goal).toBe('canonical goal phrasing');
  });

  test('#63: auto sync always pushes — faf block regenerated from .faf, user content kept', async () => {
    writeFaf(join(testDir, 'project.faf'), {
      faf_version: '2.5.0',
      project: { name: 'src-of-truth', goal: 'the structured goal' },
    });
    // Older .faf mtime
    const past = new Date(Date.now() - 60_000);
    utimesSync(join(testDir, 'project.faf'), past, past);

    // faf-managed CLAUDE.md (newer mtime): stale content INSIDE the block + user content OUTSIDE
    writeFileSync(
      join(testDir, 'CLAUDE.md'),
      '<!-- faf:start -->\n# CLAUDE.md — stale-name\n\nstale prose\n<!-- faf:end -->\n\n## Team Notes\nKEEP THIS\n',
    );

    const { syncCommand } = await import('../../src/commands/sync.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    syncCommand({ direction: 'auto' });
    logSpy.mockRestore();

    // The faf block must reflect .faf (push), not its own previous content; user content stays
    const md = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('src-of-truth');
    expect(md).toContain('the structured goal');
    expect(md).not.toContain('stale-name');   // stale BLOCK content replaced
    expect(md).not.toContain('stale prose');
    expect(md).toContain('KEEP THIS');         // user content preserved
  });

  // The legacy bootstrap path (`--pull`, MD → .faf) is preserved but
  // Trophy-gated in v6.6.0+. Block-at-sub-Trophy and CLAUDE-not-found-at-sub-
  // Trophy are covered by the two tests above. The Trophy-unlocked behavior
  // requires a 100% .faf — gated through a kernel score call we don't stub
  // here. The doctrine is documented in src/commands/sync.ts and the gate
  // is exercised by the two tests above.
});
