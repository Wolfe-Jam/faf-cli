import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { parse, stringify } from 'yaml';
import type { FafData } from '../core/types.js';

/** Read and parse a .faf file */
export function readFaf(path: string): FafData {
  const text = readFileSync(path, 'utf-8');
  return parse(text) as FafData;
}

/** Write a .faf file from data.
 *
 *  If `data._meta.found` is present, it's stripped before serialization and
 *  rendered as a `# found: <list>` YAML comment next to the `type:` field —
 *  Glass Hood doctrine: the user sees WHY the cli classified the project as
 *  it did. `_meta` is a runtime hint, never a serialized .faf field. */
/** Serialize .faf data to YAML text (the exact bytes writeFaf would write).
 *  Strips runtime `_meta` and renders its `found` rationale as a `# found:`
 *  comment by `type:`. Used by writeFaf and by `faf git --stdout`. */
export function serializeFaf(data: FafData): string {
  const meta = (data as FafData & { _meta?: { found?: string[] } })._meta;
  // Strip _meta before serialization — it's never part of the .faf schema.
  const cleanData: FafData = { ...data };
  delete (cleanData as Record<string, unknown>)._meta;

  let text = stringify(cleanData, { lineWidth: 0 });

  // Inject `# found: ...` next to `type:` if rationale was provided.
  if (meta?.found && meta.found.length > 0) {
    const comment = meta.found.join(' + ');
    // Match `  type: <value>` — only inject if there isn't already a comment.
    text = text.replace(
      /^(\s+type:\s+\S+)(\s*)$/m,
      (match, prefix: string, trailing: string) => {
        if (trailing.includes('#')) {return match;}
        return `${prefix}  # found: ${comment}`;
      },
    );
  }

  return text;
}

export function writeFaf(path: string, data: FafData): void {
  writeFileSync(path, serializeFaf(data), 'utf-8');
}

/** Read raw YAML text from a .faf file */
export function readFafRaw(path: string): string {
  return readFileSync(path, 'utf-8');
}

/** Parse .faf data from a YAML string — e.g. the output of `git show <ref>:project.faf`.
 *  The readers above are path-only; `faf diff` needs to parse a version that
 *  lives in git history, never on disk. */
export function readFafFromString(text: string): FafData {
  return parse(text) as FafData;
}

/** Find the .faf file in a directory (walks up) */
export function findFafFile(dir: string = process.cwd()): string | null {
  const candidates = ['project.faf', '.faf'];
  // Use path.join for cross-platform separator handling — earlier
  // template-literal `${dir}/${name}` produced forward-slash paths
  // even on Windows, breaking strict path equality and any consumer
  // that path-compared the result.
  for (const name of candidates) {
    const full = join(dir, name);
    if (existsSync(full)) {return full;}
  }
  // Walk up one level — use path.dirname for cross-platform parent
  // resolution. The earlier regex `dir.replace(/\/[^/]+$/, '')`
  // only matched POSIX separators and silently no-op'd on Windows.
  const parent = dirname(dir);
  if (parent !== dir) {
    for (const name of candidates) {
      const full = join(parent, name);
      if (existsSync(full)) {return full;}
    }
  }
  return null;
}
