/**
 * BRAKE — The Rules (core/verify.ts).
 *
 *   All slots are empty by default. There are always 33 slots. The app-type
 *   defines which slots are required; the slots that are not required are
 *   slotignored. A required slot is either empty (does not score) or
 *   populated (scores).
 *
 * Found 2026-10-24 on faf-cli 8.3.2: a file with one slot filled and the
 * other 32 written `slotignored` scored Trophy 100% (1/1); `type: FullStack`
 * silently became library (12 active slots, not 21); `[null]`, `{a: null}`
 * and `true` counted as populated.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { tempDirs } from '../helpers/temp-dirs.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { verifySlots, verifiedYaml } from '../../src/core/verify.js';
import { SLOTS, normalizeAppType } from '../../src/core/slots.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const tmp = (tag: string): string => realpathSync(tempFolders.mkdtemp(join(tmpdir(), `faf-rules-${tag}-`)));

function faf(dir: string, ...args: string[]): { status: number | null; out: string } {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, HOME: tmp('home'), NO_COLOR: '1' } });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
}

/** Every slot `slotignored`, except the ones in `filled`. */
function allIgnoredBut(filled: Record<string, string>, type?: string): string {
  const sections = new Map<string, string[]>();
  for (const s of SLOTS) {
    const [section, field] = s.path.split('.');
    const value = filled[s.path] ?? 'slotignored';
    sections.set(section, [...(sections.get(section) ?? []), `  ${field}: ${value}`]);
  }
  if (type) {sections.set('project', [...(sections.get('project') ?? []), `  type: ${type}`]);}
  return ['faf_version: "3.0"', ...[...sections].flatMap(([k, v]) => [`${k}:`, ...v])].join('\n') + '\n';
}

describe('BRAKE: slotignored comes only from the app-type', () => {
  test('one slot filled, 32 written slotignored, no type: not Trophy — every slot is required (was 100%, 1/1)', () => {
    const r = scoreFafYaml(allIgnoredBut({ 'project.name': 'demo' }));
    expect([r.score, r.populated, r.active]).toEqual([3, 1, 33]);
  });

  test('faf check calls that file invalid, exit 3, and names the slots on one line', () => {
    const d = tmp('hole');
    writeFileSync(join(d, 'project.faf'), allIgnoredBut({ 'project.name': 'demo' }));
    const r = faf(d, 'check');
    expect(r.status).toBe(3);
    expect(r.out).toContain('project.goal, project.main_language, human_context.who, +29 more: slotignored, but without an app-type every slot is required');
  });

  test('a known type: slotignored is honoured only where the type leaves the slot out', () => {
    const text = 'faf_version: "3.0"\nproject:\n  name: demo\n  type: cli\nstack:\n  frontend: slotignored\n  build: slotignored\n';
    const r = scoreFafYaml(text);
    expect(r.slots['stack.frontend']).toBe('slotignored'); // cli leaves the frontend out
    expect(r.slots['stack.build']).toBe('empty'); // cli requires a build tool
    expect(verifySlots({ project: { name: 'demo', type: 'cli' }, stack: { build: 'slotignored' } }).issues)
      .toContainEqual({ kind: 'slotignored-required', slot: 'stack.build', type: 'cli' });
  });

  test('a slot the type does not require is slotignored whatever the file holds there', () => {
    const r = scoreFafYaml('faf_version: "3.0"\nproject:\n  name: demo\n  type: cli\nstack:\n  frontend: React\n');
    expect(r.slots['stack.frontend']).toBe('slotignored');
    expect(r.active).toBe(12);
  });

  test('`slotignored` in any case or padding reads as the word (never as a value)', () => {
    const text = (v: string): string => `faf_version: "3.0"\nproject:\n  name: demo\n  type: cli\nstack:\n  frontend: "${v}"\n  build: "${v}"\n`;
    const r = scoreFafYaml(text(' SlotIgnored '));
    expect(r.slots['stack.frontend']).toBe('slotignored');
    expect(r.slots['stack.build']).toBe('empty');
  });
});

describe('BRAKE: the app-type is read as written, never swapped for another', () => {
  test('spellings of a known type are that type', () => {
    for (const v of ['FullStack', ' fullstack ', 'FULLSTACK']) {expect(normalizeAppType(v)).toBe('fullstack');}
    for (const v of [['frontend'], { cli: true }, 5, true, 'gizmo', 'constructor', 'toString', '__proto__']) {
      expect(normalizeAppType(v)).toBeNull();
    }
  });

  test('faf auto: `type: FullStack` in a library-shaped repo is fullstack (21 active), written back as fullstack', () => {
    const d = tmp('spelling');
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(d, 'index.js'), 'module.exports = {};\n');
    writeFileSync(join(d, 'project.faf'), 'faf_version: "3.0"\nproject:\n  name: demo\n  goal: A demo.\n  main_language: JavaScript\n  type: FullStack\n');
    expect(faf(d, 'auto').status).toBe(0);
    const text = readFileSync(join(d, 'project.faf'), 'utf-8');
    expect(text).toContain('  type: fullstack');
    expect(scoreFafYaml(text).active).toBe(21);
  });

  test('a type faf does not know (yet): no slot left out, and detection writes no slotignored', () => {
    const d = tmp('unknown');
    writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0', main: 'index.js' }));
    writeFileSync(join(d, 'index.js'), 'module.exports = {};\n');
    writeFileSync(join(d, 'project.faf'), 'faf_version: "3.0"\nproject:\n  name: demo\n  type: gizmo\n');
    expect(faf(d, 'auto').status).toBe(0);
    const text = readFileSync(join(d, 'project.faf'), 'utf-8');
    expect(text).not.toContain('slotignored');
    expect(scoreFafYaml(text).active).toBe(33);
    expect(faf(d, 'check').out).toContain('project.type gizmo is not a FAF app-type yet: every slot is required');
  });
});

describe('BRAKE: a required slot is empty or populated — populated means a real value', () => {
  test('[null], [""], {a: null}, {a: 1}, true and false are not values', () => {
    for (const v of ['[null]', "['']", '{a: null}', '{a: 1}', 'true', 'false']) {
      const r = scoreFafYaml(`faf_version: "3.0"\nproject:\n  name: ${v}\n  type: cli\n`);
      expect(r.slots['project.name']).toBe('empty');
    }
  });

  test('text, a number and a list with a value in it are values', () => {
    for (const v of ['demo', '2026', '[a, b]']) {
      const r = scoreFafYaml(`faf_version: "3.0"\nproject:\n  name: ${v}\n  type: cli\n`);
      expect(r.slots['project.name']).toBe('populated');
    }
  });
});

describe('BRAKE: a file that obeys The Rules reaches the kernel byte for byte', () => {
  test('verifiedYaml returns the text itself', () => {
    const text = allIgnoredBut({}, 'enterprise').replace(/slotignored/g, 'x');
    expect(verifiedYaml(text)).toBe(text);
  });
});
