/**
 * Shared .faf assembly pipeline. The full slot-filling flow used to build a
 * FRESH .faf for a directory:
 *   detect → interrogate → slotignore inactive categories → Turbo-Cat → Relentless
 *
 * Used by BOTH `faf auto` (new-file path) and `faf git` (cloned repo) so they
 * can't drift — `faf git` previously ran detectStack alone (~33% vs ~75%).
 */

import { detectStack } from './stack.js';
import { interrogateRepo } from '../interrogate/index.js';
import { turboCatSlots } from './turbo-cat.js';
import { relentlessContext } from './relentless.js';
import {
  APP_TYPE_CATEGORIES,
  SLOTS,
  SLOT_BY_PATH,
  SLOTIGNORED,
  isExplicitNone,
  isPlaceholder,
} from '../core/slots.js';
import type { SlotDef } from '../core/types.js';
import { asFafMapping, isMapping } from '../core/shape.js';
import { carryFafSource } from '../core/faf-source.js';

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
 * A typed none (`None` / `N/A` / `not applicable`, any case) is an empty
 * slot — it scores 0 until filled. In a tech slot (every slot but the 6Ws) a
 * repo fact fills it: "if it's a fact, fill the slot". With no fact the typed
 * words stay exactly as the file has them, comment included, and faf never
 * writes `slotignored` over them — `slotignored` comes only from the
 * app-type. In a 6W (`human_context.*`) a typed none is the person's: auto
 * never replaces it (`faf go` asks). A slot that says `slotignored` under
 * either of its names (`stack.db` for `stack.database`) gets no detected
 * value under either.
 */
export function updateExistingFaf(dir: string, existing: Record<string, unknown>): Record<string, unknown> {
  const base = liftScalarProject(asFafMapping(existing, 'updateExistingFaf: the existing .faf'));
  const withInterrogated = fillEmpties(base, interrogateRepo(dir) as Record<string, unknown>);
  const merged = fillEmpties(withInterrogated, detectStack(dir) as Record<string, unknown>);
  const withFormats = fillEmpties(merged, turboCatSlots(dir) as Record<string, unknown>);
  const filled = fillEmpties(withFormats, { human_context: relentlessContext(dir) } as Record<string, unknown>);
  // The result is the read `existing` came from, filled: writeFaf checks it
  // against that read, so an edit made while detection ran is never written over.
  return carryFafSource(existing, keepNotApplicable(filled, base));
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

/** `slotignored`: the app-type leaves the slot out. A typed none is not this. */
const isSlotIgnored = (v: unknown): boolean => typeof v === 'string' && v.trim() === SLOTIGNORED;

/** True when `base` says `slotignored` under one of the slot's names and
 *  holds no real value under any of them. */
function decidedNotApplicable(base: Record<string, unknown>, locs: string[]): boolean {
  const values = locs.map(loc => fieldAt(base, loc));
  return values.some(isSlotIgnored) && values.every(v => isPlaceholder(v) || isSlotIgnored(v));
}

/** After filling: a slot `base` marks `slotignored` gets no detected value
 *  under any of its names — each keeps exactly what `base` had there. Only
 *  `slotignored` is kept this way; a typed none is an empty slot, and a fact
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

/** Fill empty/placeholder slots in `target` with values from `source`.
 *  `target` wins when its slot is non-empty. Empty here is per `isPlaceholder`
 *  (covers '', null, undefined, and known placeholder strings) — this is what
 *  lets interrogated/detected values overwrite the empty-string defaults that
 *  detectStack writes to human_context.
 *
 *  A typed none (`None`, `N/A`, `not applicable`, any case) is an empty slot,
 *  but only a fact replaces the words: in a tech slot (every slot but the
 *  6Ws, under either of its names) a source value that is real content — not
 *  empty, not a placeholder, not `slotignored` — fills it. Anything else
 *  leaves the typed words exactly as they are: no fact, a 6W
 *  (`human_context.*`, the person's), or a place that is not a slot.
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
 *  placeholder or a typed none, and not `slotignored` (the app-type's word,
 *  never a fact about the repo). */
function isFact(value: unknown): boolean {
  if (typeof value === 'number' || typeof value === 'boolean') {return true;}
  return typeof value === 'string' && value.trim() !== '' && !isPlaceholder(value) && !isSlotIgnored(value);
}

/** True when `value` may replace a typed none at `path`: a fact, in a tech slot. */
function factFillsTypedNone(path: string, value: unknown): boolean {
  return isTechSlot(path) && isFact(value);
}

function fillAt(target: Record<string, unknown>, source: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (path === '_meta' && existing !== undefined) {continue;}
    if (isExplicitNone(existing)) {
      // A typed none is an empty slot: a fact fills a tech slot; otherwise the words stay.
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
