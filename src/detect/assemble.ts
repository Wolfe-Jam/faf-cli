/**
 * Shared .faf assembly pipeline. The full slot-filling flow used to build a
 * FRESH .faf for a directory:
 *   detect → interrogate → slotignore inactive categories → Turbo-Cat → Relentless
 *
 * Used by BOTH `faf auto` (new-file path) and `faf git` (cloned repo) so they
 * can't drift — `faf git` previously ran detectStack alone (~33% vs ~75%).
 */

import { detectStack, detectStackWithFacts } from './stack.js';
import { interrogateRepo } from '../interrogate/index.js';
import { turboCatSlots } from './turbo-cat.js';
import { relentlessContext } from './relentless.js';
import {
  APP_TYPE_CATEGORIES,
  NO_CLASSIFYING_SIGNALS,
  SLOTS,
  SLOT_BY_PATH,
  SLOTIGNORED,
  appTypeUsesSlot,
  isPlaceholder,
  isTypedWords,
} from '../core/slots.js';
import type { SlotDef } from '../core/types.js';
import { asFafMapping, isMapping } from '../core/shape.js';
import { carryFafSource, fafSourceOf, markAsFill } from '../core/faf-source.js';
import { typeIsFallback } from '../core/typed-none.js';

/** Build a fresh .faf for `dir` using the full slot-filling pipeline. */
export function assembleFreshFaf(dir: string): Record<string, unknown> {
  const detected = detectStack(dir) as Record<string, unknown>;
  const facts = interrogateRepo(dir);

  // File-facts (stack / commands / security — docker-compose, Makefile, .env)
  // are ground truth: they WIN over detectStack's root-only presence guesses.
  const factLayer: Record<string, unknown> = {};
  if (facts.stack) {factLayer.stack = facts.stack;}
  if (facts.commands) {factLayer.commands = facts.commands;}
  if (facts.security) {factLayer.security = facts.security;}
  // Prose (goal / 6Ws — README, Cargo.toml) fills empties only.
  const proseLayer: Record<string, unknown> = {};
  if (facts.project) {proseLayer.project = facts.project;}
  if (facts.human_context) {proseLayer.human_context = facts.human_context;}

  const seeded = fillEmpties(fillEmpties(factLayer, detected), proseLayer);
  applySlotIgnore(seeded);
  // Polyglot repos: the root package.json is a tooling shell — don't let its
  // description/scripts seed the product's 6Ws.
  const found = (detected._meta as { found?: string[] } | undefined)?.found ?? [];
  const toolingRoot = found.some(f => f.startsWith('polyglot:'));
  const withFormats = fillEmpties(seeded, turboCatSlots(dir) as Record<string, unknown>);
  return fillEmpties(withFormats, { human_context: relentlessContext(dir, { toolingRoot }) } as Record<string, unknown>);
}

/**
 * Update an EXISTING .faf for `dir`. Existing values win; interrogated → detected
 * → Turbo-Cat (formats) → Relentless (6 W's) fill only the remaining empties.
 * This is exactly the chain `faf auto` runs on an existing file — exported so
 * consumers (faf-mcp's faf_auto) compose it instead of re-deriving it and
 * drifting (they used to merge assembleFreshFaf's slotignore'd output over the
 * existing file, losing interrogated facts such as a docker-compose Redis).
 *
 * Shape: `existing` must be a mapping (an empty document, null, reads as `{}`);
 * a scalar or a list throws rather than being spread into character keys. A
 * non-null scalar `project:` (older writers stored `project: <name>`) is lifted
 * to `{ name: String(value) }`, so the name is kept and the rest can be filled.
 *
 * Words typed into a slot — a typed none (`None` / `N/A` / `not applicable`)
 * or any other placeholder word (`unknown`, `"null"`), any case — are an
 * empty slot: they score 0 until filled.
 *   - In a tech slot (every slot but the 6Ws) a repo fact fills it: "if it's
 *     a fact, fill the slot". With no fact the words stay exactly as the file
 *     has them, comment included; faf never writes `''` over them.
 *   - In a tech slot the file's app-type (`project.type`) leaves out, the
 *     app-type's decision is the fact: with no repo fact, the slot becomes
 *     `slotignored` (shown as N/A) in place of the words, an empty value or a
 *     placeholder. A real value there is kept. `slotignored` comes only from
 *     the app-type — in a slot the app-type uses, it is never written, even
 *     when detection reads the repo as another type; such a slot gets the
 *     repo's fact for it instead (`runtime: Go` from go.mod), or keeps what
 *     it had. A `project.type` faf does not know decides nothing, and neither
 *     does the `library` detection falls back to when the repo has no
 *     classifying signal.
 *   - In a 6W (`human_context.*`) the words are the person's: auto never
 *     replaces them (`faf go` asks).
 * A slot that says `slotignored` under either of its names (`stack.db` for
 * `stack.database`) gets no detected value under either. A slot the file
 * names only by its Mk4 name (`stack.db`) keeps that name: faf adds no
 * on-wire twin (`stack.database`), and a repo fact fills the name the file
 * uses.
 *
 * The result is marked as a fill: writeFaf leaves a node with an anchor that
 * an alias reads as written (`frontend: &x None` with `ui_library: *x`) —
 * filling it would change every alias — and reports it like a kept alias.
 */
