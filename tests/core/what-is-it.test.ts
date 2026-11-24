/**
 * WJTTC — the `what` slot asks "What is it?" (his wording, 2026-11-23).
 * "What are they building?" read as the users' work, which suits a library
 * but not an app; "What is it?" covers both, and the goal asks what it does.
 */
import { describe, test, expect } from 'bun:test';
import { SIX_WS_INTERVIEW } from '../../src/core/interview.js';
import { SLOTS } from '../../src/core/slots.js';

describe('ENGINE: one wording for human_context.what', () => {
  const q = SIX_WS_INTERVIEW.find(x => x.path === 'human_context.what');
  test('the interview asks "What is it?"', () => {
    expect(q?.question.startsWith('What is it?')).toBe(true);
    expect(q?.help).toBe('what the project is, in a line');
  });
  test('the slot table says the same', () => {
    expect(SLOTS.find(s => s.path === 'human_context.what')?.description).toBe('What is it');
  });
  test('the old wording is gone', () => {
    expect(JSON.stringify(SIX_WS_INTERVIEW)).not.toContain('What are they building');
  });
});
