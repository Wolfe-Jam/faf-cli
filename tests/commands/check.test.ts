import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateFaf } from '../../src/core/schema.js';
import { readFaf, readFafFromString, readFafRaw } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';
import { checkCommand, checkKeyFiles } from '../../src/commands/check.js';

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

  test('key_files: a listed path that is gone is reported missing', () => {
    mkdirSync(join(testDir, 'crates', 'core'), { recursive: true });
    writeFileSync(join(testDir, 'Cargo.toml'), '');
    const data = readFafFromYaml(`faf_version: 2.5.0
project:
  name: drift-test
key_files:
  - Cargo.toml
  - crates/core
  - crates/mcp-server
  - crates/old — removed crate, role kept
  - crates/*
`);
    const result = checkKeyFiles(data, testDir);
    expect(result.missing).toEqual(['crates/mcp-server', 'crates/old']);
    expect(result.skipped).toEqual(['crates/*']);
  });

  test('key_files: legacy instant_context.key_files is checked too', () => {
    const data = readFafFromYaml(`faf_version: 2.5.0
project:
  name: legacy
instant_context:
  key_files:
    - src/gone.ts
`);
    expect(checkKeyFiles(data, testDir).missing).toEqual(['src/gone.ts']);
  });

  test('key_files: none listed, nothing reported', () => {
    const data = readFafFromYaml(`faf_version: 2.5.0\nproject:\n  name: empty\n`);
    expect(checkKeyFiles(data, testDir)).toEqual({ missing: [], skipped: [] });
  });

  test('a missing key_files path warns; check still passes', () => {
    const fafPath = join(testDir, 'project.faf');
    writeFileSync(fafPath, `faf_version: 2.5.0
project:
  name: warn-test
  goal: Test
  main_language: TypeScript
key_files:
  - project.faf
  - crates/mcp-server
`);
    const logSpy = spyOn(console, 'log');
    const exitSpy = spyOn(process, 'exit');
    logSpy.mockClear();
    checkCommand(fafPath, {});
    const out = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    const exited = exitSpy.mock.calls.length;
    logSpy.mockRestore();
    exitSpy.mockRestore();

    expect(out).toContain('valid');
    expect(out).toContain('key_files: crates/mcp-server');
    expect(out).toContain('not found');
    expect(out).not.toContain('key_files: project.faf');
    expect(exited).toBe(0);
  });
});

function readFafFromYaml(yaml: string) {
  return readFafFromString(yaml, 'project.faf');
}

