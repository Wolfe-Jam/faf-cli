import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { FafDNAManager } from '../../src/core/faf-dna.js';

// `faf dna --json`: the lineage as data, for CI, the MCPs and anything that
// wants to cite a birth certificate.
const CLI = join(import.meta.dir, '../../src/cli.ts');
const run = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, 'dna', ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

describe('ENGINE: faf dna --json', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `faf-test-dna-json-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('birth, growth and every version, as JSON', () => {
    const dna = new FafDNAManager(dir);
    dna.birth(22);
    dna.recordGrowth(85, ['faf go — filled 9 slots']);
    dna.recordGrowth(80, ['faf edit project.goal']);

    const r = run(dir, '--json');
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.birth_dna).toBe(22);
    expect(j.current).toBe(80);
    expect(j.growth).toBe(58);
    expect(j.peak).toBe(85);
    expect(j.journey).toBe('22% → 85% ← 80%');
    expect(j.versions.map((v: { score: number }) => v.score)).toEqual([22, 85, 80]);
    expect(j.versions[1].changes).toEqual(['faf go — filled 9 slots']);
    expect(j.certificate).toMatch(/^FAF-\d{4}-/);
    expect(j.prior_lives).toEqual([]);
    expect(j.faf_written).toBe(true);
    expect(j.note).toBeNull();
  });

  test('the same .faf-dna gives the same JSON', () => {
    new FafDNAManager(dir).birth(40);
    expect(run(dir, '--json').stdout).toBe(run(dir, '--json').stdout);
  });

  test('earlier lives a reset ended are listed, oldest first', () => {
    new FafDNAManager(dir).birth(30);
    new FafDNAManager(dir).birth(60); // a reset: the 30% life is kept
    const j = JSON.parse(run(dir, '--json').stdout);
    expect(j.birth_dna).toBe(60);
    expect(j.prior_lives).toHaveLength(1);
    expect(j.prior_lives[0].birth_dna).toBe(30);
    expect(Object.keys(j.prior_lives[0]).sort()).toEqual(['birth_dna', 'born', 'certificate', 'ended_at', 'last_score']);
  });

  test('a .faf-dna faf did not write: read, flagged, never rewritten', () => {
    new FafDNAManager(dir).birth(50);
    const path = join(dir, '.faf-dna');
    const hand = JSON.stringify(JSON.parse(readFileSync(path, 'utf-8'))); // one line: not faf's text
    writeFileSync(path, hand);
    const r = run(dir, '--json');
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.birth_dna).toBe(50);
    expect(j.faf_written).toBe(false);
    expect(typeof j.note).toBe('string');
    expect(readFileSync(path, 'utf-8')).toBe(hand);
  });

  test('no .faf-dna → exit 1, nothing on stdout, one line on stderr', () => {
    const r = run(dir, '--json');
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('No FAF DNA found');
  });
});
