import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { findFafFile, readFafRaw } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';
import { enrichScore } from '../../src/core/scorer.js';

describe('score command integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-score-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('scores a real .faf file', () => {
    writeFileSync(join(testDir, 'project.faf'), `
faf_version: 2.5.0
project:
  name: test-app
  goal: Test application
  main_language: TypeScript
`);
    const yaml = readFafRaw(join(testDir, 'project.faf'));
    const result = enrichScore(kernel.score(yaml));
    expect(result.score).toBeGreaterThan(0);
    expect(result.populated).toBeGreaterThanOrEqual(3);
  });

  test('findFafFile finds project.faf', () => {
    writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\nproject:\n  name: test\n');
    expect(findFafFile(testDir)).toBe(join(testDir, 'project.faf'));
  });

  test('findFafFile returns null when no .faf exists', () => {
    const emptyDir = join(testDir, 'empty');
    mkdirSync(emptyDir);
    expect(findFafFile(emptyDir)).toBeNull();
  });

  test('scores 100% for CLI with all slots filled', () => {
    writeFileSync(join(testDir, 'project.faf'), `
faf_version: 2.5.0
project:
  name: my-cli
  goal: A great CLI
  main_language: TypeScript
stack:
  frontend: slotignored
  css_framework: slotignored
  ui_library: slotignored
  state_management: slotignored
  backend: slotignored
  api_type: slotignored
  runtime: slotignored
  database: slotignored
  connection: slotignored
  hosting: slotignored
  build: slotignored
  cicd: slotignored
human_context:
  who: developer
  what: CLI tool
  why: Automation
  where: npm
  when: 2026
  how: TDD
`);
    const result = enrichScore(kernel.score(readFafRaw(join(testDir, 'project.faf'))));
    expect(result.score).toBe(100);
    expect(result.tier.name).toBe('TROPHY');
  });
});
