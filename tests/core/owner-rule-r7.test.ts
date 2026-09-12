/**
 * BRAKE: the owner rule, round 7 (R7) — the release notes' one-line claims,
 * true at every edge:
 *
 *   1  a project.faf that is a scalar or a list: `faf score`, `status`,
 *      `score --json`, `compile`, `refresh`, `check` and `sync --direction
 *      pull` scored it 0%, compiled it into a .fafb, wrote a .faf-dna, or
 *      called it invalid in two lines (exit 3). They refuse it in one line,
 *      exit 1, and create no file.
 *   2  `faf sync --direction pull` handed a project.faf that is not valid
 *      YAML to the scoring kernel: under Node an UnhandledPromiseRejection.
 *      It reads the file first; a kernel rejection is one line.
 *   3  an --output (or --out) folder that is not there: a stack trace from
 *      `faf compile`, `decompile`, `taf`, `init`, `server-card` and `git`.
 *      It is one line: "<folder> does not exist — nothing written".
 *   4  a kernel rejection in `faf auto`, `sync`, `export --html`, `show`,
 *      `taf`, `loop`, `go`, `bench` and `decompile` was a stack trace. It is
 *      one line, and the commands that edit project.faf ask the kernel
 *      before they write, so nothing is written.
 *   5  `updateFafFile` on a scalar or a list called `mutate` (which threw
 *      yaml's error, or wrote nothing and said so); it throws the not-yaml
 *      SafePathError before `mutate` is called.
 *   6  `faf hooks` on a blank hook: uninstall left the `#!/bin/sh` line
 *      install wrote. Install then uninstall is byte for byte.
 *
 * Every CLI run here gets a HOME and a TMPDIR of its own (mkdtemp), and every
 * folder is removed when the suite ends.
 */
import { afterAll, beforeAll, describe, test, expect } from 'bun:test';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { SafePathError } from '../../src/core/safe-write.js';
import { updateFafFile } from '../../src/interop/faf.js';

const ROOT = join(import.meta.dir, '../..');
const CLI = join(ROOT, 'src/cli.ts');
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-r7-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

