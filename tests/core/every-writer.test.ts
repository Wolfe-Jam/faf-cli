/**
 * BRAKE: every writer, no exceptions — the 7.13 re-check's blocker (round 3,
 * R3a.1). After round 2 a set of writers still called writeFileSync /
 * appendFileSync / mkdirSync / unlinkSync / rmSync on a joined path, so the
 * link rules and the atomic write never ran for them:
 *
 *   X02 `faf server-card` read and rewrote server.json → ~/secret.json;
 *   X03/X04 `faf refresh` / `faf compile` wrote the .fafb into ~/.zshrc through
 *   project.fafb; X05 compile created ~/.zshenv at the end of a dangling link;
 *   X06 `faf taf setup --write` created ~/evil/x.yml through a dangling taf.yml;
 *   X07 `faf diff --install-driver` appended to ~/.zshrc through .gitattributes;
 *   the go session, the bench state, `faf clear`, and `faf hooks` (which also
 *   took substring markers for its section and replaced whatever sat between).
 *
 * Now each goes through src/core/safe-write.ts with the right root, and the
 * file outside stays byte for byte. HOME is a mkdtemp folder for every CLI run.
 */
import { describe, test, expect, spyOn } from 'bun:test';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import * as sw from '../../src/core/safe-write.js';
import { SafePathError } from '../../src/core/safe-write.js';
import { installHooks, uninstallHooks } from '../../src/commands/hooks.js';
import { SLOTS } from '../../src/core/slots.js';
import { serializeFaf } from '../../src/interop/faf.js';

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const mk = (tag: string): string => realpathSync(mkdtempSync(join(tmpdir(), `faf-r3a-${tag}-`)));
const ZSHRC = '# my shell\nexport PATH="$HOME/bin:$PATH"\nsource ~/.secrets\n';
const FAF = 'project:\n  name: demo\n  goal: Demo goal\n  main_language: TypeScript\n';

function run(cwd: string, args: string[], opts: { env?: Record<string, string>; input?: string } = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    input: opts.input,
    env: { ...process.env, HOME: mk('home'), NO_COLOR: '1', CI: '1', ...opts.env },
  });
}
const errLines = (r: { stderr: string }): string[] => r.stderr.trim().split('\n');
const git = (dir: string, ...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', encoding: 'utf-8' });
function repo(tag: string): string {
  const d = mk(tag);
  git(d, 'init', '-q');
  return d;
}

function refusal(fn: () => unknown): SafePathError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SafePathError) {return e;}
    throw e;
  }
  throw new Error('expected a SafePathError');
}

