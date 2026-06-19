import { describe, test, expect } from 'bun:test';
import { classifyGaps, loopVerdict, isHumanSlot } from '../../src/core/loop';

// WJTTC — the faf_loop decision core (the brain of "100% or ask human").
//
// BRAKE: the human/sourced boundary at runtime — the loop must NEVER class a
//   human slot (goal + 6Ws) as sourceable (that's the road to fabricating
//   intent to hit 100%). needs-human is an honest terminal, not a failure.
// ENGINE: classify → verdict, with source-first precedence (exhaust sourceable
//   before asking the human).

describe('BRAKE — the human/sourced boundary', () => {
  test('the goal + the 6Ws are HUMAN; name + language + stack are SOURCEABLE', () => {
    expect(isHumanSlot('project.goal')).toBe(true);
    for (const w of ['who', 'what', 'why', 'where', 'when', 'how']) {
      expect(isHumanSlot(`human_context.${w}`)).toBe(true);
    }
    for (const p of ['project.name', 'project.main_language', 'stack.backend', 'stack.runtime', 'stack.cicd']) {
      expect(isHumanSlot(p), p).toBe(false);
    }
  });

  test('classifyGaps never puts a human slot in the sourceable bucket', () => {
    const gaps = classifyGaps({}); // empty .faf → everything is a gap
    for (const p of gaps.sourceable) expect(isHumanSlot(p)).toBe(false);
    for (const p of gaps.human) expect(isHumanSlot(p)).toBe(true);
    expect(gaps.human).toContain('project.goal');
    expect(gaps.human).toContain('human_context.why');
  });

  test('slotignored (the What-Not) is never a gap', () => {
    const gaps = classifyGaps({ stack: { backend: 'slotignored' }, project: { main_language: 'slotignored' } });
    expect(gaps.sourceable).not.toContain('stack.backend');
    expect(gaps.sourceable).not.toContain('project.main_language');
  });
});

describe('ENGINE — verdict + source-first precedence', () => {
  test('100% → done, nothing to ask', () => {
    const v = loopVerdict(100, {});
    expect(v.status).toBe('done');
    expect(v.ask).toEqual([]);
  });

  test('no gaps → done (even below 100, e.g. all remaining are slotignored)', () => {
    const faf = {
      project: { name: 'p', goal: 'a real goal', main_language: 'TypeScript' },
      human_context: { who: 'devs', what: 'a thing', why: 'a reason', where: 'npm', when: 'v1', how: 'cli' },
      stack: { backend: 'slotignored', runtime: 'Node', frontend: 'slotignored', database: 'slotignored', api_type: 'MCP', hosting: 'npm', build: 'tsc', cicd: 'GHA', css_framework: 'slotignored', ui_library: 'slotignored', state_management: 'slotignored', connection: 'slotignored' },
    };
    expect(loopVerdict(85, faf).status).toBe('done');
  });

  test('sourceable gaps present → can-source (keep looping, run auto) — even if humans are ALSO missing', () => {
    // language + stack empty, 6Ws also empty → source FIRST
    const v = loopVerdict(20, { project: { name: 'p' } });
    expect(v.status).toBe('can-source');
    expect(v.gaps.sourceable.length).toBeGreaterThan(0);
    expect(v.gaps.human.length).toBeGreaterThan(0); // humans pending, but not yet asked
    expect(v.ask).toEqual([]);                       // don't ask while sourceable work remains
  });

  test('ONLY human gaps remain → needs-human, with the questions to ask', () => {
    // everything sourceable filled; only the goal + some 6Ws missing
    const faf = {
      project: { name: 'p', main_language: 'TypeScript' },
      stack: { backend: 'slotignored', runtime: 'Node', frontend: 'slotignored', database: 'slotignored', api_type: 'MCP', hosting: 'npm', build: 'tsc', cicd: 'GHA', css_framework: 'slotignored', ui_library: 'slotignored', state_management: 'slotignored', connection: 'slotignored' },
    };
    const v = loopVerdict(60, faf);
    expect(v.status).toBe('needs-human');
    expect(v.gaps.sourceable).toEqual([]);
    expect(v.ask.length).toBeGreaterThan(0);
    expect(v.ask.map((a) => a.path)).toContain('project.goal');
    for (const a of v.ask) {
      expect(isHumanSlot(a.path)).toBe(true);  // we only ever ask the human for human slots
      expect(a.question.length).toBeGreaterThan(0);
    }
  });

  test('deterministic — same snapshot, same verdict', () => {
    const faf = { project: { name: 'p' } };
    expect(loopVerdict(20, faf)).toEqual(loopVerdict(20, faf));
  });
});
