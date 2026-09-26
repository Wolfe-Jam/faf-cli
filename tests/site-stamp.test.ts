import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
// @ts-expect-error — plain .mjs build script, no types
import { releaseFrom } from '../scripts/site-stamp.mjs';

const root = join(import.meta.dir, '..');

describe('site-stamp: the page shows the current release', () => {
  test('reads version, edition and oneliner from the real CHANGELOG', () => {
    const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const rel = releaseFrom(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version);
    expect(rel.version).toBe(version);
    expect(rel.oneliner).toBeTruthy();
    expect(rel.oneliner).not.toContain('**');
  });

  test('a patch with no edition still stamps', () => {
    const rel = releaseFrom('## [8.0.1] - 2026-10-01\n\n**A fix.**\n', '8.0.1');
    expect(rel).toEqual({ version: '8.0.1', edition: null, oneliner: 'A fix.', date: '2026-10-01' });
  });

  test('edition and backticks', () => {
    const rel = releaseFrom('## [9.0.0] - 2026-11-01 — The Next Edition\n\n**Use `faf auto`.** 99 tests.\n', '9.0.0');
    expect(rel.edition).toBe('The Next Edition');
    expect(rel.oneliner).toBe('Use faf auto.');
  });

  test('refuses a CHANGELOG that is behind package.json', () => {
    expect(() => releaseFrom('## [7.16.2] - 2026-09-18\n\n**Old.**\n', '8.0.0')).toThrow();
  });
});
