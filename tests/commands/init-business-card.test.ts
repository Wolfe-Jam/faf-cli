/**
 * `faf init` offers the business card as the next step: one line naming
 * `faf card init`, only when the project has no .fafa yet. It writes nothing
 * for the card.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const cli = join(import.meta.dir, '../../src/cli.ts');
const NEXT = "next: 'faf card init' — your repo's business card";

describe("TYRE: faf init — offers 'faf card init' when there is no .fafa", () => {
  let dir: string;
  const init = () =>
    execSync(`bun ${cli} init`, { cwd: dir, encoding: 'utf-8', timeout: 60000, env: { ...process.env, NO_COLOR: '1' } })
      .replace(/\x1b\[[0-9;]*m/g, '');

  beforeEach(() => {
    dir = join(tmpdir(), `faf-init-card-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'weather-tool', version: '1.0.0' }));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('no .fafa: the next-step line, and no card written', () => {
    expect(init()).toContain(NEXT);
    expect(readdirSync(dir).filter((f) => f.includes('fafa') || f === '.well-known')).toEqual([]);
  });

  for (const path of [['agent.fafa'], ['.fafa'], ['.well-known', 'fafa']]) {
    test(`${path.join('/')} already there: no next-step line`, () => {
      if (path.length > 1) {mkdirSync(join(dir, path[0]), { recursive: true });}
      writeFileSync(join(dir, ...path), 'version: "1.0"\n');
      const out = init();
      expect(out).toContain('created');
      expect(out).not.toContain('faf card init');
    });
  }
});
