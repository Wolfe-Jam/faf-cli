/**
 * WJTTC — faf bench (P1, agent-native grounding benchmark)
 *
 * BRAKE: the benchmark must be DETERMINISTIC end to end — same .faf, same
 * questions, same hash, same grades, any machine, any day. The .faf is the
 * answer key; the grader is mechanical (normalize + versioned aliases +
 * significant-token containment). No judge, no rubric drift.
 *
 * DOCTRINE receipts:
 *  - slotignored slots are NEVER quiz topics (the What-Not stays invisible)
 *  - the answer key never leaks through `questions` output
 *  - receipt hash = sha256 over a canonical projection (parity discipline)
 */
import { describe, test, expect } from 'bun:test';
import {
  deriveQuestionSet,
  gradeAnswers,
  normalizeAnswer,
  answersMatch,
  buildReceipt,
  BENCH_VERSION,
} from '../../src/commands/bench.js';

const FAF = `faf_version: "2.5.0"
project:
  name: bench-test
  goal: Prove grounding deterministically
  main_language: TypeScript
  type: mcp
stack:
  frontend: slotignored
  css_framework: slotignored
  backend: MCP SDK (TS)
  api_type: MCP (stdio)
  runtime: Node.js
  hosting: npm
  build: tsc
  cicd: GitHub Actions
human_context:
  who: Claude devs
  what: a benchmark harness
  why: prove context closes the gap
  where: npm and the MCP registry
  when: shipped 2026
  how: faf bench in any repo
`;

describe('WJTTC — faf bench question derivation', () => {
  test('derives questions ONLY from populated active slots', () => {
    const qs = deriveQuestionSet(FAF);
    const paths = qs.questions.map((q) => q.path);
    expect(paths).toContain('project.name');
    expect(paths).toContain('human_context.why');
    expect(paths).toContain('stack.backend');
    // slotignored = the What-Not — never a quiz topic
    expect(paths).not.toContain('stack.frontend');
    expect(paths).not.toContain('stack.css_framework');
  });

  test('deterministic: same .faf → same questions, same qset hash', () => {
    const a = deriveQuestionSet(FAF);
    const b = deriveQuestionSet(FAF);
    expect(a.qsetHash).toBe(b.qsetHash);
    expect(a.questions).toEqual(b.questions);
    expect(a.version).toBe(BENCH_VERSION);
  });

  test('qset hash covers phrasings, not answers (different values, same slots → same hash)', () => {
    const other = FAF.replace('bench-test', 'different-name').replace('Claude devs', 'Gemini devs');
    expect(deriveQuestionSet(other).qsetHash).toBe(deriveQuestionSet(FAF).qsetHash);
  });

  test('the answer key exists internally but holds the real values', () => {
    const qs = deriveQuestionSet(FAF);
    const nameQ = qs.questions.find((q) => q.path === 'project.name')!;
    expect(qs.answers[nameQ.n]).toBe('bench-test');
  });
});

describe('WJTTC — mechanical grading', () => {
  test('normalize: case, punctuation, whitespace', () => {
    expect(normalizeAnswer('  TypeScript! ')).toBe('typescript');
    expect(normalizeAnswer('GitHub Actions.')).toBe('github actions');
  });

  test('exact + alias-group matches', () => {
    expect(answersMatch('TypeScript', 'typescript')).toBe(true);
    expect(answersMatch('TypeScript', 'TS')).toBe(true);
    expect(answersMatch('GitHub Actions', 'gh actions')).toBe(true);
    expect(answersMatch('Node.js', 'node')).toBe(true);
    expect(answersMatch('TypeScript', 'Python')).toBe(false);
  });

  test('significant-token containment grades sentence-shaped 6W answers', () => {
    expect(answersMatch('Claude devs', 'It is built for Claude devs')).toBe(true);
    expect(answersMatch('prove context closes the gap', 'to prove that context closes the gap')).toBe(true);
    expect(answersMatch('Claude devs', 'for web designers')).toBe(false);
  });

  test('empty/missing answers are misses — a miss is a miss', () => {
    const qs = deriveQuestionSet(FAF);
    const graded = gradeAnswers(qs, {});
    expect(graded.correct).toBe(0);
    expect(graded.total).toBe(qs.questions.length);
  });

  test('perfect answers grade N/N', () => {
    const qs = deriveQuestionSet(FAF);
    const perfect: Record<string, string> = {};
    for (const q of qs.questions) perfect[String(q.n)] = qs.answers[q.n];
    const graded = gradeAnswers(qs, perfect);
    expect(graded.correct).toBe(graded.total);
    expect(graded.misses).toEqual([]);
  });

  test('grading is deterministic across runs', () => {
    const qs = deriveQuestionSet(FAF);
    const partial = { '1': qs.answers[1], '2': 'wrong answer entirely' };
    expect(gradeAnswers(qs, partial)).toEqual(gradeAnswers(qs, partial));
  });
});

describe('WJTTC — ✪ receipt (parity discipline)', () => {
  test('sha256 over canonical projection; verifiable by a third party', () => {
    const state = {
      version: BENCH_VERSION,
      qsetHash: 'abc123def456',
      protocol: 'in-session' as const,
      cold: { score: 9, total: 20, tokens: 14200 },
      faf: { score: 20, total: 20, tokens: 210 },
    };
    const r = buildReceipt(state);
    // Third-party verification: sha256(projection) === hash
    const { createHash } = require('crypto');
    expect(createHash('sha256').update(r.projection).digest('hex')).toBe(r.hash);
    // Projection carries both runs — the pair, never a lone number
    const proj = JSON.parse(r.projection);
    expect(proj.cold.score).toBe(9);
    expect(proj.faf.score).toBe(20);
  });

  test('same state → same hash; any change → different hash', () => {
    const base = { version: BENCH_VERSION, qsetHash: 'x', protocol: 'in-session' as const, cold: { score: 9, total: 20 } };
    expect(buildReceipt(base).hash).toBe(buildReceipt({ ...base }).hash);
    expect(buildReceipt({ ...base, cold: { score: 10, total: 20 } }).hash).not.toBe(buildReceipt(base).hash);
  });
});
