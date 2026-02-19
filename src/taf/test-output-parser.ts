/**
 * Test output parser for stdin auto-parse
 *
 * Ported from faf-taf-git/src/parsers/ — proven Jest + Vitest parsers.
 * Pure functions, zero dependencies.
 */

export interface ParsedTestOutput {
  total: number;
  passed: number;
  failed: number;
  skipped?: number;
  framework: 'jest' | 'vitest';
}

/**
 * Strip ANSI color codes and normalize line endings
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  let clean = text.replace(/\x1b\[[0-9;]*m/g, '');
  clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return clean;
}

/**
 * Parse Jest output to extract test results
 *
 * Formats:
 * - "Tests: 173 passed, 173 total"
 * - "Tests: 1 failed, 172 passed, 173 total"
 * - "Tests:       9 skipped, 799 passed, 808 total"
 */
export function parseJestOutput(output: string): ParsedTestOutput | null {
  const clean = stripAnsi(output);

  // Must match "Tests:" line containing "total" to avoid false positives
  const match = clean.match(/Tests:\s+(.+?\d+\s+total)/im);
  if (!match || !match[1]) return null;

  const line = match[1];

  const totalMatch = line.match(/(\d+)\s+total/i);
  if (!totalMatch) return null;
  const total = parseInt(totalMatch[1], 10);
  if (total === 0) return null;

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const passedMatch = line.match(/(\d+)\s+passed/i);
  if (passedMatch) passed = parseInt(passedMatch[1], 10);

  const failedMatch = line.match(/(\d+)\s+failed/i);
  if (failedMatch) failed = parseInt(failedMatch[1], 10);

  const skippedMatch = line.match(/(\d+)\s+skipped/i);
  if (skippedMatch) skipped = parseInt(skippedMatch[1], 10);

  return {
    total,
    passed,
    failed,
    skipped: skipped > 0 ? skipped : undefined,
    framework: 'jest',
  };
}

/**
 * Parse Vitest output to extract test results
 *
 * Formats:
 * - " Tests  8 passed (8)"
 * - " Tests  2 failed | 6 passed (8)"
 * - " Tests  1 skipped | 7 passed (8)"
 * - " Tests  1 failed | 2 skipped | 5 passed (8)"
 */
export function parseVitestOutput(output: string): ParsedTestOutput | null {
  const clean = stripAnsi(output);

  const match = clean.match(/^\s*Tests\s+(.+?\(\d+\))/m);
  if (!match || !match[1]) return null;

  const line = match[1];

  const totalMatch = line.match(/\((\d+)\)\s*$/);
  if (!totalMatch) return null;
  const total = parseInt(totalMatch[1], 10);
  if (total === 0) return null;

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const passedMatch = line.match(/(\d+)\s+passed/i);
  if (passedMatch) passed = parseInt(passedMatch[1], 10);

  const failedMatch = line.match(/(\d+)\s+failed/i);
  if (failedMatch) failed = parseInt(failedMatch[1], 10);

  const skippedMatch = line.match(/(\d+)\s+skipped/i);
  if (skippedMatch) skipped = parseInt(skippedMatch[1], 10);

  const todoMatch = line.match(/(\d+)\s+todo/i);
  if (todoMatch) skipped += parseInt(todoMatch[1], 10);

  return {
    total,
    passed,
    failed,
    skipped: skipped > 0 ? skipped : undefined,
    framework: 'vitest',
  };
}

/**
 * Parse test output from any supported framework.
 * Tries Jest first, then Vitest.
 */
export function parseTestOutput(output: string): ParsedTestOutput | null {
  return parseJestOutput(output) || parseVitestOutput(output);
}
