import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('taf command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-taf-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('generates TAF receipt to file', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: test-taf\n  goal: Test\n  main_language: TypeScript\n`);
    const outPath = join(testDir, 'receipt.json');

    const { tafCommand } = require('../../src/commands/taf.js');
    tafCommand({ output: outPath });

    expect(existsSync(outPath)).toBe(true);
    const receipt = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(receipt.taf_version).toBe('1.0.0');
    expect(receipt.project).toBe('test-taf');
    expect(receipt.score).toBeGreaterThan(0);
    expect(receipt.tier).toBeDefined();
    expect(receipt.slots).toBeDefined();
  });

  test('TAF receipt has correct structure', () => {
    writeFileSync(join(testDir, 'project.faf'), `faf_version: 2.5.0\nproject:\n  name: test\n  goal: Test\n  main_language: TypeScript\n`);
    const outPath = join(testDir, 'receipt.json');

    const { tafCommand } = require('../../src/commands/taf.js');
    tafCommand({ output: outPath });

    const receipt = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(receipt).toHaveProperty('taf_version');
    expect(receipt).toHaveProperty('generated');
    expect(receipt).toHaveProperty('source');
    expect(receipt).toHaveProperty('project');
    expect(receipt).toHaveProperty('faf_version');
    expect(receipt).toHaveProperty('score');
    expect(receipt).toHaveProperty('tier');
    expect(receipt).toHaveProperty('populated');
    expect(receipt).toHaveProperty('active');
    expect(receipt).toHaveProperty('total');
    expect(receipt).toHaveProperty('slots');
  });
});
