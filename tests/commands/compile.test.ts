import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as kernel from '../../src/wasm/kernel.js';

describe('compile/decompile integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-compile-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('compile produces valid .fafb', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: compile-test\n  goal: Testing compilation\n  main_language: TypeScript\n`;
    const binary = kernel.compile(yaml);

    const outputPath = join(testDir, 'project.fafb');
    writeFileSync(outputPath, binary);

    const read = new Uint8Array(readFileSync(outputPath));
    expect(String.fromCharCode(read[0], read[1], read[2], read[3])).toBe('FAFB');
    expect(read.length).toBeGreaterThan(32);
  });

  test('compile → decompile roundtrip', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: roundtrip-test\n`;
    const binary = kernel.compile(yaml);
    const info = kernel.decompile(binary);
    expect(info).toBeDefined();
  });

  test('compile → scoreFafb returns metadata', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: meta-test\n`;
    const binary = kernel.compile(yaml);
    const meta = kernel.scoreFafb(binary);
    expect(meta.source).toBe('fafb_meta');
    expect(meta.name).toBe('meta-test');
  });

  test('compile → fafbInfo returns header info', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: info-test\n`;
    const binary = kernel.compile(yaml);
    const info = kernel.fafbInfo(binary);
    expect(info).toBeDefined();
  });
});
