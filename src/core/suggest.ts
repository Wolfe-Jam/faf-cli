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
 * One source for every surface — the CLI's `faf go`, the `/faf-go` skill and
 * CFM's `faf_go` (feed it to buildTableOf8 as `detailed` + `goal`).
 */

import { readRepoFile } from './safe-write.js';
import { interrogateReadmeSourced } from '../interrogate/readme.js';
import { interrogateCargo } from '../interrogate/cargo.js';
import { relentlessContextDetailed } from '../detect/relentless.js';
import { detectStack } from '../detect/stack.js';
import { isPlaceholder, isTypedWords } from './slots.js';
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
 * human's words are never second-guessed. Precedence is the order init used
 * to fill in: package.json description → README sections → Cargo.toml
 * description → Relentless (README + manifest, sourced).
 */
export function suggestIntent(dir: string, faf?: Record<string, unknown>): IntentSuggestions {
  const found = ((detectStack(dir) as { _meta?: { found?: string[] } })._meta?.found) ?? [];
  const toolingRoot = found.some(f => f.startsWith('polyglot:'));
  const out: IntentSuggestions = {};
  const offer = (path: IntentPath, value: string | undefined | null, source: string): void => {
    if (out[path] || !value || !value.trim()) {return;}
    out[path] = { value: value.trim(), source };
  };

  const desc = packageDescription(dir, toolingRoot);
  offer('project.goal', desc, 'package.json description');
  offer('human_context.what', desc, 'package.json description');

  for (const [path, find] of Object.entries(interrogateReadmeSourced(dir))) {
    if (isIntentPath(path)) {offer(path, find.value, find.source);}
  }

  offer('project.goal', interrogateCargo(dir).project?.goal, 'Cargo.toml description');

  const relentless = relentlessContextDetailed(dir, { toolingRoot }) as Record<string, { value: string; source: string } | undefined>;
  for (const w of ['who', 'what', 'why', 'where', 'when', 'how'] as const) {
    const r = relentless[w];
    if (r) {offer(`human_context.${w}`, r.value, r.source);}
  }

  if (faf) {
    for (const p of INTENT_PATHS) {
      const cur = getNestedValue(faf, p);
      // Real words and typed words (None, N/A, unknown) are the person's:
      // no suggestion competes with either.
      if (isTypedWords(cur) || (typeof cur === 'string' && cur.trim() && !isPlaceholder(cur))) {delete out[p];}
    }
  }
  return out;
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