describe('BRAKE: the writers that bypassed safe-write now refuse a link out (X02-X07)', () => {
  test.skipIf(!posix)('X02 faf server-card: server.json → ~/secret.json is refused before it is read', () => {
    const d = mk('sc');
    const home = mk('home');
    const secret = '{"name":"x","token":"HAND-SECRET"}\n';
    writeFileSync(join(home, 'secret.json'), secret);
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(home, 'secret.json'), join(d, 'server.json'));
    const r = run(d, ['server-card']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toEqual([
      `faf: ${join(d, 'server.json')} is a link to ${join(home, 'secret.json')}, outside ${d} — refused. Nothing was read from or written to it.`,
    ]);
    expect(readFileSync(join(home, 'secret.json'), 'utf-8')).toBe(secret);
  });

  test.skipIf(!posix)('X03 faf refresh: project.fafb → ~/.zshrc is left, the re-ground carries on', () => {
    const d = mk('fb');
    const home = mk('home');
    writeFileSync(join(home, '.zshrc'), ZSHRC);
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(home, '.zshrc'), join(d, 'project.fafb'));
    const r = run(d, ['refresh']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('.fafb left as it is');
    expect(r.stdout).toContain(`${join(d, 'project.fafb')} is a link to ${join(home, '.zshrc')}, outside ${d} — refused.`);
    expect(readFileSync(join(home, '.zshrc'), 'utf-8')).toBe(ZSHRC);
  });

  test.skipIf(!posix)('X04 faf compile: project.fafb → ~/.zshrc is refused in one line', () => {
    const d = mk('fb');
    const home = mk('home');
    writeFileSync(join(home, '.zshrc'), ZSHRC);
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(home, '.zshrc'), join(d, 'project.fafb'));
    const r = run(d, ['compile']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toHaveLength(1);
    expect(r.stderr).toContain('outside');
    expect(readFileSync(join(home, '.zshrc'), 'utf-8')).toBe(ZSHRC);
  });

  test.skipIf(!posix)('X05 faf compile: a dangling project.fafb → ~/.zshenv creates nothing', () => {
    const d = mk('fb');
    const home = mk('home');
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(home, '.zshenv'), join(d, 'project.fafb'));
    const r = run(d, ['compile']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('does not exist');
    expect(existsSync(join(home, '.zshenv'))).toBe(false);
  });

  test.skipIf(!posix)('X06 faf taf setup --write: a dangling taf.yml, or a .github linked out, creates nothing outside', () => {
    const d = repo('taf');
    const home = mk('home');
    mkdirSync(join(home, 'evil'));
    mkdirSync(join(d, '.github', 'workflows'), { recursive: true });
    symlinkSync(join(home, 'evil', 'x.yml'), join(d, '.github', 'workflows', 'taf.yml'));
    const r = run(d, ['taf', 'setup', '--write']);
    expect(r.status).toBe(1);
    expect(existsSync(join(home, 'evil', 'x.yml'))).toBe(false);

    const e = repo('taf');
    const out = mk('out');
    symlinkSync(out, join(e, '.github'));
    const r2 = run(e, ['taf', 'setup', '--write']);
    expect(r2.status).toBe(1);
    expect(errLines(r2)).toHaveLength(1);
    expect(readdirSync(out)).toEqual([]); // no workflows/ folder made through the link
  });

  test.skipIf(!posix)('X07 faf diff --install-driver: .gitattributes → ~/.zshrc is refused, the rc byte for byte', () => {
    const d = repo('drv');
    const home = mk('home');
    writeFileSync(join(home, '.zshrc'), ZSHRC);
    writeFileSync(join(d, 'project.faf'), FAF);
    symlinkSync(join(home, '.zshrc'), join(d, '.gitattributes'));
    const r = run(d, ['diff', '--install-driver']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toEqual([
      `faf: ${join(d, '.gitattributes')} is a link to ${join(home, '.zshrc')}, outside ${d} — refused. Nothing was read from or written to it.`,
    ]);
    expect(readFileSync(join(home, '.zshrc'), 'utf-8')).toBe(ZSHRC);
  });

  test('faf diff --install-driver keeps every byte of .gitattributes and adds its line in the file\'s own line ending', () => {
    const d = repo('drv');
    const before = '* text=auto\r\n*.png binary';
    writeFileSync(join(d, '.gitattributes'), before);
    const r = run(d, ['diff', '--install-driver']);
    expect(r.status).toBe(0);
    expect(readFileSync(join(d, '.gitattributes'), 'utf-8')).toBe(`${before}\r\n*.faf diff=faf\r\n`);
  });
});

describe('BRAKE: a whole file faf renders replaces only a file it wrote (.fafb, taf --output)', () => {
  test('faf compile refuses a project.fafb that is not a .fafb faf compiled; --force replaces it', () => {
    const d = mk('fb');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'project.fafb'), 'HAND-NOTES not a binary\n');
    const r = run(d, ['compile']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toEqual([
      `faf: ${join(d, 'project.fafb')} has no FAFB header (a .fafb faf compiled), so faf did not write it — faf left it unchanged. Use --force to replace it.`,
    ]);
    expect(readFileSync(join(d, 'project.fafb'), 'utf-8')).toBe('HAND-NOTES not a binary\n');
    expect(run(d, ['compile', '--force']).status).toBe(0);
    expect(readFileSync(join(d, 'project.fafb')).subarray(0, 4).toString()).toBe('FAFB');
    // …and a .fafb faf compiled is replaced with no flag.
    writeFileSync(join(d, 'project.faf'), `${FAF}  type: cli\n`);
    expect(run(d, ['compile']).status).toBe(0);
  });

  test('faf refresh leaves a project.fafb faf did not compile, byte for byte', () => {
    const d = mk('fb');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'project.fafb'), 'HAND-NOTES\n');
    const r = run(d, ['refresh', '--json']);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.fafb.reCompiled).toBe(false);
    expect(out.fafb.left).toContain('has no FAFB header');
    expect(readFileSync(join(d, 'project.fafb'), 'utf-8')).toBe('HAND-NOTES\n');
  });

  test('faf taf --output refuses a file that is not a TAF snapshot; --force replaces it', () => {
    const d = mk('taf');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'notes.json'), '{"mine": "HAND"}\n');
    const r = run(d, ['taf', '--output', 'notes.json']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('has no TAF snapshot (`taf_version`), so faf did not write it — faf left it unchanged. Use --force to replace it.');
    expect(readFileSync(join(d, 'notes.json'), 'utf-8')).toBe('{"mine": "HAND"}\n');
    expect(run(d, ['taf', '--output', 'notes.json', '--force']).status).toBe(0);
    expect(JSON.parse(readFileSync(join(d, 'notes.json'), 'utf-8')).taf_version).toBe('1.0.0');
    expect(run(d, ['taf', '--output', 'notes.json']).status).toBe(0); // faf's own snapshot: no flag needed
  });
});

