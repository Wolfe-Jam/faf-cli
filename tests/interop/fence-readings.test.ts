/**
 * BRAKE: faf's block is found only where CommonMark and the plain column-0
 * reading agree — the 7.13 re-check (verify2 t-fence F01-F03, F10-F16,
 * round-1 C30, regression #3).
 *
 * Round 2's scanner read fences the CommonMark way at column 0, with a patch
 * for a fence right after a list marker. It still took marker examples that
 * CommonMark shows as code for faf's block, and replaced them:
 *   - a fence opened in a list item was closed or ended at the wrong column:
 *     a tab after the marker counted as one column (F03), a closer indented
 *     5 spaces inside an item was missed (F02), and a fence left open in an
 *     item never ended when the item did (F01, F16);
 *   - HTML blocks of types 3, 5 and 6 were not regions: <?php … ?> (F12),
 *     <![CDATA[ … ]]> (F11), and a stray ``` inside <details> opened a fence
 *     that ate the real one (F10); a <pre> opened in a list item (F13);
 *   - with two column-0 STARTs before an END, the text between them was
 *     replaced (F14);
 *   - a marker line with trailing spaces or a tab still counted (C30).
 *
 * Now every file is read two ways — CommonMark with its list items and
 * block quotes (src/interop/commonmark.ts, the reference algorithm), and
 * plainly at column 0 — and a START/END pair is faf's only when both find
 * the same one; otherwise faf prefixes and keeps every byte. The pair is the
 * last START before the first END, and a marker line is exactly the marker.
 * When faf prefixes a file whose older block sits in a fence, <pre> or
 * comment, `faf sync` / `faf export` say so in one line.
 */
import { describe, test, expect } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import {
  FAF_END,
  FAF_START,
  findFafBlock,
  injectFafBlock,
  legacyStampNote,
  placeFafBlock,
  withFafBlock,
  wrapFafBlock,
} from '../../src/interop/inject.js';
import { BlockReader } from '../../src/interop/commonmark.js';
import { writeClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeMemoryMd } from '../../src/interop/memory.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';
import { writeClaudeMemory } from '../../src/interop/claude-memory.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const F = '```';
const DATA: any = {
  project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' },
  stack: { frontend: 'React' },
};

function dir(tag = 'faf-readings-'): string {
  return realpathSync(mkdtempSync(join(tmpdir(), tag)));
}

interface Writer {
  name: string;
  rel: string;
  S: string;
  E: string;
  write: (d: string) => void;
}
const HTML = { S: FAF_START, E: FAF_END };
const WRITERS: Writer[] = [
  { name: 'injectFafBlock', rel: 'NOTES.md', ...HTML, write: d => injectFafBlock(join(d, 'NOTES.md'), 'NEW-BODY') },
  { name: 'writeClaudeMd', rel: 'CLAUDE.md', ...HTML, write: d => writeClaudeMd(d, 'NEW-CLAUDE-BODY') },
  { name: 'writeAgentsMd', rel: 'AGENTS.md', ...HTML, write: d => writeAgentsMd(d, DATA) },
  { name: 'writeGeminiMd', rel: 'GEMINI.md', ...HTML, write: d => writeGeminiMd(d, DATA) },
  { name: 'writeCursorrules', rel: '.cursorrules', S: '# faf:start', E: '# faf:end', write: d => writeCursorrules(d, DATA) },
  { name: 'writeCopilotInstructions', rel: '.github/copilot-instructions.md', ...HTML, write: d => writeCopilotInstructions(d, DATA) },
  { name: 'writeMemoryMd', rel: 'MEMORY.md', ...HTML, write: d => writeMemoryMd(d, 'NEW-MEM-BODY') },
  { name: 'writeLlmsTxt', rel: 'llms.txt', ...HTML, write: d => writeLlmsTxt(d, DATA) },
  { name: 'writeClaudeMemory', rel: 'mem/MEMORY.md', ...HTML, write: d => { writeClaudeMemory(d, DATA, { memoryDir: join(d, 'mem') }); } },
];

/** The re-check's fixtures: a marker example CommonMark shows as code (or hides in raw HTML). */
const EXAMPLES: Array<{ id: string; name: string; text: (S: string, E: string) => string; keep: string }> = [
  { id: 'F01', name: 'list-item fence left open (the next item ends it), then a bare ``` example',
    text: (S, E) => `# Setup\n\n1. Install:\n   ${F}bash\n   npm i -g faf-cli\n2. Run \`faf init\`.\n\n## What faf adds\n\n${F}\n${S}\nEXAMPLE-BODY-HAND-F01\n${E}\n${F}\n\nHAND-AFTER\n`, keep: 'EXAMPLE-BODY-HAND-F01' },
  { id: 'F02', name: 'list-item fence closed 5 spaces deep, then a bare ``` example',
    text: (S, E) => `- Build:\n  ${F}sh\n  make\n     ${F}\n\n${F}\n${S}\nEXAMPLE-BODY-HAND-F02\n${E}\n${F}\n`, keep: 'EXAMPLE-BODY-HAND-F02' },
  { id: 'F03', name: 'a tab after the list marker (content at column 4); a 2-space ``` opens a new fence',
    text: (S, E) => `-\t${F}sh\n\tmake\n  ${F}\n${S}\nEXAMPLE-BODY-HAND-F03\n${E}\n  ${F}\nHAND-AFTER\n`, keep: 'EXAMPLE-BODY-HAND-F03' },
  { id: 'F10', name: '<details> (type 6) holding a stray ```, then a fenced example',
    text: (S, E) => `<details>\n${F}\n</details>\n\n${F}\n${S}\nEXAMPLE-BODY-HAND-F10\n${E}\n${F}\n`, keep: 'EXAMPLE-BODY-HAND-F10' },
  { id: 'F11', name: 'a CDATA block (type 5) holding an example',
    text: (S, E) => `<![CDATA[\n${S}\nEXAMPLE-BODY-HAND-F11\n${E}\n]]>\n`, keep: 'EXAMPLE-BODY-HAND-F11' },
  { id: 'F12', name: 'a processing instruction (type 3) holding an example',
    text: (S, E) => `<?php\n${S}\nEXAMPLE-BODY-HAND-F12\n${E}\n?>\n`, keep: 'EXAMPLE-BODY-HAND-F12' },
  { id: 'F13', name: 'a list-item <pre> left open, then a fence holding </pre> and an example',
    text: (S, E) => `- item\n  <pre>\nHAND-PARA\n${F}\n</pre>\n${S}\nEXAMPLE-BODY-HAND-F13\n${E}\n${F}\n`, keep: 'EXAMPLE-BODY-HAND-F13' },
  { id: 'F16', name: 'an ordered "1)" item fence left open, a paragraph at column 0, then a bare ``` example',
    text: (S, E) => `1) Run:\n   ${F}\n   faf auto\nThat is all.\n\n${F}\n${S}\nEXAMPLE-BODY-HAND-F16\n${E}\n${F}\n`, keep: 'EXAMPLE-BODY-HAND-F16' },
  { id: 'C30', name: 'marker lines with a trailing tab and a trailing space are text',
    text: (S, E) => `HAND-TOP\n${S}\t\nUSER-WROTE-BETWEEN-TABBED-MARKERS\n${E} \nHAND-END\n`, keep: 'USER-WROTE-BETWEEN-TABBED-MARKERS' },
];

