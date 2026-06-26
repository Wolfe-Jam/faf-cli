/**
 * WJTTC — Copilot Instructions Emit Suite
 *
 * Championship proof for `faf export --copilot` → `.github/copilot-instructions.md`,
 * the widest-surface GitHub Copilot file. GIT + Copilot are the adoption wedge for
 * this phase, so the emit is held to championship standard: it must NEVER clobber a
 * developer's hand-written instructions, must be idempotent, and must round-trip
 * safely as both the .faf and the user's prose evolve.
 *
 * v6.16 "Copilot-grade" contract (sourced from GitHub's own custom-instructions
 * spec — see PLANET-FAF/INTEL/copilot-instructions-spec-2026-06-25.md):
 *   - INSTRUCTIONS, not a metadata dump: Title-Cased labels, goal as a prose
 *     overview, build surfaced as a command — never raw snake_case keys.
 *   - NOT an AGENTS.md clone: copilot-instructions.md outranks AGENTS.md in-repo
 *     and is meant to be complementary, so the two files must differ.
 *   - NONE of GitHub's named anti-patterns (tone rules, length rules, external
 *     references) may appear in the generated boilerplate.
 *   - Short — it is injected into every Copilot request.
 *
 * Source of truth = faf-cli (the canonical emitter). The MCP-server fleet
 * (grok/gemini parity) gets its own suites; this locks the engine they compose.
 *
 * Tiers (F1-inspired):
 *   🛑 BRAKE  — data safety: never destroy user prose, never crash, no anti-patterns
 *   ⚙️ ENGINE — emit correctness: Copilot-grade structure, Title-Case, build command
 *   🌬️ AERO   — edge cases & determinism: unicode, slotignored/empty filtering, length
 *   🛞 TYRE   — the real road: author → emit → hand-edit → re-emit round-trip
 *   🔧 PIT    — flag-gate eval: --copilot vs --all vs bare export
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const COPILOT = ['.github', 'copilot-instructions.md'] as const;

describe('WJTTC — copilot-instructions emit', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `wjttc-copilot-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  // helpers ------------------------------------------------------------------
  const writeFaf = (extra = '') =>
    writeFileSync(
      join(testDir, 'project.faf'),
      `faf_version: 2.5.0\nproject:\n  name: wedge\n  goal: GitHub adoption wedge\n  main_language: TypeScript\n${extra}`,
    );
  const exportCopilot = (opts: Record<string, boolean> = { copilot: true }) => {
    const { exportCommand } = require('../../src/commands/export.js');
    exportCommand(opts);
  };
  const read = () => readFileSync(join(testDir, ...COPILOT), 'utf-8');
  const countBlocks = (s: string) => s.split('<!-- faf:start -->').length - 1;

  // ── 🛑 BRAKE ──────────────────────────────────────────────────────────────
  describe('🛑 BRAKE — never destroys, never crashes, no anti-patterns', () => {
    test('preserves a hand-authored copilot-instructions.md (user prose survives)', () => {
      writeFaf();
      mkdirSync(join(testDir, '.github'), { recursive: true });
      writeFileSync(
        join(testDir, ...COPILOT),
        '# Team Copilot Rules\n\nAlways prefer composition over inheritance.\nNever log secrets.\n',
      );
      exportCopilot();
      const out = read();
      expect(out).toContain('Always prefer composition over inheritance.');
      expect(out).toContain('Never log secrets.');
      expect(out).toContain('<!-- faf:start -->'); // faf block injected alongside
    });

    test('round-trips idempotently on a user file (prose kept, exactly one block after 3 runs)', () => {
      writeFaf();
      mkdirSync(join(testDir, '.github'), { recursive: true });
      writeFileSync(join(testDir, ...COPILOT), '# Team Rules\n\nUse tabs.\n');
      exportCopilot();
      exportCopilot();
      exportCopilot();
      const out = read();
      expect(countBlocks(out)).toBe(1);
      expect(out.split('<!-- faf:end -->').length - 1).toBe(1);
      expect(out).toContain('Use tabs.');
    });

    test('a near-empty project.faf does not crash the emit', () => {
      writeFileSync(join(testDir, 'project.faf'), 'faf_version: 2.5.0\n');
      expect(() => exportCopilot()).not.toThrow();
      expect(existsSync(join(testDir, ...COPILOT))).toBe(true);
    });

    test('creates the .github directory when absent', () => {
      writeFaf();
      expect(existsSync(join(testDir, '.github'))).toBe(false);
      exportCopilot();
      expect(existsSync(join(testDir, ...COPILOT))).toBe(true);
    });

    test('emits NONE of GitHub’s named anti-patterns (tone / length / external-ref rules)', () => {
      // Source: GitHub custom-instructions docs — these phrasings "may cause problems".
      // The generated boilerplate must never bake them in.
      writeFaf('stack:\n  runtime: Node.js\n  build: tsc\nhuman_context:\n  who: maintainer\n');
      exportCopilot();
      const out = read().toLowerCase();
      expect(out).not.toContain('in the style of');
      expect(out).not.toContain('respond in');
      expect(out).not.toContain('less than 1000');
      expect(out).not.toContain('styleguide.md');
      expect(out).not.toContain('@terminal');
    });

    test('never emits raw snake_case / lowercase slot keys (it is instructions, not a dump)', () => {
      writeFaf('stack:\n  api_type: REST\n  cicd: GitHub Actions\nhuman_context:\n  who: devs\n  why: ship faster\n');
      exportCopilot();
      const out = read();
      // The dump anti-pattern — raw keys as bullet labels — must be gone.
      expect(out).not.toContain('**api_type:**');
      expect(out).not.toContain('**cicd:**');
      expect(out).not.toContain('**who:**');
      expect(out).not.toContain('**why:**');
    });
  });

  // ── ⚙️ ENGINE ─────────────────────────────────────────────────────────────
  describe('⚙️ ENGINE — Copilot-grade emit correctness', () => {
    test('emits the Copilot-grade structure + 2-line faf meta stamp', () => {
      writeFaf();
      exportCopilot();
      const out = read();
      expect(out).toContain('# GitHub Copilot Instructions — wedge');
      expect(out).toContain('## Tech stack');
      expect(out).toMatch(/<!-- faf: wedge \| TypeScript \|/); // meta stamp line 1
      expect(out).toContain('family=FAF'); // meta stamp line 2
      expect(out).toContain('<!-- faf:start -->');
      expect(out).toContain('<!-- faf:end -->');
    });

    test('leads with the goal as a prose overview (not a `- **Goal:**` bullet)', () => {
      writeFaf();
      exportCopilot();
      const out = read();
      expect(out).toContain('GitHub adoption wedge'); // the goal, as prose
      expect(out).not.toContain('- **Goal:**'); // not a raw key bullet
      expect(out).not.toContain('- **Name:**'); // name lives in the H1, not a bullet
    });

    test('labels are registry-sourced, with acronym fallback (Language first)', () => {
      writeFaf('stack:\n  runtime: Node.js\n  api_type: REST\n  mcp_sdk: "1.0"\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('- **Language:** TypeScript');
      expect(out).toContain('- **Runtime:** Node.js'); // registry label
      expect(out).toContain('- **API:** REST');         // registry: api_type → "API"
      expect(out).not.toContain('- **API Type:**');     // not the old heuristic form
      expect(out).toContain('- **MCP SDK:** 1.0');       // off-registry key → acronym fallback
    });

    test('surfaces build & CI as imperative commands (the #1 Copilot section)', () => {
      writeFaf('stack:\n  build: tsc\n  cicd: GitHub Actions\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('## Build & run');
      expect(out).toContain('Build with `tsc`'); // command, in backticks, imperative
      expect(out).toContain('CI runs on GitHub Actions');
      // build/cicd are surfaced as commands, not duplicated as raw stack bullets
      expect(out).not.toContain('- **Build:** tsc');
      expect(out).not.toContain('- **Cicd:**');
    });

    test('future-proof commands: renders install/test/lint/run when present, omits when absent', () => {
      // Option B will add these .faf slots; the emitter must light them up with NO rework.
      writeFaf('stack:\n  install: bun install\n  build: tsc\n  test: bun test\n  lint: eslint .\n  run: node dist/cli.js\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('Install with `bun install`');
      expect(out).toContain('Build with `tsc`');
      expect(out).toContain('Test with `bun test`');
      expect(out).toContain('Lint with `eslint .`');
      expect(out).toContain('Run with `node dist/cli.js`');
      // absent command slots produce no line
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFaf('stack:\n  build: tsc\n');
      exportCopilot();
      const out2 = read();
      expect(out2).toContain('Build with `tsc`');
      expect(out2).not.toContain('Test with');
      expect(out2).not.toContain('Lint with');
      expect(out2).not.toContain('Install with');
    });

    test('Title-Cases the 6Ws under a Project context section', () => {
      writeFaf('human_context:\n  who: maintainers\n  why: ship faster\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('## Project context');
      expect(out).toContain('- **Who:** maintainers');
      expect(out).toContain('- **Why:** ship faster');
    });

    test('is NOT a byte-identical AGENTS.md clone (complementary, not duplicate)', () => {
      writeFaf('stack:\n  runtime: Node.js\n  build: tsc\nhuman_context:\n  who: devs\n');
      const { generateCopilotInstructions } = require('../../src/interop/copilot-instructions.js');
      const { generateAgentsMd } = require('../../src/interop/agents.js');
      const data = {
        project: { name: 'wedge', goal: 'GitHub adoption wedge', main_language: 'TypeScript' },
        stack: { runtime: 'Node.js', build: 'tsc' },
        human_context: { who: 'devs' },
      };
      const copilot = generateCopilotInstructions(data);
      const agents = generateAgentsMd(data);
      expect(copilot).not.toBe(agents); // the clone guard
      expect(copilot).toContain('# GitHub Copilot Instructions');
      expect(agents).toContain('# AGENTS.md');
    });

    test('--copilot alone respects the exportAll guard (no sibling files)', () => {
      writeFaf();
      exportCopilot({ copilot: true });
      expect(existsSync(join(testDir, ...COPILOT))).toBe(true);
      expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(false);
      expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(false);
      expect(existsSync(join(testDir, '.cursorrules'))).toBe(false);
    });

    test('--all includes copilot-instructions.md', () => {
      writeFaf();
      exportCopilot({ all: true });
      expect(existsSync(join(testDir, ...COPILOT))).toBe(true);
    });
  });

  // ── 🌬️ AERO ───────────────────────────────────────────────────────────────
  describe('🌬️ AERO — edge cases, determinism & length', () => {
    test('unicode + emoji in the project name survive verbatim', () => {
      writeFileSync(
        join(testDir, 'project.faf'),
        'faf_version: 2.5.0\nproject:\n  name: "🏎️-café-проект-日本語"\n  goal: x\n  main_language: TypeScript\n',
      );
      exportCopilot();
      expect(read()).toContain('🏎️-café-проект-日本語');
    });

    test('slotignored + empty stack values are filtered out', () => {
      writeFaf('stack:\n  runtime: Node.js\n  hosting: slotignored\n  blank: ""\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('- **Runtime:** Node.js');
      expect(out).not.toContain('slotignored');
      expect(out).not.toContain('- **Hosting:**');
      expect(out).not.toContain('- **Blank:**');
    });

    test('deterministic — two fresh emits of the same .faf are byte-identical', () => {
      writeFaf('stack:\n  runtime: Node.js\n');
      exportCopilot();
      const a = read();
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      exportCopilot();
      const b = read();
      expect(a).toBe(b);
    });

    test('stays short — a full .faf emits a compact file (Copilot injects it every request)', () => {
      writeFaf(
        'stack:\n  runtime: Node.js\n  build: tsc\n  cicd: GitHub Actions\n  hosting: npm\n' +
        'human_context:\n  who: devs\n  what: a tool\n  why: speed\n  where: npm\n  when: ci\n  how: cli\n',
      );
      exportCopilot();
      const fafBlock = read().split('<!-- faf:start -->')[1].split('<!-- faf:end -->')[0];
      expect(fafBlock.split('\n').length).toBeLessThan(40); // ~well under "2 pages"
    });
  });

  // ── 🛞 TYRE ───────────────────────────────────────────────────────────────
  describe('🛞 TYRE — the real road (author → emit → hand-edit → re-emit)', () => {
    test('user prose added below the block survives a re-emit; the block refreshes', () => {
      writeFaf();
      exportCopilot();
      // Developer appends their own section after the faf-managed block.
      writeFileSync(join(testDir, ...COPILOT), read() + '\n## My House Rules\n\nReview every PR.\n');
      // The .faf evolves (stack changes); re-emit.
      writeFaf('stack:\n  runtime: Bun\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('Review every PR.'); // user edit preserved
      expect(out).toContain('- **Runtime:** Bun'); // managed block refreshed, Title-Cased
      expect(countBlocks(out)).toBe(1); // never duplicated
    });
  });

  // ── 🔧 PIT ────────────────────────────────────────────────────────────────
  describe('🔧 PIT — flag-gate evaluation', () => {
    test('bare export (no flags) writes copilot-instructions.md via the exportAll default', () => {
      writeFaf();
      exportCopilot({});
      expect(existsSync(join(testDir, ...COPILOT))).toBe(true);
    });
  });
});
