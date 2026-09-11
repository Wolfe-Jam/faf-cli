/**
 * BRAKE: faf edits only UTF-8 text — adversarial #2 (pre-existing).
 *
 * Every reader that feeds a writer decoded with a lenient `readFileSync(path,
 * 'utf-8')`: bytes that are not UTF-8 became U+FFFD, and the next write put
 * EF BF BD where the user's bytes were. A PowerShell 5 / Notepad "Unicode"
 * (UTF-16LE with a BOM) CLAUDE.md came back as mojibake behind faf's block
 * (t-inject C05); a cp1252 `café` lost its é (C06, t-faf Y13, t-soul S09,
 * t-claudemem M10); an overlong `C0 AF` became two U+FFFD (C35).
 *
 * Now those readers decode strictly (TextDecoder fatal) through one helper,
 * readUtf8: a UTF-16 BOM or any invalid UTF-8 is refused — "<file> is not
 * UTF-8 — faf left it unchanged" — and the file stays byte for byte. A UTF-8
 * BOM still works as before.
 */
import { describe, test, expect } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { SafePathError, readUtf8 } from '../../src/core/safe-write.js';
import * as publicApi from '../../src/index.js';
import { injectFafBlock } from '../../src/interop/inject.js';
import { writeClaudeMd, readClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeMemoryMd, readMemoryMd } from '../../src/interop/memory.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';
import { writeClaudeMemory, claudeMemoryStatus } from '../../src/interop/claude-memory.js';
import { writeGrokConfig } from '../../src/interop/grok.js';
import { readFaf, readFafRaw, updateFafFile, writeFaf } from '../../src/interop/faf.js';
import { updateExistingFaf } from '../../src/detect/assemble.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { Soul } from '../../src/fafm/soul.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const BOM = '\uFEFF';
const DATA: any = { project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' }, stack: { frontend: 'React' } };

// The adversarial fixtures.
const C05_UTF16LE = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('# Notes\nHAND-UTF16 café résumé\n', 'utf16le')]);
const UTF16BE = Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from('# Notes\nHAND\n', 'utf16le').swap16()]);
const C06_CP1252 = Buffer.from([
  ...Buffer.from('# Notes\nHAND caf'), 0xe9, ...Buffer.from(' na'), 0xef, ...Buffer.from('ve 25'), 0xb0, ...Buffer.from('C '), 0x93,
  ...Buffer.from('quoted'), 0x94, 0x0a,
]);
const C35_OVERLONG = Buffer.from([...Buffer.from('HAND '), 0xc0, 0xaf, 0x0a]);
const BAD: Array<[string, Buffer]> = [
  ['UTF-16LE with a BOM (C05)', C05_UTF16LE],
  ['UTF-16BE with a BOM', UTF16BE],
  ['cp1252 bytes (C06)', C06_CP1252],
  ['an overlong C0 AF (C35)', C35_OVERLONG],
];
const latin1 = (head: string, tail: string): Buffer => Buffer.concat([Buffer.from(head), Buffer.from([0xe9]), Buffer.from(tail)]);
const Y13 = latin1('# caf', ' notes (LATIN1-COMMENT)\nproject:\n  name: demo\n  goal: Old goal\n');
const S09 = latin1('# caf', ' (LATIN1-SOUL)\nnamepoint: "@me"\nmemory:\n  facts:\n    - FACT-A\n');
const M10 = latin1('- caf', ' (LATIN1-NOTE)\n');

function project(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), 'faf-utf8-')));
}

/** Runs `fn`, which must refuse `file` as not UTF-8, and checks the file is byte for byte. */
function refusesNotUtf8(file: string, bytes: Buffer, fn: () => unknown): void {
  let err: unknown;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(SafePathError);
  expect((err as SafePathError).reason).toBe('not-utf8');
  expect((err as SafePathError).message).toBe(`${file} is not UTF-8 — faf left it unchanged`);
  expect(readFileSync(file).equals(bytes)).toBe(true);
  expect(readdirSync(dirname(file)).filter(n => n.endsWith('.faf-tmp'))).toEqual([]);
}

const INJECTORS: Array<[string, string, (d: string) => unknown]> = [
  ['injectFafBlock', 'NOTES.md', d => injectFafBlock(join(d, 'NOTES.md'), 'NEW-BODY')],
  ['writeClaudeMd', 'CLAUDE.md', d => writeClaudeMd(d, 'NEW-CLAUDE-BODY')],
  ['writeAgentsMd', 'AGENTS.md', d => writeAgentsMd(d, DATA)],
  ['writeGeminiMd', 'GEMINI.md', d => writeGeminiMd(d, DATA)],
  ['writeCursorrules', '.cursorrules', d => writeCursorrules(d, DATA)],
  ['writeCopilotInstructions', '.github/copilot-instructions.md', d => writeCopilotInstructions(d, DATA)],
  ['writeMemoryMd', 'MEMORY.md', d => writeMemoryMd(d, 'NEW-MEM-BODY')],
  ['writeLlmsTxt', 'llms.txt', d => writeLlmsTxt(d, DATA)],
];

