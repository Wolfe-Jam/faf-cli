/**
 * BRAKE: the owner rule, round 5 (R5a) — the round-4 re-check's cases, fixed
 * at the source:
 *
 *   GC04/GC05/GC11/GC19  `faf diff --uninstall-driver` ran `git config
 *        --unset`, which took the user's comment on faf's line (and the
 *        `[diff "faf"]` header with it) or the key written on the header
 *        line. Now faf reads the repo's config file and removes only the
 *        section its install writes, as a text edit; faf's value written any
 *        other way, or a section holding anything of the user's, is refused
 *        in one line.
 *   GC06  install over a `[diff "faf"]` section holding the user's textconv
 *        added faf's command, which git runs instead. Now it is refused.
 *   DC09/DC10/MD02  a .faf value nesting past the CommonMark reader's cap
 *        inside faf's own block crashed `faf export` / `faf sync` (a plain
 *        Error, a stack trace). The body is now capped, and a block faf
 *        cannot place is a one-line refusal (`unplaceable`).
 *   ST27  a project.faf that is not valid YAML printed a stack trace.
 *   ST30  `faf auto` on a project.faf with a BOM exited 1 after writing.
 *   RH06/RH13  a faf-render line not in faf's exact form said "written
 *        before 7.13"; it was edited since faf wrote it.
 *   CRLF  a whole file git checked out with CRLF line ends was refused.
 *   recover  a read through CLAUDE.md → AGENTS.md was refused.
 *   ST11/SX01  the fill added a `stack.database` twin next to the file's
 *        `stack.db`, and wrote `''` into a slot the file's type uses where
 *        the repo has a fact for it.
 *   NG10  a bare Dockerfile wrote `hosting: Docker`.
 *   help  `faf export --help` named a card path faf does not write.
 *
 * Every test here runs the CLI with HOME set to a folder of its own, and
 * removes its folders when the suite ends.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { execFileSync, spawnSync } from 'child_process';
import { parse } from 'yaml';
import { SafePathError, resolveInside } from '../../src/core/safe-write.js';
import * as inject from '../../src/interop/inject.js';
import { BlockReader, MAX_OPEN_CONTAINERS } from '../../src/interop/commonmark.js';
import { writeClaudeMemory } from '../../src/interop/claude-memory.js';
import { readFaf, writeFaf } from '../../src/interop/faf.js';
import * as diff from '../../src/commands/diff.js';

// Read through the module objects, so this file also loads against a tree
// without the fix (each test then fails on its own assertion).
const { findFafBlock, injectFafBlock, wrapFafBlock } = inject;
const BODY_MAX_CONTAINERS = (inject as { BODY_MAX_CONTAINERS?: number }).BODY_MAX_CONTAINERS ?? 16;
const withoutDriverLine = (text: string): string | null =>
  (diff as unknown as { withoutDriverLine: (t: string) => string | null }).withoutDriverLine(text);

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-r5-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

function run(cwd: string, args: string[], env: Record<string, string> = {}, preload?: string) {
  const r = spawnSync(process.execPath, [...(preload ? ['--preload', preload] : []), CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, HOME: mk('home'), NO_COLOR: '1', CI: '1', GIT_CONFIG_NOSYSTEM: '1', ...env },
  });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const lines = (s: string): string[] => s.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '')).filter(l => l.trim() !== '');
const read = (p: string): string => readFileSync(p, 'utf-8');
const sha = (text: string): string => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
const count = (text: string, line: string): number => text.split(/\r?\n/).filter(l => l === line).length;

// ── faf diff --install-driver / --uninstall-driver ─────────────────────────────

describe('BRAKE: faf diff --uninstall-driver removes only the section faf wrote, as a text edit (GC04, GC05, GC11, GC19)', () => {
  const FAFV = 'faf-cli diff-driver';
  const repo = (): { d: string; home: string; cfg: string; git: (a: string[]) => string } => {
    const d = mk('g');
    const home = mk('ghome');
    const git = (a: string[]): string =>
      execFileSync('git', a, { cwd: d, encoding: 'utf-8', env: { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
    git(['init', '-q']);
    writeFileSync(join(d, 'project.faf'), 'project:\n  name: demo\n');
    return { d, home, cfg: join(d, '.git', 'config'), git };
  };

  const variants: Array<[string, string]> = [
    ['GC04 a ; comment of yours on faf\'s line', `[diff "faf"]\n\tcommand = ${FAFV} ; HAND-NOTE-SEMI\n`],
    ['GC05 a # comment of yours on faf\'s line', `[diff "faf"]\n\tcommand = ${FAFV} # HAND-NOTE-HASH\n`],
    ['GC11 the key in another case', `[diff "faf"]\n\tCOMMAND = ${FAFV}\n`],
    ['GC19 the key on the header line', `[diff "faf"] command = ${FAFV}\n[alias]\n\tst = status # HAND-ALIAS\n`],
    ['GC18 a comment of yours on the header', `[diff "faf"] # HAND-HEADER-NOTE\n\tcommand = ${FAFV}\n`],
    ['a header in another case', `[DIFF "faf"]\n\tcommand = ${FAFV}\n`],
    ['GC10 a comment line of yours in the section', `[diff "faf"]\n\t# HAND-SECTION-COMMENT\n\tcommand = ${FAFV}\n`],
    ['GC17 a comment line of yours after faf\'s line', `[diff "faf"]\n\tcommand = ${FAFV}\n\t# HAND-AFTER-KEY\n`],
    ['GC20 a setting of yours in the section (extra keys)', `[diff "faf"]\n\tcommand = ${FAFV}\n\tbinary = true # HAND-BINARY\n`],
    [
      'a backslash in a comment that looks like a continuation (git reads the next line as a header)',
      `[diff "faf"]\n\tcommand = ${FAFV} ; mine\n\tfoo = bar ; note \\\n[alias]\n\tcommand = ${FAFV}\n`,
    ],
  ];
  for (const [name, section] of variants) {
    test(`${name}: refused in one line, exit 1, the config byte for byte`, () => {
      const { d, home, cfg, git } = repo();
      const text = read(cfg) + section;
      writeFileSync(cfg, text);
      expect(git(['config', '--get-all', 'diff.faf.command']).trim()).toBe(FAFV);
      const r = run(d, ['diff', '--uninstall-driver'], { HOME: home });
      expect(r.status).toBe(1);
      expect(lines(r.err)).toEqual([
        `faf: diff.faf.command in ${cfg} is not in the section faf writes (a [diff "faf"] line and a tab-indented "command = ${FAFV}" line, with nothing else in the section or on either line) — faf left your git config unchanged.`,
      ]);
      expect(read(cfg)).toBe(text);
    });
  }

  test('the section install writes goes as a text edit — both its lines; every other byte stays', () => {
    const { d, home, cfg, git } = repo();
    const original = `${read(cfg)}[alias]\n\tlg = log --oneline # HAND-ALIAS\n`;
    writeFileSync(cfg, original);
    expect(run(d, ['diff', '--install-driver'], { HOME: home }).status).toBe(0);
    expect(read(cfg)).toBe(`${original}[diff "faf"]\n\tcommand = ${FAFV}\n`);
    const u = run(d, ['diff', '--uninstall-driver'], { HOME: home });
    expect(u.status).toBe(0);
    expect(read(cfg)).toBe(original);
    expect(() => git(['config', '--get', 'diff.faf.command'])).toThrow();
  });

  test('the same line under another section stays; a CRLF config keeps CRLF', () => {
    const { d, home, cfg } = repo();
    const base = read(cfg);
    const other = `[diff "other"]\n\tcommand = ${FAFV}\n`;
    writeFileSync(cfg, `${base}${other}[diff "faf"]\n\tcommand = ${FAFV}\n[alias]\n\tst = status # HAND\n`);
    expect(run(d, ['diff', '--uninstall-driver'], { HOME: home }).status).toBe(0);
    expect(read(cfg)).toBe(`${base}${other}[alias]\n\tst = status # HAND\n`);

    const crlf = repo();
    const text = `${read(crlf.cfg)}[diff "faf"]\n\tcommand = ${FAFV}\n[alias]\n\tst = status # HAND\n`.replace(/\n/g, '\r\n');
    writeFileSync(crlf.cfg, text);
    expect(run(crlf.d, ['diff', '--uninstall-driver'], { HOME: crlf.home }).status).toBe(0);
    expect(read(crlf.cfg)).toBe(text.replace(`[diff "faf"]\r\n\tcommand = ${FAFV}\r\n`, ''));
  });

  test('withoutDriverLine: exactly the section install writes (blank lines aside), else null', () => {
    expect(withoutDriverLine(`[core]\n\tbare = false\n[diff "faf"]\n\tcommand = ${FAFV}\n`)).toBe('[core]\n\tbare = false\n');
    expect(withoutDriverLine(`[diff "faf"]\n\n\tcommand = ${FAFV}\n\n[x]\n\ty = 1\n`)).toBe('\n\n[x]\n\ty = 1\n');
    expect(withoutDriverLine(`[diff "faf"]\n\tcommand = ${FAFV} # mine\n`)).toBeNull();
    expect(withoutDriverLine(`[diff "faf"]\n\tbinary = true\n\tcommand = ${FAFV}\n`)).toBeNull();
    expect(withoutDriverLine(`[diff "faf"]\n\tcommand = ${FAFV}\n[diff "faf"]\n\tcommand = ${FAFV}\n`)).toBeNull();
    expect(withoutDriverLine(`[diff "faf"]\n\tx = a \\\n\tcommand = ${FAFV}\n`)).toBeNull(); // a value continued onto it
    expect(withoutDriverLine(`[diff "other"]\n\tcommand = ${FAFV}\n`)).toBeNull();
  });

  test('GC06: install over a [diff "faf"] section with a setting of your own (textconv) is refused — one line, config and .gitattributes untouched', () => {
    const { d, home, cfg } = repo();
    const text = `${read(cfg)}[diff "faf"]\n\ttextconv = my-textconv # HAND-TEXTCONV\n`;
    writeFileSync(cfg, text);
    const r = run(d, ['diff', '--install-driver'], { HOME: home });
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([
      'faf: your git config already has diff.faf.textconv — a diff driver setting of your own, so faf left your git config and .gitattributes unchanged.',
    ]);
    expect(read(cfg)).toBe(text);
    expect(existsSync(join(d, '.gitattributes'))).toBe(false);
  });
});

// ── faf's own block: depth cap and the unplaceable refusal ────────────────────

/** True when a CommonMark reading of `text` stays within the reader's cap. */
function readable(text: string): boolean {
  const reader = new BlockReader(true);
  for (const line of text.split(/\r?\n/)) {
    reader.line(line);
    if (reader.tooDeep) {return false;}
  }
  return true;
}

