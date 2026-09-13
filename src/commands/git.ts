import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { execFileSync } from 'child_process';
import { makeTempDir, readBytesIfPresent, removeTempDir, safeUnlink } from '../core/safe-write.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { authorFafFromRepo, normalizeGitUrl, repoNameFromUrl } from '../detect/git-repo.js';
import { writeFaf, readFafRaw, serializeFaf, withKernel } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';

// The pure helpers (URL gate, repo name, authoring from a fetched folder) live
// in detect/git-repo.ts, which runs no git; they are re-exported here for the
// command's existing importers. Only the clone below runs git.
export { normalizeGitUrl, repoNameFromUrl };

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
 * With core.symlinks=false, every path git records as a link (mode 120000)
 * arrives in the clone as a plain file holding the link's target text. That
 * text is not the file: detection would read `docs/README.md` as the README
 * and write it into project.goal. The placeholders are taken out of faf's own
 * throwaway clone, so detection sees them as absent, as it sees any link.
 * Returns how many were taken out.
 */
export function dropLinkPlaceholders(cloneDir: string): number {
  let listing: string;
  try {
    listing = execFileSync('git', ['-C', cloneDir, 'ls-files', '-s', '-z'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch {
    return 0;
  }
  let dropped = 0;
  for (const rec of listing.split('\0')) {
    if (!rec.startsWith('120000 ')) {continue;}
    const tab = rec.indexOf('\t');
    if (tab < 0) {continue;}
    const full = join(cloneDir, rec.slice(tab + 1));
    const bytes = readBytesIfPresent(full);
    if (bytes === null) {continue;}
    try {
      if (safeUnlink(full, { root: cloneDir, expect: bytes })) {dropped++;}
    } catch {
      // Not a plain placeholder (a folder or something unexpected): leave it.
    }
  }
  return dropped;
}

/** The `git clone` argv — split out so the --ref plumbing is testable without a network. */
export function cloneArgs(repoUrl: string, tmpDir: string, ref?: string): string[] {
  // core.symlinks=false: a link in the repo arrives as a plain file holding the
  // link's text, so a README.md that links to ~/.aws/credentials is never
  // followed. --depth 1 keeps it instant; --branch pins a branch or tag for
  // versioned context. `--` stops the URL ever being read as a flag.
  return ['clone', '-c', 'core.symlinks=false', '--depth', '1', ...(ref ? ['--branch', ref] : []), '--', repoUrl, tmpDir];
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

export function gitCommand(
  url: string,
  options: GitCommandOptions = {},
  cwd: string = process.cwd(),
): void {
  let repoUrl: string;
  try {
    repoUrl = normalizeGitUrl(url);
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

  // A fresh temp folder of faf's own (mkdtemp, with faf's marker file in it),
  // removed when the command ends. The clone goes in a subfolder beside the
  // marker (git clones only into an empty folder).
  const tmpDir = makeTempDir('faf-git-');
  const cloneDir = join(tmpDir, 'repo');

  try {
    // Progress → stderr, so `--stdout` (piped .faf) never gets an ANSI-contaminated first line.
    console.error(dim(`cloning ${url}${options.ref ? ` @ ${options.ref}` : ''}...`));
    try {
      // execFileSync runs git directly — NO shell — so the URL can never be
      // interpreted as a command.
      execFileSync('git', cloneArgs(repoUrl, cloneDir, options.ref), { stdio: 'pipe' });
    } catch (err) {
      const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? '';
      const reason = stderr.trim().split('\n').slice(-2).join(' ').trim() || 'git clone failed';
      const hint = options.ref ? `\n\n  (does the branch/tag '${options.ref}' exist?)` : '';
      console.error(`Error: could not clone ${url}\n\n  ${reason}${hint}`);
      process.exit(1);
    }

    // Full slot-filling pipeline (shared with `faf auto`) — not detectStack alone —
    // named after the REPO, not the throwaway clone dir (a real package.json name
    // is kept). The same function consumers call on a repo they fetched.
    dropLinkPlaceholders(cloneDir);
    const data = authorFafFromRepo(cloneDir, { repoUrl });

    if (target.outputPath === null) {
      // --stdout: emit the .faf for piping/inspection, never touching the user's dir.
      process.stdout.write(serializeFaf(data));
      return;
    }

    writeFaf(target.outputPath, data, { replace: options.force === true }); // --force: a fresh file
    console.log(`${fafCyan('created')} ${target.outputPath}`);

    const yaml = readFafRaw(target.outputPath);
    const result = withKernel(target.outputPath, () => enrichScore(kernel.score(yaml)));
    displayScore(result, target.outputPath);
  } finally {
    removeTempDir(tmpDir);
  }
}
