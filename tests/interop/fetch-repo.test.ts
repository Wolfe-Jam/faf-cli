/**
 * WJTTC — `faf-cli/fetch`: the fetch step of `faf git`, one copy for the CLI
 * and the MCP servers (#236).
 *
 * Network-free: a git `insteadOf` rule (GIT_CONFIG_* env) sends
 * https://github.com/acme/… to a local bare repo, so fetchRepo runs the real
 * normalize → clone → link-placeholder path on a GitHub-shaped URL.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import * as fetchApi from '../../src/fetch.js';
import * as mainApi from '../../src/index.js';
import { FetchRepoError, fetchRepo } from '../../src/fetch.js';

let root = '';
const ENV_KEYS = ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'] as const;
const saved: Record<string, string | undefined> = {};
const gitEnv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'faf-fetch-'));
  const work = join(root, 'work');
  execFileSync('git', ['init', '-q', '-b', 'main', work], { env: gitEnv });
  writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo app' }));
  writeFileSync(join(work, 'docs.md'), '# Docs\n');
  symlinkSync('docs.md', join(work, 'README.md')); // a link: must not reach detection
  execFileSync('git', ['-C', work, 'add', '-A'], { env: gitEnv });
  execFileSync('git', ['-C', work, 'commit', '-q', '-m', 'init'], { env: gitEnv });
  execFileSync('git', ['-C', work, 'tag', 'v1'], { env: gitEnv });
  execFileSync('git', ['clone', '-q', '--bare', work, join(root, 'remote', 'demo.git')], { env: gitEnv });
  for (const k of ENV_KEYS) {saved[k] = process.env[k];}
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = `url.file://${join(root, 'remote')}/.insteadOf`;
  process.env.GIT_CONFIG_VALUE_0 = 'https://github.com/acme/';
});
afterAll(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) {delete process.env[k];} else {process.env[k] = saved[k];}
  }
  rmSync(root, { recursive: true, force: true });
});

describe('BRAKE: fetch lives in faf-cli/fetch, not in the main import', () => {
  test('faf-cli/fetch exports fetchRepo, FetchRepoError and githubDescription, nothing else', () => {
    expect(Object.keys(fetchApi).sort()).toEqual(['FetchRepoError', 'fetchRepo', 'githubDescription']);
  });
  test('the main faf-cli import has no fetch', () => {
    for (const name of ['fetchRepo', 'FetchRepoError', 'cloneArgs', 'dropLinkPlaceholders']) {
      expect(name in mainApi).toBe(false);
    }
  });
  test('package.json maps faf-cli/fetch to the built entry', () => {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dir, '../../package.json'), 'utf-8'));
    expect(pkg.exports['./fetch']).toEqual({ types: './dist/fetch.d.ts', default: './dist/fetch.js' });
    expect(pkg.scripts.build).toContain('bun build src/fetch.ts');
  });
});

describe('ENGINE: fetchRepo', () => {
  test('clones a GitHub-shaped URL, drops link placeholders, cleans up', async () => {
    const repo = await fetchRepo('acme/demo');
    try {
      expect(repo.repoUrl).toBe('https://github.com/acme/demo.git');
      expect(existsSync(join(repo.dir, 'package.json'))).toBe(true);
      expect(existsSync(join(repo.dir, 'README.md'))).toBe(false); // the link's placeholder is gone
      const data = mainApi.authorFafFromRepo(repo.dir, { repoUrl: repo.repoUrl });
      expect(data.project?.name).toBe('demo');
    } finally {
      repo.cleanup();
    }
    expect(existsSync(dirname(repo.dir))).toBe(false);
    expect(() => repo.cleanup()).not.toThrow(); // twice is fine
  });

  test('--ref clones that tag', async () => {
    const repo = await fetchRepo('https://github.com/acme/demo', { ref: 'v1' });
    try {
      expect(existsSync(join(repo.dir, 'package.json'))).toBe(true);
    } finally {
      repo.cleanup();
    }
  });

  test('a URL faf does not accept: FetchRepoError kind url, nothing created', async () => {
    const err = await fetchRepo('acme/demo; rm -rf /').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchRepoError);
    expect((err as FetchRepoError).kind).toBe('url');
  });

  test('a clone that fails: FetchRepoError kind clone with git\'s reason, temp folder removed', async () => {
    const err = await fetchRepo('acme/no-such-repo').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FetchRepoError);
    expect((err as FetchRepoError).kind).toBe('clone');
    expect((err as FetchRepoError).reason).toBeTruthy();
    expect((err as FetchRepoError).message).toContain('could not clone acme/no-such-repo');
  });
});
