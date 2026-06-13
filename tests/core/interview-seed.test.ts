import { describe, test, expect } from 'bun:test';
import { seedSixWsFromGoal } from '../../src/core/interview';

// WJTTC — seedSixWsFromGoal (the 8Qs flow, goal-seed step).
//
// Contract: emit ONLY verbatim facts the goal literally contains — never
// synthesis, inference, or template defaults. Facts only · generic banned ·
// empty beats wrong. WHY/WHEN/HOW are never seeded. Calibrated against the real
// FAF fleet goals (the oracle).

// Real goals harvested from the fleet's project.faf files (+ 2 slop controls).
const FLEET: Array<[name: string, goal: string]> = [
  ['faf-mcp', 'The Interop MCP for Context. Universal .faf MCP server for Cursor, Windsurf, Cline, VS Code, and all MCP-compatible IDEs. IANA-registered application/vnd.faf+yaml.'],
  ['grok-faf-mcp', 'Persistent project context for xAI Grok. First MCP for Grok. IANA-registered .faf + .fafm.'],
  ['xai-faf-rust', 'High-performance Rust CLI — the FAFb compiler. Transforms .faf into .fafb. crates.io.'],
  ['xai-faf-zig', 'Zig-native CLI that generates GROK.md - 100% or nothing'],
  ['core', 'Championship TypeScript engine for FAF - Zero dependencies, ultra-strict'],
  ['fafm-engine', 'Portable cross-vendor AI memory'],
  ['faf-wasm-sdk', 'The compiler is the spec. 322KB of WASM. No server. No API calls.'],
  ['slash-nextjs', 'Token-Optimized AI Chat for developers building AI apps with Next.js and Vercel'],
  ['rust-faf-mcp', 'Rust MCP server for FAF — IANA-registered. Docker, crates.io.'],
  ['create-faf', 'Create FAF projects - Redirects to @faff/create'],
  ['SLOP-1', 'Improve development efficiency'],
  ['SLOP-2', 'Cloud platform for development teams'],
];

const BANNED = [
  'developers', 'development teams', 'development team', 'teams', 'development',
  'cloud platform', 'web platform', 'platform', 'best practices',
  'improve development efficiency', 'development efficiency',
  'modern development practices', 'production', 'stable', 'app', 'project', 'tool',
];

describe('BRAKE — facts only, generic banned, empty beats wrong', () => {
  test('B1 — every seeded what/who is a VERBATIM substring of its goal (no invention)', () => {
    for (const [name, goal] of FLEET) {
      const s = seedSixWsFromGoal(goal);
      const gl = goal.toLowerCase();
      if (s.what) expect(gl.includes(s.what.toLowerCase()), `${name} what`).toBe(true);
      if (s.who) expect(gl.includes(s.who.toLowerCase()), `${name} who`).toBe(true);
    }
  });

  test('B2 — no seeded value is a banned generic; slop goals seed NOTHING', () => {
    for (const [name, goal] of FLEET) {
      const s = seedSixWsFromGoal(goal);
      for (const v of Object.values(s)) {
        expect(BANNED.includes(String(v).toLowerCase().trim()), `${name}: ${v}`).toBe(false);
      }
    }
    expect(seedSixWsFromGoal('Improve development efficiency')).toEqual({});
    expect(seedSixWsFromGoal('Cloud platform for development teams')).toEqual({});
  });

  test('B5 — seeded what/who obey the terse rule: <6 words, no dangling connective', () => {
    const goals = [
      'High-performance Rust CLI for Rust developers and xAI integrators who need fast compilation',
      'Token-Optimized AI Chat for developers building AI apps with Next.js and Vercel',
      'Universal .faf MCP server for software engineers using many different IDE tools daily',
    ];
    for (const goal of goals) {
      const s = seedSixWsFromGoal(goal);
      for (const v of [s.what, s.who]) {
        if (!v) continue;
        expect(v.split(/\s+/).filter(Boolean).length, `"${v}" <6 words`).toBeLessThan(6);
        expect(/\b(?:with|and|or|using|for|to|that|the|of|by|via)$/i.test(v), `"${v}" dangling connective`).toBe(false);
      }
    }
  });

  test('B3 — WHY/WHEN/HOW are NEVER seeded (the human/sourced slots)', () => {
    for (const [, goal] of FLEET) {
      const s = seedSixWsFromGoal(goal) as Record<string, unknown>;
      expect('why' in s).toBe(false);
      expect('when' in s).toBe(false);
      expect('how' in s).toBe(false);
    }
  });

  test('B4 — WHERE values are only real platform labels whose token is present', () => {
    const KNOWN = new Set(['npm', 'PyPI', 'crates.io', 'Homebrew', 'Docker', 'Cloudflare', 'Vercel', 'Netlify', 'AWS', 'Cloud Run', 'edge', 'browser', 'WASM', 'GitHub', 'MCP Registry', 'Chrome Web Store', 'Smithery']);
    for (const [name, goal] of FLEET) {
      const s = seedSixWsFromGoal(goal);
      if (!s.where) continue;
      for (const label of s.where.split(', ')) {
        expect(KNOWN.has(label), `${name}: ${label}`).toBe(true);
        expect(goal.toLowerCase().includes(label.toLowerCase().split(' ')[0]), `${name}: ${label} token present`).toBe(true);
      }
    }
  });
});

