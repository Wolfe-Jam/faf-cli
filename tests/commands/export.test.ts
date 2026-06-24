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
    expect(existsSync(join(testDir, '.github', 'copilot-instructions.md'))).toBe(true);
  });

  test('exports .github/copilot-instructions.md (nested path, creates .github)', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: copilot-test\n  goal: Test copilot\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });

    const out = join(testDir, '.github', 'copilot-instructions.md');
    expect(existsSync(out)).toBe(true);
    const content = readFileSync(out, 'utf-8');
    expect(content).toContain('copilot-test');
    expect(content).toContain('GitHub Copilot Instructions');
    expect(content).toContain('<!-- faf:start -->');
  });

  test('--copilot alone does not write the other formats (exportAll guard)', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: guard-test\n  goal: Test\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });

    expect(existsSync(join(testDir, '.github', 'copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(false);
  });

  test('copilot-instructions.md is idempotent (no duplicate faf block on re-run)', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: idem-test\n  goal: Test\n  main_language: TypeScript\n`);

    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand({ copilot: true });
    exportCommand({ copilot: true });

    const content = readFileSync(join(testDir, '.github', 'copilot-instructions.md'), 'utf-8');
    expect(content.split('<!-- faf:start -->').length - 1).toBe(1);
  });
});
