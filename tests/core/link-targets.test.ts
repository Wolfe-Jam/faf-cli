/**
 * BRAKE: a link inside the project leads only to the same kind of file —
 * adversarial #1 (the 7.13 owner-rule round).
 *
 * resolveInside used to accept any regular file inside the project at the end
 * of a link, so the injector prefixed its block into whatever a context file
 * pointed at: `CLAUDE.md → README.md` put faf's block on top of the README
 * (probe-realink), `CLAUDE.md → package.json` left JSON that no longer parses
 * (t-inject L13), `→ assets/logo.png` wrote text into a PNG (L12), and
 * `.cursorrules → .git/config` broke git (L14). A whole-file writer went
 * further: `project.html → .git/config` replaced git's config.
 *
 * Now a write through a link is allowed only when the file at the end has the
 * link's own name, or when both names are AI context files (CLAUDE.md →
 * AGENTS.md stays allowed). Anything whose real path is inside `.git` is
 * refused, always. The refusal is one line naming the link and its target,
 * and the target is left byte for byte.
 */
import { describe, test, expect } from 'bun:test';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { FAF_CONTEXT_FILES, SafePathError, resolveInside, safeWriteFile } from '../../src/core/safe-write.js';
import { injectFafBlock } from '../../src/interop/inject.js';
import { writeClaudeMd, renderClaudeMd } from '../../src/interop/claude.js';
import { writeAgentsMd } from '../../src/interop/agents.js';
import { writeGeminiMd } from '../../src/interop/gemini.js';
import { writeCursorrules } from '../../src/interop/cursorrules.js';
import { writeCopilotInstructions } from '../../src/interop/copilot-instructions.js';
import { writeMemoryMd } from '../../src/interop/memory.js';
import { writeLlmsTxt } from '../../src/interop/llms.js';
import { writeClaudeMemory } from '../../src/interop/claude-memory.js';
import { writeProjectHtml } from '../../src/interop/projecthtml.js';
import { writeServerCard } from '../../src/interop/servercard.js';
import { writeGrokConfig } from '../../src/interop/grok.js';
import { writeJson } from '../../src/interop/cards.js';
import { serializeFaf, writeFaf } from '../../src/interop/faf.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { Soul } from '../../src/fafm/soul.js';
import { scoreFafYaml } from '../../src/core/scorer.js';

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const DATA: any = {
  project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' },
  stack: { frontend: 'React' },
};
// t-inject fixtures: a 1×1 PNG and a package.json.
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b30000000049454e44ae426082',
  'hex',
);
const PKG = '{\n  "name": "demo"\n}\n';
const README = '# My Project\n\nA real README with install steps.\n\n## Install\n\nnpm i myproject\n';

function project(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), 'faf-links-')));
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

/** A link at `rel` (inside `dir`) pointing at `targetRel`, written relative. */
function link(dir: string, rel: string, targetRel: string): void {
  const at = join(dir, rel);
  mkdirSync(dirname(at), { recursive: true });
  symlinkSync(relative(dirname(at), join(dir, targetRel)), at);
}

const tempsIn = (dir: string): string[] => readdirSync(dir).filter(n => n.endsWith('.faf-tmp'));

interface Injector {
  name: string;
  rel: string;
  write: (dir: string) => unknown;
}
// The 8 injector writers t-inject drives.
const INJECTORS: Injector[] = [
  { name: 'injectFafBlock', rel: 'NOTES.md', write: d => injectFafBlock(join(d, 'NOTES.md'), 'NEW-BODY') },
  { name: 'writeClaudeMd', rel: 'CLAUDE.md', write: d => writeClaudeMd(d, 'NEW-CLAUDE-BODY') },
  { name: 'writeAgentsMd', rel: 'AGENTS.md', write: d => writeAgentsMd(d, DATA) },
  { name: 'writeGeminiMd', rel: 'GEMINI.md', write: d => writeGeminiMd(d, DATA) },
  { name: 'writeCursorrules', rel: '.cursorrules', write: d => writeCursorrules(d, DATA) },
  { name: 'writeCopilotInstructions', rel: '.github/copilot-instructions.md', write: d => writeCopilotInstructions(d, DATA) },
  { name: 'writeMemoryMd', rel: 'MEMORY.md', write: d => writeMemoryMd(d, 'NEW-MEM-BODY') },
  { name: 'writeLlmsTxt', rel: 'llms.txt', write: d => writeLlmsTxt(d, DATA) },
];

