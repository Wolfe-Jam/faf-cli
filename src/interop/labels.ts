/**
 * Shared label formatting for the AI-context emitters (CLAUDE.md, AGENTS.md,
 * .github/copilot-instructions.md). ONE acronym-aware Title-Caser so `api_type`
 * renders "API Type" everywhere — not "Api Type" in one file and a raw
 * `api_type` key in another. Unified 2026-06-25 (faf-cli 6.15.1).
 *
 * Labels are registry-first: `slotLabel()` reads the canonical label from the
 * slot registry ("know your stack"); the acronym-aware `titleLabel()` is only a
 * fallback for off-registry freeform keys.
 */

import { SLOT_BY_PATH } from '../core/slots.js';

/** All-caps acronym tokens that stay upper-cased inside a Title-Cased label. */
export const ACRONYMS = new Set([
  'API', 'CI', 'CD', 'MCP', 'CLI', 'SDK', 'UI', 'UX', 'AI', 'ML', 'DB', 'ORM',
  'OS', 'HTTP', 'HTTPS', 'REST', 'RPC', 'JSON', 'YAML', 'XML', 'SQL', 'CSS',
  'HTML', 'AWS', 'GCP', 'CDN', 'DNS', 'JWT', 'ID', 'IP', 'URL', 'URI', 'TS', 'JS',
]);

/**
 * snake_case → Title Case, acronym-aware.
 * `api_type` → "API Type", `mcp_sdk` → "MCP SDK", `runtime` → "Runtime".
 */
export function titleLabel(key: string): string {
  return key
    .split('_')
    .map((w) => {
      if (!w) {return w;}
      const up = w.toUpperCase();
      return ACRONYMS.has(up) ? up : w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/** A slot value that carries real content (not empty, not slotignored). */
export function filled(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '' && v.trim() !== 'slotignored';
}

/**
 * The canonical display label for a .faf slot path, sourced from the slot
 * registry ("know your stack") — `stack.cicd` → "CI/CD", `stack.api_type` → "API".
 * Resolves legacy OR canonical paths (SLOT_BY_PATH is dual-keyed). Falls back to
 * the acronym-aware Title-Caser for off-registry freeform keys.
 */
export function slotLabel(path: string): string {
  const slot = SLOT_BY_PATH.get(path);
  if (slot?.label) {return slot.label;}
  const key = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : path;
  return titleLabel(key);
}
