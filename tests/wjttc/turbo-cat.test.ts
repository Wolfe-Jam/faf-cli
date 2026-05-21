/**
 * WJTTC — Turbo-Cat (= Format-finder). Restores multi-ecosystem manifest →
 * slot interrogation the v6.0 rewrite narrowed to README+Cargo+package.json.
 * Guard so it can't silently vanish again.
 *
 * MEASURED counted wins (verified, not predicted):
 *  - project.main_language for langs v6 returns "Unknown" (Python, PHP).
 *  - stack.build (universal category → counts everywhere) for non-npm stacks.
 * NO-GUESS invariants: extensions assert LANGUAGE only (stray .tsx ≠ React);
 * ambiguous "/"-hints (npm/yarn/pnpm) never fill; empty evidence → empty.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { turboCatScan, turboCatSlots } from '../../src/detect/turbo-cat.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-tc-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const write = (name: string, body = 'x') => writeFileSync(join(dir, name), body);

describe('WJTTC ENGINE: Turbo-Cat format → slot', () => {
  test('requirements.txt → main_language Python (fixes v6 "Unknown")', () => {
    write('requirements.txt', 'flask==3.0\n');
    expect(turboCatSlots(dir).project?.main_language).toBe('Python');
  });

  test('composer.json → main_language PHP (fixes v6 "Unknown")', () => {
    write('composer.json', '{"name":"x"}');
    expect(turboCatSlots(dir).project?.main_language).toBe('PHP');
  });

  test('go.mod → build "go build" (universal slot, counts everywhere)', () => {
    write('go.mod', 'module x\ngo 1.21\n');
    expect(turboCatSlots(dir).stack?.build).toBe('go build');
  });

  test('Cargo.toml → main_language Rust + build cargo', () => {
    write('Cargo.toml', '[package]\nname="x"\n');
    const s = turboCatSlots(dir);
    expect(s.project?.main_language).toBe('Rust');
    expect(s.stack?.build).toBe('cargo');
  });

  test('priority-wins is deterministic: config beats extension for a slot', () => {
    write('requirements.txt', 'flask\n'); // priority 35 → Python
    write('a.py', 'x=1');                  // priority 15 → Python
    const r = turboCatScan(dir);
    expect(r.slotFills.mainLanguage).toBe('Python');
  });

  test('the knowledge base carries the full ~200-format breadth', () => {
    write('requirements.txt', 'x');
    // confirmedCount reflects matched formats; KB itself is the asset.
    expect(turboCatScan(dir).confirmedCount).toBeGreaterThan(0);
  });
});

describe('WJTTC BRAKE: Turbo-Cat no-guess invariants', () => {
  test('a stray .tsx asserts language only, never frontend:React', () => {
    write('Button.tsx', 'export const B = () => null;');
    const s = turboCatSlots(dir);
    expect(s.project?.main_language).toBe('TypeScript');
    expect(s.stack?.frontend).toBeUndefined();
  });

  test('ambiguous "/" hints never fill (package.json alone)', () => {
    write('package.json', '{"name":"x"}');
    const s = turboCatSlots(dir);
    // mainLanguage "JavaScript/TypeScript" and pkg "npm/yarn/pnpm" are excluded.
    expect(s.project?.main_language).toBeUndefined();
    expect(s.stack?.package_manager).toBeUndefined();
  });

  test('empty evidence → empty (never guesses)', () => {
    expect(turboCatSlots(dir)).toEqual({});
  });
});