describe('BRAKE: faf\'s own state files — the go session, the bench state, faf clear', () => {
  const EMPTY = 'project:\n  name: demo\n';

  test('faf go: quit keeps the session for --resume (it used to be deleted at once), and never over a file faf did not write', () => {
    const d = mk('go');
    writeFileSync(join(d, 'project.faf'), EMPTY);
    const r = run(d, ['go'], { input: 'quit\n' });
    expect(r.status).toBe(0);
    const session = JSON.parse(readFileSync(join(d, '.faf-session.json'), 'utf-8'));
    expect(session.slotIndex).toBe(0);

    const e = mk('go');
    writeFileSync(join(e, 'project.faf'), EMPTY);
    writeFileSync(join(e, '.faf-session.json'), '{"mine": "HAND-SESSION"}\n');
    const r2 = run(e, ['go'], { input: 'quit\n' });
    expect(r2.status).toBe(0);
    expect(r2.stderr).toContain('session not saved');
    expect(readFileSync(join(e, '.faf-session.json'), 'utf-8')).toBe('{"mine": "HAND-SESSION"}\n');
  });

  test('faf go: a finished interview removes only a session faf wrote', () => {
    // Every slot filled but one: one question, one answer, the interview is done.
    const oneLeft = (): string => {
      const data: Record<string, Record<string, string>> = {};
      for (const slot of SLOTS) {
        const [section, field] = slot.path.split('.');
        data[section] = { ...data[section], [field]: slot.path === 'human_context.how' ? '' : `v-${field}` };
      }
      return serializeFaf(data as never);
    };
    const d = mk('go');
    writeFileSync(join(d, 'project.faf'), oneLeft());
    writeFileSync(join(d, '.faf-session.json'), JSON.stringify({ slotIndex: 0, fafPath: join(d, 'project.faf') }));
    expect(run(d, ['go'], { input: 'skip\n' }).status).toBe(0);
    expect(existsSync(join(d, '.faf-session.json'))).toBe(false);

    const e = mk('go');
    writeFileSync(join(e, 'project.faf'), oneLeft());
    writeFileSync(join(e, '.faf-session.json'), '{"mine": "HAND-SESSION"}\n');
    expect(run(e, ['go'], { input: 'skip\n' }).status).toBe(0);
    expect(readFileSync(join(e, '.faf-session.json'), 'utf-8')).toBe('{"mine": "HAND-SESSION"}\n');
  });

  test('faf bench grade: a .faf-bench.json faf did not write is refused and kept', () => {
    const d = mk('bench');
    writeFileSync(join(d, 'project.faf'), `${FAF}stack:\n  frontend: React\n  hosting: Vercel\n`);
    writeFileSync(join(d, 'answers.json'), '{"1": "demo"}\n');
    writeFileSync(join(d, '.faf-bench.json'), '{ "my": "HAND-BENCH-NOTES" }\n');
    const r = run(d, ['bench', 'grade', 'answers.json', '--cold']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toHaveLength(1);
    expect(r.stderr).toContain('so faf did not write it — faf left it unchanged.');
    expect(readFileSync(join(d, '.faf-bench.json'), 'utf-8')).toBe('{ "my": "HAND-BENCH-NOTES" }\n');
    // Without one, the state is written — and graded again over faf's own.
    const e = mk('bench');
    writeFileSync(join(e, 'project.faf'), `${FAF}stack:\n  frontend: React\n  hosting: Vercel\n`);
    writeFileSync(join(e, 'answers.json'), '{"1": "demo"}\n');
    expect(run(e, ['bench', 'grade', 'answers.json', '--cold']).status).toBe(0);
    expect(run(e, ['bench', 'grade', 'answers.json', '--faf']).status).toBe(0);
    const state = JSON.parse(readFileSync(join(e, '.faf-bench.json'), 'utf-8'));
    expect(state.cold && state.faf).toBeTruthy();
  });

  test.skipIf(!posix)('faf clear removes faf\'s own faf-git-* folders, never a link of that name', () => {
    const tmp = mk('tmp');
    const target = mk('target');
    writeFileSync(join(target, 'keep.txt'), 'KEEP\n');
    mkdirSync(join(tmp, 'faf-git-old'));
    writeFileSync(join(tmp, 'faf-git-old', 'x'), 'x');
    symlinkSync(target, join(tmp, 'faf-git-link'));
    const r = run(mk('cwd'), ['clear'], { env: { TMPDIR: tmp } });
    expect(r.status).toBe(0);
    expect(existsSync(join(tmp, 'faf-git-old'))).toBe(false);
    expect(lstatSync(join(tmp, 'faf-git-link')).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(target, 'keep.txt'), 'utf-8')).toBe('KEEP\n');
  });
});

