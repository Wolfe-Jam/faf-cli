/**
 * Intent suggestions — the goal and the six W's, as the repo suggests them.
 *
 * "AI cannot fill human slots. It can only suggest." `faf init` and `faf auto`
 * never write these slots; `faf go` shows each suggestion in gray and the
 * human confirms, edits, replaces or skips it. Nothing here is stored: the
 * suggestions are read from the repo (README, package.json, Cargo.toml) each
 * time they're asked for, so the .faf format stays clean and a suggestion is
 * never staler than the file it came from.
 *
 * Sourced or nothing: every suggestion names where it came from
 * (`README.md § Status`, `package.json description`).
 *
 * Target only. Every slot has three outcomes — Target (the validated fact for
 * that slot), Slop (waffle, nonsense, markup) and Misplaced (good info, wrong
 * slot) — and only a Target is suggested: every candidate passes the one gate
 * (isValidExtraction), headings match whole, and no text is offered for two
 * slots.
 *
 * Exported so other surfaces can show the same suggestions (the `/faf-go`
 * skill and CFM's `faf_go`, via buildTableOf8 as `detailed` + `goal`); today
 * only the CLI's `faf go` reads it.
 */

import { readRepoFile, repoExists } from './safe-write.js';
import { interrogateReadmeSourced } from '../interrogate/readme.js';
import { interrogateCargo } from '../interrogate/cargo.js';
import { relentlessContextDetailed } from '../detect/relentless.js';
import { detectStack } from '../detect/stack.js';
import { isPlaceholder, isTypedWords } from './slots.js';
import { isValidExtraction } from '../interrogate/types.js';
import { getNestedValue } from './dot-path.js';

/** The human-authored slots: the goal and the six W's. */
export const INTENT_PATHS = [
  'project.goal',
  'human_context.who',
  'human_context.what',
  'human_context.why',
  'human_context.where',
  'human_context.when',
  'human_context.how',
] as const;

export type IntentPath = (typeof INTENT_PATHS)[number];

export interface Suggestion {
  value: string;
  /** Where it came from: `README.md § Status`, `package.json description`. */
  source: string;
}

export type IntentSuggestions = Partial<Record<IntentPath, Suggestion>>;

/** True for the goal and the six W's — slots only a human fills. */
export function isIntentPath(path: string): path is IntentPath {
  return (INTENT_PATHS as readonly string[]).includes(path);
}

/** The package.json description, unless the root package.json is a polyglot
 *  repo's tooling shell (it describes the tooling, not the product). */
function packageDescription(dir: string, toolingRoot: boolean): string | null {
  if (toolingRoot) {return null;}
  const raw = readRepoFile(dir, 'package.json');
  if (raw === null) {return null;}
  try {
    const d = (JSON.parse(raw) as { description?: unknown }).description;
    return typeof d === 'string' && d.trim() ? d.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Suggestions for the goal and the six W's in `dir`. When `faf` (the current
 * .faf data) is given, a slot it already fills gets no suggestion — the
 * human's words are never second-guessed. Precedence: README (sections, then
 * the tagline) → package.json description → Cargo.toml description →
 * Relentless (README + manifest, sourced).
 */
export function suggestIntent(dir: string, faf?: Record<string, unknown>): IntentSuggestions {
  const found = ((detectStack(dir) as { _meta?: { found?: string[] } })._meta?.found) ?? [];
  const toolingRoot = found.some(f => f.startsWith('polyglot:'));
  const out: IntentSuggestions = {};
  // Real words and typed words (None, N/A, unknown) are the person's: no
  // suggestion competes with either — and their slot takes no text from another.
  const theirs = new Set<string>(faf ? INTENT_PATHS.filter(p => isTheirs(getNestedValue(faf, p))) : []);
  const offered: string[] = [];
  const refs = readmeRefs(dir);
  const offer = (path: IntentPath, value: string | undefined | null, source: string): void => {
    if (out[path] || theirs.has(path) || !value) {return;}
    const v = asProse(value, refs);
    // One gate for every source; and one text, one slot.
    const key = words(v);
    if (!isValidExtraction(v) || offered.some(o => sameText(o, key))) {return;}
    offered.push(key);
    out[path] = { value: v, source: sourceName(source) };
  };

  // The README leads: the project in its own words. The package.json
  // description follows; it often describes the repo, not the project
  // ("monorepo for svelte.dev").
  offerReadme(dir, offer);

  const desc = packageDescription(dir, toolingRoot);
  offer('project.goal', desc, 'package.json description');
  offer('human_context.what', desc, 'package.json description');

  offer('project.goal', interrogateCargo(dir).project?.goal, 'Cargo.toml description');

  const relentless = relentlessContextDetailed(dir, { toolingRoot }) as Record<string, { value: string; source: string } | undefined>;
  for (const w of ['who', 'what', 'why', 'where', 'when', 'how'] as const) {
    const r = relentless[w];
    if (r) {offer(`human_context.${w}`, r.value, r.source);}
  }
  return out;
}

/** True when the slot holds the person's words: real words or typed words. */
function isTheirs(cur: unknown): boolean {
  return isTypedWords(cur) || (typeof cur === 'string' && cur.trim() !== '' && !isPlaceholder(cur));
}

/** Text as a person reads it: markdown links as their words, no emphasis
 *  markers or inline HTML tags, entities as characters, one line. Real
 *  brackets and underscores stay: `arr[i]`, `Foo[T]`, `[WIP]`, `__init__.py`. */
