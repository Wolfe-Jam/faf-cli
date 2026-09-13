/**
 * BRAKE: detection reads stay inside the project (7.13.1).
 *
 * Detection followed a link out of the project. A repo whose README.md,
 * package.json or pyproject.toml is a link to a file outside it had that
 * file's text read and written into project.faf (project.goal,
 * human_context.what, …), CLAUDE.md, AGENTS.md and the command output — and
 * with `faf git <url>` a hostile repo could point README.md at
 * ~/.aws/credentials. 7.13 protected the writers and the .faf/.fafm readers,
 * not detection.
 *
 * Now every detection read goes through repoFile (src/core/safe-write.ts): a
 * file whose real path leaves the project, runs through .git, or dangles is
 * absent to detection. A link inside the project is still followed. `faf git`
 * clones with core.symlinks=false, so a cloned repo's links arrive as plain
 * files holding the link's text.
 *
 * Each test puts a link to a mkdtemp "secret" file outside the project into
 * its fixture, and each fails on 7.13.0: the secret's text reaches the output.
 * Every folder is a mkdtemp folder; every CLI run gets a HOME and a TMPDIR of
 * its own.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { assembleFreshFaf, updateExistingFaf } from '../../src/detect/assemble.js';
import { authorFafFromRepo } from '../../src/detect/git-repo.js';
import { enrichFromRepo } from '../../src/detect/enrich.js';
import { relentlessContextDetailed } from '../../src/detect/relentless.js';
import { turboCatScan } from '../../src/detect/turbo-cat.js';
import { detectStack } from '../../src/detect/stack.js';
import { interrogateRepo } from '../../src/interrogate/index.js';
import { renderAgentsMd } from '../../src/interop/agents.js';
import { renderClaudeMd } from '../../src/interop/claude.js';
import { serializeFaf } from '../../src/interop/faf.js';
import { cloneArgs, dropLinkPlaceholders } from '../../src/commands/git.js';
import { detectSubdirStacks } from '../../src/detect/scanner.js';
import { readFafa } from '../../src/interop/cards.js';
import { SafePathError } from '../../src/core/safe-write.js';
import type { FafData } from '../../src/core/types.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const posix = process.platform !== 'win32';
const hasGit = spawnSync('git', ['--version'], { encoding: 'utf-8' }).status === 0;
const CLI = join(import.meta.dir, '../../src/cli.ts');
const mk = (tag: string): string => realpathSync(tempFolders.mkdtemp(join(tmpdir(), `faf-p1-${tag}-`)));

// ── The secret files, outside every project ─────────────────────────────────
// Each carries the canary, in the fields detection copies: README prose,
// package.json name / description / repository / dependencies. pyproject's
// text reaches the output only as what detection derives from it — its
// data-science dependency, its linter, its test runner — so those words are
// its canaries too. The paths themselves carry no canary: a link's text is
// not the secret.
const CANARY = 'canary-7f3a';
const README_SECRET =
  '# Credentials\n\n' +
  '[default] aws_secret_access_key = CANARY-7F3A-this-line-is-a-secret-kept-outside-the-project\n\n' +
  '## Why\n\nCANARY-7F3A: the text of a file outside the project must never be read.\n\n' +
  '## Audience\n\nBuilt for developers who keep CANARY-7F3A credentials here.\n\n' +
  '## Architecture\n\nCANARY-7F3A how-section text that is long enough to be picked up.\n';
const PKG_SECRET = `${JSON.stringify(
  {
    name: 'canary-7f3a-pkg',
    description: 'CANARY-7F3A description of a package.json kept outside the project',
    repository: 'https://example.com/canary-7f3a',
    type: 'module',
    scripts: { build: 'tsc', test: 'bun test', lint: 'eslint .' },
    dependencies: { 'canary-7f3a-dep': '1.0.0' },
    devDependencies: { typescript: '^5.0.0' },
  },
  null,
  2,
)}\n`;
const PY_SECRET =
  '[project]\nname = "canary-7f3a"\ndescription = "CANARY-7F3A pyproject kept outside the project"\n' +
  'dependencies = ["matplotlib"]\n\n[tool.ruff]\nline-length = 100\n\n[tool.pytest.ini_options]\naddopts = "-q"\n';
const CANARIES = [CANARY, 'matplotlib', 'ruff', 'pytest'];

const OUTSIDE = mk('outside');
const SECRETS: Record<string, [file: string, text: string]> = {
  'README.md': [join(OUTSIDE, 'credentials.md'), README_SECRET],
  'package.json': [join(OUTSIDE, 'credentials.json'), PKG_SECRET],
  'pyproject.toml': [join(OUTSIDE, 'credentials.toml'), PY_SECRET],
};
for (const [file, text] of Object.values(SECRETS)) {writeFileSync(file, text);}

/** The canaries `text` holds (none, when detection stayed inside the project). */
function leaks(text: string): string[] {
  const t = text.toLowerCase();
  return CANARIES.filter(c => t.includes(c));
}

