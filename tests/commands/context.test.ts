import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { contextCommand } from '../../src/commands/context.js';

describe('context command', () => {
  let testDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-context-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    origCwd = process.cwd;
    process.cwd = () => testDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(testDir, { recursive: true, force: true });
  });

  test('prints populated slots', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: ctx-test\n  goal: Testing context\n  main_language: TypeScript\n`);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      contextCommand();
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    expect(output).toContain('project.name: ctx-test');
    expect(output).toContain('project.goal: Testing context');
    expect(output).toContain('project.main_language: TypeScript');
  });

  test('skips slotignored and empty values', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: ctx-test\nstack:\n  frontend: slotignored\n  backend: ""\n`);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      contextCommand();
    } finally {
      console.log = orig;
    }
    const output = logs.join('\n');
    expect(output).not.toContain('slotignored');
    expect(output).not.toContain('stack.backend');
  });
});
