import { describe, test, expect } from 'bun:test';
import { FORMATS } from '../../src/detect/formats.js';
import { formatsCommand } from '../../src/commands/formats.js';

describe('formats command', () => {
  test('FORMATS catalog has entries', () => {
    expect(FORMATS.length).toBeGreaterThan(30);
  });

  test('all entries have required fields', () => {
    for (const f of FORMATS) {
      expect(f.name).toBeTruthy();
      expect(f.extensions.length).toBeGreaterThan(0);
      expect(f.category).toBeTruthy();
    }
  });

  test('includes FAF format', () => {
    const faf = FORMATS.find(f => f.name === 'FAF');
    expect(faf).toBeDefined();
    expect(faf!.extensions).toContain('.faf');
  });

  test('formatsCommand runs without error', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      formatsCommand();
    } finally {
      console.log = orig;
    }
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.includes('formats'))).toBe(true);
  });
});