export function updateExistingFaf(dir: string, existing: Record<string, unknown>): Record<string, unknown> {
  const base = liftScalarProject(asFafMapping(existing, 'updateExistingFaf: the existing .faf'));
  const { data, facts } = detectStackWithFacts(dir);
  const detected = data as Record<string, unknown>;
  const withInterrogated = fillEmpties(base, interrogateRepo(dir) as Record<string, unknown>);
  const merged = fillEmpties(withInterrogated, detected);
  const withFormats = fillEmpties(merged, turboCatSlots(dir) as Record<string, unknown>);
  const filled = useFileSlotNames(fillEmpties(withFormats, { human_context: relentlessContext(dir) } as Record<string, unknown>), base);
  const decided = scoredNamesInStep(appTypeIsFact(existing, base, detected)
    ? applyAppType(keepNotApplicable(filled, base), base, facts)
    : keepNotApplicable(filled, base), base);
  // The result is the read `existing` came from, filled: writeFaf checks it
  // against that read, so an edit made while detection ran is never written over.
  return markAsFill(carryFafSource(existing, decided));
}

/** True when the app-type the filled file will declare is a fact: a type the
 *  file names (unless its line carries faf's `# found: no classifying signals
 *  — fallback` note, as the `library` faf fell back to does), or one detection
 *  fills in from a classifying signal. faf's fallback decides no slot, on
 *  this run or a later one. */
function appTypeIsFact(existing: Record<string, unknown>, base: Record<string, unknown>, detected: Record<string, unknown>): boolean {
  if (!isPlaceholder(fieldAt(base, 'project.type'))) {
    const text = fafSourceOf(existing)?.text;
    return text === undefined || !typeIsFallback(text);
  }
  const found = (detected._meta as { found?: string[] } | undefined)?.found ?? [];
  return !found.includes(NO_CLASSIFYING_SIGNALS);
}

/** The places a slot can live: its on-wire path and its Mk4 canonical name. */
function slotLocations(slot: SlotDef): string[] {
  return slot.canonical ? [slot.path, slot.canonical] : [slot.path];
}

/** `section.field` of a .faf data object (every slot path has two parts). */
function fieldAt(data: Record<string, unknown>, path: string): unknown {
  const [section, field] = path.split('.');
  const s = data[section];
  return isMapping(s) ? s[field] : undefined;
}

/** Set (or, with `undefined`, remove) `section.field`, copying the section so
 *  the caller's objects are never changed. Setting the value the field
 *  already holds leaves the section as it is (no copy, no change for the
 *  merge to see). */
function putField(data: Record<string, unknown>, path: string, value: unknown): void {
  const [section, field] = path.split('.');
  const s = data[section];
  if (!isMapping(s)) {return;}
  if (value === undefined ? !(field in s) : s[field] === value) {return;}
  const copy = { ...s };
  if (value === undefined) {
    delete copy[field];
  } else {
    copy[field] = value;
  }
  data[section] = copy;
}

/** `slotignored`: the app-type leaves the slot out. Typed words are not this. */
const isSlotIgnored = (v: unknown): boolean => typeof v === 'string' && v.trim() === SLOTIGNORED;

/** True when `base` says `slotignored` under one of the slot's names and
 *  holds no real value under any of them. */
function decidedNotApplicable(base: Record<string, unknown>, locs: string[]): boolean {
  const values = locs.map(loc => fieldAt(base, loc));
  return values.some(isSlotIgnored) && values.every(v => isPlaceholder(v) || isSlotIgnored(v));
}

/** After filling: a slot `base` marks `slotignored` gets no detected value
 *  under any of its names — each keeps exactly what `base` had there. Only
 *  `slotignored` is kept this way; typed words are an empty slot, and a fact
 *  fills it (see fillEmpties). */
