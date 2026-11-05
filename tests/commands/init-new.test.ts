/**
 * WJTTC BRAKE — `faf init --new` replaces project.faf and never touches
 * .faf-dna. The birth certificate is the one value faf cannot recreate, so
 * only `--force` (an explicit start-over) may write a new birth.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { FafDNAManager } from '../../src/core/faf-dna.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');

const run = (cwd: string, args: string[]) =>
  spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

describe('BRAKE: faf init --new keeps .faf-dna', () => {
  let dir: string;
  const fafFile = () => join(dir, 'project.faf');
  const dnaFile = () => join(dir, '.faf-dna');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-init-new-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo-cli', bin: { demo: 'cli.js' } }));
    writeFileSync(fafFile(), 'faf_version: "3.0"\nproject:\n  name: demo-cli\n  stale_block: from an old faf\n');
    const dna = new FafDNAManager(dir);
    dna.birth(22);
    dna.recordGrowth(50, ['faf auto']);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('--new writes a fresh project.faf and leaves .faf-dna byte for byte', () => {
    const before = readFileSync(dnaFile(), 'utf-8');

    const r = run(dir, ['init', '--new']);

    expect(r.status).toBe(0);
    expect(readFileSync(fafFile(), 'utf-8')).not.toContain('stale_block');
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(before);
    expect(r.stdout).toContain('.faf-dna kept as it is');
  });

  test('--force replaces project.faf as --new does, and leaves .faf-dna byte for byte', () => {
    const before = readFileSync(dnaFile(), 'utf-8');

    const r = run(dir, ['init', '--force']);

    expect(r.status).toBe(0);
    expect(readFileSync(fafFile(), 'utf-8')).not.toContain('stale_block');
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(before);
    expect(r.stderr).toContain('no longer starts a new birth');
  });

  test('--new in a project with no .faf-dna gives it its first birth', () => {
    rmSync(dnaFile());

    const r = run(dir, ['init', '--new']);

    expect(r.status).toBe(0);
    expect(existsSync(dnaFile())).toBe(true);
    expect('priorLineage' in JSON.parse(readFileSync(dnaFile(), 'utf-8'))).toBe(false);
    expect(r.stdout).toContain('Birth DNA');
  });

  test('--new and --force together: project.faf replaced, .faf-dna byte for byte', () => {
    const dna = readFileSync(dnaFile(), 'utf-8');

    const r = run(dir, ['init', '--new', '--force']);

    expect(r.status).toBe(0);
    expect(readFileSync(fafFile(), 'utf-8')).not.toContain('stale_block');
    expect(readFileSync(dnaFile(), 'utf-8')).toBe(dna);
  });

  test('without a flag, an existing project.faf is refused and the error names --new', () => {
    const r = run(dir, ['init']);

    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--new');
    expect(readFileSync(fafFile(), 'utf-8')).toContain('stale_block');
  });
});

describe('BRAKE: faf never offers to reissue a birth certificate', () => {
  // A birth certificate is one per project, never changed or reissued: birth
  // is write-once, and no message suggests --force.
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-no-reissue-'));
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('an existing project.faf: the refusal names --new, never --force', () => {
    expect(run(dir, ['init']).status).toBe(0);
    const r = run(dir, ['init']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--new');
    expect(r.stderr).not.toContain('--force');
  });

  test('a frozen .faf-dna: faf dna says it is protected, and offers no reset', () => {
    new FafDNAManager(dir).birth(22);
    const path = join(dir, '.faf-dna');
    const frozen = readFileSync(path, 'utf-8').trimEnd(); // no final newline: not faf's exact text
    writeFileSync(path, frozen);

    const r = run(dir, ['dna']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Your birth certificate is protected: faf never changes it.');
    expect(r.stdout).not.toContain('--force');
    expect(readFileSync(path, 'utf-8')).toBe(frozen);
  });
});
