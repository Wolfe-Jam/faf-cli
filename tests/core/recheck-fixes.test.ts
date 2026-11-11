/**
 * BRAKE: the #227 rechecks (goose + Claude, 2026-11-10). Each defect they
 * found in the new code put wrong text in front of the human — text the repo
 * never said (asProse, firstSentence), the wrong line (preamble), or nothing
 * where a Target was (containment, headings). Only a Target is suggested.
 */
import { describe, test, expect, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { suggestIntent, sourceName } from '../../src/core/suggest.js';
import { firstSentence, isValidExtraction } from '../../src/interrogate/types.js';
import { relentlessContextDetailed } from '../../src/detect/relentless.js';
import { displayWidth } from '../../src/ui/text-width.js';
import { rowsFor } from '../../src/commands/go.js';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) {rmSync(d, { recursive: true, force: true });} });

function repo(readme: string | null, pkg?: object): string {
  const d = mkdtempSync(join(tmpdir(), 'faf-recheck-'));
  dirs.push(d);
  if (readme !== null) {writeFileSync(join(d, 'README.md'), readme);}
  if (pkg) {writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));}
  return d;
}
const goalOf = (description: string): string | undefined =>
  suggestIntent(repo(null, { description }))['project.goal']?.value;

describe('BRAKE 3e: asProse keeps real text — only markdown links and emphasis go', () => {
  test.each([
    'Access matrix[0][1] cells and arr[i] values for Foo[T] types',
    'Config in __init__.py and settings[key] files is hard to audit',
    'A [WIP] parser for snake_case_names and a_b_c widget specs',
  ])('unchanged: %s', (d) => {
    expect(goalOf(d)).toBe(d);
  });

  test('emphasis markers go, the words stay', () => {
    expect(goalOf('A **fast** and __small__ parser for _plain_ YAML files')).toBe('A fast and small parser for plain YAML files');
  });

  test('an inline link and a [text][ref] link become their words', () => {
    expect(goalOf('A tiny client built on [Fetch](https://x.dev/fetch) and [Undici][u] for teams')).toBe('A tiny client built on Fetch and Undici for teams');
  });

  test('a bare [ref] is unwrapped only when the README defines it', () => {
    const s = suggestIntent(repo('# Flask\n\nFlask is a lightweight [WSGI] web application framework.\n\n[WSGI]: https://wsgi.readthedocs.io/\n'));
    expect(s['project.goal']?.value).toBe('Flask is a lightweight WSGI web application framework.');
  });

  test('HTML entities read as their characters', () => {
    expect(goalOf('Fast &amp; small HTTP client for edge workers')).toBe('Fast & small HTTP client for edge workers');
  });

  test('invalid numeric entities do not throw and stay literal', () => {
    const d = repo('A fast search tool &#1114112; for large codebases.\n');
    expect(() => suggestIntent(d)).not.toThrow();
    const g = suggestIntent(d)['project.goal']?.value ?? '';
    expect(g).toContain('&#1114112;');
    expect(g).not.toMatch(/[\uD800-\uDFFF]/);
  });

  test('lone-surrogate code points are not decoded into suggestions', () => {
    const d = repo('Surrogate &#55296; test\n');
    const g = suggestIntent(d)['project.goal']?.value ?? '';
    expect(g).toContain('&#55296;');
    expect(g).not.toMatch(/[\uD800-\uDFFF]/);
  });

  test('Vec<u8> and Result<T> are type names, not HTML', () => {
    expect(goalOf('Fast Vec<u8> buffers for network code in Rust')).toBe('Fast Vec<u8> buffers for network code in Rust');
    expect(goalOf('Generic Result<T> types for TypeScript projects')).toBe('Generic Result<T> types for TypeScript projects');
  });
});

