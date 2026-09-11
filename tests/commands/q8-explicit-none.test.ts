/**
 * BRAKE: `faf ai enhance` and `faf go` never replace a hand-written None, N/A
 * or not applicable — Q8 everywhere (the 7.13 owner-rule round).
 *
 * Q8: a hand-written `None` / `N/A` / `not applicable` is a decision (the
 * explicit-none sentinel, the same as `slotignored`), and a detected value
 * never replaces it. `faf auto` kept it since I2, but `faf ai enhance` still
 * sent the slot to Claude as "empty" and wrote the suggestion over it, and
 * `faf go` asked about it and wrote the answer over it — because both used
 * isPlaceholder, which reads `none` and `n/a` as empty.
 *
 * Both commands run for real here: `faf go` with its answers on stdin, and
 * `faf ai enhance` with the Anthropic SDK replaced by a local fake (a bun
 * preload) that answers every slot it is asked about. Nothing leaves the
 * machine.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn, spawnSync } from 'child_process';
import { parse } from 'yaml';

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
`;
const KEPT = ['  database: None # deliberate: stateless (NONE-COMMENT)', '  hosting: N/A', '  cache: not applicable'];

/** A fake @anthropic-ai/sdk: every slot the prompt lists gets a concrete-looking value. */
const FAKE_SDK = `import { plugin } from 'bun';
class FakeAnthropic {
  messages = {
    create: async (req) => {
      const prompt = req.messages[0].content;
      const paths = [...prompt.matchAll(/^- ([a-z_]+\\.[a-z_]+): /gm)].map(m => m[1]);
      const out = {};
      for (const p of paths) out[p] = 'AI-FILLED ' + p;
      return { content: [{ text: JSON.stringify(out) }] };
    },
  };
}
plugin({ name: 'fake-anthropic', setup(build) { build.module('@anthropic-ai/sdk', () => ({ exports: { default: FakeAnthropic }, loader: 'object' })); } });
`;

function repo(): { dir: string; home: string } {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-q8-')));
  const home = realpathSync(mkdtempSync(join(tmpdir(), 'faf-q8-home-')));
  writeFileSync(join(dir, 'project.faf'), FAF);
  return { dir, home };
}

const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

/** Run `faf go` and answer each question as it is asked (readline drops
 *  lines piped in before a question is pending). Resolves with the output
 *  and the slot paths that were asked about. */
function interview(dir: string, home: string, answer: string): Promise<{ status: number | null; out: string; asked: string[] }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, 'go'], { cwd: dir, env: { ...process.env, HOME: home, NO_COLOR: '1' } });
    let out = '';
    let answered = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error(`faf go did not finish:\n${plain(out)}`)); }, 60_000);
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString();
      const asked = plain(out).match(/\(([a-z_]+\.[a-z_]+)\): /g) ?? [];
      while (answered < asked.length) {
        child.stdin.write(`${answer}\n`);
        answered++;
      }
    });
    child.stderr.on('data', (chunk: Buffer) => { out += chunk.toString(); });
    child.on('close', status => {
      clearTimeout(timer);
      const asked = [...plain(out).matchAll(/\(([a-z_]+\.[a-z_]+)\): /g)].map(m => m[1]);
      resolve({ status, out: plain(out), asked });
    });
  });
}

describe('BRAKE: Q8 — an explicit none is never replaced by `faf ai enhance` or `faf go`', () => {
  test('`faf ai enhance`: the AI is not asked about a None / N/A / not applicable slot, and the lines stay byte for byte', () => {
    const { dir, home } = repo();
    const preload = join(home, 'fake-anthropic.ts');
    writeFileSync(preload, FAKE_SDK);
    const r = spawnSync(process.execPath, ['--preload', preload, CLI, 'ai', 'enhance'], {
      cwd: dir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: home, ANTHROPIC_API_KEY: 'sk-test-not-real', NO_COLOR: '1' },
    });
    expect(r.status).toBe(0);
    const out = plain(`${r.stdout}${r.stderr}`);
    // Each filled slot is listed as `● <path> ← <value>`.
    expect(out).toContain('stack.frontend ← AI-FILLED stack.frontend');
    for (const path of ['stack.database', 'stack.hosting', 'stack.cache']) {expect(out).not.toContain(`${path} ←`);}
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    for (const line of KEPT) {expect(after.split('\n')).toContain(line);}
    // The command did run: a real empty slot was filled.
    expect(parse(after).stack.frontend).toBe('AI-FILLED stack.frontend');
  });

  test('`faf go`: the interview does not ask about a None / N/A / not applicable slot, and the lines stay byte for byte', async () => {
    const { dir, home } = repo();
    const r = await interview(dir, home, 'INTERVIEW-ANSWER');
    expect(r.status).toBe(0);
    expect(r.asked).toContain('stack.frontend');
    for (const path of ['stack.database', 'stack.hosting', 'stack.cache']) {expect(r.asked).not.toContain(path);}
    const after = readFileSync(join(dir, 'project.faf'), 'utf-8');
    for (const line of KEPT) {expect(after.split('\n')).toContain(line);}
    // The interview did run: a real empty slot took an answer.
    expect(parse(after).stack.frontend).toBe('INTERVIEW-ANSWER');
  });
});