describe('ENGINE — it DOES seed the facts a goal states', () => {
  test('E1 — WHAT = the leading noun phrase', () => {
    expect(seedSixWsFromGoal('The Interop MCP for Context.').what).toBe('The Interop MCP');
    expect(seedSixWsFromGoal('Zig-native CLI that generates GROK.md').what).toBe('Zig-native CLI');
    expect(seedSixWsFromGoal('High-performance Rust CLI — the FAFb compiler').what).toBe('High-performance Rust CLI');
  });

  test('E2 — WHERE = platforms literally named', () => {
    expect(seedSixWsFromGoal('Rust MCP server. Docker, crates.io.').where).toBe('crates.io, Docker');
    expect(seedSixWsFromGoal('322KB of WASM.').where).toBe('WASM');
    expect(seedSixWsFromGoal('Ships on npm and Cloudflare edge').where).toContain('npm');
  });

  test('E3 — WHO only on an explicit audience ROLE, not a target', () => {
    expect(seedSixWsFromGoal('Chat for developers building AI apps').who).toContain('developers building AI apps');
    expect(seedSixWsFromGoal('CLI for Rust developers and integrators').who).toContain('Rust developers');
    // targets, not audiences → no who:
    expect(seedSixWsFromGoal('MCP server for Cursor, Windsurf').who).toBeUndefined();
    expect(seedSixWsFromGoal('Engine for FAF').who).toBeUndefined();
    expect(seedSixWsFromGoal('Context for xAI Grok').who).toBeUndefined();
  });
});

describe('AERO — edges', () => {
  test('A1 — empty / whitespace / non-string → {}', () => {
    expect(seedSixWsFromGoal('')).toEqual({});
    expect(seedSixWsFromGoal('   ')).toEqual({});
    expect(seedSixWsFromGoal(undefined as unknown as string)).toEqual({});
  });

  test('A2 — a leading emoji is stripped from WHAT', () => {
    expect(seedSixWsFromGoal('💨 FAF TURBO - Universal Automation').what).toBe('FAF TURBO');
  });

  test('A3 — WHO is capped (never a runaway sentence)', () => {
    const s = seedSixWsFromGoal('X for developers ' + 'who build things '.repeat(20));
    if (s.who) expect(s.who.length).toBeLessThanOrEqual(70);
  });

  test('A4 — deterministic', () => {
    const g = 'High-performance Rust CLI for Rust developers. crates.io.';
    expect(seedSixWsFromGoal(g)).toEqual(seedSixWsFromGoal(g));
  });
});
