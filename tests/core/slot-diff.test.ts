/**
 * core/slot-diff — content-drift detection (banked for v2, unwired).
 * The signal score-delta is blind to: slot value changed but score stable.
 * Verifies the diff single-sources slots.ts (paths + isPlaceholder), no regex.
 */
import { describe, test, expect } from 'bun:test';
import { diffFafSlots } from '../../src/core/slot-diff.js';

describe('ENGINE: core/slot-diff — content drift', () => {
  test('no changes for identical data', () => {
    const a = {
      project: { name: 'x', goal: 'ship', main_language: 'TypeScript' },
      stack: { backend: 'Hono' },
    };
    expect(diffFafSlots(a, a)).toEqual([]);
  });

  test('CHANGED: slot value swaps but stays populated (the score-stable gap)', () => {
    const a = { stack: { backend: 'Hono' } };
    const b = { stack: { backend: 'Express' } };
    expect(diffFafSlots(a, b)).toContainEqual({ path: 'stack.backend', status: 'changed' });
  });

  test('ADDED: empty → populated', () => {
    const a = { stack: { backend: 'Hono' } };
    const b = { stack: { backend: 'Hono', database: 'KV' } };
    expect(diffFafSlots(a, b)).toContainEqual({ path: 'stack.database', status: 'added' });
  });

  test('REMOVED: populated → gone', () => {
    const a = { stack: { backend: 'Hono', database: 'KV' } };
    const b = { stack: { backend: 'Hono' } };
    expect(diffFafSlots(a, b)).toContainEqual({ path: 'stack.database', status: 'removed' });
  });

  test('placeholder counts as empty (uses slots.ts isPlaceholder, not a private list)', () => {
    const a = { stack: { backend: 'none' } }; // "none" is a canonical placeholder
    const b = { stack: { backend: 'Hono' } };
    expect(diffFafSlots(a, b)).toContainEqual({ path: 'stack.backend', status: 'added' });
  });

  test('human_context slots resolve by canonical path', () => {
    const a = { human_context: { who: 'devs', what: 'tool' } };
    const b = { human_context: { who: 'devs', what: 'a different tool' } };
    expect(diffFafSlots(a, b)).toContainEqual({ path: 'human_context.what', status: 'changed' });
  });
});
