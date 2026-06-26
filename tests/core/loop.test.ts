import { describe, test, expect } from 'bun:test';
import { classifyGaps, loopVerdict, isHumanSlot, runLoop } from '../../src/core/loop';
import type { LoopDeps } from '../../src/core/loop';

// A scripted mock: a sequence of {data, score} snapshots. read()/score() see the
// current snapshot; runAuto() advances to the next — simulating auto filling
// slots over rounds, with NO real file IO.
const scripted = (script: Array<{ data: Record<string, unknown>; score: number }>): LoopDeps => {
  let i = 0;
  return {
    read: () => (script[i] ? { data: script[i].data, yaml: 'y' } : null),
    score: () => script[i].score,
    runAuto: () => { if (i < script.length - 1) i++; },
  };
};

// A .faf with every SOURCEABLE interviewable slot filled/ignored → only humans left.
const SOURCED_NO_HUMANS = {
  project: { name: 'p', main_language: 'TypeScript' },
  stack: { backend: 'slotignored', runtime: 'Node', frontend: 'slotignored', database: 'slotignored', api_type: 'MCP', hosting: 'npm', build: 'tsc', cicd: 'GHA', css_framework: 'slotignored', ui_library: 'slotignored', state_management: 'slotignored', connection: 'slotignored' },
};
// Humans all filled, ONE sourceable stack slot still empty.
const HUMANS_DONE_ONE_STACK_GAP = {
  project: { name: 'p', goal: 'a real goal', main_language: 'TypeScript' },
  human_context: { who: 'devs', what: 'a thing', why: 'a reason', where: 'npm', when: 'v1', how: 'cli' },
  stack: { backend: '', runtime: 'Node', frontend: 'slotignored', database: 'slotignored', api_type: 'MCP', hosting: 'npm', build: 'tsc', cicd: 'GHA', css_framework: 'slotignored', ui_library: 'slotignored', state_management: 'slotignored', connection: 'slotignored' },
};

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

describe('ENGINE: ORCHESTRATION — runLoop drives to a terminal (injected deps, no IO)', () => {
  const empty = { project: { name: 'p' } };

  test('already complete → done immediately, zero auto rounds', () => {
    const r = runLoop(scripted([{ data: empty, score: 100 }]));
    expect(r.status).toBe('done');
    expect(r.rounds).toBe(0);
    expect(r.history).toEqual([100]);
  });

  test('sources its way to 100 → done, with the climb recorded', () => {
    const r = runLoop(scripted([
      { data: empty, score: 5 },   // can-source
      { data: empty, score: 60 },  // can-source (still gaps in data; score < 100)
      { data: empty, score: 100 }, // score 100 short-circuits → done
    ]));
    expect(r.status).toBe('done');
    expect(r.rounds).toBe(2);
    expect(r.history).toEqual([5, 60, 100]); // the climb, for narration
  });

  test('sources the stack, then hits the human wall → needs-human with questions', () => {
    const r = runLoop(scripted([
      { data: empty, score: 20 },               // sourceable + human gaps → can-source
      { data: SOURCED_NO_HUMANS, score: 60 },   // only human gaps → needs-human
    ]));
    expect(r.status).toBe('needs-human');
    expect(r.ask.length).toBeGreaterThan(0);
    expect(r.ask.map((a) => a.path)).toContain('project.goal');
    for (const a of r.ask) expect(isHumanSlot(a.path)).toBe(true);
  });

  test('no-progress + human gaps remain → stop and ask the human (no spinning)', () => {
    const r = runLoop(scripted([
      { data: empty, score: 20 },
      { data: empty, score: 20 }, // auto ran but score did not move
    ]));
    expect(r.status).toBe('needs-human');
    expect(r.rounds).toBe(1);   // ran auto once, then detected no progress
  });

  test('no-progress + only un-sourceable stack gap, humans done → stuck (nothing to ask)', () => {
    const r = runLoop(scripted([
      { data: HUMANS_DONE_ONE_STACK_GAP, score: 90 },
      { data: HUMANS_DONE_ONE_STACK_GAP, score: 90 }, // auto can't fill the stack gap
    ]));
    expect(r.status).toBe('stuck');
    expect(r.ask).toEqual([]);
  });

  test('hits the round cap while still climbing → capped', () => {
    const r = runLoop(scripted([
      { data: empty, score: 10 },
      { data: empty, score: 20 },
      { data: empty, score: 30 },
    ]), { maxRounds: 2 });
    expect(r.status).toBe('capped');
    expect(r.rounds).toBe(2);
  });

  test('no .faf to read → no-faf (caller must create one first)', () => {
    const r = runLoop({ read: () => null, score: () => 0, runAuto: () => {} });
    expect(r.status).toBe('no-faf');
    expect(r.rounds).toBe(0);
  });
});
