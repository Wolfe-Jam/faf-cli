import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { driftCommand } from '../../src/commands/drift.js';

describe('ENGINE: drift command', () => {
  let testDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-drift-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    origCwd = process.cwd;
    process.cwd = () => testDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(testDir, { recursive: true, force: true });
  });

  test('reports missing context files', () => {
    writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: drift-test\n');

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      driftCommand();
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    expect(output).toContain('CLAUDE.md');
    expect(output).toContain('missing');
  });

  test('detects newer context file', () => {
    const fafPath = join(testDir, 'project.faf');
    const claudePath = join(testDir, 'CLAUDE.md');

    writeFileSync(fafPath, 'faf_version: 2.5.0\nproject:\n  name: drift-test\n');
    // Set .faf to past
    const past = new Date(Date.now() - 60000);
    utimesSync(fafPath, past, past);
    // Write CLAUDE.md now (newer)
    writeFileSync(claudePath, '# CLAUDE.md');

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      driftCommand();
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    expect(output).toContain('newer');
  });

  test('--json emits a JSON error (not a stderr string) when there is no project.faf', () => {
    const logs: string[] = [];
    const origLog = console.log;
    const origExit = process.exit;
    let exitCode: number | undefined;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    // @ts-expect-error — stub for the test
    process.exit = (code?: number) => { exitCode = code; throw new Error('__exit__'); };
    try {
      driftCommand({ json: true });
    } catch (e) {
      if ((e as Error).message !== '__exit__') throw e;
    } finally {
      console.log = origLog;
      process.exit = origExit;
    }

    expect(exitCode).toBe(2);
    const report = JSON.parse(logs.join('\n'));
    expect(report.error).toContain('project.faf not found');
    expect(report.hint).toContain('faf init');
  });

  test('--json emits a parseable report with the metadata header', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, 'faf_version: 3.0.0\nproject:\n  name: drift-json-test\n');
    const past = new Date(Date.now() - 60000);
    utimesSync(fafPath, past, past);
    writeFileSync(join(testDir, 'CLAUDE.md'), '# CLAUDE.md'); // newer -> drift

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      driftCommand({ json: true });
    } finally {
      console.log = orig;
    }

    const report = JSON.parse(logs.join('\n'));
    expect(report.faf_version).toBe('3.0.0');
    expect(report.project).toBe('drift-json-test');
    expect(report.source).toContain('project.faf');
    expect(typeof report.source_mtime_ms).toBe('number');
    expect(report.targets).toHaveLength(4);
    expect(report.drifted).toBe(1);
    const claude = report.targets.find((t: { file: string }) => t.file === 'CLAUDE.md');
    expect(claude.status).toBe('newer');
  });
});