export function asProse(text: string, refs: ReadonlySet<string> = new Set()): string {
  return decodeEntities(text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/(?<![\w\]])\[([^\]]+)\]\([^)]*\)/g, '$1')
    // [text][ref] and a bare [ref] — only after a space, never an index (arr[i])
    .replace(/(?<![\w\]])\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    .replace(/(?<![\w\]])\[([^\]]+)\](?![[(:])/g, (all: string, t: string) => refs.has(t.toLowerCase()) ? t : all)
    .replace(/<\/?(?:a|b|i|em|strong|code|kbd|span|sup|sub|mark|small|u|s)\b[^>]*>/gi, '')
    // Nested mixed markers (_**bold**_, **italic**) — strip before single/double passes
    .replace(/_\*\*(.+?)\*\*_/g, '$1')
    .replace(/\*\*_(.+?)_\*\*/g, '$1')
    // `*` emphasis may sit inside a word (*ser*ializing, **bold**ly) and nest
    // (**…*ser*…**): stripped until nothing changes. `_` only around words,
    // never inside an identifier (snake_case, __init__.py).
    .replace(/[\s\S]*/, stripStars)
    .replace(/(^|[^\w])(__)(?=\S)(.+?)(?<=\S)\2(?!\w|\.\w)/g, '$1$3')
    .replace(/(^|[^\w])(_)(?=[^\s_])(.+?)(?<=[^\s_])\2(?!\w|\.\w)/g, '$1$3')
    .replace(/`([^`]+)`/g, '$1'))
    .replace(/\s+/g, ' ')
    .trim();
}

/** `t` without `*` / `**` emphasis markers, nested ones too. */
function stripStars(t: string): string {
  for (let i = 0; i < 4; i++) {
    const next = t
      .replace(/\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, '$1')
      .replace(/\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*/g, '$1');
    if (next === t) {break;}
    t = next;
  }
  return t;
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', bull: '•', mdash: '—', ndash: '–', hellip: '…', copy: '©', reg: '®', trade: '™',
};

/** Decode numeric/named entities; leave token on invalid or unsafe code points (no throw). */
function decodeEntities(t: string): string {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all: string, e: string) => {
    if (e[0] !== '#') {return ENTITIES[e.toLowerCase()] ?? all;}
    const cp = e[1].toLowerCase() === 'x' ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1));
    if (!Number.isFinite(cp) || cp <= 0x1f || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) {return all;}
    return String.fromCodePoint(cp);
  });
}

/** The labels the README defines for reference links (`[WSGI]: https://…`). */
function readmeRefs(dir: string): Set<string> {
  const name = ['README.md', 'README.MD', 'Readme.md', 'readme.md'].find(n => repoExists(dir, n));
  const raw = name ? readRepoFile(dir, name) ?? '' : '';
  return new Set([...raw.matchAll(/^ {0,3}\[([^\]]+)\]:\s*\S/gm)].map(m => m[1].toLowerCase()));
}

/** The README's finds, each for its slot. When a `## Goal` / `## Use cases`
 *  section took the goal, the README's tagline (its first paragraph or
 *  sentence) is offered for `what` — blocked if it is the same text. */
function offerReadme(dir: string, offer: (path: IntentPath, value: string | undefined, source: string) => void): void {
  const readme = interrogateReadmeSourced(dir);
  for (const [path, find] of Object.entries(readme)) {
    if (isIntentPath(path)) {offer(path, find.value, find.source);}
  }
  const g = readme['project.goal'];
  if (g && /§ first (paragraph|sentence)$/.test(g.source)) {offer('human_context.what', g.value, g.source);}
}

/** Letters and digits only, lower case: the words of a text. */
function words(t: string): string {
  return t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** The same text: one holds the other and the shorter is most of the longer
 *  ("Fast, minimalist web framework" / "…web framework for Node.js"), or most
 *  words are shared ("…command-line programs" / "…command-line interfaces").
 *  A short phrase inside a longer, different sentence is not the same text. */
function sameText(a: string, b: string): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.includes(short) && short.length >= 0.6 * long.length) {return true;}
  const wa = new Set(a.split(' '));
  const wb = new Set(b.split(' '));
  const shared = [...wa].filter(w => wb.has(w)).length;
  return shared / new Set([...wa, ...wb]).size >= 0.7;
}

/** One way to name a source, whichever reader found it: Relentless says
 *  `README:## Why` / `README:first-paragraph` / `package.json:description`;
 *  people read `README.md § Why` / `README.md § first paragraph` /
 *  `package.json description`. */
export function sourceName(source: string): string {
  if (source === 'README:first-paragraph') {return 'README.md § first paragraph';}
  if (source === 'README:first-sentence') {return 'README.md § first sentence';}
  const heading = source.match(/^README:##\s*(.+)$/);
  if (heading) {return `README.md § ${heading[1].trim()}`;}
  return source.replace(/^package\.json:description$/, 'package.json description');
}

/** The one line init and auto print when suggestions are waiting, or null:
 *  `3 suggestions for the goal and the six W's (README.md, package.json) —
 *  confirm them in 'faf go'`. */
export function suggestionNote(dir: string, faf?: Record<string, unknown>): string | null {
  const s = Object.values(suggestIntent(dir, faf)).filter((v): v is Suggestion => Boolean(v));
  if (s.length === 0) {return null;}
  // Relentless names a README find `README:…`; say the file the same way everywhere.
  const fileOf = (source: string): string => {
    const f = source.split(/[\s:§]/)[0];
    return f === 'README' ? 'README.md' : f;
  };
  const files = [...new Set(s.map(v => fileOf(v.source)))].join(', ');
  const [noun, them] = s.length === 1 ? ['suggestion', 'it'] : ['suggestions', 'them'];
  return `${s.length} ${noun} for the goal and the six W's (${files}) — confirm ${them} in 'faf go'`;
}