/** A project whose `names` (README.md, package.json, pyproject.toml) are links
 *  to the secrets outside it, plus `files` of its own. */
function project(names: string[], files: Record<string, string> = {}): string {
  const dir = mk('project');
  for (const name of names) {symlinkSync(SECRETS[name][0], join(dir, name));}
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

/** The text of every regular file under `dir` — the links and `.git` are the
 *  fixture's own, not faf's output. */
function writtenFiles(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      if (name === '.git') {continue;}
      const p = join(d, name);
      const st = lstatSync(p);
      if (st.isDirectory()) {walk(p);}
      else if (st.isFile()) {out[p.slice(dir.length + 1)] = readFileSync(p, 'utf-8');}
    }
  };
  walk(dir);
  return out;
}

/** The secrets are exactly as the fixture wrote them. */
function expectSecretsUntouched(): void {
  for (const [file, text] of Object.values(SECRETS)) {expect(readFileSync(file, 'utf-8')).toBe(text);}
}

// ── The CLI, from source, with a HOME and a TMPDIR of its own ───────────────
interface Run { status: number | null; out: string; err: string }
function env(extra: Record<string, string> = {}): Record<string, string> {
  const e: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {if (v !== undefined) {e[k] = v;}}
  for (const k of ['FAF_PRO', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'CLAUDE_CONFIG_DIR']) {delete e[k];}
  return { ...e, HOME: mk('home'), TMPDIR: mk('tmp'), NO_COLOR: '1', CI: '1', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', ...extra };
}
function run(cwd: string, args: string[], extra: Record<string, string> = {}): Run {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env: env(extra), stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}

/** A run that succeeded and printed nothing of the secrets. */
function expectCleanRun(r: Run, what: string): void {
  expect({ what, status: r.status, err: r.status === 0 ? '' : r.err }).toEqual({ what, status: 0, err: '' });
  expect({ what, stdout: leaks(r.out), stderr: leaks(r.err) }).toEqual({ what, stdout: [], stderr: [] });
}

/** No file faf wrote under `dir` holds a canary. */
function expectCleanFiles(dir: string): void {
  const files = writtenFiles(dir);
  const found = Object.entries(files).filter(([, text]) => leaks(text).length > 0).map(([rel, text]) => `${rel}: ${leaks(text).join(', ')}`);
  expect(found).toEqual([]);
}

const ALL = ['README.md', 'package.json', 'pyproject.toml'];

describe('BRAKE: detection never reads a file through a link out of the project', () => {
  test.skipIf(!posix)('faf init, faf auto, faf export --agents and faf sync: the secrets appear nowhere', () => {
    const dir = project(ALL, { 'src/index.ts': 'export const x = 1;\n' });

    expectCleanRun(run(dir, ['init']), 'faf init');
    expectCleanFiles(dir);
    expectCleanRun(run(dir, ['auto']), 'faf auto (existing project.faf)');
    expectCleanFiles(dir);
    expectCleanRun(run(dir, ['export', '--agents']), 'faf export --agents');
    expectCleanRun(run(dir, ['sync']), 'faf sync');

    const files = writtenFiles(dir);
    for (const name of ['project.faf', 'AGENTS.md', 'CLAUDE.md']) {expect(Object.keys(files)).toContain(name);}
    expectCleanFiles(dir);
    // The links are the user's, left as they were; the secrets are unread and unchanged.
    for (const name of ALL) {expect(lstatSync(join(dir, name)).isSymbolicLink()).toBe(true);}
    expectSecretsUntouched();
  });

  test.skipIf(!posix)('faf auto on a project with no project.faf: the secrets appear nowhere', () => {
    const dir = project(ALL);
    expectCleanRun(run(dir, ['auto']), 'faf auto (new project.faf)');
    expect(readFileSync(join(dir, 'project.faf'), 'utf-8')).toContain('project:');
    expectCleanFiles(dir);
    expectSecretsUntouched();
  });

  // Each linked file on its own, through every library entry point that reads the repo.
  for (const name of ALL) {
    test.skipIf(!posix)(`${name} → a file outside: authorFafFromRepo / assembleFreshFaf / updateExistingFaf / enrichFromRepo read none of it`, () => {
      const dir = project([name]);
      const existing = { project: { name: 'mine' }, human_context: { who: '' } };
      const fresh = assembleFreshFaf(dir) as FafData;
      const outputs: Record<string, string> = {
        authorFafFromRepo: serializeFaf(authorFafFromRepo(dir, { repoUrl: 'https://github.com/owner/linked.git' })),
        assembleFreshFaf: serializeFaf(fresh),
        updateExistingFaf: serializeFaf(updateExistingFaf(dir, existing) as FafData),
        enrichFromRepo: JSON.stringify(enrichFromRepo(dir, fresh)),
        'AGENTS.md': renderAgentsMd(enrichFromRepo(dir, fresh)),
        'CLAUDE.md': renderClaudeMd(fresh),
        detectStack: JSON.stringify(detectStack(dir)),
        interrogateRepo: JSON.stringify(interrogateRepo(dir)),
        relentlessContextDetailed: JSON.stringify(relentlessContextDetailed(dir)),
        turboCatScan: JSON.stringify(turboCatScan(dir)),
      };
      const found = Object.entries(outputs).filter(([, text]) => leaks(text).length > 0).map(([fn, text]) => `${fn}: ${leaks(text).join(', ')}`);
      expect(found).toEqual([]);
      // Absent, not merely unread: the linked file is no key file, and says nothing of the stack.
      const enriched = enrichFromRepo(dir, fresh);
      expect(enriched.key_files ?? []).not.toContain(name);
      expect(fresh.project?.main_language ?? '').toBe('');
      expectSecretsUntouched();
    });
  }

  test.skipIf(!posix)('a link inside the project still works: README.md → docs/README.md is read', () => {
    const inProject = '# Demo\n\nAn in-project README that faf reads through its link, as before.\n';
    const dir = project(['package.json'], { 'docs/README.md': inProject });
    symlinkSync(join('docs', 'README.md'), join(dir, 'README.md'));

    const fresh = assembleFreshFaf(dir) as FafData;
    expect(fresh.project?.goal).toBe('An in-project README that faf reads through its link, as before.');
    expect(leaks(serializeFaf(fresh))).toEqual([]);

    expectCleanRun(run(dir, ['init']), 'faf init');
    expect(readFileSync(join(dir, 'project.faf'), 'utf-8')).toContain('An in-project README that faf reads through its link');
    expectCleanFiles(dir);
  });

  test.skipIf(!posix)('a file reached through a folder that links out, a link into .git and a dangling link are absent', () => {
    const inGit = '[package]\nname = "in-git"\ndescription = "CANARY-7F3A description kept inside .git"\n';
    const dir = project(['package.json'], { '.git/in-git.toml': inGit });
    symlinkSync(OUTSIDE, join(dir, 'docs')); // docs/ → the folder the secrets are in
    symlinkSync(join('docs', 'credentials.md'), join(dir, 'README.md')); // through docs/, out
    symlinkSync(join('.git', 'in-git.toml'), join(dir, 'Cargo.toml')); // into .git
    symlinkSync(join(dir, 'nowhere.toml'), join(dir, 'pyproject.toml')); // dangling

    const outputs = [
      serializeFaf(assembleFreshFaf(dir) as FafData),
      JSON.stringify(interrogateRepo(dir)),
      JSON.stringify(relentlessContextDetailed(dir)),
      JSON.stringify(turboCatScan(dir)),
    ];
    for (const text of outputs) {expect(leaks(text)).toEqual([]);}
    expectCleanRun(run(dir, ['init']), 'faf init');
    expectCleanFiles(dir);
    expectSecretsUntouched();
  });
});

// ── faf git: a cloned repo's links arrive as plain files ────────────────────
/** A bare repo `<remote>/linkrepo.git` whose README.md and package.json are
 *  links (absolute) to the secrets outside it — the hostile repo. */
function hostileRemote(): string {
  const work = mk('work');
  const gitEnv = { ...process.env, HOME: mk('githome'), GIT_CONFIG_NOSYSTEM: '1' };
  const git = (cwd: string, args: string[]): void => {
    execFileSync('git', args, { cwd, env: gitEnv, stdio: 'pipe' });
  };
  git(work, ['init', '-q']);
  symlinkSync(SECRETS['README.md'][0], join(work, 'README.md'));
  symlinkSync(SECRETS['package.json'][0], join(work, 'package.json'));
  git(work, ['add', '-A']);
  git(work, ['-c', 'user.email=t@faf.one', '-c', 'user.name=faf', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'links out']);
  const remote = mk('remote');
  git(remote, ['clone', '-q', '--bare', work, join(remote, 'linkrepo.git')]);
  return remote;
}

describe('BRAKE: faf git clones links as plain text files', () => {
  test.skipIf(!posix || !hasGit)('the clone faf git runs gives README.md as a plain file holding the link text', () => {
    const remote = hostileRemote();
    const dest = join(mk('clone'), 'repo');
    execFileSync('git', cloneArgs(`file://${remote}/linkrepo.git`, dest), {
      env: { ...process.env, HOME: mk('githome'), GIT_CONFIG_NOSYSTEM: '1' },
      stdio: 'pipe',
    });
    for (const name of ['README.md', 'package.json']) {
      expect({ name, link: lstatSync(join(dest, name)).isSymbolicLink() }).toEqual({ name, link: false });
      expect(readFileSync(join(dest, name), 'utf-8')).toBe(SECRETS[name][0]);
    }
    expect(leaks(serializeFaf(authorFafFromRepo(dest)))).toEqual([]);
    expectSecretsUntouched();
  });

  test.skipIf(!posix || !hasGit)('faf git <url> on a repo whose README.md links to a secret: the secret appears nowhere', () => {
    const remote = hostileRemote();
    const home = mk('home');
    // `faf git faf-links/linkrepo` → https://github.com/faf-links/linkrepo.git → the local bare repo.
    writeFileSync(
      join(home, '.gitconfig'),
      `[url "file://${remote}/"]\n\tinsteadOf = https://github.com/faf-links/\n[protocol "file"]\n\tallow = always\n`,
    );
    const cwd = mk('gitcwd');
    const r = run(cwd, ['git', 'faf-links/linkrepo'], { HOME: home, GIT_CONFIG_GLOBAL: join(home, '.gitconfig') });
    expectCleanRun(r, 'faf git');
    const faf = readFileSync(join(cwd, 'project.faf'), 'utf-8');
    expect(leaks(faf)).toEqual([]);
    // README.md arrived as a plain file holding the link's text; faf takes that
    // placeholder out of its clone, so the link text is not read as the README.
    expect(faf).not.toContain(basename(OUTSIDE));
    expect(faf).toContain('name: linkrepo');
    expectCleanFiles(cwd);
    expectSecretsUntouched();
  });
});

// ── 7.13.1 check follow-ups: in-project subfolder links, the link text, .fafa ──
describe('BRAKE: the project folder bounds subfolder scans; link text is never a fact; .fafa is read safely', () => {
  test.skipIf(!posix)('a subfolder manifest linked elsewhere inside the project is followed; one linked out is absent', () => {
    const dir = mk('subdirs');
    mkdirSync(join(dir, 'api'), { recursive: true });
    writeFileSync(join(dir, 'api', 'go.mod'), 'module example.com/api\n\ngo 1.22\n');
    mkdirSync(join(dir, 'shared'), { recursive: true });
    writeFileSync(join(dir, 'shared', 'web-package.json'), `${JSON.stringify({ name: 'web', dependencies: { react: '18.0.0' } })}\n`);
    mkdirSync(join(dir, 'web'), { recursive: true });
    symlinkSync('../shared/web-package.json', join(dir, 'web', 'package.json'));
    mkdirSync(join(dir, 'leak'), { recursive: true });
    symlinkSync(SECRETS['package.json'][0], join(dir, 'leak', 'package.json'));
    const stacks = detectSubdirStacks(dir);
    expect(stacks.map(s => s.name).sort()).toContain('web');
    expect(stacks.find(s => s.name === 'web')?.topFramework).toBe('React');
    expect(stacks.map(s => s.name)).not.toContain('leak');
    expect(leaks(JSON.stringify(stacks))).toEqual([]);
    expectSecretsUntouched();
  });

  test.skipIf(!posix || !hasGit)('faf git: an in-repo README link (README.md -> docs/README.md) never becomes project.goal', () => {
    const work = mk('work-inrepo');
    const gitEnv = { ...process.env, HOME: mk('githome'), GIT_CONFIG_NOSYSTEM: '1' };
    const git = (cwd: string, args: string[]): void => { execFileSync('git', args, { cwd, env: gitEnv, stdio: 'pipe' }); };
    git(work, ['init', '-q']);
    mkdirSync(join(work, 'docs'), { recursive: true });
    writeFileSync(join(work, 'docs', 'README.md'), '# inrepo\n\nA tool the docs folder describes.\n');
    symlinkSync('docs/README.md', join(work, 'README.md'));
    git(work, ['add', '-A']);
    git(work, ['-c', 'user.email=t@faf.one', '-c', 'user.name=faf', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'in-repo link']);
    const dest = join(mk('clone-inrepo'), 'repo');
    execFileSync('git', cloneArgs(`file://${work}`, dest), { env: gitEnv, stdio: 'pipe' });
    expect(readFileSync(join(dest, 'README.md'), 'utf-8')).toBe('docs/README.md'); // the placeholder
    expect(dropLinkPlaceholders(dest)).toBe(1);
    const faf = serializeFaf(authorFafFromRepo(dest));
    expect(faf).not.toContain('docs/README.md');
  });

  test.skipIf(!posix)('agent.fafa that links out of its folder is refused, never read; a same-name link inside is read', () => {
    const dir = mk('fafa');
    const secret = join(OUTSIDE, 'agent-secret.fafa');
    writeFileSync(secret, `name: ${CANARY}\n`);
    symlinkSync(secret, join(dir, 'agent.fafa'));
    let err: unknown;
    try { readFafa(join(dir, 'agent.fafa')); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(SafePathError);
    expect(leaks(String((err as Error)?.message ?? ''))).toEqual([]);

    const ok = mk('fafa-ok');
    mkdirSync(join(ok, 'docs'), { recursive: true });
    writeFileSync(join(ok, 'docs', 'agent.fafa'), 'name: inside-agent\n');
    symlinkSync('docs/agent.fafa', join(ok, 'agent.fafa'));
    expect((readFafa(join(ok, 'agent.fafa')) as { name?: string }).name).toBe('inside-agent');
  });
});
