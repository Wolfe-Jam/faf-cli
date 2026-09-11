/**
 * BRAKE: a hand-written none is a decision, not a gap — owner decision Q8,
 * audit #37.
 *
 * `database: None # deliberate: stateless`, `frontend: N/A` and
 * `hosting: not applicable` are the explicit-none sentinel: the same decision
 * as `slotignored`. fce35d6b treated them as empty placeholders, so `faf auto`
 * (updateExistingFaf) replaced them with detected values — PostgreSQL, React,
 * a host — and the comment went with them. Now no detected value replaces
 * one, and it keeps its own text (Q8 with the owner rule: faf writes
 * `slotignored` only into a slot that was empty). Scoring counts it as
 * `slotignored`.
 */
import { describe, test, expect } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as api from '../../src/index.js';
import { fillEmpties, updateExistingFaf } from '../../src/detect/assemble.js';
import { readFaf, writeFaf } from '../../src/interop/faf.js';
import { scoreFafYaml } from '../../src/core/scorer.js';

/** A repo whose files point at React, PostgreSQL, Vite and Vercel. */
function repo(): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'faf-none-')));
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

describe('BRAKE: explicit none — never replaced by a detected value', () => {
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

  test('fillEmpties: at a slot, a hand-written none keeps its own text — the detected value is not used', () => {
    const out = fillEmpties(
      { stack: { database: 'None', frontend: 'N/A', hosting: ' Not Applicable ', cicd: 'NONE', build: '' } },
      { stack: { database: 'PostgreSQL', frontend: 'React', hosting: 'Vercel', cicd: 'GitHub Actions', build: 'Vite' } },
    );
    expect(stackOf(out)).toEqual({ database: 'None', frontend: 'N/A', hosting: ' Not Applicable ', cicd: 'NONE', build: 'Vite' });
  });

  test('fillEmpties: outside a slot, a hand-written none is kept exactly as written', () => {
    const out = fillEmpties({ project: { type: 'none' }, notes: 'N/A' }, { project: { type: 'cli' }, notes: 'detected' });
    expect(out).toEqual({ project: { type: 'none' }, notes: 'N/A' });
  });

  test('updateExistingFaf (faf auto): None / N/A / not applicable stay as written, not PostgreSQL / React / a host', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'web', type: 'frontend' },
      stack: { database: 'None', frontend: 'N/A', hosting: 'not applicable' },
    });
    expect(stackOf(out).database).toBe('None');
    expect(stackOf(out).frontend).toBe('N/A');
    expect(stackOf(out).hosting).toBe('not applicable');
  });

  test('a slot marked none (or slotignored) under its other name is not filled under this one', () => {
    const out = updateExistingFaf(repo(), {
      project: { name: 'web', type: 'frontend' },
      stack: { framework: 'None', db: 'slotignored' },
    });
    expect(stackOf(out).frontend).toBeUndefined();
    expect(stackOf(out).database).toBeUndefined();
    expect(stackOf(out).framework).toBe('None');
    expect(stackOf(out).db).toBe('slotignored');

    // An empty placeholder under one name does not open the slot up again.
    const both = updateExistingFaf(repo(), { project: { name: 'web', type: 'frontend' }, stack: { database: '', db: 'N/A' } });
    expect(stackOf(both).database).toBe('');
    expect(stackOf(both).db).toBe('N/A');
  });

  test('the written file: the decision keeps its own words and comment; scoring reads it as slotignored', () => {
    const dir = repo();
    const path = join(dir, 'project.faf');
    writeFileSync(path, [
      'project:',
      '  name: web',
      '  type: frontend',
      'stack:',
      '  database: None # deliberate: stateless',
      '  frontend: N/A',
      '  hosting: not applicable',
      '',
    ].join('\n'));
    writeFaf(path, updateExistingFaf(dir, readFaf(path)));
    const text = readFileSync(path, 'utf-8');
    expect(text).toContain('\n  database: None # deliberate: stateless\n  frontend: N/A\n  hosting: not applicable\n');
    const stack = stackOf(readFaf(path) as Record<string, unknown>);
    expect([stack.database, stack.frontend, stack.hosting]).toEqual(['None', 'N/A', 'not applicable']);
    // Scoring counts each as slotignored, exactly as if faf had written the word.
    const slots = scoreFafYaml(text).slots;
    expect([slots['stack.database'], slots['stack.frontend'], slots['stack.hosting']]).toEqual(['slotignored', 'slotignored', 'slotignored']);
    const asWord = text.replace('None # deliberate', 'slotignored # deliberate').replace('frontend: N/A', 'frontend: slotignored').replace('hosting: not applicable', 'hosting: slotignored');
    expect(scoreFafYaml(text).score).toBe(scoreFafYaml(asWord).score);
  });

  test('a user _meta is never merged into by faf\'s runtime _meta', () => {
    const out = fillEmpties({ _meta: { owner: 'me' } }, { _meta: { found: ['package.json bin'] } });
    expect(out._meta).toEqual({ owner: 'me' });
    // Without a _meta of its own, the target still takes faf's runtime one.
    expect(fillEmpties({}, { _meta: { found: ['x'] } })._meta).toEqual({ found: ['x'] });
  });
});
