import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { driftCommand } from '../../src/commands/drift.js';

describe('drift command', () => {
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
});
