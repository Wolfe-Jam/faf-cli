import { SLOTS, readSlotValue, isPlaceholder } from './slots.js';

/**
 * Structural slot-diff between two parsed .faf data objects.
 *
 * The v2 content-drift signal that SCORE-DELTA is blind to: a slot whose value
 * changes but stays populated (e.g. `backend: Hono` → `backend: Express`) keeps
 * the score identical, yet shows here as `changed`. Score-delta says "no drift";
 * this says where the DNA actually moved.
 *
 * Single-sources the slot model from core/slots.ts — the canonical 33-slot
 * `SLOTS` schema, `readSlotValue` (legacy/canonical path resolution), and
 * `isPlaceholder` (the one true empty/populated rule). NO re-parsing, NO
 * duplicated placeholder list — that was exactly the rot the mcpaas-cf spike
 * risked before this landed in faf-cli where the slot model lives.
 *
 * BANKED FOR v2 — unwired. No command/tool calls this yet. It's the building
 * block `faf refresh` / `refresh_faf` will use to report content drift, and the
 * spec behind the WJTTC v1 skipped-test marker in grok-faf-mcp.
 */
export type SlotChangeStatus = 'added' | 'removed' | 'changed';

export interface SlotChange {
  /** Canonical slot path, e.g. "human_context.who" or "stack.backend". */
  path: string;
  status: SlotChangeStatus;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {return true;}
  // Slot values are scalars or simple lists in practice; normalized JSON keeps
  // the comparison stable across arrays/objects without a deep-equal dependency.
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Diff two .faf data objects across the canonical slots. Returns the slots that
 * were added (empty→populated), removed (populated→empty), or changed
 * (populated→different value). Empty/placeholder values never count as content.
 */
export function diffFafSlots(
  baseline: Record<string, unknown>,
  current: Record<string, unknown>,
): SlotChange[] {
  const changes: SlotChange[] = [];
  for (const slot of SLOTS) {
    const baseVal = readSlotValue(baseline, slot);
    const curVal = readSlotValue(current, slot);
    const basePopulated = !isPlaceholder(baseVal);
    const curPopulated = !isPlaceholder(curVal);

    if (!basePopulated && curPopulated) {
      changes.push({ path: slot.path, status: 'added' });
    } else if (basePopulated && !curPopulated) {
      changes.push({ path: slot.path, status: 'removed' });
    } else if (basePopulated && curPopulated && !valuesEqual(baseVal, curVal)) {
      changes.push({ path: slot.path, status: 'changed' });
    }
  }
  return changes;
}
