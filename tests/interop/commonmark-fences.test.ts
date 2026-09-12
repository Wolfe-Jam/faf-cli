/**
 * BRAKE: a marker example in fenced code, a <pre> block or a multi-line HTML
 * comment is never taken for faf's block — adversarial #4 (the 7.13
 * owner-rule round, t-inject C14-C18, C20, C21, C26 and t-claudemem M06).
 *
 * The injector read fences with a plain ```/~~~ toggle. A ```` fence around a
 * ``` line, a ~~~ fence around one, a ```js line inside a ```text fence, a
 * ``` indented four spaces or a fence never closed flipped the toggle the
 * wrong way, and a second "blind" pass took the marker example inside the
 * fence for the block: the text between the example's markers was replaced
 * and the fence around it was cut. A <pre> block and a multi-line comment
 * were not skipped at all, and a lone START with its END only inside a later
 * fence reclaimed everything between them.
 *
 * Now fences are read the CommonMark way (same character, at least as long,
 * no info string, at most 3 spaces; an unclosed fence runs to the end of the
 * file), <pre>/<script>/<style>/<textarea> blocks and multi-line comments are
 * skipped, and a START with no END outside them is a user file: prefixed,
 * every byte kept, never reclaimed. claude-faf-mcp's earlier MEMORY.md section
 * is found with the same scanner.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { FAF_END, FAF_START, findFafBlock, injectFafBlock } from '../../src/interop/inject.js';
import { writeClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeMemoryMd } from '../../src/interop/memory.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';
import { writeClaudeMemory } from '../../src/interop/claude-memory.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const DATA: any = {
  project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' },
  stack: { frontend: 'React' },
};
const F3 = '```';

interface Writer {
  name: string;
  rel: string;
  S: string;
  E: string;
  write: (dir: string) => void;
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
];

/** The t-inject fixtures: a marker example the old toggle read as the block. */
const CASES: Array<{ id: string; name: string; text: (S: string, E: string) => string }> = [
  { id: 'C14', name: '```` fence holding a ``` line, then a marker example', text: (S, E) => `# How to write the block\n${F3}\`markdown\n${F3}\n${S}\nQUAD-FENCE-EXAMPLE-BODY\n${E}\n${F3}\`\nHAND-AFTER\n` },
  { id: 'C15', name: '~~~ fence holding a ``` line, then a marker example', text: (S, E) => `# Docs\n~~~md\n${F3}\n${S}\nTILDE-FENCE-EXAMPLE-BODY\n${E}\n~~~\nHAND-AFTER\n` },
  { id: 'C16', name: '``` fence holding a ```js line (not a closer)', text: (S, E) => `# Docs\n${F3}text\n${F3}js\n${S}\nINFO-STRING-EXAMPLE-BODY\n${E}\n${F3}\nHAND-AFTER\n` },
  { id: 'C17', name: '``` fence holding a 4-space-indented ``` (not a closer)', text: (S, E) => `# Docs\n${F3}\n    ${F3}\n${S}\nINDENTED-CLOSER-EXAMPLE-BODY\n${E}\n${F3}\nHAND-AFTER\n` },
  { id: 'C18', name: 'unclosed fence to EOF holding a marker example', text: (S, E) => `# Docs\nHAND-TOP\n${F3}md\n${S}\nUNCLOSED-FENCE-EXAMPLE-BODY\n${E}\nHAND-TAIL-IN-FENCE\n` },
  { id: 'C20', name: 'marker example inside a <pre> block', text: (S, E) => `# Docs\n<pre>\n${S}\nPRE-EXAMPLE-BODY\n${E}\n</pre>\nHAND-AFTER\n` },
  { id: 'C21', name: 'marker example inside a multi-line HTML comment', text: (S, E) => `# Docs\n<!-- example of the managed block:\n${S}\nCOMMENTED-EXAMPLE-BODY\n${E}\n-->\nHAND-AFTER\n` },
  { id: 'C26', name: 'lone START; END only inside a later fenced example', text: (S, E) => `${S}\nLONE-START-HAND-A\n## Docs\n${F3}md\n${E}\n${F3}\nHAND-B\n` },
];

function project(): string {
  return realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-fences-')));
}

