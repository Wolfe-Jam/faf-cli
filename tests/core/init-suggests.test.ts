/**
 * BRAKE: faf init suggests, it doesn't populate.
 *
 * "AI cannot fill human slots. It can only suggest." The goal and the six W's
 * are the human's: init and auto leave them empty, and keep each README /
 * package.json find as a suggestion with its source. `faf go` shows them in
 * gray for the human to confirm. Detection (stack, commands, key files, type)
 * is unchanged.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { assembleFreshFaf, updateExistingFaf } from '../../src/detect/assemble.js';
import { suggestIntent, INTENT_PATHS } from '../../src/core/suggest.js';
import { getNestedValue } from '../../src/core/dot-path.js';
import { readFafRaw } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');

const README = `# widget-kit

Widget Kit turns plain YAML into accessible web widgets for small teams.

## Who is this for

Front-end developers on small product teams who need widgets fast.

## Why

Hand-built widgets drift from the design system and fail accessibility checks.

## Status

Early. Working, spec-conformant, not yet published to npm.

## How it works

A compiler reads the YAML and emits typed web components with ARIA built in.
`;

const PKG = {
  name: 'widget-kit',
  version: '0.1.0',
  description: 'Accessible web widgets from plain YAML',
  repository: 'https://github.com/example/widget-kit',
  scripts: { build: 'tsc', test: 'bun test', start: 'node dist/index.js' },
  devDependencies: { typescript: '^5.0.0' },
};

function makeRepo(withReadme: boolean): string {
  const dir = join(tmpdir(), `faf-suggest-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify(PKG, null, 2));
  writeFileSync(join(dir, 'tsconfig.json'), '{ "compilerOptions": { "strict": true } }');
  writeFileSync(join(dir, 'src/index.ts'), 'export const x = 1;\n');
  if (withReadme) {writeFileSync(join(dir, 'README.md'), README);}
  return dir;
}

function intentValues(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of INTENT_PATHS) {out[p] = getNestedValue(data, p) ?? '';}
  return out;
}

const EMPTY_INTENT = Object.fromEntries(INTENT_PATHS.map(p => [p, '']));

describe('BRAKE: init and auto never write the goal or the six W\'s', () => {
  let dir: string;
  beforeEach(() => { dir = makeRepo(true); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('INTENT_PATHS is the goal + the six W\'s', () => {
    expect([...INTENT_PATHS]).toEqual([
      'project.goal',
      'human_context.who', 'human_context.what', 'human_context.why',
      'human_context.where', 'human_context.when', 'human_context.how',
    ]);
  });

  test('assembleFreshFaf leaves every intent slot empty', () => {
    const data = assembleFreshFaf(dir);
    expect(intentValues(data)).toEqual(EMPTY_INTENT);
  });

  test('updateExistingFaf fills no empty intent slot', () => {
    const existing = { faf_version: '2.5.0', project: { name: 'widget-kit', goal: '' }, human_context: { who: '' } };
    const data = updateExistingFaf(dir, existing);
    expect(intentValues(data)).toEqual(EMPTY_INTENT);
  });

  test('updateExistingFaf keeps the human\'s own words', () => {
    const existing = { faf_version: '2.5.0', project: { name: 'widget-kit', goal: 'My own goal, typed by me' }, human_context: { why: 'Because I said so, in my words' } };
    const data = updateExistingFaf(dir, existing);
    expect(getNestedValue(data, 'project.goal')).toBe('My own goal, typed by me');
    expect(getNestedValue(data, 'human_context.why')).toBe('Because I said so, in my words');
    expect(getNestedValue(data, 'human_context.when') ?? '').toBe('');
  });

  test('faf init writes an empty goal and empty six W\'s to project.faf', async () => {
    const proc = Bun.spawn([process.execPath, CLI, 'init'], { cwd: dir, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NO_COLOR: '1' } });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    const raw = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(raw).not.toContain('Early. Working');
    expect(raw).not.toContain('Front-end developers');
    expect(raw).not.toContain('Accessible web widgets from plain YAML');
    expect(raw).not.toContain('Widget Kit turns plain YAML');
    // init says suggestions are waiting, and where to confirm them
    expect(out).toMatch(/suggest/i);
    expect(out).toContain('faf go');
  });
});

describe('ENGINE: suggestions carry their source', () => {
  let dir: string;
  beforeEach(() => { dir = makeRepo(true); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('README sections and package.json become sourced suggestions', () => {
    const s = suggestIntent(dir);
    // package.json description leads for the goal, as it did when init filled it
    expect(s['project.goal']?.value).toBe('Accessible web widgets from plain YAML');
    expect(s['project.goal']?.source).toBe('package.json description');
    expect(s['human_context.who']?.value).toContain('Front-end developers');
    expect(s['human_context.who']?.source).toBe('README.md § Who is this for');
    expect(s['human_context.why']?.source).toBe('README.md § Why');
    expect(s['human_context.when']?.value).toContain('Early. Working');
    expect(s['human_context.when']?.source).toBe('README.md § Status');
    expect(s['human_context.how']?.source).toBe('README.md § How it works');
    expect(s['human_context.what']?.value).toBe('Accessible web widgets from plain YAML');
    expect(s['human_context.what']?.source).toBe('package.json description');
  });

  test('with no package.json description, the README first paragraph suggests the goal', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ ...PKG, description: undefined }));
    const s = suggestIntent(dir);
    expect(s['project.goal']?.value).toContain('Widget Kit turns plain YAML');
    expect(s['project.goal']?.source).toBe('README.md § first paragraph');
  });

  test('no README and no description: no suggestions, nothing invented', () => {
    const bare = join(tmpdir(), `faf-suggest-bare-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(bare, { recursive: true });
    writeFileSync(join(bare, 'package.json'), JSON.stringify({ name: 'bare', version: '1.0.0' }));
    try {
      expect(suggestIntent(bare)).toEqual({});
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });

  test('every suggestion names a source — sourced or nothing', () => {
    for (const [path, v] of Object.entries(suggestIntent(dir))) {
      expect(INTENT_PATHS as readonly string[]).toContain(path);
      expect(v!.value.trim().length).toBeGreaterThan(0);
      expect(v!.source.trim().length).toBeGreaterThan(0);
    }
  });

  test('a slot the human filled gets no suggestion when the .faf is passed', () => {
    const s = suggestIntent(dir, { project: { goal: 'Mine' }, human_context: { who: 'Me' } });
    expect(s['project.goal']).toBeUndefined();
    expect(s['human_context.who']).toBeUndefined();
    expect(s['human_context.when']).toBeDefined();
  });
});

describe('BRAKE: the score counts only what is in project.faf', () => {
  test('a README full of intent does not move the init score', () => {
    const a = makeRepo(true);
    const b = makeRepo(false);
    try {
      const withReadme = assembleFreshFaf(a);
      const without = assembleFreshFaf(b);
      expect(intentValues(withReadme)).toEqual(intentValues(without));
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });

  test('faf init scores the same with or without the README', async () => {
    const a = makeRepo(true);
    const b = makeRepo(false);
    try {
      for (const d of [a, b]) {
        const p = Bun.spawn([process.execPath, CLI, 'init'], { cwd: d, stdout: 'pipe', stderr: 'pipe' });
        await p.exited;
      }
      const scoreA = kernel.score(readFafRaw(join(a, 'project.faf'))).score;
      const scoreB = kernel.score(readFafRaw(join(b, 'project.faf'))).score;
      expect(scoreA).toBe(scoreB);
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});

describe('BRAKE: detection slots are unchanged', () => {
  test('stack, commands, key files and type still come from the repo', () => {
    const dir = makeRepo(true);
    try {
      const data = assembleFreshFaf(dir) as Record<string, any>;
      expect(data.project.name).toBe('widget-kit');
      expect(data.project.main_language).toBe('TypeScript');
      expect(data.project.type).toBeTruthy();
      expect(data.commands?.build).toBeTruthy();
      expect(data.commands?.test).toBeTruthy();
      expect(Array.isArray(data.key_files)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
