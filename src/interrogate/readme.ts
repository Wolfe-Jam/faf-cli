/**
 * README.md interrogation — extract slot content from semantic markdown anchors.
 *
 * Per faf-auto-no-guess-no-slop:
 *   Each extractor looks for a specific anchor (heading, structural pattern).
 *   If the anchor is missing or the content fails validation → return undefined.
 *   No slot is synthesized from another slot's content.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type ExtractedContext, isValidExtraction } from './types.js';

/** Strip badge / image lines + blank lines from the top of a README */
function stripPreamble(content: string): string {
  const lines = content.split('\n');
  let i = 0;
  // Skip the title line (first H1) and any blank/badge lines after it
  while (i < lines.length && /^(#\s|$)/.test(lines[i].trim())) i++;
  while (i < lines.length) {
    const line = lines[i].trim();
    // Badge lines: [![alt](url)](url) — image links inside markdown links
    if (/^\[!\[/.test(line)) { i++; continue; }
    // Standalone images: ![alt](url)
    if (/^!\[/.test(line)) { i++; continue; }
    // HTML img tags
    if (/^<img\s/i.test(line)) { i++; continue; }
    // Blank lines
    if (line === '') { i++; continue; }
    break;
  }
  return lines.slice(i).join('\n');
}

/** Get the first prose paragraph (single block, no headings/lists/code) */
function firstProseParagraph(content: string): string | null {
  const stripped = stripPreamble(content);
  const lines = stripped.split('\n');
  const buf: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      if (buf.length > 0) break;
      continue;
    }
    // Stop at next heading / list / code / quote / table
    if (/^(#|>|```|---|\||\s*[-*+]\s|\d+\.\s)/.test(line)) break;
    // Skip pure-bold-tagline lines like "**For Grok. For the rockets.**"
    // (these are punchy spirit lines, not informative goal content)
    if (/^\*\*[^*]+\*\*\s*$/.test(line) && buf.length === 0) continue;
    buf.push(line);
  }
  if (buf.length === 0) return null;
  return buf.join(' ').trim();
}

/** Extract content following a heading whose text matches `pattern` */
function sectionContent(content: string, pattern: RegExp): string | null {
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m && pattern.test(m[2])) {
      const headingLevel = m[1].length;
      // Read prose lines until next heading of same-or-higher level
      const buf: string[] = [];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        const nextHeading = next.match(/^(#{1,6})\s+/);
        if (nextHeading && nextHeading[1].length <= headingLevel) break;
        if (next === '') { if (buf.length > 0) break; i++; continue; }
        // Stop at structural elements (code blocks, lists, tables)
        if (/^(>|```|---|\||\s*[-*+]\s|\d+\.\s)/.test(next)) break;
        buf.push(next);
        i++;
      }
      if (buf.length === 0) return null;
      return buf.join(' ').trim();
    }
    i++;
  }
  return null;
}

/** Extract `project.goal` — first prose paragraph or ## Use Case / ## Goal */
export function extractGoal(content: string): string | undefined {
  // Anchor 1: explicit "## Use Case" / "## Use Cases" / "## Goal" section
  const explicit = sectionContent(content, /^(use\s+cases?|goal)\b/i);
  if (explicit && isValidExtraction(explicit)) return explicit;

  // Anchor 2: first prose paragraph after title/badges
  const tagline = firstProseParagraph(content);
  if (tagline && isValidExtraction(tagline)) return tagline;

  return undefined;
}

/** Extract `human_context.what` — ## About / ## Description / ## Overview */
export function extractWhat(content: string): string | undefined {
  const text = sectionContent(content, /^(about|description|overview|what(\s+is\s+this)?)\b/i);
  if (text && isValidExtraction(text)) return text;
  return undefined;
}

/** Extract `human_context.who` — ## Audience / ## For Whom / ## Users */
export function extractWho(content: string): string | undefined {
  const text = sectionContent(content, /^(audience|users?|for\s+whom|who(\s+is\s+this\s+for)?)\b/i);
  if (text && isValidExtraction(text)) return text;
  return undefined;
}

/** Extract `human_context.why` — ## Why / ## Motivation / ## Problem */
export function extractWhy(content: string): string | undefined {
  const text = sectionContent(content, /^(why|motivation|problem|rationale)\b/i);
  if (text && isValidExtraction(text)) return text;
  return undefined;
}

/** Extract `human_context.where` — ## Deployment / ## Where it runs / ## Install */
export function extractWhere(content: string): string | undefined {
  // Prefer specific "where it runs" / "deployment" over generic "install"
  const specific = sectionContent(content, /^(deployment|where(\s+it\s+runs)?|hosting)\b/i);
  if (specific && isValidExtraction(specific)) return specific;
  return undefined;
}

/** Extract `human_context.when` — ## Status / ## History / "Production since" */
export function extractWhen(content: string): string | undefined {
  const text = sectionContent(content, /^(status|history|timeline|since|launched)\b/i);
  if (text && isValidExtraction(text)) return text;
  return undefined;
}

/** Extract `human_context.how` — ## Architecture / ## How it works / ## Approach */
export function extractHow(content: string): string | undefined {
  const text = sectionContent(content, /^(architecture|how(\s+it\s+works)?|approach|design)\b/i);
  if (text && isValidExtraction(text)) return text;
  return undefined;
}

/** Read README.md and extract per-slot content. Returns {} if no README. */
export function interrogateReadme(dir: string): ExtractedContext {
  const candidates = ['README.md', 'README.MD', 'Readme.md', 'readme.md'];
  let path: string | null = null;
  for (const name of candidates) {
    const full = join(dir, name);
    if (existsSync(full)) { path = full; break; }
  }
  if (!path) return {};

  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    return {};
  }

  const result: ExtractedContext = {};

  const goal = extractGoal(content);
  if (goal) result.project = { goal };

  const human: NonNullable<ExtractedContext['human_context']> = {};
  const what = extractWhat(content); if (what) human.what = what;
  const who = extractWho(content); if (who) human.who = who;
  const why = extractWhy(content); if (why) human.why = why;
  const where = extractWhere(content); if (where) human.where = where;
  const when = extractWhen(content); if (when) human.when = when;
  const how = extractHow(content); if (how) human.how = how;

  if (Object.keys(human).length > 0) result.human_context = human;

  return result;
}
