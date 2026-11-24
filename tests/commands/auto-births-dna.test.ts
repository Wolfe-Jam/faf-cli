/**
 * WJTTC — #261: `faf auto` writes the birth certificate on a first setup.
 *
 * A first setup through auto (no project.faf, no .faf-dna) births .faf-dna at
 * the honest first score, as init does. An existing project.faf without one is
 * not a first setup: no birth. A .faf-dna that is there is never replaced.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { tempDirs } from '../helpers/temp-dirs.js';

const temp = tempDirs();
afterAll(() => temp.removeAll());
const CLI = join(import.meta.dir, '../../src/cli.ts');

function repo(): string {
  const dir = realpathSync(temp.mkdtemp(join(tmpdir(), 'faf-auto-dna-')));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo app' }));
  return dir;
}
const auto = (dir: string) => spawnSync('bun', [CLI, 'auto'], { cwd: dir, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });
const scoreOf = (out: string): number => Number(/(\d+)%/.exec(out)?.[1]);

describe('BRAKE: the birth certificate on a first setup through auto (#261)', () => {
  test('no project.faf, no .faf-dna: auto births .faf-dna at the first score', () => {
    const dir = repo();
    const r = auto(dir);
    expect(r.status).toBe(0);
    expect(existsSync(join(dir, '.faf-dna'))).toBe(true);
    const dna = JSON.parse(readFileSync(join(dir, '.faf-dna'), 'utf-8'));
    expect(dna.birthCertificate.birthDNA).toBe(scoreOf(r.stdout));
    expect(r.stdout).toContain('Birth DNA');
  }, 60_000);

  test('a second auto does not birth again: the certificate stays, growth is recorded', () => {
    const dir = repo();
    auto(dir);
    const first = JSON.parse(readFileSync(join(dir, '.faf-dna'), 'utf-8')).birthCertificate;
    const r = auto(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain('Birth DNA');
    expect(JSON.parse(readFileSync(join(dir, '.faf-dna'), 'utf-8')).birthCertificate).toEqual(first);
  }, 60_000);

  test('an existing project.faf with no .faf-dna is not a first setup: no birth', () => {
    const dir = repo();
    auto(dir);
    const dnaPath = join(dir, '.faf-dna');
    // a clone where .faf-dna never arrived (gitignored, or older than .faf-dna)
    rmSync(dnaPath);
    const r = auto(dir);
    expect(r.status).toBe(0);
    expect(existsSync(dnaPath)).toBe(false);
  }, 60_000);

  test('a .faf-dna that is already there when auto creates project.faf is never replaced', () => {
    const dir = repo();
    const theirs = '{"format":"not faf"}\n';
    writeFileSync(join(dir, '.faf-dna'), theirs);
    const r = auto(dir);
    expect(r.status).toBe(0);
    expect(readFileSync(join(dir, '.faf-dna'), 'utf-8')).toBe(theirs);
    expect(r.stdout).not.toContain('Birth DNA');
  }, 60_000);
});
