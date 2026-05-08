/**
 * WJTTC — display layer
 *
 * ENGINE tier: dev/UX quality regressions. The empty-slot diagnostic must
 * name the actual slot paths, not just count them — without slot names the
 * "X empty" message is opaque (Issue K) and `faf auto`'s no-op case has no
 * actionable hint about why nothing improved (Issue I).
 */

import { describe, test, expect, spyOn } from 'bun:test';
import { displayScore } from '../../src/ui/display.js';
import { getTier } from '../../src/core/tiers.js';
import type { ScoreResult } from '../../src/core/types.js';

function buildResult(slots: Record<string, 'populated' | 'empty' | 'slotignored'>): ScoreResult {
  const populated = Object.values(slots).filter(s => s === 'populated').length;
  const empty = Object.values(slots).filter(s => s === 'empty').length;
  const ignored = Object.values(slots).filter(s => s === 'slotignored').length;
  const active = populated + empty;
  const score = active === 0 ? 0 : Math.round((populated / active) * 100);
  return {
    score,
    tier: getTier(score),
    populated,
    empty,
    ignored,
    active,
    total: populated + empty + ignored,
    slots,
  };
}

describe('WJTTC ENGINE: displayScore empty-slot diagnostic', () => {
  test('names empty slot paths inline (Issue K)', () => {
    const result = buildResult({
      'project.name': 'populated',
      'project.goal': 'empty',
      'human_context.who': 'empty',
    });
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    displayScore(result, '/tmp/test.faf');
    spy.mockRestore();

    const output = logs.join('\n');
    expect(output).toContain('project.goal');
    expect(output).toContain('human_context.who');
  });

  test('compact preview shows top 3 + "+N more" suffix when overflow', () => {
    const result = buildResult({
      'project.name': 'populated',
      'project.goal': 'empty',
      'human_context.who': 'empty',
      'human_context.what': 'empty',
      'stack.runtime': 'empty',
      'stack.cicd': 'empty',
    });
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    displayScore(result, '/tmp/test.faf');
    spy.mockRestore();

    const output = logs.join('\n');
    expect(output).toMatch(/\+2 more/);
  });

  test('omits empty-slot line at TROPHY (100%) — no false positives', () => {
    const result = buildResult({
      'project.name': 'populated',
      'project.goal': 'populated',
    });
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    displayScore(result, '/tmp/test.faf');
    spy.mockRestore();

    const output = logs.join('\n');
    expect(output).not.toMatch(/empty/);
  });

  test('omits "+N more" when exactly 3 empty (no overflow)', () => {
    const result = buildResult({
      'project.name': 'populated',
      'project.goal': 'empty',
      'human_context.who': 'empty',
      'human_context.what': 'empty',
    });
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    displayScore(result, '/tmp/test.faf');
    spy.mockRestore();

    const output = logs.join('\n');
    expect(output).not.toMatch(/\+\d+ more/);
    expect(output).toContain('project.goal');
    expect(output).toContain('human_context.who');
    expect(output).toContain('human_context.what');
  });
});
