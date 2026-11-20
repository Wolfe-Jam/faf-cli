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

import { parse, parseDocument } from 'yaml';
import { SLOT_BY_PATH, isPlaceholder } from '../core/slots.js';
import { fafSourceOf, type FafSource } from '../core/faf-source.js';

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
 * become one space, so a value never opens a new line in the host file. Files
 * that put a bullet or comment marker before each value (CLAUDE.md, GEMINI.md,
 * .cursorrules, Copilot, MEMORY.md) are then safe; llms.txt writes values on
 * their own line and escapes a leading Markdown marker itself (llms.ts).
 * One slot, one fact, one line.
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

/** The .faf as written: every scalar as the text in the file (YAML failsafe
 *  schema), one parse per source text. */
const writtenTrees = new WeakMap<FafSource, unknown>();
function writtenTree(data: object): unknown {
  const src = fafSourceOf(data);
  if (!src) {return undefined;}
  if (!writtenTrees.has(src)) {
    let tree: unknown;
    try { tree = parseDocument(src.text, { schema: 'failsafe' }).toJS(); } catch { tree = undefined; }
    writtenTrees.set(src, tree);
  }
  return writtenTrees.get(src);
}

/** The written text for number `v`, when it parses back to the same number. */
function numberAsWritten(v: number, w: unknown): number | string {
  if (typeof w !== 'string') {return v;}
  let back: unknown;
  try { back = parse(w); } catch { return v; }
  const same = typeof back === 'number' && (Object.is(back, v) || (Number.isNaN(back) && Number.isNaN(v)));
  return same ? w : v;
}

/** `v` with every number replaced by the text written in the file (`w`, the
 *  same place in the written tree): `2026.10` stays `2026.10`, not `2026.1`.
 *  Only when that text parses back to the same number (an alias follows to the
 *  text it points to), so a merge key or any other shape the two trees do not
 *  share keeps today's value. */
function asWritten(v: unknown, w: unknown): unknown {
  if (typeof v === 'number') {return numberAsWritten(v, w);}
  if (Array.isArray(v)) {return v.map((x, i) => asWritten(x, Array.isArray(w) ? w[i] : undefined));}
  if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
    const wm = (w !== null && typeof w === 'object' && !Array.isArray(w) ? w : {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, asWritten(x, wm[k])]));
  }
  return v;
}

/**
 * The fact at `path` in .faf data as one line (factText), with numbers as
 * written in the file. YAML reads an unquoted `2026.10`, `0x1F` or `1e3` as a
 * number and loses the text; this puts it back from the file faf read, so every
 * context file shows what the person wrote. Data that was not read from a file
 * (no source recorded) renders as before.
 */
export function factAt(data: object, path: readonly string[]): string | null {
  let v: unknown = data;
  let w: unknown = writtenTree(data);
  for (const k of path) {
    v = v !== null && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined;
    w = w !== null && typeof w === 'object' ? (w as Record<string, unknown>)[k] : undefined;
  }
  return factText(asWritten(v, w));
}

/**
 * The filled six W's, in fixed order, as [label, value] pairs ("Who", "What",
 * "Why", "Where", "When", "How"). One source for every context file faf writes
 * (CLAUDE.md, GEMINI.md, .cursorrules, Copilot), so they agree word for word.
 * Each renderer formats the pairs in its host file's own style.
 */
export function sixWsFilled(data: { human_context?: unknown }): [string, string][] {
  const out: [string, string][] = [];
  for (const k of ['who', 'what', 'why', 'where', 'when', 'how'] as const) {
    const t = factAt(data, ['human_context', k]);
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
