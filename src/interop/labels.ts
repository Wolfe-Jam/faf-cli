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

import { SLOT_BY_PATH, isPlaceholder } from '../core/slots.js';

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
 * A six-W value as one line of text, or null when the slot does not count as
 * filled. Same rule as the scorer: empty, `slotignored` and placeholder words
 * (TBD, None, N/A, …; isPlaceholder) are not facts. Numbers, booleans, dates
 * and lists are facts and render as text. Line breaks and runs of spaces
 * become one space, so a value can never open a heading, a fence or a new
 * line in the host file. One slot, one fact, one line.
 */
export function factText(v: unknown): string | null {
  if (v === null || v === undefined) {return null;}
  if (typeof v === 'string') {
    const t = v.replace(/\s+/g, ' ').trim();
    if (t === '' || t.toLowerCase() === 'slotignored' || isPlaceholder(t)) {return null;}
    return t;
  }
  if (typeof v === 'number' || typeof v === 'boolean') {return String(v);}
  if (v instanceof Date) {
    const iso = v.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  if (Array.isArray(v)) {
    const items = v.map(factText).filter((x): x is string => x !== null);
    return items.length ? items.join(', ') : null;
  }
  if (typeof v === 'object') {
    const parts = Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => { const t = factText(x); return t === null ? null : `${k}: ${t}`; })
      .filter((x): x is string => x !== null);
    return parts.length ? parts.join('; ') : null;
  }
  return null;
}

/**
 * The filled six W's, in fixed order, as [label, value] pairs ("Who", "What",
 * "Why", "Where", "When", "How"). One source for every context file faf writes
 * (CLAUDE.md, GEMINI.md, .cursorrules, Copilot), so they agree word for word.
 * Each renderer formats the pairs in its host file's own style.
 */
export function sixWsFilled(data: { human_context?: unknown }): [string, string][] {
  const hc = (data.human_context && typeof data.human_context === 'object' ? data.human_context : {}) as Record<string, unknown>;
  const out: [string, string][] = [];
  for (const k of ['who', 'what', 'why', 'where', 'when', 'how'] as const) {
    const t = factText(hc[k]);
    if (t !== null) {out.push([slotLabel(`human_context.${k}`), t]);}
  }
  return out;
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
