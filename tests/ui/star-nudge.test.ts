/**
 * ui/star-nudge — the gate must be conservative: fire ONLY on a genuine win,
 * interactively, never in CI, never when opted out, and not within the 30-day
 * throttle. Every guard is tested from both sides. The pure `shouldNudge`
 * decision carries all the logic (the IO wrapper just feeds it real values).
 */
import { describe, test, expect } from 'bun:test';
import { shouldNudge, type NudgeContext } from '../../src/ui/star-nudge.js';

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;
const ctx = (o: Partial<NudgeContext> = {}): NudgeContext => ({
  score: 100,
  isTTY: true,
  isCI: false,
  optedOut: false,
  shownCount: 0,
  lastShownMs: null,
  nowMs: NOW,
  ...o,
});

describe('shouldNudge — fires on a genuine win', () => {
  test('win + interactive + not-CI + never-shown → true', () => {
    expect(shouldNudge(ctx())).toBe(true);
  });
  test('score 95 (Silver, the threshold) → true', () => {
    expect(shouldNudge(ctx({ score: 95 }))).toBe(true);
  });
});

describe('shouldNudge — every guard blocks it', () => {
  test('below the win threshold (94) → false', () => {
    expect(shouldNudge(ctx({ score: 94 }))).toBe(false);
  });
  test('not a TTY (piped/redirected) → false', () => {
    expect(shouldNudge(ctx({ isTTY: false }))).toBe(false);
  });
  test('CI → false (never nudge a build machine)', () => {
    expect(shouldNudge(ctx({ isCI: true }))).toBe(false);
  });
  test('opted out (FAF_NO_NUDGE) → false', () => {
    expect(shouldNudge(ctx({ optedOut: true }))).toBe(false);
  });
});

describe('shouldNudge — throttle window', () => {
  test('shown 10 days ago (< 30) → false', () => {
    expect(shouldNudge(ctx({ lastShownMs: NOW - 10 * DAY }))).toBe(false);
  });
  test('shown 40 days ago (> 30) → true', () => {
    expect(shouldNudge(ctx({ lastShownMs: NOW - 40 * DAY }))).toBe(true);
  });
  test('never shown (null) → true', () => {
    expect(shouldNudge(ctx({ lastShownMs: null }))).toBe(true);
  });
  test('custom throttleDays honoured', () => {
    expect(shouldNudge(ctx({ lastShownMs: NOW - 5 * DAY, throttleDays: 3 }))).toBe(true);
    expect(shouldNudge(ctx({ lastShownMs: NOW - 2 * DAY, throttleDays: 3 }))).toBe(false);
  });
});

describe('shouldNudge — lifetime cap (we can\'t detect a star, so we stop asking)', () => {
  test('under the cap → true', () => {
    expect(shouldNudge(ctx({ shownCount: 2 }))).toBe(true);
  });
  test('at the cap (3) → false (retired)', () => {
    expect(shouldNudge(ctx({ shownCount: 3 }))).toBe(false);
  });
  test('over the cap → false', () => {
    expect(shouldNudge(ctx({ shownCount: 9 }))).toBe(false);
  });
  test('custom maxShows honoured', () => {
    expect(shouldNudge(ctx({ shownCount: 0, maxShows: 1 }))).toBe(true);
    expect(shouldNudge(ctx({ shownCount: 1, maxShows: 1 }))).toBe(false);
  });
});