describe('BRAKE 3a: firstSentence never ends inside a sentence, and is never a question', () => {
  const MORE = ' More text follows here.';
  test.each([
    ['Tools for data work, e.g. parsing CSV and JSON quickly.', 'Tools for data work, e.g. parsing CSV and JSON quickly.'],
    ['A parser, i.e. a thing that reads input.', 'A parser, i.e. a thing that reads input.'],
    ['Built in the U.S. by a small team of people.', 'Built in the U.S. by a small team of people.'],
    ['Supports YAML, TOML, etc. and many more formats.', 'Supports YAML, TOML, etc. and many more formats.'],
    ['Dr. Smith wrote this library for teams.', 'Dr. Smith wrote this library for teams.'],
    ['Ends with ellipsis... and continues here.', 'Ends with ellipsis... and continues here.'],
    ['Compares fast vs. slow paths in widgets.', 'Compares fast vs. slow paths in widgets.'],
    ['v1.2 is out now for everyone.', 'v1.2 is out now for everyone.'],
    ['Node.js is a runtime for JavaScript apps.', 'Node.js is a runtime for JavaScript apps.'],
    ['It is 3.5x faster than the old one.', 'It is 3.5x faster than the old one.'],
    ['See https://a.b.c/d for the docs today.', 'See https://a.b.c/d for the docs today.'],
  ])('%s', (first, want) => {
    expect(firstSentence(first + MORE)).toBe(want);
  });

  test('a question is not a fact', () => {
    expect(firstSentence('What is this? A tool for parsing logs.')).toBeNull();
  });

  test('an over-long first paragraph opening with an abbreviation gives the whole sentence', () => {
    const long = `Built in the U.S. by a small team of widget people. ${'It also does many other things that matter to users. '.repeat(6)}`;
    const s = suggestIntent(repo(`# W\n\n${long}\n`));
    expect(s['project.goal']?.value).toBe('Built in the U.S. by a small team of widget people.');
  });
});

describe('BRAKE 3c: one text, one slot means the same text, not a shared phrase', () => {
  test('a short description does not block longer, different Targets', () => {
    const s = suggestIntent(repo('# L\n\n## What\n\nA log parser for edge workers that streams alerts to Slack.\n\n## Why\n\nTeams need a log parser that does not drop lines under load.\n', { description: 'Log parser' }));
    expect(s['project.goal']?.value).toBe('Log parser');
    expect(s['human_context.what']?.value).toBe('A log parser for edge workers that streams alerts to Slack.');
    expect(s['human_context.why']?.value).toBe('Teams need a log parser that does not drop lines under load.');
  });

  test('the same text, give or take a full stop, is offered once', () => {
    const s = suggestIntent(repo('# Y\n\nFast YAML parser for widget teams.\n', { description: 'Fast YAML parser for widget teams' }));
    expect(s['project.goal']?.value).toBe('Fast YAML parser for widget teams');
    expect(s['human_context.what']).toBeUndefined();
  });

  test('commander: the same words, one changed, are the same text', () => {
    const s = suggestIntent(repo('# commander\n\nThe complete solution for node.js command-line interfaces.\n', { description: 'the complete solution for node.js command-line programs' }));
    expect(s['project.goal']?.value).toBe('the complete solution for node.js command-line programs');
    expect(s['human_context.what']).toBeUndefined();
  });

  test('when the description takes the goal, the README tagline is offered for what', () => {
    const s = suggestIntent(repo('# notes\n\nTurn a folder of markdown notes into a fast static site in one command.\n', { description: 'Static site generator for markdown notes' }));
    expect(s['project.goal']?.value).toBe('Static site generator for markdown notes');
    expect(s['human_context.what']).toEqual({ value: 'Turn a folder of markdown notes into a fast static site in one command.', source: 'README.md § first paragraph' });
  });
});

