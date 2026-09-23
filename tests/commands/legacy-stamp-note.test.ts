/**
 * BRAKE: when faf's block goes on top of a file led by faf's old stamp, the
 * CLI says so in one line — regression checker #4 (the 7.13 owner-rule round).
 *
 * Older faf wrote CLAUDE.md (and AGENTS.md, GEMINI.md, …) with its two-line
 * `<!-- faf: … -->` stamp and no block markers. 7.13 never reclaims such a
 * file — faf cannot prove it wrote the text, and hand-written files share
 * that shape — so the new block goes on top and the old faf text stays below
 * it. Without a word, the user sees two renders and does not know which one
 * faf keeps. `faf sync` and `faf export` now print one line when it happens;
 * a run that finds faf's block (the next one) prints nothing.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { FAF_END, FAF_START, legacyStampNote } from '../../src/interop/inject.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const STAMP = '<!-- faf: demo | TypeScript | cli | Demo goal -->\n<!-- faf: claim=project.faf | score=90 | family=FAF -->\n';
const OLD = `${STAMP}\n# CLAUDE.md — demo\n\n## Architecture\n\nHAND-ARCH: the queue drains before the API.\n`;
const note = (file: string): string =>
  `${file}: faf's block is now on top; the old faf text below it is left as you had it — delete it by hand if you no longer want it.`;
const orphanNote = (file: string): string =>
  `${file}: faf's block is now on top; an older faf marker line below it has no matching pair, so the text there is left as you had it — delete it by hand if you no longer want it.`;
/** A block an older faf truncated: a START line, no END. */
const ORPHAN = `${FAF_START}\ntruncated old body\n\n# CLAUDE.md — demo\n\n## Architecture\n\nHAND-ARCH: the queue drains before the API.\n`;

function repo(): { dir: string; home: string } {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-stamp-')));
  const home = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-stamp-home-')));
  writeFileSync(join(dir, 'project.faf'), 'project:\n  name: demo\n  goal: Demo goal\n  main_language: TypeScript\n  type: cli\n');
  return { dir, home };
}

function faf(dir: string, home: string, ...args: string[]): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, HOME: home, NO_COLOR: '1' } });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
}

const count = (hay: string, needle: string): number => hay.split(needle).length - 1;

describe('BRAKE: `faf sync` and `faf export` name a stamp-led file they prefix, once', () => {
  test('`faf sync` on a stamp-led CLAUDE.md: block on top, old text kept, one line said; the rerun says nothing', () => {
    const { dir, home } = repo();
    writeFileSync(join(dir, 'CLAUDE.md'), OLD);
    const first = faf(dir, home, 'sync');
    expect(first.status).toBe(0);
    expect(count(first.out, note('CLAUDE.md'))).toBe(1);
    const after = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(after.startsWith(`${FAF_START}\n`)).toBe(true);
    expect(after.endsWith(`${FAF_END}\n\n${OLD}`)).toBe(true);
    const second = faf(dir, home, 'sync');
    expect(second.status).toBe(0);
    expect(second.out).not.toContain("faf's block is now on top");
  });

  test('`faf export` says it for each stamp-led file it prefixes, and only for those', () => {
    const { dir, home } = repo();
    mkdirSync(join(dir, '.github'));
    writeFileSync(join(dir, 'AGENTS.md'), OLD.replace('CLAUDE.md', 'AGENTS.md'));
    writeFileSync(join(dir, 'GEMINI.md'), '# GEMINI.md — hand-written, no stamp\n\nHAND\n');
    writeFileSync(join(dir, '.cursorrules'), `${STAMP}\nHAND-RULES\n`);
    writeFileSync(join(dir, '.github', 'copilot-instructions.md'), `${STAMP}\nHAND-COPILOT\n`);
    writeFileSync(join(dir, 'llms.txt'), `${STAMP}\nHAND-LLMS\n`);
    const r = faf(dir, home, 'export', '--agents', '--gemini', '--cursor', '--copilot', '--llms');
    expect(r.status).toBe(0);
    for (const file of ['AGENTS.md', '.cursorrules', '.github/copilot-instructions.md', 'llms.txt']) {
      expect(count(r.out, note(file))).toBe(1);
    }
    expect(r.out).not.toContain(note('GEMINI.md'));
    const again = faf(dir, home, 'export', '--agents', '--gemini', '--cursor', '--copilot', '--llms');
    expect(again.out).not.toContain("faf's block is now on top");
  });
});

