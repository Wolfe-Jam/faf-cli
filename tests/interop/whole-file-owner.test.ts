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
 * Now a file already there is replaced only when it carries faf's own mark,
 * the one faf's 7.12 output already carries (so a file faf wrote before still
 * updates with no flag): project.html's `Visual render of project.faf`
 * description line, the Server Card's `_meta["one.faf/context"]`, the A2A
 * card's FAF context extension. Any other file is refused in one line and
 * kept byte for byte; `--force` replaces it, as `faf init --force` does.
 */
import { describe, test, expect } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { SafePathError } from '../../src/core/safe-write.js';
import { renderProjectHtml, writeProjectHtml } from '../../src/interop/projecthtml.js';
import { buildServerCard, writeServerCard } from '../../src/interop/servercard.js';
import { buildA2ACard, writeJson } from '../../src/interop/cards.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { serializeFaf } from '../../src/interop/faf.js';

const posix = process.platform !== 'win32';
const CLI = join(import.meta.dir, '../../src/cli.ts');
const mk = (tag: string): string => realpathSync(mkdtempSync(join(tmpdir(), `faf-owned-${tag}-`)));
const DATA: any = { project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript', type: 'cli' }, stack: { frontend: 'React' } };
const SCORE = scoreFafYaml(serializeFaf(DATA));
const HAND_HTML = '<!doctype html>\n<html><body>\n<h1>Our project page (HAND-HTML)</h1>\n</body></html>\n';
const HAND_CARD = `${JSON.stringify({ name: 'io.example/hand', description: 'HAND-CARD', tools: [{ name: 'deploy' }] }, null, 2)}\n`;
const HAND_A2A = `${JSON.stringify({ name: 'hand agent', description: 'HAND-A2A', skills: [{ id: 'x' }] }, null, 2)}\n`;
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
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toBe(renderProjectHtml(DATA, SCORE));
    const next = { ...DATA, project: { ...DATA.project, goal: 'A new goal' } };
    writeProjectHtml(d, next, SCORE); // faf's own page: no flag needed
    expect(readFileSync(join(d, 'project.html'), 'utf-8')).toContain('A new goal');

    // A page an older faf wrote carries the same description line: it updates with no flag.
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
    expect(JSON.parse(readFileSync(join(d, 'server-card'), 'utf-8'))).toEqual(buildServerCard(DATA, { now: 'T0' }));
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

  test('faf cards --target catalog: a catalog laid out by hand is refused (a rewrite would lose its layout); faf\'s layout is upserted', () => {
    const d = mk('cli');
    writeFileSync(join(d, 'project.faf'), FAF);
    writeFileSync(join(d, 'agent.fafa'), JSON.stringify(FAFA));
    mkdirSync(join(d, '.well-known'));
    const hand = '{\n    "specVersion": "1.0",\n    "entries": [\n        { "identifier": "urn:x:mine", "type": "text/html", "url": "https://example.com/HAND" }\n    ]\n}\n';
    writeFileSync(join(d, '.well-known', 'ai-catalog.json'), hand);
    expect(run(d, ['cards', '--target', 'catalog']).status).toBe(1);
    expect(readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8')).toBe(hand);

    const faf = `${JSON.stringify(JSON.parse(hand), null, 2)}\n`;
    writeFileSync(join(d, '.well-known', 'ai-catalog.json'), faf);
    expect(run(d, ['cards', '--target', 'catalog']).status).toBe(0);
    const cat = JSON.parse(readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8'));
    expect(cat.entries[0].url).toBe('https://example.com/HAND'); // the user's row kept
    expect(cat.entries.length).toBeGreaterThan(1); // faf's rows added
  });
});
