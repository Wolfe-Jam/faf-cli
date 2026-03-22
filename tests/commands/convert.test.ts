import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { convertCommand } from '../../src/commands/convert.js';

describe('convert command', () => {
  let testDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-convert-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: convert-test\n  goal: Testing convert\n`);
    origCwd = process.cwd;
    process.cwd = () => testDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(testDir, { recursive: true, force: true });
  });

  test('outputs raw YAML by default', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      convertCommand();
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    expect(output).toContain('convert-test');
    expect(output).toContain('faf_version');
  });

  test('outputs JSON with --json', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      convertCommand({ json: true });
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed.project.name).toBe('convert-test');
  });
});
