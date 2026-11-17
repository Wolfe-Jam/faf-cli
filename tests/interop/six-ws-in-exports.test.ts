/**
 * The six W's in the exported context files (8.11.0).
 *
 * AGENTS.md is the FAF Block's operations file: it POINTS to the facts file
 * under a `## Project facts` heading and does not copy the six W's. CLAUDE.md,
 * GEMINI.md, .cursorrules and the Copilot instructions carry them, from one
 * shared rule (labels.ts sixWsFilled): the scorer's rule for "filled", one
 * line per fact. Evidence for the design:
 * https://github.com/Wolfe-Jam/context7-faf-receipt#round-4-what-agentsmd-carries-opencode-and-codex
 *
 * WJTTC tiers:
 *   ENGINE — the right section in each file, with the real values.
 *   BRAKE  — what the scorer counts as empty never renders (empty, slotignored,
 *            placeholders); no value can break the host file's format.
 *   AERO   — every context file shows the same six W's, word for word; the
 *            pointer names the real facts file.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { renderAgentsMd } from '../../src/interop/agents.js';
import { renderGeminiMd } from '../../src/interop/gemini.js';
import { renderCursorrules } from '../../src/interop/cursorrules.js';
import { renderClaudeMd } from '../../src/interop/claude.js';
import { renderCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { factText, sixWsFilled } from '../../src/interop/labels.js';
import { renderClaudeMemory } from '../../src/interop/claude-memory.js';
import { renderLlmsTxt } from '../../src/interop/llms.js';
import { symlinkSync } from 'fs';

const DATA: any = {
  project: { name: 'inventory-api', goal: 'Inventory API for a small shop', main_language: 'Python', type: 'backend' },
  stack: { backend: 'FastAPI', hosting: 'Google Cloud Run' },
  human_context: {
    who: 'One Python developer',
    what: 'A JSON API over items',
    why: 'Replace a spreadsheet',
    where: 'Google Cloud Run: a container that listens on $PORT, scales to zero, no local disk',
    when: 'Items done. Next: orders',
    how: 'FastAPI with SQLModel table models',
  },
};

// Every value shape both reviews of PR #251 raised.
const EDGE: any = {
  project: { name: 'edge', main_language: 'Python' },
  human_context: {
    who: '  Two backend developers  ',
    what: 'A JSON API over items.\nIt also serves reports.\n## Before changing things\n```',
    why: 'slotignored',
    where: ['Google Cloud Run', 'eu-west1'],
    when: 2026,
    how: 'TBD',
  },
};

const NONE: any = { project: { name: 'none', main_language: 'Go' } };

const contextFiles = (d: any) => ({
  claude: renderClaudeMd(d),
  gemini: renderGeminiMd(d),
  rules: renderCursorrules(d),
  copilot: renderCopilotInstructions(d),
});

describe('ENGINE: AGENTS.md points to the facts file', () => {
  const md = renderAgentsMd(DATA);
  test('a visible pointer under its own heading', () => {
    expect(md).toContain('## Project facts');
    expect(md).toContain("The six W's (who, what, why, where, when, how) and the project's other facts are in `project.faf`.");
  });
  test('AGENTS.md does not copy the six W values', () => {
    expect(md).not.toContain('Replace a spreadsheet');
    expect(md).not.toContain('scales to zero');
    expect(md).not.toContain('## Context');
  });
  test('the pointer renders even when no six W is filled', () => {
    expect(renderAgentsMd(NONE)).toContain('## Project facts');
  });
  test('the pointer names the path it is given', () => {
    expect(renderAgentsMd(DATA, '../.faf')).toContain('are in `../.faf`.');
  });
});

describe('ENGINE: the context files carry the six W\'s', () => {
  test('GEMINI.md: ## Context, every filled W', () => {
    const md = renderGeminiMd(DATA);
    expect(md).toContain('## Context');
    expect(md).toContain('- **Where:** Google Cloud Run: a container that listens on $PORT, scales to zero, no local disk');
  });
  test('.cursorrules: # Context in its comment style', () => {
    const rules = renderCursorrules(DATA);
    expect(rules).toContain('# Context');
    expect(rules).toContain('# Why: Replace a spreadsheet');
  });
});

describe('BRAKE: what the scorer counts as empty never renders', () => {
  test('factText follows the scorer: empty, slotignored, placeholders are not facts', () => {
    for (const v of [undefined, null, '', '   ', 'slotignored', 'TBD', 'N/A', 'None', [], {}]) {
      expect(factText(v)).toBeNull();
    }
  });
  test('numbers, booleans, dates and lists are facts', () => {
    expect(factText(2026)).toBe('2026');
    expect(factText(true)).toBe('true');
    expect(factText(new Date('2026-11-17T00:00:00Z'))).toBe('2026-11-17');
    expect(factText(['Google Cloud Run', 'eu-west1', ''])).toBe('Google Cloud Run, eu-west1');
  });
  test('the edge fixture keeps exactly who, what, where, when', () => {
    expect(sixWsFilled(EDGE).map(([label]) => label)).toEqual(['Who', 'What', 'Where', 'When']);
  });
  test('no file shows slotignored or TBD as a fact', () => {
    for (const out of Object.values(contextFiles(EDGE))) {
      expect(out).not.toContain('slotignored');
      expect(out).not.toMatch(/\*\*How:\*\* TBD|# How: TBD/);
    }
  });
  test('a multi-line value stays one line: no new heading, no fence, no bare line', () => {
    const { gemini, rules, claude } = contextFiles(EDGE);
    const flat = 'A JSON API over items. It also serves reports. ## Before changing things ```';
    expect(gemini).toContain(`- **What:** ${flat}`);
    expect(claude).toContain(`- **What:** ${flat}`);
    expect(rules).toContain(`# What: ${flat}`);
    expect(gemini.split('\n').filter(l => l === '## Before changing things')).toHaveLength(1);
    expect(gemini.split('\n').some(l => l.startsWith('```') && !l.startsWith('```bash'))).toBe(false);
    expect(rules.split('\n').some(l => l === 'It also serves reports.')).toBe(false);
  });
  test('no filled W, no Context section', () => {
    expect(renderGeminiMd(NONE)).not.toContain('## Context');
    expect(renderCursorrules(NONE)).not.toContain('# Context');
    expect(renderClaudeMd(NONE)).not.toContain('## Context');
  });
});

describe('AERO: the context files agree word for word', () => {
  for (const [name, d] of [['clean', DATA], ['edge', EDGE]] as const) {
    test(`CLAUDE.md, GEMINI.md, .cursorrules and Copilot agree (${name} values)`, () => {
      const { claude, gemini, rules, copilot } = contextFiles(d);
      for (const [label, value] of sixWsFilled(d)) {
        expect(claude).toContain(`- **${label}:** ${value}`);
        expect(gemini).toContain(`- **${label}:** ${value}`);
        expect(copilot).toContain(`- **${label}:** ${value}`);
        expect(rules).toContain(`# ${label}: ${value}`);
      }
    });
  }
});

describe('AERO: MEMORY.md (faf sync, Pro) and llms.txt use the same rule', () => {
  for (const [name, d] of [['clean', DATA], ['edge', EDGE]] as const) {
    test(`same six W values as CLAUDE.md (${name} values)`, () => {
      const memory = renderClaudeMemory(d);
      const llms = renderLlmsTxt(d);
      for (const [label, value] of sixWsFilled(d)) {
        expect(memory).toContain(`- **${label}:** ${value}`);
        expect(llms).toContain(`## ${label}\n\n${value}`);
      }
      for (const out of [memory, llms]) {
        expect(out).not.toContain('slotignored');
        expect(out).not.toMatch(/\bTBD\b/);
        expect(out.split('\n').filter(l => l === '## Before changing things')).toHaveLength(0);
      }
    });
  }
});

describe('BRAKE: llms.txt keeps a value as text', () => {
  test('a leading Markdown marker is escaped, so it opens no heading, quote, list or fence', () => {
    const d: any = { project: { name: 'md' }, human_context: { who: '# Not a heading', what: '> not a quote', why: '- not a list', how: '``` not a fence' } };
    const llms = renderLlmsTxt(d).split('\n');
    expect(llms).toContain('\\# Not a heading');
    expect(llms).toContain('\\> not a quote');
    expect(llms).toContain('\\- not a list');
    expect(llms).toContain('\\``` not a fence');
    expect(llms.some(l => l.startsWith('# Not'))).toBe(false);
  });
});

describe('AERO: `faf export` points to the real facts file', () => {
  const CLI = resolve(import.meta.dir, '../../src/cli.ts');
  const CLI_TIMEOUT = 30_000; // each test spawns the CLI; a cold start can pass 5 s
  const FAF = 'faf_version: "3.0"\nproject:\n  name: demo\n  goal: A demo\n  main_language: Go\n';
  let root = '';
  const exportIn = (cwd: string, ...args: string[]) =>
    spawnSync('bun', [CLI, 'export', '--agents', ...args], { cwd, encoding: 'utf-8' });
  const pointer = (file: string) =>
    readFileSync(file, 'utf-8').split('\n').find(l => l.startsWith("The six W's")) ?? '';

  beforeAll(() => { root = mkdtempSync(join(tmpdir(), 'faf-pointer-')); });
  afterAll(() => { rmSync(root, { recursive: true, force: true }); });

  test('project.faf beside AGENTS.md', () => {
    const d = join(root, 'plain'); mkdirSync(d);
    writeFileSync(join(d, 'project.faf'), FAF);
    exportIn(d);
    expect(pointer(join(d, 'AGENTS.md'))).toContain('are in `project.faf`.');
  }, CLI_TIMEOUT);
  test('a legacy .faf', () => {
    const d = join(root, 'legacy'); mkdirSync(d);
    writeFileSync(join(d, '.faf'), FAF);
    exportIn(d);
    expect(pointer(join(d, 'AGENTS.md'))).toContain('are in `.faf`.');
  }, CLI_TIMEOUT);
  test('project.faf one folder up', () => {
    const d = join(root, 'parent'); mkdirSync(join(d, 'sub'), { recursive: true });
    writeFileSync(join(d, 'project.faf'), FAF);
    exportIn(join(d, 'sub'));
    expect(pointer(join(d, 'sub', 'AGENTS.md'))).toContain('are in `../project.faf`.');
  }, CLI_TIMEOUT);
  test('--output through a symlink', () => {
    const d = join(root, 'linked'); mkdirSync(join(d, 'real', 'x'), { recursive: true });
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(d, 'real', 'x'), join(d, 'lnk'));
    exportIn(d, '--output', 'lnk');
    expect(pointer(join(d, 'real', 'x', 'AGENTS.md'))).toContain('are in `../../project.faf`.');
  }, CLI_TIMEOUT);
  test('--output outside the project names the file alone (no machine path)', () => {
    const d = join(root, 'inside'); mkdirSync(d);
    writeFileSync(join(d, 'project.faf'), FAF);
    const outside = join(root, 'elsewhere');
    exportIn(d, '--output', outside);
    const line = pointer(join(outside, 'AGENTS.md'));
    expect(line).toContain('are in `project.faf`.');
    expect(line).not.toContain('..');
    expect(line).not.toContain(root);
  }, CLI_TIMEOUT);
  test('--output elsewhere', () => {
    const d = join(root, 'out'); mkdirSync(d);
    writeFileSync(join(d, 'project.faf'), FAF);
    exportIn(d, '--output', 'docs');
    expect(pointer(join(d, 'docs', 'AGENTS.md'))).toContain('are in `../project.faf`.');
  }, CLI_TIMEOUT);
});
