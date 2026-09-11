/**
 * BRAKE: every writer of a user-editable file is non-destructive.
 *
 * Owner rule: no faf writer replaces, reorders, truncates or deletes text it
 * cannot prove it wrote. faf can prove one region: what sits between its own
 * marker lines. Everything else is the user's — every line of it must survive,
 * in order, byte-for-byte. A file with no marker lines is never reclaimed, even
 * one that starts with faf's metastamp and ends with its
 * `*STATUS: [BI-]SYNC ACTIVE — …*` footer: the block goes on top.
 *
 * Each writer runs over the same fixture shapes: user lines above and below a
 * block, balanced fences that document the marker lines, CRLF, a BOM,
 * faf-looking metastamp-led files with and without a footer (and with notes
 * after the footer), then a second write that must change nothing (one block,
 * always).
 *
 * The managed block is located independently of findFafBlock: the test knows
 * the exact bytes the writer wraps (the renderer is deterministic), so a bug in
 * the block finder cannot hide a bug in the writer.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { FAF_START, FAF_END } from '../../src/interop/inject.js';
import { writeClaudeMd, renderClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd, renderAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd, renderGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules, renderCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions, renderCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeLlmsTxt, renderLlmsTxt } from '../../src/interop/llms.js';
import { writeMemoryMd } from '../../src/interop/memory.js';

const DATA: any = {
  faf_version: '3.0',
  project: { name: 'demo', goal: 'A small API for the team', main_language: 'TypeScript', type: 'backend' },
  stack: { backend: 'Express', runtime: 'Node.js' },
  human_context: { who: 'Platform devs', what: 'Internal API', why: 'One source of truth' },
  commands: { build: 'npm run build', test: 'npm test' },
};
const CLAUDE_BODY = renderClaudeMd(DATA); // rendered once: the footer carries a timestamp
const MEMORY_BODY = '# demo — Memory Topics\n\n> Authored by faf sync (tri-sync)\n\n- **Project:** demo\n- **Goal:** A small API for the team\n';

interface Writer {
  name: string;
  file: string;
  body: string;
  start: string;
  end: string;
  write: (dir: string) => void;
}

const WRITERS: Writer[] = [
  { name: 'writeClaudeMd', file: 'CLAUDE.md', body: CLAUDE_BODY, start: FAF_START, end: FAF_END, write: d => writeClaudeMd(d, CLAUDE_BODY) },
  { name: 'writeAgentsMd', file: 'AGENTS.md', body: renderAgentsMd(DATA), start: FAF_START, end: FAF_END, write: d => writeAgentsMd(d, DATA) },
  { name: 'writeGeminiMd', file: 'GEMINI.md', body: renderGeminiMd(DATA), start: FAF_START, end: FAF_END, write: d => writeGeminiMd(d, DATA) },
  { name: 'writeCursorrules', file: '.cursorrules', body: renderCursorrules(DATA), start: '# faf:start', end: '# faf:end', write: d => writeCursorrules(d, DATA) },
  { name: 'writeCopilotInstructions', file: '.github/copilot-instructions.md', body: renderCopilotInstructions(DATA), start: FAF_START, end: FAF_END, write: d => writeCopilotInstructions(d, DATA) },
  { name: 'writeMemoryMd', file: 'MEMORY.md', body: MEMORY_BODY, start: FAF_START, end: FAF_END, write: d => writeMemoryMd(d, MEMORY_BODY) },
  { name: 'writeLlmsTxt', file: 'llms.txt', body: renderLlmsTxt(DATA), start: FAF_START, end: FAF_END, write: d => writeLlmsTxt(d, DATA) },
];

interface Shape {
  name: string;
  /** File content before the write. */
  before: string;
  /** Expected bytes OUTSIDE the new managed block after the write. */
  outside: string;
  /** The user's own text in `before` — every line of it must survive, in order. */
  user: string;
}

const BOM = '\uFEFF';
const LEGACY_HEAD = [
  '<!-- faf: demo | TypeScript | backend | A small API -->',
  '<!-- faf: claim=project.faf | family=FAF -->',
  '',
  '# CLAUDE.md — demo',
  '',
  '## What This Is',
  '',
  'old faf-rendered body',
  '',
  '---',
  '',
];
const BI_FOOTER = '*STATUS: BI-SYNC ACTIVE — 2026-05-30T23:32:37.806Z*';
const SYNC_FOOTER = '*STATUS: SYNC ACTIVE — 2026-09-10T09:00:00.000Z*';

