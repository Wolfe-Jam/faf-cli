/**
 * WJTTC — `faf ai enhance` slop-guard
 *
 * BRAKE: even if Claude returns slop / placeholder text / fabrications,
 *        the cli MUST reject it before writing to disk. Empty is honest;
 *        wrong is a lie. Per faf-auto-no-guess-no-slop doctrine.
 *
 * The AI call itself is hard to test (network + API key), but the
 * client-side validator IS testable in isolation. This is the doctrine
 * receipt: regardless of what the model produces, the cli's filter is
 * deterministic.
 */

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isValidAiExtraction, AI_SLOP_PATTERNS } from '../../src/commands/ai.js';

describe('WJTTC BRAKE: AI slop-guard rejects forbidden patterns', () => {
  test.each([
    // Generic catch-alls
    ['TBD'],
    ['see README'],
    ['TODO'],
    ['fixme'],
    ['coming soon'],
    ['n/a'],
    ['unknown'],
    ['null'],
    ['not specified'],

    // Generic categorizations (project description slop)
    ['software'],
    ['application'],
    ['app'],
    ['project'],
    ['tool'],
    ['library'],
    ['framework'],

    // Audience slop
    ['for users'],
    ['for developers'],
    ['for teams'],
    ['for engineers'],

    // Fluff slop
    ['general purpose'],
    ['various'],
    ['multiple'],
    ['description'],
    ['goal'],
    ['name'],
    ['title'],
  ])('rejects "%s" as slop', (slop) => {
    expect(isValidAiExtraction(slop)).toBe(false);
  });

  test('rejects too-short strings (under 4 chars — unhelpful)', () => {
    expect(isValidAiExtraction('ab')).toBe(false);
    expect(isValidAiExtraction('cd')).toBe(false);
    expect(isValidAiExtraction('')).toBe(false);
  });

  test('rejects too-long strings (over 280 chars — essay, not a slot)', () => {
    const essay = 'a'.repeat(300);
    expect(isValidAiExtraction(essay)).toBe(false);
  });

  test('rejects non-string types (null/undefined/numbers/objects)', () => {
    expect(isValidAiExtraction(null)).toBe(false);
    expect(isValidAiExtraction(undefined)).toBe(false);
    expect(isValidAiExtraction(42)).toBe(false);
    expect(isValidAiExtraction({})).toBe(false);
    expect(isValidAiExtraction([])).toBe(false);
  });

  test('case-insensitive — "TBD" / "tbd" / "Tbd" all rejected', () => {
    expect(isValidAiExtraction('TBD')).toBe(false);
    expect(isValidAiExtraction('tbd')).toBe(false);
    expect(isValidAiExtraction('Tbd')).toBe(false);
    expect(isValidAiExtraction('  TBD  ')).toBe(false);
  });
});

describe('WJTTC ENGINE: AI slop-guard accepts concrete extractions', () => {
  test.each([
    ['Persistent AI Context Standard — IANA-registered'],
    ['Eliminate 91% of context re-discovery tax'],
    ['CLI tool for managing .faf files across AI assistants'],
    ['Developers and teams using AI coding assistants daily'],
    ['Production since September 2025, v6 March 2026'],
    ['npm registry, Homebrew, GitHub Releases'],
  ])('accepts concrete extraction: "%s"', (concrete) => {
    expect(isValidAiExtraction(concrete)).toBe(true);
  });

  test('accepts strings of exactly 4 chars (boundary)', () => {
    expect(isValidAiExtraction('Rust')).toBe(true);
  });

  test('accepts strings of exactly 280 chars (upper boundary)', () => {
    const max = 'a'.repeat(280);
    expect(isValidAiExtraction(max)).toBe(true);
  });
});

describe('WJTTC ENGINE: AI_SLOP_PATTERNS is non-empty (regression guard)', () => {
  test('at least 4 slop pattern groups defined', () => {
    expect(AI_SLOP_PATTERNS.length).toBeGreaterThanOrEqual(4);
  });

  test('all entries are RegExp objects', () => {
    for (const p of AI_SLOP_PATTERNS) {
      expect(p).toBeInstanceOf(RegExp);
    }
  });
});

describe('WJTTC BRAKE: source-level prompt content lock-in', () => {
  // Reading the source guards the doctrine — if someone "softens" the prompt
  // to be more permissive, these assertions fire. The validator is
  // belt-and-braces; the prompt is the FIRST line of defense.
  const AI_SRC = readFileSync(join(__dirname, '../../src/commands/ai.ts'), 'utf-8');

  test('prompt includes "DO NOT GUESS" instruction', () => {
    expect(AI_SRC).toContain('DO NOT GUESS');
  });

  test('prompt includes "NEVER use generic placeholders"', () => {
    expect(AI_SRC).toContain('NEVER use generic placeholders');
  });

  test('prompt includes "NEVER fabricate"', () => {
    expect(AI_SRC).toContain('NEVER fabricate');
  });

  test('prompt explicitly lists forbidden slop values', () => {
    expect(AI_SRC).toContain('"TBD"');
    expect(AI_SRC).toContain('"see README"');
    expect(AI_SRC).toContain('"software application"');
    expect(AI_SRC).toContain('"for users"');
  });

  test('prompt instructs to return null when no concrete evidence', () => {
    expect(AI_SRC).toMatch(/return null/i);
  });

  test('prompt requires DIRECTLY supported values (no fabrication)', () => {
    expect(AI_SRC).toMatch(/DIRECTLY supported/i);
  });

  test('prompt has a length cap of ~200 chars on extracted values', () => {
    expect(AI_SRC).toMatch(/under 200 characters|≤\s*200|max(?:imum)?\s*200/i);
  });

  test('does NOT contain the old permissive "reasonable values" phrasing', () => {
    expect(AI_SRC).not.toContain('reasonable values based on the project');
  });
});
