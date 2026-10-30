import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { findFafFile, readFaf, readFafRaw, withKernel } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { makeDirInside, repoExists, safeWriteFile } from '../core/safe-write.js';
import { writeRendered } from '../core/render-hash.js';
import { refuseMissingOutputFolder } from '../core/refusal.js';
import { fafCyan, dim, bold } from '../ui/colors.js';

export interface TafOptions {
  output?: string;
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

const FAF_TAF_GIT = 'Wolfe-Jam/faf-taf-git@v2.4.2';

/**
 * `faf taf [subcommand]`
 *   (none)  — score snapshot — DEPRECATED, folded into `faf score --json` (alias kept one release)
 *   setup   — write/print the CI step that activates the TAF Receipt Printer
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

const RUNTIME: Record<Runner, { setup: string; install: string; test: string }> = {
  bun: {
    setup: '      - uses: oven-sh/setup-bun@v2',
    install: 'bun install --frozen-lockfile',
    test: 'bun run test',
  },
  pnpm: {
    setup: "      - uses: pnpm/action-setup@v4\n      - uses: actions/setup-node@v6\n        with:\n          node-version: '24.x'",
    install: 'pnpm install --frozen-lockfile',
    test: 'pnpm test',
  },
  yarn: {
    setup: "      - uses: actions/setup-node@v6\n        with:\n          node-version: '24.x'",
    install: 'yarn install --frozen-lockfile',
    test: 'yarn test',
  },
  npm: {
    setup: "      - uses: actions/setup-node@v6\n        with:\n          node-version: '24.x'",
    install: 'npm ci',
    test: 'npm test',
  },
};

// The recipe in the faf-taf-git README: a failed run gets a receipt too (the
// test step keeps going), only main is recorded, the job still goes red, and
// one run at a time per branch so two receipts never race for the push.
function buildTafWorkflow(dir: string): string {
  const head =
    'name: TAF Receipts\n' +
    '# Prints a Test Receipt (.taf) for every run on main: proof over time.\n' +
    '# Written by `faf taf setup`. Docs: https://github.com/Wolfe-Jam/faf-taf-git\n' +
    'on:\n  push:\n    branches: [main]\n  pull_request:\n  workflow_dispatch:\n\n' +
    'concurrency:\n  group: taf-${{ github.ref }}   # one run at a time per branch, so receipts never collide\n\n' +
    'jobs:\n  taf:\n    runs-on: ubuntu-latest\n' +
    '    permissions:\n      contents: write              # lets the action save receipts\n' +
    '    steps:\n' +
    '      - uses: actions/checkout@v6\n';

  const runTests = (cmd: string) =>
    '      - name: Run tests\n' +
    '        id: tests\n' +
    '        continue-on-error: true    # keep going, so a failed run still gets a receipt\n' +
    '        run: |\n' +
    '          set -o pipefail\n' +
    `          ${cmd}\n`;

  let body: string;
  if (repoExists(dir, 'package.json')) {
    const r = RUNTIME[detectRunner(dir)];
    body = `${r.setup}\n      - run: ${r.install}\n${runTests(`${r.test} 2>&1 | tee test-output.txt`)}`;
  } else {
    // Non-JS repo — TAF is language-agnostic; leave a clear, honest placeholder.
    // pytest, cargo, Go and Java can write JUnit XML, which faf-taf-git reads.
    const placeholder = 'echo "TODO: your test command" 2>&1 | tee test-output.txt   # e.g. pytest -q 2>&1 | tee test-output.txt';
    body = `      # TODO: set up your toolchain, then run your tests writing output to test-output.txt\n${runTests(placeholder)}`;
  }

  const receipt =
    '      - name: Print the receipt\n' +
    "        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'\n" +
    `        uses: ${FAF_TAF_GIT}\n` +
    '        with:\n' +
    '          test-output-file: test-output.txt\n' +
    '          target-branch: taf-receipts\n' +
    '      - name: Fail the job if the tests failed\n' +
    "        if: steps.tests.outcome == 'failure'\n" +
    '        run: exit 1\n';

  return head + body + receipt;
}

function tafSetup(options: TafOptions): void {
  const dir = process.cwd();
  const workflow = buildTafWorkflow(dir);
  const wfPath = join(dir, '.github', 'workflows', 'taf.yml');

  if (options.write) {
    if (existsSync(wfPath)) {
      console.error(`${bold('×')} .github/workflows/taf.yml already exists — not overwriting.`);
      console.error(dim(`  Add the faf-taf-git step to your existing workflow, or remove taf.yml and re-run.`));
      return; // non-destructive: refuse, never clobber
    }
    // Never through a linked .github or a taf.yml link (dangling included), and
    // never over a taf.yml that appeared meanwhile.
    makeDirInside(dir, join('.github', 'workflows'));
    safeWriteFile(wfPath, workflow, { root: dir, expect: null });
    console.log(`${fafCyan('◆')} taf  wrote .github/workflows/taf.yml`);
    console.log(dim('  commit + push → your first Test Receipt prints to the taf-receipts branch.'));
    return;
  }

  console.log(`${fafCyan('TAF setup')} ${dim('— Test Receipt Printer: proof over time')}\n`);
  console.log(dim('Run `faf taf setup --write` to create this, or paste it into a workflow:\n'));
  console.log(workflow);
  console.log(dim('Then commit + push. One receipt appends to .taf (taf-receipts branch) per CI run on main, red runs included.'));
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