describe('BRAKE: an injector never writes through a link to a file with another name (t-inject L12/L13/L14)', () => {
  for (const w of INJECTORS) {
    test.skipIf(!posix)(`${w.name}: ${w.rel} → a PNG, → package.json, → .git/config are refused; each target byte for byte`, () => {
      // L12 — a binary asset.
      const a = project();
      mkdirSync(join(a, 'assets'));
      writeFileSync(join(a, 'assets', 'logo.png'), PNG);
      link(a, w.rel, 'assets/logo.png');
      expect(refusal(() => w.write(a)).reason).toBe('other-file');
      expect(readFileSync(join(a, 'assets', 'logo.png')).equals(PNG)).toBe(true);
      expect(lstatSync(join(a, w.rel)).isSymbolicLink()).toBe(true);

      // L13 — package.json still parses.
      const b = project();
      writeFileSync(join(b, 'package.json'), PKG);
      link(b, w.rel, 'package.json');
      const e13 = refusal(() => w.write(b));
      expect(e13.reason).toBe('other-file');
      expect(readFileSync(join(b, 'package.json'), 'utf-8')).toBe(PKG);
      // One line, naming the link and its target.
      expect(e13.message).not.toContain('\n');
      expect(e13.message).toContain(join(b, w.rel));
      expect(e13.message).toContain(join(b, 'package.json'));

      // L14 — .git/config of a real repo: refused, git still works.
      const c = project();
      execFileSync('git', ['init', '-q', c]);
      const config = readFileSync(join(c, '.git', 'config'));
      link(c, w.rel, '.git/config');
      const e14 = refusal(() => w.write(c));
      expect(e14.reason).toBe('git');
      expect(e14.message).toContain('.git');
      expect(readFileSync(join(c, '.git', 'config')).equals(config)).toBe(true);
      expect(() => execFileSync('git', ['-C', c, 'status', '--short'], { stdio: 'pipe' })).not.toThrow();
      expect(tempsIn(join(c, '.git'))).toEqual([]);
    });
  }

  test.skipIf(!posix)('probe-realink: CLAUDE.md → README.md leaves the README exactly as it was', () => {
    const d = project();
    writeFileSync(join(d, 'README.md'), README);
    symlinkSync('README.md', join(d, 'CLAUDE.md'));
    const e = refusal(() => writeClaudeMd(d, renderClaudeMd(DATA)));
    expect(e.reason).toBe('other-file');
    expect(e.message).toBe(
      `${join(d, 'CLAUDE.md')} is a link to ${join(d, 'README.md')}, a file with another name — refused (faf follows a link only to a file of the same name, or from one AI context file to another).`,
    );
    expect(readFileSync(join(d, 'README.md'), 'utf-8')).toBe(README);

    // The blessed shapes still work and stay links: between AI context files,
    // and to a file of the same name.
    const e2 = project();
    writeFileSync(join(e2, 'AGENTS.md'), 'AGENTS-HAND\n');
    symlinkSync('AGENTS.md', join(e2, 'CLAUDE.md'));
    writeClaudeMd(e2, 'CTX');
    expect(readFileSync(join(e2, 'AGENTS.md'), 'utf-8')).toBe('<!-- faf:start -->\nCTX\n<!-- faf:end -->\n\nAGENTS-HAND\n');
    expect(lstatSync(join(e2, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
    mkdirSync(join(e2, 'docs'));
    writeFileSync(join(e2, 'docs', 'GEMINI.md'), 'GEMINI-HAND\n');
    symlinkSync('docs/GEMINI.md', join(e2, 'GEMINI.md'));
    writeGeminiMd(e2, DATA);
    expect(readFileSync(join(e2, 'docs', 'GEMINI.md'), 'utf-8')).toEndWith('\n\nGEMINI-HAND\n');
  });

  test.skipIf(!posix)('in-project hand text under another name (docs/REAL.md, t-inject L01) is not written through', () => {
    const d = project();
    mkdirSync(join(d, 'docs'));
    writeFileSync(join(d, 'docs', 'REAL.md'), 'REAL-HAND-TEXT\n');
    symlinkSync('docs/REAL.md', join(d, 'CLAUDE.md'));
    expect(refusal(() => writeClaudeMd(d, 'X')).reason).toBe('other-file');
    expect(readFileSync(join(d, 'docs', 'REAL.md'), 'utf-8')).toBe('REAL-HAND-TEXT\n');
  });
});

describe('BRAKE: the AI context set is the injector writers\' own files', () => {
  test('every injector writer writes a name in FAF_CONTEXT_FILES, and every name there has a writer', () => {
    const d = project();
    const home = project();
    for (const w of INJECTORS.filter(i => i.name !== 'injectFafBlock')) {w.write(d);}
    const written = [
      ...readdirSync(d).filter(n => !n.startsWith('.') || n === '.cursorrules'),
      ...readdirSync(join(d, '.github')),
    ];
    const mem = writeClaudeMemory(d, DATA, { memoryDir: join(home, 'mem') });
    written.push(basename(mem.path));
    expect([...new Set(written)].sort()).toEqual(Object.values(FAF_CONTEXT_FILES).slice().sort());
  });

  test.skipIf(!posix)('a link between two context files is followed; to any other name it is refused', () => {
    const d = project();
    writeFileSync(join(d, 'AGENTS.md'), 'a\n');
    writeFileSync(join(d, 'llms.txt'), 'l\n');
    writeFileSync(join(d, 'notes.txt'), 'n\n');
    symlinkSync('AGENTS.md', join(d, 'CLAUDE.md'));
    symlinkSync('llms.txt', join(d, 'GEMINI.md'));
    symlinkSync('notes.txt', join(d, 'MEMORY.md'));
    expect(resolveInside(d, 'CLAUDE.md')).toBe(join(d, 'AGENTS.md'));
    expect(resolveInside(d, 'GEMINI.md')).toBe(join(d, 'llms.txt'));
    expect(refusal(() => resolveInside(d, 'MEMORY.md')).reason).toBe('other-file');
    expect(refusal(() => safeWriteFile(join(d, 'MEMORY.md'), 'x')).reason).toBe('other-file');
    expect(readFileSync(join(d, 'notes.txt'), 'utf-8')).toBe('n\n');
  });
});

interface Whole {
  name: string;
  rel: string;
  write: (dir: string) => unknown;
}
// Whole-file writers: project.html, the Server Card, *.json (cards), the grok
// config, .faf, .fafm and .faf-dna.
const WHOLE: Whole[] = [
  { name: 'writeProjectHtml', rel: 'project.html', write: d => writeProjectHtml(d, DATA, scoreFafYaml(serializeFaf(DATA))) },
  { name: 'writeServerCard', rel: 'server-card', write: d => writeServerCard(d, DATA) },
  { name: 'writeJson (faf cards)', rel: '.well-known/agent-card.json', write: d => writeJson(join(d, '.well-known', 'agent-card.json'), { a: 1 }, d) },
  { name: 'writeGrokConfig', rel: '.grok/config.toml', write: d => writeGrokConfig(d, DATA) },
  { name: 'writeFaf (update)', rel: 'project.faf', write: d => writeFaf(join(d, 'project.faf'), DATA) },
  { name: 'writeFaf (replace)', rel: 'project.faf', write: d => writeFaf(join(d, 'project.faf'), DATA, { replace: true }) },
  { name: 'FafmSoul.save', rel: 'soul.fafm', write: d => new Soul('@demo').save(join(d, 'soul.fafm')) },
  { name: 'FafDNAManager.birth', rel: '.faf-dna', write: d => new FafDNAManager(d).birth(42) },
];

describe('BRAKE: a whole-file writer never writes through a link to a differently named file', () => {
  for (const w of WHOLE) {
    test.skipIf(!posix)(`${w.name}: ${w.rel} → a file with another name, and → .git/config, are refused`, () => {
      const d = project();
      // The other file has content every writer would otherwise accept.
      const other = w.rel.endsWith('.faf') ? 'config/team.faf' : w.rel.endsWith('.fafm') ? 'notes.fafm' : 'package.json';
      const body = other.endsWith('.json') ? PKG : 'project:\n  name: team # HAND\n';
      mkdirSync(dirname(join(d, other)), { recursive: true });
      writeFileSync(join(d, other), body);
      link(d, w.rel, other);
      const e = refusal(() => w.write(d));
      expect(e.reason).toBe('other-file');
      expect(e.message).not.toContain('\n');
      expect(readFileSync(join(d, other), 'utf-8')).toBe(body);

      const g = project();
      execFileSync('git', ['init', '-q', g]);
      const config = readFileSync(join(g, '.git', 'config'));
      link(g, w.rel, '.git/config');
      expect(refusal(() => w.write(g)).reason).toBe('git');
      expect(readFileSync(join(g, '.git', 'config')).equals(config)).toBe(true);
      expect(() => execFileSync('git', ['-C', g, 'status', '--short'], { stdio: 'pipe' })).not.toThrow();
    });
  }

  test.skipIf(!posix)('a link to a file of the same name is still written through (project.html → site/project.html)', () => {
    const d = project();
    mkdirSync(join(d, 'site'));
    writeFileSync(join(d, 'site', 'project.html'), 'old');
    symlinkSync('site/project.html', join(d, 'project.html'));
    writeProjectHtml(d, DATA, scoreFafYaml(serializeFaf(DATA)));
    expect(readFileSync(join(d, 'site', 'project.html'), 'utf-8')).toContain('<!DOCTYPE html>');
    expect(lstatSync(join(d, 'project.html')).isSymbolicLink()).toBe(true);
    // …and a .faf-dna link to a file with another name is not grown either.
    const e = project();
    mkdirSync(join(e, 'docs'));
    const dna = new FafDNAManager(join(e, 'docs'));
    dna.birth(20);
    const text = readFileSync(join(e, 'docs', '.faf-dna'), 'utf-8');
    writeFileSync(join(e, 'docs', 'dna.json'), text);
    symlinkSync('docs/dna.json', join(e, '.faf-dna'));
    expect(new FafDNAManager(e).recordGrowth(60, ['x'])).toBeNull();
    expect(readFileSync(join(e, 'docs', 'dna.json'), 'utf-8')).toBe(text);
  });
});

describe('BRAKE: anything inside .git is refused, link or not', () => {
  test.skipIf(!posix)('a direct path, a linked folder into .git, and .git itself', () => {
    const d = project();
    execFileSync('git', ['init', '-q', d]);
    const config = readFileSync(join(d, '.git', 'config'));
    expect(refusal(() => injectFafBlock(join(d, '.git', 'config'), 'X')).reason).toBe('git');
    expect(refusal(() => safeWriteFile(join(d, '.git', 'info', 'faf.json'), '{}')).reason).toBe('git');
    expect(existsSync(join(d, '.git', 'info', 'faf.json'))).toBe(false);
    symlinkSync('.git', join(d, 'docs'));
    const e = refusal(() => safeWriteFile(join(d, 'docs', 'config'), 'X', { root: d }));
    expect(e.reason).toBe('git');
    expect(e.message).toBe(`${join(d, 'docs', 'config')} resolves to ${join(d, '.git', 'config')}, inside .git/ — refused.`);
    expect(refusal(() => resolveInside(d, '.git')).reason).toBe('git');
    expect(readFileSync(join(d, '.git', 'config')).equals(config)).toBe(true);
  });
});

describe('BRAKE: the CLI refuses in one line (the .git/config end-to-end)', () => {
  const run = (cwd: string, args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, HOME: realpathSync(mkdtempSync(join(tmpdir(), 'faf-links-home-'))), NO_COLOR: '1' },
    });

  for (const [flag, rel] of [['--cursor', '.cursorrules'], ['--html', 'project.html']] as const) {
    test.skipIf(!posix)(`faf export ${flag} with ${rel} → .git/config: exit 1, one line, git's config untouched`, () => {
      const d = project();
      execFileSync('git', ['init', '-q', d]);
      writeFileSync(join(d, 'project.faf'), serializeFaf(DATA));
      const config = readFileSync(join(d, '.git', 'config'));
      symlinkSync('.git/config', join(d, rel));
      const r = run(d, ['export', flag]);
      expect(r.status).toBe(1);
      expect(r.stderr.trim().split('\n')).toEqual([
        `faf: ${join(d, rel)} is a link to ${join(d, '.git', 'config')}, inside .git/ — refused. Nothing was read from or written to it.`,
      ]);
      expect(readFileSync(join(d, '.git', 'config')).equals(config)).toBe(true);
      expect(() => execFileSync('git', ['-C', d, 'status', '--short'], { stdio: 'pipe' })).not.toThrow();
    });
  }
});
