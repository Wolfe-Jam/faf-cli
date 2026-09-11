/**
 * interop/inject — non-destructive faf-block injection.
 * Regression guard for the file-wipe bug: the four interop writers must ENHANCE
 * existing AGENTS.md / GEMINI.md / .cursorrules / CLAUDE.md, never replace them.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { injectFafBlock, FAF_START, FAF_END } from '../../src/interop/inject.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeClaudeMd, renderClaudeMd } from '../../src/interop/claude.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';

function tmp(): string { return mkdtempSync(join(tmpdir(), 'faf-inject-')); }
const DATA: any = {
  project: { name: 'demo', goal: 'A small API', main_language: 'TypeScript' },
  stack: { backend: 'Express' },
  human_context: { who: 'devs' },
};

describe('TYRE: injectFafBlock — non-destructive', () => {
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

  test('faf-looking file with no marker lines (metastamp + faf footer) → prefixed, every byte kept (never reclaimed)', () => {
    const p = join(tmp(), 'F.md');
    // shaped like an old faf-rendered CLAUDE.md: led by the metastamp, closed by faf's footer, no markers
    const before = '<!-- faf: demo | TS | lib | x -->\n\n# CLAUDE.md — demo\nold faf body\n\n---\n\n*STATUS: BI-SYNC ACTIVE — 2026-05-30T23:32:37.806Z*\n';
    writeFileSync(p, before);
    injectFafBlock(p, 'fresh block');
    const out = readFileSync(p, 'utf-8');
    expect(out).toBe(`${FAF_START}\nfresh block\n${FAF_END}\n\n${before}`);
    expect(out.split(FAF_START).length - 1).toBe(1);    // single block
    injectFafBlock(p, 'fresh block');
    expect(readFileSync(p, 'utf-8')).toBe(out);         // and it stays one block
  });

  test('legacy-looking file WITHOUT faf footer → prefixed, every byte kept (faf cannot prove it wrote it)', () => {
    const p = join(tmp(), 'F.md');
    const before = '<!-- faf: demo | TS | lib | x -->\n\n# AGENTS.md — demo\nold faf body\n';
    writeFileSync(p, before);
    injectFafBlock(p, 'fresh block');
    expect(readFileSync(p, 'utf-8')).toBe(`${FAF_START}\nfresh block\n${FAF_END}\n\n${before}`);
  });

  test('user file WITHOUT the faf metastamp → prefixed + fully preserved (never reclaimed)', () => {
    const p = join(tmp(), 'F.md');
    writeFileSync(p, '# My own file\nUSER OWNED\n');     // no faf metastamp
    injectFafBlock(p, 'block');
    const out = readFileSync(p, 'utf-8');
    expect(out).toContain('USER OWNED');                // preserved
    expect(out.indexOf(FAF_START)).toBeLessThan(out.indexOf('USER OWNED'));
  });
});

describe('TYRE: interop writers — enhance, never replace', () => {
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
    writeClaudeMd(d, renderClaudeMd(DATA));
    const out = readFileSync(join(d, 'CLAUDE.md'), 'utf-8');
    expect(out).toContain(MARK);
  });

  test('writeLlmsTxt preserves an existing llms.txt', () => {
    const d = tmp();
    writeFileSync(join(d, 'llms.txt'), `# Mine\n${MARK}\nnotes\n`);
    writeLlmsTxt(d, DATA);
    const out = readFileSync(join(d, 'llms.txt'), 'utf-8');
    expect(out).toContain(MARK);
    expect(out).toContain('demo');
  });
});

// ---------------------------------------------------------------------------
// 7.12.0 — line-anchored markers. Regression guard for the stacked-AGENTS.md
// bug: 7.1.4–7.11.0 quoted the marker tokens in renderAgentsMd's blockquote and
// injectFafBlock located the block by substring, so every `faf export --agents`
// re-run appended the old block's tail. Every case below injects twice and
// asserts the second run is byte-identical.
// ---------------------------------------------------------------------------
import { findFafBlock } from '../../src/interop/inject.js';

const V1 = '# AGENTS.md — demo\n\nrender v1\n\n## Guardrails\n\n- **Always OK:** read the tree.';
const V2 = '# AGENTS.md — demo\n\nrender v2\n\n## Guardrails\n\n- **Always OK:** read the tree · run the tests.';
const wholeLines = (s: string, m: string): number => s.split('\n').filter(l => l.trim() === m).length;
const twice = (file: string, b1: string, b2: string, s?: string, e?: string): [string, string] => {
  injectFafBlock(file, b1, s, e); const first = readFileSync(file, 'utf-8');
  injectFafBlock(file, b2, s, e); return [first, readFileSync(file, 'utf-8')];
};
// Exactly what 7.11.0 wrote: real markers on their own lines, the prose decoy on line 9.
const SHAPE_7_11 = [
  '<!-- faf:start -->', '<!-- faf: demo | TypeScript | mcp | Demo. -->', '<!-- faf: claim=project.faf | family=FAF -->', '',
  '# AGENTS.md — demo', '', 'Demo. — TypeScript · type: mcp · v1.0.0', '',
  '> Authored by faf — do not edit the managed block; refresh with `faf export --agents`. Hand content outside `<!-- faf:start -->` … `<!-- faf:end -->` is preserved.',
  '', '## Setup & build', '', '```bash', 'npm ci    # install', '```', '', '## Guardrails', '', '- **Always OK:** read the tree.', '',
  '## Definition of Done', '', 'Done when: `npm test` passes.', '<!-- faf:end -->', '', '## HAND-WRITTEN — MUST SURVIVE', '', 'user-below-sentinel', '',
].join('\n');

describe('BRAKE: injectFafBlock — markers are whole lines, never substrings (7.12.0)', () => {
  test('findFafBlock ignores marker text in prose and in fences; indented copies are code, not markers', () => {
    expect(findFafBlock('Between `<!-- faf:start -->` and `<!-- faf:end -->`.\n')).toBeNull();
    const fencedAboveReal = '```\n<!-- faf:start -->\nexample\n<!-- faf:end -->\n```\n\n<!-- faf:start -->\nbody\n<!-- faf:end -->\n';
    const b = findFafBlock(fencedAboveReal)!;
    expect(fencedAboveReal.slice(b.start, b.end)).toBe('<!-- faf:start -->\nbody\n<!-- faf:end -->');
    expect(findFafBlock('    <!-- faf:start -->\n    <!-- faf:end -->\n')).toBeNull();
  });

  test('a 7.11.0-authored AGENTS.md (prose decoy) is replaced in place, not stacked — and stays stable', () => {
    const file = join(tmp(), 'AGENTS.md'); writeFileSync(file, SHAPE_7_11);
    expect(SHAPE_7_11.split(FAF_END).length - 1).toBe(2); // real + decoy
    const [first, second] = twice(file, V1, V2);
    expect(wholeLines(first, FAF_START)).toBe(1);
    expect(wholeLines(first, FAF_END)).toBe(1);
    expect(first).not.toContain('## Setup & build'); // the old tail is gone
    expect(first).toContain('user-below-sentinel');
    expect(second).toContain('render v2');
    expect(second.split('\n').length).toBe(first.split('\n').length);
  });

  test('a file already stacked by the old injector is repaired on the next run', () => {
    // Old behaviour: cut at the decoy → new block + stale tail with a second end marker.
    const stacked = `${FAF_START}\n${V1}\n${FAF_END}\` is preserved.\n\n## Setup & build\n\nstale\n\n## Guardrails\n\nstale\n${FAF_END}\n\nuser-below-sentinel\n`;
    const file = join(tmp(), 'AGENTS.md'); writeFileSync(file, stacked);
    const [first, second] = twice(file, V2, V2);
    // The first whole-line END is the one right after the old block; the stale tail
    // that followed it is user territory and is preserved — but never grows again.
    expect(wholeLines(first, FAF_START)).toBe(1);
    expect(first).toContain('user-below-sentinel');
    expect(second).toBe(first);
  });

  test('fence shapes the toggle misreads still resolve to the real block', () => {
    for (const shape of ['- ```bash\n  npm i\n  ```\n', '````md\n```\n````\n', '```\n~~~\n```\n']) {
      const file = join(tmp(), 'AGENTS.md');
      writeFileSync(file, `user-above-sentinel\n\n${shape}\n${FAF_START}\nold body\n${FAF_END}\n\nuser-below-sentinel\n`);
      const [first, second] = twice(file, V1, V1);
      expect(first).toContain('user-above-sentinel');
      expect(first).toContain('user-below-sentinel');
      expect(first).not.toContain('old body');
      expect(first.split('render v1').length - 1).toBe(1);
      expect(second).toBe(first);
    }
  });

  // 7.13 (CommonMark fences): an unclosed fence runs to the end of the file, so
  // text after it — a real-looking block included — is code, not a marker. faf
  // cannot prove it wrote such a block: the file is prefixed, never reclaimed.
  test('an unclosed fence above a block hides it — prefixed, every byte kept, then stable', () => {
    const file = join(tmp(), 'AGENTS.md');
    const before = `user-above-sentinel\n\n\`\`\`bash\nunclosed above\n\n${FAF_START}\nold body\n${FAF_END}\n\nuser-below-sentinel\n`;
    writeFileSync(file, before);
    const [first, second] = twice(file, V1, V1);
    expect(first).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${before}`);
    expect(second).toBe(first);
  });

  test('an unclosed fence INSIDE a block hides its end marker — prefixed, every byte kept, then stable', () => {
    const file = join(tmp(), 'AGENTS.md');
    const before = `above\n\n${FAF_START}\nold body\n\`\`\`bash\nnpm test\n${FAF_END}\n\nuser-below-sentinel\n`;
    writeFileSync(file, before);
    const [first, second] = twice(file, V1, V1);
    expect(first).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${before}`);
    expect(second).toBe(first);
  });

  test('a truncated block (start line, no end line) is prefixed, never treated as legacy output', () => {
    const file = join(tmp(), 'AGENTS.md');
    writeFileSync(file, `${FAF_START}\nold body with no end marker\n\n## User content BELOW\n\nuser-below-sentinel\n`);
    injectFafBlock(file, V1);
    const out = readFileSync(file, 'utf-8');
    expect(out.startsWith(`${FAF_START}\n${V1}`)).toBe(true);
    expect(out).toContain('old body with no end marker');
    expect(out).toContain('user-below-sentinel');
  });

  test('CRLF, trailing whitespace on marker lines, and a leading BOM survive', () => {
    const file = join(tmp(), 'AGENTS.md');
    writeFileSync(file, `above\r\n${FAF_START}  \r\nold body\r\n${FAF_END}\r\nbelow\r\n`);
    const [c1, c2] = twice(file, V1, V1);
    expect(c1.startsWith(`above\r\n${FAF_START}\n`)).toBe(true);
    expect(c1).toContain(`\n${FAF_END}\r\nbelow\r\n`);
    expect(c1).not.toContain('old body');
    expect(c2).toBe(c1);
    writeFileSync(file, `﻿${FAF_START}\nold body\n${FAF_END}\n\nuser-below-sentinel\n`);
    const [b1, b2] = twice(file, V1, V1);
    expect(b1.charCodeAt(0)).toBe(0xfeff); expect(b1).toContain('user-below-sentinel'); expect(b2).toBe(b1);
  });

  test('.cursorrules: a comment line that merely begins with the hash marker text is not a marker', () => {
    const file = join(tmp(), '.cursorrules');
    writeFileSync(file, '# faf:start of the section\nuser-above-sentinel\n\n# faf:start\nold\n# faf:end\n\nkeep-me\n');
    injectFafBlock(file, 'new', '# faf:start', '# faf:end');
    const out = readFileSync(file, 'utf-8');
    expect(out.startsWith('# faf:start of the section\nuser-above-sentinel\n')).toBe(true);
    expect(out).toContain('keep-me'); expect(out).not.toContain('\nold\n');
  });
});

// ---------------------------------------------------------------------------
// Unreleased — faf replaces only text it can prove it wrote: what sits between
// its own marker lines. A file with NO marker lines is never reclaimed, whatever
// it starts or ends with — a faf-looking stamp and footer prove nothing (the
// /claude-md skill tells authors to hand-write that exact stamp). Every case
// below lost text on fce35d6b, which still replaced a stamp-led file through
// its footer line.
// ---------------------------------------------------------------------------
const BOM = '\uFEFF';
const LEGACY = [
  '<!-- faf: demo | TypeScript | cli | Demo -->',
  '<!-- faf: claim=project.faf | family=FAF -->',
  '',
  '# CLAUDE.md — demo',
  '',
  'old faf body',
  '',
  '---',
  '',
  '*STATUS: BI-SYNC ACTIVE — 2026-05-30T23:32:37.806Z*',
].join('\n');

describe('BRAKE: a file with no marker lines is never reclaimed — the block goes on top', () => {
  test('stamp-led file with a faf footer and notes after it: every byte survives', () => {
    const file = join(tmp(), 'CLAUDE.md');
    const before = `${LEGACY}\n\n## Team rules\n\n- never push to main\n- USER-NOTE-SENTINEL\n`;
    writeFileSync(file, before);
    const [first, second] = twice(file, V1, V1);
    expect(first).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${before}`);
    expect(second).toBe(first);
  });

  test('a /claude-md-shaped CLAUDE.md (2-line stamp, hand sections, SYNC footer at EOF) keeps every hand line', () => {
    // The audit's shape (#3): hand-written context that happens to start with
    // faf's stamp and end with a copied footer. It lost every hand section.
    const file = join(tmp(), 'CLAUDE.md');
    const before = [
      '<!-- faf: shop-api | TypeScript | backend | Orders API -->',
      '<!-- faf: claim=project.faf | family=FAF -->',
      '',
      '# CLAUDE.md — shop-api',
      '',
      '## Architecture',
      '',
      'Hexagonal: adapters in src/adapters, domain in src/core.',
      '',
      '## Rules',
      '',
      '- NEVER call the payments API from tests.',
      '',
      '*STATUS: SYNC ACTIVE — 2026-09-10T09:00:00.000Z*',
      '',
    ].join('\n');
    writeFileSync(file, before);
    for (const write of [
      () => injectFafBlock(file, V1),
      () => writeClaudeMd(dirname(file), renderClaudeMd(DATA)),
    ]) {
      writeFileSync(file, before);
      write();
      const out = readFileSync(file, 'utf-8');
      expect(out.endsWith(`\n\n${before}`)).toBe(true);
      expect(out).toContain('NEVER call the payments API from tests.');
      expect(wholeLines(out, FAF_START)).toBe(1);
    }
  });

  test('stamp-led file whose footer sits mid-file: nothing before or after it is claimed', () => {
    const file = join(tmp(), 'AGENTS.md');
    const before = `${LEGACY}\n\npasted from another project:\n*STATUS: SYNC ACTIVE — 2026-09-10T00:00:00.000Z*\nUSER-AFTER-SECOND-FOOTER\n`;
    writeFileSync(file, before);
    injectFafBlock(file, V1);
    expect(readFileSync(file, 'utf-8')).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${before}`);
  });

  test('a stamp-led file behind a BOM keeps the BOM at byte 0 and every byte after it', () => {
    const file = join(tmp(), 'CLAUDE.md');
    writeFileSync(file, `${BOM}${LEGACY}\nUSER-BOM-NOTE\n`);
    injectFafBlock(file, V1);
    expect(readFileSync(file, 'utf-8')).toBe(`${BOM}${FAF_START}\n${V1}\n${FAF_END}\n\n${LEGACY}\nUSER-BOM-NOTE\n`);
  });

  test('a metastamp-led file with a footer AND a marker line in a fence — prefixed, all kept', () => {
    const file = join(tmp(), 'CLAUDE.md');
    const before = `${LEGACY}\n\n\`\`\`md\n${FAF_START}\nexample\n${FAF_END}\n\`\`\`\n`;
    writeFileSync(file, before);
    injectFafBlock(file, V1);
    expect(readFileSync(file, 'utf-8')).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${before}`);
  });
});

describe('BRAKE: findFafBlock never takes over a balanced fenced example', () => {
  test('markers only inside balanced fences → no block; the first write prefixes and keeps the example', () => {
    const doc = `# Notes\n\n\`\`\`md\n${FAF_START}\n(faf writes here)\n${FAF_END}\n\`\`\`\n\n~~~\n${FAF_START}\n${FAF_END}\n~~~\n`;
    expect(findFafBlock(doc)).toBeNull();
    const file = join(tmp(), 'CLAUDE.md'); writeFileSync(file, doc);
    const [first, second] = twice(file, V1, V1);
    expect(first).toBe(`${FAF_START}\n${V1}\n${FAF_END}\n\n${doc}`);
    expect(second).toBe(first);
  });

  test('a balanced example followed by an unclosed fence → no block, even with markers after the open fence', () => {
    const doc = `\`\`\`md\n${FAF_START}\nexample\n${FAF_END}\n\`\`\`\n\nuser text\n\n\`\`\`bash\nnpm test\n`;
    expect(findFafBlock(doc)).toBeNull();
    // The unclosed fence runs to the end of the file (CommonMark): marker lines
    // after it are code, so this is still a user file — prefixed, never reclaimed.
    const withMarkers = `${doc}\n${FAF_START}\nreal\n${FAF_END}\n`;
    expect(findFafBlock(withMarkers)).toBeNull();
  });
});

describe('BRAKE: a marker line inside the rendered body cannot cut the block', () => {
  test('body lines equal to a marker are indented one space; the file is stable across writes', () => {
    const file = join(tmp(), 'CLAUDE.md');
    writeFileSync(file, 'user-above\n');
    const body = `# CLAUDE.md — demo\n\nGoal documents the markers:\n${FAF_START}\n${FAF_END}  \nend of goal`;
    const sizes: number[] = [];
    for (let i = 0; i < 4; i++) { injectFafBlock(file, body); sizes.push(readFileSync(file, 'utf-8').length); }
    expect(new Set(sizes).size).toBe(1);
    const out = readFileSync(file, 'utf-8');
    expect(out).toContain(`\n ${FAF_START}\n ${FAF_END}  \n`);
    // The finder only treats a marker at column 0 as a marker; the guarded body
    // lines start with a space, so count column-0 markers (trailing space ignored).
    const atColumn0 = (m: string): number => out.split('\n').filter(l => l.replace(/\s+$/, '') === m).length;
    expect(atColumn0(FAF_START)).toBe(1);
    expect(atColumn0(FAF_END)).toBe(1);
    expect(out.endsWith('\n\nuser-above\n')).toBe(true);
  });

  test('hash markers (.cursorrules) get the same guard', () => {
    const file = join(tmp(), '.cursorrules');
    const body = 'rules\n# faf:end\nmore rules';
    injectFafBlock(file, body, '# faf:start', '# faf:end');
    injectFafBlock(file, body, '# faf:start', '# faf:end');
    expect(readFileSync(file, 'utf-8')).toBe('# faf:start\nrules\n # faf:end\nmore rules\n# faf:end\n');
  });
});

describe('BRAKE: a leading BOM stays at byte 0', () => {
  test('prefixing a BOM-led user file puts the block after the BOM', () => {
    const file = join(tmp(), 'CLAUDE.md');
    writeFileSync(file, `${BOM}# Mine\nuser-line\n`);
    const [first, second] = twice(file, V1, V1);
    expect(first).toBe(`${BOM}${FAF_START}\n${V1}\n${FAF_END}\n\n# Mine\nuser-line\n`);
    expect(second).toBe(first);
  });
});
