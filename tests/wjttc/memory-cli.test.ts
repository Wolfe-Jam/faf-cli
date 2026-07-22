/**
 * WJTTC TYRE — live `faf memory` CLI (the real road).
 * Converts fixture dir end-to-end via the CLI entry, not the library alone.
 */
import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';

const ROOT = join(import.meta.dir, '../..');
const CLI = join(ROOT, 'src/cli.ts');
const FIX_MEM = join(ROOT, 'tests/fixtures/claude-memory');
const OUT_DIR = join(ROOT, 'tests/.tmp-fafm-cli');

describe('WJTTC TYRE: faf memory CLI', () => {
  test('convert fixture → soul.fafm via real CLI', async () => {
    mkdirSync(OUT_DIR, { recursive: true });
    const out = join(OUT_DIR, 'from-cli.fafm');
    if (existsSync(out)) {rmSync(out);}

    const proc = Bun.spawn(
      ['bun', CLI, 'memory', 'convert', FIX_MEM, '-o', out, '--namepoint', '@claude-code:tyre'],
      { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(code).toBe(0);
    expect(stdout).toContain('3 facts');
    expect(existsSync(out)).toBe(true);

    const doc = parseYaml(readFileSync(out, 'utf-8')) as Record<string, unknown>;
    expect(doc.version).toBe('1.1');
    expect(doc.profile).toBe('knowledge');
    expect(doc.namepoint).toBe('@claude-code:tyre');
    const memory = doc.memory as { facts: unknown[] };
    expect(Array.isArray(memory.facts)).toBe(true);
    expect(memory.facts.length).toBe(3);
    expect('entries' in memory).toBe(false);
    expect(Array.isArray(doc.index)).toBe(true);

    // show / ls via CLI
    const show = Bun.spawn(['bun', CLI, 'memory', 'show', '-f', out], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const showOut = await new Response(show.stdout).text();
    expect(await show.exited).toBe(0);
    expect(showOut).toContain('@claude-code:tyre');
    expect(showOut).toContain('facts');
    expect(stderr).toBe('');
  });
});
