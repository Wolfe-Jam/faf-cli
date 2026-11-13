/**
 * BRAKE: the independent review of #229. README-first must not move a notice
 * into the goal; emphasis stripping must not touch code, globs or maths; each
 * text is offered once; a heading line is never a suggestion.
 */
import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { suggestIntent, asProse } from '../../src/core/suggest.js';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) {rmSync(d, { recursive: true, force: true });} });

function repo(readme: string | null, pkg?: object): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-229-'));
  dirs.push(d);
  if (readme !== null) {writeFileSync(join(d, 'README.md'), readme);}
  if (pkg) {writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));}
  return d;
}

describe('BRAKE D1: emphasis stripping leaves code, globs and maths alone', () => {
  test.each([
    'Computes a*b*c fast',
    '2*x*y is a term',
    'Matches **/*.ts globs',
    'glob src/*.js and lib/*.js',
    'x**2 + y**2',
    'Takes *args, **kwargs in Python',
    '5 * 3 * 2 is thirty',
  ])('unchanged: %s', (t) => {
    expect(asProse(t)).toBe(t);
  });

  test('a code span keeps its stars, and loses only its backticks', () => {
    expect(asProse('Expands `src/**/*.ts` patterns')).toBe('Expands src/**/*.ts patterns');
    expect(asProse('The `*` operator, made *fast*')).toBe('The * operator, made fast');
  });

  test('emphasis still goes: inside a word, nested, bold', () => {
    expect(asProse('Serde is for *ser*ializing and **bold**ly data')).toBe('Serde is for serializing and boldly data');
    expect(asProse('**Serde is a framework for *ser*ializing data.**')).toBe('Serde is a framework for serializing data.');
  });
});

describe('BRAKE D2: a notice is never the goal (or what), so the description keeps the goal', () => {
  test.each([
    'This project is no longer maintained.',
    'This project is deprecated, use bar instead.',
    'Sponsored by Acme Corp and Globex.',
    "We're hiring engineers in Berlin.",
    'Documentation is available at docs.foo.dev.',
    'Looking for v1? See the v1 branch.',
    'Moved to github.com/acme/foo.',
    'Requires Node.js 18 or later.',
    'Status: beta.',
    'This repo is a mirror of the upstream project.',
    'Show your love for foo -- T-shirts, mugs and stickers.',
    '👩🏻‍💻 Developer Ready: a comprehensive solution that works out of the box.',
  ])('%s', (notice) => {
    const s = suggestIntent(repo(`# foo\n\n${notice}\n`, { description: 'Fast HTTP client for Node.js' }));
    expect(s['project.goal']).toEqual({ value: 'Fast HTTP client for Node.js', source: 'package.json description' });
    expect(s['human_context.what']).toBeUndefined();
  });

  test('a real tagline still leads', () => {
    const s = suggestIntent(repo('# foo\n\nFoo is a fast HTTP client for Node.js and browsers.\n', { description: 'HTTP client' }));
    expect(s['project.goal']?.source).toBe('README.md § first paragraph');
  });

  test('"no longer maintained" in ## Status is still a when', () => {
    const s = suggestIntent(repo('# foo\n\nFoo is a fast HTTP client for Node.js.\n\n## Status\n\nNo longer maintained since March 2024.\n'));
    expect(s['human_context.when']?.value).toBe('No longer maintained since March 2024.');
  });
});

