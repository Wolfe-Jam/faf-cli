/**
 * BRAKE: `faf server-card` edits server.json in place — 7.13 round 3, R3a.3
 * (X01).
 *
 * It used to JSON.parse the file and write JSON.stringify of a merge in faf's
 * own key order: a 20-digit `buildId` was rounded, key order and a one-line
 * `packages` array were re-laid out, the hand `title` was deleted when
 * project.faf had none, and any other key under publisher-provided went.
 * `faf cards --target registry` did the same.
 *
 * Now only the identity keys faf owns change, as text: the value of `name`, of
 * `title` (when project.faf has one), of `version` (with --set-version), and
 * the keys of faf's context-block under `_meta` — each value token replaced,
 * or the key added on a line of its own. No field is deleted and every other
 * byte stays; a file that cannot be edited that way is refused in one line.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const mk = (tag: string): string => realpathSync(tempFolders.mkdtemp(join(tmpdir(), `faf-sj-${tag}-`)));
const PUB = 'io.modelcontextprotocol.registry/publisher-provided';
const HAND = `{
  "name": "io.github.me/tool",
  "description": "HAND-DESCRIPTION",
  "title": "HAND-TITLE",
  "buildId": 12345678901234567890,
  "version": "1.2.3",
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "packages": [{"registryType": "npm", "identifier": "tool", "version": "1.2.3"}]
}
`;
const FAF = 'project:\n  name: demo\n';

function run(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: { ...process.env, HOME: mk('home'), NO_COLOR: '1' } });
}
function project(faf: string, serverJson: string): string {
  const d = mk('p');
  writeFileSync(join(d, 'project.faf'), faf);
  writeFileSync(join(d, 'server.json'), serverJson);
  return d;
}
/** The lines of `before` that are not, in order, in `after`. */
function missingLines(before: string, after: string): string[] {
  const rest = after.split('\n');
  const missing: string[] = [];
  let at = 0;
  for (const line of before.split('\n')) {
    const i = rest.indexOf(line, at);
    if (i < 0) {missing.push(line);} else {at = i + 1;}
  }
  return missing;
}

