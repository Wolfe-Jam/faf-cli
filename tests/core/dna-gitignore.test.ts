import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { dnaGitignoreWarning, dnaIgnoredWithoutReason } from '../../src/core/dna-gitignore.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';

// .faf-dna is the birth certificate: gitignored, a fresh clone loses it.
// faf says so in one line, unless the ignore line has its reason above it.
const CLI = join(import.meta.dir, '../../src/cli.ts');
const git = (cwd: string, ...args: string[]) =>
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf-8' });
const faf = (cwd: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, NO_COLOR: '1' } });

describe('BRAKE: .faf-dna gitignored', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `faf-test-dna-ignore-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('not a git repo → nothing to say', () => {
    expect(dnaIgnoredWithoutReason(dir)).toBeNull();
  });

  test('a repo that does not ignore it → nothing to say', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n');
    expect(dnaIgnoredWithoutReason(dir)).toBeNull();
  });

  test('ignored with no reason → the rule, named', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n.faf-dna\n');
    expect(dnaIgnoredWithoutReason(dir)).toBe('.gitignore:2: .faf-dna');
    expect(dnaGitignoreWarning(dir)).toContain('a fresh clone loses the birth certificate');
  });

  test('ignored by a wider pattern → still named', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, '.gitignore'), '.faf*\n');
    expect(dnaIgnoredWithoutReason(dir)).toBe('.gitignore:1: .faf*');
  });

  test('ignored with a # reason on the line above → quiet', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n# busy team repo: DNA churn\n.faf-dna\n');
    expect(dnaIgnoredWithoutReason(dir)).toBeNull();
  });

  test('ignored from a subfolder .gitignore with no reason → named', () => {
    git(dir, 'init', '-q');
    const sub = join(dir, 'pkg');
    mkdirSync(sub);
    writeFileSync(join(sub, '.gitignore'), '.faf-dna\n');
    expect(dnaIgnoredWithoutReason(sub)).toBe('pkg/.gitignore:1: .faf-dna');
  });

  test('a tracked .faf-dna is committed already → quiet', () => {
    git(dir, 'init', '-q');
    new FafDNAManager(dir).birth(10);
    git(dir, 'add', '.faf-dna');
    git(dir, 'commit', '-q', '-m', 'dna');
    writeFileSync(join(dir, '.gitignore'), '.faf-dna\n');
    expect(dnaIgnoredWithoutReason(dir)).toBeNull();
  });

  test('faf init says it in one line on stderr; faf dna shows it; --json carries it', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
    writeFileSync(join(dir, '.gitignore'), '.faf-dna\n');

    const init = faf(dir, 'init');
    expect(init.status).toBe(0);
    const lines = init.stderr.split('\n').filter((l) => l.includes('.faf-dna is gitignored'));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('.gitignore:1: .faf-dna');

    expect(faf(dir, 'dna').stdout).toContain('.faf-dna is gitignored');
    expect(JSON.parse(faf(dir, 'dna', '--json').stdout).gitignored).toBe(true);
  });

  test('not ignored → init and dna stay quiet; --json says false', () => {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'package.json'), '{"name":"p","version":"1.0.0"}');
    const init = faf(dir, 'init');
    expect(init.stderr).not.toContain('gitignored');
    expect(faf(dir, 'dna').stdout).not.toContain('gitignored');
    expect(JSON.parse(faf(dir, 'dna', '--json').stdout).gitignored).toBe(false);
  });
});
