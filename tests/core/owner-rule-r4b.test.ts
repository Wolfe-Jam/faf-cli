/**
 * BRAKE: the owner rule, round 4 (R4b) — typed words in slots, anchors
 * aliases read, and a scanner that stays linear however deep a file nests.
 *
 *   R04  every word typed into a slot is handled like a typed none —
 *        `unknown`, `"null"` and any other placeholder word, not only None /
 *        N/A / not applicable. faf auto wrote `""` over `hosting: unknown`,
 *        and README text over a 6W `who: unknown`. Now:
 *          - a tech slot the app-type uses: only a repo fact replaces them;
 *          - a tech slot the app-type leaves out: faf auto writes
 *            `slotignored` (shown as N/A) — the app-type's decision is the
 *            fact — so such a project can reach 100; a real value is kept;
 *          - a 6W: never auto-replaced (faf go asks, showing the words).
 *        `faf score` says per slot which kind it is; `faf auto` names the
 *        slots the app-type needs that nothing filled.
 *   YQ01 a typed none with an anchor that aliases read
 *        (`frontend: &x None`, `ui_library: *x`): filling it changed every
 *        alias. faf auto now leaves it as written and says so in one line.
 *   perf3 a nested list made the fence scanner slow down with the square
 *        (and worse) of the depth: 1,200 levels took 14 s. It is linear now,
 *        and past 100 open containers the file is the user's (faf's block
 *        goes on top; nothing is lost).
 *
 * Every CLI run has HOME set to a folder of its own; the suite removes every
 * folder it made.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn, spawnSync } from 'child_process';
import { parse } from 'yaml';
import { fillEmpties, updateExistingFaf } from '../../src/detect/assemble.js';
import { readFaf, writeFaf, aliasKeptNote } from '../../src/interop/faf.js';
import { typedNoneHints } from '../../src/core/typed-none.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { injectFafBlock, findFafBlock, legacyStampNote } from '../../src/interop/inject.js';
import * as commonmark from '../../src/interop/commonmark.js';
import type { KeptAlias } from '../../src/interop/faf.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const { BlockReader } = commonmark;
/** Read through the namespace, so this file also loads (and fails test by test) on code without the cap. */
const MAX_OPEN_CONTAINERS = (commonmark as { MAX_OPEN_CONTAINERS?: number }).MAX_OPEN_CONTAINERS ?? 100;
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-r4b-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

function faf(dir: string, ...args: string[]): { status: number | null; out: string; lines: string[] } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, HOME: mk('home'), NO_COLOR: '1' } });
  const out = plain(`${r.stdout}${r.stderr}`);
  return { status: r.status, out, lines: out.split('\n').map(l => l.trim()) };
}

/** A folder holding `files` (path → text). */
function repo(files: Record<string, string>): string {
  const dir = mk('repo');
  for (const [name, text] of Object.entries(files)) {writeFileSync(join(dir, name), text);}
  return dir;
}

const read = (dir: string): string => readFileSync(join(dir, 'project.faf'), 'utf-8');
const needs = (slot: string, words: string): string => `${slot} says '${words}' — this app-type needs it, so it counts as empty until filled.`;
const leftOut = (slot: string, words: string): string => `${slot} says '${words}' — this app-type doesn't use it; faf auto marks it slotignored (N/A).`;
const scoreOf = (dir: string): number => Number(/(\d+)%/.exec(faf(dir, 'score', '--status').out)?.[1]);

