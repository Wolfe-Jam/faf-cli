/**
 * BRAKE: a whole file faf renders replaces only a file faf wrote — 7.13 round
 * 3, R3a.2 (round-1 W01-W03, fresh K13).
 *
 * project.html, the Server Card (`server-card`), the A2A Agent Card
 * (`.well-known/agent-card.json`) and the `faf cards` catalog are whole files.
 * Round 2 routed them through safe-write, so a link out was refused, but a
 * hand-written file at the same name — or behind a same-name link
 * (`project.html → docs/project.html`) — was still replaced whole.
 *
 * Round 3 replaced a file only when it carried faf's own mark (project.html's
 * `Visual render of project.faf` description line, the Server Card's
 * `_meta["one.faf/context"]`, the A2A card's FAF context extension). Round 4
 * goes further (owner-rule-r4.test.ts): the file must be byte for byte what
 * faf last wrote, proved by the render hash it carries; a file from before
 * 7.13 (mark, no hash) is faf's only when it is exactly faf's render. Any other
 * file is refused in one line and kept byte for byte; `--force` replaces it,
 * as `faf init --force` does.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { SafePathError } from '../../src/core/safe-write.js';
import { renderProjectHtml, writeProjectHtml } from '../../src/interop/projecthtml.js';
import { buildServerCard, writeServerCard } from '../../src/interop/servercard.js';
import { buildA2ACard, writeJson } from '../../src/interop/cards.js';
import { RENDER_KEY } from '../../src/core/render-hash.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { serializeFaf } from '../../src/interop/faf.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const mk = (tag: string): string => realpathSync(tempFolders.mkdtemp(join(tmpdir(), `faf-owned-${tag}-`)));
const DATA: any = { project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' }, stack: { frontend: 'React' } };
const SCORE = scoreFafYaml(serializeFaf(DATA));
const HAND_HTML = '<!doctype html>\n<html><body>\n<h1>Our project page (HAND-HTML)</h1>\n</body></html>\n';
const HAND_CARD = `${JSON.stringify({ name: 'io.example/hand', description: 'HAND-CARD', tools: [{ name: 'deploy' }] }, null, 2)}\n`;
const HAND_A2A = `${JSON.stringify({ name: 'hand agent', description: 'HAND-A2A', skills: [{ id: 'x' }] }, null, 2)}\n`;
/** A page faf wrote, without its render line — faf's render as renderProjectHtml returns it. */
const noRenderLine = (html: string): string => html.replace(/^<meta name="faf-render" content="sha256:[0-9a-f]{64}">\n/m, '');
/** A card faf wrote, parsed, without its render hash. */
const withoutHash = (text: string): any => {
  const j = JSON.parse(text);
  expect(j._meta[RENDER_KEY]).toMatch(/^sha256:[0-9a-f]{64}$/);
  delete j._meta[RENDER_KEY];
  if (Object.keys(j._meta).length === 0) {delete j._meta;}
  return j;
};
const FAFA: any = {
  agent: { name: 'demo', displayName: 'Demo', description: 'A demo agent', version: '1.0.0', vendor: 'Me', homepage: 'https://example.com' },
  capabilities: [{ name: 'chat', description: 'Talk', tags: ['x'] }],
  endpoints: [{ protocol: 'a2a', location: 'https://example.com/a2a', version: '1.0' }],
};

function refusal(fn: () => unknown): SafePathError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SafePathError) {return e;}
    throw e;
  }
  throw new Error('expected a SafePathError');
}
function run(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, HOME: mk('home'), NO_COLOR: '1', CI: '1' },
  });
}

