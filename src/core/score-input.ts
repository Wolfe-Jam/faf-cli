/**
 * The text faf's scoring kernel reads. A hand-written `None`, `N/A` or `not
 * applicable` at a slot is a decision — the same one faf writes as
 * `slotignored` (Q8) — so it scores as `slotignored`. faf keeps the user's
 * words in the file; only the copy handed to the kernel says `slotignored`.
 */
import { isScalar } from 'yaml';
import { SLOTS, SLOTIGNORED, isExplicitNone } from './slots.js';
import { editYaml } from './yaml-edit.js';

/** A line that could hold an explicit none (a cheap first look). */
const NONE_LINE = /:[ \t]*(["']?)(none|n\/a|not applicable)\1[ \t]*(#.*)?$/im;

/** Every place a slot can live: its on-wire path and its Mk4 canonical name. */
const SLOT_PATHS: string[][] = SLOTS.flatMap(s => (s.canonical ? [s.path, s.canonical] : [s.path]).map(p => p.split('.')));

/**
 * `yaml` as the kernel should score it: each slot whose value is a
 * hand-written explicit none reads `slotignored`; every other byte is as
 * given. YAML faf cannot edit is scored as it is.
 */
export function scoringText(yaml: string): string {
  if (!NONE_LINE.test(yaml)) {return yaml;}
  try {
    return editYaml(yaml, doc => {
      for (const path of SLOT_PATHS) {
        const node = doc.getIn(path, true);
        if (isScalar(node) && isExplicitNone(node.value)) {node.value = SLOTIGNORED;}
      }
    }).text;
  } catch {
    return yaml;
  }
}
