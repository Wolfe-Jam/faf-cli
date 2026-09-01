import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateFaf } from '../../src/core/schema.js';
import { readFaf, readFafRaw } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';
import { checkCommand } from '../../src/commands/check.js';

describe('BRAKE: check command', () => {
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

  test('--verbose prints the per-slot breakdown; default run does not', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `faf_version: 2.5.0\nproject:\n  name: verbose-test\n  goal: Test\n  main_language: TypeScript\n`);

    const logSpy = spyOn(console, 'log');

    logSpy.mockClear();
    checkCommand(fafPath, {});
    const quiet = logSpy.mock.calls.map((c) => String(c[0])).join('\n');

    logSpy.mockClear();
    checkCommand(fafPath, { verbose: true });
    const verbose = logSpy.mock.calls.map((c) => String(c[0])).join('\n');

    logSpy.mockRestore();

    expect(verbose).toContain('project.name');
    expect(quiet).not.toContain('project.name');
    expect(verbose.length).toBeGreaterThan(quiet.length);
  });
});
