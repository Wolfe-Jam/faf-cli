import { describe, test, expect, spyOn } from 'bun:test';
import { readdirSync } from 'fs';
import { tmpdir } from 'os';

describe('demo command — execution + side-effect contract', () => {
  test('demoCommand runs without throwing', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    expect(() => demoCommand()).not.toThrow();
    logSpy.mockRestore();
  });

  test('demoCommand does not leave temp files behind', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const before = readdirSync(tmpdir()).filter((f: string) => f.startsWith('faf-demo-'));
    demoCommand();
    const after = readdirSync(tmpdir()).filter((f: string) => f.startsWith('faf-demo-'));
    logSpy.mockRestore();
    expect(after.length).toBe(before.length);
  });

  test('demoCommand does not modify the cwd or any user file', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const cwdBefore = process.cwd();
    const dirBefore = readdirSync(cwdBefore);
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    demoCommand();
    logSpy.mockRestore();
    expect(process.cwd()).toBe(cwdBefore);
    const dirAfter = readdirSync(cwdBefore);
    expect(dirAfter.sort().join(',')).toBe(dirBefore.sort().join(','));
  });
});

describe('demo command — output contract', () => {
  test('demoCommand prints the demo header + completion message', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    demoCommand();
    logSpy.mockRestore();
    const all = logs.join('\n');
    expect(all).toMatch(/demo/i);
    expect(all).toContain('FAF in action');
    expect(all).toContain('Demo complete');
  });

  test('demoCommand walks the user through the steps it claims', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    demoCommand();
    logSpy.mockRestore();
    const all = logs.join('\n');
    // Demo claims a step-by-step walkthrough — assert at least step 1 + 2 are emitted
    expect(all).toMatch(/1\..*sample project\.faf/i);
    expect(all).toMatch(/2\..*Scoring/i);
  });

  test('demoCommand suggests the next step (faf init)', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    demoCommand();
    logSpy.mockRestore();
    expect(logs.join('\n')).toContain('faf init');
  });

  test('demoCommand exercises the WASM scoring kernel (real score output)', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logs: string[] = [];
    const logSpy = spyOn(console, 'log').mockImplementation((s: string) => { logs.push(s); });
    demoCommand();
    logSpy.mockRestore();
    // displayScore emits at least a percentage or tier marker
    const all = logs.join('\n');
    expect(all).toMatch(/\d+%|TROPHY|GOLD|SILVER|BRONZE|GREEN|YELLOW|RED|WHITE/);
  });
});

describe('demo command — robustness (run twice)', () => {
  test('demoCommand can be invoked twice in a row without state leak', async () => {
    const { demoCommand } = await import('../../src/commands/demo.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    expect(() => demoCommand()).not.toThrow();
    expect(() => demoCommand()).not.toThrow();
    logSpy.mockRestore();
    // No assertion beyond no-throw — robustness check
  });
});
