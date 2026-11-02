import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { bold, colorOn, dim, fafCyan, fafCyanDeep, italic, orange, plainOnStderr } from '../../src/ui/colors.js';

// Colour only where a person reads it. NO_COLOR (no-color.org) turns it off,
// FORCE_COLOR turns it on, otherwise only a terminal gets it: piped output,
// CI logs and agent tools get plain text.
const ESC = '\x1b[';
const CLI = join(import.meta.dir, '../../src/cli.ts');

describe('BRAKE: colours follow NO_COLOR, FORCE_COLOR and the terminal', () => {
  const saved = { NO_COLOR: process.env.NO_COLOR, FORCE_COLOR: process.env.FORCE_COLOR };
  const isTTY = process.stdout.isTTY;

  const set = (tty: boolean, env: { NO_COLOR?: string; FORCE_COLOR?: string }) => {
    Object.defineProperty(process.stdout, 'isTTY', { value: tty, configurable: true });
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    Object.assign(process.env, env);
  };

  afterEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, configurable: true });
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {delete process.env[k];} else {process.env[k] = v;}
    }
  });

  const all = (s: string) => [bold, dim, italic, fafCyan, fafCyanDeep, orange].map((f) => f(s));

  test('a terminal gets colour', () => {
    set(true, {});
    expect(colorOn()).toBe(true);
    for (const out of all('x')) {expect(out).toContain(ESC);}
  });

  test('not a terminal (piped) gets plain text', () => {
    set(false, {});
    expect(colorOn()).toBe(false);
    expect(all('x')).toEqual(['x', 'x', 'x', 'x', 'x', 'x']);
  });

  test('NO_COLOR turns it off, even in a terminal', () => {
    set(true, { NO_COLOR: '1' });
    expect(all('x')).toEqual(['x', 'x', 'x', 'x', 'x', 'x']);
  });

  test('an empty NO_COLOR is not set (no-color.org)', () => {
    set(true, { NO_COLOR: '' });
    expect(fafCyan('x')).toContain(ESC);
  });

  test('FORCE_COLOR turns it on when piped, and wins over NO_COLOR', () => {
    set(false, { FORCE_COLOR: '1' });
    expect(orange('x')).toContain(ESC);
    set(false, { FORCE_COLOR: '1', NO_COLOR: '1' });
    expect(orange('x')).toContain(ESC);
  });

  test('FORCE_COLOR=0 does not force', () => {
    set(false, { FORCE_COLOR: '0' });
    expect(orange('x')).toBe('x');
  });

  test('FORCE_COLOR=0 or false turns it off, even in a terminal', () => {
    set(true, { FORCE_COLOR: '0' });
    expect(orange('x')).toBe('x');
    set(true, { FORCE_COLOR: 'false' });
    expect(orange('x')).toBe('x');
  });

  test('an empty FORCE_COLOR forces it on (Node)', () => {
    set(false, { FORCE_COLOR: '' });
    expect(orange('x')).toContain(ESC);
  });

  test('stdout a terminal, stderr a file: error text loses its colour', () => {
    const errTTY = process.stderr.isTTY;
    try {
      set(true, {});
      Object.defineProperty(process.stderr, 'isTTY', { value: false, configurable: true });
      expect(plainOnStderr(bold('×'))).toBe('×');
      Object.defineProperty(process.stderr, 'isTTY', { value: true, configurable: true });
      expect(plainOnStderr(bold('×'))).toContain(ESC);
    } finally {
      Object.defineProperty(process.stderr, 'isTTY', { value: errTTY, configurable: true });
    }
  });
});

describe('ENGINE: the CLI, piped, is plain text', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-colors-'));
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const run = (args: string[], extra: Record<string, string> = {}) => {
    const env: Record<string, string | undefined> = { ...process.env, ...extra };
    if (!('NO_COLOR' in extra)) {delete env.NO_COLOR;}
    if (!('FORCE_COLOR' in extra)) {delete env.FORCE_COLOR;}
    return spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env });
  };

  test('faf init, piped: no escape codes on stdout or stderr', () => {
    const r = run(['init']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('created');
    expect(r.stdout + r.stderr).not.toContain(ESC);
  });

  test('FORCE_COLOR=1, piped: colour comes back', () => {
    expect(run(['init'], { FORCE_COLOR: '1' }).stdout).toContain(ESC);
  });

  test('bare faf, piped: a plain header, no pixel art', () => {
    const r = run([]);
    expect(r.stdout).not.toContain(ESC);
    expect(r.stdout).toContain('Nelly Never Forgets');
    expect(r.stdout).not.toContain('▄');
  });
});
