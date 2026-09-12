/**
 * BRAKE: no guesses, ever — detection fills a slot only from a repo fact.
 *
 * Each detector that returned a value with no evidence behind it now returns
 * nothing (an empty dir is the first case of each):
 *   - detectPackageManager fell back to 'npm' with no lockfile (R03b); it
 *     now reads package.json's `packageManager` (a fact) before lockfiles
 *     (R03c) and returns '' with no evidence;
 *   - detectLanguage returned 'Unknown', which `faf init` / `faf auto` wrote
 *     into project.main_language; detectRuntime returned 'Unknown' too;
 *   - Svelte: `state_management: Runes` for any Svelte (Svelte 4 has no
 *     Runes) and `build: Vite` for plain Svelte with no Vite in the repo;
 *   - commands: `cargo clippy` for any Cargo.toml, `zig build test` for any
 *     build.zig, `pytest` for any pyproject.toml;
 *   - the format finder's knowledge base: generic words ('Required',
 *     'Containerized', 'Multi-container', 'Orchestrated', 'Cloud', 'API
 *     Server', 'GraphQL Server'), a language or a tool in a slot it does not
 *     fill (backend Python, frontend Zig, backend Helm, frontend DVC / MLflow,
 *     test runners and repo bots as CI/CD), `runtime: Node.js` from a
 *     framework config with no package.json, and 'Swift App' as a framework.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { detectCommands, detectLanguage, detectPackageManager, detectRuntime } from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-noguess-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

/** A folder holding `files` (path → text). */
function repo(files: Record<string, string> = {}): string {
  const dir = mk('repo');
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

function faf(dir: string, ...args: string[]): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, HOME: mk('home'), NO_COLOR: '1' } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('BRAKE: detectPackageManager — evidence or nothing', () => {
  test('empty dir → nothing; a package.json alone names no manager', () => {
    expect(detectPackageManager(repo())).toBe('');
    expect(detectPackageManager(repo({ 'package.json': '{"name":"x","private":true,"workspaces":["packages/*"]}' }))).toBe('');
  });

  test('package.json `packageManager` is a fact, read before lockfiles', () => {
    expect(detectPackageManager(repo({ 'package.json': '{"name":"x","packageManager":"pnpm@9.1.0"}' }))).toBe('pnpm');
    expect(detectPackageManager(repo({ 'package.json': '{"packageManager":"yarn@4.1.0"}', 'package-lock.json': '{}' }))).toBe('yarn');
    expect(detectPackageManager(repo({ 'package.json': '{"packageManager":"bun@1.1.0"}' }))).toBe('bun');
  });

  test('faf auto: `package_manager: None` stays with no evidence (R03b) and takes pnpm from packageManager (R03c)', () => {
    const faf0 = 'project:\n  name: mono\n  goal: A monorepo\n  main_language: TypeScript\n  type: monorepo-root\nstack:\n  package_manager: None # decided per package (HC-PM)\n';
    const plain = repo({ 'project.faf': faf0, 'package.json': JSON.stringify({ name: 'mono', private: true, workspaces: ['packages/*'] }), 'packages/a/package.json': '{"name":"a"}' });
    expect(faf(plain, 'auto').status).toBe(0);
    expect(readFileSync(join(plain, 'project.faf'), 'utf-8')).toContain('  package_manager: None # decided per package (HC-PM)\n');
    const declared = repo({ 'project.faf': faf0, 'package.json': JSON.stringify({ name: 'mono', private: true, workspaces: ['packages/*'], packageManager: 'pnpm@9.1.0' }) });
    expect(faf(declared, 'auto').status).toBe(0);
    expect(readFileSync(join(declared, 'project.faf'), 'utf-8')).toContain('  package_manager: pnpm # decided per package (HC-PM)\n');
  });
});

describe('BRAKE: detectLanguage / detectRuntime — evidence or nothing', () => {
  test('empty dir → nothing, never the placeholder word "Unknown"', () => {
    const dir = repo();
    expect(detectLanguage(dir)).toBe('');
    expect(detectRuntime(dir)).toBe('');
    expect(detectStack(dir).project?.main_language).toBe('');
  });

  test('faf init in a folder with no evidence writes an empty main_language, not "Unknown"', () => {
    const dir = repo({ 'README.md': '# x\n\nA thing.\n' });
    expect(faf(dir, 'init').status).toBe(0);
    const text = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(text).not.toMatch(/main_language: Unknown/);
    expect(text).toMatch(/main_language: ""/);
  });
});

