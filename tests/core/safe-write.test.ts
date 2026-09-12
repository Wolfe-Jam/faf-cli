/**
 * BRAKE: safe file access — audit #1 (symlinked context read into the model and
 * written outside the project) and #16 (no writer was atomic).
 *
 * resolveInside(dir, name) resolves a path on disk and refuses anything that
 * leaves the project, dangles, or is not a regular file; a read of project
 * context through a link must also land on a .faf/.fafm file. safeWriteFile
 * writes a temp file in the same folder, fsyncs and renames it over, keeping the
 * original's mode. Every faf writer and project-context reader goes through
 * them. Each symlink and failed-write case below read or wrote through the link
 * (or truncated the file) on fce35d6b.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { resolveInside, safeWriteFile, SafePathError } from '../../src/core/safe-write.js';
import * as publicApi from '../../src/index.js';
import { readFaf, readFafRaw, writeFaf, findFafFile, serializeFaf } from '../../src/interop/faf.js';
import { writeClaudeMd, renderClaudeMd, readClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeMemoryMd, readMemoryMd } from '../../src/interop/memory.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';
import { writeProjectHtml } from '../../src/interop/projecthtml.js';
import { writeServerCard } from '../../src/interop/servercard.js';
import { writeGrokConfig } from '../../src/interop/grok.js';
import { writeJson } from '../../src/interop/cards.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { Soul } from '../../src/fafm/soul.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const posix = process.platform !== 'win32';
const SECRET = 'aws_access_key_id = AKIA-SECRET-DO-NOT-READ\n';
const DATA: any = {
  faf_version: '3.0',
  project: { name: 'demo', goal: 'A small API for the team', main_language: 'TypeScript', type: 'backend' },
  stack: { backend: 'Express', runtime: 'Node.js' },
  human_context: { who: 'Platform devs', what: 'Internal API', why: 'One source of truth' },
};

/** A project folder and a sibling "home" folder outside it. */
function sandbox(): { base: string; project: string; home: string } {
  const base = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-safe-')));
  const project = join(base, 'project');
  const home = join(base, 'home');
  mkdirSync(project);
  mkdirSync(home);
  return { base, project, home };
}

function refusal(fn: () => unknown): SafePathError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SafePathError) {return e;}
    throw new Error(`expected a SafePathError, got: ${e instanceof Error ? e.message : String(e)}`);
  }
  throw new Error('expected a SafePathError, but nothing was thrown');
}

const tempLeftovers = (dir: string): string[] => readdirSync(dir).filter(n => n.endsWith('.faf-tmp'));

