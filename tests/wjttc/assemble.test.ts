/**
 * WJTTC — shared .faf assembly pipeline (assembleFreshFaf). This is the full
 * slot-filling flow `faf auto` (new file) AND `faf git` (cloned repo) both run,
 * so they can't drift. Guards that `faf git` is no longer detectStack-only
 * (~33%) but gets interrogate + Turbo-Cat + Relentless (~75%).
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { assembleFreshFaf, fillEmpties } from '../../src/detect/assemble.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-asm-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const write = (name: string, body: string): void => writeFileSync(join(dir, name), body);

describe('WJTTC ENGINE: shared assembly pipeline (auto + git)', () => {
  test('fills human_context (Relentless) — not detectStack-only', () => {
    write('package.json', JSON.stringify({ description: 'A drop-in checkout flow for fast payment integration' }));
    write('README.md', '# Kit\n\n## Why\nOur mission is to remove payment-integration friction for teams.\n\nBuilt for developers who ship commerce features.\n');
    const faf = assembleFreshFaf(dir);
    const hc = faf.human_context as Record<string, string>;
    expect(hc.what).toContain('drop-in checkout');
    expect(hc.why).toContain('remove payment-integration friction');
    expect(hc.who).toContain('developers who ship commerce');
  });

  test('fills stack from Turbo-Cat for non-npm stacks (the git gap)', () => {
    write('requirements.txt', 'flask==3.0\n');
    write('app.py', 'x=1');
    const faf = assembleFreshFaf(dir);
    expect((faf.project as Record<string, string>).main_language).toBe('Python');
  });

  test('applies slotignore for the detected app-type', () => {
    write('package.json', JSON.stringify({ description: 'A small CLI utility for developers' }));
    write('index.ts', 'export const x = 1;');
    const faf = assembleFreshFaf(dir);
    // a non-frontend project ignores frontend-category slots
    const stack = faf.stack as Record<string, string>;
    expect(Object.values(stack)).toContain('slotignored');
  });

  test('fillEmpties: existing values win, empties get filled', () => {
    const merged = fillEmpties(
      { project: { name: 'keep-me', main_language: '' } },
      { project: { name: 'override', main_language: 'TypeScript' } },
    );
    const p = merged.project as Record<string, string>;
    expect(p.name).toBe('keep-me');
    expect(p.main_language).toBe('TypeScript');
  });
});