describe('BRAKE: Svelte — Runes and Vite only from facts', () => {
  test('Svelte 4 has no Runes; Svelte 5 does; plain Svelte builds with Vite only when the repo names Vite', () => {
    expect(detectStack(repo({ 'package.json': JSON.stringify({ dependencies: { svelte: '^4.2.0' } }) })).stack?.state_management).toBe('');
    expect(detectStack(repo({ 'package.json': JSON.stringify({ dependencies: { svelte: '^5.0.0' } }) })).stack?.state_management).toBe('Runes');
    expect(detectStack(repo({ 'package.json': JSON.stringify({ dependencies: { svelte: '^5.0.0' } }) })).stack?.build).toBe('');
    expect(detectStack(repo({ 'package.json': JSON.stringify({ dependencies: { svelte: '^5.0.0' }, devDependencies: { vite: '^5' } }) })).stack?.build).toBe('Vite');
    // SvelteKit builds with Vite: that is a fact of SvelteKit.
    expect(detectStack(repo({ 'package.json': JSON.stringify({ dependencies: { svelte: '^5.0.0', '@sveltejs/kit': '^2' } }), 'svelte.config.js': 'export default {}' })).stack?.build).toBe('Vite');
  });
});

describe('BRAKE: detectCommands — a command only when the repo says it', () => {
  test('empty dir → no commands; Cargo.toml alone → no clippy; build.zig alone → no `zig build test`; pyproject.toml alone → no pytest', () => {
    expect(detectCommands(repo(), null)).toEqual({});
    expect(detectCommands(repo({ 'Cargo.toml': '[package]\nname = "x"\n' }), null).lint).toBeUndefined();
    expect(detectCommands(repo({ 'build.zig': 'pub fn build(b: *std.Build) void {}\n' }), null).test).toBeUndefined();
    expect(detectCommands(repo({ 'pyproject.toml': '[project]\nname = "x"\n' }), null).test).toBeUndefined();
    // With the fact, the command is there.
    expect(detectCommands(repo({ 'Cargo.toml': '[package]\nname = "x"\n', 'clippy.toml': '' }), null).lint).toBe('cargo clippy');
    expect(detectCommands(repo({ 'build.zig': 'const t = b.step("test", "Run tests");\n' }), null).test).toBe('zig build test');
    expect(detectCommands(repo({ 'pyproject.toml': '[project]\nname = "x"\n', 'conftest.py': '' }), null).test).toBe('pytest');
  });
});

describe('BRAKE: the format finder asserts only what a file proves, in a slot it fills', () => {
  const stackOf = (files: Record<string, string>): Record<string, string> => turboCatSlots(repo(files)).stack ?? {};

  test('empty dir → nothing; generic words are never a slot value', () => {
    expect(turboCatSlots(repo())).toEqual({});
    expect(stackOf({ 'Dockerfile': 'FROM node:22\n' })).toEqual({}); // no connection: Containerized; no hosting: a container build is not where the app runs
    expect(stackOf({ 'docker-compose.yml': 'services: {}\n' }).connection).toBeUndefined(); // no Multi-container
    expect(stackOf({ 'k8s.yaml': 'kind: Deployment\n' }).connection).toBeUndefined(); // no Orchestrated
    expect(stackOf({ 'Pulumi.yaml': 'name: x\n' }).hosting).toBeUndefined(); // no Cloud
    expect(stackOf({ 'strapi.config.js': 'module.exports = {}\n' }).database).toBeUndefined(); // no Required
    expect(stackOf({ 'openapi.yaml': 'openapi: 3.1.0\n' })).toEqual({ api_type: 'REST API' }); // no backend: API Server
    expect(stackOf({ 'schema.graphql': 'type Query { x: Int }\n' })).toEqual({ api_type: 'GraphQL' }); // no GraphQL Server
  });

  test('no language or tool in a slot it does not fill; no Node.js without package.json', () => {
    expect(stackOf({ 'pyproject.toml': '[project]\nname = "x"\n' }).backend).toBeUndefined(); // Python is a language
    expect(stackOf({ 'build.zig': '' }).frontend).toBeUndefined(); // Zig is a language
    expect(stackOf({ 'Chart.yaml': 'name: x\n' }).backend).toBeUndefined(); // Helm packages Kubernetes apps
    expect(stackOf({ 'dvc.yaml': 'stages: {}\n' }).frontend).toBeUndefined();
    expect(stackOf({ 'MLproject': 'name: x\n' }).cicd).toBeUndefined();
    for (const f of ['jest.config.js', 'vitest.config.ts', 'playwright.config.ts', 'cypress.config.js', 'pytest.ini', '.rspec', 'codecov.yml', 'renovate.json', '.pre-commit-config.yaml']) {
      expect([f, stackOf({ [f]: '' }).cicd]).toEqual([f, undefined]); // a test runner or a repo bot is not the CI/CD
    }
    expect(stackOf({ 'next.config.js': 'module.exports = {}\n' }).runtime).toBeUndefined();
    expect(stackOf({ 'nuxt.config.ts': 'export default {}\n' }).runtime).toBeUndefined();
  });

  test('a Swift app with no framework the repo names gets no framework (never "Swift App")', () => {
    const dir = repo({ 'App.xcodeproj/project.pbxproj': 'productType = "com.apple.product-type.application";\n' });
    expect(turboCatSlots(dir).stack?.frontend).toBeUndefined();
    expect(turboCatSlots(dir).project?.main_language).toBe('Swift');
  });
});
