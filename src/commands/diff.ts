/**
 * `faf diff [range]` — a SEMANTIC context diff between two `.faf` versions.
 *
 * `git diff` shows you line changes; `faf diff` shows you what the change DID to
 * your project's DNA — which slots were added / changed / removed, with their
 * registry labels, and the deterministic score delta it produced.
 *
 * Ref resolution (matches git conventions):
 *   faf diff                 HEAD's project.faf  →  working tree
 *   faf diff <ref>           <ref>               →  working tree
 *   faf diff <a>..<b>        <a>                 →  <b>
 *   faf diff <a>...<b>       merge-base(a,b)     →  <b>
 *
 * Engine reuses slots.ts (the 33-slot registry); scores come from the WASM
 * kernel (faf_score is NOT persisted in .faf — each side is scored fresh).
 */
import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import type { FafData } from '../core/types.js';
import { SLOTS, readSlotValue, isPlaceholder } from '../core/slots.js';
import { readFafFromString, readFafRaw, findFafFile, gitRepoRel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { NotWrittenError, SafePathError, readUtf8, resolveInside, safeWriteFile } from '../core/safe-write.js';
import { linesWithEnds, readIfPresent, stripEnd } from '../interop/inject.js';
import { getTier, tierBadge } from '../core/tiers.js';

export type SlotChangeKind = 'added' | 'removed' | 'changed';

export interface SlotChange {
  /** Dot-path of the slot, e.g. `stack.build`. */
  path: string;
  /** Registry display label, e.g. `Build`, `CI/CD`, `API`. */
  label: string;
  /** Slot category (for grouping the output). */
  category: string;
  kind: SlotChangeKind;
  /** Prior value — present for `changed` / `removed`. */
  from?: string;
  /** New value — present for `changed` / `added`. */
  to?: string;
}

export interface FafDiff {
  changes: SlotChange[];
  scoreBase: number;
  scoreTarget: number;
  scoreDelta: number;
  filledBase: number;
  filledTarget: number;
}

const val = (v: unknown): string => String(v).trim();

/** The deliberate "this slot is N/A" sentinel — kernel-recognised as *ignored*. */
const IGNORED = 'slotignored';

/**
 * Whether a slot holds no REAL context for diff purposes: a placeholder OR the
 * `slotignored` sentinel. Scoping a slot out (absent → slotignored) isn't a
 * context change worth showing; replacing real context WITH slotignored is a
 * removal. (We don't touch `isPlaceholder` — it's load-bearing elsewhere.)
 */
const emptyForDiff = (v: unknown): boolean =>
  isPlaceholder(v) || (typeof v === 'string' && v.trim().toLowerCase() === IGNORED);

/**
 * Pure slot-by-slot diff of two parsed `.faf` objects.
 * No git, no scoring — just the registry walk. This is the testable core.
 */
export function diffSlots(
  base: FafData,
  target: FafData,
): { changes: SlotChange[]; filledBase: number; filledTarget: number } {
  const changes: SlotChange[] = [];
  let filledBase = 0;
  let filledTarget = 0;

  for (const slot of SLOTS) {
    const b = readSlotValue(base as Record<string, unknown>, slot);
    const t = readSlotValue(target as Record<string, unknown>, slot);
    const bFilled = !emptyForDiff(b);
    const tFilled = !emptyForDiff(t);
    if (bFilled) {filledBase++;}
    if (tFilled) {filledTarget++;}

    const label = slot.label ?? slot.path.split('.').pop() ?? slot.path;
    const meta = { path: slot.path, label, category: String(slot.category) };

    if (!bFilled && tFilled) {
      changes.push({ ...meta, kind: 'added', to: val(t) });
    } else if (bFilled && !tFilled) {
      changes.push({ ...meta, kind: 'removed', from: val(b) });
    } else if (bFilled && tFilled && val(b) !== val(t)) {
      changes.push({ ...meta, kind: 'changed', from: val(b), to: val(t) });
    }
  }
  return { changes, filledBase, filledTarget };
}

/** Score a raw .faf YAML via the kernel. 0 for empty/unscorable — never throws. */
function safeScore(raw: string): number {
  if (!raw.trim()) {return 0;}
  try {
    return scoreFafYaml(raw).score ?? 0;
  } catch {
    return 0; // malformed at a ref — treat as unscorable, don't crash the diff
  }
}

/** Parse a raw .faf YAML, tolerating empty/malformed input (→ {}). */
function safeParse(raw: string): FafData {
  if (!raw.trim()) {return {} as FafData;}
  try {
    return readFafFromString(raw) ?? ({} as FafData);
  } catch {
    return {} as FafData;
  }
}

/**
 * Full diff: slot changes + kernel score delta. Takes the two raw YAMLs so it
 * can both parse (for slots) and score (for the delta) each side.
 */
export function computeFafDiff(baseRaw: string, targetRaw: string): FafDiff {
  const { changes, filledBase, filledTarget } = diffSlots(safeParse(baseRaw), safeParse(targetRaw));
  const scoreBase = safeScore(baseRaw);
  const scoreTarget = safeScore(targetRaw);
  return { changes, scoreBase, scoreTarget, scoreDelta: scoreTarget - scoreBase, filledBase, filledTarget };
}

const MARK: Record<SlotChangeKind, string> = { added: '+', removed: '-', changed: '~' };
const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);
/** Clip a value for the text view so a paragraph-length Goal/Why stays one line. */
const clip = (s: string, n = 64): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Render a FafDiff as a human-readable, category-grouped report. */
export function renderFafDiff(diff: FafDiff, baseRef: string, targetRef: string): string {
  const lines: string[] = [];
  const bBadge = tierBadge(getTier(diff.scoreBase));
  const tBadge = tierBadge(getTier(diff.scoreTarget));

  lines.push(`project.faf  ${baseRef} → ${targetRef}`);
  lines.push(`Score: ${diff.scoreBase}% ${bBadge} → ${diff.scoreTarget}% ${tBadge}  (${signed(diff.scoreDelta)})`);
  lines.push('');

  if (diff.changes.length === 0) {
    lines.push('  (no slot changes)');
  } else {
    let lastCat = '';
    for (const c of diff.changes) {
      if (c.category !== lastCat) {
        lines.push(`  ${c.category}`);
        lastCat = c.category;
      }
      const m = MARK[c.kind];
      const label = c.label.padEnd(16);
      if (c.kind === 'changed') {lines.push(`    ${m} ${label} ${clip(c.from!)} → ${clip(c.to!)}`);}
      else if (c.kind === 'added') {lines.push(`    ${m} ${label} ${clip(c.to!)}   (added)`);}
      else {lines.push(`    ${m} ${label} ${clip(c.from!)}   (removed)`);}
    }
  }

  lines.push('');
  lines.push(`Slots filled: ${diff.filledBase} → ${diff.filledTarget}  (${signed(diff.filledTarget - diff.filledBase)})`);
  return lines.join('\n');
}

