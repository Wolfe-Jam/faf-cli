/**
 * WJTTC — the 6Ws Interview single source (core/interview.ts)
 *
 * BRAKE: this registry is consumed cross-repo (claude-faf-mcp's faf_go
 * imports it). Its shape and semantics are a CONTRACT:
 *  - the 8-Q core = project identity (name, goal) + the six Ws
 *  - every question maps to a REAL canonical slot path (slots.ts is the spine)
 *  - slotignored is never interviewed (the What-Not stays invisible)
 *  - questionForSlot gives every slot an interview voice (registry or derived)
 */
import { describe, test, expect } from 'bun:test';
import {
  INTERVIEW,
  SIX_WS_INTERVIEW,
  STACK_INTERVIEW,
  INTERVIEW_BY_PATH,
  INTERVIEW_VERSION,
  questionForSlot,
  interviewForMissing,
} from '../../src/core/interview.js';
import { SLOTS, isPlaceholder } from '../../src/core/slots.js';

describe('WJTTC — the 8-Q core', () => {
  test('exactly 8 questions: name + goal + the six Ws', () => {
    expect(SIX_WS_INTERVIEW.length).toBe(8);
    const paths = SIX_WS_INTERVIEW.map((q) => q.path);
    expect(paths).toEqual([
      'project.name',
      'project.goal',
      'human_context.who',
      'human_context.what',
      'human_context.why',
      'human_context.where',
      'human_context.when',
      'human_context.how',
    ]);
  });

  test('all core questions are required', () => {
    expect(SIX_WS_INTERVIEW.every((q) => q.required)).toBe(true);
  });

  test('6W prompts carry the terse-label doctrine (3-4 words)', () => {
    const sixWs = SIX_WS_INTERVIEW.filter((q) => q.path.startsWith('human_context.'));
    expect(sixWs.length).toBe(6);
    sixWs.forEach((q) => expect(q.question).toContain('3-4 words'));
  });

  test('the canonical `how` semantic is built/used — NOT "how should AI assist" (the CFM drift this file kills)', () => {
    const how = INTERVIEW_BY_PATH.get('human_context.how')!;
    expect(how.question.toLowerCase()).toContain('built');
    expect(how.question.toLowerCase()).not.toContain('assist');
  });
});

describe('WJTTC — registry integrity (slots.ts is the spine)', () => {
  test('every interview path is a real canonical slot path', () => {
    const slotPaths = new Set(SLOTS.map((s) => s.path));
    for (const q of INTERVIEW) {
      expect(slotPaths.has(q.path)).toBe(true);
    }
  });

  test('no duplicate paths; full registry = core then stack, in order', () => {
    const paths = INTERVIEW.map((q) => q.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(INTERVIEW.slice(0, 8)).toEqual(SIX_WS_INTERVIEW);
    expect(INTERVIEW.slice(8)).toEqual(STACK_INTERVIEW);
  });

  test('selects always offer an escape hatch (Other/None/free entry)', () => {
    for (const q of INTERVIEW.filter((x) => x.type === 'select')) {
      const labels = (q.options ?? []).map((o) => o.label.toLowerCase());
      expect(labels.some((l) => l === 'other' || l === 'none')).toBe(true);
    }
  });

  test('headers are chip-sized (≤12 chars)', () => {
    INTERVIEW.forEach((q) => expect(q.header.length).toBeLessThanOrEqual(12));
  });

  test('version is stamped for consumer pinning', () => {
    expect(INTERVIEW_VERSION).toBe('faf-interview/1');
  });
});

describe('WJTTC — questionForSlot (one voice everywhere)', () => {
  test('registry slots get the registry question', () => {
    expect(questionForSlot('human_context.who')).toBe(INTERVIEW_BY_PATH.get('human_context.who')!.question);
  });

  test('non-registry slots derive a question from the slot description', () => {
    const q = questionForSlot('stack.state_management');
    expect(q.length).toBeGreaterThan(3);
    expect(q.endsWith('?')).toBe(true);
  });
});

describe('WJTTC — interviewForMissing', () => {
  const isEmpty = (v: unknown) => isPlaceholder(v);

  test('asks only what is empty; slotignored is NEVER interviewed', () => {
    const data = {
      project: { name: 'x', goal: '', main_language: 'TypeScript' },
      human_context: { who: 'devs', what: '', why: 'reasons', where: '', when: 'now', how: 'npm' },
      stack: { frontend: 'slotignored', backend: '', database: 'slotignored' },
    };
    const qs = interviewForMissing(data, isEmpty);
    const paths = qs.map((q) => q.path);
    expect(paths).toContain('project.goal');
    expect(paths).toContain('human_context.what');
    expect(paths).toContain('human_context.where');
    expect(paths).toContain('stack.backend');
    // populated → not asked
    expect(paths).not.toContain('project.name');
    expect(paths).not.toContain('human_context.who');
    // slotignored → the What-Not, never asked
    expect(paths).not.toContain('stack.frontend');
    expect(paths).not.toContain('stack.database');
  });

  test('fully populated .faf → no questions', () => {
    const data = {
      project: { name: 'x', goal: 'y', main_language: 'TS' },
      human_context: { who: 'a', what: 'b', why: 'c', where: 'd', when: 'e', how: 'f' },
      stack: { frontend: 'React', backend: 'Express', database: 'SQLite', runtime: 'Node', hosting: 'npm', build: 'tsc', cicd: 'GHA' },
    };
    expect(interviewForMissing(data, isEmpty)).toEqual([]);
  });

  test('deterministic: same data → same questions, registry order', () => {
    const data = { project: {}, human_context: {}, stack: {} };
    const a = interviewForMissing(data, isEmpty);
    const b = interviewForMissing(data, isEmpty);
    expect(a).toEqual(b);
    expect(a.map((q) => q.path)).toEqual(INTERVIEW.map((q) => q.path));
  });
});