describe('BRAKE: faf\'s own block never nests past the reader\'s cap (DC09, DC10, MD02)', () => {
  const quotes = (n: number): string => `${'>'.repeat(n)} deep quote`;

  test('DC09: a 101-deep quote in project.goal — faf export --agents writes one block, exits 0, and is stable over 3 runs', () => {
    const d = mk('dc');
    writeFileSync(join(d, 'project.faf'), `project:\n  name: deep\n  goal: |\n    Deep goal\n    ${quotes(101)}\n  main_language: TypeScript\n`);
    writeFileSync(join(d, 'AGENTS.md'), '# HAND-AGENTS\n');
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = run(d, ['export', '--agents']);
      expect(r.status).toBe(0);
      expect(r.err).toBe('');
      seen.push(read(join(d, 'AGENTS.md')));
    }
    const after = seen[2];
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    expect(after).toContain('# HAND-AGENTS');
    expect(count(after, '<!-- faf:start -->')).toBe(1);
    expect(findFafBlock(after)?.start).toBe(0);
    expect(readable(after)).toBe(true);
    // The quote is kept as text: the marker past the cap carries one backslash.
    expect(after).toContain(`${'>'.repeat(BODY_MAX_CONTAINERS)}\\${'>'.repeat(101 - BODY_MAX_CONTAINERS)} deep quote`);
  });

  test('DC10: a list nested 52 levels in project.goal — faf sync writes one block, exits 0, and is stable over 3 runs', () => {
    const d = mk('dc');
    const list = Array.from({ length: 52 }, (_, i) => `${'  '.repeat(i)}- level${i}`).join('\n    ');
    writeFileSync(join(d, 'project.faf'), `project:\n  name: deep\n  goal: |\n    Deep goal\n    ${list}\n  main_language: TypeScript\n`);
    writeFileSync(join(d, 'CLAUDE.md'), '# HAND-CLAUDE\n');
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = run(d, ['sync']);
      expect(r.status).toBe(0);
      expect(lines(r.err).filter(l => l.startsWith('faf:') || /^\s+at /.test(l))).toEqual([]);
      // faf sync stamps the time of the run in its block: compare without it.
      seen.push(read(join(d, 'CLAUDE.md')).replace(/^\*STATUS: SYNC ACTIVE — .*\*$/m, '*STATUS*'));
    }
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    expect(seen[2]).toContain('# HAND-CLAUDE');
    expect(count(seen[2], '<!-- faf:start -->')).toBe(1);
    expect(readable(seen[2])).toBe(true);
  });

  test('MD02: writeClaudeMemory with a 101-deep goal writes the block, found again, and a second run changes nothing', () => {
    const d = mk('md');
    const memoryDir = mk('mem');
    writeFileSync(join(memoryDir, 'MEMORY.md'), '- [HAND](x.md) — note\n');
    const data = { project: { name: 'demo', goal: `Deep\n${quotes(101)}` } };
    const first = writeClaudeMemory(d, data, { memoryDir });
    expect(first.written).toBe(true);
    expect(first.preserved).toBe(true);
    const text = read(join(memoryDir, 'MEMORY.md'));
    expect(text).toContain('- [HAND](x.md) — note');
    expect(findFafBlock(text)).not.toBeNull();
    expect(readable(text)).toBe(true);
    expect(writeClaudeMemory(d, data, { memoryDir }).action).toBe('unchanged');
  });

  test(`the escape is minimal: lines within ${BODY_MAX_CONTAINERS} containers stay as they are; the marker past it gets one backslash (an ordered item's delimiter)`, () => {
    const within = `${'>'.repeat(BODY_MAX_CONTAINERS)} x`;
    expect(wrapFafBlock(within)).toBe(`<!-- faf:start -->\n${within}\n<!-- faf:end -->`);
    expect(wrapFafBlock(`${'>'.repeat(20)} x`)).toBe(`<!-- faf:start -->\n${'>'.repeat(BODY_MAX_CONTAINERS)}\\>>>> x\n<!-- faf:end -->`);
    const levels = BODY_MAX_CONTAINERS / 2 + 2; // each ordered level opens a list and an item
    const ordered = Array.from({ length: levels }, (_, i) => `${' '.repeat(3 * i)}1. level${i}`);
    const body = wrapFafBlock(ordered.join('\n')).split('\n').slice(1, -1);
    expect(body.slice(0, BODY_MAX_CONTAINERS / 2)).toEqual(ordered.slice(0, BODY_MAX_CONTAINERS / 2));
    for (let i = BODY_MAX_CONTAINERS / 2; i < levels; i++) {expect(body[i]).toBe(ordered[i].replace('1.', '1\\.'));}
    expect(BODY_MAX_CONTAINERS + 1).toBeLessThan(MAX_OPEN_CONTAINERS); // quoted (one quote more) it still fits
  });
});