/** Does this ref resolve to a commit? Distinguishes a typo'd ref from a ref where
 *  the .faf merely didn't exist yet (the latter is a legit "born here" diff). */
function refExists(ref: string, cwd: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/** Guard an EXPLICIT user-supplied ref — a typo should error, not render a
 *  misleading "everything added" diff. (The implicit default HEAD stays tolerant
 *  so `faf diff` works in a repo with no commits yet.) */
function assertRef(ref: string, cwd: string): void {
  if (!refExists(ref, cwd)) {
    console.error(`Error: unknown git ref '${ref}' — use a branch, tag, or commit that exists.`);
    process.exit(2);
  }
}

/** Read project.faf at a git ref via `git show` (no shell). '' if absent at the ref. */
function readFafAtRef(ref: string, repoRel: string, cwd: string): string {
  try {
    return execFileSync('git', ['show', `${ref}:${repoRel}`], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return ''; // the .faf didn't exist at that ref — a "born here" diff
  }
}

/**
 * The 7-arg GIT_EXTERNAL_DIFF protocol handler. When a `.faf` carries the
 * `diff=faf` attribute and `diff.faf.command` is set, git invokes:
 *   <name> <old-file> <old-hex> <old-mode> <new-file> <new-hex> <new-mode>
 * We read BOTH temp files git materialised and emit the semantic delta in place
 * of git's line diff — so `git diff`, `git log -p`, `git show` speak .faf.
 * (A `command` driver, NOT textconv: textconv only ever sees one blob at a time;
 *  a context delta is inherently cross-file.)
 *
 * Two edges git actually hands us, both handled here:
 *  - an UNMERGED path is passed with a SINGLE arg (the path) — there are no two
 *    sides to diff, so we say so instead of rendering a bogus "(absent)" delta.
 *  - the whole thing FAILS OPEN: a driver that throws makes `git diff` abort with
 *    "external diff died". We never let our renderer break the user's `git diff`.
 */
export function diffDriverCommand(argv: string[]): void {
  const path = argv[0] ?? 'project.faf';
  try {
    // Unmerged path → git passes only <path>. Nothing to compare.
    if (argv.length < 5) {
      console.log(`${path} — unmerged (resolve the conflict, then \`faf diff\`)`);
      return;
    }
    const read = (f?: string): string =>
      f && f !== '/dev/null' && existsSync(f) ? readFileSync(f, 'utf-8') : '';
    // Label off the FILE, not the hex: git passes /dev/null for a genuinely
    // absent side, but an all-zero hash for the (present) uncommitted worktree.
    const label = (file?: string, hex?: string): string => {
      if (!file || file === '/dev/null') {return '(absent)';}
      if (!hex || /^0+$/.test(hex)) {return '(working tree)';}
      return hex.slice(0, 7);
    };
    const diff = computeFafDiff(read(argv[1]), read(argv[4]));
    console.log(renderFafDiff(diff, label(argv[1], argv[2]), label(argv[4], argv[5])));
  } catch (err) {
    // Fail OPEN — emit a one-liner, exit 0, so `git diff` never errors over us.
    console.log(`${path} — faf diff unavailable (${err instanceof Error ? err.message : 'error'})`);
  }
}

/** The .gitattributes line that opts .faf files into the driver. */
const GA_LINE = '*.faf diff=faf';

/**
 * Does the configured runner actually resolve AND support its subcommand?
 * Catches the version-ordering trap: a driver/hook wired to a `faf` older than
 * 7.0 (which lacks `diff-driver`/`hooks-run`). Runs it with no args — a safe
 * no-op that exits 0 on a 7.0+ faf and errors ("unknown command") on an old one.
 */
export function runnerWorks(runnerCmd: string): boolean {
  const [cmd, ...args] = runnerCmd.trim().split(/\s+/);
  try {
    execFileSync(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

/** Resolve the git repo root, or exit(2) if not in a repo. */
function repoRoot(cwd: string): string {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    console.error('Error: not a git repository.');
    process.exit(2);
    throw new Error('unreachable');
  }
}

/** faf's own value for `diff.faf.command` — the canonical bin name, never
 *  the `faf` alias (a `faf` on PATH can be shadowed by another tool; `faf-cli`
 *  is unambiguous and installed alongside `faf`). */
export const FAF_DIFF_DRIVER = 'faf-cli diff-driver';

/** The NUL-separated output of a `git config --null` query; '' when the
 *  key is not set. A config git cannot read is a one-line Error. */
function gitConfigQuery(cwd: string, args: string[], what: string): string {
  try {
    return execFileSync('git', ['config', '--null', ...args], { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    if ((e as { status?: number }).status === 1) {return '';} // not set
    const why = String((e as { stderr?: unknown }).stderr ?? '').trim().split('\n')[0] || 'git config failed';
    throw new Error(`git cannot read ${what} (${why})`, { cause: e });
  }
}

/** Every value git has for `diff.faf.command`, from every config file git
 *  reads (`git config --get-all`, NUL-separated so a value is never split) —
 *  or, with `local`, from the repo's own config file only (`--local` reads no
 *  include); [] when it is not set. A config git cannot read is a one-line Error. */
function driverValues(cwd: string, local = false): string[] {
  return gitConfigQuery(cwd, [...(local ? ['--local'] : []), '--get-all', 'diff.faf.command'], 'diff.faf.command').split('\0').slice(0, -1);
}

/** Every `diff.faf.*` key git has other than faf's own `command` — a driver
 *  setting of the user's (`diff.faf.textconv`, `diff.faf.binary`), from any
 *  config file git reads. A config git cannot read is a one-line Error. */
function otherDriverKeys(cwd: string): string[] {
  const out = gitConfigQuery(cwd, ['--get-regexp', '^diff\\.faf\\.'], 'the diff.faf settings');
  const keys = out.split('\0').slice(0, -1).map(entry => entry.split('\n')[0]);
  return [...new Set(keys.filter(k => k !== 'diff.faf.command'))];
}

/** The values, for a one-line message. */
const shown = (values: string[]): string => values.map(v => JSON.stringify(v)).join(', ');

/** Add faf's `*.faf diff=faf` line to the repo's `.gitattributes` (at the
 *  end, in the file's own line ending), keeping every byte it had. */
function optIntoDriver(top: string): void {
  const ga = resolveInside(top, '.gitattributes');
  const before = readIfPresent(ga);
  const existing = before ?? '';
  if (existing.split('\n').some((l) => l.trim() === GA_LINE)) {
    console.log(`•  .gitattributes already opts in (${GA_LINE})`);
    return;
  }
  const eol = existing.includes('\r\n') ? '\r\n' : '\n';
  const next = `${existing}${existing && !existing.endsWith('\n') ? eol : ''}${GA_LINE}${eol}`;
  safeWriteFile(ga, next, { root: top, expect: before });
  console.log(`✅ .gitattributes  ${GA_LINE}`);
}

/**
 * Wire `faf diff` into native git: adds `*.faf diff=faf` to `.gitattributes`
 * and sets `git config diff.faf.command "faf-cli diff-driver"`. Idempotent.
 * Returns false, having written nothing, when it refuses.
 *
 * `diff.faf.command` is read first (`git config --get-all`): faf sets it only
 * when it is unset or already faf's value. A driver of your own — more than
 * one value, or any other `diff.faf.*` key (a `textconv` of yours) — is left
 * alone: one line, and neither the config nor `.gitattributes` is touched.
 *
 * `.gitattributes` keeps every byte it had: faf reads it, adds its one line at
 * the end (in the file's own line ending) and writes it atomically — never
 * through a link that leaves the repo, dangles or leads to a file with another
 * name, and never over an edit made after faf read it (SafePathError).
 */
export function installDriver(cwd: string): boolean {
  const top = repoRoot(cwd);
  let values: string[];
  try {
    values = driverValues(cwd);
  } catch (e) {
    console.error(`faf: ${(e as Error).message} — faf left your git config unchanged.`);
    return false;
  }
  const ours = values.length === 1 && values[0] === FAF_DIFF_DRIVER;
  if (values.length > 0 && !ours) {
    console.error(`faf: diff.faf.command is already set to ${shown(values)}, not faf's driver (${FAF_DIFF_DRIVER}) — faf left your git config and .gitattributes unchanged.`);
    return false;
  }
  // A [diff "faf"] setting of your own (a textconv, say) is a driver of yours:
  // faf's command would take its place, so faf sets nothing.
  let others: string[];
  try {
    others = otherDriverKeys(cwd);
  } catch (e) {
    console.error(`faf: ${(e as Error).message} — faf left your git config unchanged.`);
    return false;
  }
  if (others.length > 0) {
    console.error(`faf: your git config already has ${others.join(', ')} — a diff driver setting of your own, so faf left your git config and .gitattributes unchanged.`);
    return false;
  }
  optIntoDriver(top);
  if (ours) {
    console.log(`•  git config already set (diff.faf.command = ${FAF_DIFF_DRIVER})`);
  } else {
    execFileSync('git', ['config', 'diff.faf.command', FAF_DIFF_DRIVER], { cwd });
    console.log(`✅ git config       diff.faf.command = ${FAF_DIFF_DRIVER}`);
  }
  console.log('\n→ `git diff`, `git log -p`, `git show` now render the .faf score + slot delta.');
  // Pre-flight: the `faf-cli` git will invoke must actually support diff-driver (≥ 7.0).
  if (!runnerWorks(FAF_DIFF_DRIVER)) {
    console.log('\n⚠  the `faf-cli` on your PATH does not support `diff-driver` yet (needs faf-cli ≥ 7.0).');
    console.log('   `git diff` on .faf files falls back to the raw text diff until you upgrade.');
  }
  return true;
}

/** The section `faf diff --install-driver` writes (`git config
 *  diff.faf.command "faf-cli diff-driver"` into a config without one): its
 *  header line and its key line, each a whole line. */
const DRIVER_HEADER = '[diff "faf"]';
const DRIVER_LINE = `\tcommand = ${FAF_DIFF_DRIVER}`;

/** True when a config line ends in a backslash that continues its value on
 *  the next line (an odd run of them). A heuristic: git's own reading of the
 *  file checks the edit (see {@link removeDriverLine}). */
const continues = (line: string): boolean => (/\\+$/.exec(stripEnd(line))?.[0].length ?? 0) % 2 === 1;

/**
 * The repo's config text without the driver section faf's install writes —
 * or null when faf cannot prove the section is that. Only a line that is
 * byte for byte `\tcommand = faf-cli diff-driver` (a CRLF line end allowed),
 * not continued from the line above, under a header line that is exactly
 * `[diff "faf"]`, counts; there must be exactly one, and it must be all its
 * section holds (blank lines aside, and they stay). Then both lines go. A
 * comment on either line or in the section, another key in it, another
 * spelling (`COMMAND`, `[DIFF "faf"]`) or the key on the header line: null.
 */
export function withoutDriverLine(text: string): string | null {
  const lines = linesWithEnds(text);
  const continued = lines.map((_, i) => i > 0 && continues(lines[i - 1]));
  const header = lines.map((line, i) => !continued[i] && stripEnd(line).trimStart().startsWith('['));
  const found: Array<{ at: number; head: number }> = [];
  let head = -1;
  lines.forEach((line, i) => {
    if (header[i]) {
      head = stripEnd(line) === DRIVER_HEADER ? i : -1;
    } else if (head >= 0 && !continued[i] && stripEnd(line) === DRIVER_LINE) {
      found.push({ at: i, head });
    }
  });
  if (found.length !== 1) {return null;}
  const { at, head: top } = found[0];
  let end = at + 1;
  while (end < lines.length && !header[end]) {end++;}
  const more = lines.slice(top + 1, end).some((l, j) => top + 1 + j !== at && stripEnd(l).trim() !== '');
  if (more) {return null;} // a comment or a setting of yours in the section: not faf's alone
  return lines.filter((_, i) => i !== top && i !== at).join('');
}

/** Every entry git reads from a config text (`git config --file - --list`,
 *  NUL-separated), in order; null when git cannot read it. */
function configEntries(cwd: string, text: string): string[] | null {
  try {
    return execFileSync('git', ['config', '--file', '-', '--null', '--list'], { cwd, input: text, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).split('\0').slice(0, -1);
  } catch {
    return null;
  }
}

/** True when git reads `after` as exactly `before` less one faf driver entry. */
function onlyDriverRemoved(cwd: string, before: string, after: string): boolean {
  const was = configEntries(cwd, before);
  const now = configEntries(cwd, after);
  if (was === null || now === null) {return false;}
  const ours = `diff.faf.command\n${FAF_DIFF_DRIVER}`;
  const at = was.indexOf(ours);
  if (at < 0 || was.lastIndexOf(ours) !== at) {return false;}
  const want = [...was.slice(0, at), ...was.slice(at + 1)];
  return want.length === now.length && want.every((entry, i) => entry === now[i]);
}

/** Remove the driver section faf's install wrote from the repo's own config
 *  file, as a text edit through safe-write — only when git reads the result
 *  as the file less faf's entry and nothing else. null when done, else the
 *  one-line reason faf left the file as it is. */
function removeDriverLine(cwd: string): string | null {
  const local = driverValues(cwd, true);
  if (local.length !== 1 || local[0] !== FAF_DIFF_DRIVER) {
    return `diff.faf.command = ${FAF_DIFF_DRIVER} is set outside this repo's own config (your global or system git config) — faf left it unchanged.`;
  }
  const named = resolve(cwd, execFileSync('git', ['rev-parse', '--git-path', 'config'], { cwd, encoding: 'utf-8' }).trim());
  const folder = dirname(named);
  try {
    const cfg = resolveInside(folder, named, { allowGitConfig: true });
    const text = readUtf8(cfg);
    const next = withoutDriverLine(text);
    if (next === null || !onlyDriverRemoved(cwd, text, next)) {
      return `diff.faf.command in ${cfg} is not in the section faf writes (a [diff "faf"] line and a tab-indented "command = ${FAF_DIFF_DRIVER}" line, with nothing else in the section or on either line) — faf left your git config unchanged.`;
    }
    safeWriteFile(cfg, next, { root: folder, allowGitConfig: true, expect: text });
    return null;
  } catch (e) {
    if (e instanceof SafePathError || e instanceof NotWrittenError) {return e.message;}
    throw e;
  }
}

/**
 * Remove the driver wiring (git config). Leaves .gitattributes for the user
 * to keep or delete. faf removes only what its install wrote: its one value
 * must be exactly faf's (`faf-cli diff-driver`) and sit in this repo's own
 * config file as the section install writes — a `[diff "faf"]` line and a
 * `\tcommand = faf-cli diff-driver` line, nothing else in it. faf reads that
 * file (`git rev-parse --git-path config`) and removes those two lines as a
 * text edit, so every other byte stays. A driver of your own, more than one
 * value, faf's value set outside the repo, or faf's value written any other
 * way (a comment on its line, another spelling, a setting of yours in the
 * section) is left alone with one line. Returns false when it refuses.
 */
export function uninstallDriver(cwd: string): boolean {
  repoRoot(cwd);
  let values: string[];
  try {
    values = driverValues(cwd);
  } catch (e) {
    console.error(`faf: ${(e as Error).message} — faf left your git config unchanged.`);
    return false;
  }
  if (values.length === 0) {
    console.log('•  diff.faf.command is not set — nothing to remove (the .gitattributes line, if any, is left for you to keep or delete).');
    return true;
  }
  if (values.length !== 1 || values[0] !== FAF_DIFF_DRIVER) {
    console.error(`faf: diff.faf.command is ${shown(values)}, not faf's driver (${FAF_DIFF_DRIVER}) — faf left your git config unchanged.`);
    return false;
  }
  let refused: string | null;
  try {
    refused = removeDriverLine(cwd);
  } catch (e) {
    refused = `${(e as Error).message.split('\n')[0]} — faf left your git config unchanged.`;
  }
  if (refused !== null) {
    console.error(`faf: ${refused}`);
    return false;
  }
  console.log('✅ removed diff.faf.command (the .gitattributes line is left for you to keep or delete).');
  return true;
}

export interface DiffOptions {
  json?: boolean;
  installDriver?: boolean;
  uninstallDriver?: boolean;
}

export function diffCommand(range: string | undefined, options: DiffOptions = {}, cwd: string = process.cwd()): void {
  // Driver management is a separate verb that lives on the same command. A
  // refusal (a diff.faf.command of your own) is one line and exit 1.
  if (options.installDriver) {
    if (!installDriver(cwd)) {process.exit(1);}
    return;
  }
  if (options.uninstallDriver) {
    if (!uninstallDriver(cwd)) {process.exit(1);}
    return;
  }

  const fafPath = findFafFile(cwd);
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  // Resolve the .faf path relative to the git repo root (for `git show <ref>:<path>`).
  let top: string;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf-8' }).trim();
  } catch {
    console.error('Error: not a git repository — faf diff compares .faf versions across git history.');
    process.exit(2);
    return;
  }
  void top; // computed above purely as the in-repo guard
  const repoRel = gitRepoRel(fafPath as string, cwd); // git-computed → Windows 8.3-safe

  let baseRef: string;
  let targetRef: string;
  let baseRaw: string;
  let targetRaw: string;

  if (!range) {
    baseRef = 'HEAD';
    targetRef = '(working tree)';
    baseRaw = readFafAtRef('HEAD', repoRel, cwd);
    targetRaw = readFafRaw(fafPath as string);
  } else if (range.includes('...')) {
    const [a, b] = range.split('...');
    assertRef(a, cwd);
    assertRef(b, cwd);
    let mb: string;
    try {
      mb = execFileSync('git', ['merge-base', a, b], { cwd, encoding: 'utf-8' }).trim();
    } catch {
      console.error(`Error: '${a}' and '${b}' have no common ancestor — can't compute a merge-base diff.`);
      process.exit(2);
      return;
    }
    baseRef = mb.slice(0, 7);
    targetRef = b;
    baseRaw = readFafAtRef(mb, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else if (range.includes('..')) {
    const [a, b] = range.split('..');
    assertRef(a, cwd);
    assertRef(b, cwd);
    baseRef = a;
    targetRef = b;
    baseRaw = readFafAtRef(a, repoRel, cwd);
    targetRaw = readFafAtRef(b, repoRel, cwd);
  } else {
    assertRef(range, cwd);
    baseRef = range;
    targetRef = '(working tree)';
    baseRaw = readFafAtRef(range, repoRel, cwd);
    targetRaw = readFafRaw(fafPath as string);
  }

  const diff = computeFafDiff(baseRaw, targetRaw);

  if (options.json) {
    console.log(JSON.stringify({ base: baseRef, target: targetRef, ...diff }, null, 2));
  } else {
    console.log(renderFafDiff(diff, baseRef, targetRef));
  }
}
