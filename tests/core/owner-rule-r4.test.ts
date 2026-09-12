/**
 * BRAKE: the owner rule, round 4 (R4a) — the round-3 re-check's cases, fixed
 * at the source:
 *
 *   P01-P05, P07, P08, P10  a mark only shows that faf wrote a whole file once:
 *        a hand edit made after that (a `tools` list on the Server Card, a
 *        section on project.html, a note on a taf snapshot) was lost on the
 *        next write. Now every whole file faf renders records a render hash,
 *        and faf replaces the file only while it is byte for byte what faf
 *        last wrote. A file from before 7.13 (mark, no hash) is faf's only
 *        when it is exactly faf's render; else it is refused once.
 *   P06  `faf cards --target catalog` matched the user's own A2A row (another
 *        agent) by type and URL, and replaced its url and date. Now only a
 *        row whose identifier is exactly faf's is updated, as a text edit.
 *   P09  `faf compile project.FAF` / `notes.fafm` took the source's own path
 *        as the output, and --force wrote the binary over the source.
 *   G01-G03  `faf diff --install-driver` / `--uninstall-driver` overwrote or
 *        unset a `diff.faf.command` of the user's own.
 *   recover  `faf recover` read AGENTS.md through a link out of the project
 *        (a secret became project.name) and read cp1252 text as U+FFFD.
 *   CL1  `faf clear` removed any `faf-git-*` folder in TMPDIR.
 *   J15/J16  `faf server-card` replaced an object or array `title`/`name`.
 *   H12  a read-only hook (and any "not written; original kept" failure at
 *        the top level) printed a stack trace.
 *   lib  a new soul saved over an existing file said "changed on disk".
 *   types  ProjectHtmlWriteOptions and CardWriteOptions were not exported.
 *
 * Every test here runs the CLI with HOME (and, where it matters, TMPDIR) set
 * to a folder of its own, and removes its folders when the suite ends.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { execFileSync, spawnSync } from 'child_process';
import * as ts from 'typescript';
import { patchServerJson } from '../../src/interop/servercard.js';
import { JsonEditError } from '../../src/core/json-edit.js';
import { makeTempDir, removeStaleTempDirs, SafePathError } from '../../src/core/safe-write.js';
import { installHooks } from '../../src/commands/hooks.js';
import { Soul } from '../../src/fafm/soul.js';

const posix = process.platform !== 'win32';
const root = process.getuid?.() === 0; // root writes through read-only modes
const CLI = join(import.meta.dir, '../../src/cli.ts');
const made: string[] = [];
const mk = (tag: string): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), `faf-r4-${tag}-`)));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

function run(cwd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, HOME: mk('home'), NO_COLOR: '1', CI: '1', GIT_CONFIG_NOSYSTEM: '1', ...env },
  });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const lines = (s: string): string[] => s.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '')).filter(l => l.trim() !== '');
const sha = (text: string): string => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
const read = (p: string): string => readFileSync(p, 'utf-8');

const FAF = 'project:\n  name: demo\n  title: Demo Server\n  goal: A demo MCP server\n  main_language: TypeScript\n  version: 1.2.3\n  homepage: https://example.com\n  type: server-card\n';
const FAFA = 'agent:\n  name: demo-agent\n  displayName: Demo Agent\n  description: A demo agent\n  version: 1.0.0\n  vendor: Example\n  homepage: https://example.com\nendpoints:\n  - protocol: a2a\n    location: https://example.com/a2a\ncapabilities:\n  - name: summarize\n    description: Summarize text\n';
function project(): string {
  const d = mk('p');
  writeFileSync(join(d, 'project.faf'), FAF);
  writeFileSync(join(d, 'agent.fafa'), FAFA);
  return d;
}
const edited = (p: string): string => `${p} was edited since faf wrote it — faf left it unchanged. Use --force to replace it.`;
const pre713 = (p: string): string =>
  `${p} has no faf render hash (written before 7.13), so faf cannot tell whether it was edited — faf left it unchanged. Use --force once to replace it; after that faf recognises its own output.`;

/** Whether the render hash a JSON file carries is the hash of the file
 *  without it: faf adds the key on a line of its own with a comma (into a
 *  `_meta` that is there), or adds a `_meta` holding only the key. */