describe('BRAKE: faf server-card changes only faf\'s identity keys, as text (X01)', () => {
  test('X01: the 20-digit id, key order, the one-line array and the hand title stay byte for byte', () => {
    const d = project(FAF, HAND);
    const r = run(d, ['server-card']);
    expect(r.status).toBe(0);
    const after = readFileSync(join(d, 'server.json'), 'utf-8');
    // Only the name line differs; every other line is there, in order.
    expect(missingLines(HAND, after)).toEqual(['  "name": "io.github.me/tool",']);
    expect(after).toContain('  "name": "local/demo",\n');
    expect(after).toContain('"buildId": 12345678901234567890,');
    expect(after).toContain('  "title": "HAND-TITLE",\n'); // project.faf has no title: the file's own is kept
    const parsed = JSON.parse(after);
    expect(parsed._meta[PUB]['one.faf/context'].mediaType).toBe('application/vnd.faf+yaml');
    expect(Object.keys(parsed).slice(0, 7)).toEqual(['name', 'description', 'title', 'buildId', 'version', '$schema', '_meta']);
  });

  test('a second run changes nothing (idempotent), and --check prints exactly the file', () => {
    const d = project(FAF, HAND);
    run(d, ['server-card']);
    const once = readFileSync(join(d, 'server.json'), 'utf-8');
    const ino = statSync(join(d, 'server.json')).ino;
    const r = run(d, ['server-card']);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('(unchanged)');
    expect(readFileSync(join(d, 'server.json'), 'utf-8')).toBe(once);
    expect(statSync(join(d, 'server.json')).ino).toBe(ino); // not even rewritten
    expect(run(d, ['server-card', '--check']).stdout).toBe(once);
  });

  test('a title from project.faf replaces the title value in place, or is added on its own line after name', () => {
    const titled = 'project:\n  name: demo\n  title: Demo Tool\n';
    const d = project(titled, HAND);
    run(d, ['server-card']);
    const after = readFileSync(join(d, 'server.json'), 'utf-8');
    expect(after).toContain('  "title": "Demo Tool",\n');
    expect(missingLines(HAND, after)).toEqual(['  "name": "io.github.me/tool",', '  "title": "HAND-TITLE",']);

    const untitled = HAND.replace('  "title": "HAND-TITLE",\n', '');
    const e = project(titled, untitled);
    run(e, ['server-card']);
    const added = readFileSync(join(e, 'server.json'), 'utf-8');
    expect(added).toContain('  "name": "local/demo",\n  "title": "Demo Tool",\n  "description": "HAND-DESCRIPTION",\n');
    expect(missingLines(untitled, added)).toEqual(['  "name": "io.github.me/tool",']);
  });

  test('--set-version changes only the version value; keys of others under _meta are kept', () => {
    const withMeta = HAND.replace(
      '  "packages"',
      `  "_meta": {\n    "${PUB}": {\n      "other.tool/x": {"keep": "HAND-OTHER"},\n      "one.faf/context": {"faf": "./old.faf", "note": "HAND-NOTE-IN-BLOCK"}\n    }\n  },\n  "packages"`,
    );
    const d = project(FAF, withMeta);
    expect(run(d, ['server-card', '--set-version', '2.0.0']).status).toBe(0);
    const after = readFileSync(join(d, 'server.json'), 'utf-8');
    expect(after).toContain('  "version": "2.0.0",\n');
    expect(after).toContain('"other.tool/x": {"keep": "HAND-OTHER"},');
    const block = JSON.parse(after)._meta[PUB]['one.faf/context'];
    expect(block.faf).toBe('./project.faf');
    expect(block.note).toBe('HAND-NOTE-IN-BLOCK'); // never delete a field the file has
  });

  test('CRLF and tab indentation are kept', () => {
    const crlf = HAND.replace(/\n/g, '\r\n').replace(/^ {2}/gm, '\t');
    const d = project(FAF, crlf);
    expect(run(d, ['server-card']).status).toBe(0);
    const after = readFileSync(join(d, 'server.json'), 'utf-8');
    expect(after.split('\r\n').every(l => !l.includes('\n'))).toBe(true);
    expect(after).toContain('\t"_meta": {\r\n\t\t"io.modelcontextprotocol.registry/publisher-provided": {\r\n');
    expect(after).toContain('\t"buildId": 12345678901234567890,\r\n');
  });

  test('a server.json faf cannot edit that way is refused in one line and kept', () => {
    for (const [bad, why] of [
      ['{ "name": "a", "name": "b" }\n', 'the key "name" is there more than once'],
      ['{ "name": "a", "_meta": ["HAND"] }\n', '"_meta" is not an object'],
      ['{ "name": "a", }\n', 'not valid JSON'],
      ['["HAND"]\n', 'the JSON is not an object'],
    ] as const) {
      const d = project(FAF, bad);
      const r = run(d, ['server-card']);
      expect(r.status).toBe(1);
      expect(r.stderr.trim().split('\n')).toHaveLength(1);
      expect(r.stderr).toContain(why);
      expect(r.stderr).toContain('faf cannot change only its identity keys, so it left the file unchanged.');
      expect(readFileSync(join(d, 'server.json'), 'utf-8')).toBe(bad);
    }
  });

  test('--out over a file without faf\'s identity is refused (Use --force); with it, or --force, it is written', () => {
    const d = project(FAF, HAND);
    writeFileSync(join(d, 'out.json'), '{"mine": "HAND-OUT"}\n');
    const r = run(d, ['server-card', '--out', 'out.json']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('so faf did not write it — faf left it unchanged. Use --force to replace it.');
    expect(readFileSync(join(d, 'out.json'), 'utf-8')).toBe('{"mine": "HAND-OUT"}\n');
    expect(readFileSync(join(d, 'server.json'), 'utf-8')).toBe(HAND);
    expect(run(d, ['server-card', '--out', 'out.json', '--force']).status).toBe(0);
    expect(JSON.parse(readFileSync(join(d, 'out.json'), 'utf-8')).name).toBe('local/demo');
    expect(run(d, ['server-card', '--out', 'out.json']).status).toBe(0); // it carries faf's identity now
  });

  test('faf cards --target registry makes the same in-place edit', () => {
    const d = project(FAF, HAND);
    expect(run(d, ['cards', '--target', 'registry']).status).toBe(0);
    const after = readFileSync(join(d, 'server.json'), 'utf-8');
    expect(missingLines(HAND, after)).toEqual(['  "name": "io.github.me/tool",']);
    expect(after).toContain('"buildId": 12345678901234567890,');
  });
});

describe('ENGINE: editJsonText — value tokens replaced, keys added, nothing else touched', () => {
  const load = () => import('../../src/core/json-edit.js');
  test('compact objects, empty objects, nested keys, patch order', async () => {
    const json = await load();
    expect(json.editJsonText('{"a":1,"b":2}', { c: 3, d: { e: 1 } }).text).toBe('{"a":1,"b":2,"c":3,"d":{"e":1}}');
    expect(json.editJsonText('{}', { c: 3, d: { e: 1 } }).text).toBe('{"c":3,"d":{"e":1}}'); // an empty object gets all its keys in one go
    expect(json.editJsonText('{\n}\n', { name: 'x', _meta: { a: 1 } }).text).toBe('{\n  "name": "x",\n  "_meta": {\n    "a": 1\n  }\n}\n');
    expect(json.editJsonText('{\n  "a": {}\n}\n', { a: { b: 1 } }).text).toBe('{\n  "a": {\n    "b": 1\n  }\n}\n');
    expect(json.editJsonText('{\n  "a": 1,\n  "z": 2\n}\n', { b: 'x' }, { '': { b: ['a'] } }).text).toBe('{\n  "a": 1,\n  "b": "x",\n  "z": 2\n}\n');
  });

  test('an unchanged value is not touched; a value is never deleted', async () => {
    const json = await load();
    const text = '{ "n": 1.10, "big": 12345678901234567890, "keep": [1,2] }';
    expect(json.editJsonText(text, { n: 1.1, keep: undefined })).toEqual({ text, changed: false });
    expect(json.editJsonText(text, { n: 2 }).text).toBe('{ "n": 2, "big": 12345678901234567890, "keep": [1,2] }');
  });

  test('refusals: not JSON, not an object, a repeated key on the way, a non-object to go into', async () => {
    const json = await load();
    for (const [text, patch] of [
      ['{"a":1,}', { a: 2 }],
      ['[1]', { a: 1 }],
      ['{"a":1,"a":2}', { a: 3 }],
      ['{"m":[1]}', { m: { x: 1 } }],
    ] as const) {
      expect(() => json.editJsonText(text, patch as Record<string, unknown>)).toThrow(json.JsonEditError);
    }
  });
});
