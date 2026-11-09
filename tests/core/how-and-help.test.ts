/**
 * BRAKE: `how` is how it works (the mechanism, and the choice that shapes the
 * code) — the format's meaning (faf schema). And the gentle default: when
 * there's no suggestion, `faf go` shows help text in gray. Help says what a
 * good answer looks like; it is never written (Enter skips, Tab does nothing).
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { questionForSlot, helpForSlot } from '../../src/core/interview.js';
import { SLOT_BY_PATH } from '../../src/core/slots.js';
import { INTENT_PATHS } from '../../src/core/suggest.js';
import { relentlessContextDetailed } from '../../src/detect/relentless.js';
import { startField, fieldKey, renderField, type FieldKey } from '../../src/ui/suggest-field.js';

describe('BRAKE: how means how it works', () => {
  test('the slot says how it works', () => {
    expect(SLOT_BY_PATH.get('human_context.how')?.description).toBe('How it works');
  });

  test('the interview asks how it works', () => {
    expect(questionForSlot('human_context.how')).toStartWith('How does it work?');
    expect(questionForSlot('human_context.how')).not.toMatch(/built|used/i);
  });
});

describe('BRAKE: Relentless suggests how only from a section about how it works', () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'faf-how-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  test('## Usage is how to use it — misplaced, no suggestion', () => {
    writeFileSync(join(dir, 'README.md'), '# X\n\n## Usage\n\nRun npx x in any folder to score the project.\n');
    expect(relentlessContextDetailed(dir).how).toBeUndefined();
  });

  test('## Install is how to install it — misplaced, no suggestion', () => {
    writeFileSync(join(dir, 'README.md'), '# X\n\n## Install\n\nInstall with npm install -g x and run it.\n');
    expect(relentlessContextDetailed(dir).how).toBeUndefined();
  });

  test('## Architecture suggests how', () => {
    writeFileSync(join(dir, 'README.md'), '# X\n\n## Usage\n\nRun npx x in any folder to score the project.\n\n## Architecture\n\nOne binary over stdio, zero config, pure functions inside.\n');
    expect(relentlessContextDetailed(dir).how?.source).toBe('README:## Architecture');
  });
});

describe('ENGINE: help text for the goal and the six W\'s', () => {
  test('every intent slot has help', () => {
    for (const p of INTENT_PATHS) {
      expect(helpForSlot(p).trim().length).toBeGreaterThan(0);
    }
  });

  test('help for how names the mechanism', () => {
    expect(helpForSlot('human_context.how')).toBe('the mechanism, and the choice that shapes the code');
  });

  test('help gives the shape of an answer, never a sample answer (no "e.g.", no quotes)', () => {
    for (const p of INTENT_PATHS) {
      expect(helpForSlot(p)).not.toMatch(/e\.g\.|for example|["'`]/i);
    }
  });

  test('a slot with no help gives ""', () => {
    expect(helpForSlot('stack.database')).toBe('');
  });
});

describe('BRAKE: help is shown, never written', () => {
  const k = (name: string): FieldKey => ({ name });
  const gray = { gray: (s: string) => `<g>${s}</g>` };

  test('an empty field with no suggestion shows the help in ‹ ›', () => {
    expect(renderField(startField('', 'the problem it removes'), gray)).toBe('<g>‹the problem it removes›</g>');
  });

  test('Enter on help skips: help is never written', () => {
    expect(fieldKey(startField('', 'the problem it removes'), k('return')).done).toEqual({ kind: 'skip' });
  });

  test('Tab on help does nothing', () => {
    const s = fieldKey(startField('', 'the problem it removes'), k('tab')).state;
    expect(s.buffer).toBe('');
  });

  test('a suggestion wins over help', () => {
    expect(renderField(startField('Backend teams', 'the people who use it'), gray)).toBe('<g>Backend teams  (suggested · Tab to edit · Enter to confirm)</g>');
  });

  test('typed words replace the help', () => {
    let s = startField('', 'the people who use it');
    s = fieldKey(s, { sequence: 'D' }).state;
    expect(renderField(s, gray)).toBe('D');
  });
});
