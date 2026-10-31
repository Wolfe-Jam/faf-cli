import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { receiptsFrom } from '../../src/commands/taf-receipts.js';

// `faf taf receipts`: the Test Receipts in your terminal, newest first. They
// are read from git (origin/taf-receipts, then taf-receipts, then ./.taf);
// faf never fetches.
const CLI = join(import.meta.dir, '../../src/cli.ts');
const git = (cwd: string, ...args: string[]) =>
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf-8' });
const faf = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, 'taf', ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

const receipt = (ts: string, result: string, passed: number, total: number, skipped = 0) =>
  `  - timestamp: ${ts}\n    result: ${result}\n    tests:\n      total: ${total}\n      passed: ${passed}\n      failed: ${total - passed - skipped}\n      skipped: ${skipped}\n    trigger: github-actions\n`;

const TAF =
  'format_version: 1.0.0\nproject: demo\ntest_history:\n' +
  receipt('2026-10-29T10:00:00Z', 'PASSED', 10, 10) +
  receipt('2026-10-31T10:00:00Z', 'PASSED', 11, 12, 1) +
  receipt('2026-10-30T10:00:00Z', 'FAILED', 9, 12) +
  '  - timestamp: 2025-10-27T14:32:00Z\n    result: IMPROVED\n    notes: hand-written, no counts\n' +
  '  - result: PASSED\n' + // no timestamp: left out
  'stats:\n  total_runs: 4\n';

describe('ENGINE: receiptsFrom', () => {
  test('newest first; entries without a timestamp are left out', () => {
    const { project, receipts } = receiptsFrom(TAF);
    expect(project).toBe('demo');
    expect(receipts.map((r) => r.timestamp.slice(0, 10))).toEqual(['2026-10-31', '2026-10-30', '2026-10-29', '2025-10-27']);
    expect(receipts[0]).toEqual({ timestamp: '2026-10-31T10:00:00Z', result: 'PASSED', passed: 11, failed: 0, skipped: 1, total: 12, trigger: 'github-actions' });
  });

  test('a hand-written receipt with no counts reads as nulls, not a crash', () => {
    const old = receiptsFrom(TAF).receipts.at(-1)!;
    expect(old.result).toBe('IMPROVED');
    expect([old.passed, old.total, old.trigger]).toEqual([null, null, null]);
  });

  test('a .taf with no test_history has no receipts', () => {
    expect(receiptsFrom('format_version: 1.0.0\n').receipts).toEqual([]);
  });
});

describe('BRAKE: faf taf receipts', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-taf-receipts-'));
    git(dir, 'init', '-q', '-b', 'main');
    writeFileSync(join(dir, 'README.md'), 'x\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'init');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Put a .taf on a taf-receipts branch, the way faf-taf-git does, and come back to main. */
  const onBranch = (text: string) => {
    git(dir, 'checkout', '-q', '--orphan', 'taf-receipts');
    git(dir, 'rm', '-q', '-rf', '.');
    writeFileSync(join(dir, '.taf'), text);
    git(dir, 'add', '.taf');
    git(dir, 'commit', '-q', '-m', 'chore(taf): update .taf receipt [skip ci]');
    git(dir, 'checkout', '-q', 'main');
  };

  test('reads the taf-receipts branch, newest first, with a tally', () => {
    onBranch(TAF);
    const r = faf(dir, 'receipts');
    expect(r.status).toBe(0);
    const lines = r.stdout.trim().split('\n');
    expect(lines[0]).toBe('TAF receipts — demo · 4 on taf-receipts');
    expect(lines[1]).toBe('  2026-10-31 10:00  PASSED    11/12  1 skipped');
    expect(lines[2]).toBe('  2026-10-30 10:00  FAILED    9/12  3 failed');
    expect(lines[4]).toBe('  2025-10-27 14:32  IMPROVED  —');
    expect(lines[5]).toBe('  last 4: 2 PASSED · 1 FAILED · 1 IMPROVED');
  });

  test('--limit shows that many; --json is the same data', () => {
    onBranch(TAF);
    expect(faf(dir, 'receipts', '--limit', '1').stdout).toContain('last 1: 1 PASSED');
    const j = JSON.parse(faf(dir, 'receipts', '--limit', '2', '--json').stdout);
    expect(j.source).toBe('taf-receipts');
    expect(j.total).toBe(4);
    expect(j.receipts.map((x: { result: string }) => x.result)).toEqual(['PASSED', 'FAILED']);
  });

  test('a .taf in the folder is read when there is no branch', () => {
    writeFileSync(join(dir, '.taf'), TAF);
    const r = faf(dir, 'receipts', '--json');
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).source).toBe('.taf');
  });

  test('--ref reads only that ref', () => {
    onBranch(TAF);
    expect(JSON.parse(faf(dir, 'receipts', '--ref', 'taf-receipts', '--json').stdout).total).toBe(4);
    const r = faf(dir, 'receipts', '--ref', 'nope');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('nope:.taf');
  });

  test('no receipts anywhere: exit 1, one line, nothing on stdout, nothing fetched', () => {
    const r = faf(dir, 'receipts');
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr.trim().split('\n')).toHaveLength(1);
    expect(r.stderr).toContain('git fetch origin taf-receipts');
  });

  test('--limit must be a whole number, 1 or more', () => {
    onBranch(TAF);
    for (const bad of ['0', '-2', 'ten', '1.5']) {expect(faf(dir, 'receipts', '--limit', bad).status).toBe(1);}
  });

  test('an unknown subcommand is refused, not run as the old snapshot', () => {
    const r = faf(dir, 'receipt');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('faf taf receipts');
    expect(r.stdout).toBe('');
  });
});
