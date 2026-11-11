/**
 * BRAKE: 8.10 decisions (James, 2026-11-11).
 * - The goal is the project in its own words: the README leads, the
 *   package.json description follows (it often describes the repo, not the
 *   project: "monorepo for svelte.dev").
 * - `faf conductor import` never writes the goal: AI suggests, the human fills.
 * - `when` is the stage it is at, AND since when (not a version, not usage).
 */
import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';
import { suggestIntent } from '../../src/core/suggest.js';
import { helpForSlot, questionForSlot } from '../../src/core/interview.js';
import { SLOTS } from '../../src/core/slots.js';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) {rmSync(d, { recursive: true, force: true });} });

function repo(readme: string | null, pkg?: object): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-810-'));
  dirs.push(d);
  if (readme !== null) {writeFileSync(join(d, 'README.md'), readme);}
  if (pkg) {writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));}
  return d;
}

describe('BRAKE: the README leads the goal', () => {
  test('README tagline is the goal; the description is offered for what', () => {
    const s = suggestIntent(repo('# notes\n\nTurn a folder of markdown notes into a fast static site in one command.\n', { description: 'Static site generator for markdown notes' }));
    expect(s['project.goal']).toEqual({ value: 'Turn a folder of markdown notes into a fast static site in one command.', source: 'README.md § first paragraph' });
    expect(s['human_context.what']).toEqual({ value: 'Static site generator for markdown notes', source: 'package.json description' });
  });

  test('svelte.dev shape: the README says what the project is', () => {
    const s = suggestIntent(repo('# svelte.dev\n\nThe official Svelte website, with its tutorial, docs and playground.\n', { description: 'monorepo for svelte.dev' }));
    expect(s['project.goal']?.value).toBe('The official Svelte website, with its tutorial, docs and playground.');
    expect(s['project.goal']?.source).toBe('README.md § first paragraph');
  });

  test('no usable README tagline: the description is the goal', () => {
    const s = suggestIntent(repo('# x\n\n## Install\n\nnpm i x\n', { description: 'Tiny and elegant HTTP client based on the Fetch API' }));
    expect(s['project.goal']).toEqual({ value: 'Tiny and elegant HTTP client based on the Fetch API', source: 'package.json description' });
  });

  test('the same text in both is offered once, as the README goal', () => {
    const s = suggestIntent(repo('# e\n\nFast, unopinionated, minimalist web framework for Node.js.\n', { description: 'Fast, unopinionated, minimalist web framework' }));
    expect(s['project.goal']?.source).toBe('README.md § first paragraph');
    expect(s['human_context.what']).toBeUndefined();
  });
});

describe('BRAKE: conductor import never writes the goal', () => {
  test('a config description is not written to project.goal', () => {
    const d = mkdtempSync(join(tmpdir(), 'faf-810-cond-'));
    dirs.push(d);
    const cwd = process.cwd();
    process.chdir(d);
    try {
      writeFileSync(join(d, 'conductor.json'), JSON.stringify({ name: 'app', description: 'My conductor project', language: 'Python' }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { conductorCommand } = require('../../src/commands/conductor.js');
      conductorCommand('import', join(d, 'conductor.json'));
      const faf = parse(readFileSync(join(d, 'project.faf'), 'utf-8'));
      expect(faf.project.name).toBe('app');
      expect(faf.project.main_language).toBe('Python');
      expect(faf.project.goal ?? '').toBe('');
    } finally {
      process.chdir(cwd);
    }
  });
});

describe('ENGINE: when is the stage it is at, and since when', () => {
  test('help says "and", never "or"', () => {
    expect(helpForSlot('human_context.when')).toBe('the stage it is at, and since when');
  });

  test('question asks for the stage and since when', () => {
    expect(questionForSlot('human_context.when')).toMatch(/stage.*since when/i);
    expect(questionForSlot('human_context.when')).not.toMatch(/timeline/i);
  });

  test('slot description', () => {
    expect(SLOTS.find(s => s.path === 'human_context.when')?.description).toBe('The stage it is at, and since when');
  });
});

describe('TYRE: faf git says where the goal and six W\'s get filled', () => {
  test('with suggestions: how many, and where to confirm them', async () => {
    const { gitIntentNote } = await import('../../src/commands/git.js');
    expect(gitIntentNote(3)).toBe("The goal and six W's are empty: 3 suggestions wait in the repo. Run 'faf go' in a clone to confirm them.");
    expect(gitIntentNote(1)).toBe("The goal and six W's are empty: 1 suggestion waits in the repo. Run 'faf go' in a clone to confirm it.");
  });

  test('with none: the slots are still the owner\'s to fill', async () => {
    const { gitIntentNote } = await import('../../src/commands/git.js');
    expect(gitIntentNote(0)).toBe("The goal and six W's are empty: fill them with 'faf go' in a clone.");
  });
});
