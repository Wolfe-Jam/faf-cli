import { spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { findFafFile, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { makeDirInside, readRepoFile, repoExists, safeWriteFile } from '../core/safe-write.js';
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

const FAF_TAF_GIT = 'Wolfe-Jam/faf-taf-git@v2.4.6';

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
  const name = subcommand ?? '';
  if (subcommand === '' || !Object.hasOwn(TAF_FORMS, name)) {
    // A typo used to fall through to the deprecated snapshot without a word.
    console.error(`${bold('×')} Unknown: faf taf ${name}. Use ${bold('faf taf setup')} or ${bold('faf taf receipts')}.`);
    process.exit(1);
  }
  warnIgnored(name, options);
  TAF_FORMS[name](options);
}

/** The options each `faf taf` form reads; any other one it was given does nothing. */
const TAF_OPTIONS: Record<string, ReadonlyArray<keyof TafOptions>> = {
  setup: ['write'],
  receipts: ['limit', 'json', 'ref'],
  '': ['output', 'force'],
};

/** `faf taf <form>`: the bare form is the deprecated snapshot. */
const TAF_FORMS: Record<string, (options: TafOptions) => void> = {
  setup: (o) => tafSetup(o),
  receipts: (o) => tafReceipts(o),
  '': (o) => tafSnapshot(o),
};

/** Say so, instead of silently ignoring an option this form doesn't read. */
function warnIgnored(subcommand: string, options: TafOptions): void {
  const ignored = (Object.keys(options) as Array<keyof TafOptions>)
    .filter((k) => options[k] !== undefined && !TAF_OPTIONS[subcommand].includes(k));
  if (ignored.length === 0) {return;}
  const flags = ignored.map((k) => `--${k}`).join(', ');
  console.error(dim(`note: ${flags} ${ignored.length === 1 ? 'does' : 'do'} nothing with faf taf${subcommand ? ` ${subcommand}` : ''} (ignored)`));
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
// each recipe has its runner write one report (every runner checked end to end
// against faf-taf-git's parser). Checked in this order: Go first, as before;
// then Rust, Java (Maven, then Gradle) and .NET, whose build files say what the
// project is; Python last, because a requirements.txt or pyproject.toml is often
// only tooling in a repo written in another language.
type Language = 'go' | 'rust' | 'maven' | 'gradle' | 'dotnet' | 'python';

const GRADLE_FILES = ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'];
const DOTNET_FILE = /\.(?:sln|slnx|csproj|fsproj)$/i;

/** A solution or project file at the top of the repo (`*.sln`, `*.slnx`, `*.csproj`, `*.fsproj`). */
function hasDotnetProject(dir: string): boolean {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return false;
  }
  return entries.some((f) => DOTNET_FILE.test(f) && repoExists(dir, f));
}

function detectLanguage(dir: string): Language | null {
  if (repoExists(dir, 'go.mod')) {return 'go';}
  if (repoExists(dir, 'Cargo.toml')) {return 'rust';}
  if (repoExists(dir, 'pom.xml')) {return 'maven';}
  if (GRADLE_FILES.some((f) => repoExists(dir, f))) {return 'gradle';}
  if (hasDotnetProject(dir)) {return 'dotnet';}
  if (['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', 'pytest.ini'].some((f) => repoExists(dir, f))) {return 'python';}
  return null;
}

const TEST_NAMES = ['test', 'tests', 'dev'];

const TOML_KEY = String.raw`["']?([\w.-]+)["']?`;

/** The body of a pyproject.toml table, up to the next table header. */
function tableBody(toml: string, table: string): string | null {
  const name = table.split('.').map((p) => p.replace(/-/g, '\\-')).join(String.raw`\s*\.\s*`);
  const at = new RegExp(String.raw`^\[\s*${name}\s*\][ \t]*(?:#[^\r\n]*)?\r?$`, 'm').exec(toml);
  if (!at) {return null;}
  const rest = toml.slice(at.index + at[0].length);
  const end = rest.search(/^[ \t]*\[/m);
  return end === -1 ? rest : rest.slice(0, end);
}

/** The first of test, tests, dev that is a key in `keys`. */
const firstTestName = (keys: Iterable<string>) => {
  const found = new Set(keys);
  return TEST_NAMES.find((k) => found.has(k)) ?? null;
};

/** Keys at the start of each line of a table body. */
const lineKeys = (body: string) => [...body.matchAll(new RegExp(String.raw`^\s*${TOML_KEY}\s*=`, 'gm'))].map((m) => m[1]);

/** The test extra, written as its own table, as an inline table in [project]
 *  (`optional-dependencies = { test = [...] }`), or as dotted keys in [project]
 *  (`optional-dependencies.test = [...]`). */
function extraName(toml: string): string | null {
  const own = tableBody(toml, 'project.optional-dependencies');
  if (own !== null) {return firstTestName(lineKeys(own));}
  const project = tableBody(toml, 'project') ?? '';
  const inline = /^\s*optional-dependencies\s*=\s*\{([^}\r\n]*)\}/m.exec(project)?.[1] ?? '';
  const inlineKeys = [...inline.matchAll(new RegExp(String.raw`(?:^|,)\s*${TOML_KEY}\s*=`, 'g'))].map((m) => m[1]);
  const dotted = [...project.matchAll(new RegExp(String.raw`^\s*optional-dependencies\s*\.\s*${TOML_KEY}\s*=`, 'gm'))].map((m) => m[1]);
  return firstTestName([...inlineKeys, ...dotted]);
}

/** Where the test tools (pytest plugins) live: an extra (`.[test]`), or a
 *  PEP 735 dependency group (`pip install --group test`, pip 25.1+). */
function testDeps(dir: string): { extra: string | null; group: string | null } {
  if (!repoExists(dir, 'pyproject.toml')) {return { extra: null, group: null };}
  let toml: string;
  try {
    toml = readFileSync(join(dir, 'pyproject.toml'), 'utf-8');
  } catch {
    return { extra: null, group: null };
  }
  const groups = tableBody(toml, 'dependency-groups');
  return { extra: extraName(toml), group: groups === null ? null : firstTestName(lineKeys(groups)) };
}

/** Python setup: pip installs requirements and the package, with its test
 *  extra or dependency group when it has one. Poetry, uv and PDM keep dev
 *  dependencies their own way: the recipe says so rather than guessing their
 *  commands. */
function pythonSetup(dir: string): string {
  const { extra, group } = testDeps(dir);
  const tool = ['poetry.lock', 'uv.lock', 'pdm.lock'].find((f) => repoExists(dir, f));
  const note = tool ? `      # ${tool} found: install your dev dependencies with that tool here, before pytest.\n` : '';
  const groupLine = group ? `\n          pip install --group ${group}` : '';
  return `      - uses: actions/setup-python@v7
        with:
          python-version: '3.x'
${note}      - run: |
          python -m pip install --upgrade pip pytest
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f pyproject.toml ] || [ -f setup.py ]; then pip install -e ${extra ? `".[${extra}]"` : '.'}; fi${groupLine}`;
}

// ── Rust: cargo nextest ─────────────────────────────────────────────────────
// nextest writes JUnit only from a profile that asks for it. The recipe writes
// `.config/nextest.toml` with a `ci` profile when the repo has none, and never
// touches one the repo has. It leaves `#[ignore]` tests out of the report (a
// known nextest gap: faf-taf-git's fixtures README).
const NEXTEST = 'cargo-nextest@0.9.151';
const NEXTEST_CONFIG = '.config/nextest.toml';

/** True when the text has a `[profile.ci.junit]` table with a `path`. */
const hasCiJunit = (toml: string) => {
  const body = tableBody(toml, 'profile.ci.junit');
  return body !== null && /^\s*path\s*=/m.test(body);
};

function rustSetup(dir: string): string {
  const own = readRepoFile(dir, NEXTEST_CONFIG);
  const note = own !== null && !hasCiJunit(own)
    ? `      # ${NEXTEST_CONFIG} has no [profile.ci.junit]: add one with path = "junit.xml", or there is no report to read.\n`
    : '';
  return `      - uses: dtolnay/rust-toolchain@stable
      - uses: taiki-e/install-action@v2
        with:
          tool: ${NEXTEST}
${note}      - name: Configure the nextest JUnit report
        # Only when the repo has no ${NEXTEST_CONFIG}: yours is never overwritten.
        run: |
          if [ ! -e ${NEXTEST_CONFIG} ]; then
            mkdir -p .config
            printf '[profile.ci.junit]\\npath = "junit.xml"\\n' > ${NEXTEST_CONFIG}
          fi`;
}

// ── Java: Maven and Gradle ──────────────────────────────────────────────────
// Both write one JUnit file per test class. One class's file can read PASSED
// for a run that failed, so the recipe joins them into report.xml.
// Gradle's cache comes from setup-gradle, so setup-java caches Maven only.
const JAVA_SETUP = (cache?: 'maven') =>
  `      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '21'          # your project's Java version${cache ? `\n          cache: ${cache}` : ''}`;

/** A Maven build with `<modules>`: reports are in each module's target/. */
const mavenModules = (dir: string) => /<modules\s*>/.test(readRepoFile(dir, 'pom.xml') ?? '');

/** A Gradle build that includes subprojects: reports are in each one's build/. */
const gradleModules = (dir: string) =>
  ['settings.gradle', 'settings.gradle.kts'].some((f) => /^\s*include\b/m.test(readRepoFile(dir, f) ?? ''));

/** Join the per-class files into one report: one folder, or every module's. */
const joinReports = (folder: string, multi: boolean) =>
  multi
    ? `find . -path '*/${folder}/TEST-*.xml' -exec cat {} + > report.xml`
    : `cat ${folder}/TEST-*.xml > report.xml`;

const GRADLE_VERSION = '9.8.2';

function gradleSetup(dir: string): string {
  const wrapper = repoExists(dir, 'gradlew');
  return `${JAVA_SETUP()}
      - uses: gradle/actions/setup-gradle@v6${wrapper ? '' : `\n        with:\n          gradle-version: '${GRADLE_VERSION}'   # no gradlew in the repo`}`;
}

// ── .NET: dotnet test with JunitXml.TestLogger ──────────────────────────────
// `dotnet test` writes JUnit through the JunitXml.TestLogger package. The
// recipe adds it to each test project in CI (the projects that reference
// Microsoft.NET.Test.Sdk), so your repo needs no change and a first run gets
// a receipt; a project that already references it keeps its version. Each
// test assembly writes its own file, and the recipe joins them.
const JUNIT_LOGGER_VERSION = '8.1.0';

function dotnetSetup(dir: string): string {
  const version = repoExists(dir, 'global.json')
    ? 'global-json-file: global.json'
    : "dotnet-version: '10.0.x'      # your SDK version (or add a global.json)";
  return `      - uses: actions/setup-dotnet@v6
        with:
          ${version}
      - name: Add the JUnit logger to each test project
        # In CI only: your project files are not changed in the repo.
        run: |
          grep -rlE --include='*.csproj' --include='*.fsproj' 'Microsoft\\.NET\\.Test\\.Sdk' . | while read -r p; do
            grep -q 'JunitXml.TestLogger' "$p" || dotnet add "$p" package JunitXml.TestLogger --version ${JUNIT_LOGGER_VERSION}
          done`;
}

interface Recipe {
  setup: (dir: string) => string;
  test: (dir: string) => string;
  /** A step that turns the runner's files into the one report faf-taf-git reads. */
  join?: (dir: string) => string;
  report: string;
}

const LANGUAGE: Record<Language, Recipe> = {
  python: {
    setup: pythonSetup,
    test: () => 'pytest --junitxml=report.xml',
    report: 'report.xml',
  },
  go: {
    setup: () =>
      '      - uses: actions/setup-go@v7\n        with:\n          go-version-file: go.mod\n' +
      // setup-go sets GOTOOLCHAIN=local, and gotestsum needs Go 1.24: auto
      // fetches a newer toolchain for this install only.
      '      - run: GOTOOLCHAIN=auto go install gotest.tools/gotestsum@v1.13.0',
    test: () => 'gotestsum --junitfile report.xml -- ./...',
    report: 'report.xml',
  },
  rust: {
    setup: rustSetup,
    // --no-fail-fast: every test runs, so the receipt counts the whole suite.
    test: () => 'cargo nextest run --profile ci --workspace --no-fail-fast',
    report: 'target/nextest/ci/junit.xml',
  },
  maven: {
    setup: () => JAVA_SETUP('maven'),
    // --fail-at-end: a failing module doesn't stop the others' tests.
    test: (dir) => `${repoExists(dir, 'mvnw') ? './mvnw' : 'mvn'} -B --fail-at-end test`,
    join: (dir) => joinReports('target/surefire-reports', mavenModules(dir)),
    report: 'report.xml',
  },
  gradle: {
    setup: gradleSetup,
    // --continue: a failing subproject doesn't stop the others' tests.
    test: (dir) => `${repoExists(dir, 'gradlew') ? './gradlew' : 'gradle'} test --continue`,
    join: (dir) => joinReports('build/test-results/test', gradleModules(dir)),
    report: 'report.xml',
  },
  dotnet: {
    setup: dotnetSetup,
    test: () => 'dotnet test --logger "junit;LogFilePath=$GITHUB_WORKSPACE/junit-reports/{assembly}.{framework}.xml"',
    join: () => 'cat junit-reports/*.xml > report.xml',
    report: 'report.xml',
  },
};

/** The join step: runs after a red test run too (the test step keeps going). */
const joinStep = (cmd: string) =>
  '      - name: Join the reports into one file\n' +
  '        # One file per test class or assembly; one alone can read PASSED for a run that failed.\n' +
  `        run: ${cmd}\n`;

const runTests = (cmd: string) =>
  '      - name: Run tests\n' +
  '        id: tests\n' +
  '        continue-on-error: true    # keep going, so a failed run still gets a receipt\n' +
  '        run: |\n' +
  '          set -o pipefail\n' +
  `          ${cmd}\n`;

/** node:test and mocha print nothing faf-taf-git reads, but each can write
 *  JUnit XML. The recipe still runs the project's own test command, so
 *  `pretest` and `posttest` run: node:test takes its reporters from
 *  NODE_OPTIONS (through any hand-off); mocha takes them as arguments, so
 *  only when the `test` script is mocha itself. */
const NODE_TEST = /^\s*node\s+--test(?![\w-])[^;&|]*$/;
const MOCHA = /^\s*mocha(?![\w-])[^;&|]*$/;
const OWN_REPORTER = /--(?:test-)?reporter\b/;

function junitCommand(pkg: Record<string, unknown>, runner: Runner): string | null {
  const scripts = (pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {}) as Record<string, unknown>;
  const script = testCommand(scripts);
  // A script that already picks its own reporter keeps it: leave it to the user.
  if (typeof script !== 'string' || OWN_REPORTER.test(script)) {return null;}
  const test = RUNTIME[runner].test;
  if (NODE_TEST.test(script)) {
    return 'NODE_OPTIONS="--test-reporter=spec --test-reporter-destination=stdout ' +
      `--test-reporter=junit --test-reporter-destination=report.xml" ${test}`;
  }
  if (typeof scripts.test === 'string' && MOCHA.test(scripts.test)) {
    // npm needs `--` to hand arguments to the script; pnpm, yarn and bun pass them on.
    return `${test}${runner === 'npm' ? ' --' : ''} --reporter xunit --reporter-option output=report.xml`;
  }
  return null;
}

/** Setup, install and test steps for a repo with a package.json, and the
 *  file faf-taf-git reads. */
function jsBody(dir: string): { body: string; report: string } {
  const runner = detectRunner(dir);
  const pkg = readPackageJson(dir);
  const r = RUNTIME[runner];
  const setup = runner === 'pnpm' ? `${pnpmSetup(pkg)}\n${r.setup}` : r.setup;
  const junit = readableJsRunner(pkg, runner) ? null : junitCommand(pkg, runner);
  if (junit) {
    return {
      body: `${setup}\n      - run: ${r.install}\n      # Your test command, with a JUnit report added (faf-taf-git reads it).\n${
        junit.includes('xunit') ? '      # mocha writes only the report: failure details are in report.xml.\n' : ''}${runTests(junit)}`,
      report: 'report.xml',
    };
  }
  // Not Jest, Vitest or Bun: faf-taf-git can't read the output, and every run
  // would go red. Leave the step to the user, like an unknown language.
  const tests = readableJsRunner(pkg, runner)
    ? runTests(`${r.test} 2>&1 | tee test-output.txt`)
    : `      # TODO: faf-taf-git reads Jest, Vitest and Bun output, or JUnit XML
      # (node --test: --test-reporter=junit; mocha: --reporter xunit).
      # Run your tests so they write one of those, and point test-output-file at it.
${runTests(`echo "TODO: your test command" 2>&1 | tee test-output.txt   # e.g. ${r.test} 2>&1 | tee test-output.txt`)}`;
  return { body: `${setup}\n      - run: ${r.install}\n${tests}`, report: 'test-output.txt' };
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
    ({ body, report } = jsBody(dir));
  } else if (lang) {
    // faf-taf-git reads JUnit XML for these: each recipe writes one.
    const l = LANGUAGE[lang];
    report = l.report;
    body = `${l.setup(dir)}\n${runTests(l.test(dir))}${l.join ? joinStep(l.join(dir)) : ''}`;
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
  console.error(dim('note: `faf taf` (score snapshot) is deprecated — use `faf score --json`. (`faf taf setup` wires the Receipt Printer; `faf taf receipts` shows the receipts.)'));
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
