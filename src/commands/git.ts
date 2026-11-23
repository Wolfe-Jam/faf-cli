import { existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import { FetchRepoError, cloneArgs, dropLinkPlaceholders, fetchRepo, type FetchedRepo } from '../interop/fetch-repo.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { authorFafFromRepo, normalizeGitUrl, repoNameFromUrl } from '../detect/git-repo.js';
import { writeFaf, readFafRaw, serializeFaf, withKernel } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';
import { suggestIntent } from '../core/suggest.js';

// The pure helpers (URL gate, repo name, authoring from a fetched folder) live
// in detect/git-repo.ts, which runs no git; the fetch (clone + link
// placeholders) lives in interop/fetch-repo.ts, public as `faf-cli/fetch`.
// Both are re-exported here for the command's existing importers.
export { normalizeGitUrl, repoNameFromUrl, cloneArgs, dropLinkPlaceholders };

export interface GitCommandOptions {
  /** Clone at a specific branch or tag (versioned context). */
  ref?: string;
  /** Write to a custom path (default ./project.faf). */
  output?: string;
  /** Overwrite an existing project.faf. */
  force?: boolean;
  /** Print the .faf to stdout instead of writing a file. */
  stdout?: boolean;
}

/**
 * Resolve where the pulled .faf should go, refusing to clobber an existing one.
 * Throws (the caller maps it to exit 1) so it's unit-testable without a network.
 * `--stdout` returns a null path (print, don't write).
 */
export function resolveGitTarget(
  options: GitCommandOptions,
  cwd: string = process.cwd(),
): { outputPath: string | null } {
  if (options.stdout) {return { outputPath: null };}
  const outputPath = options.output ? resolve(cwd, options.output) : join(cwd, 'project.faf');
  if (existsSync(outputPath) && !options.force) {
    throw new Error(
      `${outputPath} already exists — refusing to overwrite your context.\n` +
        '  Use --force to replace it, --output <path> to write elsewhere, or --stdout to just view it.',
    );
  }
  return { outputPath };
}

export async function gitCommand(
  url: string,
  options: GitCommandOptions = {},
  cwd: string = process.cwd(),
): Promise<void> {
  try {
    normalizeGitUrl(url);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}\n\n  Usage: faf git <url> [--ref <branch|tag>] [--output <path>] [--force] [--stdout]`);
    process.exit(1);
  }

  // Refuse to clobber BEFORE the (slow) clone — don't make the user wait to be told no.
  let target: { outputPath: string | null };
  try {
    target = resolveGitTarget(options, cwd);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
    return;
  }
  // An --output folder that is not there is one line, before the clone: faf
  // does not create it (--stdout writes no file).
  refuseMissingOutputFolder(target.outputPath === null ? undefined : options.output);

  // Progress → stderr, so `--stdout` (piped .faf) never gets an ANSI-contaminated first line.
  console.error(dim(`cloning ${url}${options.ref ? ` @ ${options.ref}` : ''}...`));
  let repo: FetchedRepo;
  try {
    // The same fetch the MCP servers use (faf-cli/fetch): a temp folder of
    // faf's own, removed when the command ends.
    repo = await fetchRepo(url, { ref: options.ref });
  } catch (err) {
    const reason = err instanceof FetchRepoError ? (err.reason ?? err.message) : (err as Error).message;
    const hint = options.ref ? `\n\n  (does the branch/tag '${options.ref}' exist?)` : '';
    console.error(`Error: could not clone ${url}\n\n  ${reason}${hint}`);
    process.exit(1);
    return;
  }

  try {
    // Full slot-filling pipeline (shared with `faf auto`) — not detectStack alone —
    // named after the REPO, not the throwaway clone dir (a real package.json name
    // is kept). The same function consumers call on a repo they fetched.
    const data = authorFafFromRepo(repo.dir, { repoUrl: repo.repoUrl });

    if (target.outputPath === null) {
      // --stdout: emit the .faf for piping/inspection, never touching the user's dir.
      process.stdout.write(serializeFaf(data));
      return;
    }

    let backupPath: string | undefined;
    writeFaf(target.outputPath, data, {
      replace: options.force === true,
      onReplacedBackup: (p) => { backupPath = p; },
    });
    console.log(`${fafCyan('created')} ${target.outputPath}`);
    if (backupPath) {
      const shown = relative(cwd, backupPath) || backupPath;
      console.log(dim(`  kept the previous file at ${shown}`));
    }

    const yaml = readFafRaw(target.outputPath);
    const result = withKernel(target.outputPath, () => enrichScore(kernel.score(yaml)));
    displayScore(result, target.outputPath);
    // The clone is deleted next, so 'faf go' here has nothing to suggest from.
    console.log(dim(gitIntentNote(Object.keys(suggestIntent(repo.dir)).length)));
  } finally {
    repo.cleanup();
  }
}

/** What `faf git` says about the goal and six W's: they're empty, and the
 *  repo's suggestions are confirmed with `faf go` in a clone (the temporary
 *  clone is gone once `faf git` ends). */
export function gitIntentNote(suggestions: number): string {
  if (suggestions === 0) {return "The goal and six W's are empty: fill them with 'faf go' in a clone.";}
  const [noun, verb, them] = suggestions === 1 ? ['suggestion', 'waits', 'it'] : ['suggestions', 'wait', 'them'];
  return `The goal and six W's are empty: ${suggestions} ${noun} ${verb} in the repo. Run 'faf go' in a clone to confirm ${them}.`;
}
