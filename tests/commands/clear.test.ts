import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { clearCommand } from '../../src/commands/clear.js';

describe('clear command', () => {
  const dirs: string[] = [];

  beforeEach(() => {
    // Create fake faf-git-* temp dirs
    for (let i = 0; i < 3; i++) {
      const d = join(tmpdir(), `faf-git-test-clear-${Date.now()}-${i}`);
      mkdirSync(d, { recursive: true });
      dirs.push(d);
    }
  });

  afterEach(() => {
    for (const d of dirs) {
      rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  test('removes faf-git-* temp directories', () => {
    for (const d of dirs) {
      expect(existsSync(d)).toBe(true);
    }

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      clearCommand();
    } finally {
      console.log = orig;
    }

    for (const d of dirs) {
      expect(existsSync(d)).toBe(false);
    }
    expect(logs.some(l => l.includes('cleared'))).toBe(true);
  });

  test('handles empty case gracefully', () => {
    // Remove test dirs first
    for (const d of dirs) {
      rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    try {
      clearCommand();
    } finally {
      console.log = orig;
    }
    // Should not throw
  });
});
