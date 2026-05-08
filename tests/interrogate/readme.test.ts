/**
 * WJTTC — README interrogation
 *
 * BRAKE: extracted text must never be slop / footnote / wrong-section text.
 *        Empty is honest; wrong is a lie. v1.0.3's footnote-→-goal bug is
 *        the canonical regression we're guarding against here.
 * ENGINE: per-slot anchor discovery + extraction validation.
 * PIT: fixture setup.
 *
 * Per faf-auto-no-guess-no-slop doctrine.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  interrogateReadme,
  extractGoal,
  extractWhat,
  extractWho,
  extractWhy,
  extractWhere,
  extractWhen,
  extractHow,
} from '../../src/interrogate/readme.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-test-readme-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeReadme(content: string): void {
  writeFileSync(join(dir, 'README.md'), content);
}

describe('WJTTC BRAKE: no-guess / no-slop discipline', () => {
  test('returns {} when no README exists', () => {
    expect(interrogateReadme(dir)).toEqual({});
  });

  test('does NOT extract footnote/asterisked-line as goal (v1.0.3 regression guard)', () => {
    writeReadme([
      '# my-project',
      '',
      'A real description of the project.',
      '',
      '## Notes',
      '',
      '* Plan-B name held in reserve: ZAF*',
    ].join('\n'));
    const result = interrogateReadme(dir);
    expect(result.project?.goal).not.toContain('Plan-B');
    expect(result.project?.goal).not.toContain('ZAF');
  });

  test('rejects generic slop in goal slot', () => {
    writeReadme(['# x', '', 'TBD', '', '## About', '', 'See README'].join('\n'));
    const result = interrogateReadme(dir);
    expect(result.project?.goal).toBeUndefined();
    expect(result.human_context?.what).toBeUndefined();
  });

  test('rejects too-short text (under MIN_LENGTH)', () => {
    writeReadme(['# x', '', 'short.'].join('\n'));
    expect(extractGoal('# x\n\nshort.')).toBeUndefined();
  });

  test('rejects too-long text (over MAX_LENGTH — likely documentation, not a slot fill)', () => {
    const longProse = 'a'.repeat(300);
    writeReadme(`# x\n\n${longProse}`);
    expect(extractGoal(`# x\n\n${longProse}`)).toBeUndefined();
  });

  test('rejects markdown structure (lists, tables, code) as extraction', () => {
    writeReadme(['# x', '', '- item 1', '- item 2'].join('\n'));
    expect(extractGoal('# x\n\n- item 1\n- item 2')).toBeUndefined();
  });
});

describe('WJTTC ENGINE: extractGoal — first prose paragraph or explicit section', () => {
  test('extracts first prose paragraph after title + badges', () => {
    writeReadme([
      '# my-project',
      '',
      '[![CI](badge.svg)](url)',
      '![logo](logo.png)',
      '',
      'A clear, informative one-line description of the project.',
      '',
      '## Install',
      '',
      'npm install',
    ].join('\n'));
    expect(interrogateReadme(dir).project?.goal)
      .toBe('A clear, informative one-line description of the project.');
  });

  test('skips bold-tagline-only spirit lines, prefers prose paragraph', () => {
    writeReadme([
      '# my-project',
      '',
      '**For Glory. For Mars.**',
      '',
      'A real prose description of what the project actually does.',
    ].join('\n'));
    const goal = interrogateReadme(dir).project?.goal;
    expect(goal).toBe('A real prose description of what the project actually does.');
    expect(goal).not.toContain('Glory');
  });

  test('## Use Case section wins over first paragraph if present', () => {
    writeReadme([
      '# x',
      '',
      'Some intro paragraph that is long enough.',
      '',
      '## Use Case',
      '',
      'Fill empty appointments for dentists with kids.',
    ].join('\n'));
    expect(interrogateReadme(dir).project?.goal)
      .toBe('Fill empty appointments for dentists with kids.');
  });

  test('## Goal section is also recognized', () => {
    writeReadme([
      '# x',
      '',
      'Intro paragraph that is long enough to count.',
      '',
      '## Goal',
      '',
      'Double off-season sales of soccer apparel via app.',
    ].join('\n'));
    expect(interrogateReadme(dir).project?.goal)
      .toBe('Double off-season sales of soccer apparel via app.');
  });
});

describe('WJTTC ENGINE: 6W extractors — per-slot anchors', () => {
  test('extractWhat from ## About', () => {
    expect(extractWhat('# x\n\n## About\n\nA tool for managing project context.')).toBe(
      'A tool for managing project context.',
    );
  });

  test('extractWho from ## Audience', () => {
    expect(extractWho('# x\n\n## Audience\n\nDevelopers using AI assistants daily.')).toBe(
      'Developers using AI assistants daily.',
    );
  });

  test('extractWhy from ## Motivation', () => {
    expect(extractWhy('# x\n\n## Motivation\n\nEliminate context re-discovery.')).toBe(
      'Eliminate context re-discovery.',
    );
  });

  test('extractWhere from ## Deployment', () => {
    expect(extractWhere('# x\n\n## Deployment\n\nNpm registry, GitHub releases.')).toBe(
      'Npm registry, GitHub releases.',
    );
  });

  test('extractWhen from ## Status', () => {
    expect(extractWhen('# x\n\n## Status\n\nProduction since 2025-09; v6 March 2026.')).toBe(
      'Production since 2025-09; v6 March 2026.',
    );
  });

  test('extractHow from ## Architecture', () => {
    expect(extractHow('# x\n\n## Architecture\n\nThree-layer: parser, scorer, output.')).toBe(
      'Three-layer: parser, scorer, output.',
    );
  });

  test('extracts ZERO 6Ws when no anchors present (silent on absence)', () => {
    writeReadme(['# x', '', 'Just a goal line, no sections.', '', '## Install', 'npm i'].join('\n'));
    const result = interrogateReadme(dir);
    expect(result.project?.goal).toBeDefined();
    expect(result.human_context).toBeUndefined();
  });
});

describe('WJTTC ENGINE: case-insensitive README candidates', () => {
  test('finds README.MD (uppercase)', () => {
    writeFileSync(join(dir, 'README.MD'), '# x\n\nA valid description here.');
    expect(interrogateReadme(dir).project?.goal).toBe('A valid description here.');
  });

  test('finds readme.md (lowercase)', () => {
    writeFileSync(join(dir, 'readme.md'), '# x\n\nA valid description here.');
    expect(interrogateReadme(dir).project?.goal).toBe('A valid description here.');
  });
});
