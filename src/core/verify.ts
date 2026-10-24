/**
 * The Rules, applied before the kernel counts.
 *
 *   All slots are empty by default. There are always 33 slots. The app-type
 *   defines which slots are required; the slots that are not required are
 *   `slotignored`. A required slot is either empty (does not score) or
 *   populated (scores).
 *
 * The kernel counts slots and knows nothing about app-types or what a slot
 * holds. This module hands it a view of the file that obeys The Rules, and
 * lists every place the file itself does not. The file is never changed here.
 */
import { parse, stringify } from 'yaml';
import type { SlotDef } from './types.js';
import { SLOTS, SLOTIGNORED, appTypeUsesSlot, isPlaceholder, normalizeAppType } from './slots.js';

export type SlotIssue =
  | { kind: 'type-missing' }
  | { kind: 'type-unknown'; value: string }
  | { kind: 'type-spelling'; value: string; type: string }
  | { kind: 'slotignored-required'; slot: string; type: string | null }
  | { kind: 'not-required'; slot: string; type: string }
  | { kind: 'not-a-value'; slot: string; found: string };

export interface VerifiedSlots {
  /** The app-type, as faf knows it; null when missing or unknown. */
  type: string | null;
  issues: SlotIssue[];
  /** The data the kernel counts: the file with The Rules applied. */
  view: Record<string, unknown>;
  /** True when `view` differs from the file. */
  changed: boolean;
}

/** `slotignored` in any case or padding. */
function isSlotignoredWord(v: unknown): boolean {
  return typeof v === 'string' && v.trim().toLowerCase() === SLOTIGNORED;
}

/** A real value for a slot: text that is not a placeholder, a number, or a
 *  list holding at least one of those. true/false and mappings are not. */
function isRealValue(v: unknown): boolean {
  if (typeof v === 'number') {return Number.isFinite(v);}
  if (typeof v === 'string') {return v.trim() !== '' && !isPlaceholder(v);}
  if (Array.isArray(v)) {return v.some(x => !Array.isArray(x) && isRealValue(x));}
  return false;
}

/** What the kernel would count as populated although it holds no real value. */
function countedButEmpty(v: unknown): boolean {
  if (typeof v === 'boolean') {return true;}
  if (Array.isArray(v)) {return v.length > 0;}
  if (v !== null && typeof v === 'object') {return Object.keys(v).length > 0;}
  return false;
}

function kindOf(v: unknown): string {
  if (typeof v === 'boolean') {return v ? 'true' : 'false';}
  if (Array.isArray(v)) {return 'a list with no value in it';}
  return 'a mapping';
}

function locationsOf(slot: SlotDef): string[] {
  return slot.canonical ? [slot.path, slot.canonical] : [slot.path];
}

function getAt(data: Record<string, unknown>, path: string): { found: boolean; value: unknown } {
  const [section, field] = path.split('.');
  const s = data[section];
  if (s === null || typeof s !== 'object' || Array.isArray(s)) {return { found: false, value: undefined };}
  if (!Object.prototype.hasOwnProperty.call(s, field)) {return { found: false, value: undefined };}
  return { found: true, value: (s as Record<string, unknown>)[field] };
}

function setAt(data: Record<string, unknown>, path: string, value: unknown): void {
  const [section, field] = path.split('.');
  const s = data[section];
  const sec = s !== null && typeof s === 'object' && !Array.isArray(s) ? { ...(s as Record<string, unknown>) } : {};
  sec[field] = value;
  data[section] = sec;
}

