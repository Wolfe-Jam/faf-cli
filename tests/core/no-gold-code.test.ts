/**
 * BRAKE: 100% is Trophy ✪, "AI is optimized to code". "Gold Code" is banned
 * wording for it (owner rule). No live surface may say it: the CLI help, the
 * docs, the README, the demos. History (CHANGELOG, dated reports) keeps its words.
 */
import { describe, test, expect } from 'bun:test';
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..', '..');
const BANNED = /gold\s+code/i;

describe('BRAKE: no "Gold Code" on a live surface', () => {
  test('faf --help and faf go --help', () => {
    for (const args of ['--help', 'go --help']) {
      const out = execSync(`bun ${join(ROOT, 'src/cli.ts')} ${args}`, { encoding: 'utf-8' });
      expect(`${args}: ${BANNED.test(out) ? out.match(BANNED)![0] : 'clean'}`).toBe(`${args}: clean`);
    }
  });

  test('README, docs/*.md and demos/*.tape', () => {
    const files = ['README.md',
      ...readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`),
      ...readdirSync(join(ROOT, 'demos')).filter((f) => f.endsWith('.tape')).map((f) => `demos/${f}`)];
    const hits = files.filter((f) => BANNED.test(readFileSync(join(ROOT, f), 'utf-8')));
    expect(hits).toEqual([]);
  });
});