describe('BRAKE: the library writers keep a file faf did not write (W01-W03, K13)', () => {
  test('W01 writeProjectHtml: a hand page is refused and kept; faf\'s own page is updated; force replaces', () => {
    const d = mk('html');
    writeFileSync(join(d, 'project.html'), HAND_HTML);
    const e = refusal(() => writeProjectHtml(d, DATA, SCORE));
    expect(e.reason).toBe('not-owned');
    expect(e.message).toBe(`${join(d, 'project.html')} has no faf mark (the \`Visual render of project.faf\` description line), so faf did not write it — faf left it unchanged.`);
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toBe(HAND_HTML);

    writeProjectHtml(d, DATA, SCORE, 'project.faf', { force: true });
    expect(noRenderLine(readFileSync(join(d, 'project.html'), 'utf-8'))).toBe(renderProjectHtml(DATA, SCORE));
    const next = { ...DATA, project: { ...DATA.project, goal: 'A new goal' } };
    writeProjectHtml(d, next, SCORE); // faf's own page: no flag needed
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toContain('A new goal');

    // A page an older faf wrote carries the description line but no render
    // hash: faf cannot tell whether it was edited, so it is refused once…
    const old = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="UTF-8">',
      '<title>demo — project.faf</title>',
      '<meta name="description" content="Visual render of project.faf. Authored by faf — humans like visuals, we gave them one.">',
      '</head><body>old render</body></html>',
      '',
    ].join('\n');
    writeFileSync(join(d, 'project.html'), old);
    const pre = refusal(() => writeProjectHtml(d, DATA, SCORE));
    expect(pre.reason).toBe('not-owned');
    expect(pre.message).toBe(`${join(d, 'project.html')} has no faf render hash (written before 7.13), so faf cannot tell whether it was edited — faf left it unchanged. Use --force once to replace it; after that faf recognises its own output.`);
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toBe(old);
    // …unless it is exactly faf's render of the current data: faf's, nothing to change.
    writeFileSync(join(d, 'project.html'), renderProjectHtml(DATA, SCORE));
    writeProjectHtml(d, DATA, SCORE);
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toBe(renderProjectHtml(DATA, SCORE));
  });

  test.skipIf(!posix)('K13 project.html → docs/project.html (a hand page behind a same-name link) is refused, the page byte for byte', () => {
    const d = mk('html');
    mkdirSync(join(d, 'docs'));
    writeFileSync(join(d, 'docs', 'project.html'), '<h1>HAND-PAGE</h1>\n');
    symlinkSync('docs/project.html', join(d, 'project.html'));
    expect(refusal(() => writeProjectHtml(d, DATA, SCORE)).reason).toBe('not-owned');
    expect(readFileSync(join(d, 'docs', 'project.html'), 'utf-8')).toBe('<h1>HAND-PAGE</h1>\n');
  });

  test('W02 writeServerCard: a hand card is refused and kept; faf\'s own card is updated; force replaces', () => {
    const d = mk('card');
    writeFileSync(join(d, 'server-card'), HAND_CARD);
    expect(refusal(() => writeServerCard(d, DATA)).reason).toBe('not-owned');
    expect(readFileSync(join(d, 'server-card'), 'utf-8')).toBe(HAND_CARD);
    writeServerCard(d, DATA, { now: 'T0' }, { force: true });
    expect(withoutHash(readFileSync(join(d, 'server-card'), 'utf-8'))).toEqual(buildServerCard(DATA, { now: 'T0' }));
    writeServerCard(d, DATA, { now: 'T1' }); // faf's own card
    expect(JSON.parse(readFileSync(join(d, 'server-card'), 'utf-8'))._meta['one.faf/context'].generated).toBe('T1');
  });

  test('W03 writeJson (faf cards): a hand agent-card.json is refused and kept; faf\'s own A2A card is updated', () => {
    const d = mk('a2a');
    const out = join(d, '.well-known', 'agent-card.json');
    mkdirSync(join(d, '.well-known'));
    writeFileSync(out, HAND_A2A);
    expect(refusal(() => writeJson(out, { name: 'demo' }, d)).reason).toBe('not-owned');
    expect(readFileSync(out, 'utf-8')).toBe(HAND_A2A);
    writeJson(out, buildA2ACard(FAFA, DATA, { now: 'T0' }), d, { force: true });
    writeJson(out, buildA2ACard(FAFA, DATA, { now: 'T1' }), d); // faf's own card now
    expect(JSON.parse(readFileSync(out, 'utf-8')).capabilities.extensions[0].params.generated).toBe('T1');
  });
});

