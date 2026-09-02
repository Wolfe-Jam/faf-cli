/**
 * WJTTC — faf export --llms (project llms.txt).
 *
 * A view of authored 6Ws in llmstxt.org shape. Not a format. Opt-in door.
 *
 * BRAKE  — empty 6Ws omitted; stack/commands never dumped; none/N/A not written
 * ENGINE — H1 + goal blockquote; filled who/why present; homepage link
 * AERO   — deterministic; --llms alone does not dump AGENTS.md
 * TYRE   — live CLI: --llms writes; bare export and --all do not
 * PIT    — existing llms.txt hand text preserved (inject)
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { generateLlmsTxt, writeLlmsTxt } from '../../src/interop/llms.js';
import { FAF_START } from '../../src/interop/inject.js';
import type { FafData } from '../../src/core/types.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-llms-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const DATA: FafData = {
  project: {
    name: 'demo',
    goal: 'A small API',
    main_language: 'TypeScript',
    homepage: 'https://example.com',
  },
  stack: { backend: 'Express', build: 'npm' },
  commands: { test: 'npm test' },
  human_context: { who: 'API authors', why: 'Stop guessing the audience' },
};

describe('WJTTC BRAKE: llms.txt does not invent or dump HOW', () => {
  test('empty 6Ws are omitted — not none, not paraphrased', () => {
    const out = generateLlmsTxt({
      project: { name: 'blank', goal: 'Has a goal' },
      human_context: { who: '', why: 'slotignored', what: 'none', how: 'N/A' },
    });
    expect(out).toContain('# blank');
    expect(out).toContain('> Has a goal');
    expect(out).not.toMatch(/^## Who/m);
    expect(out).not.toMatch(/^## Why/m);
    expect(out).not.toMatch(/^## What/m);
    expect(out).not.toMatch(/^## How/m);
    expect(out.toLowerCase()).not.toContain('none');
    expect(out.toLowerCase()).not.toContain('n/a');
    expect(out).not.toContain('slotignored');
  });

  test('stack and commands never appear', () => {
    const out = generateLlmsTxt(DATA);
    expect(out).not.toContain('Express');
    expect(out).not.toContain('npm test');
    expect(out).not.toContain('stack');
    expect(out).not.toContain('TypeScript');
  });
});

describe('WJTTC ENGINE: llmstxt.org shape from authored facts', () => {
  test('H1, goal blockquote, filled Who/Why, homepage link', () => {
    const out = generateLlmsTxt(DATA);
    expect(out.startsWith('# demo\n')).toBe(true);
    expect(out).toContain('> A small API');
    expect(out).toContain('## Who');
    expect(out).toContain('API authors');
    expect(out).toContain('## Why');
    expect(out).toContain('Stop guessing the audience');
    expect(out).toContain('## Links');
    expect(out).toContain('- [Homepage](https://example.com)');
    expect(out).not.toMatch(/^## What/m);
  });

  test('name-only project still emits a valid H1', () => {
    const out = generateLlmsTxt({ project: { name: 'just-a-name' } });
    expect(out).toBe('# just-a-name\n');
  });
});

describe('WJTTC AERO: deterministic + --llms is not exportAll', () => {
  test('two calls are byte-identical', () => {
    expect(generateLlmsTxt(DATA)).toBe(generateLlmsTxt(DATA));
  });
});

describe('WJTTC PIT: existing llms.txt is enhanced, never replaced', () => {
  test('hand-written tail survives writeLlmsTxt', () => {
    const mark = '## HAND-WRITTEN — MUST SURVIVE';
    writeFileSync(join(dir, 'llms.txt'), `# Mine\n${mark}\nnotes\n`);
    writeLlmsTxt(dir, DATA);
    const out = readFileSync(join(dir, 'llms.txt'), 'utf-8');
    expect(out).toContain(mark);
    expect(out).toContain('# demo');
    expect(out.split(FAF_START).length - 1).toBe(1);
  });
});

describe('WJTTC TYRE: live CLI — opt-in guard', () => {
  const cli = join(__dirname, '../../src/cli.ts');
  const run = (cmd: string) =>
    execSync(`bun ${cli} ${cmd}`, { cwd: dir, encoding: 'utf-8', timeout: 30000 });

  beforeEach(() => {
    writeFileSync(
      join(dir, 'project.faf'),
      [
        'faf_version: "3.3"',
        'project:',
        '  name: wjttc-llms',
        '  goal: live llms.txt grip',
        '  homepage: https://faf.one',
        'human_context:',
        '  who: maintainers',
        'stack:',
        '  backend: Rust',
        '',
      ].join('\n'),
    );
  });

  test('`faf export --llms` writes llms.txt end-to-end', () => {
    run('export --llms');
    const out = readFileSync(join(dir, 'llms.txt'), 'utf-8');
    expect(out).toContain('# wjttc-llms');
    expect(out).toContain('> live llms.txt grip');
    expect(out).toContain('## Who');
    expect(out).toContain('maintainers');
    expect(out).toContain('[Homepage](https://faf.one)');
    expect(out).not.toContain('Rust');
  });

  test('bare `faf export` does NOT write llms.txt', () => {
    run('export');
    expect(existsSync(join(dir, 'llms.txt'))).toBe(false);
  });

  test('`faf export --all` does NOT write llms.txt', () => {
    run('export --all');
    expect(existsSync(join(dir, 'llms.txt'))).toBe(false);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);
  });

  test('`faf export --llms` does NOT dump AGENTS.md', () => {
    run('export --llms');
    expect(existsSync(join(dir, 'llms.txt'))).toBe(true);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
  });
});