function keepNotApplicable(filled: Record<string, unknown>, base: Record<string, unknown>): Record<string, unknown> {
  const out = { ...filled };
  for (const slot of SLOTS) {
    const locs = slotLocations(slot);
    if (!decidedNotApplicable(base, locs)) {continue;}
    for (const loc of locs) {
      const before = fieldAt(base, loc);
      if (fieldAt(out, loc) !== before) {putField(out, loc, before);}
    }
  }
  return out;
}

/** True when `data` has a key at `section.field` (whatever its value). */
function hasField(data: Record<string, unknown>, path: string): boolean {
  const [section, field] = path.split('.');
  const s = data[section];
  return isMapping(s) && Object.prototype.hasOwnProperty.call(s, field);
}

/** A slot the file names only by its Mk4 name (`stack.db`, not
 *  `stack.database`) keeps that one name: the on-wire twin the fill added is
 *  taken out again, and a repo fact it carried fills the Mk4 name when that
 *  holds no real value (empty, or typed words) — "if it's a fact, fill the
 *  slot", under the name the file uses. */
function useFileSlotNames(filled: Record<string, unknown>, base: Record<string, unknown>): Record<string, unknown> {
  const out = { ...filled };
  for (const slot of SLOTS) {
    if (!slot.canonical || !hasField(base, slot.canonical) || hasField(base, slot.path)) {continue;}
    const twin = fieldAt(out, slot.path);
    putField(out, slot.path, undefined);
    const own = fieldAt(out, slot.canonical);
    if (isFact(twin) && isPlaceholder(own)) {putField(out, slot.canonical, twin);}
  }
  return out;
}

/** The scoring kernel reads a slot under its on-wire name (`stack.database`),
 *  never its Mk4 name (`stack.db`). When the file names a slot only by its
 *  Mk4 name, faf keeps the on-wire name in step with it — a repo fact or
 *  `slotignored` — so the score counts what the file says. faf adds that
 *  key; the file's own line is left as the steps above decided. A Mk4 name
 *  that still holds no real value (empty, or typed words) adds nothing: the
 *  slot is empty under either name. */
function scoredNamesInStep(decided: Record<string, unknown>, base: Record<string, unknown>): Record<string, unknown> {
  const out = { ...decided };
  for (const slot of SLOTS) {
    if (!slot.canonical || !hasField(base, slot.canonical) || hasField(base, slot.path)) {continue;}
    const own = fieldAt(out, slot.canonical);
    if (isFact(own) || isSlotIgnored(own)) {putField(out, slot.path, own);}
  }
  return out;
}

/** The file's app-type decides which tech slots count (after filling, so a
 *  type detection filled in counts too; a type faf does not know decides
 *  nothing):
 *   - a slot it leaves out that holds no real value under either of its
 *     names — only empty values, placeholders or typed words — becomes
 *     `slotignored`, under each of the slot's names the file has (or its
 *     on-wire name when it has neither);
 *   - a slot it uses never takes `slotignored` from detection (which may have
 *     read the repo as another type): it gets the repo's fact for it from
 *     `facts` (detection's fact for every stack slot, whatever the type), or
 *     keeps what `base` had there (`''` when `base` had nothing). A
 *     `slotignored` of the file's own stays. */
function applyAppType(filled: Record<string, unknown>, base: Record<string, unknown>, facts: Record<string, string> = {}): Record<string, unknown> {
  const project = filled.project;
  const type = isMapping(project) ? project.type : undefined;
  const out = { ...filled };
  for (const slot of SLOTS) {
    if (slot.category === 'human' || slot.category === 'project') {continue;}
    const uses = appTypeUsesSlot(type, slot);
    if (uses === null) {return filled;}
    if (uses) {
      keepUsedSlot(out, base, slot, slot.path.startsWith('stack.') ? facts[slot.path.slice('stack.'.length)] : undefined);
    } else {
      markLeftOutSlot(out, slot);
    }
  }
  return out;
}

/** A slot the app-type uses takes no `slotignored` from detection: each name
 *  of it gets back what `base` had there (`''` when it had nothing). Then,
 *  when the repo has a fact for the slot (`fact`, detection's value whatever
 *  the type) and the slot holds no real value under any of its names, each
 *  name the file has that holds none — empty, or typed words, never the
 *  file's own `slotignored` — gets the fact (the on-wire name when it has
 *  neither): "if it's a fact, fill the slot". */
function keepUsedSlot(out: Record<string, unknown>, base: Record<string, unknown>, slot: SlotDef, fact: string | undefined): void {
  const locs = slotLocations(slot);
  for (const loc of locs) {
    if (isSlotIgnored(fieldAt(out, loc)) && !isSlotIgnored(fieldAt(base, loc))) {
      putField(out, loc, hasField(base, loc) ? fieldAt(base, loc) : '');
    }
  }
  if (!isFact(fact)) {return;}
  const present = locs.filter(loc => hasField(out, loc));
  if (present.some(loc => !isPlaceholder(fieldAt(out, loc)))) {return;} // a real value (or the file's slotignored) stays
  for (const loc of present.length > 0 ? present : [slot.path]) {putField(out, loc, fact);}
}

