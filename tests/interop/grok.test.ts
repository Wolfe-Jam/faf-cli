import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  GROK_FAF_MCP_URL,
  GROK_MCP_TABLE,
  generateGrokConfig,
  writeGrokConfig,
} from '../../src/interop/grok.js';

describe('TYRE: interop/grok — .grok/config.toml MCP wiring', () => {
  let testDir: string;
  const configPath = () => join(testDir, '.grok', 'config.toml');

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-grok-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  // --- generate ---

  test('generateGrokConfig emits the canonical [mcp_servers.grok-faf-mcp] block', () => {
    const block = generateGrokConfig();
    expect(block).toContain(`[${GROK_MCP_TABLE}]`);
    expect(block).toContain(`url = "${GROK_FAF_MCP_URL}"`);
  });

  test('canonical URL is the hosted form Grok chose', () => {
    expect(GROK_FAF_MCP_URL).toBe('https://mcpaas.live/grok/mcp/v1');
    expect(GROK_MCP_TABLE).toBe('mcp_servers.grok-faf-mcp');
  });

  // --- write: created ---

  test('writeGrokConfig creates .grok/config.toml when absent', () => {
    const status = writeGrokConfig(testDir);
    expect(status).toBe('created');
    expect(existsSync(configPath())).toBe(true);

    const written = readFileSync(configPath(), 'utf-8');
    expect(written).toContain(`[${GROK_MCP_TABLE}]`);
    expect(written).toContain(`url = "${GROK_FAF_MCP_URL}"`);
    // quiet one-line header, not a banner
    expect(written.startsWith('# grok-faf-mcp')).toBe(true);
  });

  // --- write: idempotent (unchanged) ---

  test('writeGrokConfig is idempotent — second run is unchanged + byte-identical', () => {
    expect(writeGrokConfig(testDir)).toBe('created');
    const first = readFileSync(configPath(), 'utf-8');

    expect(writeGrokConfig(testDir)).toBe('unchanged');
    const second = readFileSync(configPath(), 'utf-8');

    expect(second).toBe(first);
  });

  // --- write: merged (non-destructive) ---

  test('writeGrokConfig appends to an existing config without clobbering it', () => {
    mkdirSync(join(testDir, '.grok'), { recursive: true });
    const existing = '[mcp_servers.some-other-server]\nurl = "https://example.com/mcp"\n';
    writeFileSync(configPath(), existing, 'utf-8');

    const status = writeGrokConfig(testDir);
    expect(status).toBe('merged');

    const merged = readFileSync(configPath(), 'utf-8');
    // existing config survives in full
    expect(merged).toContain('[mcp_servers.some-other-server]');
    expect(merged).toContain('https://example.com/mcp');
    // and ours is added
    expect(merged).toContain(`[${GROK_MCP_TABLE}]`);
    expect(merged).toContain(GROK_FAF_MCP_URL);
  });

  test('merge then re-run leaves the other server + ours intact (unchanged)', () => {
    mkdirSync(join(testDir, '.grok'), { recursive: true });
    writeFileSync(configPath(), '[mcp_servers.other]\nurl = "https://x.dev"\n', 'utf-8');

    expect(writeGrokConfig(testDir)).toBe('merged');
    expect(writeGrokConfig(testDir)).toBe('unchanged');

    const final = readFileSync(configPath(), 'utf-8');
    expect(final).toContain('[mcp_servers.other]');
    expect(final).toContain('https://x.dev');
    // exactly one grok-faf-mcp entry (no duplicate appended on re-run)
    const occurrences = final.split(`[${GROK_MCP_TABLE}]`).length - 1;
    expect(occurrences).toBe(1);
  });
});
