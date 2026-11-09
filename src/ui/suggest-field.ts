/**
 * The `faf go` answer field, with a suggestion shown in gray, tab-complete
 * style:
 *   - Tab puts the suggestion in the field, to edit
 *   - Enter on the gray suggestion confirms it (it is written)
 *   - typing replaces it (clear the typed words and it comes back)
 *   - "skip" leaves the slot empty · "quit" or Ctrl-C stops the interview
 *
 * A pure reducer: go.ts feeds it keypresses from a TTY and draws renderField.
 * With no TTY there is no field — suggestions are never applied.
 */

import { dropLastGrapheme, wellFormed } from './text-width.js';

export interface FieldState {
  /** What the person has typed (or Tab'd in). */
  buffer: string;
  /** The suggestion, '' when there is none. */
  suggestion: string;
  /** Help text shown when there's no suggestion — never written. */
  help: string;
}

/** A keypress as readline's emitKeypressEvents reports it. */
export interface FieldKey {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
  meta?: boolean;
}

export type FieldDone =
  | { kind: 'value'; value: string }
  | { kind: 'skip' }
  | { kind: 'quit' };

export function startField(suggestion: string, help = ''): FieldState {
  return { buffer: '', suggestion: suggestion.trim(), help: help.trim() };
}

/** What Enter does with the field as it stands. */
function submit(state: FieldState): FieldDone {
  // Never write half a character (a lone surrogate) — it breaks the YAML.
  const typed = wellFormed(state.buffer).trim();
  if (typed.toLowerCase() === 'quit') {return { kind: 'quit' };}
  if (typed.toLowerCase() === 'skip') {return { kind: 'skip' };}
  if (typed) {return { kind: 'value', value: typed };}
  if (state.suggestion) {return { kind: 'value', value: state.suggestion };}
  return { kind: 'skip' };
}

/** True for typed text (a paste may bring several characters at once):
 *  no control characters, no Ctrl/Meta chord. */
function isPrintable(key: FieldKey): boolean {
  const seq = key.sequence ?? '';
  if (key.ctrl || key.meta || !seq) {return false;}
  return [...seq].every(c => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) !== 0x7f);
}

/** Editing keys, by name. */
const EDITS: Record<string, (s: FieldState) => FieldState> = {
  tab: (s) => (s.buffer === '' && s.suggestion ? { ...s, buffer: s.suggestion } : s),
  // One Backspace removes one character as a person sees it: a whole emoji,
  // a letter with its accent, one CJK character.
  backspace: (s) => ({ ...s, buffer: dropLastGrapheme(s.buffer) }),
  escape: (s) => ({ ...s, buffer: '' }),
};

export function fieldKey(state: FieldState, key: FieldKey): { state: FieldState; done?: FieldDone } {
  if (key.ctrl && (key.name === 'c' || key.name === 'd')) {return { state, done: { kind: 'quit' } };}
  if (key.name === 'return' || key.name === 'enter') {return { state, done: submit(state) };}
  const edit = key.name && Object.hasOwn(EDITS, key.name) ? EDITS[key.name] : undefined;
  if (edit) {return { state: edit(state) };}
  if (isPrintable(key)) {return { state: { ...state, buffer: state.buffer + key.sequence } };}
  return { state };
}

/** The field as drawn after the question: the typed words; or, when nothing
 *  is typed, the suggestion in gray marked "suggested"; or, with no
 *  suggestion, the help text in gray between ‹ ›. */
export function renderField(state: FieldState, paint: { gray: (s: string) => string }): string {
  if (state.buffer !== '') {return state.buffer;}
  if (state.suggestion) {return paint.gray(`${state.suggestion}  (suggested · Tab to edit · Enter to confirm)`);}
  // Help: what a good answer looks like. Enter skips and Tab does nothing,
  // so it can never be written.
  return state.help ? paint.gray(`‹${state.help}›`) : '';
}
