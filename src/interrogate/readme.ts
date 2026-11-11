/**
 * README.md interrogation — extract slot content from semantic markdown anchors.
 *
 * Per faf-auto-no-guess-no-slop:
 *   Each extractor looks for a specific anchor (heading, structural pattern).
 *   If the anchor is missing or the content fails validation → return undefined.
 *   No slot is synthesized from another slot's content.
 */

import { readRepoFile, repoExists } from '../core/safe-write.js';
import { type ExtractedContext, dropSetextTitle, firstSentence, isCallout, isValidExtraction, EXTRACTION_LIMITS, SECTION_HEADINGS } from './types.js';

/** Strip badge / image lines + blank lines from the top of a README */
/** Section headings each slot reads from. */
// The WHOLE heading must be one of these (a trailing ':' or '?' allowed): a
// heading that only starts with the word is about something else —
// "How to install", "Status codes", "Who is using X?", "Why not Y?".
const whole = (names: readonly string[]): RegExp => new RegExp(`^(${names.join('|')})\\s*[:?]?$`, 'i');
const GOAL_SECTION = whole(SECTION_HEADINGS.goal);
const WHAT_SECTION = whole(SECTION_HEADINGS.what);
const WHO_SECTION = whole(SECTION_HEADINGS.who);
const WHY_SECTION = whole(SECTION_HEADINGS.why);
const WHERE_SECTION = whole(SECTION_HEADINGS.where);
const WHEN_SECTION = whole(SECTION_HEADINGS.when);
const HOW_SECTION = whole(SECTION_HEADINGS.how);

