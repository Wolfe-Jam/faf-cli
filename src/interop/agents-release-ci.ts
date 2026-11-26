/**
 * AGENTS.md's "Before a release" and "CI" sections (#273), as agents-md-facts
 * 0.2.2 writes them (src/detect/release.ts, src/detect/ci.ts, src/author.ts
 * §3b–§3c). Ported, not imported: every read goes through faf-cli's repo-file
 * helpers, so a workflow or package.json reached by a link out of the project
 * is not read. tests/interop/agents-release-ci-parity.test.ts runs both on the
 * same repos and fails if the two sections ever differ.
 *
 * Instructions only, from what the repo declares (package.json lifecycle
 * scripts, .github/workflows/): never guessed.
 */

import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { parse } from 'yaml';
import { readRepoDir, readRepoFile, repoExists } from '../core/safe-write.js';

// ─── Before a release ──────────────────────────────────────────────────────

/** A script that runs before a release, as the manifest declares it. */
export interface ReleaseScript {
  name: string;
  /** The script's command line, verbatim. */
  command: string;
}

/** What runs before a release. `publish`: the hooks `npm publish` runs first,
 *  in its order. `script`: a `release` script, run by hand. `none`: a
 *  publishable package that declares neither. */
export interface DetectedRelease {
  kind: 'publish' | 'script' | 'none';
  scripts: ReleaseScript[];
}

