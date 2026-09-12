/**
 * Words typed into a slot — a typed None / N/A / not applicable, or any other
 * placeholder word (`unknown`, `"null"`) — are an empty slot: they score 0
 * until filled. The app-type alone decides which slots count, and
 * `slotignored` comes only from the app-type — typed words never take a slot
 * out. So `faf score` and `faf auto` say, one line per slot, where typed
 * words still sit, and never show a slot the app-type needs as N/A or ignored.
 */
import { isScalar, parseDocument } from 'yaml';
import { APP_TYPE_CATEGORIES, NO_CLASSIFYING_SIGNALS, SLOTS, appTypeUsesSlot, isTypedWords } from './slots.js';
import { isMapping } from './shape.js';
import type { ScoreResult } from './types.js';

/** `section.field` of a parsed .faf (every slot path has two parts). */
function valueAt(data: Record<string, unknown>, path: string): unknown {
  const [section, field] = path.split('.');
  const s = data[section];
  return isMapping(s) ? s[field] : undefined;
}

/** True when the .faf text's `project.type` line carries faf's
 *  `# found: no classifying signals — fallback` note: the type is the
 *  `library` detection fell back to, not a fact, and decides no slot. */
export function typeIsFallback(text: string): boolean {
  try {
    const node = parseDocument(text, { logLevel: 'error' }).getIn(['project', 'type'], true);
    return isScalar(node) && typeof node.comment === 'string' && node.comment.includes(NO_CLASSIFYING_SIGNALS);
  } catch {
    return false;
  }
}

/** The line for one slot that holds typed words, by whether the app-type
 *  uses it (null: the type decides nothing — read as a library, the second
 *  kind of line never given), or null for no line. */
function hintFor(path: string, words: string, uses: boolean | null, inLibrary: boolean, outOfType: boolean): string | null {
  if (uses === true || (uses === null && inLibrary)) {
    return `${path} says '${words}' — this app-type needs it, so it counts as empty until filled.`;
  }
  if (uses === false && outOfType) {
    return `${path} says '${words}' — this app-type doesn't use it; faf auto marks it slotignored (N/A).`;
  }
  return null;
}

/** The .faf text as a mapping, or null when it does not parse to one (no
 *  warnings printed). */
function mappingOf(yaml: string): Record<string, unknown> | null {
  try {
    const doc = parseDocument(yaml, { logLevel: 'error' });
    if (doc.errors.length > 0) {return null;}
    const data: unknown = doc.toJS();
    return isMapping(data) ? data : null;
  } catch {
    return null;
  }
}

/** Which hint lines {@link typedNoneHints} gives. */
export interface TypedNoneHintOptions {
  /** Also give the line for a slot the app-type leaves out (default true).
   *  `faf auto` passes false: by then it has marked those slots. */
  outOfType?: boolean;
}

/**
 * One line for each slot that `result` scores as empty and that holds typed
 * words, by the file's app-type (`project.type`):
 *   - a slot the app-type needs:
 *     `<slot> says '<words>' — this app-type needs it, so it counts as empty until filled.`
 *   - a slot the app-type leaves out (before `faf auto` has run):
 *     `<slot> says '<words>' — this app-type doesn't use it; faf auto marks it slotignored (N/A).`
 * A file whose type faf does not know, or whose type is the `library`
 * detection fell back to (see {@link typeIsFallback}), gives the first line
 * for the slots a library needs (as faf's detection reads such a file) and no
 * second line. Reads `yaml` only; nothing is written. YAML that does not parse
 * to a mapping gives no lines.
 */
export function typedNoneHints(yaml: string, result: Pick<ScoreResult, 'slots'>, opts: TypedNoneHintOptions = {}): string[] {
  const data = mappingOf(yaml);
  if (data === null) {return [];}
  const type = isMapping(data.project) && !typeIsFallback(yaml) ? data.project.type : undefined;
  const lines: string[] = [];
  for (const slot of SLOTS) {
    const value = valueAt(data, slot.path);
    if (result.slots[slot.path] !== 'empty' || !isTypedWords(value)) {continue;}
    const inLibrary = APP_TYPE_CATEGORIES.library.includes(slot.category);
    const line = hintFor(slot.path, String(value).trim(), appTypeUsesSlot(type, slot), inLibrary, opts.outOfType !== false);
    if (line !== null) {lines.push(line);}
  }
  return lines;
}
