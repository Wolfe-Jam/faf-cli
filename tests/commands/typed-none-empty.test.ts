/**
 * BRAKE: a typed None / N/A / not applicable is an empty slot — through the
 * real CLI (Q8, FINAL, wolfejam 2026-09-11).
 *
 *   - it scores 0: `faf score` counts it exactly like an empty slot, and a
 *     human surface never shows it as slotignored;
 *   - tech slots, "if it's a fact, fill the slot": `faf auto` fills it from a
 *     repo fact; with no fact the words stay byte for byte, comment included,
 *     in a slot the app-type uses — and in a slot the app-type leaves out,
 *     `faf auto` marks it `slotignored` (the app-type's decision);
 *   - the 6Ws are the person's: `faf auto` never replaces a typed none there;
 *   - `faf score` prints one line per slot that still holds a typed none (the
 *     app-type needs it / faf auto marks it slotignored); `faf auto` prints
 *     the first kind. Neither line writes anything.
 *
 * Every run has HOME set to its own mkdtemp folder.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { parse } from 'yaml';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const tmp = (tag: string): string => realpathSync(tempFolders.mkdtemp(join(tmpdir(), `faf-typed-none-${tag}-`)));
const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

function faf(dir: string, ...args: string[]): { status: number | null; out: string; lines: string[] } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, HOME: tmp('home'), NO_COLOR: '1' } });
  const out = plain(`${r.stdout}${r.stderr}`);
  return { status: r.status, out, lines: out.split('\n').map(l => l.trim()) };
}

const hint = (slot: string, words: string): string =>
  `${slot} says '${words}' — this app-type needs it, so it counts as empty until filled.`;
const outHint = (slot: string, words: string): string =>
  `${slot} says '${words}' — this app-type doesn't use it; faf auto marks it slotignored.`;

/** A React + Vite front end on Vercel, with a README that names its audience. No database. */
function webRepo(): string {
  const dir = tmp('web');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'web', description: 'A deploy dashboard', dependencies: { react: '^18', 'react-dom': '^18' }, devDependencies: { vite: '^5' } }));
  writeFileSync(join(dir, 'vercel.json'), '{}\n');
  writeFileSync(join(dir, 'README.md'), '# web\n\nA deploy dashboard.\n\n## Who is this for\n\nPlatform engineers who run many services.\n');
  return dir;
}

describe('BRAKE: faf auto — a fact fills a typed none in a tech slot', () => {
  test('`database: None # …` takes the repo\'s PostgreSQL in place, comment kept; `frontend: N/A` takes React', () => {
    const dir = webRepo();
    writeFileSync(join(dir, 'docker-compose.yml'), 'services:\n  db:\n    image: postgres:16\n');
    writeFileSync(join(dir, 'project.faf'), 'project:\n  name: web\n  type: frontend\nstack:\n  database: None # deliberate: stateless (NONE-COMMENT)\n  frontend: N/A # NA-COMMENT\n');
    const r = faf(dir, 'auto');
    expect(r.status).toBe(0);
    const lines = readFileSync(join(dir, 'project.faf'), 'utf-8').split('\n');
    expect(lines).toContain('  database: PostgreSQL # deliberate: stateless (NONE-COMMENT)');
    expect(lines).toContain('  frontend: React # NA-COMMENT');
    expect(r.out).not.toContain('says \'');
  });
});

