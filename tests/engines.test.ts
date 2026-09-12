/**
 * WJTTC BRAKE — the Node engine floor is true (#76, Q1).
 *
 * faf-cli said engines.node >=18 while commander 14, open 11 and friends need
 * Node 20+, so every package composing faf-cli inherited a false floor; ci.yml
 * smoke-tested [18, 20, 22] while release.yml tested [20, 22, 24]. The family
 * floor is Node 22: engines says >=22.0.0, both matrices start at 22, and
 * scripts/check-engines.mjs (CI Code Quality + prepublishOnly) fails the build
 * when they drift apart.
 */

import { describe, test, expect, afterAll, afterEach } from 'bun:test';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tempDirs } from './helpers/temp-dirs.js';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const ROOT = join(import.meta.dir, '..');
const SCRIPT = join(ROOT, 'scripts', 'check-engines.mjs');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8');
const pkg = JSON.parse(read('package.json')) as { engines: { node: string }; scripts: Record<string, string> };

let fixture: string | undefined;
afterEach(() => {
  if (fixture) {rmSync(fixture, { recursive: true, force: true });}
  fixture = undefined;
});

/** A copy of the guard in a mkdtemp repo with the given floor and matrices. */
function repo(engines: string, ci: string, release: string): string {
  fixture = tempFolders.mkdtemp(join(tmpdir(), 'faf-engines-'));
  mkdirSync(join(fixture, 'scripts'));
  mkdirSync(join(fixture, '.github', 'workflows'), { recursive: true });
  copyFileSync(SCRIPT, join(fixture, 'scripts', 'check-engines.mjs'));
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ engines: { node: engines } }));
  writeFileSync(join(fixture, '.github', 'workflows', 'ci.yml'), `jobs:\n  node-compat:\n    strategy:\n      matrix:\n        node: ${ci}\n`);
  writeFileSync(join(fixture, '.github', 'workflows', 'release.yml'), `jobs:\n  test-matrix:\n    strategy:\n      matrix:\n        node-version: ${release}\n`);
  return join(fixture, 'scripts', 'check-engines.mjs');
}
const run = (script: string) => spawnSync('node', [script], { encoding: 'utf-8' });

describe('BRAKE: engines.node is the family floor, and CI runs it', () => {
  test('engines.node is >=22.0.0 (package.json and the lockfile agree)', () => {
    expect(pkg.engines.node).toBe('>=22.0.0');
    const lock = JSON.parse(read('package-lock.json')) as { packages: Record<string, { engines?: { node?: string } }> };
    expect(lock.packages[''].engines?.node).toBe('>=22.0.0');
  });

  test('ci.yml smoke-tests [22.x, 24.x]; release.yml tests [22, 24]', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/\bnode:\s*\[22\.x, 24\.x\]/);
    expect(read('.github/workflows/release.yml')).toMatch(/node-version:\s*\['22', '24'\]/);
  });

  test('the guard passes on this repo, and runs in CI and prepublishOnly', () => {
    const r = run(SCRIPT);
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('engine floor 22');
    expect(pkg.scripts['check:engines']).toBe('node scripts/check-engines.mjs');
    expect(pkg.scripts.prepublishOnly).toContain('check:engines');
    expect(read('.github/workflows/ci.yml')).toContain('npm run check:engines');
  });

  test('the guard fails when the floor and a matrix drift apart', () => {
    const lowFloor = run(repo('>=18.0.0', '[22.x, 24.x]', "['22', '24']"));
    expect(lowFloor.status).toBe(1);
    expect(lowFloor.stderr).toContain('engine floor drift');

    const releaseDrift = run(repo('>=22.0.0', '[22.x, 24.x]', "['20', '22', '24']"));
    expect(releaseDrift.status).toBe(1);
    expect(releaseDrift.stderr).toContain('release.yml');

    expect(run(repo('>=22.0.0', '[22.x, 24.x]', "['22', '24']")).status).toBe(0);
  });
});
