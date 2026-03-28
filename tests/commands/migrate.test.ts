import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';

describe('migrate command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-migrate-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('migrates old version to 3.0', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 1.0.0\nproject:\n  name: test\n`);

    const { migrateCommand } = require('../../src/commands/migrate.js');
    migrateCommand();

    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.faf_version).toBe('3.0');
    expect(content.project.name).toBe('test');
    expect(content.stack).toBeDefined();
    expect(content.human_context).toBeDefined();
    expect(content.monorepo).toBeDefined();
  });

  test('already at current version is no-op', () => {
    const original = `faf_version: "3.0"\nproject:\n  name: test\n`;
    writeFileSync(join(testDir, 'project.faf'), original);

    const { migrateCommand } = require('../../src/commands/migrate.js');
    migrateCommand();

    // File should be unchanged (still 3.0)
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.faf_version).toBe('3.0');
  });

  test('dry run does not modify file', () => {
    const original = `faf_version: 1.0.0\nproject:\n  name: test\n`;
    writeFileSync(join(testDir, 'project.faf'), original);

    const { migrateCommand } = require('../../src/commands/migrate.js');
    migrateCommand({ dryRun: true });

    const content = readFileSync(join(testDir, 'project.faf'), 'utf-8');
    expect(content).toBe(original);
  });
});
