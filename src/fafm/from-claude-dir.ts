/**
 * fromClaudeDir — Claude Code memory store → knowledge Soul.
 * Cite: claude-fafm-sdk 1.0 / fafm-engine serialize_memory approach.
 * Not the proof convert_md_to_fafm (entries/v1.0 anti-pattern).
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, basename, resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { Soul, utcNow } from './soul.js';
import { KNOWLEDGE_TYPES, type Fact } from './types.js';

export const DEFAULT_SKIP = new Set(['MEMORY.md', 'MEMORY-FULL.md', 'README.md']);

const LINK_RE = /\[\[([^\]]+)\]\]/g;

function isoMtime(path: string): string {
  const ms = statSync(path).mtimeMs;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseFrontmatter(text: string): { fm: Record<string, unknown> | null; body: string } {
  if (!text.startsWith('---')) return { fm: null, body: text };
  const parts = text.split('---');
  if (parts.length < 3) return { fm: null, body: text };
  try {
    const fm = parseYaml(parts[1]);
    if (!fm || typeof fm !== 'object') return { fm: null, body: parts.slice(2).join('---').trim() };
    return { fm: fm as Record<string, unknown>, body: parts.slice(2).join('---').trim() };
  } catch {
    return { fm: null, body: text };
  }
}

function factFromTopic(path: string, body: string, fm: Record<string, unknown>): Fact | null {
  if (!fm.name) return null;
  const meta =
    fm.metadata && typeof fm.metadata === 'object'
      ? (fm.metadata as Record<string, unknown>)
      : {};
  const mtype = meta.type;
  if (typeof mtype !== 'string' || !KNOWLEDGE_TYPES.has(mtype)) return null;

  const name = String(fm.name).trim();
  const description =
    fm.description != null && String(fm.description).trim()
      ? String(fm.description).trim()
      : '';
  const text = description || name;

  const extra: Record<string, unknown> = {};
  if (meta.originSessionId) {
    extra.provenance = [`session:${meta.originSessionId}`];
  }

  const links = [...new Set([...body.matchAll(LINK_RE)].map((m) => m[1]))].sort();

  return {
    text,
    id: name,
    type: mtype,
    priority: 'standard',
    tags: [],
    links,
    timestamp: isoMtime(path),
    source: `claude-code memory: ${basename(path)}`,
    extra,
  };
}

/**
 * Convert a Claude Code memory directory into a knowledge Soul.
 */
export function fromClaudeDir(
  path: string,
  opts: { namepoint?: string; skip?: Set<string> } = {},
): Soul {
  const root = resolve(path);
  if (!existsSync(root)) {
    throw new Error(`Claude memory directory not found: ${root}`);
  }
  if (!statSync(root).isDirectory()) {
    throw new Error(`Claude memory path is not a directory: ${root}`);
  }

  const skip = opts.skip ?? DEFAULT_SKIP;
  const namepoint = opts.namepoint ?? `@claude-code:${basename(root)}`;

  const facts: Fact[] = [];
  const files = readdirSync(root)
    .filter((f) => f.endsWith('.md'))
    .sort();

  for (const file of files) {
    if (skip.has(file)) continue;
    const full = join(root, file);
    let text: string;
    try {
      text = readFileSync(full, 'utf-8');
    } catch {
      continue;
    }
    const { fm, body } = parseFrontmatter(text);
    if (!fm) continue;
    const fact = factFromTopic(full, body, fm);
    if (fact) facts.push(fact);
  }

  const stamps = facts.map((f) => f.timestamp).filter(Boolean) as string[];
  const created = stamps.length ? stamps.reduce((a, b) => (a < b ? a : b)) : utcNow();
  const last = stamps.length ? stamps.reduce((a, b) => (a > b ? a : b)) : created;

  const soul = new Soul(namepoint, {
    profile: 'knowledge',
    facts,
    created,
  });
  soul.last_etched = last;
  soul.rebuildIndex();
  return soul;
}