interface Run { status: number | null; out: string; err: string }
/** A clean environment: HOME and TMPDIR of the run's own, no tri-sync, no API key. */
function env(extra: Record<string, string> = {}): Record<string, string> {
  const e: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {if (v !== undefined) {e[k] = v;}}
  for (const k of ['FAF_PRO', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'CLAUDE_CONFIG_DIR']) {delete e[k];}
  return { ...e, HOME: mk('home'), TMPDIR: mk('tmp'), NO_COLOR: '1', CI: '1', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', ...extra };
}
/** The CLI from source, under bun. */
function run(cwd: string, args: string[], extra: Record<string, string> = {}): Run {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: env(extra), stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

const hasNode = spawnSync('node', ['--version'], { encoding: 'utf-8' }).status === 0;
let NODE_CLI = '';
/** The CLI built for Node (as `npm run build` builds dist/cli.js), run with node. */
function runNode(cwd: string, args: string[]): Run {
  const r = spawnSync('node', [NODE_CLI, ...args], { cwd, encoding: 'utf-8', env: env(), stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
beforeAll(() => {
  if (!hasNode) {return;}
  const out = mk('nodecli');
  const b = spawnSync(process.execPath, ['build', CLI, '--outdir', out, '--target=node', '--external', 'faf-scoring-kernel', '--external', 'open'], { encoding: 'utf-8' });
  expect(b.status).toBe(0);
  writeFileSync(join(out, 'package.json'), '{"type":"module"}\n');
  symlinkSync(join(ROOT, 'node_modules'), join(out, 'node_modules'));
  NODE_CLI = join(out, 'cli.js');
});
const runners: Array<[string, (cwd: string, args: string[]) => Run]> = [['bun', run], ['node', runNode]];
const testFor = (name: string) => (name === 'node' ? test.skipIf(!hasNode) : test);

const lines = (s: string): string[] => s.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '')).filter(l => l.trim() !== '');
/** Every line a run printed, stdout then stderr — without `faf taf`'s deprecation note. */
const printed = (r: Run): string[] => [...lines(r.out), ...lines(r.err)].filter(l => !l.startsWith('note: `faf taf`'));
const hasStack = (r: Run): boolean => /^\s+at |node:internal|UnhandledPromise|^error: |^\d+ \| /m.test(r.out + r.err);
const read = (p: string): string => readFileSync(p, 'utf-8');
/** Every path under `d` (not .git), sorted — to see that a run created nothing. */
function tree(d: string): string[] {
  const out: string[] = [];
  const walk = (rel: string): void => {
    for (const e of readdirSync(join(d, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (r === '.git') {continue;}
      out.push(r);
      if (e.isDirectory()) {walk(r);}
    }
  };
  walk('');
  return out.sort();
}

const shapeLine = (p: string, shape: string): string =>
  `faf: ${p}: a .faf must be a YAML mapping (key: value pairs), but this one is ${shape}. faf left it unchanged — fix it by hand.`;
const SHAPES: Array<[string, string, string]> = [
  ['scalar', 'just a string\n', 'a string ("just a string")'],
  ['list', '- one\n- two\n', 'a list (2 items)'],
];

// ── 1: a scalar or a list project.faf ──────────────────────────────────────────

describe('BRAKE R7-1: score, status, score --json, compile, refresh, check and sync --direction pull refuse a scalar or a list in one line', () => {
  const COMMANDS = [['score'], ['status'], ['score', '--json'], ['compile'], ['refresh'], ['check'], ['sync', '--direction', 'pull']];
  for (const [name, runner] of runners) {
    testFor(name)(`${name}: exit 1, exactly the shape line, the file byte for byte, no project.fafb, no .faf-dna, no file at all`, () => {
      for (const [shape, text, desc] of SHAPES) {
        for (const args of COMMANDS) {
          const d = mk(shape);
          const p = join(d, 'project.faf');
          writeFileSync(p, text);
          writeFileSync(join(d, 'CLAUDE.md'), '# Hand\n\nHand line.\n');
          const before = tree(d);
          const r = runner(d, args);
          expect({ shape, args, status: r.status }).toEqual({ shape, args, status: 1 });
          expect({ shape, args, printed: printed(r) }).toEqual({ shape, args, printed: [shapeLine(p, desc)] });
          expect(read(p)).toBe(text);
          expect(read(join(d, 'CLAUDE.md'))).toBe('# Hand\n\nHand line.\n');
          expect({ shape, args, files: tree(d) }).toEqual({ shape, args, files: before });
        }
      }
    });
  }

  test('faf check: a scalar is the one-line refusal (exit 1); a mapping without faf_version is still check\'s own verdict (exit 3)', () => {
    const d = mk('check');
    const p = join(d, 'project.faf');
    writeFileSync(p, 'just a string\n');
    const shaped = run(d, ['check']);
    expect(shaped.status).toBe(1);
    expect(printed(shaped)).toEqual([shapeLine(p, 'a string ("just a string")')]);
    writeFileSync(p, 'project:\n  name: m\n');
    const invalid = run(d, ['check']);
    expect(invalid.status).toBe(3);
    expect(printed(invalid)).toEqual([`invalid ${p}`, '  x Missing required field: faf_version']);
  });
});

// ── 2: faf sync --direction pull on invalid YAML ───────────────────────────────

describe('BRAKE R7-2: faf sync --direction pull reads project.faf before the kernel sees it', () => {
  const DUP = 'faf_version: 2.5.0\nproject:\n  name: m\n  goal: g\nstack:\n  frontend: None\n  frontend: React\n';
  const BAD = 'faf_version: 2.5.0\nproject:\n  name: "unterminated\n  goal: g\n';
  const BIG = 'faf_version: 2.5.0\nproject:\n  name: m\n  goal: g\n  build_id: 123456789012345678901234567890\n';
  for (const [name, runner] of runners) {
    testFor(name)(`${name}: a repeated key, an unclosed quote and a 30-digit integer — one line, exit 1, nothing written`, () => {
      const cases: Array<[string, string, (p: string, line: string) => boolean]> = [
        ['dup', DUP, (p, l) => l === `faf: ${p} is not valid YAML (Map keys must be unique, line 7) — faf left it unchanged`],
        ['bad', BAD, (p, l) => l.startsWith(`faf: ${p} is not valid YAML (`) && l.endsWith(') — faf left it unchanged')],
        ['big', BIG, (p, l) => l.startsWith(`faf: ${p}: faf's scoring kernel could not read it (`) && l.includes('123456789012345678901234567890') && l.endsWith(') — faf left it unchanged')],
      ];
      for (const [tag, text, ok] of cases) {
        const d = mk(tag);
        const p = join(d, 'project.faf');
        writeFileSync(p, text);
        writeFileSync(join(d, 'CLAUDE.md'), '# Hand\n');
        const before = tree(d);
        const r = runner(d, ['sync', '--direction', 'pull']);
        expect({ tag, status: r.status, stack: hasStack(r) }).toEqual({ tag, status: 1, stack: false });
        const got = printed(r);
        expect({ tag, count: got.length }).toEqual({ tag, count: 1 });
        expect({ tag, line: got[0], ok: ok(p, got[0]) }).toEqual({ tag, line: got[0], ok: true });
        expect(read(p)).toBe(text);
        expect(tree(d)).toEqual(before);
      }
    });
  }
});

// ── 3: an --output folder that is not there ────────────────────────────────────

describe('BRAKE R7-3: an --output folder that is not there is one line — "<folder> does not exist — nothing written"', () => {
  const FAF = 'faf_version: 2.5.0\nproject:\n  name: demo\n  goal: A demo tool\n  main_language: TypeScript\n';
  const SERVER = '{\n  "name": "io.github.example/demo",\n  "description": "Hand",\n  "version": "1.0.0"\n}\n';
  const project = (): string => {
    const d = mk('out');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'server.json'), SERVER);
    writeFileSync(join(d, 'afile'), 'mine\n');
    expect(run(d, ['compile']).status).toBe(0);
    return d;
  };

  for (const [name, runner] of runners) {
    testFor(name)(`${name}: faf compile, decompile and taf — exit 1, one line, nothing created; a file in the way is "not a folder"`, () => {
      const d = project();
      const cases: Array<[string[], string]> = [
        [['compile', '--output', 'nodir/x.fafb'], `faf: ${join(d, 'nodir')} does not exist — nothing written`],
        [['compile', '--output', 'nodir/deeper/x.fafb'], `faf: ${join(d, 'nodir', 'deeper')} does not exist — nothing written`],
        [['compile', '--output', 'afile/x.fafb'], `faf: ${join(d, 'afile')} is not a folder — nothing written`],
        [['decompile', 'project.fafb', '--output', 'nodir/x.json'], `faf: ${join(d, 'nodir')} does not exist — nothing written`],
        [['decompile', 'project.fafb', '--output', 'afile/x.json'], `faf: ${join(d, 'afile')} is not a folder — nothing written`],
        [['taf', '--output', 'nodir/x.json'], `faf: ${join(d, 'nodir')} does not exist — nothing written`],
        [['taf', '--output', 'afile/x.json'], `faf: ${join(d, 'afile')} is not a folder — nothing written`],
      ];
      for (const [args, line] of cases) {
        const before = tree(d);
        const r = runner(d, args);
        expect({ args, status: r.status }).toEqual({ args, status: 1 });
        expect({ args, printed: printed(r) }).toEqual({ args, printed: [line] });
        expect({ args, files: tree(d) }).toEqual({ args, files: before });
      }
      expect(read(join(d, 'afile'))).toBe('mine\n');
      // faf export --output still makes its folder, as documented.
      const e = runner(d, ['export', '--agents', '--output', 'newdir']);
      expect(e.status).toBe(0);
      expect(existsSync(join(d, 'newdir', 'AGENTS.md'))).toBe(true);
    });
  }

  test('faf init --output, faf server-card --out and faf git --output (before any clone) — the same one line', () => {
    const d = project();
    const fresh = mk('init');
    writeFileSync(join(fresh, 'package.json'), '{"name":"demo","version":"1.0.0"}\n');
    const cases: Array<[string, string[], string]> = [
      [fresh, ['init', '--output', 'nodir/x.faf'], `faf: ${join(fresh, 'nodir')} does not exist — nothing written`],
      [d, ['server-card', '--out', 'nodir/x.json'], `faf: ${join(d, 'nodir')} does not exist — nothing written`],
      [fresh, ['git', 'https://this-host-does-not-exist.invalid/never/ever', '--output', 'nodir/x.faf'], `faf: ${join(fresh, 'nodir')} does not exist — nothing written`],
    ];
    for (const [cwd, args, line] of cases) {
      const before = tree(cwd);
      const r = run(cwd, args);
      expect({ args, status: r.status }).toEqual({ args, status: 1 });
      expect({ args, printed: printed(r) }).toEqual({ args, printed: [line] });
      expect({ args, files: tree(cwd) }).toEqual({ args, files: before });
    }
    expect(read(join(d, 'server.json'))).toBe(SERVER);
  });
});

// ── 4: a kernel rejection is one line in every command ─────────────────────────

describe('BRAKE R7-4: a kernel rejection is one line in every command — and faf auto, go and loop write nothing', () => {
  const BIG = 'faf_version: 2.5.0\nproject:\n  name: m\n  goal: g\n  main_language: TypeScript\n  build_id: 123456789012345678901234567890\n';
  const kernelLine = (p: string, l: string): boolean =>
    l.startsWith(`faf: ${p}: faf's scoring kernel could not read it (`) && l.endsWith(') — faf left it unchanged');

  for (const [name, runner] of runners) {
    testFor(name)(`${name}: auto, go, loop, show, taf, bench — exactly the kernel line; sync and export --html — the kernel line once, no stack; project.faf byte for byte`, () => {
      const only: string[][] = [['auto'], ['go'], ['loop'], ['show'], ['taf'], ['bench', 'questions']];
      const among: string[][] = [['sync'], ['export', '--html']];
      for (const args of [...only, ...among]) {
        const d = mk('big');
        const p = join(d, 'project.faf');
        writeFileSync(p, BIG);
        writeFileSync(join(d, 'package.json'), '{"name":"m","version":"1.0.0","description":"a tool"}\n');
        const r = runner(d, args);
        const got = printed(r);
        expect({ args, status: r.status, stack: hasStack(r) }).toEqual({ args, status: 1, stack: false });
        const hits = got.filter(l => kernelLine(p, l));
        expect({ args, hits: hits.length }).toEqual({ args, hits: 1 });
        if (only.includes(args)) {expect({ args, printed: got }).toEqual({ args, printed: hits });}
        expect(read(p)).toBe(BIG);
        expect(existsSync(join(d, 'project.html'))).toBe(false);
        expect(existsSync(join(d, '.faf-dna'))).toBe(false);
      }
    });

    testFor(name)(`${name}: faf decompile of a .fafb cut short — one line, exit 1`, () => {
      const d = mk('cut');
      const fafb = join(d, 'cut.fafb');
      writeFileSync(fafb, Buffer.concat([Buffer.from('FAFB'), Buffer.alloc(21, 1)]));
      const r = runner(d, ['decompile', fafb]);
      expect({ status: r.status, stack: hasStack(r) }).toEqual({ status: 1, stack: false });
      const got = printed(r);
      expect(got.length).toBe(1);
      expect(kernelLine(fafb, got[0])).toBe(true);
    });
  }
});

// ── 5: updateFafFile on a scalar or a list ─────────────────────────────────────

describe('BRAKE R7-5: updateFafFile refuses a scalar or a list before mutate is called', () => {
  test('SafePathError not-yaml with the shape line; mutate never runs; the file byte for byte (an empty file still takes the edit)', () => {
    const d = mk('lib');
    for (const [shape, text, desc] of SHAPES) {
      const p = join(d, `${shape}.faf`);
      writeFileSync(p, text);
      for (const mutate of [(): void => {}, (doc: { setIn: (path: string[], v: unknown) => void }): void => doc.setIn(['project', 'name'], 'x')]) {
        let called = false;
        let caught: unknown = null;
        try {
          updateFafFile(p, doc => {
            called = true;
            mutate(doc);
          });
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeInstanceOf(SafePathError);
        expect((caught as SafePathError).reason).toBe('not-yaml');
        expect((caught as SafePathError).message).toBe(shapeLine(p, desc).slice('faf: '.length));
        expect(called).toBe(false);
        expect(read(p)).toBe(text);
      }
    }
    const empty = join(d, 'empty.faf');
    writeFileSync(empty, '');
    expect(updateFafFile(empty, doc => doc.setIn(['project', 'name'], 'x')).written).toBe(true);
    expect(read(empty)).toBe('project:\n  name: x\n');
  });
});

// ── 6: faf hooks on a blank hook ───────────────────────────────────────────────

describe('BRAKE R7-6: faf hooks — install then uninstall leaves a blank hook byte for byte', () => {
  const repo = (): { d: string; home: string; hook: string } => {
    const d = mk('hk');
    const home = mk('hkhome');
    execFileSync('git', ['init', '-q'], { cwd: d, env: { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' }, stdio: 'pipe' });
    return { d, home, hook: join(d, '.git', 'hooks', 'pre-commit') };
  };
  const cycle = (d: string, home: string, installs: number): void => {
    for (let i = 0; i < installs; i++) {expect(run(d, ['hooks', '--install'], { HOME: home }).status).toBe(0);}
    expect(run(d, ['hooks', '--uninstall'], { HOME: home }).status).toBe(0);
  };

  test('an empty hook, blank lines, a CRLF blank line: install, install again, uninstall → byte for byte; your own #!/bin/sh stays', () => {
    const cases: Array<[string, string]> = [
      ['empty', ''],
      ['blank lines', '\n\n'],
      ['a CRLF blank line', '\r\n'],
      ['spaces', '  \n'],
      ['your own #!/bin/sh', '#!/bin/sh\n'],
      ['your own lines', '#!/bin/sh\necho mine\n'],
    ];
    for (const [name, body] of cases) {
      const { d, home, hook } = repo();
      writeFileSync(hook, body);
      chmodSync(hook, 0o755);
      cycle(d, home, 2);
      expect({ name, after: read(hook) }).toEqual({ name, after: body });
    }
  });

  test('the #!/bin/sh line stays when you wrote lines below faf\'s section; a hook faf created is left empty', () => {
    const { d, home, hook } = repo();
    writeFileSync(hook, '');
    chmodSync(hook, 0o755);
    expect(run(d, ['hooks', '--install'], { HOME: home }).status).toBe(0);
    writeFileSync(hook, `${read(hook)}echo later\n`);
    expect(run(d, ['hooks', '--uninstall'], { HOME: home }).status).toBe(0);
    expect(read(hook)).toBe('#!/bin/sh\necho later\n');

    const fresh = repo();
    expect(existsSync(fresh.hook)).toBe(false);
    cycle(fresh.d, fresh.home, 1);
    expect(read(fresh.hook)).toBe('');
  });
});