/** A slot the app-type leaves out, with no real value under either of its
 *  names, becomes `slotignored` under each name the file has (or its on-wire
 *  name when it has neither). A real value there is kept. */
function markLeftOutSlot(out: Record<string, unknown>, slot: SlotDef): void {
  const present = slotLocations(slot).filter(loc => hasField(out, loc));
  const real = (loc: string): boolean => !isPlaceholder(fieldAt(out, loc)) && !isSlotIgnored(fieldAt(out, loc));
  if (present.some(real)) {return;}
  for (const loc of present.length > 0 ? present : [slot.path]) {
    if (isPlaceholder(fieldAt(out, loc))) {putField(out, loc, SLOTIGNORED);}
  }
}

/** `project: <scalar>` → `project: { name: String(value) }`. A list is left as it is
 *  (fillEmpties never descends into or spreads a list). Returns a new object. */
function liftScalarProject(data: Record<string, unknown>): Record<string, unknown> {
  const project = data.project;
  if (project === null || project === undefined || isMapping(project) || Array.isArray(project)) {return data;}
  return { ...data, project: { name: String(project) } };
}

/** Mark slots outside the app-type's active categories as `slotignored`. */
function applySlotIgnore(seeded: Record<string, unknown>): void {
  const projectType = (seeded.project as { type?: string } | undefined)?.type ?? 'library';
  const activeCategories = APP_TYPE_CATEGORIES[projectType] || APP_TYPE_CATEGORIES.library;
  for (const slot of SLOTS) {
    if (activeCategories.includes(slot.category)) {continue;}
    const [section, field] = slot.path.split('.');
    if (section === 'stack' && seeded.stack) {
      (seeded.stack as Record<string, string>)[field] = 'slotignored';
    }
    if (section === 'monorepo' && seeded.monorepo) {
      (seeded.monorepo as Record<string, string>)[field] = 'slotignored';
    }
  }
}

/** Fill empty slots in `target` with values from `source`. `target` wins
 *  when its slot is non-empty. Empty here is '', null, undefined, an empty
 *  list or mapping — this is what lets interrogated/detected values overwrite
 *  the empty-string defaults that detectStack writes to human_context.
 *
 *  Typed words — a typed none (`None`, `N/A`, `not applicable`) or any other
 *  placeholder word (`unknown`, `"null"`), any case — are an empty slot, but
 *  only a fact replaces them: in a tech slot (every slot but the 6Ws, under
 *  either of its names) a source value that is real content — not empty, not
 *  a placeholder, not `slotignored` — fills it. Anything else leaves the
 *  words exactly as they are: no fact, a 6W (`human_context.*`, the
 *  person's), or a place that is not a slot.
 *
 *  A `_meta` the target already carries (the user's own) is never filled
 *  over: faf's runtime `_meta` from `source` is merged only into a target
 *  without one. */
export function fillEmpties(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  return fillAt(target, source, '');
}

/** A tech slot: any slot but the 6Ws, under its path or its canonical name. */
function isTechSlot(path: string): boolean {
  const slot = SLOT_BY_PATH.get(path);
  return slot !== undefined && slot.category !== 'human';
}

/** A value the repo gave for a slot: real content. Not empty, not a
 *  placeholder or typed words, and not `slotignored` (the app-type's word,
 *  never a fact about the repo). */
function isFact(value: unknown): boolean {
  if (typeof value === 'number' || typeof value === 'boolean') {return true;}
  return typeof value === 'string' && value.trim() !== '' && !isPlaceholder(value) && !isSlotIgnored(value);
}

/** True when `value` may replace typed words at `path`: a fact, in a tech slot. */
function factFillsTypedNone(path: string, value: unknown): boolean {
  return isTechSlot(path) && isFact(value);
}

function fillAt(target: Record<string, unknown>, source: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (path === '_meta' && existing !== undefined) {continue;}
    if (isTypedWords(existing)) {
      // Typed words are an empty slot: a fact fills a tech slot; otherwise the words stay.
      if (factFillsTypedNone(path, value)) {result[key] = value;}
      continue;
    }
    if (isPlaceholder(existing)) {
      result[key] = value;
    } else if (isMapping(value) && isMapping(existing)) {
      result[key] = fillAt(existing, value, path);
    }
  }
  return result;
}