describe('BRAKE 3f: the preamble skips markup, never a prose line', () => {
  test('a prose line opening with inline HTML is the paragraph', () => {
    const s = suggestIntent(repo('# pa\n\n<b>pa</b> is a fast search tool for large monorepos\nthat respects gitignore rules by default.\n'));
    expect(s['project.goal']?.value).toBe('pa is a fast search tool for large monorepos that respects gitignore rules by default.');
  });

  test('a block banner is still skipped', () => {
    const s = suggestIntent(repo('<p align="center"><img src="logo.svg" alt=""></p>\n\n# pa\n\npa is a fast search tool for large monorepos.\n'));
    expect(s['project.goal']?.value).toBe('pa is a fast search tool for large monorepos.');
  });

  test('a one-line blockquote tagline under the title is the goal', () => {
    const s = suggestIntent(repo('# Vite ⚡\n\n> Next Generation Frontend Tooling\n\n- Instant server start\n- Fast HMR\n'));
    expect(s['project.goal']?.value).toBe('Next Generation Frontend Tooling');
  });

  test.each([
    '# pb\n\n> [!NOTE]\n> This project moved to a new home.\n',
    '# pb\n\n> ⚠️ Nightly release, expect rough edges in places.\n',
  ])('a callout or a pre-release banner is not', (readme) => {
    expect(suggestIntent(repo(readme))['project.goal']).toBeUndefined();
  });

  test('a bold-led tagline is prose, not a list', () => {
    expect(suggestIntent(repo('# Zed\n\n**Zed** is a parser for widget specs in teams.\n'))['project.goal']?.value).toBe('Zed is a parser for widget specs in teams.');
  });

  test('one inline link does not sink a tagline', () => {
    const s = suggestIntent(repo('# ky\n\nA tiny HTTP client built on [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).\n'));
    expect(s['project.goal']?.value).toBe('A tiny HTTP client built on Fetch.');
  });

  test('a two-link nav row is still not prose', () => {
    expect(suggestIntent(repo('# n\n\n[Documentation](https://n.dev/docs) and [Discord](https://n.dev/chat)\n'))['project.goal']).toBeUndefined();
  });

  test('reference-definition lines are not the first paragraph', () => {
    const readme = '[circleci-image]: https://example.com/badge\n[circleci-url]: https://circleci.com/gh/x/y\n\nModern, fast, powerful node.js web framework\n';
    const s = suggestIntent(repo(readme, { description: 'Modern, fast, powerful node.js web framework' }));
    expect(s['project.goal']?.value).toBe('Modern, fast, powerful node.js web framework');
    expect(JSON.stringify(s)).not.toMatch(/circleci/i);
    expect(s['human_context.what']?.value ?? '').not.toMatch(/circleci|\[.*\]:/);
  });

  test('wrapped badge URL lines are not the first paragraph', () => {
    const readme = '[![pypi](https://pypi.org)](https://pypi.org/project/numpy/)\nhttps://numfocus.org)\nhttps://pypi.org/project/numpy/)\n\nNumPy is the fundamental package for scientific computing with Python.\n';
    const s = suggestIntent(repo(readme));
    expect(JSON.stringify(s)).not.toMatch(/numfocus\.org\)/);
    const what = s['human_context.what']?.value ?? s['project.goal']?.value ?? '';
    expect(what).toContain('fundamental package');
  });

  test('a ref-definition preamble does not become the goal or what', () => {
    const s = suggestIntent(repo('[bad-ref]: https://example.com/badge\n\nReal project does one thing well.\n'));
    expect(s['project.goal']?.value).toBe('Real project does one thing well.');
    expect(s['human_context.what']?.value ?? s['project.goal']?.value).toBe('Real project does one thing well.');
    expect(JSON.stringify(s)).not.toContain('bad-ref');
  });

  test('a setext title is never part of what (Relentless too)', () => {
    const r = relentlessContextDetailed(repo('A fast search tool for large monorepos.\n---\n\nMore text that is long enough to count as a paragraph here.\n'));
    expect(r.what?.value).toBe('More text that is long enough to count as a paragraph here.');
  });
});

describe('BRAKE 3b: slop the structural gate let through', () => {
  test.each([
    ['README greeting', '# wel\n\nWelcome to the wel repo! Thanks for stopping by.\n', 'project.goal'],
    ['withastro/docs greeting', '# docs\n\nTo all who come to this happy place: welcome.\n', 'project.goal'],
    ['copyright line', '# c\n\nC parses widgets for small teams.\n\n## Status\n\nCopyright (c) 2024 Jane Doe. All rights reserved.\n', 'human_context.when'],
    ['licence line', '# c\n\nC parses widgets for small teams.\n\n## Why\n\nLicensed under the MIT license, see the LICENSE file for details.\n', 'human_context.why'],
    ['install line', '# c\n\nC parses widgets for small teams.\n\n## How it works\n\nInstall with npm install c-widgets, then import it.\n', 'human_context.how'],
    ['please line', '# c\n\nC parses widgets for small teams.\n\n## Why\n\nPlease read the contributing guide before opening issues.\n', 'human_context.why'],
    ['question', '# L8\n\nWhat is L8?\n', 'project.goal'],
    ['astro: a line broken after a dash', '<p align="center">\n  <a href="https://astro.build">Astro</a> is a website build tool for the modern web &mdash;\n  <br/>\n  powerful developer experience meets lightweight output.\n</p>\n', 'human_context.what'],
    ['a fragment ending in a comma', '# c\n\nC parses widgets for small teams.\n\n## Why\n\nBecause widget specs drift between teams,\n', 'human_context.why'],
    ['black: a quotation is not a fact', '# Black\n\n> “Any color you like.”\n\nBlack is the uncompromising Python code formatter.\n', 'project.goal'],
    ['kit: a call to action', '# SvelteKit\n\nWeb development, streamlined. Read the [documentation](https://svelte.dev/docs/kit) to get started.\n', 'project.goal'],
    ['a call to action, alone', '# k\n\nWeb development, streamlined. Head over to the site to get started.\n', 'project.goal'],
    ['plain-text nav row', '# n\n\nDocumentation | Discord | Blog | Examples\n', 'project.goal'],
    ['dual-licensed intro', '> Command Line Argument Parser for Rust\n\nDual-licensed under Apache 2.0 or MIT.\n\nClap parses CLI arguments for Rust projects.\n', 'human_context.what'],
    ['prisma CTA tail', 'Prisma 8 is a TypeScript rewrite of Prisma ORM, designed to be extensible. Read the announcement or start with the docs.\n', 'human_context.what'],
  ])('%s', (_name, readme, path) => {
    expect(suggestIntent(repo(readme))[path as 'project.goal']).toBeUndefined();
  });

  test.each([
    'monorepo for @sveltejs/kit and friends',
    'monorepo for svelte.dev',
  ])('a monorepo root description says where the code is, not the goal: %s', (d) => {
    expect(goalOf(d)).toBeUndefined();
  });

  test('a colon mid-sentence and A <100 KB are still prose', () => {
    expect(isValidExtraction('The fast linter: written in Rust for big repos.')).toBe(true);
    expect(isValidExtraction('A <100 KB library that parses widgets safely.')).toBe(true);
  });
});

