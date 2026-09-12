/**
 * WJTTC BRAKE — check-engines reads every Node version in every workflow
 * (regression checker #5, the 7.13 owner-rule round).
 *
 * scripts/check-engines.mjs matched only the FIRST `node: [ … ]` /
 * `node-version: [ … ]` list in ci.yml and release.yml. The checker appended a
 * second job to release.yml (the "engmut" mutation):
 *
 *   extra-compat:
 *     strategy:
 *       matrix:
 *         node-version: [20, 22]
 *
 * and the guard still passed with engines.node >=22 — a job running Node 20
 * under a floor of 22. It also never read a single `node-version: 20`, a block
 * list, an `${{ env.X }}` reference, or any workflow but those two files.
 *
 * Now every `node:` / `node-version:` value in every .github/workflows/*.yml is
 * read (lists, single values, `${{ env.X }}` resolved from the file's env), and
 * the guard fails when any version is below the floor, or when the lowest one
 * is not the floor. Each fixture is a mkdtemp copy of the guard.
 */

import { afterAll, describe, test, expect } from 'bun:test';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { tempDirs } from './helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const ROOT = join(import.meta.dir, '..');
const SCRIPT = join(ROOT, 'scripts', 'check-engines.mjs');
const REAL_CI = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf-8');
const REAL_RELEASE = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf-8');

/** The checker's engmut job, appended to release.yml. */
const ENGMUT = '\n  extra-compat:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [20, 22]\n    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: ${{ matrix.node-version }}\n';

/** A mkdtemp repo: the guard, a package.json with `engines`, and these workflows. */
function repo(engines: string, workflows: Record<string, string>): string {
  const dir = tempFolders.mkdtemp(join(tmpdir(), 'faf-engines-wf-'));
  mkdirSync(join(dir, 'scripts'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  copyFileSync(SCRIPT, join(dir, 'scripts', 'check-engines.mjs'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ engines: { node: engines } }));
  for (const [name, text] of Object.entries(workflows)) {writeFileSync(join(dir, '.github', 'workflows', name), text);}
  return join(dir, 'scripts', 'check-engines.mjs');
}
const run = (script: string) => spawnSync('node', [script], { encoding: 'utf-8' });
const job = (body: string): string => `on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n${body}`;

describe('BRAKE: check-engines fails on any Node below the floor, anywhere in CI', () => {
  test('engmut: a second matrix in release.yml running Node 20 fails the guard', () => {
    const r = run(repo('>=22.0.0', { 'ci.yml': REAL_CI, 'release.yml': `${REAL_RELEASE.trimEnd()}\n${ENGMUT}` }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('release.yml');
    expect(r.stderr).toContain('Node 20');
    // The unmutated real workflows pass the same copy of the guard.
    expect(run(repo('>=22.0.0', { 'ci.yml': REAL_CI, 'release.yml': REAL_RELEASE })).status).toBe(0);
  });

  test('a single `node-version: 20` in a third workflow fails', () => {
    const r = run(repo('>=22.0.0', {
      'ci.yml': REAL_CI,
      'release.yml': REAL_RELEASE,
      'docs.yml': job("    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: '20' # docs build\n"),
    }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('docs.yml');
    expect(r.stderr).toContain('Node 20');
  });

  test('`${{ env.X }}` is resolved from the file\'s env: an env Node of 20 fails', () => {
    const r = run(repo('>=22.0.0', {
      'ci.yml': REAL_CI.replace("NODE_VERSION: '22.x'", "NODE_VERSION: '20.x'"),
      'release.yml': REAL_RELEASE,
    }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('ci.yml');
    expect(r.stderr).toContain('Node 20');
  });

  test('a block list under `node-version:` is read', () => {
    const r = run(repo('>=22.0.0', {
      'ci.yml': job('    strategy:\n      matrix:\n        node-version:\n          - 20\n          - 22\n'),
    }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Node 20');
  });

  test('the lowest Node in CI must be the floor — single values and env references count', () => {
    // No `[ … ]` list anywhere: every version is a single value or an env
    // reference, all 24 — under a floor of 22 that CI never runs.
    const r = run(repo('>=22.0.0', {
      'ci.yml': `env:\n  NODE_VERSION: '24.x'\n${job('    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: ${{ env.NODE_VERSION }}\n')}`,
      'release.yml': job('    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 24\n'),
    }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('engine floor drift');
    expect(r.stderr).toContain('the lowest Node any workflow runs is 24');
  });

  test('a version the guard cannot read (`lts/*`, an unknown `${{ … }}`) fails instead of being skipped', () => {
    for (const value of ['lts/*', '${{ inputs.node }}']) {
      const r = run(repo('>=22.0.0', {
        'ci.yml': REAL_CI,
        'x.yml': job(`    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: ${value}\n`),
      }));
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('x.yml');
    }
  });

  test('matrix references are read where the matrix is; an all-22/24 CI passes', () => {
    const r = run(repo('>=22.0.0', {
      'ci.yml': job("    env:\n      NODE: '22'\n    strategy:\n      matrix:\n        include:\n          - node: 22\n          - node: 24\n    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version: ${{ matrix.node }}\n      - uses: actions/setup-node@v7\n        with:\n          node-version: ${{ env.NODE }}\n"),
    }));
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('engine floor 22');
  });

  // The re-check's engmut-nvf: `node-version-file: .nvmrc` naming Node 20
  // passed, because the file was never read (7.13 round 3b).
  const nvf = (file = '.nvmrc'): string => job(`    steps:\n      - uses: actions/setup-node@v7\n        with:\n          node-version-file: ${file}\n`);

  test('`node-version-file:` is read: the first line of the file it names is the version', () => {
    const low = repo('>=22.0.0', { 'ci.yml': REAL_CI, 'extra.yml': nvf() });
    writeFileSync(join(low, '..', '..', '.nvmrc'), '20\n');
    const r = run(low);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('extra.yml');
    expect(r.stderr).toContain('Node 20');

    const ok = repo('>=22.0.0', { 'ci.yml': REAL_CI, 'extra.yml': nvf('.node-version') });
    writeFileSync(join(ok, '..', '..', '.node-version'), 'v22.4.0\n# pinned for CI\n');
    expect(run(ok).status).toBe(0);
  });

  test('a `node-version-file:` the guard cannot read, or that holds no version number, fails', () => {
    const missing = run(repo('>=22.0.0', { 'ci.yml': REAL_CI, 'extra.yml': nvf('.nvmrc') }));
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('.nvmrc cannot be read');

    const lts = repo('>=22.0.0', { 'ci.yml': REAL_CI, 'extra.yml': nvf() });
    writeFileSync(join(lts, '..', '..', '.nvmrc'), 'lts/*\n');
    const r = run(lts);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("'lts/*' is not a Node version number");
  });
});
