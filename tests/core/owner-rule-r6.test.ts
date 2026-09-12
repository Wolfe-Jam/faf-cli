/**
 * BRAKE: the owner rule, round 6 (R6) — the last touches the final check
 * found, each fixed at the source:
 *
 *   1  a project.faf that is a scalar or a list printed a stack trace in 14
 *      commands (a plain Error); it is the one-line `not-yaml` refusal.
 *   2  `faf score`, `faf status`, `faf compile` and `faf refresh` handed
 *      project.faf to the scoring kernel unparsed: a repeated key was the
 *      kernel's error (an UnhandledPromiseRejection under Node), and a BOM
 *      stopped `faf compile`. They parse it first, and a kernel rejection is
 *      one line — under bun and under Node.
 *   3  a lone CR in .git/config: faf split a line there and git did not, so
 *      `faf diff --uninstall-driver` removed a `[diff "faf"]` git read as part
 *      of a comment. Such a config is refused in one line.
 *   4  `faf cards` wrote a new time stamp into every card on every run.
 *      It keeps the stamp the cards carry, so a run that changes nothing
 *      writes nothing and says unchanged.
 *   5  `faf hooks --uninstall` left the blank line install put before faf's
 *      section; install then uninstall is now byte for byte.
 *   6  `faf check` called a project.faf with a BOM "invalid yaml".
 *   7  `faf decompile --output` was offered and ignored.
 *
 * Every CLI run here gets a HOME of its own (mkdtemp), and every folder is
 * removed when the suite ends.
 */
import { afterAll, beforeAll, describe, test, expect } from 'bun:test';
import { chmodSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { SafePathError } from '../../src/core/safe-write.js';
import { asFafMapping } from '../../src/core/shape.js';
import { readFaf, writeFaf } from '../../src/interop/faf.js';
import * as kernel from '../../src/wasm/kernel.js';
import * as diff from '../../src/commands/diff.js';

const withoutDriverLine = (text: string): string | null =>
  (diff as unknown as { withoutDriverLine: (t: string) => string | null }).withoutDriverLine(text);

const ROOT = join(import.meta.dir, '../..');
const CLI = join(ROOT, 'src/cli.ts');
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-r6-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

interface Run { status: number | null; out: string; err: string }
const env = (extra: Record<string, string> = {}): Record<string, string> =>
  ({ ...process.env, HOME: mk('home'), NO_COLOR: '1', CI: '1', GIT_CONFIG_NOSYSTEM: '1', ...extra }) as Record<string, string>;
/** The CLI from source, under bun. */
function run(cwd: string, args: string[], extra: Record<string, string> = {}): Run {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: env(extra), stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const lines = (s: string): string[] => s.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '')).filter(l => l.trim() !== '');
/** Every line a run printed, stdout then stderr. */
const printed = (r: Run): string[] => [...lines(r.out), ...lines(r.err)];
const read = (p: string): string => readFileSync(p, 'utf-8');
const bytes = (p: string): Buffer => readFileSync(p);

// ── 1: a project.faf that is a scalar or a list ────────────────────────────────

