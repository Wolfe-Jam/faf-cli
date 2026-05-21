/**
 * WJTTC — context seeder (restored RelentlessContextExtractor essence: the 6-W
 * auto-seed the v6.0 rewrite dropped, which is why "faf auto didn't raise the
 * score"). Guard so it can't silently vanish again.
 *
 * ENGINE: each W seeds from its evidence source; sourced-or-empty (no guessing);
 *         badge/HTML noise is skipped.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { seedHumanContext } from '../../src/detect/context-seed.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-seed-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const pkg = (o: object) => writeFileSync(join(dir, 'package.json'), JSON.stringify(o));
const readme = (s: string) => writeFileSync(join(dir, 'README.md'), s);

describe('WJTTC ENGINE: context seeder', () => {
  test('what ← package.json description (authoritative)', () => {
    pkg({ description: 'A tool that transforms project files into AI context for assistants' });
    expect(seedHumanContext(dir).what).toContain('transforms project files');
  });

  test('where ← repository.url (strips git+ and .git)', () => {
    pkg({ repository: { url: 'git+https://github.com/Wolfe-Jam/x.git' } });
    expect(seedHumanContext(dir).where).toBe('https://github.com/Wolfe-Jam/x');
  });

  test('how ← package.json scripts', () => {
    pkg({ scripts: { build: 'tsc', start: 'node x' } });
    const how = seedHumanContext(dir).how ?? '';
    expect(how).toContain('npm run start');
    expect(how).toContain('npm run build');
  });

  test('why ← README ## Why section', () => {
    readme('# X\n\n## Why\nBecause sessions reset and waste time every single day.\n');
    expect(seedHumanContext(dir).why).toContain('Because sessions reset');
  });

  test('who ← "for developers …" pattern', () => {
    readme('# X\n\nA tool for developers who build AI applications daily.\n');
    expect(seedHumanContext(dir).who).toContain('developers who build AI applications');
  });

  test('sourced-or-empty: no evidence → empty seed (never guesses)', () => {
    expect(seedHumanContext(dir)).toEqual({});
  });

  test('skips badges/HTML — no shields.io noise leaks into what', () => {
    readme('# X\n\n[![badge](https://shields.io/x)](https://y)\n\nThe real one-line description of this project lives here.\n');
    const what = seedHumanContext(dir).what ?? '';
    expect(what).not.toContain('shields.io');
    expect(what).toContain('real one-line description');
  });
});