describe('BRAKE: R04 — every typed word is handled like a typed none', () => {
  test('faf auto (library, no repo fact): `unknown` / "null" stay byte for byte in slots the type uses and in a 6W; a slot it leaves out becomes slotignored', () => {
    const text = [
      'project:',
      '  name: lib',
      '  goal: A library',
      '  main_language: TypeScript',
      '  type: library',
      'stack:',
      '  hosting: unknown # not decided yet (HC-U1)',
      '  database: unknown # maybe later (HC-U2)',
      '  build: "null" # typed by hand (HC-U3)',
      'human_context:',
      '  who: unknown # we do not know yet (HC-U4)',
      '',
    ].join('\n');
    const dir = repo({ 'project.faf': text, 'README.md': '# lib\n\nA small library for developers who hate boilerplate.\n' });
    const r = faf(dir, 'auto');
    expect(r.status).toBe(0);
    const lines = read(dir).split('\n');
    expect(lines).toContain('  hosting: unknown # not decided yet (HC-U1)'); // no fact: never ''
    expect(lines).toContain('  build: "null" # typed by hand (HC-U3)');
    expect(lines).toContain('  who: unknown # we do not know yet (HC-U4)'); // the README's audience never replaces a 6W
    expect(lines).toContain('  database: slotignored # maybe later (HC-U2)'); // a library does not use it
    // faf auto names the slots the type needs that nothing filled, once each.
    expect(r.lines.filter(l => l === needs('stack.hosting', 'unknown'))).toHaveLength(1);
    expect(r.lines.filter(l => l === needs('stack.build', 'null'))).toHaveLength(1);
    expect(r.lines.filter(l => l === needs('human_context.who', 'unknown'))).toHaveLength(1);
    expect(r.out).not.toContain('stack.database says');
  });

  test('a repo fact still replaces typed words in a tech slot the type uses (comment kept); library fillEmpties keeps them against no fact', () => {
    const dir = repo({
      'project.faf': 'project:\n  name: web\n  type: frontend\nstack:\n  frontend: unknown # FE (HC-F)\n  css_framework: TBD\n',
      'package.json': JSON.stringify({ name: 'web', dependencies: { react: '^18', 'react-dom': '^18' } }),
    });
    expect(faf(dir, 'auto').status).toBe(0);
    expect(read(dir).split('\n')).toContain('  frontend: React # FE (HC-F)');
    // No fact: every typed word stays, whatever the source offers that is not a fact.
    const target = { stack: { hosting: 'unknown', build: 'null', cicd: 'N/A' }, human_context: { who: 'unknown' } };
    expect(fillEmpties(target, { stack: { hosting: '', build: 'slotignored', cicd: 'unknown' }, human_context: { who: 'Platform developers' } })).toEqual(target);
  });

  test('faf score: one line per slot with typed words — "needs it" for a slot the type uses, "faf auto marks it" for one it leaves out; nothing written', () => {
    const text = 'project:\n  name: lib\n  goal: A library\n  main_language: TypeScript\n  type: library\nstack:\n  hosting: unknown\n  database: none\n  frontend: "null"\nhuman_context:\n  who: unknown\n';
    const dir = repo({ 'project.faf': text });
    const before = statSync(join(dir, 'project.faf')).mtimeMs;
    const r = faf(dir, 'score');
    expect(r.status).toBe(0);
    expect(r.lines.filter(l => l === needs('stack.hosting', 'unknown'))).toHaveLength(1);
    expect(r.lines.filter(l => l === needs('human_context.who', 'unknown'))).toHaveLength(1);
    expect(r.lines.filter(l => l === leftOut('stack.database', 'none'))).toHaveLength(1);
    expect(r.lines.filter(l => l === leftOut('stack.frontend', 'null'))).toHaveLength(1);
    expect(r.lines.filter(l => l.includes(' says \''))).toHaveLength(4);
    expect(read(dir)).toBe(text);
    expect(statSync(join(dir, 'project.faf')).mtimeMs).toBe(before);
    // The library call gives the same lines; faf auto's form leaves out the second kind.
    const hints = typedNoneHints(text, scoreFafYaml(text));
    expect(hints).toHaveLength(4);
    expect(typedNoneHints(text, scoreFafYaml(text), { outOfType: false })).toEqual(hints.filter(h => h.includes('needs it')));
  });

  test('a slot the app-type leaves out: faf auto writes slotignored over the typed none, so the project reaches 100; a real value there is kept', () => {
    const text = [
      'project:',
      '  name: web',
      '  goal: A deploy dashboard',
      '  main_language: TypeScript',
      '  type: frontend',
      'human_context:',
      '  who: Platform engineers',
      '  what: A deploy dashboard',
      '  why: Ship faster',
      '  where: Web',
      '  when: "2026"',
      '  how: React on Vercel',
      'stack:',
      '  frontend: React',
      '  css_framework: Tailwind',
      '  ui_library: shadcn',
      '  state_management: Zustand',
      '  backend: slotignored',
      '  api_type: slotignored',
      '  runtime: slotignored',
      '  database: None # a static site (DB-NONE)',
      '  connection: pglite',
      '  hosting: Vercel',
      '  build: Vite',
      '  cicd: GitHub Actions',
      '',
    ].join('\n');
    const dir = repo({ 'project.faf': text });
    expect(scoreOf(dir)).toBeLessThan(100); // the kernel does not read the app-type: None is empty
    expect(faf(dir, 'auto').status).toBe(0);
    const lines = read(dir).split('\n');
    expect(lines).toContain('  database: slotignored # a static site (DB-NONE)');
    expect(lines).toContain('  connection: pglite'); // a real value in a slot the type leaves out stays
    expect(scoreOf(dir)).toBe(100);

    // A framework repo leaves out database although its backend slots count.
    const fw = repo({ 'project.faf': 'project:\n  name: kit\n  type: framework\nstack:\n  database: None # DB\n  backend: None # BE\n' });
    expect(faf(fw, 'auto').status).toBe(0);
    expect(read(fw).split('\n')).toEqual(expect.arrayContaining(['  database: slotignored # DB', '  backend: None # BE']));

    // The `library` detection only falls back to (no classifying signal) decides nothing — on this
    // run or the next, while its line carries faf's fallback note; faf score promises nothing for it.
    const bare = repo({ 'project.faf': 'project:\n  name: bare\nstack:\n  frontend: None # FE\n' });
    expect(faf(bare, 'auto').status).toBe(0);
    expect(read(bare)).toContain('  type: library # found: no classifying signals — fallback');
    expect(faf(bare, 'auto').status).toBe(0);
    expect(read(bare).split('\n')).toContain('  frontend: None # FE');
    expect(faf(bare, 'score').out).not.toContain('stack.frontend says');
    // A type you set (the note gone) is the file's own: it decides.
    writeFileSync(join(bare, 'project.faf'), read(bare).replace(' # found: no classifying signals — fallback', ''));
    expect(faf(bare, 'score').lines).toContain(leftOut('stack.frontend', 'None'));
    expect(faf(bare, 'auto').status).toBe(0);
    expect(read(bare).split('\n')).toContain('  frontend: slotignored # FE');
  });

  test('slotignored comes only from the file\'s app-type: detection reading the repo as another type never takes out a slot the file\'s type uses', () => {
    // The file says fullstack; the empty repo reads as a library, whose detection marks the frontend slots out.
    const dir = repo({ 'project.faf': 'project:\n  name: app\n  type: fullstack\nstack:\n  frontend: ""\n  css_framework:\n' });
    expect(faf(dir, 'auto').status).toBe(0);
    const stack = (parse(read(dir)) as { stack: Record<string, unknown> }).stack;
    expect([stack.frontend, stack.css_framework, stack.ui_library, stack.backend, stack.database]).toEqual(['', null, '', '', '']);
    expect(stack.cache).toBe('slotignored'); // fullstack leaves the enterprise slots out
  });

  test('faf go shows any typed words (not only None) and Enter keeps them byte for byte', async () => {
    const text = 'project:\n  name: api\n  goal: Serve orders\n  main_language: TypeScript\n  type: backend\nstack:\n  database: unknown # later (DB-U)\n';
    const dir = repo({ 'project.faf': text });
    const home = mk('home');
    const out = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, [CLI, 'go'], { cwd: dir, env: { ...process.env, HOME: home, NO_COLOR: '1' } });
      let buf = '';
      let answered = 0;
      const timer = setTimeout(() => { child.kill(); reject(new Error(plain(buf))); }, 60_000);
      child.stdout.on('data', (chunk: Buffer) => {
        buf += chunk.toString();
        const asked = plain(buf).match(/\([a-z_]+\.[a-z_]+\)[^\n]*?: /g) ?? [];
        for (; answered < asked.length; answered++) {child.stdin.write('\n');}
      });
      child.stderr.on('data', (chunk: Buffer) => { buf += chunk.toString(); });
      child.on('close', () => { clearTimeout(timer); resolve(plain(buf)); });
    });
    expect(out).toContain("(stack.database) now 'unknown' — Enter keeps it: ");
    expect(read(dir)).toBe(text);
  });
});

