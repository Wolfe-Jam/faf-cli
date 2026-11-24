/**
 * WJTTC — the GitHub description as a goal suggestion (#237, split: the
 * description yes, the metadata block no). Network-free: fetch is replaced.
 */
import { describe, test, expect, afterEach, beforeEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { githubRepoOf } from '../../src/detect/git-url.js';
import { githubDescription } from '../../src/fetch.js';
import { suggestIntent } from '../../src/core/suggest.js';

const realFetch = globalThis.fetch;
const realEnv = { GITHUB_TOKEN: process.env.GITHUB_TOKEN, GH_TOKEN: process.env.GH_TOKEN };
let calls: { url: string; headers: Record<string, string> }[] = [];
const respond = (status: number, body: unknown): void => {
  globalThis.fetch = (async (url: string, init?: { headers?: Record<string, string> }) => {
    calls.push({ url: String(url), headers: init?.headers ?? {} });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
};
beforeEach(() => { calls = []; delete process.env.GITHUB_TOKEN; delete process.env.GH_TOKEN; });
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(realEnv)) {if (v === undefined) {delete process.env[k];} else {process.env[k] = v;}}
});

describe('BRAKE: githubRepoOf takes GitHub remotes only', () => {
  test.each([
    ['https://github.com/tokio-rs/axum.git', 'tokio-rs/axum'],
    ['https://github.com/tokio-rs/axum', 'tokio-rs/axum'],
    ['git@github.com:tokio-rs/axum.git', 'tokio-rs/axum'],
    ['ssh://git@github.com/tokio-rs/axum.git', 'tokio-rs/axum'],
    ['tokio-rs/axum', 'tokio-rs/axum'],
    ['https://gitlab.com/a/b.git', null],
    ['https://github.com/a/b/c', null],
    ['https://github.com/a/..', null],
    ['a/b; rm -rf /', null],
    ['', null],
  ])('%s → %s', (remote, want) => {
    expect(githubRepoOf(remote)).toBe(want);
  });
});

describe('ENGINE: githubDescription', () => {
  test('one API call; the trimmed description', async () => {
    respond(200, { description: '  HTTP routing and request-handling library for Rust  ' });
    expect(await githubDescription('https://github.com/tokio-rs/axum.git')).toBe('HTTP routing and request-handling library for Rust');
    expect(calls.map(c => c.url)).toEqual(['https://api.github.com/repos/tokio-rs/axum']);
    expect(calls[0].headers.Authorization).toBeUndefined();
  });
  test('GITHUB_TOKEN, then GH_TOKEN, is sent as a bearer token', async () => {
    respond(200, { description: 'x' });
    process.env.GH_TOKEN = 'gh';
    await githubDescription('a/b');
    process.env.GITHUB_TOKEN = 'github';
    await githubDescription('a/b');
    expect(calls.map(c => c.headers.Authorization)).toEqual(['Bearer gh', 'Bearer github']);
  });
  test('no description, a 404, a rate limit, a network error, a non-GitHub repo: null, never a throw', async () => {
    respond(200, { description: null });
    expect(await githubDescription('a/b')).toBeNull();
    respond(404, { message: 'Not Found' });
    expect(await githubDescription('a/b')).toBeNull();
    respond(403, { message: 'API rate limit exceeded' });
    expect(await githubDescription('a/b')).toBeNull();
    globalThis.fetch = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await githubDescription('a/b')).toBeNull();
    calls = [];
    respond(200, { description: 'x' });
    expect(await githubDescription('https://gitlab.com/a/b')).toBeNull();
    expect(calls).toEqual([]);
  });
});

describe('ENGINE: the description is a goal suggestion, never written', () => {
  let dir = '';
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'faf-ghdesc-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('README has nothing usable: the goal suggestion is the GitHub description, sourced', () => {
    writeFileSync(join(dir, 'README.md'), '# axum\n\n[![badge](https://x/y.svg)](https://x)\n');
    const s = suggestIntent(dir, undefined, { githubDescription: 'HTTP routing and request-handling library for Rust' });
    expect(s['project.goal']).toEqual({ value: 'HTTP routing and request-handling library for Rust', source: 'GitHub description' });
  });
  test('the README still leads', () => {
    writeFileSync(join(dir, 'README.md'), '# demo\n\nA tool that turns receipts into a ledger for small shops.\n');
    const s = suggestIntent(dir, undefined, { githubDescription: 'Something else entirely about the repo' });
    expect(s['project.goal']?.source).toContain('README.md');
  });
  test('ahead of the package.json description, which still offers `what`', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'Turns paper receipts into a searchable ledger' }));
    const s = suggestIntent(dir, undefined, { githubDescription: 'A ledger for small shops' });
    expect(s['project.goal']?.source).toBe('GitHub description');
    expect(s['human_context.what']?.source).toBe('package.json description');
  });
  test('a goal the person wrote gets no suggestion', () => {
    const s = suggestIntent(dir, { project: { goal: 'Their own goal' } }, { githubDescription: 'A ledger for small shops' });
    expect(s['project.goal']).toBeUndefined();
  });
  test('without the source, nothing changes', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A ledger for small shops' }));
    expect(suggestIntent(dir)['project.goal']?.source).toBe('package.json description');
  });
});

describe('AERO: faf go --github is an opt-in flag', () => {
  test('faf go --help lists --github', () => {
    const r = spawnSync('bun', [resolve(import.meta.dir, '../../src/cli.ts'), 'go', '--help'], { encoding: 'utf-8' });
    expect(r.stdout).toContain('--github');
  }, 30_000);
});