describe('BRAKE: a block faf cannot place is a one-line refusal, the file untouched; faf export carries on', () => {
  /** A preload that makes findFafBlock find nothing — for `.cursorrules`
   *  (`# faf:start`), or for every file with FAF_TEST_UNPLACEABLE=all — so
   *  no placement can be verified. */
  function forcePlugin(): string {
    const dir = mk('plugin');
    const path = join(dir, 'force-unplaceable.ts');
    writeFileSync(path, [
      "import { plugin } from 'bun';",
      'plugin({',
      "  name: 'force-unplaceable',",
      '  setup(build) {',
      `    build.onLoad({ filter: /[\\\\/]interop[\\\\/]inject\\.ts$/ }, async (args) => {`,
      '      const src = await Bun.file(args.path).text();',
      "      const patched = src.replace('export function findFafBlock(', 'function findFafBlockReal(') +",
      "        '\\nexport function findFafBlock(text: string, start: string = FAF_START, end: string = FAF_END): { start: number; end: number } | null {\\n' +",
      "        '  return process.env.FAF_TEST_UNPLACEABLE === \"all\" || start === \"# faf:start\" ? null : findFafBlockReal(text, start, end);\\n}\\n';",
      "      return { contents: patched, loader: 'ts' };",
      '    });',
      '  },',
      '});',
      '',
    ].join('\n'));
    return path;
  }

  test('library: injectFafBlock whose block cannot be found again throws SafePathError `unplaceable` naming the file; the file stays byte for byte', () => {
    const d = mk('up');
    const f = join(d, 'notes.md');
    writeFileSync(f, '# HAND-NOTES\n');
    let err: unknown;
    try {
      injectFafBlock(f, 'body', '```', '```'); // a fence line as the marker: it hides its own block
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(SafePathError);
    expect((err as SafePathError).reason).toBe('unplaceable');
    expect((err as SafePathError).message).toBe(`${f}: faf could not place its block where the next run finds it again — faf left it unchanged`);
    expect(read(f)).toBe('# HAND-NOTES\n');
  });

  test.skipIf(!posix)('faf export --all: the file it cannot place prints one line, the other targets are written, exit 1', () => {
    const d = mk('exp');
    writeFileSync(join(d, 'project.faf'), 'project:\n  name: demo\n  goal: A demo\n  main_language: TypeScript\n');
    writeFileSync(join(d, '.cursorrules'), '# HAND-RULES\n');
    const r = run(d, ['export', '--all'], {}, forcePlugin());
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${join(d, '.cursorrules')}: faf could not place its block where the next run finds it again — faf left it unchanged`]);
    expect(read(join(d, '.cursorrules'))).toBe('# HAND-RULES\n');
    for (const f of ['AGENTS.md', 'GEMINI.md', '.github/copilot-instructions.md', 'project.html']) {expect(existsSync(join(d, f))).toBe(true);}
  });

  test.skipIf(!posix)('writeClaudeMemory refuses the same way: SafePathError `unplaceable`, nothing written', () => {
    const d = mk('mem');
    const memoryDir = join(d, 'memory');
    const script = join(d, 'write.ts');
    writeFileSync(script, [
      `import { writeClaudeMemory } from ${JSON.stringify(join(import.meta.dir, '../../src/interop/claude-memory.ts'))};`,
      'try {',
      `  writeClaudeMemory(${JSON.stringify(d)}, { project: { name: 'demo' } }, { memoryDir: ${JSON.stringify(memoryDir)} });`,
      "  console.log('written');",
      '} catch (e) {',
      '  console.log(`${(e as Error).name}|${(e as { reason?: string }).reason}|${(e as Error).message}`);',
      '}',
      '',
    ].join('\n'));
    const r = spawnSync(process.execPath, ['--preload', forcePlugin(), script], {
      encoding: 'utf-8',
      env: { ...process.env, HOME: mk('home'), FAF_TEST_UNPLACEABLE: 'all' },
    });
    const path = join(memoryDir, 'MEMORY.md');
    expect(r.stdout.trim()).toBe(`SafePathError|unplaceable|${path}: faf could not place its block where the next run finds it again — faf left it unchanged`);
    expect(existsSync(path)).toBe(false);
  });
});

// ── .faf readers: invalid YAML, a BOM ────────────────────────────────────────

describe('BRAKE: a project.faf that is not valid YAML is one line, never a stack trace (ST27)', () => {
  const text = 'project:\n  name: demo\n  goal: A demo tool\n  main_language: Go\n  type: cli\nstack:\n  database: None\n  database: MySQL # HAND-DUP\n';

  test('faf auto, faf export, faf sync and faf check: "<file> is not valid YAML (<reason>, line N) — faf left it unchanged", exit 1, the file byte for byte', () => {
    const d = mk('yaml');
    const f = join(d, 'project.faf');
    writeFileSync(f, text);
    writeFileSync(join(d, 'go.mod'), 'module x\n');
    for (const args of [['auto'], ['export', '--agents'], ['sync'], ['check']]) {
      const r = run(d, args);
      expect(r.status).toBe(1);
      expect(lines(r.err)).toEqual([`faf: ${f} is not valid YAML (Map keys must be unique, line 8) — faf left it unchanged`]);
      expect(read(f)).toBe(text);
    }
  });

  test('library: readFaf and writeFaf throw SafePathError `not-yaml`', () => {
    const d = mk('yaml');
    const f = join(d, 'project.faf');
    writeFileSync(f, text);
    for (const call of [() => readFaf(f), () => writeFaf(f, { project: { name: 'x' } })]) {
      let err: unknown;
      try {
        call();
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(SafePathError);
      expect((err as SafePathError).reason).toBe('not-yaml');
    }
    expect(read(f)).toBe(text);
  });
});

describe('BRAKE: faf auto reads a project.faf that starts with a BOM (ST30)', () => {
  test('a BOM and CRLF: faf auto exits 0, the file keeps its BOM and CRLF; faf score reads it too', () => {
    const d = mk('bom');
    const f = join(d, 'project.faf');
    writeFileSync(f, `﻿${'project:\n  name: demo\n  goal: A demo tool\n  main_language: Go\n  type: cli\nstack:\n  database: None # HAND-CRLFBOM\n  build: make # HAND-B\n'.replace(/\n/g, '\r\n')}`);
    writeFileSync(join(d, 'go.mod'), 'module example.com/demo\n\ngo 1.22\n');
    const r = run(d, ['auto']);
    expect(r.status).toBe(0);
    const after = read(f);
    expect(after.startsWith('﻿project:\r\n')).toBe(true);
    expect(/(^|[^\r])\n/.test(after)).toBe(false);
    expect(after).toContain('  build: make # HAND-B\r\n');
    const s = run(d, ['score']);
    expect(s.status).toBe(0);
    expect(s.err).toBe('');
  });
});

// ── whole files faf renders: the render line's reason, CRLF ──────────────────

describe('BRAKE: a whole file faf renders — an edited render line, and CRLF from git', () => {
  const FAF = 'project:\n  name: demo\n  goal: A demo\n  main_language: TypeScript\n';
  const edited = (p: string): string => `faf: ${p} was edited since faf wrote it — faf left it unchanged. Use --force to replace it.`;

  test('RH06/RH13: a faf-render line not in faf\'s exact form (a trailing space, an upper-case hash) is "edited since faf wrote it"', () => {
    for (const change of [
      (s: string) => s.replace(/(<meta name="faf-render" content="sha256:[0-9a-f]{64}">)\n/, '$1 \n'),
      (s: string) => s.replace(/content="sha256:([0-9a-f]{64})"/, (_m, h: string) => `content="sha256:${h.toUpperCase()}"`),
    ]) {
      const d = mk('rh');
      writeFileSync(join(d, 'project.faf'), FAF);
      expect(run(d, ['export', '--html']).status).toBe(0);
      const html = join(d, 'project.html');
      const text = change(read(html));
      writeFileSync(html, text);
      const r = run(d, ['export', '--html']);
      expect(r.status).toBe(1);
      expect(lines(r.err)).toEqual([edited(html)]);
      expect(read(html)).toBe(text);
    }
  });

  test('a hashed project.html converted to CRLF (git core.autocrlf) is replaced with no --force and keeps CRLF; a CRLF page with a hand edit is still refused', () => {
    const d = mk('crlf');
    writeFileSync(join(d, 'project.faf'), FAF);
    expect(run(d, ['export', '--html']).status).toBe(0);
    const html = join(d, 'project.html');
    writeFileSync(html, read(html).replace(/\n/g, '\r\n'));
    writeFileSync(join(d, 'project.faf'), FAF.replace('A demo', 'A CRLF-GOAL demo'));
    const r = run(d, ['export', '--html']);
    expect(r.status).toBe(0);
    const after = read(html);
    expect(after).toContain('A CRLF-GOAL demo');
    expect(/(^|[^\r])\n/.test(after)).toBe(false); // every line still ends CRLF
    const lf = after.replace(/\r\n/g, '\n');
    const line = /^<meta name="faf-render" content="(sha256:[0-9a-f]{64})">\n/m.exec(lf);
    expect(line).not.toBeNull();
    expect(sha(lf.replace(line![0], ''))).toBe(line![1]);
    expect(run(d, ['export', '--html']).status).toBe(0);
    expect(read(html)).toBe(after); // nothing to change: left as it is

    const hand = after.replace('</body>', '<p>HAND-CRLF-EDIT</p>\r\n</body>');
    writeFileSync(html, hand);
    const e = run(d, ['export', '--html']);
    expect(e.status).toBe(1);
    expect(lines(e.err)).toEqual([edited(html)]);
    expect(read(html)).toBe(hand);
  });
});

// ── faf recover: links between context files ─────────────────────────────────

describe('BRAKE: faf recover reads through a link from one AI context file to another (the writers\' rule)', () => {
  test.skipIf(!posix)('CLAUDE.md → AGENTS.md is read; CLAUDE.md → README.md stays refused', () => {
    const d = mk('rec');
    writeFileSync(join(d, 'AGENTS.md'), '# linked-name\n');
    symlinkSync('AGENTS.md', join(d, 'CLAUDE.md'));
    const r = run(d, ['recover']);
    expect(r.status).toBe(0);
    expect(lines(r.err)).toEqual([]);
    expect(r.out).toContain('sources: CLAUDE.md, AGENTS.md');
    expect((parse(read(join(d, 'project.faf'))) as { project: { name: string } }).project.name).toBe('linked-name');
    expect(resolveInside(d, 'CLAUDE.md', { read: true })).toBe(realpathSync(join(d, 'AGENTS.md')));

    const o = mk('rec');
    writeFileSync(join(o, 'README.md'), '# README-SECRET-NAME\n');
    symlinkSync('README.md', join(o, 'CLAUDE.md'));
    const s = run(o, ['recover']);
    expect(s.status).toBe(1);
    expect(lines(s.err)[0]).toBe(
      `faf: ${join(o, 'CLAUDE.md')} is a link to ${join(o, 'README.md')}, which is not a .faf or .fafm file, nor another AI context file — refused. Nothing was read from or written to it.`,
    );
    expect(existsSync(join(o, 'project.faf'))).toBe(false);
    // Any other read through a link stays refused: project.faf → AGENTS.md.
    symlinkSync('AGENTS.md', join(d, 'project.faf.link'));
    let err: unknown;
    try {
      resolveInside(d, 'project.faf.link', { read: true });
    } catch (e) {
      err = e;
    }
    expect((err as SafePathError).reason).toBe('not-faf');
  });
});

// ── faf auto: slot names and facts; no guesses ───────────────────────────────

describe('BRAKE: faf auto fills a slot under the name the file uses, from the repo\'s fact (ST11, SX01)', () => {
  const auto = (files: Record<string, string>): string => {
    const d = mk('slot');
    for (const [name, text] of Object.entries(files)) {writeFileSync(join(d, name), text);}
    const r = run(d, ['auto']);
    expect(r.status).toBe(0);
    return read(join(d, 'project.faf'));
  };
  const P = (type: string, stack: string): string => `project:\n  name: demo\n  goal: A demo tool\n  main_language: Go\n  type: ${type}\nstack:\n${stack}`;

  test('ST11: a file that names the slot stack.db gets no stack.database twin; a repo fact fills stack.db', () => {
    const cli = auto({ 'project.faf': P('cli', '  db: None # HAND-DB\n'), 'go.mod': 'module x\n' });
    expect(cli.split('\n')).toContain('  db: slotignored # HAND-DB');
    expect(cli).not.toMatch(/^ {2}database:/m);

    const backend = auto({
      'project.faf': P('backend', '  db: None # HAND-DB\n'),
      'go.mod': 'module x\n',
      'docker-compose.yml': 'services:\n  db:\n    image: postgres:16\n',
    });
    expect(backend.split('\n')).toContain('  db: PostgreSQL # HAND-DB');
    expect(backend).not.toMatch(/^ {2}database:/m);
  });

  test('SX01: a slot the file\'s type uses gets the repo\'s fact even when detection reads the repo as another type (go.mod → runtime Go)', () => {
    const empty = auto({ 'project.faf': P('backend', '  db: None # HAND-DB\n'), 'go.mod': 'module x\n', 'main.go': 'package main\nfunc main(){}\n' });
    const stack = (parse(empty) as { stack: Record<string, unknown> }).stack;
    expect(stack.runtime).toBe('Go');
    expect(stack.db).toBe('None'); // no fact for the database: the typed words stay
    expect(stack.database).toBeUndefined();

    const typed = auto({ 'project.faf': P('backend', '  runtime: None # HAND-RT\n'), 'go.mod': 'module x\n' });
    expect(typed.split('\n')).toContain('  runtime: Go # HAND-RT');
  });
});

describe('BRAKE: a bare Dockerfile is not a hosting fact (NG10)', () => {
  test('faf init with only a Dockerfile writes no hosting; vercel.json still does', () => {
    const d = mk('ng');
    writeFileSync(join(d, 'Dockerfile'), 'FROM alpine\n');
    expect(run(d, ['init']).status).toBe(0);
    const stack = (parse(read(join(d, 'project.faf'))) as { stack?: Record<string, unknown> }).stack ?? {};
    expect(stack.hosting ?? '').toBe('');

    const v = mk('ng');
    writeFileSync(join(v, 'Dockerfile'), 'FROM alpine\n');
    writeFileSync(join(v, 'vercel.json'), '{}\n');
    expect(run(v, ['init']).status).toBe(0);
    expect((parse(read(join(v, 'project.faf'))) as { stack: Record<string, unknown> }).stack.hosting).toBe('Vercel');
  });
});

describe('BRAKE: faf export --help names the card file faf writes', () => {
  test('--card says ./server-card, not .well-known/mcp/server-card', () => {
    const r = run(mk('help'), ['export', '--help']);
    expect(r.status).toBe(0);
    expect(r.out).toContain('Author MCP Server Card (./server-card)');
    expect(r.out).not.toContain('.well-known/mcp/server-card');
  });
});

