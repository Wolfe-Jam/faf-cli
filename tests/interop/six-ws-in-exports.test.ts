/**
 * The six W's in the exported context files (8.11.0).
 *
 * AGENTS.md is the FAF Block's operations file: it POINTS to project.faf with a
 * visible line and does not copy the six W's. GEMINI.md and .cursorrules are
 * context files like CLAUDE.md, so they carry the six W's. Tested 2026-11-17
 * with Codex and OpenCode: the HTML-comment claim alone let agents find the
 * team's decisions 4/22 times; the visible pointer 12/21; the facts written
 * into the file 20/20.
 *
 * WJTTC tiers:
 *   ENGINE — the right section appears in each file, with the real values.
 *   BRAKE  — empty and slotignored slots never render; no facts, no section.
 *   AERO   — every context file shows the same six W's, word for word.
 */
import { describe, test, expect } from 'bun:test';
import { renderAgentsMd } from '../../src/interop/agents.js';
import { renderGeminiMd } from '../../src/interop/gemini.js';
import { renderCursorrules } from '../../src/interop/cursorrules.js';
import { renderClaudeMd } from '../../src/interop/claude.js';
import { sixWsFilled } from '../../src/interop/labels.js';

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

const PARTIAL: any = {
  project: { name: 'partial', main_language: 'Go' },
  human_context: { who: 'Go developers', what: '', why: 'slotignored', where: '  ', how: 'Standard library only' },
};

const NONE: any = { project: { name: 'none', main_language: 'Go' } };

const POINTER = "Project facts, including the six W's (who, what, why, where, when, how): see `project.faf`.";

describe('ENGINE: AGENTS.md points to project.faf', () => {
  const md = renderAgentsMd(DATA);
  test('the pointer is a visible line, not only the claim= comment', () => {
    expect(md).toContain(POINTER);
    const line = md.split('\n').find(l => l.includes("six W's"));
    expect(line?.startsWith('<!--')).toBe(false);
  });
  test('AGENTS.md does not copy the six W values', () => {
    expect(md).not.toContain('Replace a spreadsheet');
    expect(md).not.toContain('scales to zero');
    expect(md).not.toContain('## Context');
  });
  test('the pointer renders even when no six W is filled', () => {
    expect(renderAgentsMd(NONE)).toContain(POINTER);
  });
});

describe('ENGINE: GEMINI.md and .cursorrules carry the six W\'s', () => {
  test('GEMINI.md has a Context section with every filled W', () => {
    const md = renderGeminiMd(DATA);
    expect(md).toContain('## Context');
    expect(md).toContain('- **Where:** Google Cloud Run: a container that listens on $PORT, scales to zero, no local disk');
    expect(md).toContain('- **When:** Items done. Next: orders');
  });
  test('.cursorrules has a Context section in its comment style', () => {
    const rules = renderCursorrules(DATA);
    expect(rules).toContain('# Context');
    expect(rules).toContain('# Why: Replace a spreadsheet');
    expect(rules).toContain('# How: FastAPI with SQLModel table models');
  });
});

describe('BRAKE: empty and slotignored never render', () => {
  test('only filled W\'s, in order', () => {
    expect(sixWsFilled(PARTIAL)).toEqual([['Who', 'Go developers'], ['How', 'Standard library only']]);
  });
  test('no filled W, no Context section', () => {
    expect(renderGeminiMd(NONE)).not.toContain('## Context');
    expect(renderCursorrules(NONE)).not.toContain('# Context');
  });
  test('slotignored text never appears', () => {
    expect(renderGeminiMd(PARTIAL)).not.toContain('slotignored');
    expect(renderCursorrules(PARTIAL)).not.toContain('slotignored');
  });
});

describe('AERO: the context files agree word for word', () => {
  test('CLAUDE.md, GEMINI.md and .cursorrules show every W value identically', () => {
    const claude = renderClaudeMd(DATA);
    const gemini = renderGeminiMd(DATA);
    const rules = renderCursorrules(DATA);
    for (const [label, value] of sixWsFilled(DATA)) {
      expect(claude).toContain(`- **${label}:** ${value}`);
      expect(gemini).toContain(`- **${label}:** ${value}`);
      expect(rules).toContain(`# ${label}: ${value}`);
    }
  });
});
