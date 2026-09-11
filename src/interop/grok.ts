import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';
import { readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';

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
export function renderGrokConfig(_data?: FafData): string {
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
 * The project folder is the boundary: a `.grok/` or `config.toml` linked
 * outside it (or a dangling link) is refused, and writes are atomic. A
 * config.toml that is not UTF-8 is refused and left as it is.
 */
export function writeGrokConfig(dir: string, data?: FafData): GrokWriteStatus {
  const grokDir = join(dir, '.grok');
  const block = renderGrokConfig(data);

  mkdirSync(grokDir, { recursive: true });
  const configPath = resolveInside(dir, join('.grok', 'config.toml'));
  if (!existsSync(configPath)) {
    const header = '# grok-faf-mcp — wired by FAF from project.faf\n\n';
    safeWriteFile(configPath, header + block, { root: dir });
    return 'created';
  }

  const existing = readUtf8(configPath);
  if (existing.includes(`[${GROK_MCP_TABLE}]`)) {
    return 'unchanged';
  }

  const sep = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  safeWriteFile(configPath, existing + sep + block, { root: dir });
  return 'merged';
}
