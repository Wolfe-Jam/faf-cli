/**
 * WJTTC BRAKE — an About Repo with no source_score has an UNKNOWN score, and
 * nothing renders it as a number (#47).
 *
 * scoreFafYaml returns score -1 for it ("honest unknown"), but nothing said so:
 * `faf score` printed "♡ -1%", claude-faf-mcp showed "-1/100 (-1%)" and
 * attested it valid, and `faf refresh` recorded -1 as the Birth DNA. The result
 * now carries `unknown: true`, `scoreText` renders "unknown (—)", and faf's own
 * displays and lineage treat it as unknown.
 */

import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import * as api from '../../src/index.js';
import { scoreFafYaml, scoreText } from '../../src/core/scorer.js';
import { displayScore } from '../../src/ui/display.js';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const ABOUT_NO_SOURCE = 'faf_version: 2.5.0\nproject:\n  name: about-demo\nabout:\n  represents: acme/private-core\n';
const ABOUT_SOURCE = `${ABOUT_NO_SOURCE}  source_score: 85\n`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-unknown-score-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('BRAKE: the result says the score is unknown', () => {
  test('about-repo with no source_score → unknown: true (score -1 is only a placeholder)', () => {
    const r = scoreFafYaml(ABOUT_NO_SOURCE);
    expect(r.unknown).toBe(true);
    expect(r.score).toBe(-1);
    expect(r.inherited).toBe(true);
  });

  test('an inherited or calculated score is not unknown (the key is absent)', () => {
    expect('unknown' in scoreFafYaml(ABOUT_SOURCE)).toBe(false);
    expect('unknown' in scoreFafYaml('project:\n  name: x\n  goal: y\n')).toBe(false);
  });

  test('scoreText renders "unknown (—)", never "-1%"; exported from the index', () => {
    expect(scoreText(scoreFafYaml(ABOUT_NO_SOURCE))).toBe('unknown (—)');
    expect(scoreText(scoreFafYaml(ABOUT_SOURCE))).toBe('85%');
    expect(api.scoreText).toBe(scoreText);
  });
});

describe("BRAKE: faf's own displays", () => {
  test('displayScore prints unknown, never -1', () => {
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.join(' '));
    });
    try {
      displayScore(scoreFafYaml(ABOUT_NO_SOURCE), 'project.faf');
    } finally {
      spy.mockRestore();
    }
    const out = logs.join('\n');
    expect(out).toContain('unknown');
    expect(out).toContain('acme/private-core');
    expect(out).not.toContain('-1');
  });

  test('faf score and faf score --status print unknown', () => {
    writeFileSync(join(dir, 'project.faf'), ABOUT_NO_SOURCE);
    for (const args of [['score'], ['score', '--status']]) {
      const r = spawnSync('bun', [CLI, ...args], { cwd: dir, encoding: 'utf-8' });
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('unknown');
      expect(r.stdout).not.toContain('-1%');
    }
  });

  test('faf refresh says unknown and records no -1 Birth DNA', () => {
    writeFileSync(join(dir, 'project.faf'), ABOUT_NO_SOURCE);
    const r = spawnSync('bun', [CLI, 'refresh'], { cwd: dir, encoding: 'utf-8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('score unknown');
    expect(r.stdout).not.toContain('-1%');
    expect(existsSync(join(dir, '.faf-dna'))).toBe(false);

    const json = spawnSync('bun', [CLI, 'refresh', '--json'], { cwd: dir, encoding: 'utf-8' });
    const report = JSON.parse(json.stdout);
    expect(report.unknown).toBe(true);
    expect(report.reGrounded).toBe(false);
    expect(existsSync(join(dir, '.faf-dna'))).toBe(false);
  });
});
