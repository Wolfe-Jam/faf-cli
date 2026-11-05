/**
 * WJTTC BRAKE — the birth certificate's permanent record is the commit that
 * first added `.faf-dna`. `faf dna --verify` checks the file against it, and
 * faf says when the certificate is not committed yet. faf never commits.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { commitHint, verifyBirth } from '../../src/core/birth-commit.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');

/** git with a throwaway identity, so no global config is read or written. */
const git = (cwd: string, ...args: string[]) =>
  spawnSync('git', ['-c', 'user.name=WJTTC', '-c', 'user.email=wjttc@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf-8' });

const run = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, 'dna', ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

const current = (dir: string) => new FafDNAManager(dir).load()?.birthCertificate ?? null;

describe('BRAKE: the birth commit is the permanent record', () => {
  let dir: string;
  const dnaFile = () => join(dir, '.faf-dna');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'faf-birth-commit-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** A repo with a born, committed .faf-dna. */
  const bornAndCommitted = () => {
    git(dir, 'init', '-q');
    new FafDNAManager(dir).birth(22);
    git(dir, 'add', '.faf-dna');
    git(dir, 'commit', '-q', '-m', 'faf: birth certificate');
  };

  test('not a git repository: cannot check, and no commit hint', () => {
    new FafDNAManager(dir).birth(22);
    expect(verifyBirth(dir, current(dir)).state).toBe('cannot');
    expect(commitHint(dir)).toBeNull();
  });

  test('not committed yet: cannot check, and the hint gives the exact command', () => {
    git(dir, 'init', '-q');
    new FafDNAManager(dir).birth(22);
    const check = verifyBirth(dir, current(dir));
    expect(check.state).toBe('cannot');
    expect(commitHint(dir)).toContain('git add .faf-dna && git commit');
  });

  test('gitignored: no commit hint (the gitignore warning covers it)', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, '.gitignore'), '.faf-dna\n');
    new FafDNAManager(dir).birth(22);
    expect(commitHint(dir)).toBeNull();
  });

  test('committed and unchanged: the same, and no hint', () => {
    bornAndCommitted();
    expect(verifyBirth(dir, current(dir)).state).toBe('same');
    expect(commitHint(dir)).toBeNull();
  });

  test('growth after the commit: still the same certificate', () => {
    bornAndCommitted();
    new FafDNAManager(dir).recordGrowth(80, ['faf auto']);
    git(dir, 'commit', '-q', '-am', 'growth');
    expect(verifyBirth(dir, current(dir)).state).toBe('same');
  });

  test('a hand edit to the certificate is caught, by field', () => {
    bornAndCommitted();
    const onDisk = JSON.parse(readFileSync(dnaFile(), 'utf-8'));
    onDisk.birthCertificate.certificate = 'FAF-2026-FORGED-XXXX';
    writeFileSync(dnaFile(), `${JSON.stringify(onDisk, null, 2)}\n`);
    const check = verifyBirth(dir, current(dir));
    expect(check.state).toBe('changed');
    expect(check.state === 'changed' && check.fields).toEqual(['certificate']);
  });

  test('deleted and born again, even committed: checked against the FIRST commit', () => {
    bornAndCommitted();
    git(dir, 'rm', '-q', '.faf-dna');
    git(dir, 'commit', '-q', '-m', 'drop');
    new FafDNAManager(dir).birth(90);
    git(dir, 'add', '.faf-dna');
    git(dir, 'commit', '-q', '-m', 'a second birth');
    const check = verifyBirth(dir, current(dir));
    expect(check.state).toBe('changed');
    expect(check.state === 'changed' && check.fields).toContain('certificate');
  });

  test('.faf-dna missing after it was committed: changed', () => {
    bornAndCommitted();
    rmSync(dnaFile());
    expect(verifyBirth(dir, null).state).toBe('changed');
  });

  test('a shallow clone: cannot check, never a false match', () => {
    bornAndCommitted();
    writeFileSync(join(dir, 'later.txt'), 'x\n');
    git(dir, 'add', 'later.txt');
    git(dir, 'commit', '-q', '-m', 'later');
    const clone = mkdtempSync(join(tmpdir(), 'faf-birth-shallow-'));
    try {
      expect(git(clone, 'clone', '-q', '--depth', '1', `file://${dir}`, 'c').status).toBe(0);
      const c = join(clone, 'c');
      const check = verifyBirth(c, current(c));
      expect(check.state).toBe('cannot');
      expect(check.state === 'cannot' && check.why).toContain('shallow');
    } finally {
      rmSync(clone, { recursive: true, force: true });
    }
  });

  test('faf init in a git repo: the birth line is followed by the commit hint, and nothing is committed', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
    const r = spawnSync(process.execPath, [CLI, 'init'], { cwd: dir, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('not committed yet');
    expect(git(dir, 'rev-parse', '--verify', '-q', 'HEAD').status).not.toBe(0);
  });

  test('faf dna --verify exits 0 same, 1 changed, 2 cannot check', () => {
    git(dir, 'init', '-q');
    new FafDNAManager(dir).birth(22);
    expect(run(dir, '--verify').status).toBe(2);
    git(dir, 'add', '.faf-dna');
    git(dir, 'commit', '-q', '-m', 'faf: birth certificate');
    const same = run(dir, '--verify');
    expect(same.status).toBe(0);
    expect(same.stdout).toContain('matches the commit');
    const onDisk = JSON.parse(readFileSync(dnaFile(), 'utf-8'));
    onDisk.birthCertificate.birthDNA = 99;
    writeFileSync(dnaFile(), `${JSON.stringify(onDisk, null, 2)}\n`);
    const changed = run(dir, '--verify', '--json');
    expect(changed.status).toBe(1);
    expect(JSON.parse(changed.stdout)).toMatchObject({ state: 'changed', fields: ['birthDNA'] });
  });
});
