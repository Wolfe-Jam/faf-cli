/**
 * ENGINE: Document-preserving YAML edits (src/core/yaml-edit.ts) — the engine
 * behind updateFafFile and FafmSoul.save (audit #2, #4).
 *
 * A change is made on the parsed YAML Document; only the nodes that changed
 * are rewritten in the original text. Every case here checks the exact bytes
 * and that the splice was used (not the whole-document fallback). The module
 * does not exist on fce35d6b, where every write re-serialised the whole file.
 */
import { describe, test, expect } from 'bun:test';
import { parse, type Document, type YAMLSeq } from 'yaml';
import { applyMapData, editYaml, editYamlDetailed, sameJs } from '../../src/core/yaml-edit.js';

const HAND = `# header comment — mine
faf_version: 3.0
project:
  name:     demo   # aligned by hand
  version: 1.10
  build_id: 12345678901234567890
  port: 0x1F90
  quoted: "double"
  single: 'single'
  empty:
  tilde: ~

stack:
  database: None # deliberate: stateless
  list:
    - a
    - b
defaults: &defaults
  retries: 3
ci:
  <<: *defaults
# trailing comment
`;

/** Run an edit that must be spliced; return the new text. */
function edit(text: string, mutate: (doc: Document) => void): string {
  const r = editYamlDetailed(text, mutate, 'test');
  expect(r.changed).toBe(true);
  expect(r.spliced).toBe(true);
  return r.text;
}

