/**
 * BRAKE: only a Target is ever suggested (reviews of v8.9.0..#227, goose +
 * Claude). Every slot has three outcomes: Target (the validated fact for that
 * slot), Slop (waffle, nonsense, junk) and Misplaced (good info, wrong slot).
 * Suggestions must be Target: one gate on every source, headings matched
 * whole, the first paragraph only from before the first section, never the
 * same text for two slots, sources named one way.
 */
import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { suggestIntent, type IntentSuggestions } from '../../src/core/suggest.js';
import { seedSixWsFromGoal, questionForSlot, helpForSlot } from '../../src/core/interview.js';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) {rmSync(d, { recursive: true, force: true });} });

function repo(readme: string | null, pkg?: object): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-target-'));
  dirs.push(d);
  if (readme !== null) {writeFileSync(join(d, 'README.md'), readme);}
  if (pkg) {writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));}
  return d;
}
const values = (s: IntentSuggestions): string[] => Object.values(s).map(v => v!.value);
const TAG = '# X\n\nX turns plain YAML into accessible web widgets for small teams.\n\n';

describe('BRAKE: slop never passes, whatever the source', () => {
  test('TODO / coming soon section bodies', () => {
    const s = suggestIntent(repo(`${TAG}## Why\n\nTODO: write this section properly later on.\n\n## Status\n\nComing soon, we will fill this in later.\n`));
    expect(s['human_context.why']).toBeUndefined();
    expect(s['human_context.when']).toBeUndefined();
  });

  test('over-long text is rejected, never cut', () => {
    const s = suggestIntent(repo(`${TAG}## Why\n\n${'Integrations drift quietly. '.repeat(25)}\n`));
    expect(s['human_context.why']).toBeUndefined();
    for (const v of values(s)) {expect(v.length).toBeLessThanOrEqual(280);}
  });

  test('an HTML banner first is never the goal', () => {
    const s = suggestIntent(repo('# X\n\n<p align="center"><img src="logo.svg" width="200"></p>\n\nX turns plain YAML into accessible web widgets for small teams.\n'));
    for (const v of values(s)) {expect(v).not.toMatch(/<[a-z!/]/i);}
    expect(s['project.goal']?.value).toBe('X turns plain YAML into accessible web widgets for small teams.');
  });

  test('an HTML banner then the # title: the tagline after the title is the goal (flask)', () => {
    const s = suggestIntent(repo('<div align="center"><img src="flask-name.svg" alt="" height="150"></div>\n\n# Flask\n\nFlask is a lightweight WSGI web application framework.\n'));
    expect(s['project.goal']?.value).toBe('Flask is a lightweight WSGI web application framework.');
  });

  test('a link row first is never the goal', () => {
    const s = suggestIntent(repo('# X\n\n[**Docs**](https://x.dev) | [**Playground**](https://x.dev/play)\n\nX turns plain YAML into accessible web widgets for small teams.\n'));
    for (const v of values(s)) {expect(v).not.toContain('](');}
  });

  test('a setext title is never the goal', () => {
    const s = suggestIntent(repo('ripgrep (rg)\n------------\n\nripgrep is a line-oriented search tool that recursively searches the current directory.\n'));
    for (const v of values(s)) {
      expect(v).not.toBe('ripgrep (rg)');
      expect(v).not.toContain('-----');
    }
  });

  test('a code block or a bullet list is never a suggestion', () => {
    const s = suggestIntent(repo('# X\n\n```bash\nnpm install cb --save-dev && cb init\n```\n\n- Instant server start\n- Lightning fast reload\n- Rich features\n'));
    for (const v of values(s)) {
      expect(v).not.toContain('npm install');
      expect(v).not.toMatch(/^[-*] /);
    }
  });

  test('a list intro ending in ":" is never a suggestion', () => {
    const s = suggestIntent(repo('# X\n\nThis repository contains starter templates for the following courses:\n\n- one\n- two\n'));
    for (const v of values(s)) {expect(v).not.toMatch(/:$/);}
  });

  test('a TODO package.json description is never a suggestion', () => {
    const s = suggestIntent(repo(null, { name: 'x', description: 'TODO' }));
    expect(values(s)).not.toContain('TODO');
  });
});

