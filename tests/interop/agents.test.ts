/**
 * interop/agents — the AGENTS.md exporter must render the actionable sections a
 * good AGENTS.md needs (setup/build · tests · where-things-live · conventions ·
 * commit · guardrails) by PROJECTING slots the .faf already carries. Two guards:
 * (1) a future refactor can't silently drop a section; (2) absent slots must NOT
 * fabricate one.
 */
import { describe, test, expect } from 'bun:test';
import { generateAgentsMd } from '../../src/interop/agents.js';

const FULL: any = {
  project: { name: 'demo', goal: 'A small API', main_language: 'Python' },
  stack: { backend: 'FastAPI', package_manager: 'pip' },
  commands: {
    install: 'pip install -e ".[dev]"',
    test: 'python -m pytest tests/ -v',
  },
  key_files: ['server.py', 'tests/test_api.py'],
  ai_instructions: {
    working_style: { code_first: true, quality_bar: 'zero_errors' },
    warnings: ['Version must match across all files', 'Delegate parsing to the SDK'],
  },
  preferences: { commit_style: 'conventional', response_style: 'concise' },
  human_context: { who: 'devs' },
};

describe('generateAgentsMd — actionable sections render from slots', () => {
  const md = generateAgentsMd(FULL);

  test('§2 Setup & build ← commands (non-test)', () => {
    expect(md).toContain('## Setup & build');
    expect(md).toContain('pip install -e ".[dev]"');
  });

  test('§3 Tests ← commands (test-keyed)', () => {
    expect(md).toContain('## Run the tests');
    expect(md).toContain('python -m pytest tests/ -v');
  });

  test('§4 Where things live ← key_files', () => {
    expect(md).toContain('## Where things live');
    expect(md).toContain('`server.py`');
  });

  test('§5 Conventions ← working_style + preferences', () => {
    expect(md).toContain('## Conventions');
    expect(md).toContain('Quality Bar');
    expect(md).toContain('zero_errors');
  });

  test('§6 Commit & PR ← preferences.commit_style', () => {
    expect(md).toContain('## Commit & PR');
    expect(md).toContain('conventional');
  });

  test('§7 Guardrails ← ai_instructions.warnings', () => {
    expect(md).toContain('## Guardrails — do NOT');
    expect(md).toContain('Version must match across all files');
  });
});

describe('generateAgentsMd — no fabrication when slots absent', () => {
  // Minimal .faf: orientation only. The actionable sections have no source slots.
  const md = generateAgentsMd({
    project: { name: 'bare', goal: 'x', main_language: 'Go' },
  } as any);

  test('orientation still renders', () => {
    expect(md).toContain('## Project Context');
    expect(md).toContain('bare');
  });

  test('absent slots omit their sections (nothing invented)', () => {
    expect(md).not.toContain('## Setup & build');
    expect(md).not.toContain('## Run the tests');
    expect(md).not.toContain('## Where things live');
    expect(md).not.toContain('## Conventions');
    expect(md).not.toContain('## Commit & PR');
    expect(md).not.toContain('## Guardrails');
  });
});
