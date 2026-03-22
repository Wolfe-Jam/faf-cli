import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateFaf } from '../../src/core/schema.js';
import { readFaf, readFafRaw } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';

describe('check command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-check-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('valid .faf passes validation', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `faf_version: 2.5.0\nproject:\n  name: test\n`);
    const data = readFaf(fafPath);
    const result = validateFaf(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('missing faf_version fails validation', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `project:\n  name: test\n`);
    const data = readFaf(fafPath);
    const result = validateFaf(data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('missing project.name fails validation', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `faf_version: 2.5.0\nproject:\n  goal: something\n`);
    const data = readFaf(fafPath);
    const result = validateFaf(data);
    expect(result.valid).toBe(false);
  });

  test('kernel validates valid yaml', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `faf_version: 2.5.0\nproject:\n  name: test\n  goal: Test\n  main_language: TypeScript\n`);
    const yaml = readFafRaw(fafPath);
    expect(kernel.validate(yaml)).toBe(true);
  });
});
