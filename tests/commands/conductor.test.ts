import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';

describe('conductor command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-conductor-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('imports from JSON config', () => {
    const configPath = join(testDir, 'conductor.json');
    writeFileSync(configPath, JSON.stringify({
      name: 'conductor-app',
      description: 'My conductor project',
      language: 'Python',
    }));

    const { conductorCommand } = require('../../src/commands/conductor.js');
    conductorCommand('import', configPath);

    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('conductor-app');
    expect(content.project.goal).toBe('My conductor project');
    expect(content.project.main_language).toBe('Python');
  });

  test('exports .faf as conductor config', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: test\n  goal: My app\n  main_language: TypeScript\nstack:\n  frontend: React\n`);

    const { conductorCommand } = require('../../src/commands/conductor.js');
    // Export just logs JSON to stdout — verify it doesn't throw
    expect(() => conductorCommand('export')).not.toThrow();
  });

  test('imports from directory of config files', () => {
    const configDir = join(testDir, 'config');
    mkdirSync(configDir);
    writeFileSync(join(configDir, 'main.json'), JSON.stringify({ name: 'dir-app' }));

    const { conductorCommand } = require('../../src/commands/conductor.js');
    conductorCommand('import', configDir);

    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('dir-app');
  });

  test('shows help without subcommand', () => {
    const { conductorCommand } = require('../../src/commands/conductor.js');
    expect(() => conductorCommand()).not.toThrow();
  });
});
