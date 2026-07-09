import { mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { assembleFreshFaf } from '../detect/assemble.js';
import { writeFaf, readFafRaw, serializeFaf } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { dim, fafCyan } from '../ui/colors.js';

/**
 * Validate + normalize a GitHub repo reference into a safe clone URL.
 *
 * A `faf git` URL is an untrusted CLI/MCP argument. This gate rejects any
 * shell metacharacter or whitespace, and only ever returns a URL built from a
 * strict allowlist pattern — defense in depth alongside the no-shell
 * `execFileSync` clone (which already makes argument injection structurally
 * impossible). Nothing carrying a metacharacter or control char ever reaches
 * `git`: metachars are caught here; anything else fails the allowlist below.
 *
 * Accepts:
 *   owner/repo · github.com/owner/repo · https://github.com/owner/repo
 *   (optional `.git` suffix, optional trailing slash; full http(s) URLs to
 *    any host pass through with a single `.git` suffix)
 *
 * Throws on empty / malformed / unsafe input.
 */
export function normalizeGitUrl(input: string): string {
  const url = (input ?? '').trim();
  if (!url) {
    throw new Error('Please provide a GitHub URL.');
  }
  // Reject shell metacharacters and whitespace up front for a clear error.
  if (/[\s;&|`$(){}<>\\^'"!*?[\]]/.test(url)) {
    throw new Error(`Refusing unsafe URL: ${JSON.stringify(input)}`);
  }

  const bare = url.replace(/\/+$/, '').replace(/\.git$/i, '');

  // owner/repo shorthand (optionally github.com-prefixed, no scheme) → canonical https
  const short = bare.match(
    /^(?:github\.com\/)?([A-Za-z0-9][A-Za-z0-9._-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/,
  );
  if (short) {
    return `https://github.com/${short[1]}/${short[2]}.git`;
  }

  // full http(s) URL → ensure exactly one `.git` suffix (strict allowlist chars)
  if (/^https?:\/\/[A-Za-z0-9._\-/:@~%]+$/.test(bare)) {
    return `${bare}.git`;
  }

  throw new Error(`Not a recognized GitHub repo URL: ${JSON.stringify(input)}`);
}

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

/** The repo name from a normalized clone URL: .../owner/repo.git → repo. */
export function repoNameFromUrl(repoUrl: string): string {
  return repoUrl.replace(/\.git$/i, '').replace(/\/+$/, '').split('/').pop() || 'project';
}

/** The `git clone` argv — split out so the --ref plumbing is testable without a network. */
export function cloneArgs(repoUrl: string, tmpDir: string, ref?: string): string[] {
  // --depth 1 keeps it instant; --branch pins a branch or tag for versioned context.
  // `--` stops the URL ever being read as a flag.
  return ['clone', '--depth', '1', ...(ref ? ['--branch', ref] : []), '--', repoUrl, tmpDir];
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

  const tmpDir = join(tmpdir(), `faf-git-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // Progress → stderr, so `--stdout` (piped .faf) never gets an ANSI-contaminated first line.
    console.error(dim(`cloning ${url}${options.ref ? ` @ ${options.ref}` : ''}...`));
    try {
      // execFileSync runs git directly — NO shell — so the URL can never be
      // interpreted as a command.
      execFileSync('git', cloneArgs(repoUrl, tmpDir, options.ref), { stdio: 'pipe' });
    } catch (err) {
      const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? '';
      const reason = stderr.trim().split('\n').slice(-2).join(' ').trim() || 'git clone failed';
      const hint = options.ref ? `\n\n  (does the branch/tag '${options.ref}' exist?)` : '';
      console.error(`Error: could not clone ${url}\n\n  ${reason}${hint}`);
      process.exit(1);
    }

    // Full slot-filling pipeline (shared with `faf auto`) — not detectStack alone.
    const data = assembleFreshFaf(tmpDir);

    // Name the project after the REPO, not the throwaway clone dir. Only override
    // the temp-dir fallback — keep a real name assembleFreshFaf found (package.json).
    if (data.project && /^faf-git-\d+$/.test(String(data.project.name ?? ''))) {
      data.project.name = repoNameFromUrl(repoUrl);
    }

    if (target.outputPath === null) {
      // --stdout: emit the .faf for piping/inspection, never touching the user's dir.
      process.stdout.write(serializeFaf(data));
      return;
    }

    writeFaf(target.outputPath, data);
    console.log(`${fafCyan('created')} ${target.outputPath}`);

    const yaml = readFafRaw(target.outputPath);
    const result = enrichScore(kernel.score(yaml));
    displayScore(result, target.outputPath);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