describe('BRAKE: the injector refuses a file that is not UTF-8 (t-inject C05/C06/C35)', () => {
  for (const [name, rel, write] of INJECTORS) {
    test(`${name} (${rel}): UTF-16 and invalid UTF-8 refused, byte for byte; a UTF-8 BOM still works`, () => {
      for (const [, bytes] of BAD) {
        const d = project();
        const file = join(d, rel);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, bytes);
        refusesNotUtf8(file, bytes, () => write(d));
      }
      const d = project();
      const file = join(d, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${BOM}# BOM notes\nHAND-BOM\n`);
      write(d);
      const after = readFileSync(file);
      expect([...after.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
      expect(after.toString('utf-8').endsWith('\n\n# BOM notes\nHAND-BOM\n')).toBe(true);
    });
  }
});

describe('BRAKE: project.faf that is not UTF-8 is refused by every reader and writer (t-faf Y13)', () => {
  test('readFaf, readFafRaw, updateFafFile and writeFaf (edit, faf auto) leave it byte for byte', () => {
    const d = project();
    const p = join(d, 'project.faf');
    writeFileSync(p, Y13);
    refusesNotUtf8(p, Y13, () => readFaf(p));
    refusesNotUtf8(p, Y13, () => readFafRaw(p));
    refusesNotUtf8(p, Y13, () => updateFafFile(p, doc => doc.setIn(['project', 'goal'], 'NEW GOAL')));
    refusesNotUtf8(p, Y13, () => writeFaf(p, { project: { name: 'demo', goal: 'NEW GOAL' } }));
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0' } }));
    refusesNotUtf8(p, Y13, () => writeFaf(p, updateExistingFaf(d, {})));
  });

  test('`faf auto` on it: exit 1, one line, the file byte for byte', () => {
    const d = project();
    writeFileSync(join(d, 'project.faf'), Y13);
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0' } }));
    const r = spawnSync(process.execPath, [CLI, 'auto'], {
      cwd: d,
      encoding: 'utf-8',
      env: { ...process.env, HOME: project(), NO_COLOR: '1' },
    });
    expect(r.status).toBe(1);
    expect(r.stderr.trim().split('\n')).toEqual([`faf: ${join(d, 'project.faf')} is not UTF-8 — faf left it unchanged`]);
    expect(readFileSync(join(d, 'project.faf')).equals(Y13)).toBe(true);
  });
});

describe('BRAKE: soul.fafm, MEMORY.md, .grok/config.toml and .faf-dna that are not UTF-8 are left as they are', () => {
  test('FafmSoul.load refuses a cp1252 soul (t-soul S09), so no etch can write over it', () => {
    const d = project();
    const p = join(d, 'soul.fafm');
    writeFileSync(p, S09);
    refusesNotUtf8(p, S09, () => {
      const s = Soul.load(p);
      s.etch('NEW-FACT-TEXT');
      s.save(p);
    });
  });

  test('writeClaudeMemory and claudeMemoryStatus refuse a cp1252 note (t-claudemem M10)', () => {
    const d = project();
    const mem = join(project(), 'mem');
    mkdirSync(mem);
    const file = join(mem, 'MEMORY.md');
    writeFileSync(file, M10);
    refusesNotUtf8(file, M10, () => writeClaudeMemory(d, DATA, { memoryDir: mem }));
    refusesNotUtf8(file, M10, () => claudeMemoryStatus(d, { memoryDir: mem }));
  });

  test('readClaudeMd, readMemoryMd and writeGrokConfig refuse; the grok config keeps its bytes (t-whole W05)', () => {
    const d = project();
    writeFileSync(join(d, 'CLAUDE.md'), C06_CP1252);
    writeFileSync(join(d, 'MEMORY.md'), C05_UTF16LE);
    refusesNotUtf8(join(d, 'CLAUDE.md'), C06_CP1252, () => readClaudeMd(d));
    refusesNotUtf8(join(d, 'MEMORY.md'), C05_UTF16LE, () => readMemoryMd(d));
    const toml = latin1('# caf', ' (LATIN1-TOML)\n[other]\nkey = "v"\n');
    mkdirSync(join(d, '.grok'));
    writeFileSync(join(d, '.grok', 'config.toml'), toml);
    refusesNotUtf8(join(d, '.grok', 'config.toml'), toml, () => writeGrokConfig(d));
  });

  test('.faf-dna: not UTF-8 reads as no DNA, says why in one line, and is never grown', () => {
    const d = project();
    const now = '2026-01-01T00:00:00.000Z';
    const dna = {
      birthCertificate: { born: now, birthDNA: 20, birthDNASource: 'init', projectDNA: 'abc', certificate: 'FAF-2026-X-1' },
      versions: [{ version: 'v1.0.0', timestamp: now, score: 20, changes: ['Birth'], growth: 0 }],
      current: { version: 'v1.0.0', score: 20, lastSync: now },
      growth: { totalGrowth: 0, daysActive: 0, milestones: [] },
      lastModified: now,
      format: 'faf-dna-v1',
    };
    // faf's own text, with a cp1252 é in a string value.
    const [head, tail] = `${JSON.stringify(dna, null, 2)}\n`.split('"abc"');
    const bytes = Buffer.concat([Buffer.from(`${head}"ab`), Buffer.from([0xe9]), Buffer.from(`"${tail}`)]);
    const file = join(d, '.faf-dna');
    writeFileSync(file, bytes);
    const m = new FafDNAManager(d);
    expect(m.load()).toBeNull();
    expect(m.readOnlyReason()).toBe(`${file} is not UTF-8 — faf left it unchanged`);
    expect(m.recordGrowth(60, ['faf auto'])).toBeNull();
    expect(readFileSync(file).equals(bytes)).toBe(true);
  });
});

describe('BRAKE: readUtf8 is the one shared strict reader', () => {
  test('keeps a UTF-8 BOM, refuses UTF-16 and invalid UTF-8, and is public', () => {
    const d = project();
    writeFileSync(join(d, 'bom.md'), `${BOM}hi\n`);
    expect(readUtf8(join(d, 'bom.md'))).toBe(`${BOM}hi\n`);
    for (const [, bytes] of BAD) {
      writeFileSync(join(d, 'bad.md'), bytes);
      refusesNotUtf8(join(d, 'bad.md'), bytes, () => readUtf8(join(d, 'bad.md')));
    }
    expect(publicApi.readUtf8).toBe(readUtf8);
  });
});