describe('BRAKE: every block writer prefixes a file whose only markers are examples (C14-C18, C20, C21, C26)', () => {
  for (const w of WRITERS) {
    for (const c of CASES) {
      test(`${w.name} · ${c.id} ${c.name}: every byte kept as the suffix, stable on a rerun`, () => {
        const dir = project();
        const file = join(dir, w.rel);
        mkdirSync(dirname(file), { recursive: true });
        const before = c.text(w.S, w.E);
        writeFileSync(file, before);
        w.write(dir);
        const first = readFileSync(file, 'utf-8');
        expect(first.endsWith(before)).toBe(true);
        expect(first.startsWith(`${w.S}\n`)).toBe(true);
        // The new block is found on the next run: updated in place, never stacked.
        w.write(dir);
        expect(readFileSync(file, 'utf-8')).toBe(first);
      });
    }
  }
});

describe('BRAKE: findFafBlock reads regions the CommonMark way', () => {
  test('the region fixtures hold no block', () => {
    for (const c of CASES) {expect(findFafBlock(c.text(FAF_START, FAF_END))).toBeNull();}
  });

  test('a real block after a balanced region — any of them — is still found', () => {
    const regions = [
      `${F3}\`md\n${F3}\n${FAF_START}\n${FAF_END}\n${F3}\`\n`,
      `~~~\n${F3}\n${FAF_START}\n~~~\n`,
      `${F3}text\n${F3}js\n${FAF_END}\n${F3}\n`,
      `<PRE class="x">\n${FAF_START}\n</pre>\n`,
      '<script>\nlet a = 1;\n</script>\n',
      `<!-- note\n${FAF_START}\n-->\n`,
      `<pre>${FAF_START}</pre>\n`,
    ];
    for (const region of regions) {
      const text = `above\n${region}\n${FAF_START}\nreal\n${FAF_END}\nbelow\n`;
      const b = findFafBlock(text);
      expect(b).not.toBeNull();
      expect(text.slice(b!.start, b!.end)).toBe(`${FAF_START}\nreal\n${FAF_END}`);
    }
  });

  test("faf's own one-line marker comments stay markers; a comment line that closes a region does not", () => {
    // One-line comments open nothing: the block is found.
    expect(findFafBlock(`<!-- a note -->\n${FAF_START}\nbody\n${FAF_END}\n`)).not.toBeNull();
    // The START line closes the multi-line comment above it (it holds `-->`),
    // so it is part of that comment, not a marker.
    expect(findFafBlock(`<!-- open\n${FAF_START}\nbody\n${FAF_END}\n`)).toBeNull();
  });

  test('a list-item fence closes at its content column, so a fenced marker example after it stays an example', () => {
    // The old toggle missed `- ```bash`, read its closer as an opener, and then
    // took the example inside the next fence for the block.
    const example = `- ${F3}bash\n  npm i\n  ${F3}\n${F3}md\n${FAF_START}\nLIST-THEN-EXAMPLE\n${FAF_END}\n${F3}\n`;
    expect(findFafBlock(example)).toBeNull();
    const dir = project();
    const file = join(dir, 'AGENTS.md');
    writeFileSync(file, example);
    injectFafBlock(file, 'NEW-BODY');
    expect(readFileSync(file, 'utf-8')).toBe(`${FAF_START}\nNEW-BODY\n${FAF_END}\n\n${example}`);
    // A real block after an unclosed list-item fence, which ends where the
    // list item does, is found: the column-0 reading never opened a fence.
    // After a list-item fence closed at its content column it is not: the
    // column-0 reading takes that closer for an opener, the readings
    // disagree, and faf prefixes (7.13 round 3b).
    expect(findFafBlock(`- ${F3}bash\n  npm i\n${FAF_START}\nx\n${FAF_END}\n`)).not.toBeNull();
    expect(findFafBlock(`- ${F3}bash\n  npm i\n  ${F3}\n${FAF_START}\nx\n${FAF_END}\n`)).toBeNull();
  });
});

