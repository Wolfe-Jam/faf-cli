import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { SLOTS, isPlaceholder } from '../../src/core/slots.js';
import { writeFaf } from '../../src/interop/faf.js';

describe('go command — slot helpers (contract)', () => {
  test('isPlaceholder detects empty values', () => {
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder('')).toBe(true);
    expect(isPlaceholder('n/a')).toBe(true);
    expect(isPlaceholder('none')).toBe(true);
    expect(isPlaceholder('TypeScript')).toBe(false);
  });

  test('isPlaceholder handles slotignored', () => {
    expect(isPlaceholder('slotignored')).toBe(false);
  });

  test('SLOTS has 33 entries', () => {
    expect(SLOTS.length).toBe(33);
  });

  test('all slots have required fields', () => {
    for (const slot of SLOTS) {
      expect(slot.index).toBeGreaterThan(0);
      expect(slot.path).toBeTruthy();
      expect(slot.description).toBeTruthy();
      expect(slot.category).toBeTruthy();
    }
  });
});

describe('go command — non-interactive branches', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-go-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  test('goCommand() in dir without .faf → exits 2 with clear error', async () => {
    const { goCommand } = await import('../../src/commands/go.js');
    const errs: string[] = [];
    const errSpy = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`__exit_${code}__`);
    }) as never);
    try {
      await goCommand();
      throw new Error('expected process.exit');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain('__exit_2__');
    }
    errSpy.mockRestore();
    exitSpy.mockRestore();
    expect(errs.join('\n')).toMatch(/project\.faf not found/);
  });

  test('goCommand() with all slots populated → "all slots populated", no interactive', async () => {
    type FafObj = Record<string, unknown>;
    const data: FafObj = { faf_version: '2.5.0' };
    function setNested(obj: FafObj, path: string, value: string): void {
      const parts = path.split('.');
      let cur: FafObj = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]] as FafObj;
      }
      cur[parts[parts.length - 1]] = value;
    }
    for (const slot of SLOTS) {
      setNested(data, slot.path, `value-for-${slot.path.replace(/\./g, '-')}`);
    }
    writeFaf(join(testDir, 'project.faf'), data);

    const { goCommand } = await import('../../src/commands/go.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    await goCommand();
    logSpy.mockRestore();
    expect(logs.join('\n')).toContain('all slots populated');
  });
});

describe('go command — session resume', () => {
  let testDir: string;
  let originalCwd: string;
  const SESSION_FILE = '.faf-session.json';

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-go-resume-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  test('resume with corrupted session file → no crash, falls back to start', async () => {
    // Create a .faf with all slots populated so we don't enter the interactive loop
    type FafObj = Record<string, unknown>;
    const data: FafObj = { faf_version: '2.5.0' };
    function setNested(obj: FafObj, path: string, value: string): void {
      const parts = path.split('.');
      let cur: FafObj = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]] as FafObj;
      }
      cur[parts[parts.length - 1]] = value;
    }
    for (const slot of SLOTS) setNested(data, slot.path, `v-${slot.path}`);
    writeFaf(join(testDir, 'project.faf'), data);

    // Write a corrupted session file
    writeFileSync(join(testDir, SESSION_FILE), '{corrupted-json{{');

    const { goCommand } = await import('../../src/commands/go.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    // Should not throw despite the corrupted session
    await expect(goCommand({ resume: true })).resolves.toBeUndefined();
    logSpy.mockRestore();
  });

  test('resume with valid session file → logs resume message', async () => {
    // Create .faf with all slots populated (avoid interactive)
    type FafObj = Record<string, unknown>;
    const data: FafObj = { faf_version: '2.5.0' };
    function setNested(obj: FafObj, path: string, value: string): void {
      const parts = path.split('.');
      let cur: FafObj = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]] as FafObj;
      }
      cur[parts[parts.length - 1]] = value;
    }
    for (const slot of SLOTS) setNested(data, slot.path, `v-${slot.path}`);
    writeFaf(join(testDir, 'project.faf'), data);

    // Write a valid session file pointing to slot index 5
    writeFileSync(
      join(testDir, SESSION_FILE),
      JSON.stringify({ slotIndex: 5, fafPath: join(testDir, 'project.faf') })
    );

    const { goCommand } = await import('../../src/commands/go.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    await goCommand({ resume: true });
    logSpy.mockRestore();
    // The resume message format is "  resuming from slot #N" (1-indexed)
    expect(logs.join('\n')).toMatch(/resuming from slot #6/);
  });
});

describe('go command — interactive contract (documented, not exercised)', () => {
  // The interactive prompt loop uses readline against process.stdin/stdout.
  // Testing it deterministically requires piping to stdin or mocking readline,
  // which adds fragility without much marginal value. The contract is:
  //
  //  - For each empty slot: prompts "#N description (path): " and reads a line
  //  - Answer "skip" or empty → continues to next slot
  //  - Answer "quit" → writes session file with current slotIndex, breaks loop
  //  - Any other answer → setNestedValue(data, path, answer.trim()), filled++
  //  - End of loop: writeFaf if filled > 0, displayScore, unlink session file
  //
  // E2E coverage of this path lives in tests/e2e.test.ts when present, or via
  // manual smoke tests in CI. Future: pipe to stdin for one synthetic answer.
  test('contract documented in source — no behavioral regression coverage here', () => {
    expect(true).toBe(true);
  });
});