describe('BRAKE R6-1: a project.faf that is a scalar or a list is one line in every command', () => {
  const shapeLine = (p: string, shape: string): string =>
    `faf: ${p}: a .faf must be a YAML mapping (key: value pairs), but this one is ${shape}. faf left it unchanged — fix it by hand.`;

  test('faf auto on a scalar project.faf: exit 1, exactly one line, the file byte for byte', () => {
    const d = mk('scalar');
    const p = join(d, 'project.faf');
    writeFileSync(p, 'just a string\n');
    const r = run(d, ['auto']);
    expect(r.status).toBe(1);
    expect(printed(r)).toEqual([shapeLine(p, 'a string ("just a string")')]);
    expect(read(p)).toBe('just a string\n');
  });

  const commands: string[][] = [
    ['sync'], ['export', '--agents'], ['export', '--html'], ['edit', 'project.goal', 'New goal'], ['migrate'],
    ['context'], ['cards'], ['server-card'], ['show'], ['loop'], ['agents'],
  ];
  for (const args of commands) {
    test(`faf ${args.join(' ')} on a list project.faf: exit 1, exactly one line, nothing written`, () => {
      const d = mk('list');
      const p = join(d, 'project.faf');
      writeFileSync(p, '- a\n- b\n');
      const r = run(d, args);
      expect(r.status).toBe(1);
      expect(printed(r)).toEqual([shapeLine(p, 'a list (2 items)')]);
      expect(read(p)).toBe('- a\n- b\n');
      expect(['AGENTS.md', 'CLAUDE.md', 'project.html', 'server-card'].filter(f => existsSync(join(d, f)))).toEqual([]);
    });
  }

  test('the library: asFafMapping, readFaf and writeFaf refuse a scalar or a list with a SafePathError (not-yaml)', () => {
    const shaped = (fn: () => unknown): SafePathError => {
      try {
        fn();
      } catch (e) {
        expect(e).toBeInstanceOf(SafePathError);
        return e as SafePathError;
      }
      throw new Error('expected a refusal');
    };
    expect(shaped(() => asFafMapping('old-init', 'x.faf')).reason).toBe('not-yaml');
    const d = mk('lib');
    const p = join(d, 'project.faf');
    writeFileSync(p, '- a\n- b\n');
    expect(shaped(() => readFaf(p)).reason).toBe('not-yaml');
    const e = shaped(() => writeFaf(p, { project: { name: 'x' } }));
    expect(e.reason).toBe('not-yaml');
    expect(e.message).toBe(`${p}: a .faf must be a YAML mapping (key: value pairs), but this one is a list (2 items). faf left it unchanged — fix it by hand.`);
    expect(read(p)).toBe('- a\n- b\n');
  });
});

// ── 2: faf score / status / compile / refresh — under bun and under Node ──────

const hasNode = spawnSync('node', ['--version'], { encoding: 'utf-8' }).status === 0;
let NODE_CLI = '';

