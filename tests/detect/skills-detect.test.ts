/**
 * WJTTC — skills detection
 *
 * ENGINE: a repo that ships SKILL.md folders is `skills`; with a Claude Code
 *         plugin manifest it is `skills-plugin`. The framework slot names the
 *         skills format.
 * BRAKE:  a code repo that also ships a skill keeps its type (faf-cli ships
 *         skills/faf-expert and stays `cli`); a project's own `.claude/skills`
 *         and SKILL.md fixtures deeper down never make a skills repo.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectProjectTypeWithRationale, detectSkillsFormat, findSkillFiles } from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { scoreFafYaml } from '../../src/core/scorer.js';
import { NO_CLASSIFYING_SIGNALS } from '../../src/core/slots.js';
import { stringify } from 'yaml';

let dir: string;

function put(rel: string, text = ''): void {
  mkdirSync(join(dir, rel, '..'), { recursive: true });
  writeFileSync(join(dir, rel), text);
}

function skill(folder: string): void {
  put(`${folder}/SKILL.md`, `---\nname: ${folder.split('/').pop()}\ndescription: Does a thing. Use when testing.\n---\n\nSteps.\n`);
}

beforeEach(() => {
  dir = join(tmpdir(), `faf-test-skills-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC ENGINE: a skills repo is detected', () => {
  test('skills/<name>/SKILL.md folders → skills', () => {
    skill('skills/release-notes');
    skill('skills/changelog');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('skills');
    expect(r.found).toEqual(['2 SKILL.md folders']);
  });

  test('one SKILL.md at the root → skills, found names the file', () => {
    put('SKILL.md', '---\nname: x\ndescription: y\n---\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('skills');
    expect(r.found).toEqual(['SKILL.md']);
  });

  test('top-level skill folders (no skills/ dir) → skills', () => {
    skill('pdf');
    expect(detectProjectTypeWithRationale(dir).type).toBe('skills');
    expect(findSkillFiles(dir)).toEqual(['pdf/SKILL.md']);
  });

  test('SKILL.md folders + .claude-plugin/plugin.json → skills-plugin', () => {
    skill('skills/faf-go');
    put('.claude-plugin/plugin.json', '{"name":"x","version":"1.0.0"}');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('skills-plugin');
    expect(r.found).toEqual(['skills/faf-go/SKILL.md', '.claude-plugin/plugin.json']);
  });

  test('a package.json with only build scripts does not stop it', () => {
    skill('skills/a');
    put('package.json', JSON.stringify({ name: 'x', private: true, scripts: { build: 'node build.mjs' } }));
    expect(detectProjectTypeWithRationale(dir).type).toBe('skills');
  });
});

describe('WJTTC BRAKE: code repos that ship a skill keep their type', () => {
  test('faf-cli shape (bin + skills/ + plugin manifest) stays cli', () => {
    put('package.json', JSON.stringify({ name: 'x', bin: { x: 'dist/cli.js' }, main: 'dist/index.js' }));
    skill('skills/faf-expert');
    put('.claude-plugin/plugin.json', '{"name":"x"}');
    expect(detectProjectTypeWithRationale(dir).type).toBe('cli');
  });

  test('a library with main + skills/ stays library', () => {
    put('package.json', JSON.stringify({ name: 'x', main: 'index.js' }));
    skill('skills/a');
    expect(detectProjectTypeWithRationale(dir).type).toBe('library');
  });

  test('.claude/skills (a project\'s own skills) is not a skills repo', () => {
    skill('.claude/skills/helper');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.found).toEqual([NO_CLASSIFYING_SIGNALS]);
    expect(findSkillFiles(dir)).toEqual([]);
  });

  test('SKILL.md fixtures deeper down are not a skills repo', () => {
    skill('test/fixtures/good');
    expect(findSkillFiles(dir)).toEqual([]);
    expect(detectProjectTypeWithRationale(dir).found).toEqual([NO_CLASSIFYING_SIGNALS]);
  });

  test('a plugin manifest with no skills is not skills-plugin', () => {
    put('.claude-plugin/plugin.json', '{"name":"x"}');
    expect(detectProjectTypeWithRationale(dir).type).toBe('library');
  });
});

describe('WJTTC ENGINE: the framework slot names the skills format', () => {
  test('skills → Agent Skills, 10 active slots', () => {
    skill('skills/a');
    expect(detectSkillsFormat(dir)).toBe('Agent Skills');
    const data = detectStack(dir) as { stack: Record<string, string>; project: Record<string, string> };
    expect(data.project.type).toBe('skills');
    expect(data.stack.frontend).toBe('Agent Skills');
    expect(data.stack.runtime).toBe('slotignored');
    const file: Record<string, unknown> = { ...data };
    delete file._meta;
    expect(scoreFafYaml(stringify(file)).active).toBe(10);
  });

  test('skills-plugin → Claude Code plugin; runtime stays open', () => {
    skill('skills/a');
    put('.claude-plugin/plugin.json', '{"name":"x"}');
    expect(detectSkillsFormat(dir)).toBe('Claude Code plugin');
    const data = detectStack(dir) as { stack: Record<string, string> };
    expect(data.stack.frontend).toBe('Claude Code plugin');
    expect(data.stack.runtime).not.toBe('slotignored');
  });

  test('no skills → no format', () => {
    expect(detectSkillsFormat(dir)).toBe('');
  });
});
