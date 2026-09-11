/**
 * WJTTC BRAKE — the pure parts of `faf git`, and registryTitle, are public;
 * nothing that runs git is (#21, #86).
 *
 * claude-faf-mcp authored its own faf_git file (a non-.faf schema, a local slot
 * counter claiming "Score: 100% (Trophy)" for a file faf scores 14–24%) and a
 * local copy of registryTitle, because faf-cli exported neither. Now a consumer
 * fetches the repo its own way and calls authorFafFromRepo(dir) — the same
 * pipeline `faf git` runs — and composes registryTitle. The clone stays in the
 * CLI: no exported module reaches child_process.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import * as api from '../../src/index.js';
import { serializeFaf } from '../../src/interop/faf.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-git-repo-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('BRAKE: the function form of faf git', () => {
  test('normalizeGitUrl, repoNameFromUrl and authorFafFromRepo are exported', () => {
    expect(api.normalizeGitUrl('acme/demo')).toBe('https://github.com/acme/demo.git');
    expect(() => api.normalizeGitUrl('acme/demo; rm -rf /')).toThrow();
    expect(api.repoNameFromUrl('https://github.com/acme/demo.git')).toBe('demo');
    expect(typeof api.authorFafFromRepo).toBe('function');
  });

  test('authorFafFromRepo: the faf auto pipeline on a fetched folder, canonical keys, nothing written', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'acme-web', description: 'The Acme storefront' }));
    writeFileSync(join(dir, 'README.md'), '# acme-web\n\nThe Acme storefront for small shops.\n');
    const before = readdirSync(dir).sort();

    const data = api.authorFafFromRepo(dir, { repoUrl: 'https://github.com/acme/demo.git' });
    expect(data.project?.name).toBe('acme-web'); // a real package.json name is kept
    expect(data.project?.goal).toBe('The Acme storefront');
    expect(typeof data.project?.main_language).toBe('string');
    expect(data.human_context).toBeDefined();
    expect(readdirSync(dir).sort()).toEqual(before);

    const yaml = serializeFaf(data);
    expect(yaml).not.toContain('# Generated');
    const scored = api.scoreFafYaml(yaml);
    expect(scored.score).toBeGreaterThanOrEqual(0);
    expect(scored.score).toBeLessThanOrEqual(100);
  });

  test('with no name of its own, the project is named after the repo, not the fetch folder', () => {
    writeFileSync(join(dir, 'requirements.txt'), 'flask==3.0\n');
    const data = api.authorFafFromRepo(dir, { repoUrl: 'acme/ml-pipe' });
    expect(data.project?.name).toBe('ml-pipe');
    // Without a repo URL the folder name stands.
    expect(api.authorFafFromRepo(dir).project?.name).toBe(dir.split('/').pop());
  });

  test('registryTitle is exported: trimmed, ≤100 chars, else undefined', () => {
    expect(api.registryTitle({ project: { title: '  Claude FAF  ' } })).toBe('Claude FAF');
    expect(api.registryTitle({ project: { title: 'x'.repeat(101) } })).toBeUndefined();
    expect(api.registryTitle({ project: {} })).toBeUndefined();
  });
});

describe('BRAKE: nothing exported runs git', () => {
  test('the clone, the git-backed helpers and the CLI command are not exported', () => {
    for (const name of ['gitCommand', 'cloneArgs', 'resolveGitTarget', 'gitRepoRel']) {
      expect(name in api).toBe(false);
    }
  });

  test('detect/git-repo.ts and every module it imports never import child_process', () => {
    const srcRoot = resolve(import.meta.dir, '../../src');
    const seen = new Set<string>();
    const walk = (file: string): void => {
      if (seen.has(file)) {return;}
      seen.add(file);
      const text = readFileSync(file, 'utf-8');
      expect({ file, childProcess: /['"](node:)?child_process['"]/.test(text) }).toEqual({ file, childProcess: false });
      for (const m of text.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)\.js['"]/g)) {
        const next = resolve(dirname(file), `${m[1]}.ts`);
        if (existsSync(next)) {walk(next);}
      }
    };
    walk(join(srcRoot, 'detect', 'git-repo.ts'));
    expect(seen.size).toBeGreaterThan(3);
  });
});
