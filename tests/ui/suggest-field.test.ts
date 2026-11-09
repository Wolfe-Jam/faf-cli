/**
 * ENGINE: the `faf go` suggestion field — gray "suggested" text, tab-complete
 * style. Tab puts the suggestion in the field to edit · Enter confirms ·
 * typing replaces · "skip" leaves the slot empty · "quit" stops.
 * Pure reducer; the TTY wiring in go.ts only feeds it keys.
 */
import { describe, test, expect } from 'bun:test';
import { startField, fieldKey, renderField, type FieldKey, type FieldState, type FieldDone } from '../../src/ui/suggest-field.js';

const k = (name: string): FieldKey => ({ name });
const ch = (c: string): FieldKey => ({ sequence: c });

function run(suggestion: string, keys: FieldKey[]): { state: FieldState; done?: FieldDone } {
  let state = startField(suggestion);
  for (const key of keys) {
    const r = fieldKey(state, key);
    state = r.state;
    if (r.done) {return { state, done: r.done };}
  }
  return { state };
}

const type = (s: string): FieldKey[] => [...s].map(ch);

describe('ENGINE: suggestion field', () => {
  test('Tab puts the suggestion in the field; Enter writes it', () => {
    const r = run('Front-end devs', [k('tab'), k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Front-end devs' });
  });

  test('Tab then edit: the edited words are written', () => {
    const r = run('Front-end devs', [k('tab'), k('backspace'), k('backspace'), k('backspace'), k('backspace'), ...type('teams'), k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Front-end teams' });
  });

  test('Enter on the gray suggestion confirms it', () => {
    const r = run('Early, not yet published', [k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Early, not yet published' });
  });

  test('typing replaces the suggestion', () => {
    const r = run('Front-end devs', [...type('Data teams'), k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Data teams' });
  });

  test('"skip" leaves the slot empty', () => {
    const r = run('Front-end devs', [...type('skip'), k('return')]);
    expect(r.done).toEqual({ kind: 'skip' });
  });

  test('"quit" stops the interview', () => {
    expect(run('x y z', [...type('quit'), k('return')]).done).toEqual({ kind: 'quit' });
  });

  test('Ctrl-C quits', () => {
    expect(run('x', [{ name: 'c', ctrl: true }]).done).toEqual({ kind: 'quit' });
  });

  test('with no suggestion, Enter on an empty field skips', () => {
    expect(run('', [k('return')]).done).toEqual({ kind: 'skip' });
  });

  test('with no suggestion, Tab does nothing', () => {
    const r = run('', [k('tab'), ...type('Mine'), k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Mine' });
  });

  test('clearing typed words brings the suggestion back', () => {
    const r = run('Front-end devs', [...type('ab'), k('backspace'), k('backspace'), k('return')]);
    expect(r.done).toEqual({ kind: 'value', value: 'Front-end devs' });
  });

  test('the value written is trimmed', () => {
    expect(run('', [...type('  spaced  '), k('return')]).done).toEqual({ kind: 'value', value: 'spaced' });
  });

  test('render: an empty field shows the suggestion as "suggested"', () => {
    const out = renderField(startField('Front-end devs'), { gray: (s) => `<g>${s}</g>` });
    expect(out).toBe('<g>Front-end devs  (suggested · Tab to edit · Enter to confirm)</g>');
  });

  test('render: typed words show plainly, without the suggestion', () => {
    const state = run('Front-end devs', type('Da')).state;
    expect(renderField(state, { gray: (s) => `<g>${s}</g>` })).toBe('Da');
  });
});
