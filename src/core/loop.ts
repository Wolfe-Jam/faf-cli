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
  const ask = status === 'needs-human'
    ? gaps.human.map((path) => ({ path, question: questionForSlot(path) }))
    : [];
  return { status, score, gaps, ask };
}
