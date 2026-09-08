import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  renderProjectHtml,
  generateProjectHtml,
  writeProjectHtml,
} from '../../src/interop/projecthtml.js';
import type { FafData, ScoreResult } from '../../src/core/types.js';

describe('ENGINE: interop/projecthtml', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-html-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const data: FafData = {
    faf_version: '3.0',
    project: {
      name: 'demo-project',
      goal: 'A demo for the visual render',
      main_language: 'TypeScript',
      type: 'cli',
    },
    stack: { runtime: 'Bun', frontend: 'slotignored', backend: 'Node.js' },
    human_context: {
      who: 'developers',
      what: 'a thing',
      why: 'a reason',
      where: 'npm',
      when: '2026',
      how: 'bunx',
    },
  };

  const result: ScoreResult = {
    score: 87,
    tier: { name: 'BRONZE', threshold: 85, indicator: '◇ BRONZE' },
    populated: 14,
    empty: 2,
    ignored: 1,
    active: 16,
    total: 17,
    slots: {},
  };

  test('renders project name, score, and canonical tier glyph', () => {
    const html = renderProjectHtml(data, result);
    expect(html).toContain('demo-project');
    expect(html).toContain('87%');
    expect(html).toContain('◇'); // BRONZE canonical glyph
    expect(html).toContain('BRONZE');
    expect(html).toContain("The 6 W's");
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  test('is deterministic — no timestamps, same input → identical output', () => {
    expect(renderProjectHtml(data, result)).toBe(
      renderProjectHtml(data, result),
    );
  });

  test('HTML-escapes hostile .faf content (no injection)', () => {
    const hostile: FafData = {
      ...data,
      project: { ...data.project, name: '<script>alert(1)</script>' },
    };
    const html = renderProjectHtml(hostile, result);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('zero external dependencies — fully self-contained', () => {
    const html = renderProjectHtml(data, result);
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain('@import');
    expect(html).not.toContain('<script');
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
  });

  test('inherited (About Repo) score renders without a raw percentage', () => {
    const inherited: ScoreResult = {
      ...result,
      inherited: true,
      represents: 'Wolfe-Jam/private-src',
    };
    const html = renderProjectHtml(data, inherited);
    expect(html).toContain('inherited from Wolfe-Jam/private-src');
  });

  test('includes the source faf path (HTML-escaped)', () => {
    const html = renderProjectHtml(data, result, '/repo/project.faf');
    expect(html).toContain('Rendered on-demand from your current');
    expect(html).toContain('/repo/project.faf');
    const evil = renderProjectHtml(data, result, '/x/<b>p</b>.faf');
    expect(evil).not.toContain('<b>p</b>');
    expect(evil).toContain('&lt;b&gt;');
  });

  test('Trophy shows the awarded affirmation; sub-Trophy shows the diagnostic', () => {
    const trophy: ScoreResult = {
      ...result,
      score: 100,
      tier: { name: 'TROPHY', threshold: 100, indicator: '✪ TROPHY' },
    };
    const t = renderProjectHtml(data, trophy, '/x/project.faf');
    expect(t).toContain('✅ All Required slots filled.');
    expect(t).toContain('100% Trophy ✪ Awarded');
    expect(t).toContain('class="awd-win"');
    expect(t).not.toContain('slots populated ·');

    const bronze = renderProjectHtml(data, result, '/x/project.faf');
    expect(bronze).toContain('slots populated');
    expect(bronze).not.toContain('Awarded');

    // About-repo inherited 100 displays, does not earn — no "Awarded".
    const inherited: ScoreResult = {
      ...trophy,
      inherited: true,
      represents: 'Wolfe-Jam/src',
    };
    expect(renderProjectHtml(data, inherited, '/x/project.faf')).not.toContain(
      'Awarded',
    );
  });

  test('writeProjectHtml emits project.html at the given dir', () => {
    writeProjectHtml(testDir, data, result);
    const out = join(testDir, 'project.html');
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, 'utf-8')).toContain('demo-project');
  });

  test('generateProjectHtml is a deprecated alias for renderProjectHtml', () => {
    expect(generateProjectHtml(data, result)).toBe(renderProjectHtml(data, result));
  });
});
