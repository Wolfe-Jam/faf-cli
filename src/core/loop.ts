/**
 * The faf_loop decision core — the brain of "100% or ask human".
 *
 * A pure, snapshot decision: given a parsed .faf, classify its remaining gaps
 * as SOURCEABLE (detection can fill — language, stack: no human needed) or
 * HUMAN (only the human knows — the goal + the 6Ws), and return a verdict:
 *
 *   done        — nothing left (or already 100%). Stop, success.
 *   can-source  — sourceable gaps remain → the loop runs auto and re-scores.
 *   needs-human — ONLY human gaps remain → the wall; ask (or seed-and-confirm).
 *
 * The classification IS the human/sourced boundary at runtime: a slot is human
 * iff its slot category is 'human' (the 6Ws) or it's the goal sentence. The
 * loop sources everything it can FIRST (minimise human asks); only when the
 * sourceable well is dry does it turn to the human. It never invents a human
 * slot to reach 100% — needs-human is a legitimate, honest terminal, not a
 * failure.
 *
 * This is the deterministic engine the CLI `faf loop` and the agentic
 * `/faf-loop` skill both decide from. Orchestration (run auto, re-score, the
 * no-progress + iteration-cap guards) lives in the command on top of this.
 */

import { INTERVIEW, questionForSlot } from './interview.js';
import { SLOT_BY_PATH, isPlaceholder } from './slots.js';

export type LoopStatus = 'done' | 'can-source' | 'needs-human';

export interface LoopGaps {
  /** Empty active slots only the human can give — the goal + the 6Ws. */
  human: string[];
  /** Empty active slots detection can fill — language + the stack. */
  sourceable: string[];
}

export interface LoopVerdict {
  status: LoopStatus;
  score: number;
  gaps: LoopGaps;
  /** The questions to put to the human — populated only when status is
   *  'needs-human' (sourceable work is done; the human is all that's left). */
  ask: Array<{ path: string; question: string }>;
}

/** Default empty test: null/undefined, blank, or a placeholder token. The
 *  What-Not (`slotignored`) is handled separately — it is never a gap. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' || isPlaceholder(t);
  }
  return false;
}

function valueAtPath(data: Record<string, unknown>, path: string): unknown {
  let cur: unknown = data;
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** A path is HUMAN (only the human can give it) iff it is the goal sentence or
 *  its slot category is 'human' (the 6Ws). Everything else — name, language,
 *  the stack — is sourceable by detection. */
export function isHumanSlot(path: string): boolean {
  if (path === 'project.goal') return true;
  return SLOT_BY_PATH.get(path)?.category === 'human';
}

/**
 * Classify the empty, non-ignored interviewable slots of a .faf into human vs
 * sourceable. Scope = the interviewable slots (the 6Ws + name + goal + the core
 * stack); `slotignored` (the What-Not) is never a gap.
 */
export function classifyGaps(
  data: Record<string, unknown>,
  isEmpty: (value: unknown) => boolean = isEmptyValue,
): LoopGaps {
  const human: string[] = [];
  const sourceable: string[] = [];
  for (const q of INTERVIEW) {
    const v = valueAtPath(data, q.path);
    if (v === 'slotignored') continue; // the What-Not is never interviewed
    if (!isEmpty(v)) continue; // already filled
    (isHumanSlot(q.path) ? human : sourceable).push(q.path);
  }
  return { human, sourceable };
}

/**
 * The loop verdict for a .faf snapshot. `score` is the current AI-readiness
 * score (the loop's termination test). Precedence is deliberate: source
 * everything possible BEFORE asking the human — so 'can-source' wins while any
 * sourceable gap remains, and 'needs-human' fires only once they're exhausted.
 */
export function loopVerdict(
  score: number,
  data: Record<string, unknown>,
  isEmpty: (value: unknown) => boolean = isEmptyValue,
): LoopVerdict {
  const gaps = classifyGaps(data, isEmpty);
  let status: LoopStatus;
  if (score >= 100 || (gaps.human.length === 0 && gaps.sourceable.length === 0)) {
    status = 'done';
  } else if (gaps.sourceable.length > 0) {
    status = 'can-source';
  } else {
    status = 'needs-human';
  }
  const ask = status === 'needs-human' ? humanAsk(gaps) : [];
  return { status, score, gaps, ask };
}

