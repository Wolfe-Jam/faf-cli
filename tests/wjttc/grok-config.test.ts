/**
 * WJTTC — .grok/config.toml MCP wiring (faf export --grok). Grounded baseline.
 *
 * project.faf → .grok/config.toml [mcp_servers.grok-faf-mcp] is the machine-
 * readable projection (the cable, not a billboard). Because it ACTS on the
 * user's config, the championship gates that matter are SAFETY (never clobber)
 * and the LIVE road (the real CLI path is opt-in, never a side effect).
 *
 * BRAKE  — non-destructive invariants (don't wreck the user's config)
 * ENGINE — the canonical block is emitted + the file is created correctly
 * AERO   — deterministic output (no drift between runs)
 * TYRE   — live: the real `faf export --grok` path + the opt-in guard
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  GROK_FAF_MCP_URL,
  GROK_MCP_TABLE,
  generateGrokConfig,
  writeGrokConfig,
} from '../../src/interop/grok.js';

let dir: string;
const cfg = () => join(dir, '.grok', 'config.toml');
const TABLE = `[${GROK_MCP_TABLE}]`;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-grok-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC BRAKE: .grok/config.toml is non-destructive', () => {
  test('an existing config (other server) survives the merge', () => {
    mkdirSync(join(dir, '.grok'), { recursive: true });
    writeFileSync(cfg(), '[mcp_servers.other]\nurl = "https://other.dev/mcp"\n');

    expect(writeGrokConfig(dir)).toBe('merged');

    const out = readFileSync(cfg(), 'utf-8');
    expect(out).toContain('[mcp_servers.other]');     // theirs preserved
    expect(out).toContain('https://other.dev/mcp');
    expect(out).toContain(TABLE);                      // ours added
  });

  test('re-running never duplicates the grok-faf-mcp entry', () => {
    expect(writeGrokConfig(dir)).toBe('created');
    expect(writeGrokConfig(dir)).toBe('unchanged');
    expect(writeGrokConfig(dir)).toBe('unchanged');
    const occurrences = readFileSync(cfg(), 'utf-8').split(TABLE).length - 1;
    expect(occurrences).toBe(1);
  });

  test('an already-wired file is left byte-identical', () => {
    writeGrokConfig(dir);
    const before = readFileSync(cfg(), 'utf-8');
    expect(writeGrokConfig(dir)).toBe('unchanged');
    expect(readFileSync(cfg(), 'utf-8')).toBe(before);
  });
});

describe('WJTTC ENGINE: canonical block + file creation', () => {
  test('generateGrokConfig emits the canonical [mcp_servers.grok-faf-mcp] block', () => {
    const block = generateGrokConfig();
    expect(block).toContain(TABLE);
    expect(block).toContain(`url = "${GROK_FAF_MCP_URL}"`);
  });

  test('writeGrokConfig creates .grok/config.toml with a quiet one-line header', () => {
    expect(writeGrokConfig(dir)).toBe('created');
    expect(existsSync(cfg())).toBe(true);
    const out = readFileSync(cfg(), 'utf-8');
    expect(out).toContain(TABLE);
    expect(out).toContain(GROK_FAF_MCP_URL);
    expect(out.startsWith('# grok-faf-mcp')).toBe(true);  // header, not a banner
  });
});

describe('WJTTC AERO: deterministic output (no drift between runs)', () => {
  test('two independent fresh dirs produce byte-identical config', () => {
    const a = mkdtempSync(join(tmpdir(), 'faf-grok-a-'));
    const b = mkdtempSync(join(tmpdir(), 'faf-grok-b-'));
    try {
      writeGrokConfig(a);
      writeGrokConfig(b);
      expect(readFileSync(join(a, '.grok', 'config.toml'), 'utf-8'))
        .toBe(readFileSync(join(b, '.grok', 'config.toml'), 'utf-8'));
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});

describe('WJTTC TYRE: live CLI — the real road', () => {
  const cli = join(__dirname, '../../src/cli.ts');
  const run = (cmd: string) =>
    execSync(`bun ${cli} ${cmd}`, { cwd: dir, encoding: 'utf-8', timeout: 30000 });

  beforeEach(() => {
    writeFileSync(
      join(dir, 'project.faf'),
      'faf_version: 3.0.0\nproject:\n  name: wjttc-grok\n  goal: live wiring grip\n  main_language: TypeScript\n',
    );
  });

  test('`faf export --grok` wires the hosted endpoint end-to-end', () => {
    run('export --grok');
    expect(existsSync(cfg())).toBe(true);
    expect(readFileSync(cfg(), 'utf-8')).toContain(GROK_FAF_MCP_URL);
  });

  test('bare `faf export` does NOT touch .grok/ (opt-in guard)', () => {
    run('export');
    expect(existsSync(join(dir, '.grok'))).toBe(false);
  });
});
