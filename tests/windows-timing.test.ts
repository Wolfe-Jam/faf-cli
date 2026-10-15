import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { removeTemp, spawnLimit } from './helpers/windows-timing.js';

describe('BRAKE: Windows timing helpers', () => {
  const saved = process.env.FAF_TEST_SPAWN_LIMIT_MS;
  afterEach(() => {
    if (saved === undefined) {delete process.env.FAF_TEST_SPAWN_LIMIT_MS;} else {process.env.FAF_TEST_SPAWN_LIMIT_MS = saved;}
  });

  test('spawnLimit keeps the PR limit when the nightly limit is unset or shorter', () => {
    delete process.env.FAF_TEST_SPAWN_LIMIT_MS;
    expect(spawnLimit(30_000)).toBe(30_000);
    process.env.FAF_TEST_SPAWN_LIMIT_MS = '1000';
    expect(spawnLimit(30_000)).toBe(30_000);
    process.env.FAF_TEST_SPAWN_LIMIT_MS = 'soon';
    expect(spawnLimit(30_000)).toBe(30_000);
  });

  test('spawnLimit takes the nightly limit when it is longer', () => {
    process.env.FAF_TEST_SPAWN_LIMIT_MS = '1800000';
    expect(spawnLimit(30_000)).toBe(1_800_000);
  });

  test('removeTemp removes a folder and everything in it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faf-timing-'));
    writeFileSync(join(dir, 'f.txt'), 'x');
    removeTemp(dir);
    expect(existsSync(dir)).toBe(false);
  });
});