function stripPreamble(content: string): string {
  const lines = dropSetextTitle(content.split('\n'));
  let i = 0;
  // Skip the title line (first H1) and any blank/badge lines after it
  while (i < lines.length && /^(#\s|$)/.test(lines[i].trim())) {i++;}
  while (i < lines.length) {
    const line = lines[i].trim();
    // Badge lines: [![alt](url)](url) — image links inside markdown links
    if (/^\[!\[/.test(line)) { i++; continue; }
    // Standalone images: ![alt](url)
    if (/^!\[/.test(line)) { i++; continue; }
    // HTML banners (<p align="center">, <div>, <img>, <h1>, closing tags):
    // a block tag, or a line that is only tags. A prose line that opens with
    // inline HTML ("<b>pa</b> is a fast search tool…") is the paragraph.
    if (/^<\/?[a-z][\w-]*/i.test(line) && (BANNER_TAG.test(line) || line.replace(/<[^>]*>/g, '').trim() === '')) { i++; continue; }
    // The # title, when a banner came before it
    if (/^#\s/.test(line)) { i++; continue; }
    // Link rows: [Docs](…) | [Blog](…) — navigation, not prose
    if (/^(\*\*)?\[[^\]]+\]\([^)]*\)/.test(line) && /[|·•]|&bull;/i.test(line)) { i++; continue; }
    // Reference definitions: [circleci-image]: https://… (not [text](url) links)
    if (/^\[[^\]]+\]:\s*\S/.test(line)) { i++; continue; }
    // Wrapped badge URL continuation lines (after a [![… line was dropped)
    if (/^https?:\/\/\S*\)?\s*$/.test(line)) { i++; continue; }
    // Blank lines
    if (line === '') { i++; continue; }
    break;
  }
  return lines.slice(i).join('\n');
}

const BANNER_TAG = /^<\/?(?:p|div|img|h[1-6]|picture|source|table|center|details|summary|video|svg|br|hr)\b/i;

/** A one-line blockquote's text when it is a tagline, else null (a callout,
 *  or a quote that runs on to the next line). */
function quoteTagline(line: string, next: string | undefined): string | null {
  const quote = line.replace(/^>\s*/, '');
  const oneLine = !/^>/.test((next ?? '').trim());
  return oneLine && quote && !isCallout(quote) ? quote : null;
}

/** Get the first prose paragraph (single block, no headings/lists/code) */
function firstProseParagraph(content: string): string | null {
  const stripped = stripPreamble(content);
  const lines = stripped.split('\n');
  const buf: string[] = [];
  for (const [n, raw] of lines.entries()) {
    const line = raw.trim();
    // A one-line blockquote tagline under the title ("> Next Generation
    // Frontend Tooling") — not a callout (> [!NOTE], > ⚠️ Nightly release…).
    if (buf.length === 0 && /^>/.test(line)) {return quoteTagline(line, lines[n + 1]);}
    if (line === '') {
      if (buf.length > 0) {break;}
      continue;
    }
    // Stop at next heading / list / code / quote / table
    if (/^(#|>|```|---|\||\s*[-*+]\s|\d+\.\s)/.test(line)) {break;}
    if (/^\[[^\]]+\]:\s*\S/.test(line)) {continue;}
    if (/^https?:\/\/\S*\)?\s*$/.test(line)) {continue;}
    // Skip pure-bold-tagline lines like "**For Grok. For the rockets.**"
    // (these are punchy spirit lines, not informative goal content)
    if (/^\*\*[^*]+\*\*\s*$/.test(line) && buf.length === 0) {continue;}
    buf.push(line);
  }
  if (buf.length === 0) {return null;}
  return buf.join(' ').trim();
}

/** Extract content following a heading whose text matches `pattern` */
function sectionContent(content: string, pattern: RegExp): string | null {
  return sectionWithHeading(content, pattern)?.text ?? null;
}

/** The first section whose heading matches `pattern`: its prose and the
 *  heading as written (`Status`, `Who is this for`), for a suggestion's source. */
function sectionWithHeading(content: string, pattern: RegExp): { text: string; heading: string } | null {
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
        if (nextHeading && nextHeading[1].length <= headingLevel) {break;}
        if (next === '') { if (buf.length > 0) {break;} i++; continue; }
        // Stop at structural elements (code blocks, lists, tables)
        if (/^(>|```|---|\||\s*[-*+]\s|\d+\.\s)/.test(next)) {break;}
        buf.push(next);
        i++;
      }
      if (buf.length === 0) {return null;}
      return { text: buf.join(' ').trim(), heading: m[2].trim() };
    }
    i++;
  }
  return null;
}

/** Extract `project.goal` — first prose paragraph or ## Use Case / ## Goal */
export function extractGoal(content: string): string | undefined {
  // Anchor 1: explicit "## Use Case" / "## Use Cases" / "## Goal" section
  const explicit = sectionContent(content, GOAL_SECTION);
  if (explicit && isValidExtraction(explicit)) {return explicit;}

  // Anchor 2: first prose paragraph after title/badges
  const tagline = firstProseParagraph(content);
  if (tagline && isValidExtraction(tagline)) {return tagline;}

  return undefined;
}

/** Extract `human_context.what` — ## About / ## Description / ## Overview */
export function extractWhat(content: string): string | undefined {
  const text = sectionContent(content, WHAT_SECTION);
  if (text && isValidExtraction(text)) {return text;}
  return undefined;
}

/** Extract `human_context.who` — ## Audience / ## For Whom / ## Users */
export function extractWho(content: string): string | undefined {
  const text = sectionContent(content, WHO_SECTION);
  if (text && isValidExtraction(text)) {return text;}
  return undefined;
}

/** Extract `human_context.why` — ## Why / ## Motivation / ## Problem */
export function extractWhy(content: string): string | undefined {
  const text = sectionContent(content, WHY_SECTION);
  if (text && isValidExtraction(text)) {return text;}
  return undefined;
}

/** Extract `human_context.where` — ## Deployment / ## Where it runs / ## Install */
export function extractWhere(content: string): string | undefined {
  // Prefer specific "where it runs" / "deployment" over generic "install"
  const specific = sectionContent(content, WHERE_SECTION);
  if (specific && isValidExtraction(specific)) {return specific;}
  return undefined;
}

/** Extract `human_context.when` — ## Status / ## History / "Production since" */
export function extractWhen(content: string): string | undefined {
  const text = sectionContent(content, WHEN_SECTION);
  if (text && isValidExtraction(text)) {return text;}
  return undefined;
}

/** Extract `human_context.how` — ## Architecture / ## How it works / ## Approach */
export function extractHow(content: string): string | undefined {
  const text = sectionContent(content, HOW_SECTION);
  if (text && isValidExtraction(text)) {return text;}
  return undefined;
}

/** Read README.md and extract per-slot content. Returns {} if no README. */
export function interrogateReadme(dir: string): ExtractedContext {
  const candidates = ['README.md', 'README.MD', 'Readme.md', 'readme.md'];
  let path: string | null = null;
  for (const name of candidates) {
    if (repoExists(dir, name)) { path = name; break; }
  }
  if (!path) {return {};}

  let content = readRepoFile(dir, path);
  if (content === null) {return {};}
  // HTML comment blocks (asset notes, TODO markers, marketing briefs) are not
  // prose — strip before any extraction so their text can't seed a slot.
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  const result: ExtractedContext = {};

  const goal = extractGoal(content);
  if (goal) {result.project = { goal };}

  const human: NonNullable<ExtractedContext['human_context']> = {};
  const what = extractWhat(content); if (what) {human.what = what;}
  const who = extractWho(content); if (who) {human.who = who;}
  const why = extractWhy(content); if (why) {human.why = why;}
  const where = extractWhere(content); if (where) {human.where = where;}
  const when = extractWhen(content); if (when) {human.when = when;}
  const how = extractHow(content); if (how) {human.how = how;}

  if (Object.keys(human).length > 0) {result.human_context = human;}

  return result;
}

/** A README find with where it came from: `README.md § Status`. */
export interface ReadmeFind { value: string; source: string }

/** The README's goal and six W's, each with its source — suggestions for the
 *  human to confirm in `faf go`, never written to project.faf by init or auto.
 *  Same anchors and slop rules as the extractors above. {} if no README. */
export function interrogateReadmeSourced(dir: string): Record<string, ReadmeFind> {
  const name = ['README.md', 'README.MD', 'Readme.md', 'readme.md'].find(n => repoExists(dir, n));
  if (!name) {return {};}
  const raw = readRepoFile(dir, name);
  if (raw === null) {return {};}
  const content = raw.replace(/<!--[\s\S]*?-->/g, '');
  const out: Record<string, ReadmeFind> = {};
  const take = (path: string, pattern: RegExp): boolean => {
    const s = sectionWithHeading(content, pattern);
    if (!s) {return false;}
    // A body that ends in a list intro ("…a few major components:") gives
    // its first sentence, whole, when that sentence is the fact.
    const value = isValidExtraction(s.text) ? s.text
      : /:\s*$/.test(s.text) ? firstSentence(s.text) : null;
    if (value && isValidExtraction(value)) {
      out[path] = { value, source: `${name} § ${s.heading}` };
      return true;
    }
    return false;
  };

  if (!take('project.goal', GOAL_SECTION)) {
    const tagline = firstProseParagraph(content);
    if (tagline && isValidExtraction(tagline)) {
      out['project.goal'] = { value: tagline, source: `${name} § first paragraph` };
    } else if (tagline && tagline.length > EXTRACTION_LIMITS.MAX_LENGTH) {
      // Too long to be the goal: its first sentence, whole, may be.
      const sentence = firstSentence(tagline);
      if (sentence && isValidExtraction(sentence)) {out['project.goal'] = { value: sentence, source: `${name} § first sentence` };}
    }
  }
  take('human_context.what', WHAT_SECTION);
  take('human_context.who', WHO_SECTION);
  take('human_context.why', WHY_SECTION);
  take('human_context.where', WHERE_SECTION);
  take('human_context.when', WHEN_SECTION);
  take('human_context.how', HOW_SECTION);
  return out;
}