// ---------------------------------------------------------------------------
describe('BRAKE: resolveInside — stay inside the project', () => {
  test('a plain file, and a file not yet written, resolve inside the project', () => {
    const { project } = sandbox();
    writeFileSync(join(project, 'CLAUDE.md'), 'x');
    expect(resolveInside(project, 'CLAUDE.md')).toBe(join(project, 'CLAUDE.md'));
    expect(resolveInside(project, 'NEW.md')).toBe(join(project, 'NEW.md'));
    expect(resolveInside(project, join(project, 'CLAUDE.md'))).toBe(join(project, 'CLAUDE.md')); // absolute name
  });

  test.skipIf(!posix)('an in-project link resolves to its target (CLAUDE.md → AGENTS.md is fine)', () => {
    const { project } = sandbox();
    writeFileSync(join(project, 'AGENTS.md'), 'agents');
    symlinkSync('AGENTS.md', join(project, 'CLAUDE.md'));
    expect(resolveInside(project, 'CLAUDE.md')).toBe(join(project, 'AGENTS.md'));
  });

  test.skipIf(!posix)('a link that leaves the project is refused', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, '.zshrc'), 'export PATH=x\n');
    symlinkSync(join(home, '.zshrc'), join(project, 'CLAUDE.md'));
    expect(refusal(() => resolveInside(project, 'CLAUDE.md')).reason).toBe('outside');
    symlinkSync('../home/.zshrc', join(project, 'AGENTS.md')); // relative link out
    expect(refusal(() => resolveInside(project, 'AGENTS.md')).reason).toBe('outside');
  });

  test('a name that climbs out of the project is refused', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, 'x.faf'), 'a: 1\n');
    expect(refusal(() => resolveInside(project, '../home/x.faf')).reason).toBe('outside');
    expect(refusal(() => resolveInside(project, join(home, 'x.faf'))).reason).toBe('outside');
  });

  test.skipIf(!posix)('a linked subfolder cannot carry the path out', () => {
    const { project, home } = sandbox();
    symlinkSync(home, join(project, '.github'));
    expect(refusal(() => resolveInside(project, '.github/copilot-instructions.md')).reason).toBe('outside');
  });

  test.skipIf(!posix)('a dangling link or a link loop is refused, inside or out', () => {
    const { project, home } = sandbox();
    symlinkSync(join(home, '.zshenv'), join(project, 'CLAUDE.md'));
    symlinkSync('missing.md', join(project, 'AGENTS.md'));
    symlinkSync('LOOP.md', join(project, 'LOOP.md'));
    expect(refusal(() => resolveInside(project, 'CLAUDE.md')).reason).toBe('dangling');
    expect(refusal(() => resolveInside(project, 'AGENTS.md')).reason).toBe('dangling');
    expect(refusal(() => resolveInside(project, 'LOOP.md')).reason).toBe('dangling');
  });

  test.skipIf(!posix)('a folder, or a link to a folder, is not a file', () => {
    const { project } = sandbox();
    mkdirSync(join(project, 'docs'));
    symlinkSync('docs', join(project, 'CLAUDE.md'));
    expect(refusal(() => resolveInside(project, 'docs')).reason).toBe('not-a-file');
    expect(refusal(() => resolveInside(project, 'CLAUDE.md')).reason).toBe('not-a-file');
  });

  test.skipIf(!posix)('read mode: a link must end at a .faf/.fafm file, even inside the project', () => {
    const { project } = sandbox();
    writeFileSync(join(project, '.env'), 'TOKEN=secret\n');
    mkdirSync(join(project, 'config'));
    writeFileSync(join(project, 'config', 'team.faf'), 'project:\n  name: team\n');
    symlinkSync('.env', join(project, 'project.faf'));
    symlinkSync('config/team.faf', join(project, '.faf'));
    expect(refusal(() => resolveInside(project, 'project.faf', { read: true })).reason).toBe('not-faf');
    // A write-mode resolve refuses it too: .env is a file with another name.
    expect(refusal(() => resolveInside(project, 'project.faf')).reason).toBe('other-file');
    expect(resolveInside(project, '.faf', { read: true })).toBe(join(project, 'config', 'team.faf'));
  });

  test('the primitive is public', () => {
    expect(publicApi.resolveInside).toBe(resolveInside);
    expect(publicApi.safeWriteFile).toBe(safeWriteFile);
    expect(publicApi.SafePathError).toBe(SafePathError);
  });
});