describe('BRAKE: faf hooks — only faf\'s own marked section, through safe-write\'s one git-hook allowance', () => {
  const RUNNER = `${process.execPath} ${CLI} hooks-run`;
  const hook = (d: string) => join(d, '.git', 'hooks', 'pre-commit');
  const quiet = <T>(fn: () => T): T => {
    const a = spyOn(console, 'log').mockImplementation(() => {});
    const b = spyOn(console, 'error').mockImplementation(() => {});
    try {
      return fn();
    } finally {
      a.mockRestore();
      b.mockRestore();
    }
  };

  test('a hook with a broken marker pair is refused and kept; a marker quoted mid-line is not a marker', () => {
    const d = repo('hk');
    const broken = '#!/bin/sh\n# >>> faf >>>\nmy-linter --fix\nexit 0\n';
    writeFileSync(hook(d), broken);
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER }))).toBe(false);
    expect(readFileSync(hook(d), 'utf-8')).toBe(broken);

    const e = repo('hk');
    const quoted = '#!/bin/sh\necho "# >>> faf >>> starts faf\'s block"\nUSER-LINE-BETWEEN\necho "# <<< faf <<< ends it"\n';
    writeFileSync(hook(e), quoted);
    expect(quiet(() => installHooks(e, { runnerCmd: RUNNER }))).toBe(true);
    const after = readFileSync(hook(e), 'utf-8');
    expect(after.startsWith(quoted)).toBe(true); // every user byte, then faf's section
    expect(after.match(/^# >>> faf >>>$/gm)).toHaveLength(1);
  });

  test('uninstall with two START lines is refused: the text between them is the user\'s', () => {
    const d = repo('hk');
    const two = '#!/bin/sh\n# >>> faf >>>\nUSER-LINE\n# >>> faf >>>\nfaf-cli hooks-run || true\n# <<< faf <<<\n';
    writeFileSync(hook(d), two);
    expect(quiet(() => uninstallHooks(d))).toBe(false);
    expect(readFileSync(hook(d), 'utf-8')).toBe(two);
  });

  test.skipIf(!posix)('a hooks folder linked outside the repo: a hook faf did not write is refused; faf\'s own is updated; a new one is created', () => {
    const d = repo('hk');
    const shared = mk('shared-hooks');
    execFileSync('rm', ['-rf', join(d, '.git', 'hooks')]);
    symlinkSync(shared, join(d, '.git', 'hooks'));
    const theirs = '#!/bin/sh\necho "shared hook for every repo"\n';
    writeFileSync(join(shared, 'pre-commit'), theirs);
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER }))).toBe(false);
    expect(readFileSync(join(shared, 'pre-commit'), 'utf-8')).toBe(theirs);

    // A new hook there is fine, and faf's own section is updated in place.
    execFileSync('rm', [join(shared, 'pre-commit')]);
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER }))).toBe(true);
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER, strict: true }))).toBe(true);
    const own = readFileSync(join(shared, 'pre-commit'), 'utf-8');
    expect(own).toContain('--strict || exit 1');
    expect(own.match(/^# >>> faf >>>$/gm)).toHaveLength(1);
    expect(lstatSync(join(d, '.git', 'hooks')).isSymbolicLink()).toBe(true);
  });

  test.skipIf(!posix)('a pre-commit that is a link out of the hooks folder is refused; the script it points at is kept', () => {
    const d = repo('hk');
    mkdirSync(join(d, 'scripts'));
    const script = '#!/bin/sh\nnpm test\n';
    writeFileSync(join(d, 'scripts', 'pre-commit'), script);
    symlinkSync(join(d, 'scripts', 'pre-commit'), hook(d));
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER }))).toBe(false);
    expect(readFileSync(join(d, 'scripts', 'pre-commit'), 'utf-8')).toBe(script);
  });

  test('a missing hooks folder is not created inside .git — refused in one line', () => {
    const d = repo('hk');
    execFileSync('rm', ['-rf', join(d, '.git', 'hooks')]);
    const errs: string[] = [];
    const b = spyOn(console, 'error').mockImplementation((s: string) => { errs.push(s); });
    const a = spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(installHooks(d, { runnerCmd: RUNNER })).toBe(false);
    } finally {
      a.mockRestore();
      b.mockRestore();
    }
    expect(errs.join('\n')).toContain('faf does not create folders inside .git');
    expect(existsSync(join(d, '.git', 'hooks'))).toBe(false);
  });

  test.skipIf(!posix)('a user hook keeps its mode (execute added only where read is), and no temp file is left', () => {
    const d = repo('hk');
    writeFileSync(hook(d), '#!/bin/sh\nexit 0\n');
    chmodSync(hook(d), 0o700);
    expect(quiet(() => installHooks(d, { runnerCmd: RUNNER }))).toBe(true);
    expect((statSync(hook(d)).mode & 0o777).toString(8)).toBe('700');
    const e = repo('hk');
    writeFileSync(hook(e), '#!/bin/sh\nexit 0\n');
    chmodSync(hook(e), 0o644);
    expect(quiet(() => installHooks(e, { runnerCmd: RUNNER }))).toBe(true);
    expect((statSync(hook(e)).mode & 0o777).toString(8)).toBe('755');
    expect(readdirSync(dirname(hook(e))).filter(n => n.endsWith('.faf-tmp'))).toEqual([]);
  });
});

