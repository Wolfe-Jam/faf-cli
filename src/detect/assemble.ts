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
import { APP_TYPE_CATEGORIES, SLOTS, isPlaceholder } from '../core/slots.js';
import { asFafMapping, isMapping } from '../core/shape.js';

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
 */
export function updateExistingFaf(dir: string, existing: Record<string, unknown>): Record<string, unknown> {
  const base = liftScalarProject(asFafMapping(existing, 'updateExistingFaf: the existing .faf'));
  const withInterrogated = fillEmpties(base, interrogateRepo(dir) as Record<string, unknown>);
  const merged = fillEmpties(withInterrogated, detectStack(dir) as Record<string, unknown>);
  const withFormats = fillEmpties(merged, turboCatSlots(dir) as Record<string, unknown>);
  return fillEmpties(withFormats, { human_context: relentlessContext(dir) } as Record<string, unknown>);
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
 *  detectStack writes to human_context. */
export function fillEmpties(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (isPlaceholder(existing)) {
      result[key] = value;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing)
    ) {
      result[key] = fillEmpties(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    }
  }
  return result;
}