// ---------------------------------------------------------------------------
describe('BRAKE: safeWriteFile — atomic, mode kept, never through a link out', () => {
  test('creates, then replaces, with no temp file left behind', () => {
    const { project } = sandbox();
    const file = join(project, 'notes.md');
    expect(safeWriteFile(file, 'one\n')).toBe(file);
    safeWriteFile(file, 'two\n');
    expect(readFileSync(file, 'utf-8')).toBe('two\n');
    expect(tempLeftovers(project)).toEqual([]);
  });

  test.skipIf(!posix)("keeps the original's mode", () => {
    const { project } = sandbox();
    const file = join(project, 'soul.fafm');
    writeFileSync(file, 'old');
    chmodSync(file, 0o600);
    safeWriteFile(file, 'new');
    expect(statSync(file).mode & 0o777).toBe(0o600);
    chmodSync(file, 0o640);
    safeWriteFile(file, 'newer');
    expect(statSync(file).mode & 0o777).toBe(0o640);
  });

  test.skipIf(!posix)('an in-project link is written through and stays a link', () => {
    const { project } = sandbox();
    writeFileSync(join(project, 'AGENTS.md'), 'old');
    symlinkSync('AGENTS.md', join(project, 'CLAUDE.md'));
    expect(safeWriteFile(join(project, 'CLAUDE.md'), 'new')).toBe(join(project, 'AGENTS.md'));
    expect(lstatSync(join(project, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(project, 'AGENTS.md'), 'utf-8')).toBe('new');
  });

  test.skipIf(!posix)('a link out is refused and its target untouched; a dangling link creates nothing', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, '.zshrc'), SECRET);
    symlinkSync(join(home, '.zshrc'), join(project, 'CLAUDE.md'));
    symlinkSync(join(home, '.zshenv'), join(project, 'AGENTS.md'));
    expect(refusal(() => safeWriteFile(join(project, 'CLAUDE.md'), 'x')).reason).toBe('outside');
    expect(refusal(() => safeWriteFile(join(project, 'AGENTS.md'), 'x')).reason).toBe('dangling');
    expect(readFileSync(join(home, '.zshrc'), 'utf-8')).toBe(SECRET);
    expect(existsSync(join(home, '.zshenv'))).toBe(false);
  });

  test.skipIf(!posix || process.getuid?.() === 0)('a read-only file is not replaced: not written; original kept', () => {
    const { project } = sandbox();
    const file = join(project, 'CLAUDE.md');
    writeFileSync(file, 'hands off\n');
    chmodSync(file, 0o444);
    expect(() => safeWriteFile(file, 'x')).toThrow(/not written; original kept/);
    expect(readFileSync(file, 'utf-8')).toBe('hands off\n');
    expect(tempLeftovers(project)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Every writer, pointed at a link that leaves the project (or dangles): refused,
// the outside file byte-identical, nothing created. fce35d6b followed the link.
// ---------------------------------------------------------------------------
interface WriterCase {
  name: string;
  file: string;
  write: (project: string) => unknown;
}
const WRITERS: WriterCase[] = [
  { name: 'writeClaudeMd', file: 'CLAUDE.md', write: d => writeClaudeMd(d, renderClaudeMd(DATA)) },
  { name: 'writeAgentsMd', file: 'AGENTS.md', write: d => writeAgentsMd(d, DATA) },
  { name: 'writeGeminiMd', file: 'GEMINI.md', write: d => writeGeminiMd(d, DATA) },
  { name: 'writeCursorrules', file: '.cursorrules', write: d => writeCursorrules(d, DATA) },
  { name: 'writeCopilotInstructions', file: '.github/copilot-instructions.md', write: d => writeCopilotInstructions(d, DATA) },
  { name: 'writeMemoryMd', file: 'MEMORY.md', write: d => writeMemoryMd(d, '# demo — Memory Topics') },
  { name: 'writeLlmsTxt', file: 'llms.txt', write: d => writeLlmsTxt(d, DATA) },
  { name: 'writeFaf', file: 'project.faf', write: d => writeFaf(join(d, 'project.faf'), DATA) },
  { name: 'FafmSoul.save', file: 'soul.fafm', write: d => new Soul('@demo').save(join(d, 'soul.fafm')) },
  { name: 'writeProjectHtml', file: 'project.html', write: d => writeProjectHtml(d, DATA, scoreFafYaml(serializeFaf(DATA))) },
  { name: 'writeServerCard', file: 'server-card', write: d => writeServerCard(d, DATA) },
  { name: 'writeGrokConfig', file: '.grok/config.toml', write: d => writeGrokConfig(d, DATA) },
  { name: 'writeJson (faf cards)', file: '.well-known/agent-card.json', write: d => writeJson(join(d, '.well-known', 'agent-card.json'), { a: 1 }, d) },
  { name: 'FafDNAManager', file: '.faf-dna', write: d => new FafDNAManager(d).birth(42) },
];

describe('BRAKE: every writer refuses a link out of the project', () => {
  for (const w of WRITERS) {
    test.skipIf(!posix)(`${w.name} (${w.file})`, () => {
      const { project, home } = sandbox();
      const link = join(project, w.file);
      mkdirSync(dirname(link), { recursive: true });

      // A link to a real file outside: refused, the file byte-identical.
      writeFileSync(join(home, 'target'), SECRET);
      symlinkSync(join(home, 'target'), link);
      expect(refusal(() => w.write(project)).reason).toBe('outside');
      expect(readFileSync(join(home, 'target'), 'utf-8')).toBe(SECRET);
      expect(lstatSync(link).isSymbolicLink()).toBe(true);

      // A dangling link: refused, nothing created at its far end.
      const fresh = sandbox();
      const dangling = join(fresh.project, w.file);
      mkdirSync(dirname(dangling), { recursive: true });
      symlinkSync(join(fresh.home, 'created-through-link'), dangling);
      expect(refusal(() => w.write(fresh.project)).reason).toBe('dangling');
      expect(readdirSync(fresh.home)).toEqual([]);
    });
  }

  test.skipIf(!posix)('a linked subfolder (.github, .grok, .well-known) cannot carry a write out', () => {
    for (const [sub, write] of [
      ['.github', (d: string) => writeCopilotInstructions(d, DATA)],
      ['.grok', (d: string) => writeGrokConfig(d, DATA)],
      ['.well-known', (d: string) => writeJson(join(d, '.well-known', 'agent-card.json'), { a: 1 }, d)],
    ] as const) {
      const { project, home } = sandbox();
      symlinkSync(home, join(project, sub));
      expect(refusal(() => write(project)).reason).toBe('outside');
      expect(readdirSync(home)).toEqual([]);
    }
  });

  test.skipIf(!posix)('in-project links are kept: CLAUDE.md → AGENTS.md and project.faf → config/project.faf', () => {
    const { project } = sandbox();
    writeFileSync(join(project, 'AGENTS.md'), '# Mine\nUSER LINE\n');
    symlinkSync('AGENTS.md', join(project, 'CLAUDE.md'));
    writeClaudeMd(project, renderClaudeMd(DATA));
    expect(lstatSync(join(project, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
    const agents = readFileSync(join(project, 'AGENTS.md'), 'utf-8');
    expect(agents).toContain('USER LINE');
    expect(agents).toContain('<!-- faf:start -->');

    // A .faf is written through a link only to a file of the same name.
    mkdirSync(join(project, 'config'));
    writeFileSync(join(project, 'config', 'project.faf'), 'project:\n  name: old\n');
    symlinkSync('config/project.faf', join(project, 'project.faf'));
    writeFaf(join(project, 'project.faf'), DATA);
    expect(lstatSync(join(project, 'project.faf')).isSymbolicLink()).toBe(true);
    expect(readFaf(join(project, 'project.faf')).project?.name).toBe('demo');
    expect(readFileSync(join(project, 'config', 'project.faf'), 'utf-8')).toContain('name: demo');
  });
});

// ---------------------------------------------------------------------------
// Readers: project context never comes from outside the project, and a link
// must end at a .faf/.fafm file. fce35d6b printed the secret.
// ---------------------------------------------------------------------------
describe('BRAKE: project-context readers refuse a link out of the project', () => {
  test.skipIf(!posix)('readFaf / readFafRaw / findFafFile: project.faf → ~/.aws/credentials', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, 'credentials'), SECRET);
    symlinkSync(join(home, 'credentials'), join(project, 'project.faf'));
    const path = join(project, 'project.faf');
    expect(refusal(() => readFaf(path)).reason).toBe('outside');
    expect(refusal(() => readFafRaw(path)).reason).toBe('outside');
    expect(refusal(() => findFafFile(project)).reason).toBe('outside');
    // …including when found by walking up from a subfolder.
    mkdirSync(join(project, 'src'));
    expect(refusal(() => findFafFile(join(project, 'src'))).reason).toBe('outside');
  });

  test.skipIf(!posix)('project.faf → .env inside the project is refused too (not a .faf file)', () => {
    const { project } = sandbox();
    writeFileSync(join(project, '.env'), 'TOKEN=secret\n');
    symlinkSync('.env', join(project, 'project.faf'));
    expect(refusal(() => readFafRaw(join(project, 'project.faf'))).reason).toBe('not-faf');
    expect(refusal(() => findFafFile(project)).reason).toBe('not-faf');
  });

  test.skipIf(!posix)('a dangling project.faf is refused, not reported missing (so nothing is created through it)', () => {
    const { project, home } = sandbox();
    symlinkSync(join(home, '.zshenv'), join(project, 'project.faf'));
    expect(refusal(() => findFafFile(project)).reason).toBe('dangling');
    expect(refusal(() => writeFaf(join(project, 'project.faf'), DATA)).reason).toBe('dangling');
    expect(existsSync(join(home, '.zshenv'))).toBe(false);
  });

  test.skipIf(!posix)('an in-project link to a .faf is read through; the path comes back as spelled', () => {
    const { project } = sandbox();
    mkdirSync(join(project, 'config'));
    writeFileSync(join(project, 'config', 'team.faf'), 'project:\n  name: team\n');
    symlinkSync('config/team.faf', join(project, 'project.faf'));
    expect(findFafFile(project)).toBe(join(project, 'project.faf'));
    expect(readFaf(join(project, 'project.faf')).project?.name).toBe('team');
  });

  test('relative folders resolve against the cwd, as before', () => {
    const { project } = sandbox();
    writeFileSync(join(project, 'project.faf'), 'project:\n  name: rel\n');
    mkdirSync(join(project, 'src'));
    const rel = relative(process.cwd(), join(project, 'src'));
    const found = findFafFile(rel);
    expect(found).toBe(join(dirname(rel), 'project.faf'));
    expect(readFaf(found as string).project?.name).toBe('rel');
    expect(writeGrokConfig(relative(process.cwd(), project))).toBe('created');
    writeClaudeMd(relative(process.cwd(), project), renderClaudeMd(DATA));
    expect(readFileSync(join(project, 'CLAUDE.md'), 'utf-8')).toContain('<!-- faf:start -->');
  });

  test('a folder named .faf is not a .faf file — the search moves on', () => {
    const { project } = sandbox();
    const sub = join(project, 'pkg');
    mkdirSync(join(sub, '.faf'), { recursive: true });
    writeFileSync(join(project, 'project.faf'), 'project:\n  name: root\n');
    expect(findFafFile(sub)).toBe(join(project, 'project.faf'));
  });

  test.skipIf(!posix)('FafmSoul.load: soul.fafm → outside is refused', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, 'settings.json'), '{"secret": true}\n');
    symlinkSync(join(home, 'settings.json'), join(project, 'soul.fafm'));
    expect(refusal(() => Soul.load(join(project, 'soul.fafm'))).reason).toBe('outside');
  });

  test.skipIf(!posix)('readClaudeMd / readMemoryMd: a link out is refused; an in-project link is read', () => {
    const { project, home } = sandbox();
    writeFileSync(join(home, 'config'), SECRET);
    symlinkSync(join(home, 'config'), join(project, 'CLAUDE.md'));
    symlinkSync(join(home, 'config'), join(project, 'MEMORY.md'));
    expect(refusal(() => readClaudeMd(project)).reason).toBe('outside');
    expect(refusal(() => readMemoryMd(project)).reason).toBe('outside');

    const other = sandbox();
    writeFileSync(join(other.project, 'AGENTS.md'), 'shared context\n');
    symlinkSync('AGENTS.md', join(other.project, 'CLAUDE.md'));
    expect(readClaudeMd(other.project)).toBe('shared context\n');
  });
});