describe('BRAKE: safe-write\'s new primitives (makeDirInside, safeUnlink, allowGitHooks)', () => {
  test.skipIf(!posix)('makeDirInside: makes the folders on the way; refuses a link out, a dangling link and .git', () => {
    const d = mk('md');
    const out = mk('out');
    expect(sw.makeDirInside(d, join('a', 'b'))).toBe(join(d, 'a', 'b'));
    expect(statSync(join(d, 'a', 'b')).isDirectory()).toBe(true);
    symlinkSync(out, join(d, 'linked'));
    expect(refusal(() => sw.makeDirInside(d, join('linked', 'workflows'))).reason).toBe('outside');
    expect(readdirSync(out)).toEqual([]);
    symlinkSync(join(out, 'nope'), join(d, 'dangling'));
    expect(refusal(() => sw.makeDirInside(d, join('dangling', 'x'))).reason).toBe('dangling');
    expect(refusal(() => sw.makeDirInside(d, join('.git', 'x'))).reason).toBe('git');
    mkdirSync(join(d, 'site'));
    symlinkSync('site', join(d, 'www'));
    expect(sw.makeDirInside(d, join('www', 'assets'))).toBe(join(d, 'site', 'assets')); // a link inside is followed
  });

  test.skipIf(!posix)('safeUnlink: removes only the bytes faf wrote, never a link, never a changed file', () => {
    const d = mk('rm');
    const f = join(d, 'state.json');
    writeFileSync(f, 'FAF\n');
    expect(refusal(() => sw.safeUnlink(f, { expect: 'OTHER\n' })).reason).toBe('changed');
    expect(existsSync(f)).toBe(true);
    symlinkSync(f, join(d, 'link.json'));
    expect(refusal(() => sw.safeUnlink(join(d, 'link.json'), { expect: 'FAF\n' })).reason).toBe('not-a-file');
    expect(lstatSync(join(d, 'link.json')).isSymbolicLink()).toBe(true);
    expect(sw.safeUnlink(f, { expect: 'FAF\n' })).toBe(true);
    expect(existsSync(f)).toBe(false);
    expect(sw.safeUnlink(f, { expect: 'FAF\n' })).toBe(false);
  });

  test('allowGitHooks: only a hook file directly in a hooks folder may sit in .git', () => {
    const d = repo('allow');
    const hooks = join(d, '.git', 'hooks');
    const config = readFileSync(join(d, '.git', 'config'));
    sw.safeWriteFile(join(hooks, 'pre-commit'), '#!/bin/sh\n', { root: hooks, allowGitHooks: true, expect: null });
    expect(readFileSync(join(hooks, 'pre-commit'), 'utf-8')).toBe('#!/bin/sh\n');
    // Without the allowance, the same write is refused.
    expect(refusal(() => sw.safeWriteFile(join(hooks, 'pre-commit'), 'x', { root: hooks })).reason).toBe('git');
    // .git/config is not in the hooks folder; .git itself is not a hooks folder; nothing nested.
    expect(refusal(() => sw.safeWriteFile(join(d, '.git', 'config'), 'x', { root: hooks, allowGitHooks: true })).reason).toBe('outside');
    expect(refusal(() => sw.safeWriteFile(join(d, '.git', 'config'), 'x', { root: join(d, '.git'), allowGitHooks: true })).reason).toBe('git');
    mkdirSync(join(hooks, 'sub'));
    expect(refusal(() => sw.safeWriteFile(join(hooks, 'sub', 'pre-commit'), 'x', { root: hooks, allowGitHooks: true })).reason).toBe('git');
    expect(readFileSync(join(d, '.git', 'config')).equals(config)).toBe(true);
  });
});

