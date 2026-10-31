import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { findFafFile, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { makeDirInside, repoExists, safeWriteFile } from '../core/safe-write.js';
import { writeRendered } from '../core/render-hash.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { fafCyan, dim, bold } from '../ui/colors.js';
import { tafReceipts } from './taf-receipts.js';

export interface TafOptions {
  output?: string;
  /** taf receipts: how many to show (default 10). */
  limit?: string;
  /** taf receipts: JSON for scripts. */
  json?: boolean;
  /** taf receipts: the git ref whose .taf to read (default origin/taf-receipts, then taf-receipts, then ./.taf). */
  ref?: string;
  write?: boolean;
  /** With --output: replace a file faf cannot prove it wrote (edited since, or not a TAF snapshot). */
  force?: boolean;
}

/** True when `bytes` are a TAF snapshot faf wrote: a JSON object with a
 *  `taf_version`. faf replaces an --output file only when it is one. */
export function isTafSnapshot(bytes: Uint8Array): boolean {
  try {
    const j = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    return typeof j === 'object' && j !== null && !Array.isArray(j) && typeof (j as { taf_version?: unknown }).taf_version === 'string';
  } catch {
    return false;
  }
}

const FAF_TAF_GIT = 'Wolfe-Jam/faf-taf-git@v2.4.3';

/**
 * `faf taf [subcommand]`
 *   (none)  — score snapshot — DEPRECATED, folded into `faf score --json` (alias kept one release)
 *   setup     — write/print the CI step that activates the TAF Receipt Printer
 *   receipts  — show the Test Receipts, newest first
 */
export function tafCommand(subcommand?: string | TafOptions, options: TafOptions = {}): void {
  // Back-compat: legacy/direct callers pass options as the first arg
  // (e.g. `tafCommand({ output })`), pre-dating the subcommand dispatch.
  if (subcommand && typeof subcommand === 'object') {
    options = subcommand;
    subcommand = undefined;
  }
  if (subcommand === 'setup') {
    tafSetup(options);
    return;
  }
  if (subcommand === 'receipts') {
    tafReceipts(options);
    return;
  }
  if (subcommand !== undefined) {
    // A typo used to fall through to the deprecated snapshot without a word.
    console.error(`${bold('×')} Unknown: faf taf ${subcommand}. Use ${bold('faf taf setup')} or ${bold('faf taf receipts')}.`);
    process.exit(1);
  }
  tafSnapshot(options);
}

// ── faf taf setup — the activation bridge ──────────────────────────────────
// Removes the "hand-edit YAML" friction: detects the runner, generates a CI
// workflow wired to faf-taf-git, prints it (safe default) or writes it
// (`--write`, non-destructive — never clobbers an existing taf.yml). Needs no
// .faf — TAF runs on any git repo.

type Runner = 'bun' | 'pnpm' | 'yarn' | 'npm';

function detectRunner(dir: string): Runner {
  if (repoExists(dir, 'bun.lockb') || repoExists(dir, 'bun.lock')) {return 'bun';}
  if (repoExists(dir, 'pnpm-lock.yaml')) {return 'pnpm';}
  if (repoExists(dir, 'yarn.lock')) {return 'yarn';}
  return 'npm';
}

/** package.json, or {} when it can't be read. */
function readPackageJson(dir: string): Record<string, unknown> {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')) as unknown;
    return pkg && typeof pkg === 'object' && !Array.isArray(pkg) ? (pkg as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A command word in a script: `jest`, not `jest-junit` or `myjest`. */
const names = (script: string, word: string) => new RegExp(`(^|[\\s;&|(])${word}(?![\\w-])`).test(script);

/** `npm run x`, `pnpm x`, `yarn x`, `bun run x`: the script it hands over to. */
const DELEGATE = /^\s*(?:npm run|pnpm(?: run)?|yarn(?: run)?|bun run)\s+([\w:.-]+)\s*$/;

/** The command the `test` script ends up running, following up to three
 *  hand-offs; `null` when it hands over to a script that isn't there. */
function testCommand(scripts: Record<string, unknown>): string | null | undefined {
  let script = scripts.test;
  for (let hop = 0; hop < 3 && typeof script === 'string'; hop++) {
    const next = DELEGATE.exec(script)?.[1];
    if (!next) {break;}
    script = scripts[next];
    if (typeof script !== 'string') {return null;}
  }
  return typeof script === 'string' ? script : undefined;
}

/** faf-taf-git reads Jest, Vitest and Bun output (its README's runner table).
 *  True when the repo's `test` script runs one of them. The script decides;
 *  the dependencies only when it hands over to a script faf can't follow. */
function readableJsRunner(pkg: Record<string, unknown>, runner: Runner): boolean {
  const scripts = (pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {}) as Record<string, unknown>;
  const script = testCommand(scripts);
  if (script === null) {
    const deps = { ...(pkg.devDependencies as object), ...(pkg.dependencies as object) };
    return 'jest' in deps || 'vitest' in deps;
  }
  if (script === undefined) {return false;}
  return names(script, 'jest') || names(script, 'vitest') || (runner === 'bun' && names(script, 'bun test'));
}

/** pnpm/action-setup needs a version unless package.json pins pnpm, read the
 *  way the action reads it: `packageManager: pnpm@…`, or devEngines naming
 *  pnpm with a version. Both would make it throw. */
function pnpmSetup(pkg: Record<string, unknown>): string {
  const pm = pkg.packageManager;
  const de = (pkg.devEngines as { packageManager?: { name?: unknown; version?: unknown } } | undefined)?.packageManager;
  const pinned = (typeof pm === 'string' && pm.startsWith('pnpm@')) ||
    (de?.name === 'pnpm' && typeof de.version === 'string' && de.version !== '');
  return pinned ? '      - uses: pnpm/action-setup@v6' : '      - uses: pnpm/action-setup@v6\n        with:\n          version: 10';
}

const RUNTIME: Record<Runner, { setup: string; install: string; test: string }> = {
  bun: {
    setup: '      - uses: oven-sh/setup-bun@v2',
    install: 'bun install --frozen-lockfile',
    test: 'bun run test',
  },
  pnpm: {
    setup: "      - uses: actions/setup-node@v7\n        with:\n          node-version: '24.x'",
    install: 'pnpm install --frozen-lockfile',
    test: 'pnpm test',
  },
  yarn: {
    setup: "      - uses: actions/setup-node@v7\n        with:\n          node-version: '24.x'",
    install: 'yarn install --frozen-lockfile',
    test: 'yarn test',
  },
  npm: {
    setup: "      - uses: actions/setup-node@v7\n        with:\n          node-version: '24.x'",
    install: 'npm ci',
    test: 'npm test',
  },
};

// Not JavaScript: faf-taf-git reads JUnit XML (its README's runner table), so
// each recipe has its runner write a report (both checked end to end against
// faf-taf-git's parser). Checked in this order.
type Language = 'go' | 'python';

function detectLanguage(dir: string): Language | null {
  if (repoExists(dir, 'go.mod')) {return 'go';}
  if (['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', 'pytest.ini'].some((f) => repoExists(dir, f))) {return 'python';}
  return null;
}

const LANGUAGE: Record<Language, { setup: string; test: string; report: string }> = {
  python: {
    setup:
      "      - uses: actions/setup-python@v7\n        with:\n          python-version: '3.x'\n" +
      '      - run: |\n' +
      '          python -m pip install --upgrade pip pytest\n' +
      '          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi\n' +
      '          if [ -f pyproject.toml ] || [ -f setup.py ]; then pip install -e .; fi',
    test: 'pytest --junitxml=report.xml',
    report: 'report.xml',
  },
  go: {
    setup:
      '      - uses: actions/setup-go@v7\n        with:\n          go-version-file: go.mod\n' +
      // setup-go sets GOTOOLCHAIN=local, and gotestsum needs Go 1.24: auto
      // fetches a newer toolchain for this install only.
      '      - run: GOTOOLCHAIN=auto go install gotest.tools/gotestsum@v1.13.0',
    test: 'gotestsum --junitfile report.xml -- ./...',
    report: 'report.xml',
  },
};

const runTests = (cmd: string) =>
  '      - name: Run tests\n' +
  '        id: tests\n' +
  '        continue-on-error: true    # keep going, so a failed run still gets a receipt\n' +
  '        run: |\n' +
  '          set -o pipefail\n' +
  `          ${cmd}\n`;

/** Setup, install and test steps for a repo with a package.json. */
function jsBody(dir: string): string {
  const runner = detectRunner(dir);
  const pkg = readPackageJson(dir);
  const r = RUNTIME[runner];
  const setup = runner === 'pnpm' ? `${pnpmSetup(pkg)}\n${r.setup}` : r.setup;
  // Not Jest, Vitest or Bun: faf-taf-git can't read the output, and every run
  // would go red. Leave the step to the user, like an unknown language.
  const tests = readableJsRunner(pkg, runner)
    ? runTests(`${r.test} 2>&1 | tee test-output.txt`)
    : `      # TODO: faf-taf-git reads Jest, Vitest and Bun output, or JUnit XML.
      # Run your tests so they write one of those, and point test-output-file at it.
${runTests(`echo "TODO: your test command" 2>&1 | tee test-output.txt   # e.g. ${r.test} 2>&1 | tee test-output.txt`)}`;
  return `${setup}\n      - run: ${r.install}\n${tests}`;
}

interface Branch {
  name: string;
  /** Why faf isn't sure, when it isn't. */
  guess?: string;
}

/** The branch receipts are recorded for, without touching the network:
 *  origin's HEAD; else origin's main or master; else origin's only branch;
 *  else the current branch, said to be a guess; else main. */
function defaultBranch(dir: string): Branch {
  const git = (args: string[]) => {
    const r = spawnSync('git', args, { cwd: dir, encoding: 'utf-8' });
    return r.status === 0 ? r.stdout.trim() : '';
  };
  const head = git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).replace(/^origin\//, '');
  if (head) {return { name: head };}
  for (const b of ['main', 'master']) {
    if (git(['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${b}`])) {return { name: b };}
  }
  const remote = git(['for-each-ref', '--format=%(refname:lstrip=3)', 'refs/remotes/origin/']).split('\n')
    .filter((b) => b && b !== 'HEAD');
  if (remote.length === 1) {return { name: remote[0] };}
  const current = git(['branch', '--show-current']);
  if (current) {return { name: current, guess: 'origin/HEAD is not set, so this is the current branch' };}
  return { name: 'main', guess: 'no branch found' };
}

/** The name for `branches:`. GitHub reads `* ? + [ ] !` there as a pattern,
 *  so those are escaped, and such a name is quoted. */
const branchFilter = (name: string) =>
  /^[\w./-]+$/.test(name) ? name : `'${name.replace(/[*?+[\]!]/g, '\\$&')}'`;

// The recipe in the faf-taf-git README: a failed run gets a receipt too (the
// test step keeps going), only the default branch is recorded, and the job
// still goes red. No concurrency group: GitHub cancels a waiting run when a
// newer one joins, so that run would get no receipt. faf-taf-git retries a
// push that lost a race instead.
function buildTafWorkflow(dir: string, branch: string): string {
  const head =
    'name: TAF Receipts\n' +
    `# Prints a Test Receipt (.taf) for every run on ${branch}: proof over time.\n` +
    '# Written by `faf taf setup`. Docs: https://github.com/Wolfe-Jam/faf-taf-git\n' +
    `on:\n  push:\n    branches: [${branchFilter(branch)}]\n  pull_request:\n  workflow_dispatch:\n\n` +
    'jobs:\n  taf:\n    runs-on: ubuntu-latest\n' +
    '    permissions:\n      contents: write              # lets the action save receipts\n' +
    '    steps:\n' +
    '      - uses: actions/checkout@v7\n';

  let body: string;
  let report = 'test-output.txt';
  const lang = repoExists(dir, 'package.json') ? null : detectLanguage(dir);
  if (repoExists(dir, 'package.json')) {
    body = jsBody(dir);
  } else if (lang) {
    // faf-taf-git reads JUnit XML for these: each recipe writes one.
    const l = LANGUAGE[lang];
    report = l.report;
    body = `${l.setup}\n${runTests(l.test)}`;
  } else {
    // No runner faf knows. TAF is language-agnostic; leave a clear, honest placeholder.
    const placeholder = 'echo "TODO: your test command" 2>&1 | tee test-output.txt   # or any runner that writes JUnit XML';
    body = `      # TODO: set up your toolchain, then run your tests writing output to test-output.txt\n${runTests(placeholder)}`;
  }

  const receipt =
    '      - name: Print the receipt\n' +
    `        if: github.ref == 'refs/heads/${branch}' && github.event_name != 'pull_request'\n` +
    `        uses: ${FAF_TAF_GIT}\n` +
    '        with:\n' +
    `          test-output-file: ${report}\n` +
    '          target-branch: taf-receipts\n' +
    '      - name: Fail the job if the tests failed\n' +
    "        if: steps.tests.outcome == 'failure'\n" +
    '        run: exit 1\n';

  return head + body + receipt;
}

function tafSetup(options: TafOptions): void {
  const dir = process.cwd();
  const branch = defaultBranch(dir);
  // A name with a quote can't go in the receipt step's `if:`: never swap it silently.
  const usable = !/['\n\r]/.test(branch.name);
  const name = usable ? branch.name : 'main';
  const workflow = buildTafWorkflow(dir, name);
  const guess = usable ? branch.guess : `"${branch.name}" can't go in the workflow`;
  const note = guess ? dim(`  Records ${name} (${guess}). Check \`branches:\` before you commit.`) : '';
  const wfPath = join(dir, '.github', 'workflows', 'taf.yml');

  if (options.write) {
    if (existsSync(wfPath)) {
      console.error(`${bold('×')} .github/workflows/taf.yml already exists — not overwriting.`);
      console.error(dim(`  Add the faf-taf-git step to your existing workflow, or remove taf.yml and re-run.`));
      process.exitCode = 1; // refused: nothing written, and scripts can tell
      return; // non-destructive: refuse, never clobber
    }
    // Never through a linked .github or a taf.yml link (dangling included), and
    // never over a taf.yml that appeared meanwhile.
    makeDirInside(dir, join('.github', 'workflows'));
    safeWriteFile(wfPath, workflow, { root: dir, expect: null });
    console.log(`${fafCyan('◆')} taf  wrote .github/workflows/taf.yml`);
    console.log(dim('  commit + push → your first Test Receipt prints to the taf-receipts branch.'));
    if (note) {console.log(note);}
    return;
  }

  console.log(`${fafCyan('TAF setup')} ${dim('— Test Receipt Printer: proof over time')}\n`);
  console.log(dim('Run `faf taf setup --write` to create this, or paste it into a workflow:\n'));
  console.log(workflow);
  if (note) {console.log(`${note}\n`);}
  console.log(dim(`Then commit + push. One receipt appends to .taf (taf-receipts branch) per CI run on ${name}, red runs included.`));
}

// ── faf taf (default) — score snapshot ──────────────────────────────────────
/** Generate a TAF score snapshot of the current .faf — DEPRECATED, use `faf score --json`. */
function tafSnapshot(options: TafOptions): void {
  console.error(dim('note: `faf taf` (score snapshot) is deprecated — use `faf score --json`. (`faf taf setup` wires the Receipt Printer.)'));
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const yaml = readFafRaw(fafPath);
  const result = withKernel(fafPath, () => scoreFafYaml(yaml));

  const receipt = {
    taf_version: '1.0.0',
    generated: new Date().toISOString(),
    source: fafPath,
    project: data.project?.name ?? 'unknown',
    faf_version: data.faf_version ?? 'unknown',
    score: result.score,
    tier: result.tier.name,
    populated: result.populated,
    active: result.active,
    total: result.total,
    slots: result.slots,
  };

  const json = JSON.stringify(receipt, null, 2);

  if (options.output) {
    // An --output folder that is not there is one line: faf does not create it.
    refuseMissingOutputFolder(options.output);
    // Its own folder is the boundary. The snapshot carries faf's render hash
    // (`_meta["one.faf/render"]`); a file there is replaced only while it is
    // byte for byte what faf last wrote, and anything else is left as it is
    // unless --force.
    writeRendered(options.output, json, {
      root: dirname(resolve(options.output)),
      format: 'json',
      hasMark: isTafSnapshot,
      mark: 'TAF snapshot (`taf_version`)',
      force: options.force,
    });
    console.log(`${fafCyan('◆')} taf  receipt written to ${options.output}`);
  } else {
    console.log(json);
  }
}
