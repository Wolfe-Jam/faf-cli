/**
 * BRAKE: a plain save keeps a faf-derived index in step, and never touches a
 * hand-kept one — regression checker #3 (the 7.13 owner-rule round).
 *
 * 7.13's first cut made the index rebuild opt-in (`save(path, { reindex:
 * true })`), which kept a hand-kept index safe — and broke every soul whose
 * index faf itself writes. claude-faf-mcp's tests/wjttc-523-faf-writers.test.ts
 * (line 208) makes a new soul, etches one fact, adds another and saves: the
 * file stored an empty index where it stored two lines before, and faf_etch's
 * next save never added the third.
 *
 * Now, when `reindex` is left out, the index is rebuilt only when it was
 * faf-derived when the soul was loaded or made (a new soul counts, unless it
 * was given an index of its own) and has not been changed in memory since.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parse } from 'yaml';
import { Soul } from '../../src/fafm/soul.js';

function soulPath(): string {
  return join(realpathSync(mkdtempSync(join(tmpdir(), 'faf-reindex-'))), 'soul.fafm');
}

describe('BRAKE: the default save rebuilds a faf-derived index', () => {
  test("claude-faf-mcp's case: a new soul with 2 facts stores an index of 2, and the next etch + save adds the third", () => {
    const path = soulPath();
    // tests/wjttc-523-faf-writers.test.ts:189-208, step for step.
    const soul = new Soul('@claude-code:etch', {
      profile: 'knowledge',
      preferences: { tone: 'terse' },
      custom: { team: 'core' },
      extra: { x_vendor: { plan: 'pro' } },
      memoryExtra: { x_notes: ['keep me'] },
    });
    soul.etch('Use Vitest, Jest chokes on ESM', { id: 'f1', type: 'project', priority: 'high', tags: ['decision'] });
    soul.add({
      text: 'Never touch api/', id: 'f2', type: 'project', priority: 'critical', tags: ['gotcha'], links: [],
      timestamp: '2026-01-01T00:00:00Z', source: null, extra: { x_fact: 'keep' },
    });
    soul.toFile(path);
    const before = Soul.load(path);
    expect(before.index.length).toBe(2);
    expect(before.index).toEqual(['f1 — Use Vitest, Jest chokes on ESM', 'f2 — Never touch api/']);
    expect(before.indexIsDerived()).toBe(true);

    // What faf_etch does next: load, etch, save with no options.
    before.etch('Deploys go through CI', { id: 'f3', priority: 'standard' });
    before.save(path);
    const after = Soul.load(path);
    expect(after.facts.map(f => f.id)).toEqual(['f1', 'f2', 'f3']);
    for (const line of before.index.slice(0, 2)) {expect(after.index).toContain(line);}
    expect(after.index.some(l => l.startsWith('f3'))).toBe(true);
    expect(after.getFact('f2')?.extra).toEqual({ x_fact: 'keep' });
    expect(after.preferences).toEqual({ tone: 'terse' });
    expect(after.memoryExtra).toEqual({ x_notes: ['keep me'] });
  });

  test('a loaded index that is exactly the derived one stays in step across etches; a hand-kept one stays byte for byte', () => {
    const path = soulPath();
    writeFileSync(path, 'namepoint: "@t"\nindex:\n  - "a1 — one"\nmemory:\n  facts:\n    - text: one\n      id: a1\n');
    const soul = Soul.load(path);
    soul.etch('two', { id: 'a2' });
    soul.save(path);
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one', 'a2 — two']);
    const again = Soul.load(path);
    again.etch('three', { id: 'a3' });
    again.save(path);
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one', 'a2 — two', 'a3 — three']);

    const handPath = soulPath();
    writeFileSync(handPath, 'namepoint: "@t"\nindex:\n  - HAND-INDEX-LINE # mine\nmemory:\n  facts:\n    - text: one\n      id: a1\n');
    const hand = Soul.load(handPath);
    hand.etch('two', { id: 'a2' });
    hand.save(handPath);
    expect(readFileSync(handPath, 'utf-8').startsWith('namepoint: "@t"\nindex:\n  - HAND-INDEX-LINE # mine\nmemory:\n')).toBe(true);
  });

  test('a new soul without an index gets the derived one on a plain save; one given its own index keeps it', () => {
    const path = soulPath();
    const plain = new Soul('@t');
    plain.etch('one', { id: 'a1' });
    plain.save(path);
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one']);

    const ownPath = soulPath();
    const own = new Soul('@t', { index: ['MY-OWN-INDEX'] });
    own.etch('one', { id: 'a1' });
    own.save(ownPath);
    expect(parse(readFileSync(ownPath, 'utf-8')).index).toEqual(['MY-OWN-INDEX']);
  });
});

describe('BRAKE: the default save never touches an index faf did not derive', () => {
  test('an index changed in memory after the load is the caller\'s: kept', () => {
    const path = soulPath();
    const first = new Soul('@t');
    first.etch('one', { id: 'a1' });
    first.save(path);
    const soul = Soul.load(path);
    expect(soul.indexIsDerived()).toBe(true);
    soul.index.push('CALLER-LINE');
    soul.etch('two', { id: 'a2' });
    soul.save(path);
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one', 'CALLER-LINE']);
  });

  test('an index the caller rebuilt with rebuildIndex() stays faf\'s: later default saves keep it in step', () => {
    const path = soulPath();
    const hand = 'namepoint: "@t"\nindex:\n  - HAND\nmemory:\n  facts:\n    - text: one\n      id: a1\n';
    writeFileSync(path, hand);
    const soul = Soul.load(path);
    soul.rebuildIndex();
    soul.etch('two', { id: 'a2' });
    soul.save(path);
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one', 'a2 — two']);
  });

  test('reindex: false keeps a derived index as it is; reindex: true rebuilds a hand one', () => {
    const path = soulPath();
    const first = new Soul('@t');
    first.etch('one', { id: 'a1' });
    first.save(path);
    const soul = Soul.load(path);
    soul.etch('two', { id: 'a2' });
    soul.save(path, { reindex: false });
    expect(parse(readFileSync(path, 'utf-8')).index).toEqual(['a1 — one']);
    const hand = soulPath();
    writeFileSync(hand, 'namepoint: "@t"\nindex:\n  - HAND\nmemory:\n  facts:\n    - text: one\n      id: a1\n');
    Soul.load(hand).save(hand, { reindex: true });
    expect(parse(readFileSync(hand, 'utf-8')).index).toEqual(['a1 — one']);
  });
});
