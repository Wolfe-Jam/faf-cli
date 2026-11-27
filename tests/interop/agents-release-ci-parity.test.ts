/**
 * WJTTC — #273: AGENTS.md's "Before a release" and "CI" sections match what
 * agents-md-facts writes for the same repo.
 *
 * faf-cli ports the two detectors (src/interop/agents-release-ci.ts) onto its
 * link-safe reader. This parity test runs agents-md-facts (a devDependency,
 * pinned) and faf-cli on the same repos and fails if either section differs,
 * so the port can't drift. Plus faf-cli's own repo, as the real-world case.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { authorAgentsMd, buildRepoContext } from 'agents-md-facts';
import { tempDirs } from '../helpers/temp-dirs.js';
import { ciSection, ownCommands, readRepoInstructions, releaseSection } from '../../src/interop/agents-release-ci.js';
import { renderAgentsMd, writeAgentsMd } from '../../src/interop/agents.js';

const temp = tempDirs();
afterAll(() => temp.removeAll());

function repo(files: Record<string, string>, git = true): string {
  const dir = realpathSync(temp.mkdtemp(join(tmpdir(), 'faf-rel-ci-')));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  if (git) {
    spawnSync('git', ['init', '-q'], { cwd: dir });
    spawnSync('git', ['add', '-A'], { cwd: dir });
  }
  return dir;
}

/** One `## Heading` section of a rendered AGENTS.md, up to the next heading. */
function section(md: string, heading: string): string {
  const lines = md.split('\n');
  const at = lines.indexOf(`## ${heading}`);
  if (at < 0) {return '';}
  const end = lines.findIndex((l, i) => i > at && l.startsWith('## '));
  return lines.slice(at, end < 0 ? undefined : end).join('\n').trimEnd();
}

/** Both tools' two sections for `dir`, faf-cli given the same listed commands. */
function both(dir: string): { theirs: [string, string]; ours: [string, string] } {
  const ctx = buildRepoContext(dir);
  const md = authorAgentsMd(ctx);
  const r = readRepoInstructions(dir, Object.values(ctx.commands as Record<string, string>));
  return {
    theirs: [section(md, 'Before a release'), section(md, 'CI')],
    ours: [releaseSection(r.release).join('\n').trimEnd(), ciSection(r.ci, r.isGitRepo).join('\n').trimEnd()],
  };
}

const CI_YML = `name: CI
on:
  pull_request:
  push:
    branches: [main, 'feat/**']
jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - name: Lint and types
        run: |
          npm run lint
          npx tsc --noEmit
      - run: echo done
`;

const RELEASE_YML = `on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: npm publish
`;

describe('BRAKE: the two sections match agents-md-facts 0.2.2 (#273)', () => {
  test('a published package with hooks, a matrix CI check and a release workflow', () => {
    const dir = repo({
      'package.json': JSON.stringify({ name: 'demo', version: '1.0.0', scripts: { test: 'vitest', lint: 'eslint .', prepublishOnly: 'npm run build && npm test', prepack: 'npm run build', build: 'tsc' } }),
      '.github/workflows/ci.yml': CI_YML,
      '.github/workflows/release.yml': RELEASE_YML,
    });
    const { theirs, ours } = both(dir);
    expect(theirs[0]).toContain('`npm publish` runs `prepublishOnly`, then `prepack` first:');
    expect(ours).toEqual(theirs);
  });

  test('a public package with no gate and no workflows: both are said, not left out', () => {
    const dir = repo({ 'package.json': JSON.stringify({ name: 'open', version: '0.1.0', scripts: { test: 'node --test' } }) });
    const { theirs, ours } = both(dir);
    expect(theirs[0]).toContain('runs no checks first');
    expect(theirs[1]).toContain('No GitHub Actions workflows');
    expect(ours).toEqual(theirs);
  });

  test('a private package with a release script, a reusable workflow and a bad YAML file', () => {
    const dir = repo({
      'package.json': JSON.stringify({ name: 'app', private: true, scripts: { release: 'npm run build && changeset publish', build: 'vite build', test: 'vitest' } }),
      '.github/workflows/pr.yml': 'on: pull_request\njobs:\n  call:\n    uses: ./.github/workflows/checks.yml\n',
      '.github/workflows/checks.yml': 'on: workflow_call\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n',
      '.github/workflows/broken.yml': 'on: [push\njobs: {',
    });
    const { theirs, ours } = both(dir);
    expect(theirs[0]).toContain('The `release` script runs:');
    expect(ours).toEqual(theirs);
  });

  test('a Rust repo: cargo checks are the repo\'s own commands', () => {
    const dir = repo({
      'Cargo.toml': '[package]\nname = "tool"\nversion = "0.1.0"\n',
      '.github/workflows/rust.yml': 'on: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: cargo build --locked\n      - run: cargo test\n      - run: cargo clippy -- -D warnings\n',
    });
    const { theirs, ours } = both(dir);
    expect(ours).toEqual(theirs);
  });

  test('faf-cli\'s own repo', () => {
    const { theirs, ours } = both(join(import.meta.dir, '../..'));
    expect(theirs[1]).toContain('## CI');
    expect(ours).toEqual(theirs);
  });
});

