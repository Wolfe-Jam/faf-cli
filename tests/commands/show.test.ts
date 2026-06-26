/**
 * WJTTC — `faf show`
 *
 * Register-1 instant view: render project.faf → project.html, open it.
 * The browser-open is skipped under CI (real headless behavior + the
 * test seam). This verifies the render half deterministically; it must
 * reuse the single-source renderer (no new HTML logic).
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { showCommand } from '../../src/commands/show.js';

describe('TYRE: commands/show', () => {
  let dir: string;
  let cwd: string;
  let priorCI: string | undefined;

  beforeEach(() => {
    dir = join(tmpdir(), `faf-show-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'project.faf'),
      [
        'faf_version: "3.0"',
        'project:',
        '  name: show-demo',
        '  goal: Verify faf show renders project.html',
        '  main_language: TypeScript',
        '  type: cli',
        'human_context:',
        '  who: devs',
        '  what: a thing',
        '  why: a reason',
      ].join('\n'),
    );
    cwd = process.cwd();
    process.chdir(dir);
    priorCI = process.env.CI;
    process.env.CI = '1'; // skip the browser spawn
  });

  afterEach(() => {
    process.chdir(cwd);
    if (priorCI === undefined) delete process.env.CI;
    else process.env.CI = priorCI;
    rmSync(dir, { recursive: true, force: true });
  });

  test('renders project.html from the current project.faf', () => {
    showCommand();
    const out = join(dir, 'project.html');
    expect(existsSync(out)).toBe(true);
    const html = readFileSync(out, 'utf-8');
    expect(html).toContain('show-demo');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  test('headless (CI) does not throw — graceful, file still written', () => {
    expect(() => showCommand()).not.toThrow();
    expect(existsSync(join(dir, 'project.html'))).toBe(true);
  });
});
