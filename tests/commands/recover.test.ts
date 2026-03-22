import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';

describe('recover command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-recover-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('recovers from CLAUDE.md', () => {
    writeFileSync(join(testDir, 'CLAUDE.md'), `# Test
- **Name:** my-project
- **What Building:** A cool app
- **Main Language:** TypeScript
`);

    // Import and run the recover logic directly
    const { recoverCommand } = require('../../src/commands/recover.js');
    recoverCommand();

    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('my-project');
    expect(content.project.goal).toBe('A cool app');
    expect(content.project.main_language).toBe('TypeScript');
  });

  test('recovers from AGENTS.md when no CLAUDE.md', () => {
    writeFileSync(join(testDir, 'AGENTS.md'), `# awesome-lib\nSome agent config\n`);

    const { recoverCommand } = require('../../src/commands/recover.js');
    recoverCommand();

    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('awesome-lib');
  });

  test('merges into existing .faf', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  main_language: Rust\n`);
    writeFileSync(join(testDir, 'CLAUDE.md'), `# Test\n- **Name:** recovered-name\n`);

    const { recoverCommand } = require('../../src/commands/recover.js');
    recoverCommand();

    const content = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(content.project.name).toBe('recovered-name');
    expect(content.project.main_language).toBe('Rust');
  });
});