/** The CLI built for Node (as `npm run build` builds dist/cli.js), run with node. */
function runNode(cwd: string, args: string[]): Run {
  const r = spawnSync('node', [NODE_CLI, ...args], { cwd, encoding: 'utf-8', env: env(), stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

describe('BRAKE R6-2: faf score, status, compile and refresh parse project.faf first; a kernel rejection is one line (bun and Node)', () => {
  beforeAll(() => {
    if (!hasNode) {return;}
    const out = mk('nodecli');
    const b = spawnSync(process.execPath, ['build', CLI, '--outdir', out, '--target=node', '--external', 'faf-scoring-kernel', '--external', 'open'], { encoding: 'utf-8' });
    expect(b.status).toBe(0);
    writeFileSync(join(out, 'package.json'), '{"type":"module"}\n');
    symlinkSync(join(ROOT, 'node_modules'), join(out, 'node_modules'));
    NODE_CLI = join(out, 'cli.js');
  });

  const DUP = 'project:\n  name: m\n  goal: g\nstack:\n  frontend: None\n  frontend: React\n';
  const BIG = 'project:\n  name: m\n  goal: g\n  build_id: 123456789012345678901234567890\n';
  const BOM = '\uFEFFproject:\n  name: m\n  goal: A tool\nstack:\n  frontend: React\n';
  const COMMANDS = [['score'], ['status'], ['score', '--json'], ['compile'], ['refresh']];

  const runners: Array<[string, (cwd: string, args: string[]) => Run]> = [['bun', run], ['node', runNode]];
  for (const [name, runner] of runners) {
    const t = name === 'node' ? test.skipIf(!hasNode) : test;

    t(`${name}: a repeated key — the one-line not-yaml refusal, exit 1, nothing written`, () => {
      for (const args of COMMANDS) {
        const d = mk('dup');
        const p = join(d, 'project.faf');
        writeFileSync(p, DUP);
        const r = runner(d, args);
        expect({ args, status: r.status }).toEqual({ args, status: 1 });
        expect(printed(r)).toEqual([`faf: ${p} is not valid YAML (Map keys must be unique, line 6) — faf left it unchanged`]);
        expect(read(p)).toBe(DUP);
        expect(['project.fafb', '.faf-dna'].filter(f => existsSync(join(d, f)))).toEqual([]);
      }
    });

    t(`${name}: text yaml reads but the scoring kernel rejects (a 30-digit integer) — one line, exit 1`, () => {
      for (const args of COMMANDS) {
        const d = mk('big');
        const p = join(d, 'project.faf');
        writeFileSync(p, BIG);
        const r = runner(d, args);
        expect({ args, status: r.status }).toEqual({ args, status: 1 });
        const got = printed(r);
        expect(got.length).toBe(1);
        expect(got[0].startsWith(`faf: ${p}: faf's scoring kernel could not read it (`)).toBe(true);
        expect(got[0]).toContain('123456789012345678901234567890');
        expect(got[0].endsWith(') — faf left it unchanged')).toBe(true);
        expect(read(p)).toBe(BIG);
      }
    });

    t(`${name}: a project.faf with a BOM compiles, and faf refresh re-compiles its .fafb`, () => {
      const d = mk('bom');
      const p = join(d, 'project.faf');
      writeFileSync(p, BOM);
      const c = runner(d, ['compile']);
      expect(c.status).toBe(0);
      expect(bytes(join(d, 'project.fafb')).subarray(0, 4).toString('latin1')).toBe('FAFB');
      const f = runner(d, ['refresh']);
      expect(f.status).toBe(0);
      expect(lines(f.out).some(l => l.includes('.fafb re-compiled'))).toBe(true);
      expect(read(p)).toBe(BOM);
    });
  }

  test('the library: kernel.compile and kernel.validate leave a leading BOM out, as kernel.score does', () => {
    const plain = BOM.slice(1);
    expect(Buffer.from(kernel.compile(BOM)).equals(Buffer.from(kernel.compile(plain)))).toBe(true);
    expect(kernel.validate(BOM)).toBe(true);
  });
});

// ── 3: a lone CR in .git/config ────────────────────────────────────────────────

describe('BRAKE R6-3: faf diff --uninstall-driver refuses a git config with a lone CR', () => {
  const FAFV = 'faf-cli diff-driver';
  const H = '[diff "faf"]';
  const C = `\tcommand = ${FAFV}`;

  test('withoutDriverLine: a CR that does not end a line → null; CRLF line ends still work', () => {
    expect(withoutDriverLine(`[core]\n\tbare = false\n${H}\n# HAND-NOTE\r${H}\n${C}\n`)).toBeNull();
    expect(withoutDriverLine(`[alias]\n\tst = status # a\rb\n${H}\n${C}\n`)).toBeNull();
    expect(withoutDriverLine(`${H}\n${C}\n\r`)).toBeNull();
    expect(withoutDriverLine(`[core]\r\n\tbare = false\r\n${H}\r\n${C}\r\n`)).toBe('[core]\r\n\tbare = false\r\n');
  });

  test('uninstall over a comment holding a lone CR (git reads "# note\\r[diff \\"faf\\"]" as one line): one line, exit 1, the config byte for byte', () => {
    const d = mk('cr');
    const home = mk('crhome');
    const git = (a: string[]): string =>
      execFileSync('git', a, { cwd: d, encoding: 'utf-8', env: { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
    git(['init', '-q']);
    writeFileSync(join(d, 'project.faf'), 'project:\n  name: demo\n');
    const cfg = join(d, '.git', 'config');
    const text = `${read(cfg)}${H}\n# HAND-NOTE\r${H}\n${C}\n`;
    writeFileSync(cfg, text);
    expect(git(['config', '--get-all', 'diff.faf.command']).trim()).toBe(FAFV);
    const r = run(d, ['diff', '--uninstall-driver'], { HOME: home });
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([
      `faf: ${cfg} has a carriage return (CR) that does not end a line, so faf and git could read its lines differently — faf left your git config unchanged.`,
    ]);
    expect(read(cfg)).toBe(text);
  });
});

// ── 4: faf cards keeps the stamp ───────────────────────────────────────────────

describe('BRAKE R6-4: faf cards keeps the time stamp the cards carry — a run that changes nothing writes nothing', () => {
  const FAF = 'faf_version: 2.5.2\nproject:\n  name: smoke-app\n  goal: A tiny API\n  main_language: TypeScript\n';
  const SERVER_JSON =
    '{\n  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",\n  "name": "io.github.example/smoke-app",\n' +
    '  "description": "Hand description",\n  "version": "1.0.0",\n  "buildId": 12345678901234567890\n}\n';
  const STAMP = '2026-01-02T03:04:05.000Z';
  const stampOf = (text: string, at: (j: Record<string, any>) => unknown): unknown => at(JSON.parse(text));

  test('server.json stamped by faf server-card: faf cards writes the Server Card with that stamp, leaves server.json, and a second run writes nothing', () => {
    const d = mk('cards');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'server.json'), SERVER_JSON);
    expect(run(d, ['server-card', '--generated', STAMP]).status).toBe(0);
    const server = read(join(d, 'server.json'));

    const first = run(d, ['cards']);
    expect(first.status).toBe(0);
    expect(lines(first.err)).toEqual([`✓ ${join(d, 'server-card')}`, `✓ ${join(d, 'server.json')} (unchanged)`]);
    expect(read(join(d, 'server.json'))).toBe(server);
    const card = read(join(d, 'server-card'));
    expect(stampOf(card, j => j._meta['one.faf/context'].generated)).toBe(STAMP);

    const second = run(d, ['cards']);
    expect(second.status).toBe(0);
    expect(lines(second.err)).toEqual([`✓ ${join(d, 'server-card')} (unchanged)`, `✓ ${join(d, 'server.json')} (unchanged)`]);
    expect(read(join(d, 'server-card'))).toBe(card);
    expect(read(join(d, 'server.json'))).toBe(server);
  });

  test('faf cards --target a2a twice: the A2A card keeps its stamp, and the second run writes nothing', () => {
    const d = mk('a2a');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(
      join(d, 'agent.fafa'),
      'agent:\n  name: demo-agent\n  displayName: Demo\n  vendor: Example\n  version: "0.1.0"\n  description: A demo agent.\n  homepage: https://example.com/agent\n' +
        'capabilities:\n  - name: ask\n    description: Answer a question.\nendpoints:\n  - protocol: a2a\n    location: https://example.com/a2a\n    version: "1.0"\n',
    );
    const out = join(d, '.well-known', 'agent-card.json');
    expect(run(d, ['cards', '--target', 'a2a']).status).toBe(0);
    const card = read(out);
    const second = run(d, ['cards', '--target', 'a2a']);
    expect(second.status).toBe(0);
    expect(lines(second.err)).toEqual([`✓ ${out} (unchanged)`]);
    expect(read(out)).toBe(card);
  });
});

// ── 5: faf hooks install then uninstall ────────────────────────────────────────

describe('BRAKE R6-5: faf hooks --install then --uninstall leaves your hook byte for byte', () => {
  const repo = (): { d: string; home: string; hook: string } => {
    const d = mk('hk');
    const home = mk('hkhome');
    execFileSync('git', ['init', '-q'], { cwd: d, env: { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' }, stdio: 'pipe' });
    return { d, home, hook: join(d, '.git', 'hooks', 'pre-commit') };
  };
  const cases: Array<[string, string]> = [
    ['LF lines', '#!/bin/sh\n# my own hook line\necho mine\n'],
    ['CRLF lines', '#!/bin/sh\r\n# my own hook line\r\necho mine\r\n'],
    ['your own blank line at the end', '#!/bin/sh\necho mine\n\n'],
  ];
  for (const [name, body] of cases) {
    test(`${name}: install, install again, uninstall → the hook as you wrote it`, () => {
      const { d, home, hook } = repo();
      writeFileSync(hook, body);
      chmodSync(hook, 0o755);
      expect(run(d, ['hooks', '--install'], { HOME: home }).status).toBe(0);
      expect(read(hook)).toContain('# >>> faf >>>');
      expect(run(d, ['hooks', '--install'], { HOME: home }).status).toBe(0); // updates faf's section in place
      const u = run(d, ['hooks', '--uninstall'], { HOME: home });
      expect(u.status).toBe(0);
      expect(read(hook)).toBe(body);
    });
  }

  test('a hook whose last line has no line end keeps the one install added — and nothing else', () => {
    const { d, home, hook } = repo();
    writeFileSync(hook, '#!/bin/sh\necho mine');
    chmodSync(hook, 0o755);
    expect(run(d, ['hooks', '--install'], { HOME: home }).status).toBe(0);
    expect(run(d, ['hooks', '--uninstall'], { HOME: home }).status).toBe(0);
    expect(read(hook)).toBe('#!/bin/sh\necho mine\n');
  });
});

// ── 6: faf check on a BOM file ─────────────────────────────────────────────────

describe('BRAKE R6-6: faf check reads a project.faf that starts with a BOM, as faf score does', () => {
  test('valid, exit 0, the file byte for byte', () => {
    const d = mk('chk');
    const p = join(d, 'project.faf');
    const text = '\uFEFFfaf_version: 2.5.0\nproject:\n  name: m\n  goal: A tool\nstack:\n  frontend: React\n';
    writeFileSync(p, text);
    const r = run(d, ['check']);
    expect(r.status).toBe(0);
    expect(lines(r.out)[0]).toBe(`valid ${p}`);
    expect(read(p)).toBe(text);
  });
});

// ── 7: faf decompile --output ──────────────────────────────────────────────────

describe('BRAKE R6-7: faf decompile --output writes the file, by the render-hash rule', () => {
  const setup = (): { d: string; fafb: string; out: string } => {
    const d = mk('dec');
    writeFileSync(join(d, 'project.faf'), 'project:\n  name: dec\n  goal: A tool\n  main_language: Go\n');
    expect(run(d, ['compile']).status).toBe(0);
    return { d, fafb: join(d, 'project.fafb'), out: join(d, 'out.json') };
  };

  test('writes the JSON with faf\'s render hash, prints one line, and a second run changes nothing', () => {
    const { d, fafb, out } = setup();
    // Without --output the JSON still goes to stdout, and no file is written.
    const plain = run(d, ['decompile', fafb]);
    expect(plain.status).toBe(0);
    expect(JSON.parse(plain.out).sections.length).toBeGreaterThan(0);
    expect(existsSync(out)).toBe(false);
    const r = run(d, ['decompile', fafb, '--output', out]);
    expect(r.status).toBe(0);
    expect(lines(r.out)).toEqual([`decompiled ${out}`]);
    const text = read(out);
    const j = JSON.parse(text);
    expect(j.sections.length).toBeGreaterThan(0);
    expect(j._meta['one.faf/render']).toMatch(/^sha256:[0-9a-f]{64}$/);
    const again = run(d, ['decompile', fafb, '--output', out]);
    expect(again.status).toBe(0);
    expect(lines(again.out)).toEqual([`decompiled ${out} (unchanged)`]);
    expect(read(out)).toBe(text);
  });

  test('a file faf did not write is refused in one line and left byte for byte; --force replaces it', () => {
    const { d, fafb, out } = setup();
    writeFileSync(out, '{"mine": true}\n');
    const r = run(d, ['decompile', fafb, '--output', out]);
    expect(r.status).toBe(1);
    expect(printed(r)).toEqual([
      `faf: ${out} has no faf render hash (\`_meta["one.faf/render"]\`), so faf did not write it — faf left it unchanged. Use --force to replace it.`,
    ]);
    expect(read(out)).toBe('{"mine": true}\n');
    expect(run(d, ['decompile', fafb, '--output', out, '--force']).status).toBe(0);
    expect(JSON.parse(read(out)).sections.length).toBeGreaterThan(0);
  });

  test('faf\'s own output, edited since, is refused in one line and left byte for byte', () => {
    const { d, fafb, out } = setup();
    expect(run(d, ['decompile', fafb, '--output', out]).status).toBe(0);
    const edited = read(out).replace('{\n', '{\n  "note": "HAND-NOTE",\n');
    writeFileSync(out, edited);
    const r = run(d, ['decompile', fafb, '--output', out]);
    expect(r.status).toBe(1);
    expect(printed(r)).toEqual([`faf: ${out} was edited since faf wrote it — faf left it unchanged. Use --force to replace it.`]);
    expect(read(out)).toBe(edited);
  });

  test('the output never goes over the .fafb being read — not even with --force', () => {
    const { d, fafb } = setup();
    const before = bytes(fafb);
    const r = run(d, ['decompile', fafb, '--output', fafb, '--force']);
    expect(r.status).toBe(1);
    expect(printed(r)).toEqual([
      `faf: ${fafb} is the file being decompiled — faf does not write the JSON over it, and left it unchanged. Name another output with --output.`,
    ]);
    expect(bytes(fafb).equals(before)).toBe(true);
  });
});

// ── copy: the help, the TAF workflow, the README and the docs it links ────────

describe('AERO R6-copy: what faf and faf auto do, in the words users read', () => {
  test('faf auto --help and faf --help: "Fill every tech slot from the repo, then score"', () => {
    const d = mk('help');
    for (const args of [['auto', '--help'], ['--help']]) {
      const r = run(d, args);
      expect(r.status).toBe(0);
      expect(r.out).toContain('Fill every tech slot from the repo, then score');
      expect(r.out).not.toContain('Zero to 100%');
    }
  });

  test('the workflow faf taf setup writes is headed "Written by", with no banned word', () => {
    const r = run(mk('taf'), ['taf', 'setup']);
    expect(r.status).toBe(0);
    expect(r.out).toContain('# Written by `faf taf setup`.');
    expect(r.out).not.toMatch(/generat/i);
  });

  test('the README and the agent guides it links: bare faf shows the score; the auto examples run faf auto; the hero badge is ✪', () => {
    const readme = read(join(ROOT, 'README.md'));
    expect(readme).toContain("> `faf` with no arguments shows your project's score; `faf auto` detects and fills.");
    expect(readme).not.toContain('shorthand for `faf-cli auto`');
    expect(readme).toContain('bunx faf-cli auto              # Fill every tech slot from the repo, then score');
    expect(readme).toContain('https://img.shields.io/badge/FAF-%E2%9C%AA%20100%25-000000?labelColor=FF6B35');
    expect(readme).not.toContain('FAF-%F0%9F%8F%86%20100%25');
    for (const doc of ['faf-cli-for-agents.md', 'faf-cli-for-bun.md', 'faf-cli-for-claude.md']) {
      const text = read(join(ROOT, 'docs', doc));
      expect({ doc, bare: /^bunx faf {2,}#/m.test(text) || text.includes('(`bunx faf`)') || text.includes('run `bunx faf` once') || text.includes('`bunx faf` once,') }).toEqual({ doc, bare: false });
      expect(text).toContain('bunx faf auto                # auto-detect the stack, write project.faf, score it');
    }
    expect(read(join(ROOT, 'project.faf'))).not.toContain('faf surface --sync');
  });
});
