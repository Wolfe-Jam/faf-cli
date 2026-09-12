/**
 * BRAKE: writeFaf writes only what changed; comments and aliases stay —
 * adversarial #5 and #8 (the 7.13 owner-rule round, t-faf Y14, Y15, Y22, Y08
 * and t-soul S08, S12, S13).
 *
 * writeFaf merged full data into the file key by key. Data read with readFaf
 * holds an alias as a plain copy of its value, so writing it back replaced a
 * live `summary: *g` with the stale `Old goal` (and dropped its comment) the
 * moment `faf edit project.goal` changed the anchor. `faf auto` lifting
 * `project: demo # note` to a mapping, or filling `stack: # note`, dropped the
 * comment, and so did an etch into a soul's empty `memory: # note` or
 * `facts: # note`. A file ending in the YAML `...` marker was rewritten on every save,
 * even one that changed nothing, because yaml's Document.clone drops `...`.
 *
 * Now writeFaf compares the data with what the file holds and applies only the
 * paths that changed; a lifted value keeps its comment; and a change that
 * leaves the data as it was writes nothing.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { parse } from 'yaml';
import { readFaf, updateFafFile, writeFaf } from '../../src/interop/faf.js';
import { setNestedValue } from '../../src/core/dot-path.js';
import { Soul } from '../../src/fafm/soul.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');

function project(): string {
  return realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-merge-')));
}

/** A React + Vite + Vercel repo (t-faf's REACT fixture) with `project.faf`. */
function reactRepo(faf: string): string {
  const dir = project();
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0', vite: '^5.0.0' }, scripts: { build: 'vite build', test: 'vitest' } }, null, 2));
  writeFileSync(join(dir, 'vercel.json'), '{}\n');
  writeFileSync(join(dir, 'tsconfig.json'), '{}\n');
  writeFileSync(join(dir, 'project.faf'), faf);
  return dir;
}