describe("BRAKE: faf's own block never hides its END line", () => {
  test('a body that leaves a fence open is closed at the end of the block — the next write updates it in place', () => {
    const dir = project();
    const file = join(dir, 'CLAUDE.md');
    writeFileSync(file, 'HAND-NOTES\n');
    const body = `# CLAUDE.md — demo\n\nA .faf value with a stray fence:\n${F3}bash\nnpm test`;
    injectFafBlock(file, body);
    const first = readFileSync(file, 'utf-8');
    expect(first).toBe(`${FAF_START}\n${body}\n${F3}\n${FAF_END}\n\nHAND-NOTES\n`);
    expect(findFafBlock(first)).not.toBeNull();
    injectFafBlock(file, body);
    injectFafBlock(file, body);
    expect(readFileSync(file, 'utf-8')).toBe(first);
  });

  test('an open <pre> or comment in the body is closed the same way', () => {
    for (const [open, close] of [['<pre>', '</pre>'], ['<!-- stray', '-->'], ['~~~~', '~~~~']]) {
      const dir = project();
      const file = join(dir, 'AGENTS.md');
      injectFafBlock(file, `body\n${open}\ninside`);
      const first = readFileSync(file, 'utf-8');
      expect(first).toBe(`${FAF_START}\nbody\n${open}\ninside\n${close}\n${FAF_END}\n`);
      injectFafBlock(file, `body\n${open}\ninside`);
      expect(readFileSync(file, 'utf-8')).toBe(first);
    }
  });
});

describe("BRAKE: claude-faf-mcp's earlier MEMORY.md section is found with the same scanner (M06)", () => {
  const LS = '# Project Context (from project.faf)';
  const LE = '*This section is managed by tri-sync. Edit project.faf, not this block.*';
  const CLAUDE_NOTES = '- [Feedback: tabs](feedback_tabs.md) — user prefers tabs (CLAUDE-NOTE-1)\n';

  function memory(text: string): { root: string; mem: string; file: string } {
    const root = project();
    const mem = join(root, 'mem');
    mkdirSync(mem, { recursive: true });
    const file = join(mem, 'MEMORY.md');
    writeFileSync(file, text);
    return { root, mem, file };
  }

  test('M06: the heading with its closing line only inside a later fenced note is not a section — the block goes on top, every line kept', () => {
    const before = `${LS}\nCLAUDE-NOTE-AFTER-HEADING\n## How tri-sync looked\n${F3}md\n${LE}\n${F3}\nCLAUDE-NOTE-END\n`;
    const { root, mem, file } = memory(before);
    const r = writeClaudeMemory(root, DATA, { memoryDir: mem });
    expect(r.action).toBe('added');
    const after = readFileSync(file, 'utf-8');
    expect(after.endsWith(before)).toBe(true);
    expect(after.startsWith(`${FAF_START}\n`)).toBe(true);
    expect(writeClaudeMemory(root, DATA, { memoryDir: mem }).action).toBe('unchanged');
  });

  test('M11: a ```` fenced marker example in MEMORY.md is not the block', () => {
    const before = `# How faf writes\n${F3}\`md\n${F3}\n${FAF_START}\nQUAD-EXAMPLE-BODY\n${FAF_END}\n${F3}\`\n${CLAUDE_NOTES}`;
    const { root, mem, file } = memory(before);
    expect(writeClaudeMemory(root, DATA, { memoryDir: mem }).action).toBe('added');
    expect(readFileSync(file, 'utf-8').endsWith(before)).toBe(true);
  });

  test('a quoted section in a ```` fence stays as written; the real section below it is migrated once', () => {
    const quoted = `${F3}\`md\n${F3}\n${LS}\nQUOTED-SECTION-BODY\n${LE}\n${F3}\`\n`;
    const before = `${quoted}${LS}\n\n- **Name:** demo\n\n${LE}\n${CLAUDE_NOTES}`;
    const { root, mem, file } = memory(before);
    expect(writeClaudeMemory(root, DATA, { memoryDir: mem }).action).toBe('migrated');
    const after = readFileSync(file, 'utf-8');
    expect(after.startsWith(`${quoted}${FAF_START}\n`)).toBe(true);
    expect(after.endsWith(`${FAF_END}\n${CLAUDE_NOTES}`)).toBe(true);
    expect(after).not.toContain('- **Name:** demo\n\n*This');
    expect(writeClaudeMemory(root, DATA, { memoryDir: mem }).action).toBe('unchanged');
  });
});
