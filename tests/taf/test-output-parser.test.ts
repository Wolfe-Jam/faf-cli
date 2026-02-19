import {
  stripAnsi,
  parseJestOutput,
  parseVitestOutput,
  parseTestOutput,
} from '../../src/taf/test-output-parser';

describe('stripAnsi', () => {
  it('strips ANSI color codes', () => {
    const input = '\x1b[32mTests:\x1b[0m 5 passed, 5 total';
    expect(stripAnsi(input)).toBe('Tests: 5 passed, 5 total');
  });

  it('normalizes line endings', () => {
    expect(stripAnsi('line1\r\nline2\rline3')).toBe('line1\nline2\nline3');
  });

  it('returns clean text unchanged', () => {
    const clean = 'Tests: 10 passed, 10 total';
    expect(stripAnsi(clean)).toBe(clean);
  });
});

describe('parseJestOutput', () => {
  it('parses all passing', () => {
    const output = `
PASS src/tests/example.test.ts
Tests: 173 passed, 173 total
Time: 4.2s
`;
    const result = parseJestOutput(output);
    expect(result).toEqual({
      total: 173,
      passed: 173,
      failed: 0,
      skipped: undefined,
      framework: 'jest',
    });
  });

  it('parses with failures', () => {
    const output = 'Tests: 1 failed, 172 passed, 173 total';
    const result = parseJestOutput(output);
    expect(result).toEqual({
      total: 173,
      passed: 172,
      failed: 1,
      skipped: undefined,
      framework: 'jest',
    });
  });

  it('parses with skipped', () => {
    const output = 'Tests: 1 failed, 2 skipped, 170 passed, 173 total';
    const result = parseJestOutput(output);
    expect(result).toEqual({
      total: 173,
      passed: 170,
      failed: 1,
      skipped: 2,
      framework: 'jest',
    });
  });

  it('handles ANSI codes', () => {
    const output = '\x1b[1mTests:\x1b[22m \x1b[32m173 passed\x1b[39m, 173 total';
    const result = parseJestOutput(output);
    expect(result).toEqual({
      total: 173,
      passed: 173,
      failed: 0,
      skipped: undefined,
      framework: 'jest',
    });
  });

  it('handles CI padding', () => {
    const output = 'Tests:       9 skipped, 799 passed, 808 total';
    const result = parseJestOutput(output);
    expect(result).toEqual({
      total: 808,
      passed: 799,
      failed: 0,
      skipped: 9,
      framework: 'jest',
    });
  });

  it('returns null on no match', () => {
    expect(parseJestOutput('no test output here')).toBeNull();
  });

  it('returns null when total is 0', () => {
    expect(parseJestOutput('Tests: 0 passed, 0 total')).toBeNull();
  });

  it('does not false-positive on test descriptions', () => {
    const output = 'Brake Tests: Critical dogfooding scenarios';
    expect(parseJestOutput(output)).toBeNull();
  });
});

describe('parseVitestOutput', () => {
  it('parses all passing', () => {
    const output = `
 ✓ src/example.test.ts (8)

 Tests  8 passed (8)
 Duration  1.23s
`;
    const result = parseVitestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 8,
      failed: 0,
      skipped: undefined,
      framework: 'vitest',
    });
  });

  it('parses with failures', () => {
    const output = ' Tests  2 failed | 6 passed (8)';
    const result = parseVitestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 6,
      failed: 2,
      skipped: undefined,
      framework: 'vitest',
    });
  });

  it('parses with skipped', () => {
    const output = ' Tests  1 skipped | 7 passed (8)';
    const result = parseVitestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 7,
      failed: 0,
      skipped: 1,
      framework: 'vitest',
    });
  });

  it('parses with todo (added to skipped)', () => {
    const output = ' Tests  2 todo | 6 passed (8)';
    const result = parseVitestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 6,
      failed: 0,
      skipped: 2,
      framework: 'vitest',
    });
  });

  it('handles ANSI codes', () => {
    const output = ' \x1b[32mTests\x1b[39m  \x1b[32m8 passed\x1b[39m (8)';
    const result = parseVitestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 8,
      failed: 0,
      skipped: undefined,
      framework: 'vitest',
    });
  });

  it('returns null on no match', () => {
    expect(parseVitestOutput('no vitest output here')).toBeNull();
  });
});

describe('parseTestOutput (unified)', () => {
  it('detects Jest output', () => {
    const result = parseTestOutput('Tests: 173 passed, 173 total');
    expect(result).not.toBeNull();
    expect(result!.framework).toBe('jest');
  });

  it('detects Vitest output', () => {
    const result = parseTestOutput(' Tests  8 passed (8)');
    expect(result).not.toBeNull();
    expect(result!.framework).toBe('vitest');
  });

  it('returns null for garbage input', () => {
    expect(parseTestOutput('hello world')).toBeNull();
    expect(parseTestOutput('')).toBeNull();
    expect(parseTestOutput('npm ERR! code 1')).toBeNull();
  });

  it('handles full Jest run output', () => {
    const output = `
PASS src/tests/schema.test.ts (4.2s)
PASS src/tests/compiler.test.ts
PASS src/tests/edge-cases.test.ts

Test Suites:  3 passed, 3 total
Tests:        878 passed, 878 total
Snapshots:    0 total
Time:         12.345 s
Ran all test suites.
`;
    const result = parseTestOutput(output);
    expect(result).toEqual({
      total: 878,
      passed: 878,
      failed: 0,
      skipped: undefined,
      framework: 'jest',
    });
  });

  it('handles full Vitest run output', () => {
    const output = `
 ✓ src/index.test.ts (3)
 ✓ src/utils.test.ts (5)

 Test Files  2 passed (2)
 Tests  8 passed (8)
 Start at  10:00:00
 Duration  1.23s
`;
    const result = parseTestOutput(output);
    expect(result).toEqual({
      total: 8,
      passed: 8,
      failed: 0,
      skipped: undefined,
      framework: 'vitest',
    });
  });
});
