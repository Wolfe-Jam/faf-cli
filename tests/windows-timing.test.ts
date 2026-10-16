import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { namedHang, removeTemp, spawnLimit } from './helpers/windows-timing.js';

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

describe('BRAKE: namedHang (#167)', () => {
  test('a child that hits its limit fails with the command named', () => {
    const sleeper = `"${process.execPath}" -e "setTimeout(() => {}, 10000)"`;
    expect(() => namedHang('faf sync', () => execSync(sleeper, { stdio: 'ignore', timeout: 300 })))
      .toThrow('hung child process (#167): "faf sync" did not exit within its time limit');
  });

  test('other failures and results pass through unchanged', () => {
    expect(namedHang('faf score', () => 'ok')).toBe('ok');
    expect(() => namedHang('faf score', () => { throw new Error('exit 1'); })).toThrow('exit 1');
  });
});