function hashFits(text: string): boolean {
  const own = /\n[ \t]*"_meta": \{\n[ \t]*"one\.faf\/render": "(sha256:[0-9a-f]{64})"\n[ \t]*\},/.exec(text)
    ?? /\n[ \t]*"one\.faf\/render": "(sha256:[0-9a-f]{64})",/.exec(text);
  return own !== null && sha(text.slice(0, own.index) + text.slice(own.index + own[0].length)) === own[1];
}

describe('BRAKE: a whole file faf renders carries a render hash, and faf replaces it only while it is byte for byte faf\'s (P01-P05, P07, P08, P10)', () => {
  test('every whole file faf renders records the hash of its own content', () => {
    const d = project();
    writeFileSync(join(d, 'server.json'), `${JSON.stringify({ name: 'x/y', description: 'D', version: '1.0.0' }, null, 2)}\n`);
    mkdirSync(join(d, 'dist'));
    expect(run(d, ['export', '--html', '--card']).status).toBe(0);
    expect(run(d, ['cards', '--target', 'a2a']).status).toBe(0);
    expect(run(d, ['taf', '--output', 'receipt.json']).status).toBe(0);
    expect(run(d, ['server-card', '--out', 'dist/server.json']).status).toBe(0);

    const html = read(join(d, 'project.html'));
    const line = /^<meta name="faf-render" content="(sha256:[0-9a-f]{64})">\n/m.exec(html);
    expect(line).not.toBeNull();
    expect(sha(html.replace(line![0], ''))).toBe(line![1]);
    for (const f of ['server-card', '.well-known/agent-card.json', 'receipt.json', 'dist/server.json']) {
      const text = read(join(d, f));
      expect(JSON.parse(text)._meta['one.faf/render']).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(hashFits(text)).toBe(true);
    }
  });

  test('P01/P05: a hand edit to a card faf wrote is refused in one line, the card byte for byte; --force replaces it, and faf recognises its own output after that', () => {
    const d = project();
    expect(run(d, ['export', '--card']).status).toBe(0);
    const f = join(d, 'server-card');
    const card = JSON.parse(read(f));
    card.tools = [{ name: 'HAND-TOOL', description: 'added by hand' }];
    const hand = `${JSON.stringify(card, null, 2)}\n`;
    writeFileSync(f, hand);
    const r = run(d, ['export', '--card']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${edited(f)}`]);
    expect(read(f)).toBe(hand);

    expect(run(d, ['cards', '--target', 'a2a']).status).toBe(0);
    const a = join(d, '.well-known', 'agent-card.json');
    const a2a = JSON.parse(read(a));
    a2a.securitySchemes = { hand: { type: 'http', scheme: 'bearer', description: 'HAND-AUTH' } };
    const handA2a = `${JSON.stringify(a2a, null, 2)}\n`;
    writeFileSync(a, handA2a);
    const c = run(d, ['cards', '--target', 'a2a']);
    expect(c.status).toBe(1);
    expect(lines(c.err)).toEqual([`faf: ${edited(a)}`]);
    expect(read(a)).toBe(handA2a);

    expect(run(d, ['export', '--card', '--force']).status).toBe(0);
    expect(read(f)).not.toContain('HAND-TOOL');
    expect(run(d, ['export', '--card']).status).toBe(0); // faf's own card again: no flag
  });

  test('P03: a section added to a project.html faf rendered is refused (faf show and faf export --html), the page byte for byte', () => {
    const d = project();
    expect(run(d, ['show']).status).toBe(0);
    const f = join(d, 'project.html');
    const hand = read(f).replace('</body>', '<section id="hand">HAND-SECTION: our deploy notes</section>\n</body>');
    writeFileSync(f, hand);
    for (const args of [['show'], ['export', '--html']]) {
      const r = run(d, args);
      expect(r.status).toBe(1);
      expect(lines(r.err)).toEqual([`faf: ${edited(f)}`]);
      expect(read(f)).toBe(hand);
    }
  });

  test('P07/P08: faf server-card --out and faf taf --output refuse an output faf wrote that was edited since', () => {
    const d = project();
    writeFileSync(join(d, 'server.json'), `${JSON.stringify({ name: 'x/y', description: 'D', version: '1.0.0' }, null, 2)}\n`);
    mkdirSync(join(d, 'dist'));
    expect(run(d, ['server-card', '--out', 'dist/server.json']).status).toBe(0);
    const out = join(d, 'dist', 'server.json');
    const j = JSON.parse(read(out));
    j.packages = [{ registryType: 'npm', identifier: 'HAND-PACKAGE', version: '1.0.0' }];
    const hand = `${JSON.stringify(j, null, 2)}\n`;
    writeFileSync(out, hand);
    const r = run(d, ['server-card', '--out', 'dist/server.json']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${edited(out)}`]);
    expect(read(out)).toBe(hand);

    expect(run(d, ['taf', '--output', 'receipt.json']).status).toBe(0);
    const rec = join(d, 'receipt.json');
    const snap = JSON.parse(read(rec));
    snap.notes = 'HAND-NOTE: audited by QA';
    const handSnap = JSON.stringify(snap, null, 2);
    writeFileSync(rec, handSnap);
    const t = run(d, ['taf', '--output', 'receipt.json']);
    expect(t.status).toBe(1);
    expect(lines(t.err).filter(l => l.startsWith('faf: '))).toEqual([`faf: ${edited(rec)}`]);
    expect(read(rec)).toBe(handSnap);
  });

  test('P02/P04/P08: a file from before 7.13 (faf\'s mark, no hash) is refused once unless it is exactly faf\'s render', () => {
    const d = project();
    const card = join(d, 'server-card');
    const hand = `${JSON.stringify({ name: 'io.github.me/HAND-NAME', description: 'HAND-DESCRIPTION', version: '9.9.9', remotes: [{ type: 'sse', url: 'https://HAND-ENDPOINT.example/sse' }], _meta: { 'one.faf/context': { faf: './project.faf' } } }, null, 2)}\n`;
    writeFileSync(card, hand);
    const r = run(d, ['export', '--card']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${pre713(card)}`]);
    expect(read(card)).toBe(hand);

    const page = join(d, 'project.html');
    const handPage = '<!doctype html>\n<html><head>\n<meta name="description" content="Visual render of project.faf. Authored by faf — humans like visuals, we gave them one.">\n<title>HAND PAGE</title></head>\n<body><h1>HAND-WRITTEN PAGE</h1></body></html>\n';
    writeFileSync(page, handPage);
    const s = run(d, ['show']);
    expect(s.status).toBe(1);
    expect(lines(s.err)).toEqual([`faf: ${pre713(page)}`]);
    expect(read(page)).toBe(handPage);

    const rec = join(d, 'receipt.json');
    const handSnap = JSON.stringify({ taf_version: '1.0.0', notes: 'HAND-NOTE: audited by QA on 2026-01-02', score: 50 }, null, 2);
    writeFileSync(rec, handSnap);
    expect(run(d, ['taf', '--output', 'receipt.json']).status).toBe(1);
    expect(read(rec)).toBe(handSnap);

    // --force once, and faf recognises its own output after that.
    expect(run(d, ['show', '--force']).status).toBe(0);
    expect(read(page)).toContain('<meta name="faf-render" content="sha256:');
    expect(run(d, ['show']).status).toBe(0);
  });

  test('a page from before 7.13 that is exactly faf\'s render of the current project.faf is faf\'s: left as it is, no refusal', async () => {
    const d = project();
    const { renderProjectHtml } = await import('../../src/interop/projecthtml.js');
    const { scoreFafYaml } = await import('../../src/core/scorer.js');
    const { readFaf } = await import('../../src/interop/faf.js');
    const fafPath = join(d, 'project.faf');
    const old = renderProjectHtml(readFaf(fafPath), scoreFafYaml(FAF), fafPath);
    const page = join(d, 'project.html');
    writeFileSync(page, old);
    const ino = statSync(page).ino;
    const r = run(d, ['export', '--html']);
    expect(r.status).toBe(0);
    expect(read(page)).toBe(old);
    expect(statSync(page).ino).toBe(ino); // not written at all
  });

  test('P10: a multi-target faf export with refusals finishes the other targets, prints each refusal in one line, and exits 1', () => {
    const d = project();
    expect(run(d, ['export']).status).toBe(0);
    const page = join(d, 'project.html');
    writeFileSync(page, read(page).replace('</body>', '<p>HAND-DEPLOY-NOTES: prod is eu-west-1</p>\n</body>'));
    const pageHand = read(page);
    // A page of the user's that faf never wrote goes first; the card is faf's.
    rmSync(join(d, 'AGENTS.md'));
    const card = join(d, 'server-card');
    const j = JSON.parse(read(card));
    j.remotes = [{ type: 'streamable-http', url: 'https://HAND-PROD-ENDPOINT.example/mcp' }];
    const cardHand = `${JSON.stringify(j, null, 2)}\n`;
    writeFileSync(card, cardHand);
    const r = run(d, ['export']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${edited(page)}`, `faf: ${edited(card)}`]);
    expect(read(page)).toBe(pageHand);
    expect(read(card)).toBe(cardHand);
    expect(existsSync(join(d, 'AGENTS.md'))).toBe(true); // the other targets still ran

    // A page faf never wrote does not stop the card either.
    const e = project();
    writeFileSync(join(e, 'project.html'), '<h1>HAND-PAGE</h1>\n');
    const s = run(e, ['export', '--html', '--card']);
    expect(s.status).toBe(1);
    expect(read(join(e, 'project.html'))).toBe('<h1>HAND-PAGE</h1>\n');
    expect(JSON.parse(read(join(e, 'server-card')))._meta['one.faf/context']).toBeDefined();
  });
});

