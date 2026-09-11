/**
 * The one line the CLI prints when faf refuses to touch a file, or a write
 * fails with the file left as it was. A refusal is an answer, not a crash: one
 * line, no stack trace. Shared by the top-level handler (cli.ts) and the
 * multi-target commands (`faf export`, `faf cards`), which print the line for
 * one target and carry on with the others.
 */
import { NotWrittenError, SafePathError } from './safe-write.js';

/** What the line adds after the reason: nothing when the reason already says
 *  the file was left as it is, or already says how to replace it; the --force
 *  hint for a file faf did not write, when the command has --force; otherwise
 *  what faf did not do — "Nothing was written to it." when the refusal came at
 *  the write (faf may have read the file first), "Nothing was read from or
 *  written to it." when it came before either. */
export function refusalTail(e: SafePathError, hasForce: boolean): string {
  if (e.reason === 'not-utf8' || e.reason === 'changed') {return '';}
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
