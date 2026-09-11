/**
 * BRAKE: a hand-kept soul.fafm survives load → etch → save — audit #4, #17, #18.
 *
 * fce35d6b rebuilt the whole file on every save: a curated index was replaced
 * by auto lines (save reindexed by default), comments went, `version: 2.0`
 * became 1.1, a `profile: voice` the file never had was written, a
 * mapping-shaped `sessions` or `index` was dropped, and `memory.facts` written
 * as a mapping failed to load. Etching an existing id replaced the whole fact
 * (links, source, tags, extra fields, priority and type lost). Recall did not
 * take the options-object form consumers call it with, and a bare-string fact
 * passed in from code had no text.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { parse } from 'yaml';
import { Soul } from '../../src/fafm/soul.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');

const HAND = `# HEADER: hand-kept soul — do not reformat
version: "2.0"
namepoint: "@team"
created: "2026-01-01T00:00:00Z"
last_etched: "2026-01-01T00:00:00Z"
index:
  - HAND-INDEX-1 the payments rule
  - HAND-INDEX-2 the deploy rule
future_root: { keep: me }   # unknown root key
memory:
  facts:
    - a bare string fact
    - text: "Payments go through the ledger"
      id: pay
      type: project
      priority: critical
      tags: [HAND-TAG]
      links: [HAND-LINK-ADR-7]
      source: HAND-SOURCE
      extra_field: HAND-EXTRA   # a hand note
  sessions:
    s1: { started: yesterday }
  preferences:
    tone: terse
`;

function soulFile(text = HAND): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-soul-')));
  const path = join(dir, 'soul.fafm');
  writeFileSync(path, text);
  return path;
}

describe('BRAKE: FafmSoul load → save keeps the file as it was', () => {
  test('a save with nothing changed writes nothing: same bytes, same file', () => {
    const path = soulFile();
    const before = statSync(path);
    Soul.load(path).save(path);
    expect(readFileSync(path, 'utf-8')).toBe(HAND);
    expect(statSync(path).ino).toBe(before.ino);
  });

  test('etch + save: the new fact and last_etched are added — every hand line stays', () => {
    const path = soulFile();
    const soul = Soul.load(path);
    soul.etch('A new decision', { id: 'new1', tags: ['decision'] });
    soul.save(path);
    const out = readFileSync(path, 'utf-8');
    const stamp = soul.last_etched;
    const want = HAND
      .replace('last_etched: "2026-01-01T00:00:00Z"', `last_etched: "${stamp}"`)
      .replace('      extra_field: HAND-EXTRA   # a hand note\n', `      extra_field: HAND-EXTRA   # a hand note\n    - text: A new decision\n      id: new1\n      priority: standard\n      tags:\n        - decision\n      timestamp: ${stamp}\n`);
    expect(out).toBe(want);
  });

  test('the curated index, version, the missing profile and unknown keys are never rewritten by default', () => {
    const path = soulFile();
    const soul = Soul.load(path);
    soul.etch('another', { id: 'x' });
    soul.save(path);
    const doc = parse(readFileSync(path, 'utf-8'));
    expect(doc.index).toEqual(['HAND-INDEX-1 the payments rule', 'HAND-INDEX-2 the deploy rule']);
    expect(doc.version).toBe('2.0');
    expect('profile' in doc).toBe(false);
    expect(doc.future_root).toEqual({ keep: 'me' });
    expect(doc.memory.sessions).toEqual({ s1: { started: 'yesterday' } });
  });

  test('a list item in memory.facts that is not a fact loads, and stays where it is', () => {
    const text = 'namepoint: "@j"\nmemory:\n  facts:\n    - first\n    - 42\n    - { note: no text here }\n';
    const path = soulFile(text);
    const soul = Soul.load(path);
    expect(soul.facts.map(f => f.text)).toEqual(['first']);
    soul.etch('second', { id: 's' });
    soul.save(path);
    const out = readFileSync(path, 'utf-8');
    expect(out.startsWith(`namepoint: "@j"\nmemory:\n  facts:\n    - first\n    - 42\n    - { note: no text here }\n    - text: second\n`)).toBe(true);
  });

  test('reindex: true is the opt-in rebuild; indexIsDerived tells a faf index from a hand one', () => {
    const path = soulFile();
    const soul = Soul.load(path);
    expect(soul.indexIsDerived()).toBe(false);
    soul.save(path, { reindex: true });
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['? — a bare string fact', 'pay — Payments go through the ledger']);
    expect(Soul.load(path).indexIsDerived()).toBe(true);
  });

  test('memory.facts written as a mapping loads, round-trips, and an etch into it is refused with nothing written', () => {
    const text = 'version: "1.1"\nnamepoint: "@m"\nmemory:\n  facts:\n    FACT-B1: first   # mine\n    FACT-B2:\n      text: second\n';
    const path = soulFile(text);
    const soul = Soul.load(path);
    expect(soul.facts.length).toBe(0);
    soul.save(path);
    expect(readFileSync(path, 'utf-8')).toBe(text);
    soul.etch('would be lost', { id: 'y' });
    expect(() => soul.save(path)).toThrow(/memory\.facts is a mapping.*Nothing written/);
    expect(readFileSync(path, 'utf-8')).toBe(text);
  });

  test('a soul whose root is a list is refused at load', () => {
    const path = soulFile('- one\n- two\n');
    expect(() => Soul.load(path)).toThrow(/not a YAML mapping/);
  });
});

describe('BRAKE: etch with an existing id merges into the fact', () => {
  test('text and timestamp change; links, source, tags, type, priority and extra fields are kept', () => {
    const path = soulFile();
    const soul = Soul.load(path);
    const fact = soul.etch('Payments go through the ledger, v2', { id: 'pay' });
    expect(fact.links).toEqual(['HAND-LINK-ADR-7']);
    expect(fact.source).toBe('HAND-SOURCE');
    expect(fact.tags).toEqual(['HAND-TAG']);
    expect(fact.type).toBe('project');
    expect(fact.priority).toBe('critical');
    expect(fact.extra).toEqual({ extra_field: 'HAND-EXTRA' });
    soul.save(path);
    const out = readFileSync(path, 'utf-8');
    expect(out).toContain('    - text: "Payments go through the ledger, v2"\n      id: pay\n');
    expect(out).toContain('      extra_field: HAND-EXTRA   # a hand note\n');
    expect(soul.facts.length).toBe(2);
  });

  test('only the fields passed change: an explicit priority or tag list replaces, nothing else moves', () => {
    const soul = Soul.load(soulFile());
    const fact = soul.etch('v3', { id: 'pay', priority: 'standard', tags: ['new'] });
    expect(fact.priority).toBe('standard');
    expect(fact.tags).toEqual(['new']);
    expect(fact.links).toEqual(['HAND-LINK-ADR-7']);
    expect(fact.source).toBe('HAND-SOURCE');
  });

  test('add() is still the INTEROP merge primitive: an existing id is overwritten whole', () => {
    const soul = new Soul('@r');
    soul.add({ text: 'v1', id: 'a', priority: 'high', tags: ['t'], links: ['l'], extra: {} });
    soul.add({ text: 'v2', id: 'a', priority: 'standard', tags: [], links: [], extra: {} });
    expect(soul.getFact('a')).toMatchObject({ text: 'v2', priority: 'standard', tags: [], links: [] });
  });
});

describe('BRAKE: recall — the options-object form, and bare-string facts', () => {
  test('recall({ query, minPriority, ... }) works as recall(query, { ... })', () => {
    const soul = Soul.load(soulFile());
    const hits = soul.recall({ query: 'ledger', minPriority: 'high' } as never);
    expect(hits.map(f => f.id)).toEqual(['pay']);
    expect(soul.recall({ query: 'nothing matches this' } as never)).toEqual([]);
  });

  test('a bare-string fact passed in from code is a fact with text', () => {
    const soul = new Soul('@x', { facts: ['a bare fact' as never] });
    const [hit] = soul.recall('bare');
    expect(hit.text).toBe('a bare fact');
    expect(hit.priority).toBe('standard');
    const added = soul.add('another bare one' as never);
    expect(added.text).toBe('another bare one');
  });

  test('bare-string facts in a file are recalled by their text', () => {
    const soul = Soul.load(soulFile());
    expect(soul.recall('bare').map(f => f.text)).toEqual(['a bare string fact']);
  });
});

describe('BRAKE: faf memory etch keeps a faf index in step and leaves a hand index alone', () => {
  const etch = (file: string, text: string, id: string): void => {
    const r = spawnSync('bun', [CLI, 'memory', 'etch', text, '--id', id, '-f', file], { encoding: 'utf-8' });
    expect(r.status).toBe(0);
  };

  test('a hand-kept index is not rewritten', () => {
    const path = soulFile();
    etch(path, 'from the cli', 'cli1');
    const doc = parse(readFileSync(path, 'utf-8'));
    expect(doc.index).toEqual(['HAND-INDEX-1 the payments rule', 'HAND-INDEX-2 the deploy rule']);
    expect(readFileSync(path, 'utf-8').startsWith('# HEADER: hand-kept soul')).toBe(true);
  });

  test('a new soul, and an index faf derived, follow the facts', () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-soul-cli-')));
    const path = join(dir, 'soul.fafm');
    etch(path, 'first', 'a');
    etch(path, 'second', 'b');
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a — first', 'b — second']);
  });
});