describe('ENGINE: faf export --agents carries them; a bare render does not read the repo', () => {
  test('writeAgentsMd adds both sections after Run the tests', () => {
    const dir = repo({
      'package.json': JSON.stringify({ name: 'demo', version: '1.0.0', scripts: { test: 'vitest', prepublishOnly: 'npm test' } }),
      '.github/workflows/ci.yml': 'on: pull_request\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n',
    });
    writeAgentsMd(dir, { project: { name: 'demo' }, commands: { test: 'npm test' } } as never);
    const md = readFileSync(join(dir, 'AGENTS.md'), 'utf-8');
    const order = ['## Run the tests', '## Before a release', '## CI', '## Guardrails'].map((h) => md.indexOf(h));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('renderAgentsMd without the repo writes neither section', () => {
    const md = renderAgentsMd({ project: { name: 'x' }, commands: { test: 'npm test' } } as never);
    expect(md).not.toContain('## Before a release');
    expect(md).not.toContain('## CI');
  });

  test('a workflows folder linked out of the project is not read', () => {
    const outside = repo({ 'ci.yml': 'on: pull_request\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n' }, false);
    const dir = repo({ 'package.json': JSON.stringify({ name: 'p', private: true, scripts: { test: 'vitest' } }) });
    mkdirSync(join(dir, '.github'), { recursive: true });
    symlinkSync(outside, join(dir, '.github', 'workflows'));
    expect(readRepoInstructions(dir, []).ci).toEqual([]);
  });

  test('a long run of workspace flags is matched in linear time (no exponential backtracking)', () => {
    const known = ownCommands(repo({}, false), []);
    const t = performance.now();
    expect(known(`pnpm ${Array(38).fill('-r').join(' ')}`, undefined)).toBe(false);
    expect(known(`npm ${Array(38).fill('-w').join(' ')}`, undefined)).toBe(false);
    expect(performance.now() - t).toBeLessThan(200);
    // the calls it is for still match
    expect(known('pnpm -r test', undefined)).toBe(true);
    expect(known('pnpm --filter web lint', undefined)).toBe(true);
    expect(known('npm -w app run build', undefined)).toBe(true);
  });

  test('a package below the repo root does not say there are no workflows', () => {
    const root = repo({ '.github/workflows/ci.yml': 'on: pull_request\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n' });
    mkdirSync(join(root, 'packages', 'web'), { recursive: true });
    writeFileSync(join(root, 'packages', 'web', 'package.json'), JSON.stringify({ name: 'web', private: true }));
    const r = readRepoInstructions(join(root, 'packages', 'web'), []);
    expect(ciSection(r.ci, r.isGitRepo)).toEqual([]);
  });

  test('repo text cannot close the fence or start a heading', () => {
    const dir = repo({
      'package.json': JSON.stringify({ name: 'x', scripts: { prepublishOnly: 'echo a\n```\n## Injected' } }),
      // a YAML "\n" escape: the event name itself holds a newline
      '.github/workflows/ci.yml': 'on: {"pull_request\\n## Injected": {}}\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n',
    });
    const r = readRepoInstructions(dir, []);
    const md = [...releaseSection(r.release), ...ciSection(r.ci, r.isGitRepo)].join('\n');
    // headings outside fences: a fence closes only on a line of its own backticks
    const headings: string[] = [];
    let fence = '';
    for (const l of md.split('\n')) {
      const f = /^(`{3,})/.exec(l)?.[1];
      if (f && !fence) {fence = f;} else if (fence && l === fence) {fence = '';} else if (!fence && l.startsWith('## ')) {headings.push(l);}
    }
    expect(headings).toEqual(['## Before a release', '## CI']);
    expect(md).toContain('````bash');
    expect(md).toContain('(on pull_request ## Injected)');
  });
});