describe('BRAKE: faf auto — no fact, the typed words stay; a 6W typed none is never replaced', () => {
  test('no fact: `not applicable` in a slot the app-type uses stays byte for byte; `None` in a slot it leaves out becomes slotignored, comment kept — and faf says which the app-type needs, once each', () => {
    const dir = webRepo();
    const text = [
      'project:',
      '  name: web',
      '  type: frontend',
      'stack:',
      '  database: None # deliberate: stateless (NONE-COMMENT)',
      '  css_framework: not applicable # CSS-COMMENT',
      '',
    ].join('\n');
    writeFileSync(join(dir, 'project.faf'), text);
    const r = faf(dir, 'auto');
    expect(r.status).toBe(0);
    const lines = readFileSync(join(dir, 'project.faf'), 'utf-8').split('\n');
    // A frontend does not use the database slot: the app-type's decision, not the words.
    expect(lines).toContain('  database: slotignored # deliberate: stateless (NONE-COMMENT)');
    expect(lines).toContain('  css_framework: not applicable # CSS-COMMENT');
    expect(lines.filter(l => /^ {2}(database|css_framework):/.test(l))).toHaveLength(2);
    // A frontend needs css_framework: one line. The database slot is marked by now: no line.
    expect(r.lines.filter(l => l === hint('stack.css_framework', 'not applicable'))).toHaveLength(1);
    expect(r.out).not.toContain('stack.database says');
  });

  test('a 6W `who: None` stays as typed although the README names the audience; an empty 6W is filled from it', () => {
    const dir = webRepo();
    writeFileSync(join(dir, 'project.faf'), 'project:\n  name: web\n  type: frontend\nhuman_context:\n  who: None # WHO-COMMENT\n  what: ""\n');
    const r = faf(dir, 'auto');
    expect(r.status).toBe(0);
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    expect(after.split('\n')).toContain('  who: None # WHO-COMMENT');
    expect((parse(after) as { human_context: Record<string, string> }).human_context.what).toBe('A deploy dashboard');
    expect(r.lines.filter(l => l === hint('human_context.who', 'None'))).toHaveLength(1);
  });
});

describe('BRAKE: faf score — a typed none counts as empty, and the hint prints once per slot', () => {
  const file = (database: string, who: string): string => [
    'project:',
    '  name: api',
    '  goal: Serve orders',
    '  main_language: TypeScript',
    '  type: backend',
    'stack:',
    `  database: ${database}`,
    '  frontend: None',
    'human_context:',
    `  who: ${who}`,
    '',
  ].join('\n');

  test('the score equals the empty-slot score, below 100, and no slot shows as N/A', () => {
    const typed = tmp('score');
    writeFileSync(join(typed, 'project.faf'), file('None # stateless', 'N/A'));
    const empty = tmp('score');
    writeFileSync(join(empty, 'project.faf'), file('""', '""'));
    const a = faf(typed, 'score', '--verbose');
    const b = faf(empty, 'score', '--verbose');
    expect([a.status, b.status]).toEqual([0, 0]);
    const head = (lines: string[]): string => (lines.find(l => /\d+%/.test(l)) ?? '').replace(/—.*$/, '');
    expect(head(a.lines)).toBe(head(b.lines));
    expect(Number(/(\d+)%/.exec(head(a.lines))![1])).toBeLessThan(100);
    // Human surface: an empty slot, never slotignored.
    for (const slot of ['stack.database', 'human_context.who']) {
      expect(a.lines).toContain(`○ ${slot}`);
      expect(a.out).not.toContain(`${slot}: slotignored`);
    }
    const json = JSON.parse(spawnSync(process.execPath, [CLI, 'score', '--json'], { cwd: typed, encoding: 'utf-8', env: { ...process.env, HOME: tmp('home') } }).stdout);
    expect([json.slots['stack.database'], json.slots['human_context.who']]).toEqual(['empty', 'empty']);
  });

  test('one line per slot that holds a typed none — exactly once; a slot the app-type leaves out says faf auto marks it; nothing written', () => {
    const dir = tmp('hint');
    const path = join(dir, 'project.faf');
    writeFileSync(path, file('None # stateless', 'N/A'));
    const before = readFileSync(path);
    const mtime = statSync(path).mtimeMs;
    const r = faf(dir, 'score');
    expect(r.status).toBe(0);
    expect(r.lines.filter(l => l === hint('stack.database', 'None'))).toHaveLength(1);
    expect(r.lines.filter(l => l === hint('human_context.who', 'N/A'))).toHaveLength(1);
    // A backend does not use the frontend slots: `frontend: None` gets the other line.
    expect(r.lines.filter(l => l === outHint('stack.frontend', 'None'))).toHaveLength(1);
    expect(r.lines.filter(l => l.includes(' says \''))).toHaveLength(3);
    expect(readFileSync(path).equals(before)).toBe(true);
    expect(statSync(path).mtimeMs).toBe(mtime);
    // The machine outputs stay as they are: no hint in --json or --status.
    for (const flag of ['--json', '--status']) {expect(faf(dir, 'score', flag).out).not.toContain(' says \'');}
  });
});