describe('BRAKE: the CLI says a refusal in one line', () => {
  test.skipIf(!posix)('`faf sync` with CLAUDE.md → ~/.zshrc: exit 1, one line, the rc file untouched', () => {
    const { project, home } = sandbox();
    writeFileSync(join(project, 'project.faf'), serializeFaf(DATA));
    writeFileSync(join(home, '.zshrc'), 'export PATH=/usr/bin\n');
    symlinkSync(join(home, '.zshrc'), join(project, 'CLAUDE.md'));
    const res = spawnSync(process.execPath, [join(import.meta.dir, '../../src/cli.ts'), 'sync'], {
      cwd: project,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    expect(readFileSync(join(home, '.zshrc'), 'utf-8')).toBe('export PATH=/usr/bin\n');
    expect(res.status).toBe(1);
    expect(res.stderr.trim().split('\n')).toEqual([
      `faf: ${join(project, 'CLAUDE.md')} is a link to ${join(home, '.zshrc')}, outside ${project} — refused. Nothing was read from or written to it.`,
    ]);
  });
});

// ---------------------------------------------------------------------------
// #16 — a write that fails part-way leaves the original exactly as it was.
// A child process runs each writer under `ulimit -f` (file-size limit, a few KB)
// against a larger existing file: fce35d6b wrote the file in place and left it
// part-new, part-old (or cut short); now the temp file fails, is removed, and
// the original stays.
// ---------------------------------------------------------------------------
const SRC = join(import.meta.dir, '../../src');
const bigUserText = (): string =>
  `${Array.from({ length: 600 }, (_, i) => `USER-LINE-${i} hand-written context that must survive`).join('\n')}\nUSER-LAST-LINE\n`;

function runUnderFileLimit(project: string, body: string): { out: string; code: number | null } {
  const script = join(dirname(project), 'child.ts');
  writeFileSync(
    script,
    [
      `import { injectFafBlock } from ${JSON.stringify(join(SRC, 'interop/inject.ts'))};`,
      `import { writeFaf } from ${JSON.stringify(join(SRC, 'interop/faf.ts'))};`,
      `import { Soul } from ${JSON.stringify(join(SRC, 'fafm/soul.ts'))};`,
      `const project = ${JSON.stringify(project)};`,
      'try {',
      body,
      "  console.log('WROTE');",
      '} catch (e) {',
      '  console.log(`ERR ${(e as Error).message}`);',
      '}',
    ].join('\n'),
  );
  const res = spawnSync('sh', ['-c', `ulimit -f 8 && exec "${process.execPath}" "${script}"`], {
    encoding: 'utf-8',
    env: { ...process.env, BUN_RUNTIME_TRANSPILER_CACHE_PATH: '0' },
  });
  return { out: `${res.stdout}${res.stderr}`, code: res.status };
}

describe('BRAKE: a failed write keeps the original (not written; original kept)', () => {
  test.skipIf(!posix)('injectFafBlock (CLAUDE.md) under a file-size limit', () => {
    const { project } = sandbox();
    const file = join(project, 'CLAUDE.md');
    const before = bigUserText();
    writeFileSync(file, before);
    const { out } = runUnderFileLimit(project, '  injectFafBlock(`${project}/CLAUDE.md`, "# block\\n" + "x".repeat(20000));');
    // fce35d6b wrote in place and stopped at the limit: Node's writeFileSync
    // truncates first (the tail is lost), Bun's overwrites the head.
    expect(readFileSync(file, 'utf-8')).toBe(before);
    expect(out).toContain('not written; original kept');
    expect(tempLeftovers(project)).toEqual([]);
  });

  test.skipIf(!posix)('writeFaf (project.faf) under a file-size limit', () => {
    const { project } = sandbox();
    const file = join(project, 'project.faf');
    const before = `project:\n  name: demo\nnotes:\n${bigUserText().split('\n').filter(Boolean).map(l => `  - ${l}`).join('\n')}\n`;
    writeFileSync(file, before);
    const { out } = runUnderFileLimit(
      project,
      '  writeFaf(`${project}/project.faf`, { project: { name: "demo" }, notes: Array.from({ length: 900 }, (_, i) => `detected line ${i} of the new render`) });',
    );
    // fce35d6b wrote in place and stopped at the limit: Node's writeFileSync
    // truncates first (the tail is lost), Bun's overwrites the head.
    expect(readFileSync(file, 'utf-8')).toBe(before);
    expect(out).toContain('not written; original kept');
    expect(tempLeftovers(project)).toEqual([]);
  });

  test.skipIf(!posix)('FafmSoul.save (soul.fafm) under a file-size limit', () => {
    const { project } = sandbox();
    const file = join(project, 'soul.fafm');
    const soul = new Soul('@demo');
    for (let i = 0; i < 400; i++) {soul.etch(`fact ${i}: a durable thing worth remembering`, { id: `f${i}` });}
    soul.save(file);
    const before = readFileSync(file, 'utf-8');
    const { out } = runUnderFileLimit(
      project,
      '  const s = Soul.load(`${project}/soul.fafm`); s.namepoint = "@renamed"; for (let i = 0; i < 400; i++) { s.etch(`more ${i}`); } s.save(`${project}/soul.fafm`);',
    );
    // fce35d6b wrote in place and stopped at the limit: Node's writeFileSync
    // truncates first (the tail is lost), Bun's overwrites the head.
    expect(readFileSync(file, 'utf-8')).toBe(before);
    expect(out).toContain('not written; original kept');
    expect(tempLeftovers(project)).toEqual([]);
  });
});