describe('BRAKE: one text, one slot, and only prose', () => {
  test('typer: what that opens with the goal sentence is the same text', () => {
    const s = suggestIntent(repo('# typer\n\nTyper, build great CLIs. Easy to code. Based on Python type hints.\n\n## What\n\nTyper, build great CLIs. Easy to code, based on Python type hints, with completion.\n'));
    expect(s['project.goal']?.value).toBe('Typer, build great CLIs. Easy to code. Based on Python type hints.');
    expect(s['human_context.what']).toBeUndefined();
  });

  test('typer, reversed: a what that opens with the goal sentence is the same text', () => {
    const s = suggestIntent(repo('# typer\n\n## Goal\n\nTyper, build great CLIs.\n\n## What\n\nTyper, build great CLIs. Easy to code. Based on Python type hints.\n'));
    expect(s['project.goal']?.value).toBe('Typer, build great CLIs.');
    expect(s['human_context.what']).toBeUndefined();
  });

  test('jest: a bold emoji-led feature label is a notice, not the goal', () => {
    const s = suggestIntent(repo('# jest\n\n**👩🏻‍💻 Developer Ready**: A comprehensive JavaScript testing solution.\n', { description: 'Delightful JavaScript Testing.' }));
    expect(s['project.goal']?.value).toBe('Delightful JavaScript Testing.');
    expect(asProse('**👩🏻‍💻 Developer Ready**: works')).toBe('👩🏻‍💻 Developer Ready: works');
  });

  test('a longer text that extends a short one is still offered', () => {
    const s = suggestIntent(repo('# l\n\n## What\n\nLog parser that streams alerts to Slack from edge workers.\n', { description: 'Log parser' }));
    expect(s['human_context.what']?.value).toBe('Log parser that streams alerts to Slack from edge workers.');
  });

  test('yargs: a sub-heading inside a section is not its body', () => {
    const s = suggestIntent(repo('# y\n\nY parses arguments for command-line tools.\n\n## Deployment\n### TypeScript\n\nTypes ship with the package.\n'));
    expect(s['human_context.where']?.value ?? '').not.toMatch(/^#/);
  });

  test('viper: a why that says what the project is, is misplaced', () => {
    const s = suggestIntent(repo('# viper\n\nGo configuration with fangs.\n\n## Why Viper?\n\nViper is a complete configuration solution for Go applications.\n'));
    expect(s['human_context.why']).toBeUndefined();
  });

  test('trpc: lines joined without a space are a fragment', () => {
    const s = suggestIntent(repo('# t\n\ntRPC Move fast and break nothing.End-to-end typesafe APIs made easy.\n'));
    expect(s['project.goal']).toBeUndefined();
  });

  test.each(['date-fns monorepo root', 'The monorepo for acme tools'])('a monorepo description: %s', (d) => {
    expect(suggestIntent(repo(null, { description: d }))['project.goal']).toBeUndefined();
  });
});

describe('BRAKE: label-and-link rows are not prose (grok-faf-mcp, found at the 8.10.0 gate)', () => {
  test('**Home:** [link] / **Live demo:** [link] under the title is not the goal', () => {
    const s = suggestIntent(repo('# grok-faf-mcp\n\n**Home:** [faf.one/grok](https://faf.one/grok)\n**Live demo:** [grok.faf.one](https://grok.faf.one)\n\nPersistent project context for xAI Grok, as an MCP server on a URL.\n'));
    expect(s['project.goal']?.value).toBe('Persistent project context for xAI Grok, as an MCP server on a URL.');
  });

  test('two bold labels in one text are a label row', () => {
    const s = suggestIntent(repo('# g\n\n**Docs:** see the site **Chat:** join us on Discord today\n', { description: 'A widget parser for small teams' }));
    expect(s['project.goal']?.value).toBe('A widget parser for small teams');
  });

  test('a bold lead-in label on a real sentence is still prose', () => {
    const s = suggestIntent(repo('# z\n\n**Zed:** a parser for widget specs in small teams.\n'));
    expect(s['project.goal']?.value).toBe('Zed: a parser for widget specs in small teams.');
  });
});

describe('BRAKE: label rows with several links, any emphasis, and callouts (late check of #232)', () => {
  const PROSE = 'A tiny parser for widget config files.';
  test.each([
    '**Docs:** [a](https://a.io) · [b](https://b.io)',
    '**Links:** [Docs](https://a.io) | [Discord](https://b.io)',
    'Links: [Docs](https://a.io) • [Blog](https://b.io)',
    '*Home:* [faf.one](https://faf.one)',
    '__Home:__ [faf.one](https://faf.one)',
    '_Home:_ [faf.one](https://faf.one)',
  ])('%s under the title is navigation, not the goal', (row) => {
    const s = suggestIntent(repo(`# demo\n\n${row}\n\n${PROSE}\n`));
    expect(s['project.goal']?.value).toBe(PROSE);
  });

  test.each([
    '**Warning:** this breaks on Windows.',
    '**Important:** read the migration guide before you upgrade.',
    '> **Note:** the API changes in the next major release.',
    'Caution: this package rewrites your config files.',
  ])('a callout (%s) is never the goal', (callout) => {
    const s = suggestIntent(repo(`# demo\n\n${callout}\n`, { description: 'A widget parser for small teams' }));
    expect(s['project.goal']?.value).toBe('A widget parser for small teams');
  });

  test('a lead-in label on a real sentence is still prose', () => {
    const s = suggestIntent(repo('# z\n\n*Zed:* a parser for widget specs in small teams.\n'));
    expect(s['project.goal']?.value).toBe('Zed: a parser for widget specs in small teams.');
  });
});

describe('BRAKE: review of #233 — stray markers, emoji labels, underscores, bracket notes', () => {
  const PROSE = 'A tiny parser for widget config files.';
  test.each([
    ['half-bold label', 'Home:** [faf.one](https://faf.one)'],
    ['emoji before a bold label', '🏠 **Home:** [faf.one](https://faf.one)'],
    ['emoji before a plain label', '📖 Docs: https://docs.example.com'],
    ['underscore in a label', 'my_pkg: [docs](https://a.io) · [src](https://b.io)'],
    ['a short bracket note after the link', '**Home:** [faf.one](https://faf.one) (mirror)'],
  ])('%s is navigation, not the goal', (_name, row) => {
    const s = suggestIntent(repo(`# demo\n\n${row}\n\n${PROSE}\n`));
    expect(s['project.goal']?.value).toBe(PROSE);
  });

  test('a suggestion that still carries ** after cleaning is never offered', () => {
    const s = suggestIntent(repo('# demo\n\n*Home:** a parser for widget specs in small teams.\n', { description: 'A widget parser for small teams' }));
    expect(s['project.goal']?.value).toBe('A widget parser for small teams');
  });

  test('a dunder inside a code span is not a stray marker', () => {
    const s = suggestIntent(repo('# demo\n\nA parser that reads `__init__.py` files for small teams.\n'));
    expect(s['project.goal']?.value).toContain('__init__.py');
  });
});