/** The questions to put to the human for a set of gaps — its human slots,
 *  paired with their interview prompt. The single source for the ask. */
function humanAsk(gaps: LoopGaps): Array<{ path: string; question: string }> {
  return gaps.human.map((path) => ({ path, question: questionForSlot(path) }));
}

// ── Orchestration ────────────────────────────────────────────────────────────
//
// runLoop drives the snapshot verdict to a terminal: read → score → verdict →
// (can-source) run auto → repeat. Dependencies are INJECTED so the driver is
// pure and testable without real file IO; the CLI `faf loop` wires the real
// read / score / auto. Two safety rails, because a loop that runs auto must
// never spin: a hard round cap, and no-progress detection (if a round of auto
// doesn't lift the score, the sourceable well is dry — stop, don't churn).

export type LoopRunStatus =
  | 'done'         // reached 100% / no gaps — success
  | 'needs-human'  // sourceable exhausted; only the human can finish (honest wall)
  | 'stuck'        // sourceable gaps auto can't fill, and no human gaps to ask
  | 'capped'       // hit the round cap still making progress
  | 'no-faf';      // nothing to read — caller must create one first

export interface LoopDeps {
  /** The current .faf as {data, yaml}, or null when none exists. */
  read(): { data: Record<string, unknown>; yaml: string } | null;
  /** Score raw .faf yaml → 0..100 (the termination test). */
  score(yaml: string): number;
  /** Source what detection can (auto): fill the stack and WRITE the .faf. */
  runAuto(): void;
}

export interface LoopRunOptions {
  /** Hard cap on auto rounds (default 5). */
  maxRounds?: number;
  isEmpty?: (value: unknown) => boolean;
}

export interface LoopRunResult {
  status: LoopRunStatus;
  score: number;
  /** Auto rounds actually run. */
  rounds: number;
  /** Score after each read — the climb, for narration. */
  history: number[];
  /** The human questions to put — populated only when status is 'needs-human'. */
  ask: Array<{ path: string; question: string }>;
}

export function runLoop(deps: LoopDeps, opts: LoopRunOptions = {}): LoopRunResult {
  const maxRounds = Math.max(1, opts.maxRounds ?? 5);
  const isEmpty = opts.isEmpty ?? isEmptyValue;
  const history: number[] = [];
  let rounds = 0;

  // One iteration per read; at most maxRounds auto runs between them.
  for (let i = 0; i <= maxRounds; i++) {
    const snap = deps.read();
    if (!snap) return { status: 'no-faf', score: 0, rounds, history, ask: [] };

    const score = deps.score(snap.yaml);
    history.push(score);
    const verdict = loopVerdict(score, snap.data, isEmpty);

    if (verdict.status === 'done') {
      return { status: 'done', score, rounds, history, ask: [] };
    }
    if (verdict.status === 'needs-human') {
      return { status: 'needs-human', score, rounds, history, ask: verdict.ask };
    }

    // can-source — but did the LAST auto round actually move the score?
    if (history.length >= 2 && score <= history[history.length - 2]) {
      // No progress: the sourceable well is dry (auto can't fill what's left).
      // Defer to the human if there are human gaps; otherwise we're stuck.
      // Build the ask from gaps.human directly — `verdict.ask` is empty here
      // (the verdict is 'can-source', which never carries questions).
      return verdict.gaps.human.length
        ? { status: 'needs-human', score, rounds, history, ask: humanAsk(verdict.gaps) }
        : { status: 'stuck', score, rounds, history, ask: [] };
    }

    if (rounds >= maxRounds) {
      return { status: 'capped', score, rounds, history, ask: humanAsk(verdict.gaps) };
    }

    deps.runAuto();
    rounds++;
  }

  // Defined fallthrough (the cap check above returns first in practice).
  const last = history[history.length - 1] ?? 0;
  return { status: 'capped', score: last, rounds, history, ask: [] };
}
