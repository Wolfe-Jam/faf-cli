import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('export command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-export-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('exports AGENTS.md', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: export-test\n  goal: Test export\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ agents: true });

    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(true);
    const content = readFileSync(join(testDir, 'AGENTS.md'), 'utf-8');
    expect(content).toContain('export-test');
  });

  test('exports .cursorrules', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: cursor-test\n  goal: Test\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ cursor: true });

    expect(existsSync(join(testDir, '.cursorrules'))).toBe(true);
  });

  test('exports GEMINI.md', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: gemini-test\n  goal: Test\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ gemini: true });

    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(true);
  });

  test('exports all formats with --all', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: all-test\n  goal: Test\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ all: true });

    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(testDir, '.cursorrules'))).toBe(true);
    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(true);
  });
});
