/**
 * WJTTC — Relentless 6-W human-context extractor (rewrite of the v5
 * RelentlessContextExtractor, realigned to no-guess). Guard so it can't
 * silently vanish again.
 *
 * ENGINE: reads every source (manifest + README, tiered), fills ONLY from
 * sourced evidence. The v5 INFERRED tiers (guess from name/tech) are DROPPED —
 * sourced-or-empty. WHO = target AUDIENCE (not package author).
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { relentlessContext } from '../../src/detect/relentless.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-rel-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const pkg = (o: object): void => writeFileSync(join(dir, 'package.json'), JSON.stringify(o));
const readme = (s: string): void => writeFileSync(join(dir, 'README.md'), s);

describe('WJTTC ENGINE: Relentless 6-W extractor', () => {
  test('what ← package.json description (authoritative)', () => {
    pkg({ description: 'A tool that transforms project files into AI context for assistants' });
    expect(relentlessContext(dir).what).toContain('transforms project files');
  });

  test('what ← README Purpose section when no description', () => {
    readme('# X\n\n## Purpose\nGives AI assistants permanent project memory across sessions.\n');
    expect(relentlessContext(dir).what).toContain('permanent project memory');
  });

  test('what ← problem-statement pattern (relentless tier)', () => {
    readme('# X\n\nIt solves the problem of context re-discovery every new chat session.\n');
    expect(relentlessContext(dir).what).toContain('context re-discovery');
  });

  test('who ← target AUDIENCE pattern, NOT package author', () => {
    pkg({ author: 'James Wolfe' });
    readme('# X\n\nBuilt for developers who pair with AI coding assistants daily.\n');
    const who = relentlessContext(dir).who ?? '';
    expect(who).toContain('developers who pair');
    expect(who).not.toContain('James Wolfe');
  });

  test('why ← mission pattern (relentless tier)', () => {
    readme('# X\n\nOur mission is to eliminate the context tax that wastes hours every week.\n');
    expect(relentlessContext(dir).why).toContain('eliminate the context tax');
  });

  test('where ← repository.url (strips git+ and .git)', () => {
    pkg({ repository: { url: 'git+https://github.com/Wolfe-Jam/x.git' } });
    expect(relentlessContext(dir).where).toBe('https://github.com/Wolfe-Jam/x');
  });

  test('where ← README deployment mention (relentless tier)', () => {
    readme('# X\n\nPublished on npm and available via Homebrew for macOS users.\n');
    expect(relentlessContext(dir).where).toContain('npm');
  });

  test('when ← "production since" pattern (the 6th W v6 was missing)', () => {
    readme('# X\n\nIn production since September 2025, battle-tested across teams.\n');
    expect(relentlessContext(dir).when).toContain('since September 2025');
  });

  test('how ← package.json scripts', () => {
    pkg({ scripts: { build: 'tsc', start: 'node x' } });
    const how = relentlessContext(dir).how ?? '';
    expect(how).toContain('npm run start');
    expect(how).toContain('npm run build');
  });

  test('NO-GUESS: project name alone never infers "what" (v5 INFERRED tier dropped)', () => {
    pkg({ name: 'super-payment-router' });
    expect(relentlessContext(dir).what).toBeUndefined();
  });

  test('sourced-or-empty: no evidence → empty (never guesses)', () => {
    expect(relentlessContext(dir)).toEqual({});
  });

  test('skips badges/HTML — no shields.io noise leaks into what', () => {
    readme('# X\n\n[![badge](https://shields.io/x)](https://y)\n\nThe real one-line description of this project lives here.\n');
    const what = relentlessContext(dir).what ?? '';
    expect(what).not.toContain('shields.io');
    expect(what).toContain('real one-line description');
  });
});