/** Apply The Rules to parsed .faf `data`. */
export function verifySlots(data: Record<string, unknown>): VerifiedSlots {
  const issues: SlotIssue[] = [];
  const project = data.project;
  const raw = project !== null && typeof project === 'object' && !Array.isArray(project)
    ? (project as Record<string, unknown>).type : undefined;
  const type = normalizeAppType(raw);
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    issues.push({ kind: 'type-missing' });
  } else if (type === null) {
    issues.push({ kind: 'type-unknown', value: typeof raw === 'string' ? raw : JSON.stringify(raw) });
  } else if (raw !== type) {
    issues.push({ kind: 'type-spelling', value: String(raw), type });
  }

  const view: Record<string, unknown> = { ...data };
  let changed = false;
  const put = (path: string, value: unknown): void => { setAt(view, path, value); changed = true; };

  for (const slot of SLOTS) {
    // Without a type faf knows, no slot can be "not required".
    const required = type === null ? true : appTypeUsesSlot(type, slot) === true;
    const locs = locationsOf(slot);
    const present = locs.map(loc => ({ loc, ...getAt(data, loc) })).filter(p => p.found);

    if (!required) {
      // Not required: slotignored, whatever the file holds there.
      const valued = present.find(p => isRealValue(p.value));
      if (valued) {issues.push({ kind: 'not-required', slot: slot.path, type: type as string });}
      if (present.length === 0) {put(slot.path, SLOTIGNORED);}
      for (const p of present) {if (p.value !== SLOTIGNORED) {put(p.loc, SLOTIGNORED);}}
      continue;
    }

    for (const p of present) {
      if (isSlotignoredWord(p.value)) {
        issues.push({ kind: 'slotignored-required', slot: slot.path, type });
        put(p.loc, '');
      } else if (countedButEmpty(p.value) && !isRealValue(p.value)) {
        issues.push({ kind: 'not-a-value', slot: slot.path, found: kindOf(p.value) });
        put(p.loc, '');
      }
    }
  }
  return { type, issues, view, changed };
}

/** The YAML the kernel counts: `yaml` itself when it already obeys The Rules. */
export function verifiedYaml(yaml: string): string {
  const data = parse(yaml) as unknown;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {return yaml;}
  const { view, changed } = verifySlots(data as Record<string, unknown>);
  return changed ? stringify(view) : yaml;
}

/** One line per issue, for `faf check` and `faf score`. */
export function describeIssue(issue: SlotIssue): string {
  switch (issue.kind) {
    case 'type-missing':
      return 'project.type is missing: every slot is required until it names an app-type (faf auto detects one)';
    case 'type-unknown':
      return `project.type ${issue.value} is not a FAF app-type yet: every slot is required`;
    case 'type-spelling':
      return `project.type ${issue.value} reads as ${issue.type} (faf auto writes ${issue.type})`;
    case 'slotignored-required':
      return issue.type === null
        ? `${issue.slot}: slotignored, but without an app-type every slot is required: empty until populated`
        : `${issue.slot}: slotignored, but ${issue.type} requires it: empty until populated`;
    case 'not-required':
      return `${issue.slot}: not required for ${issue.type}, so it is slotignored and not scored`;
    case 'not-a-value':
      return `${issue.slot}: ${issue.found} is not a value: empty until populated`;
  }
}

/** The issues as lines: one per issue, except that slots sharing an issue
 *  share a line (three named, then "+N more"). */
export function describeIssues(issues: SlotIssue[]): string[] {
  const lines: string[] = [];
  const groups = new Map<string, string[]>();
  for (const i of issues) {
    if (i.kind === 'slotignored-required' || i.kind === 'not-required' || i.kind === 'not-a-value') {
      const head = i.kind === 'slotignored-required'
        ? (i.type === null ? 'slotignored, but without an app-type every slot is required: empty until populated' : `slotignored, but ${i.type} requires it: empty until populated`)
        : i.kind === 'not-required' ? `not required for ${i.type}, so slotignored and not scored` : `${i.found} is not a value: empty until populated`;
      groups.set(head, [...(groups.get(head) ?? []), i.slot]);
    } else {
      lines.push(describeIssue(i));
    }
  }
  for (const [head, slots] of groups) {
    const named = slots.slice(0, 3).join(', ') + (slots.length > 3 ? `, +${slots.length - 3} more` : '');
    lines.push(`${named}: ${head}`);
  }
  return lines;
}
