import { join } from 'path';
import type { FafData } from '../core/types.js';
import { FAF_CONTEXT_FILES } from '../core/safe-write.js';
import { injectFafBlock } from './inject.js';
import { factText } from './labels.js';

/** Table-of-8 human 6Ws — public WHAT/WHY, never stack/HOW. */
const SIX_WS: ReadonlyArray<{ key: string; heading: string }> = [
  { key: 'who', heading: 'Who' },
  { key: 'what', heading: 'What' },
  { key: 'why', heading: 'Why' },
  { key: 'where', heading: 'Where' },
  { key: 'when', heading: 'When' },
  { key: 'how', heading: 'How' },
];

/** A human fact: the shared rule (labels.ts factText) — the scorer's idea of
 *  filled, as one line. Same text CLAUDE.md, GEMINI.md and the others show. */
function humanFact(v: unknown): string | null {
  return factText(v);
}

/** A value written on its own line stays text: a leading Markdown marker (a
 *  heading #, a quote >, a list item, a fence) is escaped with a backslash. */
function plainLine(v: string): string {
  return /^(#|>|[-*+]\s|\d+[.)]\s|```|~~~)/.test(v) ? `\\${v}` : v;
}

function scalar(map: Record<string, unknown> | undefined, key: string): string | null {
  if (!map) {return null;}
  return humanFact(map[key]);
}

/**
 * Render `llms.txt` from project.faf — llmstxt.org shape (H1, optional
 * blockquote, optional sections). A view, not a format.
 *
 * Filled 6Ws only. Stack, commands, score, and empty human slots are omitted.
 * Blank who/why stay blank — never paraphrased from the README.
 */
export function renderLlmsTxt(data: FafData): string {
  const lines: string[] = [];
  const name = humanFact(data.project?.name) ?? 'Project';
  const goal = humanFact(data.project?.goal);

  lines.push(`# ${name}`);
  lines.push('');
  if (goal) {
    lines.push(`> ${goal}`);
    lines.push('');
  }

  const hc = data.human_context;
  for (const { key, heading } of SIX_WS) {
    const value = scalar(hc, key);
    if (!value) {continue;}
    lines.push(`## ${heading}`);
    lines.push('');
    lines.push(plainLine(value));
    lines.push('');
  }

  const homepage =
    scalar(data.project as Record<string, unknown> | undefined, 'homepage') ??
    scalar(data.project as Record<string, unknown> | undefined, 'url');
  if (homepage && /^(https?:)?\/\//i.test(homepage)) {
    lines.push('## Links');
    lines.push('');
    lines.push(`- [Homepage](${homepage})`);
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/** Write llms.txt — non-destructive: injects/updates the faf block, preserves the rest. */
export function writeLlmsTxt(dir: string, data: FafData): void {
  injectFafBlock(join(dir, FAF_CONTEXT_FILES.llms), renderLlmsTxt(data));
}