describe('ENGINE: an over-long first paragraph gives its first sentence — whole, never cut', () => {
  const LONG = (first: string): string => `${first} ${'It also does many other things that matter to its users in practice. '.repeat(5)}`;

  test('ripgrep: setext title, long paragraph → the first sentence is the goal', () => {
    const s = suggestIntent(repo(`ripgrep (rg)\n------------\n\n${LONG('ripgrep is a line-oriented search tool that recursively searches the current directory for a regex pattern.')}\n`));
    expect(s['project.goal']?.value).toBe('ripgrep is a line-oriented search tool that recursively searches the current directory for a regex pattern.');
    expect(s['project.goal']?.source).toBe('README.md § first sentence');
  });

  test('flask: banner, # title, long paragraph with [refs] → the first sentence, as prose', () => {
    const s = suggestIntent(repo(`<div align="center"><img src="flask-name.svg" alt=""></div>\n\n# Flask\n\n${LONG('Flask is a lightweight [WSGI] web application framework.')}\n`));
    expect(s['project.goal']?.value).toBe('Flask is a lightweight WSGI web application framework.');
  });

  test('yq: badges, long paragraph with inline code and links → the first sentence', () => {
    const s = suggestIntent(repo(`# yq\n\n![Build](https://x/badge.svg) ![Pulls](https://x/pulls.svg)\n\n${LONG('A lightweight and portable command-line YAML, JSON, INI and XML processor.')}\n`));
    expect(s['project.goal']?.value).toBe('A lightweight and portable command-line YAML, JSON, INI and XML processor.');
  });

  test('a next sentence starting lowercase (a tool name) still ends the first one; no near-copy for `what`', () => {
    const s = suggestIntent(repo(`# yq\n\n${LONG('A lightweight and portable command-line YAML, JSON, INI and XML processor. `yq` uses jq like syntax but works with YAML files.')}\n`));
    expect(s['project.goal']?.value).toBe('A lightweight and portable command-line YAML, JSON, INI and XML processor.');
    for (const v of values(s).filter(v => v !== s['project.goal']?.value)) {
      expect(v).not.toContain('A lightweight and portable command-line YAML');
    }
  });

  test('a first sentence that is itself over 280 characters gives nothing', () => {
    const s = suggestIntent(repo(`# X\n\n${'word '.repeat(70)}ends here. Then more text follows on.\n`));
    expect(s['project.goal']).toBeUndefined();
  });

  test('a first sentence that is a list intro gives nothing', () => {
    const s = suggestIntent(repo(`# X\n\nThis repository holds the following things: ${'and more of them, listed. '.repeat(14)}\n`));
    for (const v of values(s)) {expect(v).not.toMatch(/:$/);}
  });

  test('a short first paragraph is kept whole (first sentence only when too long)', () => {
    const s = suggestIntent(repo('# X\n\nX scores context files. It runs anywhere Node runs.\n'));
    expect(s['project.goal']?.value).toBe('X scores context files. It runs anywhere Node runs.');
  });
});

