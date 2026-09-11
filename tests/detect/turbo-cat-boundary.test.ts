/**
 * WJTTC BRAKE — Turbo-Cat never looks above the project directory (#19).
 *
 * The config-file scan used to walk up to 10 parent directories, stopping only
 * at the project's OWN .git. A new folder under a repo, a monorepo package, or
 * any folder under ~ inherited its ancestors' tsconfig.json / vercel.json /
 * Cargo.toml, and `faf init` / `faf auto` wrote that other tree's stack into
 * project.faf as fact. Now: the project directory only, real files only, and
 * no constant README guesses.
 *
 * Every fixture is a mkdtemp tree, so the result cannot depend on where the
 * checkout lives.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { turboCatScan, turboCatSlots } from '../../src/detect/turbo-cat.js';
import { assembleFreshFaf, updateExistingFaf } from '../../src/detect/assemble.js';

const posix = process.platform !== 'win32';
let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'faf-tc-boundary-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const put = (rel: string, body = 'x\n'): void => {
  const p = join(root, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, body);
};

describe('BRAKE: Turbo-Cat scans the project directory only', () => {
  test('an empty folder three levels below other projects inherits nothing', () => {
    put('tsconfig.json', '{}');
    put('vercel.json', '{}');
    put('bunfig.toml', '[install]\n');
    put('Cargo.toml', '[package]\nname = "above"\n');
    const leaf = join(root, 'a', 'b', 'c');
    mkdirSync(leaf, { recursive: true });

    const r = turboCatScan(leaf);
    expect(r.discoveredFormats).toEqual([]);
    expect(r.slotFills).toEqual({});
    expect(r.confirmedCount).toBe(0);
    expect(turboCatSlots(leaf)).toEqual({});
  });

  test('a monorepo package does not take the stack of the repo root above it', () => {
    mkdirSync(join(root, '.git'));
    put('Cargo.toml', '[package]\nname = "mono"\n');
    put('packages/py/requirements.txt', 'flask==3.0\n');
    const pkg = join(root, 'packages', 'py');

    const s = turboCatSlots(pkg);
    expect(s.project?.main_language).toBe('Python');
    expect(s.stack?.build).toBeUndefined(); // not 'cargo' from the root
    expect(turboCatScan(pkg).discoveredFormats.map(f => f.fileName)).toEqual(['requirements.txt']);
  });

  test('faf auto / faf init path: a subfolder never gets a parent Cargo.toml as its build', () => {
    put('Cargo.toml', '[package]\nname = "above"\n');
    put('sub/requirements.txt', 'flask==3.0\n');
    put('sub/app.py', 'print(1)\n');
    const sub = join(root, 'sub');

    const fresh = assembleFreshFaf(sub) as { stack?: Record<string, unknown>; project?: Record<string, unknown> };
    expect(fresh.stack?.build).not.toBe('cargo');
    expect(fresh.project?.main_language).not.toBe('Rust');
    const updated = updateExistingFaf(sub, { project: { name: 'sub' } }) as { stack?: Record<string, unknown> };
    expect(updated.stack?.build).not.toBe('cargo');
  });

  test('a folder named like a format is not that format (go.mod/, package.json/)', () => {
    mkdirSync(join(root, 'go.mod'));
    mkdirSync(join(root, 'requirements.txt'));
    expect(turboCatSlots(root)).toEqual({});
    expect(turboCatScan(root).discoveredFormats).toEqual([]);
  });

  test.skipIf(!posix)('a link to a real file still counts; a dangling link does not', () => {
    put('real-go.mod', 'module x\ngo 1.21\n');
    symlinkSync(join(root, 'real-go.mod'), join(root, 'go.mod'));
    symlinkSync(join(root, 'nowhere.txt'), join(root, 'requirements.txt'));
    const s = turboCatSlots(root);
    expect(s.stack?.build).toBe('go build');
    expect(s.project?.main_language).toBe('Go');
  });

  test('README.md asserts no human-context slot (no constant "developers")', () => {
    put('README.md', '# demo\n\nA thing for data scientists.\n');
    const r = turboCatScan(root);
    expect(r.slotFills).toEqual({});
    expect(r.discoveredFormats.map(f => f.fileName)).toEqual(['README.md']);
  });
});
