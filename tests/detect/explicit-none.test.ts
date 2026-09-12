/**
 * BRAKE: a typed None / N/A / not applicable is an EMPTY slot — owner
 * decision Q8, FINAL (2026-09-11), audit #37.
 *
 * It scores 0 until filled; the app-type alone decides which slots count, and
 * `slotignored` comes only from the app-type. Tech slots (every slot but the
 * 6Ws): "if it's a fact, fill the slot" — a repo fact replaces the typed
 * none; with no fact the typed words stay byte for byte, comment included,
 * in a slot the app-type uses (in a slot it leaves out, faf auto writes
 * `slotignored` — see owner-rule-r4b). The 6Ws are the person's: auto never
 * replaces a typed none there.
 *
 * Before: fce35d6b (7.12) read the words as a placeholder, so `faf auto` wrote
 * a detected `slotignored` (or `''`) over them when the repo had no fact —
 * which lifted the score. Round 3a kept every typed none, even against a
 * fact, and scored it as `slotignored`.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as api from '../../src/index.js';
import { fillEmpties, updateExistingFaf } from '../../src/detect/assemble.js';
import { readFaf, writeFaf } from '../../src/interop/faf.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

/** A repo whose files point at React, PostgreSQL, Vite and Vercel. */
function repo(): string {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-none-')));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'web',
    description: 'A web app',
    dependencies: { react: '^18', 'react-dom': '^18', pg: '^8' },
    devDependencies: { vite: '^5' },
  }));
  writeFileSync(join(dir, 'vercel.json'), '{}');
  writeFileSync(join(dir, 'docker-compose.yml'), 'services:\n  db:\n    image: postgres:16\n');
  return dir;
}

type Stack = Record<string, unknown>;
const stackOf = (data: Record<string, unknown>): Stack => data.stack as Stack;

