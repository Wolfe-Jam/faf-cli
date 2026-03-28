import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';

describe('auto command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-auto-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('creates project.faf from scratch', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test-auto', version: '1.0.0' }));

    const { autoCommand } = require('../../src/commands/auto.js');
    autoCommand();

    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.faf_version).toBe('3.0');
  });

  test('merges into existing project.faf', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: "3.0"\nproject:\n  name: existing\n  goal: My goal\n`);
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test-auto' }));

    const { autoCommand } = require('../../src/commands/auto.js');
    autoCommand();

    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('existing');
    expect(content.project.goal).toBe('My goal');
  });

  test('detects language from package.json', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'ts-app', devDependencies: { typescript: '^5.0.0' } }));

    const { autoCommand } = require('../../src/commands/auto.js');
    autoCommand();

    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.main_language).toBeDefined();
  });
});
