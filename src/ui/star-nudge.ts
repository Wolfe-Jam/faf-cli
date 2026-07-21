import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { dim, orange } from './colors.js';

/**
 * The star-nudge — capture the reservoir. A CLI has orders of magnitude more
 * users than stars because users never see the repo page; a single quiet ask
 * after a genuine win converts a slice of that usage into the signal ~3 of 4
 * developers check before adopting a project (Borges & Valente, JSS 2018).
 *
 * Discipline (gravity, not spam): only on a real win, only interactively, NEVER
 * in CI (most installs are build machines), throttled to once per 30 days, and
 * CAPPED at a handful of showings for a user's whole life. A local CLI cannot
 * know whether you already starred — that needs YOUR GitHub token — so rather
 * than probe your account, it simply stops asking after MAX_SHOWS. Silence it
 * any time with FAF_NO_NUDGE.
 */
const WIN_SCORE = 95; // Silver+ — a genuine "your context is excellent" moment
const THROTTLE_DAYS = 30;
const MAX_SHOWS = 3; // lifetime cap — retire the nudge after this many, starred or not
const STATE_DIR = join(homedir(), '.config', 'faf');
const STATE_FILE = join(STATE_DIR, 'star-nudge');
const REPO = 'github.com/Wolfe-Jam/faf-cli';

export interface NudgeContext {
  score: number;
  isTTY: boolean;
  isCI: boolean;
  optedOut: boolean;
  shownCount: number;
  lastShownMs: number | null;
  nowMs: number;
  throttleDays?: number;
  maxShows?: number;
}

/**
 * Pure decision — show only on a genuine win, interactively, never in CI/opted
 * out, not past the lifetime cap, and not within the throttle window. Kept pure
 * so every gate is unit-testable without the filesystem, the clock, or the TTY.
 */
export function shouldNudge(c: NudgeContext): boolean {
  if (c.score < WIN_SCORE) {return false;} // only a real win earns the ask
  if (!c.isTTY) {return false;} // never when piped/redirected
  if (c.isCI || c.optedOut) {return false;} // never in CI; honour opt-out
  if (c.shownCount >= (c.maxShows ?? MAX_SHOWS)) {return false;} // retired — never nag forever
  if (c.lastShownMs !== null && c.lastShownMs !== undefined) {
    const windowMs = (c.throttleDays ?? THROTTLE_DAYS) * 86_400_000;
    if (c.nowMs - c.lastShownMs < windowMs) {return false;} // throttled
  }
  return true;
}

interface NudgeState {
  shown: number;
  lastShownMs: number | null;
}

function readState(): NudgeState {
  try {
    if (!existsSync(STATE_FILE)) {return { shown: 0, lastShownMs: null };}
    const raw = readFileSync(STATE_FILE, 'utf-8').trim();
    if (raw.startsWith('{')) {
      const j = JSON.parse(raw) as { shown?: number; last?: string };
      const ms = j.last ? Date.parse(j.last) : NaN;
      return {
        shown: Number.isFinite(j.shown as number) ? Number(j.shown) : 0,
        lastShownMs: Number.isFinite(ms) ? ms : null,
      };
    }
    // Back-compat: the first release wrote a plain ISO string — count it as one showing.
    const ms = Date.parse(raw);
    return { shown: 1, lastShownMs: Number.isFinite(ms) ? ms : null };
  } catch {
    return { shown: 0, lastShownMs: null }; // a read error must never block scoring
  }
}

function record(prevShown: number, nowMs: number): void {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify({ shown: prevShown + 1, last: new Date(nowMs).toISOString() }));
  } catch {
    /* a nudge must never fail a command */
  }
}

/** Emit the one-line star nudge if all gates pass, then record it. Side-effecting wrapper over shouldNudge. */
export function maybeStarNudge(score: number): void {
  const nowMs = Date.now();
  const state = readState();
  const show = shouldNudge({
    score,
    isTTY: Boolean(process.stdout.isTTY),
    isCI: Boolean(process.env.CI),
    optedOut: Boolean(process.env.FAF_NO_NUDGE),
    shownCount: state.shown,
    lastShownMs: state.lastShownMs,
    nowMs,
  });
  if (!show) {return;}
  console.log('');
  console.log(`  ${orange('★')} ${dim('Enjoying faf-cli? A star helps others find it:')} ${REPO}`);
  record(state.shown, nowMs);
}
