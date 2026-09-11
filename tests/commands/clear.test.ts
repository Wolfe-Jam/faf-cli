import { describe, test, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { existsSync, mkdtempSync, realpathSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { clearCommand } from '../../src/commands/clear.js';
import { makeTempDir } from '../../src/core/safe-write.js';

describe('BRAKE: clear command', () => {
  const dirs: string[] = [];
  // Its own temp folder stands in for the OS one, so the test never touches
  // (or counts) anyone else's faf-git-* folders.
  const sandbox = realpathSync(mkdtempSync(join(tmpdir(), 'faf-clear-test-')));
  const was = process.env.TMPDIR;

  beforeEach(() => {
    process.env.TMPDIR = sandbox;
    // faf-git-* temp folders as faf makes them (mkdtemp name + faf's marker)
    for (let i = 0; i < 3; i++) {
      dirs.push(makeTempDir('faf-git-'));
    }
  });

  afterEach(() => {
    for (const d of dirs) {
      rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
    if (was === undefined) {delete process.env.TMPDIR;} else {process.env.TMPDIR = was;}
  });

  afterAll(() => {
    rmSync(sandbox, { recursive: true, force: true });
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
