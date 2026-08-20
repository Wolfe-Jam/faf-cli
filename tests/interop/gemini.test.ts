/**
 * interop/gemini — Gemini CLI's own GEMINI.md convention (commands, key files,
 * confirmation-required actions) — NOT the AGENTS.md BETTER ladder, a
 * different spec for a different reader. WJTTC tiers:
 *   ENGINE — every section renders from data with correct values.
 *   BRAKE  — the safety contract: "Before changing things" ALWAYS renders;
 *            everything else is DATA-GATED (absent slots invent nothing).
 *   AERO   — facts-not-bloat curation (marketing/context stack keys excluded).
 */
import { describe, test, expect } from 'bun:test';
import { generateGeminiMd } from '../../src/interop/gemini.js';

const FULL: any = {
  project: { name: 'demo', goal: 'A small API', main_language: 'Python' },
  stack: {
    backend: 'FastAPI',
    package_manager: 'pip',
    core_problem: 'AI lacks context',
    mission_purpose: 'Give AI context',
    target_user: 'developers',
  },
  commands: { install: 'pip install -e ".[dev]"', lint: 'ruff check .', test: 'pytest -v' },
  key_files: ['app/main.py', 'tests/test_api.py'],
  generated: '2026-08-20T00:00:00Z',
};

const BARE: any = { project: { name: 'bare', goal: 'a tiny tool', main_language: 'Go' } };

describe('ENGINE: full data renders every section', () => {
  const md = generateGeminiMd(FULL);

  test('orientation: project · goal · language', () => {
    expect(md).toContain('demo');
    expect(md).toContain('A small API');
    expect(md).toContain('Python');
  });
  test('Setup & build (install, not lint/test)', () => {
    expect(md).toContain('## Setup & build');
    expect(md).toContain('pip install -e ".[dev]"');
  });
  test('Test & verify includes lint alongside test', () => {
    expect(md).toContain('## Test & verify');
    expect(md).toContain('pytest -v');
    expect(md).toContain('ruff check .');
  });
  test('Where things live', () => {
    expect(md).toContain('## Where things live');
    expect(md).toContain('`app/main.py`');
  });
  test('Stack renders actual stack keys', () => {
    expect(md).toContain('## Stack');
    expect(md).toContain('FastAPI');
  });
  test('Before changing things', () => {
    expect(md).toContain('## Before changing things');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
  });
});

describe('BRAKE: safety contract — defaults always render, nothing else invented', () => {
  const md = generateGeminiMd(BARE);

  test('"Before changing things" renders even with no commands/stack/key_files', () => {
    expect(md).toContain('## Before changing things');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
  });
  test('orientation still renders', () => {
    expect(md).toContain('bare');
    expect(md).toContain('a tiny tool');
  });

  for (const section of ['## Setup & build', '## Test & verify', '## Where things live', '## Stack']) {
    test(`data-gated: omits "${section}" when its data is absent`, () => {
      expect(md).not.toContain(section);
    });
  }
});

describe('AERO: facts-not-bloat curation', () => {
  const md = generateGeminiMd(FULL);

  test('Stack EXCLUDES context/marketing keys', () => {
    expect(md).not.toContain('Core Problem');
    expect(md).not.toContain('Mission Purpose');
    expect(md).not.toContain('Target User');
    expect(md).not.toContain('AI lacks context');
  });
});

describe('faf meta tag + refresh hint', () => {
  test('includes the refresh command', () => {
    const md = generateGeminiMd(BARE);
    expect(md).toContain('faf export --gemini');
  });
});