describe('ENGINE: editYaml — only the changed nodes are rewritten', () => {
  test('a change that changes nothing returns the original text, unchanged', () => {
    for (const mutate of [
      () => undefined,
      (d: Document) => d.setIn(['project', 'name'], 'demo'),
      (d: Document) => d.setIn(['project', 'port'], 8080),
    ]) {
      const r = editYaml(HAND, mutate);
      expect(r.changed).toBe(false);
      expect(r.text).toBe(HAND);
    }
  });

  test('a scalar keeps its alignment, its comment and its neighbours', () => {
    expect(edit(HAND, d => d.setIn(['project', 'name'], 'renamed')))
      .toBe(HAND.replace('name:     demo   # aligned', 'name:     renamed   # aligned'));
  });

  test('a typed none replaced by a fact changes in place, comment kept', () => {
    expect(edit(HAND, d => d.setIn(['stack', 'database'], 'PostgreSQL')))
      .toBe(HAND.replace('database: None # deliberate', 'database: PostgreSQL # deliberate'));
  });

  test('empty values (`key:`, `~`) are filled where they are', () => {
    expect(edit(HAND, d => d.setIn(['project', 'empty'], 'filled'))).toBe(HAND.replace('  empty:\n', '  empty: filled\n'));
    expect(edit(HAND, d => d.setIn(['project', 'tilde'], 'filled'))).toBe(HAND.replace('  tilde: ~\n', '  tilde: filled\n'));
    expect(edit('key:  # later\nb: 1\n', d => d.set('key', 'v'))).toBe('key:  v # later\nb: 1\n');
  });

  test('a new key goes after the last key of its mapping; blank lines and comments stay put', () => {
    expect(edit(HAND, d => d.setIn(['project', 'goal'], 'Ship it')))
      .toBe(HAND.replace('  tilde: ~\n', '  tilde: ~\n  goal: Ship it\n'));
    expect(edit(HAND, d => d.setIn(['human_context', 'who'], 'Platform devs')))
      .toBe(HAND.replace('# trailing comment\n', 'human_context:\n  who: Platform devs\n# trailing comment\n'));
  });

  test('a list item is appended at the list\'s own indent', () => {
    expect(edit(HAND, d => (d.getIn(['stack', 'list']) as YAMLSeq).add('c')))
      .toBe(HAND.replace('    - b\n', '    - b\n    - c\n'));
  });

  test('numbers keep their written form: 1.10, 0x1F90 and a 20-digit integer survive a nearby change', () => {
    const out = edit(HAND, d => d.setIn(['project', 'quoted'], 'changed'));
    for (const kept of ['version: 1.10', 'build_id: 12345678901234567890', 'port: 0x1F90', "single: 'single'", '&defaults', '<<: *defaults']) {
      expect(out).toContain(kept);
    }
    expect(out).toContain('quoted: "changed"');
  });

  test('a scalar that becomes a mapping is rewritten as a block under its key', () => {
    expect(edit('project: legacy # old writer\nstack:\n  a: 1\n', d => d.set('project', d.createNode({ name: 'legacy', goal: 'g' }))))
      .toBe('project:\n  name: legacy\n  goal: g\nstack:\n  a: 1\n');
  });

  test('CRLF line ends, a BOM and a missing final line break are kept', () => {
    expect(edit('a: 1\r\nb:\r\n  c: 2\r\n', d => d.setIn(['b', 'd'], 3))).toBe('a: 1\r\nb:\r\n  c: 2\r\n  d: 3\r\n');
    expect(edit('\uFEFFa: 1\n', d => d.set('a', 2))).toBe('\uFEFFa: 2\n');
    expect(edit('a: 1\nb: 2', d => d.set('c', 3))).toBe('a: 1\nb: 2\nc: 3');
  });

  test('a four-space file gets four-space additions', () => {
    expect(edit('a:\n    b: 1\n', d => d.set('c', d.createNode({ d: { e: 1 } })))).toBe('a:\n    b: 1\nc:\n    d:\n        e: 1\n');
  });

  test('list items that are mappings (soul facts) are edited field by field', () => {
    const facts = 'facts:\n  - text: a   # first\n    id: x\n  - plain\n';
    expect(edit(facts, d => d.setIn(['facts', 0, 'text'], 'A'))).toBe('facts:\n  - text: A   # first\n    id: x\n  - plain\n');
    expect(edit(facts, d => d.setIn(['facts', 0, 'tags'], d.createNode(['t']))))
      .toBe('facts:\n  - text: a   # first\n    id: x\n    tags:\n      - t\n  - plain\n');
    expect(edit(facts, d => (d.getIn(['facts']) as YAMLSeq).add(d.createNode({ text: 'new', id: 'n' }))))
      .toBe(`${facts}  - text: new\n    id: n\n`);
  });

  test('removing a key removes its line (and the comment above it)', () => {
    expect(edit('a: 1\n# about b\nb: 2\nc: 3\n', d => d.delete('b'))).toBe('a: 1\nc: 3\n');
  });

  test('a file that is not valid YAML is refused', () => {
    expect(() => editYaml('a: [unclosed\n', d => d.set('a', 1), 'bad.faf')).toThrow(/bad\.faf: not valid YAML/);
  });

  test('when splicing cannot reproduce the change, the Document\'s own text is used — the data is always right', () => {
    const r = editYamlDetailed('metadata:\n  a: 1\n', d => d.delete('metadata'));
    expect(r.changed).toBe(true);
    expect(parse(r.text)).toEqual({});
  });
});

describe('ENGINE: applyMapData — plain data onto a Document', () => {
  test('changed values in place, new keys appended, keys the data leaves out kept', () => {
    const out = editYaml(HAND, d => applyMapData(d, d.contents as never, { project: { name: 'x' }, extra: 1 })).text;
    const data = parse(out);
    expect(data.project.name).toBe('x');
    expect(data.project.port).toBe(8080);
    expect(data.ci).toEqual({ '<<': { retries: 3 } });
    expect(data.extra).toBe(1);
    expect(out).toContain('# header comment — mine');
  });

  test('prune removes what the data leaves out; lists change item by item', () => {
    const before = parse(HAND);
    const want = structuredClone(before);
    delete want.ci;
    want.stack.list = ['a', 'z', 'b'];
    const out = editYaml(HAND, d => applyMapData(d, d.contents as never, want, { prune: true })).text;
    expect(sameJs(parse(out), want)).toBe(true);
    expect(out).toContain('    - a\n    - z\n    - b\n');
  });
});
