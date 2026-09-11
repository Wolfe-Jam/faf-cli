/**
 * BRAKE: a project.faf write keeps everything faf did not change — audit #2.
 *
 * fce35d6b re-serialised the whole file on every write (writeFaf → stringify):
 * comments gone, `version: 1.10` → 1.1, a 20-digit integer rounded, `0x1F90`
 * → 8080, `&defaults` → `&a1`, a user `_meta` and any key the caller left out
 * dropped, and a write that changed nothing still rewrote the file. Now an
 * existing file is edited through its YAML Document (updateFafFile): only the
 * values that change are rewritten, and a no-op writes nothing.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import * as api from '../../src/index.js';
import { readFaf, serializeFaf, writeFaf } from '../../src/interop/faf.js';
import { updateExistingFaf } from '../../src/detect/assemble.js';

const LONG = `"${'a value well over eighty characters, '.repeat(3)}and the end"`;
const HAND = `# project.faf — hand-annotated. Keep my notes.
faf_version: 3.0
project:
  name:     demo        # aligned by hand
  goal: ""
  main_language: TypeScript
  version: 1.10
  build_id: 12345678901234567890
  port: 0x1F90
  quoted: "keep the quotes"
  single: 'and these'
  type: library
  long_note: ${LONG}

stack:
  database: PostgreSQL   # the one we run
defaults: &defaults
  retries: 3
ci:
  <<: *defaults
custom_block:
  anything: the user wants
_meta:
  owner: platform-team   # my own metadata
`;

function project(text = HAND): { dir: string; path: string } {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-doc-')));
  const path = join(dir, 'project.faf');
  writeFileSync(path, text);
  return { dir, path };
}

/** `text` with one exact piece replaced (the piece must be there). */
function swap(text: string, from: string, to: string): string {
  expect(text).toContain(from);
  return text.replace(from, to);
}

const updateFafFile = (api as Record<string, unknown>).updateFafFile as
  | ((path: string, mutate: (doc: any) => void) => { written: boolean; text: string })
  | undefined;

describe('BRAKE: updateFafFile — parse, change the Document, write only what changed', () => {
  test('is public', () => {
    expect(typeof updateFafFile).toBe('function');
  });

  test('a one-slot change rewrites that value and nothing else', () => {
    const { path } = project();
    const r = updateFafFile!(path, doc => doc.setIn(['project', 'goal'], 'Ship the thing'));
    expect(r.written).toBe(true);
    expect(readFileSync(path, 'utf-8')).toBe(swap(HAND, '  goal: ""', '  goal: "Ship the thing"'));
  });

  test('a change that changes nothing writes nothing (same file, same bytes)', () => {
    const { path } = project();
    const before = statSync(path);
    const r = updateFafFile!(path, doc => doc.setIn(['project', 'name'], 'demo'));
    expect(r.written).toBe(false);
    expect(readFileSync(path, 'utf-8')).toBe(HAND);
    expect(statSync(path).ino).toBe(before.ino);
  });
});

