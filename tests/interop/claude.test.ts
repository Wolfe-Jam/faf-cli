import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateClaudeMd, parseClaudeMd, readClaudeMd, writeClaudeMd } from '../../src/interop/claude.js';
import type { FafData } from '../../src/core/types.js';

describe('interop/claude', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-claude-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const sampleData: FafData = {
    faf_version: '2.5.0',
    project: {
      name: 'test-project',
      goal: 'A test project for validation',
      main_language: 'TypeScript',
    },
    stack: {
      frontend: 'React',
      backend: 'slotignored',
      runtime: 'Node.js',
    },
  };

  test('generateClaudeMd includes project name', () => {
    const content = generateClaudeMd(sampleData);
    expect(content).toContain('test-project');
    expect(content).toContain('BI-SYNC ACTIVE');
    expect(content).toContain('TypeScript');
  });

  test('parseClaudeMd extracts fields', () => {
    const content = generateClaudeMd(sampleData);
    const parsed = parseClaudeMd(content);
    expect(parsed.project?.name).toBe('test-project');
    expect(parsed.project?.main_language).toBe('TypeScript');
  });

  test('write and read CLAUDE.md', () => {
    writeClaudeMd(testDir, 'test content');
    const content = readClaudeMd(testDir);
    expect(content).toBe('test content');
  });

  test('readClaudeMd returns null when missing', () => {
    expect(readClaudeMd(testDir)).toBeNull();
  });
});
