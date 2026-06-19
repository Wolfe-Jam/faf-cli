import { describe, test, expect } from 'bun:test';
import { buildTableOf8 } from '../../src/core/interview';

// WJTTC — buildTableOf8 (the 8Qs flow keystone).
//
// Contract: exactly 8 rows in flow order; each is filled (already in the .faf),
// seeded (a goal-FACT suggestion awaiting approval), or empty (only the human
// knows). WHY/WHEN/HOW are NEVER seeded. Seeds are verbatim facts (via
// seedSixWsFromGoal). Pure. Nothing committed — the table is for approval.

const PATHS = ['project.name', 'project.goal', 'human_context.who', 'human_context.what', 'human_context.why', 'human_context.where', 'human_context.when', 'human_context.how'];

describe('BRAKE — shape + the never-seed guarantee', () => {
  test('B1 — always exactly 8 rows, in canonical flow order', () => {
    const t = buildTableOf8({ project: { goal: 'X CLI for developers' } });
    expect(t.rows.length).toBe(8);
    expect(t.rows.map((r) => r.path)).toEqual(PATHS);
    expect(t.rows.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('B2 — WHY/WHEN/HOW are NEVER seeded (filled or empty only)', () => {
    const goals = [
      'Universal .faf MCP server for developers using Cursor. npm, Cloudflare, Docker.',
      'High-performance Rust CLI for Rust developers. crates.io.',
      'Portable cross-vendor AI memory',
    ];
    for (const goal of goals) {
      const t = buildTableOf8({ project: { goal } });
      for (const w of ['human_context.why', 'human_context.when', 'human_context.how']) {
        const row = t.rows.find((r) => r.path === w)!;
        expect(row.seeded, `${w} must never be seeded`).toBe(false);
        expect(row.status).not.toBe('seeded');
      }
    }
  });

  test('B3 — every seeded value is a verbatim fact from the goal', () => {
    const goal = 'Universal .faf MCP server for developers using Cursor and Windsurf. npm, Cloudflare.';
    const t = buildTableOf8({ project: { goal } });
    const gl = goal.toLowerCase();
    for (const r of t.rows) {
      if (r.seeded && r.path !== 'project.goal') {
        expect(gl.includes(r.value.toLowerCase()), `${r.path}: ${r.value}`).toBe(true);
      }
    }
  });

  test('B4 — counts + complete are consistent', () => {
    const t = buildTableOf8({ project: { goal: 'X CLI for developers' } });
    expect(t.filledCount + t.seededCount + t.emptyCount).toBe(8);
    expect(t.complete).toBe(t.emptyCount === 0);
  });
});

describe('ENGINE — filled / seeded / empty', () => {
  test('E1 — goal-only .faf: name+goal filled, who/what/where seeded, why/when/how empty', () => {
    const t = buildTableOf8({ project: { name: 'faf-mcp', goal: 'Universal .faf MCP server for developers using Cursor. npm, Cloudflare.' } });
    const byPath = Object.fromEntries(t.rows.map((r) => [r.path, r]));
    expect(byPath['project.name'].status).toBe('filled');
    expect(byPath['project.goal'].status).toBe('filled');
    expect(byPath['human_context.what'].status).toBe('seeded');
    expect(byPath['human_context.where'].status).toBe('seeded');
    expect(byPath['human_context.who'].status).toBe('seeded');
    expect(byPath['human_context.why'].status).toBe('empty');
    expect(byPath['human_context.when'].status).toBe('empty');
    expect(byPath['human_context.how'].status).toBe('empty');
  });

  test('E2 — a complete .faf → all filled, complete:true, zero seeded', () => {
    const faf = {
      project: { name: 'p', goal: 'A real goal sentence here' },
      human_context: { who: 'devs', what: 'a thing', why: 'a reason', where: 'npm', when: 'v1', how: 'cli' },
    };
    const t = buildTableOf8(faf);
    expect(t.complete).toBe(true);
    expect(t.filledCount).toBe(8);
    expect(t.seededCount).toBe(0);
  });

  test('E3 — opts.goal seeds when the .faf has no goal yet', () => {
    const t = buildTableOf8({}, { goal: 'Rust CLI for Rust developers. crates.io.' });
    const byPath = Object.fromEntries(t.rows.map((r) => [r.path, r]));
    expect(byPath['project.goal'].status).toBe('seeded');
    expect(byPath['human_context.what'].value).toBe('Rust CLI');
    expect(byPath['human_context.where'].value).toBe('crates.io');
    expect(byPath['human_context.who'].value).toContain('Rust developers');
  });

  test('E4 — an existing .faf value WINS over a goal seed', () => {
    const t = buildTableOf8({
      project: { goal: 'MCP server' },
      human_context: { what: 'my own hand-written what' },
    });
    const what = t.rows.find((r) => r.path === 'human_context.what')!;
    expect(what.status).toBe('filled');
    expect(what.value).toBe('my own hand-written what');
    expect(what.seeded).toBe(false);
  });
});

describe('AERO — edges', () => {
  test('A1 — empty .faf → 8 rows, all empty, not complete', () => {
    const t = buildTableOf8({});
    expect(t.rows.length).toBe(8);
    expect(t.emptyCount).toBe(8);
    expect(t.complete).toBe(false);
  });

  test('A2 — slop goal seeds nothing (who/what/where stay empty)', () => {
    const t = buildTableOf8({ project: { goal: 'Improve development efficiency' } });
    for (const w of ['human_context.who', 'human_context.what', 'human_context.where']) {
      expect(t.rows.find((r) => r.path === w)!.status).toBe('empty');
    }
  });

  test('A3 — placeholder values are treated as empty, not filled', () => {
    const t = buildTableOf8({ project: { name: 'unknown', goal: 'none' } });
    expect(t.rows.find((r) => r.path === 'project.name')!.status).not.toBe('filled');
    expect(t.rows.find((r) => r.path === 'project.goal')!.status).not.toBe('filled');
  });

  test('A4 — deterministic', () => {
    const faf = { project: { goal: 'Rust CLI for Rust developers. crates.io.' } };
    expect(buildTableOf8(faf)).toEqual(buildTableOf8(faf));
  });
});

describe('PROVENANCE — seeded rows carry their source (auditable confirm)', () => {
  const get = (t: ReturnType<typeof buildTableOf8>, path: string) => t.rows.find((r) => r.path === path)!;

  test('P1 — goal-seeded rows are sourced to "project goal"', () => {
    const t = buildTableOf8({ project: { goal: 'A .faf MCP server for developers using Cursor. npm.' } });
    const who = get(t, 'human_context.who');
    expect(who.status).toBe('seeded');
    expect(who.source).toBe('project goal');
    expect(who.confidence).toBeGreaterThan(0);
  });

  test('P2 — detailed README extraction seeds WHY/WHEN/HOW with their own provenance', () => {
    const detailed = {
      why: { value: 'eliminate the context tax', source: 'README:## Why', confidence: 0.8 },
      how: { value: 'npm run build', source: 'package.json:scripts', confidence: 0.9 },
    };
    const t = buildTableOf8({ project: { goal: 'A tool for developers' } }, { detailed });
    const why = get(t, 'human_context.why');
    expect(why.status).toBe('seeded');             // goal never seeds WHY — the README did
    expect(why.value).toBe('eliminate the context tax');
    expect(why.source).toBe('README:## Why');
    expect(why.confidence).toBe(0.8);
    expect(get(t, 'human_context.how').source).toBe('package.json:scripts');
  });

  test('P3 — goal wins over README where both have a fact (deliberate sentence beats extraction)', () => {
    const detailed = { who: { value: 'from the readme', source: 'README:## Audience', confidence: 0.8 } };
    const t = buildTableOf8({ project: { goal: 'A CLI for developers and teams' } }, { detailed });
    const who = get(t, 'human_context.who');
    expect(who.source).toBe('project goal');       // goal-seed, not the README fallback
    expect(who.value.toLowerCase()).toContain('developers');
  });

  test('P4 — filled and empty rows carry NO source/confidence', () => {
    const t = buildTableOf8({ project: { name: 'x', goal: 'A CLI' }, human_context: { who: 'developers' } });
    const filled = get(t, 'human_context.who');
    expect(filled.status).toBe('filled');
    expect(filled.source).toBeUndefined();
    const empty = get(t, 'human_context.when');
    expect(empty.status).toBe('empty');
    expect(empty.source).toBeUndefined();
  });

  test('P5 — goal-only (no detailed) is unchanged: WHY/WHEN/HOW still never seeded', () => {
    const t = buildTableOf8({ project: { goal: 'A .faf MCP server for developers. npm, Docker.' } });
    for (const w of ['human_context.why', 'human_context.when', 'human_context.how']) {
      expect(get(t, w).status).not.toBe('seeded');
    }
  });
});
