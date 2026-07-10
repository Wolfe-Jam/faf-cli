/**
 * interop/agents — "The AGENTS.md Edition" exporter. WJTTC tiers:
 *   ENGINE — every section renders from data with correct values (the core job).
 *   BRAKE  — the safety contract: universal safety defaults ALWAYS render;
 *            everything else is DATA-GATED (absent slots invent nothing).
 *   AERO   — facts-not-bloat curation (human↔assistant prefs + context/marketing
 *            keys excluded).
 */
import { describe, test, expect } from 'bun:test';
import { generateAgentsMd } from '../../src/interop/agents.js';

const FULL: any = {
  project: { name: 'demo', goal: 'A small API', main_language: 'Python', type: 'service', version: '2.1.0' },
  stack: {
    backend: 'FastAPI',
    package_manager: 'pip',
    // context/marketing — must NOT appear in Stack:
    core_problem: 'AI lacks context',
    mission_purpose: 'Give AI context',
    target_user: 'developers',
  },
  commands: { install: 'pip install -e ".[dev]"', lint: 'ruff check .', test: 'pytest -v' },
  key_files: ['app/main.py', 'tests/test_api.py'],
  ai_instructions: {
    working_style: { code_first: true, quality_bar: 'zero_errors', communication: 'direct' },
    warnings: ['Version must match across files', 'Delegate parsing to the SDK'],
  },
  preferences: { commit_style: 'conventional', response_style: 'concise_code_first', testing: 'required' },
  security: { secrets: '.env', example: '.env.example', never: ['.env.local'] },
  human_context: { who: 'devs', why: 'ship faster' },
  generated: '2026-07-06T00:00:00Z',
};

// Bare .faf: orientation only. No commands / key_files / instructions / stack / human_context.
const BARE: any = { project: { name: 'bare', goal: 'a tiny tool', main_language: 'Go' } };

describe('ENGINE: full data renders every section', () => {
  const md = generateAgentsMd(FULL);

  test('§1 orientation: goal · language · type · version', () => {
    expect(md).toContain('A small API');
    expect(md).toContain('Python');
    expect(md).toContain('type: service');
    expect(md).toContain('v2.1.0');
  });
  test('§2 Setup & build (install, not lint/test)', () => {
    expect(md).toContain('## Setup & build');
    expect(md).toContain('pip install -e ".[dev]"');
  });
  test('§3 Run the tests', () => {
    expect(md).toContain('## Run the tests');
    expect(md).toContain('pytest -v');
  });
  test('§4 Where things live', () => {
    expect(md).toContain('## Where things live');
    expect(md).toContain('`app/main.py`');
  });
  test('§5 Conventions (real constraints)', () => {
    expect(md).toContain('## Conventions');
    expect(md).toContain('Quality Bar');
    expect(md).toContain('zero_errors');
  });
  test('§5 Conventions also renders detected toolchain (data.conventions)', () => {
    const m = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'TypeScript' },
      conventions: ['TypeScript strict mode', 'Style enforced by ESLint — obey the configs'],
    } as any);
    expect(m).toContain('## Conventions');
    expect(m).toContain('TypeScript strict mode');
    expect(m).toContain('obey the configs');
  });
  test('§6 Guardrails: project-specific first, then Ask-first + Never', () => {
    expect(md).toContain('## Guardrails');
    expect(md).toContain('Version must match across files');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
    expect(md.indexOf('Version must match')).toBeLessThan(md.indexOf('Ask first'));
  });
  test('§7 Definition of Done composed from commands', () => {
    expect(md).toContain('## Definition of Done');
    expect(md).toContain('`ruff check .` exits 0');
    expect(md).toContain('`pytest -v` passes');
    expect(md).toContain('conventional message');
  });
  test('§7 DoD with only a test command (no lint)', () => {
    const m = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'Rust' },
      commands: { test: 'cargo test' },
    } as any);
    expect(m).toContain('`cargo test` passes');
    expect(m).not.toContain('exits 0'); // no lint command → no lint gate
  });
  test('§7 DoD: a test+check key classifies as a test ONLY (no double gate)', () => {
    const m = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'TypeScript' },
      commands: { 'test:check': 'npm run test:check' },
    } as any);
    expect(m).toContain('`npm run test:check` passes');
    expect(m).not.toContain('exits 0'); // not also classified as lint
  });
  test('§7 DoD dedupes identical gates', () => {
    const m = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'TypeScript' },
      commands: { lint: 'npm run check', typecheck: 'npm run check' },
    } as any);
    expect(m.split('`npm run check` exits 0').length - 1).toBe(1);
  });
  test('§8 Security & secrets', () => {
    expect(md).toContain('## Security & secrets');
    expect(md).toContain('`.env`');
    expect(md).toContain('.env.example');
    expect(md).toContain('.env.local');
  });
  test('§9 Commit & PR', () => {
    expect(md).toContain('## Commit & PR');
    expect(md).toContain('conventional');
  });
  test('Stack renders real stack', () => {
    expect(md).toContain('## Stack');
    expect(md).toContain('FastAPI');
  });
  test('Human Context + freshness footer', () => {
    expect(md).toContain('## Human Context');
    expect(md).toContain('Context authored: 2026-07-06');
  });
});

describe('BRAKE: safety contract — defaults always render, nothing else invented', () => {
  const md = generateAgentsMd(BARE);

  test('Guardrails (Ask-first + Never) render even with no warnings', () => {
    expect(md).toContain('## Guardrails');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
  });
  test('Definition of Done always renders (bare = commit gate only)', () => {
    expect(md).toContain('## Definition of Done');
    expect(md).toContain('Done when: changes committed with a conventional message.');
  });
  test('orientation still renders', () => {
    expect(md).toContain('bare');
    expect(md).toContain('a tiny tool');
  });

  for (const section of [
    '## Setup & build',
    '## Run the tests',
    '## Where things live',
    '## Conventions',
    '## Security & secrets',
    '## Commit & PR',
    '## Stack',
    '## Human Context',
  ]) {
    test(`data-gated: omits "${section}" when its data is absent`, () => {
      expect(md).not.toContain(section);
    });
  }
});

describe('AERO: facts-not-bloat curation', () => {
  const md = generateAgentsMd(FULL);

  test('Conventions EXCLUDES human↔assistant prefs', () => {
    expect(md).not.toContain('Communication');
    expect(md).not.toContain('Response Style');
    expect(md).not.toContain('concise_code_first');
  });
  test('Stack EXCLUDES context/marketing keys', () => {
    expect(md).not.toContain('Core Problem');
    expect(md).not.toContain('Mission Purpose');
    expect(md).not.toContain('Target User');
  });
});