describe('BRAKE: legacyStampNote — the rule behind the line', () => {
  test('said only for a file whose first line is the old stamp and that has no block', () => {
    expect(legacyStampNote('CLAUDE.md', OLD)).toBe(note('CLAUDE.md'));
    expect(legacyStampNote('CLAUDE.md', `﻿${OLD}`)).toBe(note('CLAUDE.md'));
    expect(legacyStampNote('CLAUDE.md', null)).toBeNull(); // no file: created, nothing to say
    expect(legacyStampNote('CLAUDE.md', '# Hand-written\n')).toBeNull();
    expect(legacyStampNote('CLAUDE.md', `# Title\n${STAMP}`)).toBeNull(); // the stamp is not the first line
    expect(legacyStampNote('CLAUDE.md', `${FAF_START}\nlone start, no end\n`)).toBe(orphanNote('CLAUDE.md')); // a marker, not a stamp: its own line
    expect(legacyStampNote('CLAUDE.md', `${STAMP}${FAF_START}\nbody\n${FAF_END}\n`)).toBeNull(); // the block is updated in place
  });
});

/**
 * The fourth shape, and the one that used to be prefixed in silence.
 *
 * A file carrying a START with no END — a block an older faf truncated, or a
 * pair the two readings read differently — has no complete block, so faf
 * prefixes it like any user file and never reclaims it: faf cannot prove
 * where that block ended. It is the one file in this family that is made of
 * faf's own marker text, so it looks most like faf's to a reader and least
 * like it to faf, and it was the only one the CLI said nothing about. Now it
 * gets a line too. Nothing about the write changed — only what is said.
 */
describe('BRAKE: an unpaired faf marker is named, not reclaimed', () => {
  test('legacyStampNote: said for a marker line shown as text with no pair, and only for one', () => {
    const say = (text: string): string | null => legacyStampNote('CLAUDE.md', text);
    expect(say(ORPHAN)).toBe(orphanNote('CLAUDE.md'));                              // START at the top
    expect(say(`# My notes\n\n${FAF_START}\nstub\n`)).toBe(orphanNote('CLAUDE.md')); // START below user text
    expect(say(`# My notes\ntext\n${FAF_END}\n`)).toBe(orphanNote('CLAUDE.md'));     // an END with no START
    expect(say(`${FAF_START}\nfirst\n${FAF_START}\nsecond\n`)).toBe(orphanNote('CLAUDE.md'));
    expect(say(`${FAF_START} \nbody\n${FAF_END} \n`)).toBeNull();     // trailing space: text, never a marker
    expect(say(`${FAF_START} \nbody\n${FAF_END}\n`)).toBe(orphanNote('CLAUDE.md')); // …so that END is the unpaired one
    expect(say('# Hand-written\n\nno faf here\n')).toBeNull();        // the user's file, untouched by faf
    expect(say(`${FAF_START}\nbody\n${FAF_END}\n`)).toBeNull();       // a complete pair: updated in place
  });

  test('`faf sync` on a truncated CLAUDE.md: block on top, every byte kept, one line said; the rerun says nothing', () => {
    const { dir, home } = repo();
    writeFileSync(join(dir, 'CLAUDE.md'), ORPHAN);
    const first = faf(dir, home, 'sync');
    expect(first.status).toBe(0);
    expect(count(first.out, orphanNote('CLAUDE.md'))).toBe(1);
    const after = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(after.startsWith(`${FAF_START}\n`)).toBe(true);
    expect(after.endsWith(`${FAF_END}\n\n${ORPHAN}`)).toBe(true); // reclaimed nothing — the orphan is still the user's
    expect(after).toContain('HAND-ARCH: the queue drains before the API.');
    const second = faf(dir, home, 'sync');
    expect(second.status).toBe(0);
    expect(second.out).not.toContain("faf's block is now on top"); // said once, when it happened
    // The second run finds its own pair and updates between the markers; it does not
    // stack a block, and it does not go near the orphan below (the block's own body
    // carries a fresh sync timestamp, so the file is not byte-identical run to run).
    const twice = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(count(twice, FAF_START)).toBe(2); // faf's own, plus the orphan — not three
    expect(count(twice, FAF_END)).toBe(1);
    expect(twice.endsWith(`${FAF_END}\n\n${ORPHAN}`)).toBe(true);
  });
});
