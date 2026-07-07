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
 * in CI (most installs are build machines), throttled to once per 30 days per
 * machine, and silenceable with FAF_NO_NUDGE. Shown at most a handful of times
 * in a user's life.
 */
const WIN_SCORE = 95; // Silver+ — a genuine "your context is excellent" moment
const THROTTLE_DAYS = 30;
const STATE_DIR = join(homedir(), '.config', 'faf');
const STATE_FILE = join(STATE_DIR, 'star-nudge');
const REPO = 'github.com/Wolfe-Jam/faf-cli';

export interface NudgeContext {
  score: number;
  isTTY: boolean;
  isCI: boolean;
  optedOut: boolean;
  lastShownMs: number | null;
  nowMs: number;
  throttleDays?: number;
}

/**
 * Pure decision — show the nudge only on a genuine win, interactively, never in
 * CI/opted-out, and not within the throttle window. Kept pure so the gate is
 * unit-testable without touching the filesystem, the clock, or the TTY.
 */
export function shouldNudge(c: NudgeContext): boolean {
  if (c.score < WIN_SCORE) return false; // only a real win earns the ask
  if (!c.isTTY) return false; // never when piped/redirected
  if (c.isCI || c.optedOut) return false; // never in CI; honour opt-out
  if (c.lastShownMs != null) {
    const windowMs = (c.throttleDays ?? THROTTLE_DAYS) * 86_400_000;
    if (c.nowMs - c.lastShownMs < windowMs) return false; // throttled
  }
  return true;
}

function readLastShownMs(): number | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const ms = Date.parse(readFileSync(STATE_FILE, 'utf-8').trim());
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null; // a read error must never block scoring
  }
}

function record(nowMs: number): void {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, new Date(nowMs).toISOString());
  } catch {
    /* a nudge must never fail a command */
  }
}

/** Emit the one-line star nudge if all gates pass, then record it. Side-effecting wrapper over shouldNudge. */
export function maybeStarNudge(score: number): void {
  const nowMs = Date.now();
  const show = shouldNudge({
    score,
    isTTY: Boolean(process.stdout.isTTY),
    isCI: Boolean(process.env.CI),
    optedOut: Boolean(process.env.FAF_NO_NUDGE),
    lastShownMs: readLastShownMs(),
    nowMs,
  });
  if (!show) return;
  console.log('');
  console.log(`  ${orange('★')} ${dim('Enjoying faf-cli? A star helps others find it:')} ${REPO}`);
  record(nowMs);
}
