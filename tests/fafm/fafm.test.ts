/**
 * WJTTC ENGINE: .fafm TS surface — golden-pinned against claude-fafm-sdk 1.0 INTEROP.
 */
import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { Soul, fromClaudeDir, factFromObj, factToObj } from '../../src/fafm/index.js';

const FIX = join(import.meta.dir, '../fixtures');
const FAFM = join(FIX, 'fafm');
const CLAUDE_MEM = join(FIX, 'claude-memory');
const TMP = join(import.meta.dir, '../.tmp-fafm');

describe('ENGINE: fafm Soul load/save fidelity', () => {
  test('voice fixture loads', () => {
    const s = Soul.load(join(FAFM, 'voice.fafm'));
    expect(s.profile).toBe('voice');
    expect(s.index).toEqual([]);
    expect(s.facts.length).toBe(2);
    expect(s.facts[0].text).toBe('Prefers concise answers');
    expect(s.facts[1].tags).toContain('stack');
  });

  test('knowledge fixture: index + fact extras', () => {
    const s = Soul.load(join(FAFM, 'knowledge.fafm'));
    expect(s.profile).toBe('knowledge');
    expect(s.index).toEqual(['stack: TypeScript + Bun']);
    expect(s.facts[0].id).toBe('f1');
    expect(s.facts[0].extra.confidence_score).toBe(0.9);
    expect(s.facts[0].extra.verification_status).toBe('verified');
  });

  test('missing profile defaults to voice', () => {
    mkdirSync(TMP, { recursive: true });
    const p = join(TMP, 'noprofile.fafm');
    const bare = `version: "1.1"
namepoint: "@x"
created: "2026-01-01T00:00:00Z"
last_etched: "2026-01-01T00:00:00Z"
memory:
  facts:
    - hi
`;
    writeFileSync(p, bare);
    expect(Soul.load(p).profile).toBe('voice');
    expect(new Soul('@me').profile).toBe('knowledge');
  });

  test('residual top-level + memory extras roundtrip', () => {
    const s = Soul.load(join(FAFM, 'unknown-fields.fafm'));
    expect(s.extra.future_root_field).toBeTruthy();
    expect(s.facts[0].extra.experimental_attr).toBe(123);
    mkdirSync(TMP, { recursive: true });
    const out = join(TMP, 'residual.fafm');
    s.toFile(out, { reindex: false });
    const back = Soul.fromFile(out);
    expect(back.extra.future_root_field).toBe(s.extra.future_root_field);
    expect(back.facts[0].extra.experimental_attr).toBe(123);
  });

  test('toDoc always emits index; never memory.entries', () => {
    const s = new Soul('@t');
    s.etch('a fact', { id: 'f1' });
    const doc = s.toDoc();
    expect(doc.version).toBe('1.1');
    expect(Array.isArray(doc.index)).toBe(true);
    expect(Array.isArray(doc.memory.facts)).toBe(true);
    expect('entries' in doc.memory).toBe(false);
  });
});

describe('ENGINE: fafm recall SoT', () => {
  test('same-second ties: last appended first', () => {
    const s = new Soul('@r');
    const ts = '2026-07-22T00:00:00Z';
    s.add({ text: 'a', id: 'a', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    s.add({ text: 'b', id: 'b', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    s.add({ text: 'c', id: 'c', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    expect(s.recall().map((f) => f.id)).toEqual(['c', 'b', 'a']);
  });

  test('update-in-place keeps slot', () => {
    const s = new Soul('@r');
    const ts = '2026-07-22T00:00:00Z';
    s.add({ text: 'v1', id: 'a', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    s.add({ text: 'new', id: 'b', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    s.add({ text: 'v2', id: 'a', priority: 'standard', tags: [], links: [], timestamp: ts, extra: {} });
    expect(s.facts.map((f) => f.id)).toEqual(['a', 'b']);
    expect(s.recall().map((f) => f.id)).toEqual(['b', 'a']);
    expect(s.getFact('a')?.text).toBe('v2');
  });

  test('priority ranks critical before standard', () => {
    const s = new Soul('@r');
    s.etch('low', { id: 'a', priority: 'standard', tags: ['t'] });
    s.etch('hot', { id: 'b', priority: 'critical', tags: ['t'] });
    expect(s.recall(null, { tags: ['t'] }).map((f) => f.id)).toEqual(['b', 'a']);
  });
});

describe('ENGINE: fromClaudeDir', () => {
  test('converts mini fixture like Python SDK', () => {
    const soul = fromClaudeDir(CLAUDE_MEM);
    expect(soul.profile).toBe('knowledge');
    expect(soul.namepoint).toBe('@claude-code:claude-memory');
    const ids = new Set(soul.facts.map((f) => f.id));
    expect(ids).toEqual(new Set(['good-project', 'good-feedback', 'name-only-slug']));
    expect(ids.has('bad-type-note')).toBe(false);
    const gp = soul.getFact('good-project')!;
    expect(gp.type).toBe('project');
    expect(gp.links).toContain('related-topic');
    expect(gp.extra.provenance).toEqual(['session:sess-aaa-111']);
    expect(soul.index.length).toBe(3);
  });

  test('convert → save shape is facts not entries', () => {
    mkdirSync(TMP, { recursive: true });
    const soul = fromClaudeDir(CLAUDE_MEM, { namepoint: '@claude-code:cli' });
    const out = join(TMP, 'converted.fafm');
    soul.toFile(out);
    const back = Soul.load(out);
    expect(back.facts.length).toBe(3);
    const doc = soul.toDoc();
    expect(doc.version).toBe('1.1');
    expect('entries' in doc.memory).toBe(false);
  });
});

describe('ENGINE: fact serialize', () => {
  test('bare string roundtrip', () => {
    const f = factFromObj('hello');
    expect(factToObj(f)).toBe('hello');
  });

  test('extra fields preserved', () => {
    const f = factFromObj({ text: 'x', id: 'i', confidence_score: 0.9 });
    expect(f.extra.confidence_score).toBe(0.9);
    const o = factToObj(f) as Record<string, unknown>;
    expect(o.confidence_score).toBe(0.9);
  });
});
