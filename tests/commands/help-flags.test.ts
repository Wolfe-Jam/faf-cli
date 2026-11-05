/**
 * A flag in --help must do something. `check --fix/--doctor/--trust` and
 * `info --faq/--index/--stacks` were listed but read by no code (`check --fix`
 * fixed nothing; `info --faq` printed nothing), so they are gone and refused.
 * `init --yolo/--quick` are kept for old scripts but not shown: init asks
 * nothing anyway.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const run = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

describe('help flags do what they say', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-help-flags-'));
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test.each([
    ['check', '--fix'], ['check', '--doctor'], ['check', '--trust'],
    ['info', '--faq'], ['info', '--index'], ['info', '--stacks'],
  ])('%s %s is refused as unknown', (cmd, flag) => {
    const r = run(dir, cmd, flag);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`unknown option '${flag}'`);
  });

  test('faf info prints the version', () => {
    const r = run(dir, 'info');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^faf v\d+\.\d+\.\d+/);
  });

  test.each(['--yolo', '--quick'])('init %s still works, and is not in --help', (flag) => {
    expect(run(dir, 'init', flag).status).toBe(0);
    expect(existsSync(join(dir, 'project.faf'))).toBe(true);
    expect(run(dir, 'init', '--help').stdout).not.toContain(flag);
  });
});
