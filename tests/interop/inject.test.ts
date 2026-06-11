/**
 * interop/inject — non-destructive faf-block injection.
 * Regression guard for the file-wipe bug: the four interop writers must ENHANCE
 * existing AGENTS.md / GEMINI.md / .cursorrules / CLAUDE.md, never replace them.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { injectFafBlock, FAF_START, FAF_END } from '../../src/interop/inject.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeClaudeMd, generateClaudeMd } from '../../src/interop/claude.js';

function tmp(): string { return mkdtempSync(join(tmpdir(), 'faf-inject-')); }
const DATA: any = {
  project: { name: 'demo', goal: 'A small API', main_language: 'TypeScript' },
  stack: { backend: 'Express' },
  human_context: { who: 'devs' },
};

describe('injectFafBlock — non-destructive', () => {
  test('no file → creates it with the block', () => {
    const p = join(tmp(), 'F.md');
    injectFafBlock(p, 'hello');
    const out = readFileSync(p, 'utf-8');
    expect(out).toContain(FAF_START);
    expect(out).toContain('hello');
    expect(out).toContain(FAF_END);
  });

  test('existing file, no markers → prefixes block + preserves user content', () => {
    const p = join(tmp(), 'F.md');
    writeFileSync(p, '# Mine\nMUST SURVIVE\n');
    injectFafBlock(p, 'faf-block');
    const out = readFileSync(p, 'utf-8');
    expect(out).toContain('MUST SURVIVE');
    expect(out).toContain('faf-block');
    expect(out.indexOf(FAF_START)).toBeLessThan(out.indexOf('MUST SURVIVE'));
  });

  test('existing markers → updates in place, keeps surroundings, no duplicate', () => {
    const p = join(tmp(), 'F.md');
    injectFafBlock(p, 'v1');
    writeFileSync(p, readFileSync(p, 'utf-8') + '\nUSER TAIL\n');
    injectFafBlock(p, 'v2');
    const out = readFileSync(p, 'utf-8');
    expect(out).toContain('v2');
    expect(out).not.toContain('v1');
    expect(out).toContain('USER TAIL');
    expect(out.split(FAF_START).length - 1).toBe(1);
  });

  test('idempotent → running twice is identical', () => {
    const p = join(tmp(), 'F.md');
    writeFileSync(p, '# Mine\nkeep me\n');
    injectFafBlock(p, 'block');
    const once = readFileSync(p, 'utf-8');
    injectFafBlock(p, 'block');
    expect(readFileSync(p, 'utf-8')).toBe(once);
  });
});

describe('interop writers — enhance, never replace', () => {
  const MARK = '## HAND-WRITTEN — MUST SURVIVE';

  test('writeAgentsMd preserves an existing AGENTS.md', () => {
    const d = tmp();
    writeFileSync(join(d, 'AGENTS.md'), `# Mine\n${MARK}\nnotes\n`);
    writeAgentsMd(d, DATA);
    const out = readFileSync(join(d, 'AGENTS.md'), 'utf-8');
    expect(out).toContain(MARK);
    expect(out).toContain('demo');
  });

  test('writeGeminiMd preserves an existing GEMINI.md', () => {
    const d = tmp();
    writeFileSync(join(d, 'GEMINI.md'), `# Mine\n${MARK}\nnotes\n`);
    writeGeminiMd(d, DATA);
    const out = readFileSync(join(d, 'GEMINI.md'), 'utf-8');
    expect(out).toContain(MARK);
    expect(out).toContain('demo');
  });

  test('writeCursorrules preserves an existing .cursorrules', () => {
    const d = tmp();
    writeFileSync(join(d, '.cursorrules'), `# Mine\n${MARK}\nnotes\n`);
    writeCursorrules(d, DATA);
    const out = readFileSync(join(d, '.cursorrules'), 'utf-8');
    expect(out).toContain(MARK);
    expect(out).toContain('# faf:start');
  });

  test('writeClaudeMd preserves an existing CLAUDE.md', () => {
    const d = tmp();
    writeFileSync(join(d, 'CLAUDE.md'), `# Mine\n${MARK}\nnotes\n`);
    writeClaudeMd(d, generateClaudeMd(DATA));
    const out = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    expect(out).toContain(MARK);
  });
});