describe('BRAKE: the commands refuse in one line and take --force (show, export, cards)', () => {
  const FAF = serializeFaf(DATA);

  test('faf show / faf export --html: a hand project.html is refused ("Use --force to replace it."); --force replaces it', () => {
    const d = mk('cli');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'project.html'), HAND_HTML);
    for (const args of [['show'], ['export', '--html']]) {
      const r = run(d, args);
      expect(r.status).toBe(1);
      expect(r.stderr.trim().split('\n')).toEqual([
        `faf: ${join(d, 'project.html')} has no faf mark (the \`Visual render of project.faf\` description line), so faf did not write it — faf left it unchanged. Use --force to replace it.`,
      ]);
      expect(readFileSync(join(d, 'project.html'), 'utf-8')).toBe(HAND_HTML);
    }
    expect(run(d, ['show', '--force']).status).toBe(0);
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toContain('Visual render of project.faf');
    expect(run(d, ['export', '--html']).status).toBe(0); // faf's own page now
  });

  test('faf export --card and faf cards --target mcp,a2a: a hand card is refused and kept; --force replaces it', () => {
    const d = mk('cli');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'server-card'), HAND_CARD);
    const r = run(d, ['export', '--card']);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('so faf did not write it — faf left it unchanged. Use --force to replace it.');
    expect(readFileSync(join(d, 'server-card'), 'utf-8')).toBe(HAND_CARD);
    const c = run(d, ['cards', '--target', 'mcp']);
    expect(c.status).toBe(1);
    expect(readFileSync(join(d, 'server-card'), 'utf-8')).toBe(HAND_CARD);
    expect(run(d, ['cards', '--target', 'mcp', '--force']).status).toBe(0);
    expect(JSON.parse(readFileSync(join(d, 'server-card'), 'utf-8'))._meta['one.faf/context']).toBeDefined();

    writeFileSync(join(d, 'agent.fafa'), JSON.stringify(FAFA));
    mkdirSync(join(d, '.well-known'));
    writeFileSync(join(d, '.well-known', 'agent-card.json'), HAND_A2A);
    expect(run(d, ['cards', '--target', 'a2a']).status).toBe(1);
    expect(readFileSync(join(d, '.well-known', 'agent-card.json'), 'utf-8')).toBe(HAND_A2A);
  });

  test('faf cards --target catalog: a catalog laid out by hand keeps every byte; faf\'s rows are appended as text (round 4, P06)', () => {
    const d = mk('cli');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'agent.fafa'), JSON.stringify(FAFA));
    mkdirSync(join(d, '.well-known'));
    const hand = '{\n    "specVersion": "1.0",\n    "entries": [\n        { "identifier": "urn:x:mine", "type": "text/html", "url": "https://example.com/HAND" }\n    ]\n}\n';
    writeFileSync(join(d, '.well-known', 'ai-catalog.json'), hand);
    expect(run(d, ['cards', '--target', 'catalog']).status).toBe(0);
    const after = readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8');
    // The hand text up to its last row is kept byte for byte; faf's rows follow it.
    const lastRow = hand.indexOf('}', hand.indexOf('"url"')) + 1;
    expect(after.startsWith(hand.slice(0, lastRow))).toBe(true);
    expect(after.endsWith('\n    ]\n}\n')).toBe(true);
    const cat = JSON.parse(after);
    expect(cat.entries[0]).toEqual({ identifier: 'urn:x:mine', type: 'text/html', url: 'https://example.com/HAND' }); // the user's row kept
    expect(cat.entries.map((e: any) => e.identifier)).toEqual(['urn:x:mine', 'urn:air:example.com:a2a:demo', 'urn:air:example.com:agent:demo']);
  });
});