describe('BRAKE: faf cards --target catalog updates only a row whose identifier is exactly faf\'s (P06)', () => {
  test('the user\'s own A2A row for another agent stays byte for byte; faf\'s row is appended; faf\'s own row is updated in place', () => {
    const d = project();
    mkdirSync(join(d, '.well-known'));
    const f = join(d, '.well-known', 'ai-catalog.json');
    const partner = { identifier: 'urn:air:partner.example:a2a:HAND-PARTNER-AGENT', displayName: 'Partner agent (hand)', type: 'application/a2a-agent-card+json', url: 'https://partner.example/.well-known/agent-card.json#HAND-PARTNER-URL', updatedAt: '2025-01-01T00:00:00.000Z' };
    const before = `${JSON.stringify({ specVersion: '1.0', entries: [partner] }, null, 2)}\n`;
    writeFileSync(f, before);
    expect(run(d, ['cards', '--target', 'catalog']).status).toBe(0);
    const after = read(f);
    const upToPartner = before.slice(0, before.lastIndexOf('}', before.lastIndexOf(']')) + 1);
    expect(after.startsWith(upToPartner)).toBe(true);
    const cat = JSON.parse(after);
    expect(cat.entries[0]).toEqual(partner);
    expect(cat.entries.map((e: { identifier: string }) => e.identifier)).toEqual([partner.identifier, 'urn:air:example.com:a2a:demo-agent', 'urn:air:example.com:agent:demo-agent']);

    // faf's own row, with a hand displayName and tags: only url / type / updatedAt move.
    const own = after.replace('"displayName": "Demo Agent"', '"displayName": "HAND NAME", "tags": ["HAND"]').replace('"url": "https://example.com/.well-known/agent-card.json"', '"url": "https://old.example/card.json"');
    writeFileSync(f, own);
    expect(run(d, ['cards', '--target', 'catalog', '--a2a-url', 'https://example.com/card.json']).status).toBe(0);
    const again = read(f);
    expect(again).toContain('"displayName": "HAND NAME", "tags": ["HAND"]');
    expect(again).toContain('"url": "https://example.com/card.json"');
    expect(again.startsWith(upToPartner)).toBe(true);

    // A catalog faf cannot edit row by row is refused in one line, byte for byte.
    const odd = '{\n  "specVersion": "1.0",\n  "entries": {"HAND": "not a list"}\n}\n';
    writeFileSync(f, odd);
    const r = run(d, ['cards', '--target', 'catalog']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${f}: "entries" is not an array, so faf cannot add its rows to it — faf cannot change only its own rows, so it left the file unchanged.`]);
    expect(read(f)).toBe(odd);
  });
});

describe('BRAKE: faf compile never writes the .fafb over its source (P09)', () => {
  test('project.FAF → project.fafb and notes.fafm → notes.fafm.fafb; --output equal to the source is refused, --force included', () => {
    for (const [name, out] of [['project.FAF', 'project.fafb'], ['notes.fafm', 'notes.fafm.fafb']]) {
      const d = mk('c');
      writeFileSync(join(d, name), FAF);
      const r = run(d, ['compile', name, '--force']);
      expect(r.status).toBe(0);
      expect(read(join(d, name))).toBe(FAF);
      expect(readFileSync(join(d, out)).subarray(0, 4).toString()).toBe('FAFB');
    }
    const d = mk('c');
    writeFileSync(join(d, 'project.faf'), FAF);
    const r = run(d, ['compile', 'project.faf', '--output', 'project.faf', '--force']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([`faf: ${join(d, 'project.faf')} is the file being compiled — faf does not write the .fafb over its source, and left it unchanged. Name another output with --output.`]);
    expect(read(join(d, 'project.faf'))).toBe(FAF);
  });
});

describe('BRAKE: faf diff --install-driver / --uninstall-driver touch only faf\'s own diff.faf.command (G01-G03)', () => {
  const repo = (): { d: string; home: string; git: (a: string[]) => string } => {
    const d = mk('g');
    const home = mk('ghome');
    const git = (a: string[]): string =>
      execFileSync('git', a, { cwd: d, encoding: 'utf-8', env: { ...process.env, HOME: home, GIT_CONFIG_NOSYSTEM: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
    git(['init', '-q']);
    writeFileSync(join(d, 'project.faf'), FAF);
    return { d, home, git };
  };

  test('G01/G02: a driver of the user\'s own is neither overwritten nor unset — one line, exit 1, config and .gitattributes untouched', () => {
    const { d, home, git } = repo();
    git(['config', 'diff.faf.command', 'my-own-faf-differ --color # HAND-DRIVER']);
    const cfg = read(join(d, '.git', 'config'));
    const i = run(d, ['diff', '--install-driver'], { HOME: home });
    expect(i.status).toBe(1);
    expect(lines(i.err)).toEqual([
      `faf: diff.faf.command is already set to "my-own-faf-differ --color # HAND-DRIVER", not faf's driver (faf-cli diff-driver) — faf left your git config and .gitattributes unchanged.`,
    ]);
    expect(read(join(d, '.git', 'config'))).toBe(cfg);
    expect(existsSync(join(d, '.gitattributes'))).toBe(false);

    const u = run(d, ['diff', '--uninstall-driver'], { HOME: home });
    expect(u.status).toBe(1);
    expect(lines(u.err)).toEqual([
      `faf: diff.faf.command is "my-own-faf-differ --color # HAND-DRIVER", not faf's driver (faf-cli diff-driver) — faf left your git config unchanged.`,
    ]);
    expect(read(join(d, '.git', 'config'))).toBe(cfg);

    // faf's own value is set when unset and unset when it is exactly faf's.
    git(['config', '--unset', 'diff.faf.command']);
    expect(run(d, ['diff', '--install-driver'], { HOME: home }).status).toBe(0);
    expect(git(['config', '--get', 'diff.faf.command']).trim()).toBe('faf-cli diff-driver');
    expect(run(d, ['diff', '--uninstall-driver'], { HOME: home }).status).toBe(0);
    expect(() => git(['config', '--get', 'diff.faf.command'])).toThrow();
  });

  test('G03: a multi-valued diff.faf.command is refused in one line (no git error, no stack trace)', () => {
    const { d, home, git } = repo();
    git(['config', '--add', 'diff.faf.command', 'first-value-HAND']);
    git(['config', '--add', 'diff.faf.command', 'faf-cli diff-driver']);
    const cfg = read(join(d, '.git', 'config'));
    const r = run(d, ['diff', '--install-driver'], { HOME: home });
    expect(r.status).toBe(1);
    expect(lines(r.err)).toEqual([
      `faf: diff.faf.command is already set to "first-value-HAND", "faf-cli diff-driver", not faf's driver (faf-cli diff-driver) — faf left your git config and .gitattributes unchanged.`,
    ]);
    const u = run(d, ['diff', '--uninstall-driver'], { HOME: home });
    expect(u.status).toBe(1);
    expect(lines(u.err)).toHaveLength(1);
    expect(read(join(d, '.git', 'config'))).toBe(cfg);
  });
});

