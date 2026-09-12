/**
 * BRAKE: an anchored or tagged value is edited in place, and an alias is
 * never replaced — the 7.13 re-check (verify2 t-fallback Y55, t-yaml Y40,
 * Y42).
 *
 * 1. Editing a scalar with an anchor or a tag (`goal: &g Old`, `name: !!str
 *    x`) never spliced. The node's range covers the value only ('Old'), but
 *    the new value was rendered with its anchor ('&g New'), so the splice
 *    read '&g &g New', failed its check, and faf re-serialised the whole
 *    file: hand-wrapped text was joined, comment alignment and a flow list's
 *    spacing were lost. Now the anchor and tag the node keeps are left in the
 *    text and only the value changes.
 * 2. `faf auto` filling a slot under `stack: *base` replaced the alias with
 *    an expanded copy of the map; the user's `*base` (and the link between
 *    stack and defaults) was gone. Now an alias is never replaced or
 *    expanded: writeFaf and updateFafFile leave that path as written and say
 *    so (`onAliasKept`, `keptAliases`), `faf auto` prints one line, and
 *    `faf edit` of an alias key refuses in one line.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { editYamlDetailed } from '../../src/core/yaml-edit.js';
import { readFaf, updateFafFile, writeFaf, type KeptAlias } from '../../src/interop/faf.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');

function dir(tag = 'faf-anchor-'): string {
  return realpathSync(tempFolders.mkdtemp(join(tmpdir(), tag)));
}

function faf(cwd: string, ...args: string[]): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, HOME: dir('faf-anchor-home-'), NO_COLOR: '1' } });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
}

/** Lines of `before` that `after` does not hold at the same place, the edited line aside. */
function otherLinesChanged(before: string, after: string, edited: number): string[] {
  const a = before.split('\n');
  const b = after.split('\n');
  return a.filter((line, i) => i !== edited && line !== b[i]);
}

describe('BRAKE: an anchored or tagged scalar edit changes only its value text (Y55, Y42)', () => {
  test('an anchored scalar', () => {
    const src = 'a: &g Old   # C\nx: 1   # X\n';
    const r = editYamlDetailed(src, d => d.setIn(['a'], 'NEW'));
    expect(r.spliced).toBe(true);
    expect(r.text).toBe('a: &g NEW   # C\nx: 1   # X\n');
  });

  test('a !!str scalar', () => {
    const src = 'a: !!str Old   # C\nx: 1   # X\n';
    const r = editYamlDetailed(src, d => d.setIn(['a'], 'NEW'));
    expect(r.spliced).toBe(true);
    expect(r.text).toBe('a: !!str NEW   # C\nx: 1   # X\n');
  });

  test('an anchored scalar with an alias of an alias (Y42): every other line byte for byte', () => {
    const src = 'project:\n  name: demo\n  goal: &g Old goal\nmeta: &m\n  summary: *g   # SUMMARY-FOLLOWS-GOAL\n  owner: HAND-OWNER\nmirror: *m   # MIRROR-OF-META\n';
    const r = editYamlDetailed(src, d => d.setIn(['project', 'goal'], 'NEW GOAL'));
    expect(r.spliced).toBe(true);
    expect(r.text).toBe(src.replace('goal: &g Old goal', 'goal: &g NEW GOAL'));
    expect(otherLinesChanged(src, r.text, 2)).toEqual([]);
  });

  test('an anchored list item and an anchor with a tag', () => {
    const item = editYamlDetailed('k:\n  - &i one   # C\n  - two\nref: *i\n', d => d.setIn(['k', 0], 'ONE'));
    expect(item.spliced).toBe(true);
    expect(item.text).toBe('k:\n  - &i ONE   # C\n  - two\nref: *i\n');
    const both = editYamlDetailed('a: &g !!str Old   # C\nb: *g\n', d => d.setIn(['a'], 'NEW'));
    expect(both.spliced).toBe(true);
    expect(both.text).toBe('a: &g !!str NEW   # C\nb: *g\n');
  });

  test('Y55: `faf edit project.goal` on an anchored goal changes only the goal line', () => {
    const src = `# project.faf — hand-kept
project:
  name: demo
  goal: &g Old goal          # the one-liner
  summary: *g
  description: our tool keeps the
    context of every repo in one
    small file, wrapped by hand
  main_language: TypeScript  # aligned comment
tags: [cli, context]         # flow list, aligned comment
stack:
  frontend: 'React'          # single-quoted on purpose
  hosting: "Vercel"
`;
    const d = dir();
    writeFileSync(join(d, 'project.faf'), src);
    const r = faf(d, 'edit', 'project.goal', 'New goal');
    expect(r.status).toBe(0);
    expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(src.replace('goal: &g Old goal ', 'goal: &g New goal '));
  });
});