function shapes(S: string, E: string): Shape[] {
  const out: Shape[] = [];
  const add = (name: string, before: string, outside: string, user: string) => out.push({ name, before, outside, user });

  const above = '# My own notes\nUSER ABOVE 1\nUSER ABOVE 2\n\n';
  const below = '\n\nUSER BELOW 1\n\n## Section\nUSER BELOW 2\n';
  add('user lines above and below an existing block', `${above}${S}\nold faf body\n${E}${below}`, above + below, above + below);

  const fencedDoc = `# Notes\n\nThe managed block looks like this:\n\n\`\`\`md\n${S}\n(faf writes here)\n${E}\n\`\`\`\n\nUSER TAIL\n`;
  add('balanced fence documenting the markers, no real block', fencedDoc, `\n\n${fencedDoc}`, fencedDoc);

  const twoFences = `\`\`\`md\n${S}\nexample one\n${E}\n\`\`\`\n\n~~~text\n${S}\nexample two\n${E}\n~~~\n\n`;
  add('balanced fences above a real block', `${twoFences}${S}\nold faf body\n${E}\n\nUSER BELOW\n`, `${twoFences}\n\nUSER BELOW\n`, `${twoFences}\n\nUSER BELOW\n`);

  const fencedThenOpen = `\`\`\`md\n${S}\nexample\n${E}\n\`\`\`\n\nUSER MIDDLE\n\n\`\`\`bash\nnpm test\n`;
  add('balanced fenced example, then an unclosed fence, no real block', fencedThenOpen, `\n\n${fencedThenOpen}`, fencedThenOpen);

  const crlfUser = '# Mine\r\nUSER CRLF 1\r\n\r\nUSER CRLF 2\r\n';
  add('CRLF user file, no block', crlfUser, `\n\n${crlfUser}`, crlfUser);
  add('CRLF with a block in the middle', `A-CRLF\r\n\r\n${S}\r\nold\r\n${E}\r\n\r\nB-CRLF\r\n`, 'A-CRLF\r\n\r\n\r\n\r\nB-CRLF\r\n', 'A-CRLF\r\n\r\n\r\n\r\nB-CRLF\r\n');

  add('BOM-led user file, no block', `${BOM}# Mine\nUSER BOM LINE\n`, `${BOM}\n\n# Mine\nUSER BOM LINE\n`, '# Mine\nUSER BOM LINE\n');
  add('BOM, block at the top', `${BOM}${S}\nold\n${E}\n\nUSER UNDER BOM\n`, `${BOM}\n\nUSER UNDER BOM\n`, '\n\nUSER UNDER BOM\n');

  // faf-looking files with no marker lines: never reclaimed, whatever their
  // first and last lines say — prefixed, every byte kept.
  const noMarkers = (name: string, before: string) => add(name, before, `\n\n${before}`, before);
  const notes = '\n\n## Team rules\n\nUSER NOTE 1\nUSER NOTE 2\n';
  noMarkers('metastamp + BI-SYNC footer + notes after it, no markers', `${LEGACY_HEAD.join('\n')}\n${BI_FOOTER}${notes}`);
  noMarkers('metastamp + SYNC footer at EOF, no markers', `${LEGACY_HEAD.join('\n')}\n${SYNC_FOOTER}\n`);
  noMarkers('metastamp + footer, CRLF, notes after the footer, no markers', `${LEGACY_HEAD.join('\r\n')}\r\n${BI_FOOTER}\r\n\r\nUSER CRLF NOTE\r\n`);
  const bomLegacy = `${LEGACY_HEAD.join('\n')}\n${SYNC_FOOTER}\nUSER BOM NOTE\n`;
  add('metastamp + footer behind a BOM, no markers', `${BOM}${bomLegacy}`, `${BOM}\n\n${bomLegacy}`, bomLegacy);
  noMarkers('metastamp-led file WITHOUT a footer, no markers', `${LEGACY_HEAD.join('\n')}\nUSER LINE IN A FOOTERLESS FILE\n`);
  return out;
}

/** Lines of text as a reader sees them: BOM and terminators gone, blank lines dropped. */
function lines(text: string): string[] {
  return text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
}
function markerLines(text: string, marker: string): number {
  return text.split(/\r\n|\r|\n/).filter(l => l.replace(/^\uFEFF/, '').trimEnd() === marker).length;
}
function fail(msg: string): never {
  throw new Error(msg);
}

describe('BRAKE: non-destructive writers — every user line survives, one block, every run', () => {
  for (const w of WRITERS) {
    test(`${w.name} (${w.file})`, () => {
      const wrapped = `${w.start}\n${w.body.trim()}\n${w.end}`;
      for (const s of shapes(w.start, w.end)) {
        const dir = mkdtempSync(join(tmpdir(), 'faf-ndw-'));
        const path = join(dir, w.file);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, s.before);

        w.write(dir);
        const first = readFileSync(path, 'utf-8');
        const where = `${w.name} / ${s.name}`;

        // Exactly one managed block — the one this writer wraps.
        if (first.split(wrapped).length - 1 !== 1) {fail(`${where}: expected exactly one managed block\n---\n${first}`);}
        if (markerLines(first, w.start) !== markerLines(s.user, w.start) + 1) {fail(`${where}: start-marker lines ≠ user's + 1\n---\n${first}`);}
        if (markerLines(first, w.end) !== markerLines(s.user, w.end) + 1) {fail(`${where}: end-marker lines ≠ user's + 1\n---\n${first}`);}

        // Every byte outside the block is what the user had (or the BOM/separator faf adds).
        const outside = first.replace(wrapped, '');
        expect({ where, outside }).toEqual({ where, outside: s.outside });
        // …so every user line survives, in order.
        expect({ where, lines: lines(outside) }).toEqual({ where, lines: lines(s.user) });
        if (s.before.startsWith(BOM) && (!first.startsWith(BOM) || first.indexOf(w.start) !== 1)) {
          fail(`${where}: the BOM must stay at byte 0 with the block right after it`);
        }

        // A second write changes nothing.
        w.write(dir);
        expect({ where, second: readFileSync(path, 'utf-8') }).toEqual({ where, second: first });
      }
    });
  }
});