describe('BRAKE: headings match whole — a heading that starts with the word is misplaced', () => {
  const misplaced: [string, string][] = [
    ['How to install', 'human_context.how'],
    ['How do I use this in Node.js?', 'human_context.how'],
    ['Status codes', 'human_context.when'],
    ['Release', 'human_context.when'],
    ['Roadmap', 'human_context.when'],
    ["What's new in v3", 'human_context.what'],
    ['About the author', 'human_context.what'],
    ['Where to get help', 'human_context.where'],
    ['Users guide', 'human_context.who'],
    ['Who is using Turborepo?', 'human_context.who'],
    ['Why not switch to a smaller package?', 'human_context.why'],
    ['Design tokens', 'human_context.how'],
  ];
  for (const [heading, slot] of misplaced) {
    test(`## ${heading} → no ${slot}`, () => {
      const s = suggestIntent(repo(`${TAG}## ${heading}\n\nSome real text that is long enough to count as a section body here.\n`));
      expect(s[slot as keyof IntentSuggestions]).toBeUndefined();
    });
  }

  const target: [string, string][] = [
    ['How it works', 'human_context.how'],
    ['Architecture', 'human_context.how'],
    ['Status', 'human_context.when'],
    ['Who is this for', 'human_context.who'],
    ['Who is this for?', 'human_context.who'],
    ['Why', 'human_context.why'],
    ['Deployment', 'human_context.where'],
  ];
  for (const [heading, slot] of target) {
    test(`## ${heading} → ${slot}`, () => {
      const s = suggestIntent(repo(`${TAG}## ${heading}\n\nSome real text that is long enough to count as a section body here.\n`));
      expect(s[slot as keyof IntentSuggestions]?.value).toBe('Some real text that is long enough to count as a section body here.');
    });
  }
});

describe('BRAKE: the first paragraph comes only from before the first section', () => {
  test('a short tagline never pulls a section body into `what`', () => {
    const s = suggestIntent(repo('# L\n\nL is a thing for teams.\n\n## Why\n\nBecause integrations drift and nobody notices until production.\n'));
    expect(s['human_context.what']?.value ?? '').not.toContain('integrations drift');
  });

  test('a README that opens with ## Usage gives no `what`', () => {
    const s = suggestIntent(repo('# X\n\n## Usage\n\nRun npm run dev to start the development server locally.\n'));
    expect(s['human_context.what']).toBeUndefined();
    expect(s['project.goal']).toBeUndefined();
  });
});

describe('BRAKE: never the same text for two slots', () => {
  test('one description, one slot', () => {
    const s = suggestIntent(repo(null, { name: 'x', description: 'Typed API clients from one schema file' }));
    expect(values(s).filter(v => v === 'Typed API clients from one schema file')).toHaveLength(1);
  });

  test('one README paragraph, one slot', () => {
    const s = suggestIntent(repo(TAG));
    const v = values(s);
    expect(new Set(v).size).toBe(v.length);
  });
});

describe('ENGINE: sources are named one way', () => {
  test('README.md § <heading>, package.json description, Cargo.toml description', () => {
    // ## Purpose is read only by Relentless, which names sources README:## Purpose.
    const s = suggestIntent(repo('# X\n\nShort.\n\n## Purpose\n\nGives assistants permanent project memory across sessions.\n\n## How it works\n\nA compiler reads the YAML and emits typed web components.\n'));
    expect(s['human_context.what']?.source).toBe('README.md § Purpose');
    for (const v of Object.values(s)) {
      expect(v!.source).toMatch(/^(README\.md § .+|package\.json description|Cargo\.toml description)$/);
    }
  });
});

describe('BRAKE: the goal seed makes no audience guess', () => {
  test('"for backend teams" in a goal suggests no `who`', () => {
    expect(seedSixWsFromGoal('A CLI that scores context files for backend teams shipping APIs').who).toBeUndefined();
  });
});

describe('ENGINE: how and when ask for the targeted fact', () => {
  test('the how question asks for one line, not 3-4 words', () => {
    expect(questionForSlot('human_context.how')).not.toMatch(/terse|3-4 words/);
  });

  test('the when help names no answers', () => {
    expect(helpForSlot('human_context.when')).not.toMatch(/alpha|beta|production/i);
  });

  test('no file still teaches the old how', () => {
    const root = join(import.meta.dir, '../..');
    expect(readFileSync(join(root, 'docs/ECOSYSTEM.md'), 'utf-8')).not.toMatch(/HOW\*\* is it built/);
    expect(readFileSync(join(root, 'skills/faf-expert/SKILL.md'), 'utf-8')).not.toContain('how: install/usage command');
    expect(readFileSync(join(root, 'src/commands/demo.ts'), 'utf-8')).not.toContain('how: Agile sprints');
  });
});
