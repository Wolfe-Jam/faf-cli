import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';

/**
 * Canonical hosted endpoint for grok-faf-mcp — the URL form Grok CLI chose
 * (hosted SSE over local subprocess: "zero local subprocess, always current").
 * Source of truth: the grok-faf-mcp README install card.
 */
export const GROK_FAF_MCP_URL = 'https://mcpaas.live/grok/mcp/v1';

/** TOML table key for the grok-faf-mcp server entry. */
export const GROK_MCP_TABLE = 'mcp_servers.grok-faf-mcp';

/**
 * The `[mcp_servers.grok-faf-mcp]` block — the "section" wired into
 * `.grok/config.toml`. This is machine-readable wiring, not a rule file:
 * CLAUDE.md *instructs* an AI to read context; this *connects* the FAF MCP.
 */
export function generateGrokConfig(_data?: FafData): string {
  return [`[${GROK_MCP_TABLE}]`, `url = "${GROK_FAF_MCP_URL}"`, ''].join('\n');
}

export type GrokWriteStatus = 'created' | 'merged' | 'unchanged';

/**
 * Wire grok-faf-mcp into `<dir>/.grok/config.toml` — non-destructively.
 * - absent file      → create `.grok/` + write a one-line header + the block ('created')
 * - section missing  → append the block, preserving all existing config ('merged')
 * - already wired     → leave the user's file exactly as-is ('unchanged')
 *
 * Never overwrites or deletes existing config. A stale url in an existing
 * entry is left untouched (idempotent) — re-point by editing the file.
 */
export function writeGrokConfig(dir: string, data?: FafData): GrokWriteStatus {
  const grokDir = join(dir, '.grok');
  const configPath = join(grokDir, 'config.toml');
  const block = generateGrokConfig(data);

  if (!existsSync(configPath)) {
    mkdirSync(grokDir, { recursive: true });
    const header = '# grok-faf-mcp — wired by FAF from project.faf\n\n';
    writeFileSync(configPath, header + block, 'utf-8');
    return 'created';
  }

  const existing = readFileSync(configPath, 'utf-8');
  if (existing.includes(`[${GROK_MCP_TABLE}]`)) {
    return 'unchanged';
  }

  const sep = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  writeFileSync(configPath, existing + sep + block, 'utf-8');
  return 'merged';
}
