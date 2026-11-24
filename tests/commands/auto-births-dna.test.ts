/**
 * WJTTC — #261, #279: `faf auto` runs init if there is no project.faf.
 *
 * init writes project.faf and the birth certificate. An existing project.faf
 * without a .faf-dna gets none. A .faf-dna that is there is never replaced.
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
const faf = (dir: string, cmd: string) => spawnSync('bun', [CLI, cmd], { cwd: dir, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });
const auto = (dir: string) => faf(dir, 'auto');
const scoreOf = (out: string): number => Number(/(\d+)%/.exec(out)?.[1]);

describe('BRAKE: the birth certificate on a first setup through auto (#261)', () => {
  test('no project.faf: auto runs init — the same file, the same .faf-dna birth, the same output (#279)', () => {
    const a = repo();
    const b = repo();
    const viaAuto = auto(a);
    const viaInit = faf(b, 'init');
    expect(viaAuto.status).toBe(0);
    expect(viaInit.status).toBe(0);
    expect(readFileSync(join(a, 'project.faf'), 'utf-8')).toBe(readFileSync(join(b, 'project.faf'), 'utf-8'));
    expect(JSON.parse(readFileSync(join(a, '.faf-dna'), 'utf-8')).birthCertificate.birthDNA)
      .toBe(JSON.parse(readFileSync(join(b, '.faf-dna'), 'utf-8')).birthCertificate.birthDNA);
    expect(viaAuto.stdout.replaceAll(a, 'DIR')).toBe(viaInit.stdout.replaceAll(b, 'DIR'));
  }, 60_000);

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