describe('BRAKE: the CLI says what faf did not do, in one line (K17, async commands)', () => {
  test.skipIf(!posix)('K17 faf auto: project.faf → config/team.faf is read, and its write refused — "Nothing was written to it."', () => {
    const d = mk('k17');
    writeFileSync(join(d, 'package.json'), '{"name":"demo","dependencies":{"react":"18"}}');
    mkdirSync(join(d, 'config'));
    const team = 'project:\n  name: demo\n  goal: Team goal # TEAM\n';
    writeFileSync(join(d, 'config', 'team.faf'), team);
    symlinkSync('config/team.faf', join(d, 'project.faf'));
    const r = run(d, ['auto']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toEqual([
      `faf: ${join(d, 'project.faf')} is a link to ${join(d, 'config', 'team.faf')}, a file with another name — refused (faf follows a link only to a file of the same name, or from one AI context file to another). Nothing was written to it.`,
    ]);
    expect(readFileSync(join(d, 'config', 'team.faf'), 'utf-8')).toBe(team);
  });

  test.skipIf(!posix)('a refusal inside an async command (faf go) is one line, not a stack trace', () => {
    const d = mk('async');
    const home = mk('home');
    writeFileSync(join(home, 'secret.faf'), 'project:\n  name: SECRET\n');
    symlinkSync(join(home, 'secret.faf'), join(d, 'project.faf'));
    const r = run(d, ['go']);
    expect(r.status).toBe(1);
    expect(errLines(r)).toEqual([
      `faf: ${join(d, 'project.faf')} is a link to ${join(home, 'secret.faf')}, outside ${d} — refused. Nothing was read from or written to it.`,
    ]);
  });
});