describe('BRAKE: faf recover reads its sources inside the project, as UTF-8', () => {
  test.skipIf(!posix)('AGENTS.md linked to a secret outside the project is refused in one line; nothing of it reaches project.faf', () => {
    const b = mk('rec');
    mkdirSync(join(b, 'outside'));
    mkdirSync(join(b, 'proj'));
    writeFileSync(join(b, 'outside', 'secret.md'), '# SECRET-TOKEN-abc123\naws_secret_access_key = hunter2\n');
    symlinkSync('../outside/secret.md', join(b, 'proj', 'AGENTS.md'));
    const r = run(join(b, 'proj'), ['recover']);
    expect(r.status).toBe(1);
    expect(lines(r.err)[0]).toBe(
      `faf: ${join(b, 'proj', 'AGENTS.md')} is a link to ${join(b, 'outside', 'secret.md')}, outside ${join(b, 'proj')} — refused. Nothing was read from or written to it.`,
    );
    expect(existsSync(join(b, 'proj', 'project.faf'))).toBe(false);
    expect(r.out + r.err).not.toContain('SECRET-TOKEN');
  });

  test('a cp1252 AGENTS.md is refused as not UTF-8 and skipped — never turned into U+FFFD', () => {
    const d = mk('rec');
    writeFileSync(join(d, 'AGENTS.md'), Buffer.from('# Caf\xe9 app\n', 'latin1'));
    const r = run(d, ['recover']);
    expect(r.status).toBe(1);
    expect(lines(r.err)[0]).toBe(`faf: ${join(d, 'AGENTS.md')} is not UTF-8 — faf left it unchanged`);
    expect(existsSync(join(d, 'project.faf'))).toBe(false);

    writeFileSync(join(d, 'CLAUDE.md'), '# Notes\n- **Name:** real-name\n');
    const s = run(d, ['recover']);
    expect(s.status).toBe(0);
    expect(read(join(d, 'project.faf'))).toContain('name: real-name');
    expect(read(join(d, 'project.faf'))).not.toContain('�');
  });
});

