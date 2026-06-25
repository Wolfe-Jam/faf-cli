/**
 * WJTTC — Copilot Instructions Emit Suite
 *
 * Championship proof for `faf export --copilot` → `.github/copilot-instructions.md`,
 * the widest-surface GitHub Copilot file. GIT + Copilot are the adoption wedge for
 * this phase, so the emit is held to championship standard: it must NEVER clobber a
 * developer's hand-written instructions, must be idempotent, and must round-trip
 * safely as both the .faf and the user's prose evolve.
 *
 * Source of truth = faf-cli (the canonical emitter). The MCP-server fleet
 * (grok/gemini parity) gets its own suites; this locks the engine they compose.
 *
 * Tiers (F1-inspired):
 *   🛑 BRAKE  — data safety: never destroy user prose, never crash, atomic .github
 *   ⚙️ ENGINE — emit correctness: structure, 2-line meta stamp, field mapping, guards
 *   🌬️ AERO   — edge cases & determinism: unicode, slotignored/empty filtering, stable output
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
  describe('🛑 BRAKE — never destroys, never crashes', () => {
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
  });

  // ── ⚙️ ENGINE ─────────────────────────────────────────────────────────────
  describe('⚙️ ENGINE — emit correctness', () => {
    test('emits the canonical structure + 2-line faf meta stamp', () => {
      writeFaf();
      exportCopilot();
      const out = read();
      expect(out).toContain('# GitHub Copilot Instructions — wedge');
      expect(out).toContain('## Project Context');
      expect(out).toContain('## Stack');
      expect(out).toMatch(/<!-- faf: wedge \| TypeScript \|/); // meta stamp line 1
      expect(out).toContain('family=FAF'); // meta stamp line 2
      expect(out).toContain('<!-- faf:start -->');
      expect(out).toContain('<!-- faf:end -->');
    });

    test('maps project fields → labelled bullets', () => {
      writeFaf();
      exportCopilot();
      const out = read();
      expect(out).toContain('- **Name:** wedge');
      expect(out).toContain('- **Goal:** GitHub adoption wedge');
      expect(out).toContain('- **Language:** TypeScript');
    });

    test('maps stack + human_context entries', () => {
      writeFaf('stack:\n  runtime: Node.js\nhuman_context:\n  who: maintainer\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('- **runtime:** Node.js');
      expect(out).toContain('## Human Context');
      expect(out).toContain('- **who:** maintainer');
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
  describe('🌬️ AERO — edge cases & determinism', () => {
    test('unicode + emoji in the project name survive verbatim', () => {
      writeFileSync(
        join(testDir, 'project.faf'),
        'faf_version: 2.5.0\nproject:\n  name: "🏎️-café-проект-日本語"\n  goal: x\n  main_language: TypeScript\n',
      );
      exportCopilot();
      expect(read()).toContain('🏎️-café-проект-日本語');
    });

    test('slotignored + empty stack values are filtered out', () => {
      writeFaf('stack:\n  runtime: Node.js\n  build: slotignored\n  blank: ""\n');
      exportCopilot();
      const out = read();
      expect(out).toContain('- **runtime:** Node.js');
      expect(out).not.toContain('slotignored');
      expect(out).not.toContain('- **build:**');
      expect(out).not.toContain('- **blank:**');
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
      expect(out).toContain('- **runtime:** Bun'); // managed block refreshed
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
