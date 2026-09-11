/**
 * Shape guards — never spread a scalar.
 *
 * `{ ...'old-init' }` is `{ 0: 'o', 1: 'l', … }` and `{ ...[a, b] }` is
 * `{ 0: a, 1: b }`: spreading a value that is not a mapping silently turns the
 * user's text into index keys, and the next write saves them. Every place that
 * spreads or descends into a parsed .faf / .fafm value checks its shape first
 * and refuses with an Error that names what it found.
 */

/** True for a YAML mapping: a plain object, not a list. */
export function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Plain words for a value's YAML shape, for error messages: `a string ("old-init")`, `a list (2 items)`. */
export function describeShape(value: unknown): string {
  if (Array.isArray(value)) {return `a list (${value.length} item${value.length === 1 ? '' : 's'})`;}
  if (value === null || value === undefined) {return 'empty';}
  if (typeof value === 'string') {
    const shown = value.length > 40 ? `${value.slice(0, 40)}…` : value;
    return `a string (${JSON.stringify(shown)})`;
  }
  if (typeof value === 'object') {return 'a mapping';}
  return `a ${typeof value} (${String(value)})`;
}

/**
 * A parsed .faf document as a mapping. An empty document reads as `{}`; a
 * scalar or a list throws — faf never rewrites a file whose shape it does not
 * understand. `source` names the file (or caller) in the error.
 */
export function asFafMapping(value: unknown, source: string): Record<string, unknown> {
  if (value === null || value === undefined) {return {};}
  if (!isMapping(value)) {
    throw new Error(
      `${source}: a .faf must be a YAML mapping (key: value pairs), but this one is ${describeShape(value)}. ` +
        'faf left it unchanged — fix it by hand.',
    );
  }
  return value;
}