describe('BRAKE: faf clear removes only folders faf made (CL1)', () => {
  test.skipIf(!posix)('the mkdtemp shape AND faf\'s marker: a hand folder, a look-alike without the marker and a link all stay', () => {
    const tmp = mk('tmpdir');
    mkdirSync(join(tmp, 'faf-git-my-notes'));
    writeFileSync(join(tmp, 'faf-git-my-notes', 'NOTES.md'), '# HAND notes\n');
    mkdirSync(join(tmp, 'faf-git-AbC123'));
    writeFileSync(join(tmp, 'faf-git-AbC123', 'x'), 'looks like mkdtemp\n');
    const outside = mk('outside');
    writeFileSync(join(outside, 'KEEP.md'), 'HAND-OUTSIDE\n');
    symlinkSync(outside, join(tmp, 'faf-git-link'));
    const was = process.env.TMPDIR;
    process.env.TMPDIR = tmp;
    let ours: string;
    let removed: number;
    try {
      ours = makeTempDir('faf-git-');
      expect(readdirSync(ours)).toEqual(['.faf-temp']); // faf's marker
      removed = removeStaleTempDirs('faf-git-');
    } finally {
      if (was === undefined) {delete process.env.TMPDIR;} else {process.env.TMPDIR = was;}
    }
    expect(removed).toBe(1);
    expect(existsSync(ours)).toBe(false);
    expect(read(join(tmp, 'faf-git-my-notes', 'NOTES.md'))).toBe('# HAND notes\n');
    expect(read(join(tmp, 'faf-git-AbC123', 'x'))).toBe('looks like mkdtemp\n');
    expect(lstatSync(join(tmp, 'faf-git-link')).isSymbolicLink()).toBe(true);
    expect(read(join(outside, 'KEEP.md'))).toBe('HAND-OUTSIDE\n');
    const r = run(mk('cwd'), ['clear'], { TMPDIR: tmp });
    expect(r.status).toBe(0);
    expect(existsSync(join(tmp, 'faf-git-my-notes'))).toBe(true);
  });
});

