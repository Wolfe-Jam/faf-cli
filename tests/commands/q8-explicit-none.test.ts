/**
 * BRAKE: `faf go` asks about a typed None / N/A / not applicable like any
 * empty slot — Q8, FINAL (wolfejam 2026-09-11).
 *
 * A typed none is an empty slot: it scores 0 until filled. `faf go` asks for
 * it as it asks for any empty slot (a 6W included — the 6Ws are the
 * person's), and the question shows the current words, so the person can
 * keep them (Enter) or answer. Round 3a skipped such a slot, so `faf go`
 * never offered to fill it.
 *
 * `faf go` runs for real here, with its answers written as each question is
 * asked.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');

const FAF = `project:
  name: demo
  goal: A demo service
  main_language: TypeScript
  type: backend
stack:
  database: None # deliberate: stateless (NONE-COMMENT)
  hosting: N/A
  cache: not applicable
human_context:
  who: None # WHO-NONE
`;

function repo(): { dir: string; home: string } {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-q8-')));
  const home = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-q8-home-')));
  writeFileSync(join(dir, 'project.faf'), FAF);
  return { dir, home };
}

const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

/** A question as `faf go` prints it: `(slot.path)`, then — for a typed
 *  none — `now '<words>' — Enter keeps it`, then `: `. */
const QUESTION = /\(([a-z_]+\.[a-z_]+)\)(?: now '([^']*)' — Enter keeps it)?: /g;

/** Run `faf go` and answer each question as it is asked (readline drops
 *  lines piped in before a question is pending). `answers` maps a slot path
 *  to its answer; any other question gets Enter. Resolves with the output and
 *  the questions asked (path → the words shown, or null). */
function interview(dir: string, home: string, answers: Record<string, string>): Promise<{ status: number | null; out: string; asked: Map<string, string | null> }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, 'go'], { cwd: dir, env: { ...process.env, HOME: home, NO_COLOR: '1' } });
    let out = '';
    let answered = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error(`faf go did not finish:\n${plain(out)}`)); }, 60_000);
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString();
      const asked = [...plain(out).matchAll(QUESTION)];
      while (answered < asked.length) {
        child.stdin.write(`${answers[asked[answered][1]] ?? ''}\n`);
        answered++;
      }
    });
    child.stderr.on('data', (chunk: Buffer) => { out += chunk.toString(); });
    child.on('close', status => {
      clearTimeout(timer);
      const asked = new Map([...plain(out).matchAll(QUESTION)].map(m => [m[1], m[2] ?? null] as [string, string | null]));
      resolve({ status, out: plain(out), asked });
    });
  });
}

describe('BRAKE: Q8 — `faf go` asks about a typed none like any empty slot, and shows the words', () => {
  test('each None / N/A / not applicable slot is asked, its words shown; Enter keeps the file byte for byte', async () => {
    const { dir, home } = repo();
    const r = await interview(dir, home, {});
    expect(r.status).toBe(0);
    expect(r.asked.get('stack.database')).toBe('None');
    expect(r.asked.get('stack.hosting')).toBe('N/A');
    expect(r.asked.get('stack.cache')).toBe('not applicable');
    expect(r.asked.get('human_context.who')).toBe('None'); // a 6W too: the person's to answer
    expect(r.asked.get('stack.frontend')).toBeNull(); // an empty slot: no words to show
    expect(readFileSync(join(dir, 'project.faf'), 'utf-8')).toBe(FAF);
  });

  test('an answer replaces the typed words in place (comment kept); the rest stay byte for byte', async () => {
    const { dir, home } = repo();
    const r = await interview(dir, home, { 'stack.database': 'PostgreSQL', 'human_context.who': 'Platform developers' });
    expect(r.status).toBe(0);
    const lines = readFileSync(join(dir, 'project.faf'), 'utf-8').split('\n');
    expect(lines).toContain('  database: PostgreSQL # deliberate: stateless (NONE-COMMENT)');
    expect(lines).toContain('  who: Platform developers # WHO-NONE');
    expect(lines).toContain('  hosting: N/A');
    expect(lines).toContain('  cache: not applicable');
  });
});
