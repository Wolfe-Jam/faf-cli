import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { computeDrift } from '../../src/core/drift';

// ENGINE — the pure mtime comparison behind `faf drift`. No console, no cwd:
// callers pass an explicit dir; the default is the .faf's own directory.
describe('ENGINE: computeDrift', () => {
  let dir: string;
  const faf = () => join(dir, 'project.faf');
  const stamp = (path: string, msFromNow: number): void => {
    const t = new Date(Date.now() + msFromNow);
    utimesSync(path, t, t);
  };

  beforeEach(() => {
    dir = join(tmpdir(), `faf-test-computedrift-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(faf(), 'faf_version: 3.0.0\nproject:\n  name: drift-core-test\n');
    stamp(faf(), 0);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('classifies newer / older / in-sync / missing per target', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), '# CLAUDE');
    stamp(join(dir, 'CLAUDE.md'), 60_000); // 1 min newer -> drifted

    writeFileSync(join(dir, 'AGENTS.md'), '# AGENTS');
    stamp(join(dir, 'AGENTS.md'), -60_000); // 1 min older -> drifted

    writeFileSync(join(dir, '.cursorrules'), 'rules');
    stamp(join(dir, '.cursorrules'), 200); // within 1000ms tolerance -> in sync

    // GEMINI.md left absent -> missing

    const report = computeDrift(faf(), dir);

    const byFile = Object.fromEntries(report.targets.map((t) => [t.file, t]));
    expect(byFile['CLAUDE.md'].status).toBe('newer');
    expect(byFile['CLAUDE.md'].exists).toBe(true);
    expect(byFile['CLAUDE.md'].delta_ms).toBeGreaterThan(0);
    expect(byFile['AGENTS.md'].status).toBe('older');
    expect(byFile['AGENTS.md'].delta_ms).toBeLessThan(0);
    expect(byFile['.cursorrules'].status).toBe('in-sync');
    expect(byFile['GEMINI.md'].status).toBe('missing');
    expect(byFile['GEMINI.md'].exists).toBe(false);
    expect(byFile['GEMINI.md'].mtime_ms).toBeNull();
    expect(byFile['GEMINI.md'].delta_ms).toBeNull();

    expect(report.drifted).toBe(2);
    expect(report.in_sync).toBe(1);
    expect(report.missing).toBe(1);
    expect(report.source).toBe(faf());
    expect(typeof report.source_mtime_ms).toBe('number');
  });

  test('all four targets missing -> missing 4, drifted 0', () => {
    const report = computeDrift(faf(), dir);
    expect(report.missing).toBe(4);
    expect(report.drifted).toBe(0);
    expect(report.in_sync).toBe(0);
    expect(report.targets).toHaveLength(4);
  });

  test('dir defaults to the .faf directory', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), '# CLAUDE');
    stamp(join(dir, 'CLAUDE.md'), 0);
    const report = computeDrift(faf());
    expect(report.in_sync).toBe(1);
    expect(report.missing).toBe(3);
  });
});