describe('BRAKE: the JSON editor refuses to replace an object or array with a value (J15, J16)', () => {
  test('patchServerJson and faf server-card refuse in one line; the file stays byte for byte', () => {
    const meta = { 'io.modelcontextprotocol.registry/publisher-provided': { 'one.faf/context': { faf: './project.faf' } } };
    const title = '{\n  "name": "a/b",\n  "title": {"en": "HAND-EN", "fr": "HAND-FR"}\n}\n';
    const name = '{\n  "name": ["HAND-ARRAY-NAME"],\n  "version": "1"\n}\n';
    const refuse = (text: string, id: { name: string; title?: string }): JsonEditError => {
      try {
        patchServerJson(text, { ...id, meta });
      } catch (e) {
        if (e instanceof JsonEditError) {return e;}
        throw e;
      }
      throw new Error('expected a JsonEditError');
    };
    expect(refuse(title, { name: 'com.example/demo', title: 'Demo Title' }).message).toBe('"title" is an object, so faf will not replace it with a value');
    expect(refuse(name, { name: 'com.example/demo' }).message).toBe('"name" is an array, so faf will not replace it with a value');

    const d = project();
    writeFileSync(join(d, 'server.json'), title);
    const r = run(d, ['server-card']);
    expect(r.status).toBe(1);
    expect(lines(r.err)).toHaveLength(1);
    expect(read(join(d, 'server.json'))).toBe(title);
  });
});