describe('BRAKE: an alias slot is never replaced or expanded (Y40)', () => {
  const Y40 = 'project:\n  name: demo\n  goal: Old goal\ndefaults: &base\n  frontend: React  # SHARED-FE\n  hosting: ""\nstack: *base  # STACK-FOLLOWS-DEFAULTS\n';

  test('`faf auto` leaves `stack: *base` as written and says so in one line', () => {
    const d = dir();
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0', vite: '^5.0.0' } }));
    writeFileSync(join(d, 'vercel.json'), '{}\n');
    writeFileSync(join(d, 'project.faf'), Y40);
    const r = faf(d, 'auto');
    expect(r.status).toBe(0);
    expect(r.out).toContain('stack is an alias (*base) — faf left it as written');
    const after = readFileSync(join(d, 'project.faf'), 'utf-8').split('\n');
    expect(after).toContain('stack: *base  # STACK-FOLLOWS-DEFAULTS');
    expect(after).toContain('defaults: &base');
    expect(after).toContain('  hosting: ""');
  });

  test('writeFaf: a change under an alias is not written, the alias stays, and onAliasKept hears of it — a stale copy is not a change', () => {
    const p = join(dir(), 'project.faf');
    writeFileSync(p, Y40);
    const data = readFaf(p) as Record<string, any>;
    data.stack = { ...data.stack, hosting: 'Vercel', css_framework: '' };
    const kept: KeptAlias[] = [];
    expect(writeFaf(p, data as never, { onAliasKept: k => kept.push(k) })).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe(Y40);
    expect(kept).toEqual([{ path: 'stack', alias: '*base' }]);

    // The anchor moved on and the data still holds what the alias read as
    // before: that is a stale copy, not a change — nothing to report.
    const q = join(dir(), 'project.faf');
    writeFileSync(q, 'project:\n  goal: &g Old goal\n  summary: *g # FOLLOWS\n');
    const stale = readFaf(q) as Record<string, any>;
    stale.project = { ...stale.project, goal: 'New goal' };
    const none: KeptAlias[] = [];
    expect(writeFaf(q, stale as never, { onAliasKept: k => none.push(k) })).toBe(true);
    expect(readFileSync(q, 'utf-8')).toBe('project:\n  goal: &g New goal\n  summary: *g # FOLLOWS\n');
    expect(none).toEqual([]);
  });

  test('writeFaf: the rest of the change is written; the alias line stays byte for byte', () => {
    const p = join(dir(), 'project.faf');
    writeFileSync(p, Y40);
    const data = readFaf(p) as Record<string, any>;
    data.stack = { ...data.stack, hosting: 'Vercel' };
    data.project = { ...data.project, goal: 'New goal' };
    expect(writeFaf(p, data as never)).toBe(true);
    expect(readFileSync(p, 'utf-8')).toBe(Y40.replace('goal: Old goal', 'goal: New goal'));
  });

  test('writeFaf: an alias list item stays too', () => {
    const p = join(dir(), 'project.faf');
    const src = 'main: &m src/main.ts\nkey_files:\n  - *m  # ENTRY\n  - src/b.ts\n';
    writeFileSync(p, src);
    const data = readFaf(p) as Record<string, any>;
    data.key_files = ['src/other.ts', 'src/b.ts'];
    const kept: KeptAlias[] = [];
    expect(writeFaf(p, data as never, { onAliasKept: k => kept.push(k) })).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe(src);
    expect(kept).toEqual([{ path: 'key_files.0', alias: '*m' }]);
  });

  test('updateFafFile: a mutate that replaces an alias gets it back — unchanged for that path, listed in keptAliases', () => {
    const p = join(dir(), 'project.faf');
    writeFileSync(p, Y40);
    const only = updateFafFile(p, doc => doc.set('stack', { frontend: 'Vue' }));
    expect(only.written).toBe(false);
    expect(only.keptAliases).toEqual([{ path: 'stack', alias: '*base' }]);
    expect(readFileSync(p, 'utf-8')).toBe(Y40);
    const more = updateFafFile(p, doc => {
      doc.set('stack', { frontend: 'Vue' });
      doc.setIn(['project', 'goal'], 'New goal');
    });
    expect(more.written).toBe(true);
    expect(more.keptAliases).toEqual([{ path: 'stack', alias: '*base' }]);
    expect(readFileSync(p, 'utf-8')).toBe(Y40.replace('goal: Old goal', 'goal: New goal'));
  });

  test('`faf edit` of an alias key refuses in one line and changes nothing', () => {
    const d = dir();
    const src = 'project:\n  name: demo\n  goal: &g Old goal\n  summary: *g # FOLLOWS\n';
    writeFileSync(join(d, 'project.faf'), src);
    const r = faf(d, 'edit', 'project.summary', 'Its own summary');
    expect(r.status).toBe(1);
    expect(r.out).toContain('project.summary is an alias (*g) — faf left it as written');
    expect(readFileSync(join(d, 'project.faf'), 'utf-8')).toBe(src);
  });
});
