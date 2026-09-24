/**
 * A command value may carry its own note: `cmd — note`.
 *
 * `key_files` already works this way (`path — role`), and the authors turn
 * that into a `| Path | Role |` table. Commands get the same convention, so a
 * `.faf` can say what a script actually does:
 *
 * ```yaml
 * commands:
 *   build: bun run build — clean, bundle cli+index, then tsc
 * ```
 *
 * authors as:
 *
 * ```bash
 * bun run build    # clean, bundle cli+index, then tsc
 * ```
 *
 * Without a note the behaviour is unchanged — the key is the comment, exactly
 * as before. The separator is the em dash with spaces around it, matching
 * `key_files`; a bare hyphen is left alone, because shell commands are full of
 * them (`--force`, `-rf`).
 *
 * Every consumer of `data.commands` must split before it renders, or the note
 * leaks into the command itself — an authored `bun run build — clean…` that a
 * reader would try to run.
 */

/** The separator a command value uses to carry its note. */
export const NOTE_SEPARATOR = ' — ';

export interface CommandAndNote {
  /** The command to run, with any note removed. */
  cmd: string;
  /** The note the value carried, or null when it carried none. */
  note: string | null;
}

/**
 * Split a command value into the command and its note.
 *
 * @param value  a `commands` value, e.g. `bun run build` or `bun run build — clean, then tsc`
 */
export function splitCommandNote(value: unknown): CommandAndNote {
  const s = String(value ?? '').trim();
  const at = s.indexOf(NOTE_SEPARATOR);
  if (at <= 0) {return { cmd: s, note: null };}

  const cmd = s.slice(0, at).trim();
  const note = s.slice(at + NOTE_SEPARATOR.length).trim();
  // A separator with nothing useful on one side is not a note.
  if (!cmd || !note) {return { cmd: s, note: null };}
  return { cmd, note };
}

/** The command alone — for prose and for authors that show no comments. */
export function commandOnly(value: unknown): string {
  return splitCommandNote(value).cmd;
}