/** npm ≥ 7 runs these on `npm publish`, in this order (`prepublish` runs on install). */
const PUBLISH_HOOKS = ['prepublishOnly', 'prepack'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function readPkg(dir: string, sub = ''): Obj | null {
  const text = readRepoFile(dir, sub ? join(sub, 'package.json') : 'package.json');
  if (text === null) {return null;}
  try {
    const pkg: unknown = JSON.parse(text);
    return isObj(pkg) ? pkg : null;
  } catch {
    return null;
  }
}

/** The release gate the repo's package.json declares, or null for none / a private package. */
export function detectRelease(pkg: Obj | null): DetectedRelease | null {
  const scripts = isObj(pkg?.scripts) ? pkg.scripts : {};
  const pick = (name: string): ReleaseScript | null => {
    const command = typeof scripts[name] === 'string' ? scripts[name].trim() : '';
    return command ? { name, command } : null;
  };
  const hooks = PUBLISH_HOOKS.map(pick).filter((s): s is ReleaseScript => s !== null);
  if (hooks.length) {return { kind: 'publish', scripts: hooks };}
  const release = pick('release');
  if (release) {return { kind: 'script', scripts: [release] };}
  return pkg && pkg.private !== true ? { kind: 'none', scripts: [] } : null;
}

// ─── CI ────────────────────────────────────────────────────────────────────

/** One CI step that runs at least one of the repo's own scripts or listed commands. */
export interface CiStep {
  lines: string[];
  if?: string;
  dir?: string;
  name?: string;
  shell?: string;
}

/** True when a command calls something the repo declares. */
export type Known = (command: string, dir: string | undefined) => boolean;

export interface CiJob {
  id: string;
  if?: string;
  runsOn: string[];
  matrix: string[];
  steps: CiStep[];
  other: number;
  calls?: string;
}

export interface DetectedWorkflow {
  file: string;
  on: string[];
  checksChanges: boolean;
  jobs: CiJob[];
  unreadable?: boolean;
}

/** Split a `run:` script into commands at newlines, `&&`, `||`, `;` and `|`, outside quotes. */
export function commandsOf(script: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote = '';
  const flush = (): void => {
    const c = cur.trim();
    if (c && !c.startsWith('#')) {out.push(c);}
    cur = '';
  };
  for (let i = 0; i < script.length; i++) {
    const ch = script.charAt(i);
    if (quote) { if (ch === quote) {quote = '';} cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '\n' || ch === ';' || ch === '|' || (ch === '&' && script.charAt(i + 1) === '&')) {
      flush();
      if ((ch === '&' || ch === '|') && script.charAt(i + 1) === ch) {i++;}
      continue;
    }
    cur += ch;
  }
  flush();
  return out;
}

/** Token shapes never copied into AGENTS.md, even if a workflow has one inline. */
const TOKEN = /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[abpr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|npm_[A-Za-z0-9]{30,})\b/g;

const scalar = (v: unknown): string | null =>
  typeof v === 'string' ? v.trim() || null : typeof v === 'number' || typeof v === 'boolean' ? String(v) : null;
const hasExpr = (s: string): boolean => s.includes('${{');
const oneLine = (s: string | null): string | null => {
  if (!s) {return null;}
  const t = s.replace(/\s+/g, ' ').replace(TOKEN, '<token>').trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
};
const cleanDir = (s: string | null): string | null => {
  const d = s?.replace(/^\.\//, '').replace(/\/+$/, '') ?? null;
  return d && d !== '.' ? d : null;
};

function triggers(on: unknown): string[] {
  if (typeof on === 'string') {return [on];}
  if (Array.isArray(on)) {return on.map(scalar).filter((s): s is string => s !== null);}
  if (isObj(on)) {return Object.keys(on);}
  return [];
}

function asList(v: unknown): unknown[] {
  return Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
}

/** A check on a change: pull_request (not only close/label), push to branches (not tags or main only), merge_group. */
function checksChanges(on: unknown): boolean {
  const events = triggers(on);
  const cfg = (e: string): Obj => (isObj(on) && isObj(on[e]) ? on[e] : {});
  if (events.includes('merge_group')) {return true;}
  if (events.includes('pull_request')) {
    const list = asList(cfg('pull_request').types);
    if (!list.length || list.some((t) => /^(opened|synchronize|reopened|ready_for_review|edited)$/.test(String(t)))) {return true;}
  }
  if (events.includes('push') && !events.includes('pull_request')) {
    const push = cfg('push');
    const tagsOnly = (push.tags !== undefined || push['tags-ignore'] !== undefined)
      && push.branches === undefined && push['branches-ignore'] === undefined;
    const branches = asList(push.branches);
    const mainOnly = branches.length > 0 && branches.every((b) => b === 'main' || b === 'master');
    if (!tagsOnly && !mainOnly) {return true;}
  }
  return false;
}

function matrixOf(strategy: Obj): { axes: Map<string, string[]>; notes: string[]; include: number } {
  const matrixRaw = strategy.matrix;
  const matrix = isObj(matrixRaw) ? matrixRaw : {};
  const axes = new Map<string, string[]>();
  const notes: string[] = [];
  if (typeof matrixRaw === 'string' && hasExpr(matrixRaw)) {notes.push('matrix set by an expression');}
  for (const [rawKey, value] of Object.entries(matrix)) {
    if (rawKey === 'include' || rawKey === 'exclude') {continue;}
    const key = oneLine(rawKey) ?? '';
    if (typeof value === 'string' && hasExpr(value)) { notes.push(`${key} set by an expression`); continue; }
    if (!Array.isArray(value)) {continue;}
    const plain = value.map((v) => oneLine(scalar(v))).filter((s): s is string => s !== null && !hasExpr(s));
    if (plain.length) {axes.set(key, plain.length < value.length ? [...plain, '…'] : plain);}
  }
  return { axes, notes, include: Array.isArray(matrix.include) ? matrix.include.length : 0 };
}

function runsOnOf(ro: unknown, axes: Map<string, string[]>): string[] {
  if (typeof ro === 'string') {
    if (/^\$\{\{\s*matrix\.os\s*\}\}$/.test(ro.trim())) {return axes.get('os') ?? [];}
    return hasExpr(ro) ? [] : [oneLine(ro) ?? ''].filter(Boolean);
  }
  if (Array.isArray(ro)) {
    const labels = ro.map((v) => oneLine(scalar(v))).filter((s): s is string => s !== null && !hasExpr(s));
    if (labels.length === ro.length && labels.length) {return [labels.join('+')];}
  }
  return [];
}

function readStep(step: Obj, jobDefaults: Obj, wfDefaults: Obj, known: Known): CiStep | null {
  const raw = scalar(step.run);
  if (!raw) {return null;}
  const dir = oneLine(cleanDir(scalar(step['working-directory']) ?? scalar(jobDefaults['working-directory']) ?? scalar(wfDefaults['working-directory'])));
  if (!commandsOf(raw).some((c) => known(oneLine(c) ?? '', dir ?? undefined))) {return null;}
  const out: CiStep = { lines: raw.split('\n').map((l) => l.trimEnd().replace(TOKEN, '<token>')).filter((l) => l.trim()) };
  const cond = oneLine(scalar(step.if));
  if (cond) {out.if = cond;}
  if (dir) {out.dir = dir;}
  const shell = oneLine(scalar(step.shell) ?? scalar(jobDefaults.shell) ?? scalar(wfDefaults.shell));
  if (shell && !/^(bash|sh)\b/.test(shell)) {out.shell = shell;}
  const name = oneLine(scalar(step.name));
  if (raw.includes('\n') && name && !hasExpr(name)) {out.name = name;}
  return out;
}

function readJob(id: string, job: Obj, wfDefaults: Obj, known: Known): CiJob {
  const { axes, notes, include } = matrixOf(isObj(job.strategy) ? job.strategy : {});
  const jobDefaults = isObj(job.defaults) && isObj(job.defaults.run) ? job.defaults.run : {};
  const steps: CiStep[] = [];
  let other = 0;
  for (const step of Array.isArray(job.steps) ? job.steps : []) {
    if (!isObj(step) || !scalar(step.run)) {continue;}
    const read = readStep(step, jobDefaults, wfDefaults, known);
    if (read) {steps.push(read);} else {other++;}
  }
  const out: CiJob = {
    id: oneLine(id) ?? id,
    runsOn: runsOnOf(job['runs-on'], axes),
    matrix: [
      ...[...axes].filter(([k]) => k !== 'os').map(([k, v]) => `${k} ${v.join(', ')}`),
      ...(include ? [`include: ${include} more`] : []),
      ...notes,
    ],
    steps,
    other,
  };
  const cond = oneLine(scalar(job.if));
  if (cond) {out.if = cond;}
  const uses = scalar(job.uses);
  if (uses?.startsWith('./.github/workflows/')) {out.calls = uses.slice(2).replace(/@.*$/, '');}
  return out;
}

/** One workflow's triggers and jobs, parsed as YAML. Not valid YAML: `unreadable`. Pure. */
export function parseWorkflow(text: string, known: Known = () => true): Omit<DetectedWorkflow, 'file'> {
  let doc: unknown;
  try {
    doc = parse(text, { merge: true });
  } catch {
    return { on: [], checksChanges: false, jobs: [], unreadable: true };
  }
  if (!isObj(doc)) {return { on: [], checksChanges: false, jobs: [], unreadable: true };}
  const wfDefaults = isObj(doc.defaults) && isObj(doc.defaults.run) ? doc.defaults.run : {};
  const jobs: CiJob[] = [];
  if (isObj(doc.jobs)) {
    for (const [id, job] of Object.entries(doc.jobs)) {
      if (isObj(job)) {jobs.push(readJob(id, job, wfDefaults, known));}
    }
  }
  return { on: triggers(doc.on), checksChanges: checksChanges(doc.on), jobs };
}

/** Every workflow in `.github/workflows/`, by file name, readable or not. */
export function detectCi(dir: string, known: Known = () => true): DetectedWorkflow[] {
  const rel = '.github/workflows';
  const files = (readRepoDir(dir, rel) ?? []).map((e) => e.name).filter((f) => /\.ya?ml$/.test(f)).sort();
  const out: DetectedWorkflow[] = [];
  for (const f of files) {
    const text = readRepoFile(dir, `${rel}/${f}`);
    if (text === null) {continue;}
    out.push({ file: `${rel}/${f}`, ...parseWorkflow(text, known) });
  }
  return out;
}

/** Subcommands pnpm and yarn run themselves; `pnpm install` is never a script call. */
const BUILTIN = new Set(('add audit bin cache config create dedupe deploy dlx env exec fetch import info init install i link '
  + 'list ls login logout npm outdated pack patch prune publish rebuild remove rm root run set store unlink up update '
  + 'upgrade version why workspace workspaces').split(' '));

/** Check tools a Node repo runs through npx / bunx / pnpm exec, or directly. */
const NODE_CHECKS = /^(?:(?:npx|bunx|pnpm exec|pnpm dlx|yarn)(?:\s+-\S+)*\s+)?(?:tsc|eslint|vitest|jest|playwright test|prettier --check|biome (?:check|ci|lint))(?:\s|$)/;

const WORKSPACE_CALL = /^(?:pnpm(?:\s+(?:-r|--recursive|(?:--filter|-F)\s+\S+|-[\w-]+))+|npm(?:\s+(?:-ws|--workspaces|(?:-w|--workspace)\s+\S+|-[\w-]+))+(?:\s+run)?|yarn\s+workspace\s+\S+|yarn\s+workspaces\s+foreach(?:\s+-\S+)*\s+run)\s+([^\s-]\S*)/;
const WORKSPACE_FLAG = /(?:-r|--recursive|--filter|-F|-ws|--workspaces|-w|--workspace|workspace)\b/;
const SCRIPT_CALL = /^(npm|pnpm|yarn|bun)(?:\s+-[\w-]+)*\s+(?:(run|run-script)(?:\s+-[\w-]+)*\s+)?([^\s-]\S*)/;

/** The toolchain's own check commands, by the manifests the repo has. */
function toolchainCheck(repoDir: string): (c: string) => boolean {
  const at = (p: string): boolean => repoExists(repoDir, p);
  const tool = {
    node: at('package.json'),
    bun: at('bun.lock') || at('bun.lockb') || at('bunfig.toml'),
    cargo: at('Cargo.toml'),
    go: at('go.mod'),
    zig: at('build.zig'),
    python: at('pyproject.toml') || at('pytest.ini') || at('setup.py'),
  };
  return (c) => (tool.bun && /^bun test(?:\s|$)/.test(c))
    || (tool.node && NODE_CHECKS.test(c))
    || (tool.cargo && /^cargo\s+(?:\+\S+\s+)?(?:test|build|check|clippy|fmt|nextest)(?:\s|$)/.test(c))
    || (tool.go && /^(?:go\s+(?:test|build|vet)|golangci-lint\s+run)(?:\s|$)/.test(c))
    || (tool.zig && /^zig\s+build(?:\s|$)/.test(c))
    || (tool.python && /^(?:uv run |poetry run |python3? -m )?(?:pytest|ruff|mypy|black --check)(?:\s|$)/.test(c));
}

/** A memo of names per folder: package.json scripts, Makefile targets. */
function perFolder(read: (sub: string) => Set<string>): (sub: string) => Set<string> {
  const cache = new Map<string, Set<string>>();
  return (sub) => {
    let names = cache.get(sub);
    if (!names) { names = read(sub); cache.set(sub, names); }
    return names;
  };
}

/** The repo's own commands, for matching CI lines (agents-md-facts' ownCommands). */
export function ownCommands(repoDir: string, listed: string[]): Known {
  const check = toolchainCheck(repoDir);
  const scriptsIn = perFolder((sub) => {
    const scripts = readPkg(repoDir, sub)?.scripts;
    return new Set(isObj(scripts) ? Object.keys(scripts) : []);
  });
  const targetsIn = perFolder((sub) => {
    const text = readRepoFile(repoDir, sub ? join(sub, 'Makefile') : 'Makefile') ?? '';
    return new Set([...text.matchAll(/^([\w.-]+)\s*:(?!=)/gm)].map((m) => m[1]).filter((t): t is string => !!t));
  });
  const isScript = (c: string, dir: string | undefined): boolean => {
    const m = SCRIPT_CALL.exec(c);
    if (!m) {return false;}
    const [, pm, run, name = ''] = m;
    const builtin = !run && (pm === 'bun' || (pm === 'npm' ? !/^(test|t|start)$/.test(name) : BUILTIN.has(name)));
    return !builtin && scriptsIn(dir ?? '').has(pm === 'npm' && name === 't' ? 'test' : name);
  };
  return (command, dir) => {
    const c = command.replace(/^(\w+=\S*\s+)+/, '');
    if (!dir && listed.some((l) => c === l || c.startsWith(`${l} `))) {return true;}
    const ws = WORKSPACE_CALL.exec(c);
    if (ws?.[1] && !BUILTIN.has(ws[1]) && WORKSPACE_FLAG.test(c)) {return true;}
    if (isScript(c, dir) || check(c)) {return true;}
    const make = /^make\s+(?:-\S+\s+)*([\w.-]+)(?:\s|$)/.exec(c)?.[1];
    return !!make && targetsIn(dir ?? '').has(make);
  };
}

// ─── Rendering (agents-md-facts author.ts §3b–§3c) ─────────────────────────

/** Lines the CI section may use; the main workflow always gets a block. */
const CI_BUDGET = 40;
/** Fewest lines worth giving a second workflow; below that it is named. */
const CI_MIN_BLOCK = 8;
/** Workflows named on the "Also:" line before the count takes over. */
const ALSO_MAX = 6;

/** The repo's main check first (`ci.yml`, `test.yml`), helpers that fix, label or release last. */
function rank(wf: DetectedWorkflow): [number, number, string] {
  const base = wf.file.replace(/^.*\//, '').replace(/\.ya?ml$/, '').toLowerCase();
  const word = (re: string): boolean => new RegExp(`(^|[-_.])(${re})([-_.]|$)`).test(base);
  const main = word('(auto)?fix|format|bot|labell?er|label|update|changelog|release|deploy|publish|stale') ? 4
    : /^(ci|tests?|checks?|build|lint|main|verify|validate|pr)$/.test(base) ? 0
      : word('ci|tests?|build') ? 1
        : word('checks?|lint|verify') ? 2 : 3;
  return [main, wf.on.includes('pull_request') ? 0 : 1, wf.file];
}
const byRank = (a: DetectedWorkflow, b: DetectedWorkflow): number => {
  const [x, y] = [rank(a), rank(b)];
  return x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0);
};

/** A code fence longer than any backtick run inside the block. */
function fenceFor(lines: string[]): string {
  const longest = Math.max(0, ...lines.map((l) => Math.max(0, ...(l.match(/`+/g) ?? []).map((m) => m.length))));
  return '`'.repeat(Math.max(3, longest + 1));
}

function stepLines(step: CiStep): string[] {
  const notes = [...step.name ? [`step "${step.name}"`] : [], ...step.if ? [`if: ${step.if}`] : [],
    ...step.dir ? [`in ${step.dir}/`] : [], ...step.shell ? [`shell: ${step.shell}`] : []];
  const [first, ...more] = step.lines;
  if (!notes.length) {return step.lines;}
  if (!more.length) {return [`${first ?? ''}    # ${notes.join(' · ')}`];}
  return [`# ${notes.join(' · ')}`, ...step.lines.map((l) => `  ${l}`)];
}

function jobLines(job: CiJob, prefix: string): string[] {
  const where = [...job.runsOn.length ? [job.runsOn.join(', ')] : [], ...job.matrix];
  const out = [`# job ${prefix}${job.id}${job.if ? ` · if: ${job.if}` : ''}${where.length ? ` · ${where.join(' · ')}` : ''}`];
  for (const step of job.steps) {out.push(...stepLines(step));}
  if (job.other) {out.push(`# ${job.other} other step${job.other > 1 ? 's' : ''} in the file`);}
  return out;
}

/** One workflow as a fenced block, at most `max` lines; a local reusable workflow it calls is shown under it. */
function workflowLines(wf: DetectedWorkflow, byFile: Map<string, DetectedWorkflow>, max: number): string[] {
  const body: string[] = [];
  for (const job of wf.jobs) {
    if (job.calls) {
      body.push(`# job ${job.id}${job.if ? ` · if: ${job.if}` : ''} · calls \`${job.calls}\``);
      for (const inner of byFile.get(job.calls)?.jobs ?? []) {
        if (inner.calls) {body.push(`# job ${job.id} → ${inner.id} · calls \`${inner.calls}\``);}
        else if (inner.steps.length) {body.push(...jobLines(inner, `${job.id} → `));}
      }
      continue;
    }
    if (job.steps.length) {body.push(...jobLines(job, ''));}
  }
  const room = Math.max(1, max - 2);
  const shown = body.length > room ? [...body.slice(0, room - 1), '# … more in the file'] : body;
  const fence = fenceFor(shown);
  return [`${fence}bash`, ...shown, fence];
}

const runsSomething = (wf: DetectedWorkflow): boolean =>
  wf.jobs.some((j) => j.steps.length > 0 || j.calls !== undefined);

/** "## Before a release", or nothing. */
export function releaseSection(release: DetectedRelease | null): string[] {
  if (release?.kind === 'none') {
    return ['## Before a release', '', '`npm publish` runs no checks first: package.json has no `prepublishOnly`, `prepack` or `release` script.', ''];
  }
  if (!release?.scripts.length) {return [];}
  const names = release.scripts.map((r) => `\`${r.name}\``).join(', then ');
  const out = ['## Before a release', '', release.kind === 'publish' ? `\`npm publish\` runs ${names} first:` : 'The `release` script runs:', '', '```bash'];
  for (const r of release.scripts) {
    if (release.scripts.length > 1) {out.push(`# ${r.name}`);}
    out.push(r.command);
  }
  out.push('```', '');
  return out;
}

const label = (wf: DetectedWorkflow): string =>
  `\`${wf.file}\`${wf.unreadable ? ' (not valid YAML)' : wf.on.length ? ` (on ${wf.on.join(', ')})` : ''}`;

/** "## CI": the repo commands each check on a change runs; other workflows by name. */
export function ciSection(ci: DetectedWorkflow[], isGitRepo: boolean): string[] {
  if (!ci.length) {
    return isGitRepo ? ['## CI', '', 'No GitHub Actions workflows (`.github/workflows/`).', ''] : [];
  }
  const byFile = new Map(ci.map((wf) => [wf.file, wf]));
  const checks = ci.filter((wf) => wf.checksChanges && !wf.unreadable && runsSomething(wf)).sort(byRank);
  const out = ['## CI', '', 'The repo\'s own commands each check runs on a change; everything else is in the workflow files.', ''];
  let used = 0;
  const named: DetectedWorkflow[] = [];
  for (const wf of checks) {
    const left = CI_BUDGET - used - 2;
    if (used > 0 && left < CI_MIN_BLOCK) { named.push(wf); continue; }
    const block = workflowLines(wf, byFile, used === 0 ? CI_BUDGET - 2 : left);
    out.push(label(wf), '', ...block, '');
    used += block.length + 2;
  }
  const shown = new Set(checks.filter((wf) => !named.includes(wf)));
  const expanded = new Set([...shown].flatMap((wf) => wf.jobs.map((j) => j.calls).filter((c): c is string => !!c)));
  const rest = [...named, ...ci.filter((wf) => !shown.has(wf) && !named.includes(wf) && !(expanded.has(wf.file) && !wf.checksChanges))];
  if (rest.length) {
    const list = rest.slice(0, ALSO_MAX).map(label);
    const more = rest.length - list.length;
    out.push(`Also: ${list.join(' · ')}${more ? ` · and ${more} more in \`.github/workflows/\`` : ''}.`, '');
  }
  return out;
}

// ─── From a repo folder ────────────────────────────────────────────────────

/** What the repo declares for the two sections. */
export interface RepoInstructions {
  release: DetectedRelease | null;
  ci: DetectedWorkflow[];
  isGitRepo: boolean;
}

/** In a git work tree: a `.git` here or in a folder above. */
function inGitRepo(dir: string): boolean {
  let d = resolve(dir);
  for (;;) {
    if (existsSync(join(d, '.git'))) {return true;}
    const up = dirname(d);
    if (up === d) {return false;}
    d = up;
  }
}

/** Read the release gate and CI for `dir`. `listed`: the commands the file already lists. */
export function readRepoInstructions(dir: string, listed: string[]): RepoInstructions {
  return {
    release: detectRelease(readPkg(dir)),
    ci: detectCi(dir, ownCommands(dir, listed)),
    isGitRepo: inGitRepo(dir),
  };
}