describe('BRAKE: "not written; original kept" is one line, never a stack trace (H12)', () => {
  test.skipIf(!posix || root)('a read-only hand hook: installHooks says it in one line; faf hooks --install and the top-level handler print one line', () => {
    const d = mk('hk');
    execFileSync('git', ['init', '-q', d], { env: { ...process.env, HOME: mk('ghome'), GIT_CONFIG_NOSYSTEM: '1' } });
    const hook = join(d, '.git', 'hooks', 'pre-commit');
    writeFileSync(hook, '#!/bin/sh\necho HAND-HOOK\n');
    chmodSync(hook, 0o444);
    const errs: string[] = [];
    const orig = console.error;
    const log = console.log;
    console.error = (...a: unknown[]) => errs.push(a.join(' '));
    console.log = () => {};
    let ok: boolean;
    try {
      ok = installHooks(d, { runnerCmd: `${process.execPath} ${CLI} hooks-run` });
    } finally {
      console.error = orig;
      console.log = log;
    }
    expect(ok).toBe(false);
    expect(errs).toEqual([`Error: ${hook}: not written; original kept (EACCES)`]);
    expect(read(hook)).toBe('#!/bin/sh\necho HAND-HOOK\n');

    const r = run(d, ['hooks', '--install']);
    expect(r.status).toBe(2);
    expect(lines(r.err)).toEqual([`Error: ${hook}: not written; original kept (EACCES)`]);

    // The top-level handler: faf show over a read-only page faf wrote.
    const p = project();
    expect(run(p, ['show']).status).toBe(0);
    chmodSync(join(p, 'project.html'), 0o444);
    writeFileSync(join(p, 'project.faf'), FAF.replace('A demo MCP server', 'A new goal'));
    const s = run(p, ['show']);
    expect(s.status).toBe(1);
    expect(lines(s.err)).toEqual([`faf: ${join(p, 'project.html')}: not written; original kept (EACCES)`]);
  });
});

describe('BRAKE: a new soul saved over an existing file says so (lib-claims)', () => {
  test('"<file> already exists — not written; pass { replace: true } (faf memory convert --force) to replace it"', () => {
    const d = mk('soul');
    const p = join(d, 'soul.fafm');
    writeFileSync(p, 'namepoint: "@hand"\n');
    let e: unknown;
    try {
      new Soul('@new').save(p);
    } catch (err) {
      e = err;
    }
    expect(e).toBeInstanceOf(SafePathError);
    expect((e as SafePathError).message).toBe(`${p} already exists — not written; pass { replace: true } (faf memory convert --force) to replace it`);
    expect(read(p)).toBe('namepoint: "@hand"\n');
  });
});

describe('PIT: the write options types are exported from the package root', () => {
  test('ProjectHtmlWriteOptions and CardWriteOptions', () => {
    const file = join(import.meta.dir, '../../src/index.ts');
    const src = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    const names = new Set<string>();
    for (const st of src.statements) {
      if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) {names.add(el.name.text);}
      }
    }
    expect(names.has('ProjectHtmlWriteOptions')).toBe(true);
    expect(names.has('CardWriteOptions')).toBe(true);
  });
});
