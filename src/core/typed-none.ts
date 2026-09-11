/**
 * A typed None / N/A / not applicable is an empty slot: it scores 0 until
 * filled. The app-type alone decides which slots count, and `slotignored`
 * comes only from the app-type — a typed word never takes a slot out. So when
 * a slot the app-type needs still holds a typed none, `faf score` and
 * `faf auto` say so in one line, and never show that slot as N/A or ignored.
 */
import { parse } from 'yaml';
import { APP_TYPE_CATEGORIES, SLOTS, isExplicitNone } from './slots.js';
import { isMapping } from './shape.js';
import type { ScoreResult } from './types.js';

/** `section.field` of a parsed .faf (every slot path has two parts). */
function valueAt(data: Record<string, unknown>, path: string): unknown {
  const [section, field] = path.split('.');
  const s = data[section];
  return isMapping(s) ? s[field] : undefined;
}

/**
 * One line for each slot that the file's app-type needs (`project.type`;
 * a file with no known type reads as `library`, as faf's detection does), that
 * `result` scores as empty, and that holds a typed none:
 * `<slot> says '<words>' — this app-type needs it, so it counts as empty until filled.`
 * Reads `yaml` only; nothing is written. YAML that does not parse to a mapping
 * gives no lines.
 */
export function typedNoneHints(yaml: string, result: Pick<ScoreResult, 'slots'>): string[] {
  let data: unknown;
  try {
    data = parse(yaml, { logLevel: 'error' }); // no warnings printed; an error gives no lines
  } catch {
    return [];
  }
  if (!isMapping(data)) {return [];}
  const type = isMapping(data.project) ? data.project.type : undefined;
  const known = typeof type === 'string' && Object.prototype.hasOwnProperty.call(APP_TYPE_CATEGORIES, type);
  const needed = known ? APP_TYPE_CATEGORIES[type as string] : APP_TYPE_CATEGORIES.library;
  const lines: string[] = [];
  for (const slot of SLOTS) {
    if (result.slots[slot.path] !== 'empty' || !needed.includes(slot.category)) {continue;}
    const value = valueAt(data, slot.path);
    if (isExplicitNone(value)) {
      lines.push(`${slot.path} says '${String(value).trim()}' — this app-type needs it, so it counts as empty until filled.`);
    }
  }
  return lines;
}