function write(w: Writer, text: string): { d: string; file: string } {
  const d = dir();
  const file = join(d, w.rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  return { d, file };
}

describe('BRAKE: an example CommonMark shows as code is never the block — every writer prefixes (F01-F03, F10-F13, F16, C30)', () => {
  for (const w of WRITERS) {
    for (const c of EXAMPLES) {
      test(`${w.name} · ${c.id} ${c.name}`, () => {
        const before = c.text(w.S, w.E);
        const { d, file } = write(w, before);
        w.write(d);
        const first = readFileSync(file, 'utf-8');
        expect(first.endsWith(before)).toBe(true);
        expect(first.startsWith(`${w.S}\n`)).toBe(true);
        expect(first).toContain(c.keep);
        w.write(d);
        expect(readFileSync(file, 'utf-8')).toBe(first);
      });
    }
  }
});

describe('BRAKE: two column-0 STARTs before an END — the innermost pair is the block, the text between is kept (F14)', () => {
  for (const w of WRITERS) {
    test(w.name, () => {
      const before = `HAND-TOP\n${w.S}\nHAND-BETWEEN-TWO-STARTS-F14\n${w.S}\nold faf body\n${w.E}\nHAND-END\n`;
      const { d, file } = write(w, before);
      w.write(d);
      const first = readFileSync(file, 'utf-8');
      expect(first.startsWith(`HAND-TOP\n${w.S}\nHAND-BETWEEN-TWO-STARTS-F14\n${w.S}\n`)).toBe(true);
      expect(first.endsWith(`${w.E}\nHAND-END\n`)).toBe(true);
      expect(first).not.toContain('old faf body');
      w.write(d);
      expect(readFileSync(file, 'utf-8')).toBe(first);
    });
  }
});

describe('BRAKE: findFafBlock — both readings must find the same pair', () => {
  test('exact marker lines: CRLF matches, trailing whitespace does not', () => {
    expect(findFafBlock(`a\r\n${FAF_START}\r\nbody\r\n${FAF_END}\r\nb\r\n`)).not.toBeNull();
    expect(findFafBlock(`${FAF_START} \nbody\n${FAF_END}\n`)).toBeNull();
    expect(findFafBlock(`${FAF_START}\nbody\n${FAF_END}\t\n`)).toBeNull();
    expect(findFafBlock(`\uFEFF${FAF_START}\nbody\n${FAF_END}\n`)).toEqual({ start: 1, end: 1 + `${FAF_START}\nbody\n${FAF_END}`.length });
  });

  test('a list-item fence: closed at its content column, the readings disagree — no block; left open, it ends with the item — the block after it is found', () => {
    const closed = `- ${F}bash\n  npm i\n  ${F}\n\n${FAF_START}\nold body\n${FAF_END}\n`;
    expect(findFafBlock(closed)).toBeNull();
    const open = `- ${F}bash\n  npm i\n${FAF_START}\nbody\n${FAF_END}\n`;
    const b = findFafBlock(open);
    expect(b && open.slice(b.start, b.end)).toBe(`${FAF_START}\nbody\n${FAF_END}`);
  });

  test('an HTML block of type 6: no fence opens inside it (F10), and a marker inside it is still a marker', () => {
    expect(findFafBlock(`<details>\n${F}\n</details>\n\n${F}\n${FAF_START}\nexample\n${FAF_END}\n${F}\n`)).toBeNull();
    const text = `<div>\n${FAF_START}\nbody\n${FAF_END}\n</div>\n`;
    expect(findFafBlock(text)).not.toBeNull();
  });

  test('the reader: a tab after a list marker puts the content at column 4, and a fence there ends with the item', () => {
    const r = new BlockReader(true);
    expect(r.line(`-\t${F}sh`)).toBe('code fence');
    expect(r.line('\tmake')).toBe('code fence');
    expect(r.line(`  ${F}`)).toBe('code fence'); // the item ended; this opens a new fence
    expect(r.line(FAF_START)).toBe('code fence');
    const plain = new BlockReader(false);
    expect(plain.line(`-\t${F}sh`)).toBeNull(); // no list items at column 0: a paragraph
    expect(plain.line(`  ${F}`)).toBe('code fence');
  });

  test('the reader: HTML blocks of types 1-5 hide their lines; 6 and 7 do not, but no fence opens in them', () => {
    const lines = (text: string) => {
      const r = new BlockReader(true);
      return text.split('\n').map(l => r.line(l));
    };
    expect(lines('<?php\nx\n?>')).toEqual(['html', 'html', 'html']);
    expect(lines('<![CDATA[\nx\n]]>')).toEqual(['html', 'html', 'html']);
    expect(lines('<!DOCTYPE\nx>')).toEqual(['html', 'html']);
    expect(lines('<script>\nx\n</script>')).toEqual(['<script>', '<script>', '<script>']);
    expect(lines(`<details>\n${F}\n</details>\n\n${F}`)).toEqual([null, null, null, null, 'code fence']);
    expect(lines(`<!-- one line -->\n<!-- open\n-->`)).toEqual([null, 'comment', 'comment']);
  });
});

describe("BRAKE: faf's own block is always found again where faf put it", () => {
  test('a body that leaves a region open in only one reading is quoted, and the block is stable', () => {
    const body = `intro\n\n- ${F}bash\n  npm i\n  ${F}`;
    const first = withFafBlock('HAND\n', wrapFafBlock(body));
    expect(first).toBe(`${FAF_START}\n> intro\n>\n> - ${F}bash\n>   npm i\n>   ${F}\n${FAF_END}\n\nHAND\n`);
    expect(findFafBlock(first)).not.toBeNull();
    expect(withFafBlock(first, wrapFafBlock(body))).toBe(first);
  });

  test('a block kept in place after a raw <div> (type 6) is quoted when its body would open a fence there', () => {
    const existing = `<div>\n${FAF_START}\nold\n${FAF_END}\n</div>\n`;
    const body = `${F}\nfoo\n\nbar`;
    const first = withFafBlock(existing, wrapFafBlock(body));
    expect(first).toBe(`<div>\n${FAF_START}\n> ${F}\n> foo\n>\n> bar\n> ${F}\n${FAF_END}\n</div>\n`);
    expect(withFafBlock(first, wrapFafBlock(body))).toBe(first);
  });

  test('placeFafBlock puts the block where it is found: head, block, tail', () => {
    const text = placeFafBlock('head\n', wrapFafBlock('body'), '\ntail\n');
    expect(text).toBe(`head\n${FAF_START}\nbody\n${FAF_END}\ntail\n`);
    const b = findFafBlock(text);
    expect(b).toEqual({ start: 5, end: 5 + `${FAF_START}\nbody\n${FAF_END}`.length });
  });
});

describe('BRAKE: the hint for an older faf block that sits in a code fence (regression #3)', () => {
  const OLD = `# Notes\n\n${F}bash\nnpm test\n\n${FAF_START}\nold faf body\n${FAF_END}\n\nuser tail\n`;
  const fenceNote = (file: string): string =>
    `${file}: faf's block is now on top; an older faf block below sits inside a code fence and is left as you had it — delete it by hand if you no longer want it.`;

  test('legacyStampNote names the region the old START sits in', () => {
    expect(legacyStampNote('CLAUDE.md', OLD)).toBe(fenceNote('CLAUDE.md'));
    expect(legacyStampNote('CLAUDE.md', `<pre>\n${FAF_START}\nx\n${FAF_END}\n</pre>\n`)).toContain('sits inside a <pre> block');
    expect(legacyStampNote('CLAUDE.md', `<!-- old:\n${FAF_START}\nx\n${FAF_END}\n-->\n`)).toContain('sits inside an HTML comment');
    // Hidden only in the column-0 reading (a list-item fence closed at column 2): still in a fence there.
    expect(legacyStampNote('AGENTS.md', `- ${F}bash\n  npm i\n  ${F}\n\n${FAF_START}\nx\n${FAF_END}\n`)).toBe(fenceNote('AGENTS.md'));
    expect(legacyStampNote('CLAUDE.md', `${FAF_START}\nlone start, no end\n`)).toBeNull();
    expect(legacyStampNote('CLAUDE.md', `${F}\n<!-- faf:start --> \n${F}\n`)).toBeNull(); // not a whole START line
    expect(legacyStampNote('CLAUDE.md', `# Title\n\n${FAF_START}\nbody\n${FAF_END}\n`)).toBeNull(); // updated in place
  });

  function repo(): { d: string; home: string } {
    const d = dir('faf-hint-');
    writeFileSync(join(d, 'project.faf'), 'project:\n  name: demo\n  goal: Demo goal\n  main_language: TypeScript\n  type: cli\n');
    return { d, home: dir('faf-hint-home-') };
  }
  const faf = (d: string, home: string, ...args: string[]) => {
    const r = spawnSync(process.execPath, [CLI, ...args], { cwd: d, encoding: 'utf-8', env: { ...process.env, HOME: home, NO_COLOR: '1' } });
    return { status: r.status, out: `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
  };

  test('`faf sync` says it once; every byte is kept; the rerun says nothing', () => {
    const { d, home } = repo();
    writeFileSync(join(d, 'CLAUDE.md'), OLD);
    const first = faf(d, home, 'sync');
    expect(first.status).toBe(0);
    expect(first.out.split(fenceNote('CLAUDE.md')).length - 1).toBe(1);
    const after = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    expect(after.endsWith(`\n\n${OLD}`)).toBe(true);
    expect(after.startsWith(`${FAF_START}\n`)).toBe(true);
    const second = faf(d, home, 'sync');
    expect(second.out).not.toContain("faf's block is now on top");
    // The block on top is updated in place (its sync stamp moves on), never stacked.
    const again = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    expect(again.endsWith(`\n\n${OLD}`)).toBe(true);
    expect(again.split('\n').length).toBe(after.split('\n').length);
  });

  test('`faf export --agents` says it for AGENTS.md', () => {
    const { d, home } = repo();
    writeFileSync(join(d, 'AGENTS.md'), OLD);
    const r = faf(d, home, 'export', '--agents');
    expect(r.status).toBe(0);
    expect(r.out).toContain(fenceNote('AGENTS.md'));
  });

  test("writeClaudeMemory puts the same line in its warnings when it adds the block on top", () => {
    const d = dir();
    const mem = join(d, 'mem');
    mkdirSync(mem);
    writeFileSync(join(mem, 'MEMORY.md'), OLD);
    const r = writeClaudeMemory(d, DATA, { memoryDir: mem });
    expect(r.action).toBe('added');
    expect(r.warnings).toContain(fenceNote('MEMORY.md'));
    expect(writeClaudeMemory(d, DATA, { memoryDir: mem }).warnings).not.toContain(fenceNote('MEMORY.md'));
  });
});
