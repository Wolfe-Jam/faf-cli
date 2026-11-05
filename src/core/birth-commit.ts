/**
 * The birth certificate's permanent record is the commit that first added
 * `.faf-dna`. A commit is named by the hash of its content, so that first
 * version cannot be changed without rewriting history, which every clone
 * shows. faf never commits for you: it says when the certificate is not
 * committed yet, and `faf dna --verify` checks the file against that commit.
 *
 * A shallow clone cannot be checked: its oldest commit shows every file as
 * added, so the true first commit may be missing. faf says so rather than
 * report a match it did not see.
 */
import { spawnSync } from 'child_process';
import { birthCertificateOf, type BirthCertificate } from './faf-dna.js';

/** The fields that make a birth certificate. Any change to one is a reissue. */
const FIELDS = ['certificate', 'born', 'birthDNA', 'projectDNA'] as const;

export type BirthCheck =
  | { state: 'same'; commit: string; date: string }
  | { state: 'changed'; commit: string; date: string; fields: string[] }
  | { state: 'cannot'; why: string };

function git(dir: string, args: string[]): { ok: boolean; out: string } {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf-8' });
  return { ok: r.status === 0 && typeof r.stdout === 'string', out: typeof r.stdout === 'string' ? r.stdout : '' };
}

function inRepo(dir: string): boolean {
  const r = git(dir, ['rev-parse', '--is-inside-work-tree']);
  return r.ok && r.out.trim() === 'true';
}

/** The commit that first added `.faf-dna` here (short hash, date), or null. */
function firstCommit(dir: string): { commit: string; date: string } | null {
  const r = git(dir, ['log', '--diff-filter=A', '--reverse', '--format=%h%x09%cs', '--', '.faf-dna']);
  const first = r.ok ? r.out.split('\n')[0] : '';
  if (!first) {return null;}
  const [commit, date] = first.split('\t');
  return { commit, date: date ?? '' };
}

/**
 * The line to print after a birth, or on `faf dna`, when the certificate is
 * not committed yet: the exact command, for the user to run when ready. Null
 * when it is committed, when `.faf-dna` is gitignored (faf-cli warns about
 * that separately), or when this is not a git repo.
 */
export function commitHint(dir: string): string | null {
  if (!inRepo(dir)) {return null;}
  if (git(dir, ['check-ignore', '-q', '--', '.faf-dna']).ok) {return null;}
  if (firstCommit(dir)) {return null;}
  return 'The birth certificate is not committed yet. Commit it to make it permanent: git add .faf-dna && git commit -m "faf: birth certificate"';
}

/**
 * Compare `current` (the certificate in `.faf-dna` now, or null when there is
 * none) with the one in the commit that first added `.faf-dna`.
 */
export function verifyBirth(dir: string, current: BirthCertificate | null): BirthCheck {
  if (!inRepo(dir)) {return { state: 'cannot', why: 'this is not a git repository, so there is no birth commit to check against.' };}
  if (git(dir, ['rev-parse', '--is-shallow-repository']).out.trim() === 'true') {
    return { state: 'cannot', why: 'this is a shallow clone, so the commit that first added .faf-dna may be missing. Fetch the full history (git fetch --unshallow) and run it again.' };
  }
  const first = firstCommit(dir);
  if (!first) {
    return { state: 'cannot', why: current
      ? '.faf-dna is not committed yet. Commit it to make it permanent: git add .faf-dna && git commit -m "faf: birth certificate"'
      : 'there is no .faf-dna, and no commit ever added one.' };
  }
  const shown = git(dir, ['show', `${first.commit}:./.faf-dna`]);
  const original = shown.ok ? birthCertificateOf(shown.out) : null;
  if (!original) {return { state: 'cannot', why: `the .faf-dna in ${first.commit} has no birth certificate faf can read.` };}
  if (!current) {return { state: 'changed', ...first, fields: ['.faf-dna is missing'] };}
  const fields = FIELDS.filter((f) => original[f] !== current[f]);
  return fields.length === 0 ? { state: 'same', ...first } : { state: 'changed', ...first, fields: [...fields] };
}
