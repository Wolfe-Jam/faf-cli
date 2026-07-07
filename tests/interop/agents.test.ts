/**
 * interop/agents — "The AGENTS.md Edition" exporter. Championship coverage:
 * (1) full data renders every section with correct values;
 * (2) universal SAFETY DEFAULTS (Guardrails + Definition of Done) always render;
 * (3) everything else is DATA-GATED — absent slots omit their section (nothing invented);
 * (4) curation (facts-not-bloat) — human↔assistant prefs excluded from Conventions,
 *     context/marketing keys excluded from Stack;
 * (5) Definition of Done composes from the detected verification commands.
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

describe('AGENTS.md — full data renders every section', () => {
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
  test('§6 Guardrails: project-specific first, then Ask-first + Never', () => {
    expect(md).toContain('## Guardrails');
    expect(md).toContain('Version must match across files');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
    // project-specific facts must lead the tiers
    expect(md.indexOf('Version must match')).toBeLessThan(md.indexOf('Ask first'));
  });
  test('§7 Definition of Done composed from commands', () => {
    expect(md).toContain('## Definition of Done');
    expect(md).toContain('`ruff check .` exits 0');
    expect(md).toContain('`pytest -v` passes');
    expect(md).toContain('conventional message');
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
    expect(md).toContain('Context generated: 2026-07-06');
  });
});

describe('AGENTS.md — universal safety defaults ALWAYS render (bare .faf)', () => {
  const md = generateAgentsMd(BARE);

  test('Guardrails (Ask-first + Never) render even with no warnings', () => {
    expect(md).toContain('## Guardrails');
    expect(md).toContain('Ask first');
    expect(md).toContain('Never');
  });
  test('Definition of Done always renders', () => {
    expect(md).toContain('## Definition of Done');
    expect(md).toContain('conventional message');
  });
  test('orientation still renders', () => {
    expect(md).toContain('bare');
    expect(md).toContain('a tiny tool');
  });
});

describe('AGENTS.md — everything else is data-gated (bare .faf omits it)', () => {
  const md = generateAgentsMd(BARE);
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
    test(`omits "${section}" when its data is absent`, () => {
      expect(md).not.toContain(section);
    });
  }
});

describe('AGENTS.md — curation (facts, not bloat)', () => {
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

describe('AGENTS.md — Definition of Done composition', () => {
  test('with only a test command (no lint)', () => {
    const md = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'Rust' },
      commands: { test: 'cargo test' },
    } as any);
    expect(md).toContain('`cargo test` passes');
    expect(md).not.toContain('exits 0'); // no lint command → no lint gate
  });
  test('bare .faf → DoD is just the commit gate', () => {
    const md = generateAgentsMd(BARE);
    expect(md).toContain('Done when: changes committed with a conventional message.');
  });
});

describe('AGENTS.md — detected conventions render in §5', () => {
  test('data.conventions bullets appear under Conventions', () => {
    const md = generateAgentsMd({
      project: { name: 'x', goal: 'y', main_language: 'TypeScript' },
      conventions: ['TypeScript strict mode', 'Style enforced by ESLint — obey the configs'],
    } as any);
    expect(md).toContain('## Conventions');
    expect(md).toContain('TypeScript strict mode');
    expect(md).toContain('obey the configs');
  });
});
