/**
 * BRAKE: faf go field fixes from the v8.9.0..#227 reviews (goose + Claude).
 *   W1/7d  Backspace removes a whole character (emoji, ZWJ, combining marks),
 *          never half of one; a value with a broken character is never written.
 *   7d     Redraw measures terminal columns: CJK = 2, combining marks = 0.
 *   W2/2b  Typed words (None, N/A) get no help and no suggestion.
 *   W3/3e  suggestIntent never suggests over typed words.
 *   7f     Slots with no suggestion and no help use readline (cursor keys,
 *          Ctrl-U/W, history); the field is only for the goal and six W's.
 *   10a    The init/auto line says "confirm it" for one suggestion.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { startField, fieldKey, type FieldKey, type FieldDone } from '../../src/ui/suggest-field.js';
import { displayWidth, dropLastGrapheme } from '../../src/ui/text-width.js';
import { fieldPlan } from '../../src/commands/go.js';
import { suggestIntent, suggestionNote } from '../../src/core/suggest.js';

const typeAll = (s: string): FieldKey[] => [s].map(c => ({ sequence: c }));
function run(suggestion: string, keys: FieldKey[]): FieldDone | undefined {
  let st = startField(suggestion);
  for (const key of keys) {
    const r = fieldKey(st, key);
    st = r.state;
    if (r.done) {return r.done;}
  }
  return undefined;
}
const bs: FieldKey = { name: 'backspace' };
const enter: FieldKey = { name: 'return' };

describe('BRAKE: Backspace removes a whole character', () => {
  test('emoji: the whole emoji goes, nothing broken is written', () => {
    expect(run('', [...typeAll('ab😀'), bs, ...typeAll('X'), enter])).toEqual({ kind: 'value', value: 'abX' });
  });

  test('ZWJ family emoji goes in one Backspace', () => {
    expect(run('', [...typeAll('a👨‍👩‍👧'), bs, enter])).toEqual({ kind: 'value', value: 'a' });
  });

  test('a letter with a combining accent goes in one Backspace', () => {
    expect(run('', [...typeAll('café'), bs, enter])).toEqual({ kind: 'value', value: 'caf' });
  });

  test('CJK: one character per Backspace', () => {
    expect(run('', [...typeAll('中文字'), bs, enter])).toEqual({ kind: 'value', value: '中文' });
  });

  test('a value is never written with a broken character', () => {
    const done = run('', [...typeAll('ab\ud83d'), enter]);
    expect(done).toEqual({ kind: 'value', value: 'ab' });
  });

  test('dropLastGrapheme', () => {
    expect(dropLastGrapheme('ab😀')).toBe('ab');
    expect(dropLastGrapheme('')).toBe('');
    expect(dropLastGrapheme('x')).toBe('');
  });
});

describe('ENGINE: displayWidth counts terminal columns', () => {
  test('ASCII is 1 per character', () => { expect(displayWidth('abc')).toBe(3); });
  test('CJK is 2 per character', () => { expect(displayWidth('中文')).toBe(4); });
  test('emoji is 2', () => { expect(displayWidth('😀')).toBe(2); });
  test('ZWJ sequence is 2', () => { expect(displayWidth('👨‍👩‍👧')).toBe(2); });
  test('combining marks are 0', () => { expect(displayWidth('é')).toBe(1); });
  test('colour codes are 0', () => { expect(displayWidth('\u001b[2mab\u001b[22m')).toBe(2); });
  test('‹ › are 1 each', () => { expect(displayWidth('‹x›')).toBe(3); });
});

describe('BRAKE: typed words get no help and no suggestion; plain slots use readline', () => {
  const sugg = { 'human_context.who': { value: 'Backend teams', source: 'README.md § Who' } };

  test('an empty intent slot gets the field, with its suggestion', () => {
    expect(fieldPlan('human_context.who', '', sugg)).toEqual({ suggestion: 'Backend teams', help: 'the people who use it, not the author' });
    expect(fieldPlan('human_context.why', '', sugg)).toEqual({ suggestion: '', help: 'the problem it removes' });
  });

  test('typed words: no suggestion, no help — plain readline, Enter keeps them', () => {
    expect(fieldPlan('human_context.who', 'None', sugg)).toBeNull();
    expect(fieldPlan('human_context.what', 'N/A', {})).toBeNull();
  });

  test('a slot outside the goal and six W\'s uses readline', () => {
    expect(fieldPlan('stack.database', '', {})).toBeNull();
    expect(fieldPlan('project.main_language', undefined, {})).toBeNull();
  });
});

describe('BRAKE: suggestIntent never suggests over typed words', () => {
  test('None / N/A / unknown keep their slot free of suggestions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faf-typed-'));
    try {
      writeFileSync(join(dir, 'README.md'), '# X\n\n## Who is this for\n\nBackend teams shipping APIs weekly.\n\n## Why\n\nIntegrations drift and nobody notices until production.\n');
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', description: 'Typed API clients from one schema file' }));
      const s = suggestIntent(dir, { human_context: { who: 'None', what: 'N/A', why: 'unknown' } });
      expect(s['human_context.who']).toBeUndefined();
      expect(s['human_context.what']).toBeUndefined();
      expect(s['human_context.why']).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ENGINE: the suggestion line', () => {
  test('one suggestion: "confirm it"', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faf-note-'));
    try {
      // One source, one slot: a Cargo.toml description suggests the goal only.
      writeFileSync(join(dir, 'Cargo.toml'), '[package]\nname = "x"\nversion = "0.1.0"\ndescription = "Typed API clients from one schema file"\n');
      const note = suggestionNote(dir) ?? '';
      expect(note).toStartWith('1 suggestion ');
      expect(note).toContain("confirm it in 'faf go'");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