describe('BRAKE: writeFaf on an existing file — the hand-annotated file survives', () => {
  test('read → write with no change: the same bytes, not rewritten', () => {
    const { path } = project();
    const before = statSync(path);
    writeFaf(path, readFaf(path));
    expect(readFileSync(path, 'utf-8')).toBe(HAND);
    expect(statSync(path).ino).toBe(before.ino);
  });

  test('read → change → write: only the changed and added values move', () => {
    const { path } = project();
    const data = readFaf(path);
    data.project!.goal = 'Ship the thing';
    (data.stack as Record<string, unknown>).hosting = 'Fly.io';
    writeFaf(path, data);
    const want = swap(
      swap(HAND, '  goal: ""', '  goal: "Ship the thing"'),
      '  database: PostgreSQL   # the one we run\n',
      '  database: PostgreSQL   # the one we run\n  hosting: Fly.io\n',
    );
    expect(readFileSync(path, 'utf-8')).toBe(want);
  });

  test('faf auto (updateExistingFaf → writeFaf): every hand-written line stays, in order', () => {
    const { dir, path } = project();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo service', dependencies: { express: '^4' } }));
    writeFaf(path, updateExistingFaf(dir, readFaf(path)));
    const out = readFileSync(path, 'utf-8');
    const lines = out.split('\n');
    let at = 0;
    for (const line of HAND.split('\n').filter(l => l && l !== '  goal: ""')) {
      const found = lines.indexOf(line, at);
      expect(found).toBeGreaterThanOrEqual(at);
      at = found + 1;
    }
    expect(readFaf(path)._meta).toEqual({ owner: 'platform-team' });
    // The runtime detection rationale is not written into the user's _meta,
    // and a type the user set gets no `# found:` comment.
    expect(out).not.toContain('found');
  });

  test('a key the data leaves out is kept — faf removes nothing it did not write', () => {
    const { path } = project();
    writeFaf(path, { project: { name: 'renamed' } });
    const out = readFileSync(path, 'utf-8');
    expect(out).toBe(swap(HAND, 'name:     demo        #', 'name:     renamed        #'));
  });

  test('`# found:` is written only next to a type this write fills', () => {
    const own = project('project:\n  name: x\n  type: library\n');
    writeFaf(own.path, { project: { name: 'x', type: 'library' }, _meta: { found: ['package.json bin'] } } as never);
    expect(readFileSync(own.path, 'utf-8')).toBe('project:\n  name: x\n  type: library\n');

    const empty = project('project:\n  name: x\n  type: ""\n');
    writeFaf(empty.path, { project: { name: 'x', type: 'cli' }, _meta: { found: ['package.json bin'] } } as never);
    expect(readFileSync(empty.path, 'utf-8')).toBe('project:\n  name: x\n  type: "cli" # found: package.json bin\n');
  });

  test('CRLF line ends and a BOM are kept', () => {
    const { path } = project('\uFEFFproject:\r\n  name: x\r\n');
    writeFaf(path, { project: { name: 'x', goal: 'g' } });
    expect(readFileSync(path, 'utf-8')).toBe('\uFEFFproject:\r\n  name: x\r\n  goal: g\r\n');
  });

  test('an existing file that is not valid YAML is refused, not overwritten', () => {
    const { path } = project('project: [unclosed\n# my notes\n');
    expect(() => writeFaf(path, { project: { name: 'x' } })).toThrow(/not valid YAML/);
    expect(readFileSync(path, 'utf-8')).toBe('project: [unclosed\n# my notes\n');
  });

  test('an old `project: <name>` is lifted in place; the comments around it stay', () => {
    const { dir, path } = project('# keep me\nproject: legacy-name   # old writer\nstack:\n  backend: Express # hand\n');
    writeFaf(path, updateExistingFaf(dir, readFaf(path)));
    const out = readFileSync(path, 'utf-8');
    expect(out.startsWith('# keep me\nproject:\n  name: legacy-name\n')).toBe(true);
    expect(out).toContain('  backend: Express # hand\n');
    expect(readFaf(path).project?.name).toBe('legacy-name');
  });

  test('`faf auto` run twice: the second run writes nothing and says unchanged', () => {
    const { dir, path } = project();
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo service' }));
    const run = (): string => {
      const r = spawnSync('bun', [join(import.meta.dir, '../../src/cli.ts'), 'auto'], { cwd: dir, encoding: 'utf-8' });
      expect(r.status).toBe(0);
      return r.stdout;
    };
    expect(run()).toContain('updated');
    const first = readFileSync(path, 'utf-8');
    const ino = statSync(path).ino;
    expect(run()).toContain('unchanged');
    expect(readFileSync(path, 'utf-8')).toBe(first);
    expect(statSync(path).ino).toBe(ino);
    expect(first.startsWith('# project.faf — hand-annotated. Keep my notes.\n')).toBe(true);
  });

  test('{ replace: true } is the explicit overwrite (init --force, git --force): a fresh render', () => {
    const { path } = project();
    const data = { faf_version: '3.0', project: { name: 'fresh' } };
    (writeFaf as (p: string, d: unknown, o?: unknown) => unknown)(path, data, { replace: true });
    expect(readFileSync(path, 'utf-8')).toBe(serializeFaf(data));
  });
});
