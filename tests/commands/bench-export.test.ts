/**
 * WJTTC — bench engine public export (the bench export spec, 2026-06-12)
 *
 * BRAKE: deriveQuestionSet / gradeAnswers / buildReceipt become PUBLIC API —
 * MCPs compose the grounding benchmark through the bridge (a future faf_bench
 * tool). Semver-stable from here:
 *   - mechanical grading, no judge ("a miss is a miss")
 *   - ✪ receipt = sha256 over canonical projection, third-party re-derivable
 *     (same convention as parity P3 and trust P4)
 *   - THE ANSWER KEY NEVER LEAKS — publicQuestions() is the only shape a
 *     "give me the questions" surface may hand out. A tool that prints
 *     `answers` makes the benchmark a lie.
 *   - pure functions (no disk); .faf-bench.json I/O stays CLI-internal
 */
import { describe, test, expect } from 'bun:test';
import { createHash } from 'crypto';
import * as api from '../../src/index.js';

const FAF = `faf_version: "2.5.0"
project:
  name: export-test
  goal: prove the bench export
  main_language: TypeScript
stack:
  frontend: slotignored
  runtime: Node.js
human_context:
  who: bridge consumers
  what: a composed benchmark
  why: one engine everywhere
  where: npm
  when: now
  how: through the bridge
`;

describe('ENGINE: WJTTC — bench export: present AND populated', () => {
  test('all spec exports present on the public API', () => {
    for (const k of ['BENCH_VERSION', 'deriveQuestionSet', 'publicQuestions', 'gradeAnswers', 'buildReceipt', 'normalizeAnswer', 'answersMatch', 'ALIAS_GROUPS'] as const) {
      expect(k in api).toBe(true);
    }
    expect(api.BENCH_VERSION).toBe('faf-bench/1');
    expect(api.ALIAS_GROUPS.length).toBeGreaterThan(0);
  });

  test('POPULATED on a real .faf — direct value inspection, no stringified dumps', () => {
    const qset = api.deriveQuestionSet(FAF);
    expect(qset.questions.length).toBeGreaterThan(0);
    expect(qset.qsetHash).toMatch(/^[0-9a-f]{12}$/);
    expect(Object.keys(qset.answers).length).toBe(qset.questions.length);
    // QuestionSet is plain-object/JSON-safe (unlike a Map) — prove it:
    const rt = JSON.parse(JSON.stringify(qset));
    expect(rt.questions.length).toBe(qset.questions.length);
    expect(Object.keys(rt.answers).length).toBe(qset.questions.length);
  });
});

describe('BRAKE: WJTTC — THE INTEGRITY CLAUSE: the answer key never leaks', () => {
  test('publicQuestions strips `answers` — and carries everything a consumer needs', () => {
    const qset = api.deriveQuestionSet(FAF);
    const pub = api.publicQuestions(qset);
    expect('answers' in pub).toBe(false);
    expect(JSON.stringify(pub)).not.toContain('export-test'); // no answer VALUE leaks either
    expect(pub.version).toBe(qset.version);
    expect(pub.qsetHash).toBe(qset.qsetHash);
    expect(pub.questions).toEqual(qset.questions);
  });

  test('question text itself never contains answer values', () => {
    const qset = api.deriveQuestionSet(FAF);
    for (const q of qset.questions) {
      const answer = qset.answers[q.n];
      expect(q.question.toLowerCase()).not.toContain(answer.toLowerCase());
    }
  });
});

describe('AERO: WJTTC — mechanical grading is deterministic (semver-locked)', () => {
  test('grade twice → identical; perfect key → N/N; empty → 0/N', () => {
    const qset = api.deriveQuestionSet(FAF);
    const perfect: Record<string, string> = {};
    for (const q of qset.questions) perfect[String(q.n)] = qset.answers[q.n];
    const g1 = api.gradeAnswers(qset, perfect);
    expect(g1.correct).toBe(g1.total);
    expect(api.gradeAnswers(qset, perfect)).toEqual(g1);
    const g0 = api.gradeAnswers(qset, {});
    expect(g0.correct).toBe(0);
    expect(g0.total).toBe(qset.questions.length);
  });

  test('same .faf → same qsetHash (the consumer-side determinism anchor)', () => {
    expect(api.deriveQuestionSet(FAF).qsetHash).toBe(api.deriveQuestionSet(FAF).qsetHash);
  });
});

describe('TYRE: WJTTC — ✪ receipt constructible OUTSIDE faf-cli (BenchState/RunRecord promoted)', () => {
  test('a consumer builds state from promoted types and re-derives the hash', () => {
    // This is exactly what a faf_bench MCP tool does — typed, no casts:
    const cold: import('../../src/commands/bench.js').RunRecord = { score: 9, total: 15, tokens: 14200, model: 'claude' };
    const faf: import('../../src/commands/bench.js').RunRecord = { score: 15, total: 15, tokens: 210, model: 'claude' };
    const state: import('../../src/commands/bench.js').BenchState = {
      version: api.BENCH_VERSION,
      qsetHash: 'abc123def456',
      protocol: 'in-session',
      cold,
      faf,
    };
    const r = api.buildReceipt(state);
    // Third-party re-derivation — the ✪ convention shared with parity + trust:
    expect(createHash('sha256').update(r.projection).digest('hex')).toBe(r.hash);
    const proj = JSON.parse(r.projection);
    expect(proj.cold.score).toBe(9);
    expect(proj.faf.score).toBe(15);
  });
});