describe('BRAKE: YQ01 — an anchor that aliases read is never filled', () => {
  const text = 'project:\n  name: demo\n  goal: Ship\n  main_language: TypeScript\n  type: frontend\nstack:\n  frontend: &nothing None # decided later (HC-A)\n  ui_library: *nothing\n  state_management: *nothing\n';
  const react = { 'package.json': JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0' } }), 'vercel.json': '{}\n' };

  test('faf auto leaves the anchored typed none as written (so every alias still reads None) and says so in one line', () => {
    const dir = repo({ 'project.faf': text, ...react });
    const r = faf(dir, 'auto');
    expect(r.status).toBe(0);
    const after = read(dir);
    expect(after.split('\n')).toContain('  frontend: &nothing None # decided later (HC-A)');
    const data = parse(after) as { stack: Record<string, unknown> };
    expect([data.stack.frontend, data.stack.ui_library, data.stack.state_management]).toEqual(['None', 'None', 'None']);
    expect(data.stack.hosting).toBe('Vercel'); // the rest of the fill is written
    expect(r.lines.filter(l => l === 'stack.frontend holds an anchor (&nothing) that an alias reads — faf left it as written')).toHaveLength(1);
  });

  test('library: writeFaf(updateExistingFaf(…)) reports it as a kept alias of kind "anchor"; an explicit edit through the anchor still writes', () => {
    const dir = repo({ 'project.faf': text, ...react });
    const path = join(dir, 'project.faf');
    const kept: KeptAlias[] = [];
    writeFaf(path, updateExistingFaf(dir, readFaf(path)), { onAliasKept: k => kept.push(k) });
    expect(kept).toEqual([{ path: 'stack.frontend', alias: '&nothing', kind: 'anchor' }]);
    expect(aliasKeptNote(kept[0])).toBe('stack.frontend holds an anchor (&nothing) that an alias reads — faf left it as written');
    // `faf edit` is the person's own change: it goes through the anchor, as before.
    expect(faf(dir, 'edit', 'stack.frontend', 'Svelte').status).toBe(0);
    expect((parse(read(dir)) as { stack: Record<string, unknown> }).stack.ui_library).toBe('Svelte');
  });
});

describe('BRAKE: perf3 — the fence scanner is linear however deep a file nests', () => {
  test(`10,000 nested levels plus a faf block: under 1 s, faf's block on top, every byte kept; past ${MAX_OPEN_CONTAINERS} containers the file is the user's`, () => {
    const dir = mk('deep');
    const body = `${'- '.repeat(10_000)}x\n${'>'.repeat(10_000)} x\n${Array.from({ length: 1_000 }, (_, i) => `${'  '.repeat(i)}- x`).join('\n')}\n`;
    const path = join(dir, 'CLAUDE.md');
    const old = `${body}\n<!-- faf:start -->\nold\n<!-- faf:end -->\n`;
    writeFileSync(path, old);
    const t0 = performance.now();
    injectFafBlock(path, 'NEW');
    expect(performance.now() - t0).toBeLessThan(1000);
    const after = readFileSync(path, 'utf-8');
    expect(after.startsWith('<!-- faf:start -->\nNEW\n<!-- faf:end -->\n')).toBe(true);
    expect(after.endsWith(old)).toBe(true); // nothing lost: the old block below is the user's now
    expect(legacyStampNote('CLAUDE.md', old)).toContain(`more than ${MAX_OPEN_CONTAINERS} lists or quotes`);
    // The next write finds faf's own block on top and updates it in place.
    injectFafBlock(path, 'NEWER');
    expect(readFileSync(path, 'utf-8')).toBe(`<!-- faf:start -->\nNEWER\n<!-- faf:end -->\n\n${old}`);
  });

  test('a nested list 1,200 levels deep with the block below it — 14 s before — takes well under a second', () => {
    const dir = mk('deep');
    const body = Array.from({ length: 1_200 }, (_, i) => `${' '.repeat(i * 2)}- x`).join('\n') + '\n';
    const path = join(dir, 'AGENTS.md');
    writeFileSync(path, `${body}\n<!-- faf:start -->\nold\n<!-- faf:end -->\n`);
    const t0 = performance.now();
    injectFafBlock(path, 'NEW');
    expect(performance.now() - t0).toBeLessThan(1000);
    expect(readFileSync(path, 'utf-8').includes(body)).toBe(true);
  });

  test(`up to ${MAX_OPEN_CONTAINERS} containers a file reads as before: a block below deep nesting is still found`, () => {
    const nested = Array.from({ length: 40 }, (_, i) => `${'  '.repeat(i)}- x`).join('\n');
    const text = `${nested}\n\n<!-- faf:start -->\nbody\n<!-- faf:end -->\n`;
    expect(findFafBlock(text)).not.toBeNull();
    const reader = new BlockReader(true);
    for (const line of text.split('\n')) {reader.line(line);}
    expect(reader.tooDeep).toBe(false);
    const deep = new BlockReader(true);
    deep.line('- '.repeat(MAX_OPEN_CONTAINERS) + 'x');
    expect(deep.tooDeep).toBe(true);
  });
});