describe('ENGINE 3d: headings that hold the fact, matched whole', () => {
  const BODY = 'A widget parser built on a streaming tokenizer for small teams.';
  test.each([
    ['Introduction', 'human_context.what'],
    ['What is hd?', 'human_context.what'],
    ['Why ripgrep?', 'human_context.why'],
    ['Why use hd?', 'human_context.why'],
    ['Motivations', 'human_context.why'],
    ['The problem', 'human_context.why'],
    ['Goals', 'project.goal'],
    ['How does it work?', 'human_context.how'],
    ['Under the hood', 'human_context.how'],
    ['Target audience', 'human_context.who'],
    ['Who is it for?', 'human_context.who'],
    ['Supported platforms', 'human_context.where'],
    ['Platform support', 'human_context.where'],
    ['Project status', 'human_context.when'],
    ['Current status', 'human_context.when'],
  ])('## %s → %s', (heading, path) => {
    const s = suggestIntent(repo(`# hd\n\n## ${heading}\n\n${BODY}\n`));
    expect(s[path as 'project.goal']?.value).toBe(BODY);
  });

  test.each(['Why not hd?', 'History', 'Design', 'About', 'Users', "What's new"])('## %s holds a misplaced fact: nothing', (heading) => {
    const s = suggestIntent(repo(`# hd\n\n## ${heading}\n\n${BODY}\n`));
    expect(Object.keys(s)).toEqual([]);
  });

  test('tokio: a section ending in a list intro gives its first sentence', () => {
    const s = suggestIntent(repo('# tokio\n\n## Overview\n\nTokio is an event-driven, non-blocking I/O platform for writing asynchronous applications. At a high level, it provides a few major components:\n\n- a scheduler\n'));
    expect(s['human_context.what']?.value).toBe('Tokio is an event-driven, non-blocking I/O platform for writing asynchronous applications.');
  });
});

describe('BRAKE 3h: the guards the mutation runs found missing', () => {
  test('Relentless gates its own output (direct consumers such as an MCP)', () => {
    const r = relentlessContextDetailed(repo('# r\n\nR parses widgets.\n\n## Why\n\nTODO: write this section properly later on.\n'));
    expect(r.why).toBeUndefined();
  });

  test.each([
    ['README:## Why', 'README.md § Why'],
    ['README:first-paragraph', 'README.md § first paragraph'],
    ['README:first-sentence', 'README.md § first sentence'],
    ['package.json:description', 'package.json description'],
    ['Cargo.toml description', 'Cargo.toml description'],
  ])('source %s reads as %s', (raw, want) => {
    expect(sourceName(raw)).toBe(want);
  });
});

describe('TYRE 3g: column width (#228) — text symbols are one column', () => {
  test.each([
    ['©™®', 3],
    ['‼↔', 2],
    ['❤️', 2],
    ['😀', 2],
    ['🇬🇧', 2],
    ['👨‍👩‍👧', 2],
    ['中文', 4],
  ])('%s → %d', (s, w) => {
    expect(displayWidth(s)).toBe(w);
  });

  test('redraw rows count columns, not UTF-16 units', () => {
    expect(rowsFor('中'.repeat(30), 40)).toBe(2);
    expect(rowsFor('©'.repeat(60), 40)).toBe(2);
    expect(rowsFor('', 40)).toBe(1);
  });
});
