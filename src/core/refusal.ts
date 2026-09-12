/**
 * The one line the CLI prints when faf refuses to touch a file, or a write
 * fails with the file left as it was. A refusal is an answer, not a crash: one
 * line, no stack trace. Shared by the top-level handler (cli.ts) and the
 * multi-target commands (`faf export`, `faf cards`), which print the line for
 * one target and carry on with the others.
 */
import { statSync } from 'fs';
import { dirname, resolve } from 'path';
import { NotWrittenError, SafePathError } from './safe-write.js';

/** What the line adds after the reason: nothing when the reason already says
 *  the file was left as it is (not UTF-8, changed on disk, not valid YAML,
 *  a block faf could not place), or already says how to replace it; the --force
 *  hint for a file faf did not write, when the command has --force; otherwise
 *  what faf did not do — "Nothing was written to it." when the refusal came at
 *  the write (faf may have read the file first), "Nothing was read from or
 *  written to it." when it came before either. */
export function refusalTail(e: SafePathError, hasForce: boolean): string {
  if (e.reason === 'not-utf8' || e.reason === 'changed' || e.reason === 'not-yaml' || e.reason === 'unplaceable') {return '';}
  if (e.reason === 'not-owned') {return hasForce && !e.message.includes('--force') ? ' Use --force to replace it.' : '';}
  return e.onWrite ? ' Nothing was written to it.' : ' Nothing was read from or written to it.';
}

/** True for an error the CLI prints as one line: a refusal (SafePathError) or
 *  a write that failed with the original kept (NotWrittenError). */
export function isOneLineError(e: unknown): e is SafePathError | NotWrittenError {
  return e instanceof SafePathError || e instanceof NotWrittenError;
}

/** The one line for `e`: `faf: <reason>` plus {@link refusalTail} for a refusal. */
export function oneLine(e: SafePathError | NotWrittenError, hasForce: boolean): string {
  return e instanceof SafePathError ? `faf: ${e.message}${refusalTail(e, hasForce)}` : `faf: ${e.message}`;
}

/** Refuse an --output (or --out) path whose folder is not there, before
 *  anything is written: a NotWrittenError the CLI prints as one line, exit 1
 *  — "<folder> does not exist — nothing written", or "<folder> is not a
 *  folder — nothing written" when a file has that name. Nothing happens when
 *  `output` is undefined (no --output given) or its folder is there.
 *  `faf compile`, `faf decompile`, `faf taf`, `faf init`, `faf server-card`
 *  and `faf git` write into a folder that exists and never create one
 *  (`faf export --output` does: that folder is the export's own). */
export function refuseMissingOutputFolder(output: string | undefined): void {
  if (output === undefined) {return;}
  const folder = dirname(resolve(output));
  let why: string | null;
  try {
    why = statSync(folder).isDirectory() ? null : 'is not a folder';
  } catch (e) {
    const code = (e as NodeJS.ErrnoException | null)?.code;
    if (code !== 'ENOENT' && code !== 'ENOTDIR') {throw e;}
    why = 'does not exist';
  }
  if (why !== null) {throw new NotWrittenError(resolve(output), `${folder} ${why} — nothing written`);}
}
