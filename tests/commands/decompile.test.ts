import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as kernel from '../../src/wasm/kernel.js';

describe('decompile command', () => {
  test('compile then decompile roundtrips', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: roundtrip-test\n  goal: Test roundtrip\n  main_language: TypeScript\n`;
    const compiled = kernel.compile(yaml);
    expect(compiled.length).toBeGreaterThan(0);

    // Check magic bytes
    expect(String.fromCharCode(compiled[0], compiled[1], compiled[2], compiled[3])).toBe('FAFB');

    const info = kernel.decompile(compiled);
    expect(info.version).toBeDefined();
    expect(info.section_count).toBeGreaterThan(0);
    expect(info.sections.length).toBeGreaterThan(0);
  });

  test('decompile rejects non-FAFB data', () => {
    const garbage = new Uint8Array([0, 0, 0, 0, 1, 2, 3, 4]);
    expect(() => kernel.decompile(garbage)).toThrow();
  });

  test('compiled output has correct structure', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: test\n`;
    const compiled = kernel.compile(yaml);
    const info = kernel.decompile(compiled);

    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('flags');
    expect(info).toHaveProperty('section_count');
    expect(info).toHaveProperty('total_size');
    expect(info).toHaveProperty('source_checksum');
    expect(info).toHaveProperty('sections');
  });
});
