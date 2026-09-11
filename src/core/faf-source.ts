/**
 * Where .faf data came from: the file readFaf read it from (its real path) and
 * the text it read. writeFaf checks a write of that data against it — when the
 * file changed on disk after the read, the write is refused instead of being
 * made over the newer edit. Kept apart from interop/faf.ts so the pure parts
 * of detection (updateExistingFaf) can carry it without importing a module
 * that runs git.
 */

/** The file a data object was read from, and the text read. */
export interface FafSource {
  real: string;
  text: string;
}

const sources = new WeakMap<object, FafSource>();

/** The source recorded for `data`, if any. */
export function fafSourceOf(data: unknown): FafSource | undefined {
  return typeof data === 'object' && data !== null ? sources.get(data) : undefined;
}

/** Record that `data` holds what `source.text` (read from `source.real`) says. */
export function setFafSource(data: object, source: FafSource): void {
  sources.set(data, source);
}

/** Let `to` — data made from `from` (a copy with empty slots filled, say) —
 *  carry the file `from` was read from. Returns `to`. */
export function carryFafSource<T extends object>(from: unknown, to: T): T {
  const source = fafSourceOf(from);
  if (source) {sources.set(to, source);}
  return to;
}