describe('BRAKE: a typed none is an empty slot — a fact fills a tech slot, nothing else replaces it', () => {
  test('isExplicitNone is public: None, N/A, not applicable, none — any case, any padding', () => {
    const isExplicitNone = (api as Record<string, unknown>).isExplicitNone as ((v: unknown) => boolean) | undefined;
    expect(typeof isExplicitNone).toBe('function');
    for (const v of ['None', 'none', 'NONE', 'N/A', 'n/a', 'not applicable', ' Not Applicable ']) {
      expect(isExplicitNone!(v)).toBe(true);
    }
    for (const v of ['', 'unknown', 'slotignored', 'Nonesuch', null, undefined, 0]) {
      expect(isExplicitNone!(v)).toBe(false);
    }
  });

  test('fillEmpties: in a tech slot, a fact replaces the typed none (under either of the slot\'s names)', () => {
    const out = fillEmpties(
      { stack: { database: 'None', frontend: 'N/A', hosting: ' Not Applicable ', cicd: 'NONE', build: '', css: 'none' } },
      { stack: { database: 'PostgreSQL', frontend: 'React', hosting: 'Vercel', cicd: 'GitHub Actions', build: 'Vite', css: 'Tailwind' } },
    );
    expect(stackOf(out)).toEqual({ database: 'PostgreSQL', frontend: 'React', hosting: 'Vercel', cicd: 'GitHub Actions', build: 'Vite', css: 'Tailwind' });
  });

  test('fillEmpties: with no fact the typed words stay exactly — never `slotignored`, never a placeholder', () => {
    const target = { stack: { database: 'None', frontend: 'N/A', hosting: 'not applicable', cicd: 'none', build: 'N/A', runtime: 'None' } };
    const out = fillEmpties(target, {
      stack: { database: '', frontend: 'slotignored', hosting: 'unknown', cicd: null, build: 'None', runtime: '   ' },
    });
    expect(out).toEqual(target);
  });

  test('fillEmpties: a 6W typed none is the person\'s — a detected value never replaces it', () => {
    const out = fillEmpties(
      { human_context: { who: 'None', why: 'N/A', what: '' } },
      { human_context: { who: 'Platform devs', why: 'To ship faster', what: 'A web app' } },
    );
    expect(out.human_context).toEqual({ who: 'None', why: 'N/A', what: 'A web app' });
  });

  test('fillEmpties: outside the slots, a typed none is kept exactly as written', () => {
    const out = fillEmpties({ project: { type: 'none' }, notes: 'N/A' }, { project: { type: 'cli' }, notes: 'detected' });
    expect(out).toEqual({ project: { type: 'none' }, notes: 'N/A' });
  });

  test('updateExistingFaf (faf auto): repo facts fill None / N/A; a slot with no fact and a 6W keep their words', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'web', type: 'frontend' },
      stack: { database: 'None', frontend: 'N/A', css_framework: 'not applicable' },
      human_context: { who: 'None' },
    });
    expect(stackOf(out).database).toBe('PostgreSQL'); // docker-compose: postgres
    expect(stackOf(out).frontend).toBe('React'); // package.json: react
    expect(stackOf(out).css_framework).toBe('not applicable'); // no fact in the repo
    expect((out.human_context as Record<string, unknown>).who).toBe('None'); // the 6Ws are the person's
  });

  test('`slotignored` under either name still keeps detection out; a typed none under the other name does not', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'web', type: 'frontend' },
      stack: { framework: 'None', db: 'slotignored' },
    });
    expect(stackOf(out).database).toBeUndefined(); // stack.db says slotignored: no PostgreSQL under stack.database
    expect(stackOf(out).db).toBe('slotignored');
    expect(stackOf(out).frontend).toBe('React'); // a typed none is empty: the fact fills the slot
    expect(stackOf(out).framework).toBe('None'); // and the words under the other name are not rewritten

    // An empty value and a typed none under the slot's two names: the fact fills it.
    const both = updateExistingFaf(repo(), { project: { name: 'web', type: 'frontend' }, stack: { database: '', db: 'N/A' } });
    expect(stackOf(both).database).toBe('PostgreSQL');
    expect(stackOf(both).db).toBe('N/A');
  });

  test('the written file: a fact lands in place with the comment kept; no fact leaves the line byte for byte; it scores as empty', () => {
    const dir = repo();
    const path = join(dir, 'project.faf');
    writeFileSync(path, [
      'project:',
      '  name: web',
      '  type: frontend',
      'stack:',
      '  database: None # deliberate: stateless',
      '  css_framework: not applicable # CSS-NONE',
      'human_context:',
      '  who: N/A # WHO-NA',
      '',
    ].join('\n'));
    writeFaf(path, updateExistingFaf(dir, readFaf(path)));
    const lines = readFileSync(path, 'utf-8').split('\n');
    expect(lines).toContain('  database: PostgreSQL # deliberate: stateless');
    expect(lines).toContain('  css_framework: not applicable # CSS-NONE');
    expect(lines).toContain('  who: N/A # WHO-NA');
    expect(lines.some(l => l.includes('slotignored') && /css_framework|who:/.test(l))).toBe(false);
    // Scoring reads a typed none as an empty slot — exactly like the empty value.
    const text = lines.join('\n');
    const slots = scoreFafYaml(text).slots;
    expect([slots['stack.css_framework'], slots['human_context.who']]).toEqual(['empty', 'empty']);
    const asEmpty = text.replace('css_framework: not applicable', 'css_framework: ""').replace('who: N/A', 'who: ""');
    expect(scoreFafYaml(text).score).toBe(scoreFafYaml(asEmpty).score);
  });

  test('a user _meta is never merged into by faf\'s runtime _meta', () => {
    const out = fillEmpties({ _meta: { owner: 'me' } }, { _meta: { found: ['package.json bin'] } });
    expect(out._meta).toEqual({ owner: 'me' });
    // Without a _meta of its own, the target still takes faf's runtime one.
    expect(fillEmpties({}, { _meta: { found: ['x'] } })._meta).toEqual({ found: ['x'] });
  });
});