/** Run the real CLI in `dir`, with HOME in a mkdtemp folder. */
function faf(dir: string, ...args: string[]): { status: number | null; out: string } {
  const home = tempFolders.mkdtemp(join(tmpdir(), 'faf-merge-home-'));
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: dir,
    encoding: 'utf-8',
    env: { ...process.env, HOME: home, NO_COLOR: '1' },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const lines = (s: string): string[] => s.split(/\r?\n/);

describe('BRAKE: the real CLI keeps aliases and comments (Y22, Y14, Y15)', () => {
  test('Y22 `faf edit project.goal` changes the anchor; `summary: *g # …` stays an alias with its comment', () => {
    const before = 'project:\n  name: demo\n  goal: &g Old goal\n  summary: *g # SUMMARY-FOLLOWS-GOAL\n';
    const dir = project();
    writeFileSync(join(dir, 'project.faf'), before);
    const r = faf(dir, 'edit', 'project.goal', 'NEW GOAL');
    expect(r.status).toBe(0);
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(after).toBe('project:\n  name: demo\n  goal: &g NEW GOAL\n  summary: *g # SUMMARY-FOLLOWS-GOAL\n');
    expect(parse(after).project.summary).toBe('NEW GOAL');
  });

  test('Y14 `faf auto` lifts `project: demo # …` to a mapping and keeps the comment', () => {
    const dir = reactRepo('project: demo # LEGACY-NAME-COMMENT\nfaf_version: 2.5.0\n');
    expect(faf(dir, 'auto').status).toBe(0);
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(lines(after)).toContain('  # LEGACY-NAME-COMMENT');
    expect(after.startsWith('project:\n  # LEGACY-NAME-COMMENT\n  name: demo\n')).toBe(true);
    expect(lines(after)).toContain('faf_version: 2.5.0');
    expect(parse(after).project.name).toBe('demo');
  });

  test('Y15 `faf auto` fills `stack: # …` and keeps the comment', () => {
    const dir = reactRepo('project:\n  name: demo\n  goal: Old goal\nstack: # decide after ADR-7 (NULL-STACK-COMMENT)\n');
    expect(faf(dir, 'auto').status).toBe(0);
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(after).toContain('\nstack:\n  # decide after ADR-7 (NULL-STACK-COMMENT)\n  frontend: React\n');
    expect(after.startsWith('project:\n  name: demo\n  goal: Old goal\n')).toBe(true);
  });
});

describe('BRAKE: writeFaf applies only the paths that changed', () => {
  test('full data with a stale alias copy (as MCP servers pass it) never replaces the alias', () => {
    const before = 'defaults: &d\n  hosting: Vercel # ANCHOR-COMMENT\nproject:\n  name: demo\n  goal: &g Old goal\n  summary: *g # FOLLOWS\nstack: *d\n';
    const dir = project();
    const p = join(dir, 'project.faf');
    writeFileSync(p, before);
    const data = readFaf(p);
    // What a consumer does: read, change fields, write the whole object back.
    const copy = JSON.parse(JSON.stringify(data));
    setNestedValue(copy, 'project.goal', 'NEW GOAL');
    setNestedValue(copy, 'project.main_language', 'TypeScript');
    (copy.defaults as Record<string, string>).hosting = 'Netlify';
    expect(writeFaf(p, copy)).toBe(true);
    const after = readFileSync(p, 'utf-8');
    expect(after).toBe('defaults: &d\n  hosting: Netlify # ANCHOR-COMMENT\nproject:\n  name: demo\n  goal: &g NEW GOAL\n  summary: *g # FOLLOWS\n  main_language: TypeScript\nstack: *d\n');
    const back = parse(after);
    expect(back.project.summary).toBe('NEW GOAL');
    expect(back.stack.hosting).toBe('Netlify');
  });

  test('a change to an alias key is not written: the alias stays as written, and the caller hears of it (7.13 round 3b)', () => {
    // faf never replaces an alias — `summary: *g` is the user's text. Round 2
    // replaced it on an explicit change; the owner rule says leave it.
    const p = join(project(), 'project.faf');
    const before = 'project:\n  goal: &g Old goal\n  summary: *g # SUMMARY-COMMENT\n';
    writeFileSync(p, before);
    const data = readFaf(p);
    setNestedValue(data as Record<string, unknown>, 'project.summary', 'Its own summary');
    const kept: Array<{ path: string; alias: string }> = [];
    expect(writeFaf(p, data, { onAliasKept: k => kept.push(k) })).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe(before);
    expect(kept).toEqual([{ path: 'project.summary', alias: '*g' }]);
  });

  test('a value lifted to an empty section keeps its comment on the key line', () => {
    const p = join(project(), 'project.faf');
    writeFileSync(p, 'project:\n  name: demo\nstack: # EMPTY-NOW\n');
    writeFaf(p, { project: { name: 'demo' }, stack: {} } as never);
    expect(readFileSync(p, 'utf-8')).toBe('project:\n  name: demo\nstack: {} # EMPTY-NOW\n');
  });
});

describe('BRAKE: the soul keeps the comment on an empty `memory:` / `facts:` it fills (t-soul S12, S13)', () => {
  test('`memory: # note` and `facts: # note` keep the note as a comment line above the first fact', () => {
    const cases: Array<[string, string]> = [
      ['namepoint: "@me"\nmemory: # HAND-MEMORY-COMMENT\n', 'memory:\n  # HAND-MEMORY-COMMENT\n  facts:\n    - text: NEW-FACT\n'],
      ['namepoint: "@me"\nmemory:\n  facts: # HAND-FACTS-COMMENT\n', 'memory:\n  facts:\n    # HAND-FACTS-COMMENT\n    - text: NEW-FACT\n'],
    ];
    for (const [text, want] of cases) {
      const p = join(project(), 'soul.fafm');
      writeFileSync(p, text);
      const soul = Soul.load(p);
      soul.etch('NEW-FACT');
      soul.save(p);
      const after = readFileSync(p, 'utf-8');
      expect(after.startsWith(`namepoint: "@me"\n${want}`)).toBe(true);
      expect(Soul.load(p).facts.map(f => f.text)).toEqual(['NEW-FACT']);
    }
  });
});

describe('BRAKE: a change that leaves the data as it was writes nothing (Y08, S08)', () => {
  const D01 = '%YAML 1.2\n---\n# HEAD-COMMENT\nproject:\n  name: demo   # NAME-COMMENT\n  goal: Old goal\n\nstack:\n  frontend: React  # FE-COMMENT\n...\n';

  test('Y08 a no-op writeFaf on a %YAML / --- / ... file leaves the file alone (same bytes, same inode)', () => {
    const p = join(project(), 'project.faf');
    writeFileSync(p, D01);
    const st = statSync(p);
    expect(writeFaf(p, readFaf(p))).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe(D01);
    expect(statSync(p).ino).toBe(st.ino);
  });

  test('Y08 a real edit keeps %YAML, --- and ... and every untouched byte', () => {
    const p = join(project(), 'project.faf');
    writeFileSync(p, D01);
    const data = readFaf(p);
    setNestedValue(data as Record<string, unknown>, 'project.goal', 'NEW GOAL');
    writeFaf(p, data);
    expect(readFileSync(p, 'utf-8')).toBe(D01.replace('goal: Old goal', 'goal: NEW GOAL'));
  });

  test('a mutate that re-creates a node with the same value writes nothing, even though its text would change', () => {
    const text = 'project:\n  name: demo\n  version: 1.10 # keep the zero\n';
    const p = join(project(), 'project.faf');
    writeFileSync(p, text);
    const r = updateFafFile(p, doc => {
      doc.setIn(['project', 'version'], doc.createNode(1.1));
    });
    expect(r.written).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe(text);
  });

  test('S08 a soul ending in `...`: a plain save writes nothing; an etch keeps `...` and every hand line', () => {
    const SOUL = "# SOUL-HEAD-COMMENT\nversion: 2.0\nnamepoint: '@me'\nindex:\n  - HAND-INDEX-1\nmemory:\n  facts:\n    - text: never call payments API in tests\n      id: pay\n      tags: [HAND-TAG]\n      extra_field: HAND-EXTRA   # FACT-EXTRA-COMMENT\n  sessions: []\n...\n";
    const p = join(project(), 'soul.fafm');
    writeFileSync(p, SOUL);
    const st = statSync(p);
    Soul.load(p).save(p);
    expect(readFileSync(p, 'utf-8')).toBe(SOUL);
    expect(statSync(p).ino).toBe(st.ino);
    const soul = Soul.load(p);
    soul.etch('NEW-FACT', { id: 'n1' });
    soul.save(p);
    const after = readFileSync(p, 'utf-8');
    expect(after.endsWith('  sessions: []\n...\n') || after.includes('\n...\n')).toBe(true);
    for (const line of ['      tags: [HAND-TAG]', '      extra_field: HAND-EXTRA   # FACT-EXTRA-COMMENT', '  - HAND-INDEX-1', '...']) {
      expect(lines(after)).toContain(line);
    }
  });
});
