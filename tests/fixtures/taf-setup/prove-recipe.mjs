#!/usr/bin/env node
// Proves a `faf taf setup` recipe end to end, the way CI would run it:
//   node prove-recipe.mjs <lang> <project dir> <faf-taf-git dir>
//
// 1. The recipe's `uses:` steps (toolchain setup) must be the ones the CI job
//    `taf-recipes` ran for this language, with the same inputs: what CI set up
//    is what the recipe asks for.
// 2. Its `run:` steps run in order, in the project, with bash -e. The test step
//    keeps going when tests fail (continue-on-error), as in the recipe.
// 3. faf-taf-git's own parser (the npm package of the pinned version, the code
//    the Action runs) reads the report the receipt step names, and its counts
//    must match the runner's own summary line.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parse } from 'yaml';

const [lang, projectArg, tafGitArg] = process.argv.slice(2);
if (!lang || !projectArg || !tafGitArg) {
  console.error('usage: prove-recipe.mjs <lang> <project dir> <faf-taf-git dir>');
  process.exit(2);
}
const project = resolve(projectArg);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The fixture: 2 passing, 1 failing, 1 skipped. The runner's summary line, and
// the counts it gives. nextest leaves #[ignore] tests out of its JUnit file
// (a known gap): its receipt can't count the skip.
const RUNNERS = {
  rust: {
    summary: /(\d+) tests? run: (\d+) passed, (\d+) failed, (\d+) skipped/,
    counts: (m) => ({ passed: +m[2], failed: +m[3], skipped: +m[4] }),
    inReport: { skipped: false },
  },
  maven: {
    summary: /Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)\s*$/m,
    counts: (m) => ({ passed: +m[1] - +m[2] - +m[3] - +m[4], failed: +m[2] + +m[3], skipped: +m[4] }),
  },
  gradle: {
    summary: /(\d+) tests completed, (\d+) failed(?:, (\d+) skipped)?/,
    counts: (m) => ({ passed: +m[1] - +m[2] - +(m[3] ?? 0), failed: +m[2], skipped: +(m[3] ?? 0) }),
  },
  dotnet: {
    summary: /Failed:\s*(\d+), Passed:\s*(\d+), Skipped:\s*(\d+), Total:\s*(\d+)/,
    counts: (m) => ({ passed: +m[2], failed: +m[1], skipped: +m[3] }),
  },
};
const FIXTURE = { passed: 2, failed: 1, skipped: 1 };
const runner = RUNNERS[lang];
if (!runner) {
  console.error(`unknown language: ${lang}`);
  process.exit(2);
}

const fail = (msg) => {
  console.error(`::error::${lang}: ${msg}`);
  process.exit(1);
};

const workflow = parse(readFileSync(join(project, '.github', 'workflows', 'taf.yml'), 'utf-8'));
const steps = workflow.jobs.taf.steps;

// 1. Setup steps: the same actions, with the same inputs, as CI ran.
const ci = parse(readFileSync(join(repo, '.github', 'workflows', 'ci.yml'), 'utf-8'));
const ciSetup = ci.jobs['taf-recipes'].steps
  .filter((s) => s.uses && typeof s.if === 'string' && s.if.includes(`matrix.lang == '${lang}'`))
  .map((s) => ({ uses: s.uses, with: s.with ?? {} }));
const recipeSetup = steps
  .filter((s) => s.uses && !s.uses.startsWith('actions/checkout@') && !s.uses.startsWith('Wolfe-Jam/faf-taf-git@'))
  .map((s) => ({ uses: s.uses, with: s.with ?? {} }));
if (JSON.stringify(recipeSetup) !== JSON.stringify(ciSetup)) {
  fail(`the recipe's setup steps are not the ones CI ran.\nrecipe: ${JSON.stringify(recipeSetup)}\nci:     ${JSON.stringify(ciSetup)}`);
}
console.log(`setup steps match CI: ${recipeSetup.map((s) => s.uses).join(', ')}`);

// 2. The run steps, in order.
let log = '';
let testsFailed = false;
for (const step of steps) {
  if (!step.run || step.name === 'Fail the job if the tests failed') {continue;}
  console.log(`\n::group::${step.name ?? step.run.split('\n')[0]}`);
  const r = spawnSync('bash', ['-e', '-c', step.run], {
    cwd: project,
    encoding: 'utf-8',
    env: { ...process.env, GITHUB_WORKSPACE: project },
    maxBuffer: 64 * 1024 * 1024,
  });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  console.log('::endgroup::');
  if (step.id === 'tests') {
    // Runners colour their output in CI (nextest does): read the text, not the escapes.
    log = (r.stdout + r.stderr).replace(/\x1b\[[0-9;]*m/g, '');
    testsFailed = r.status !== 0;
    if (!step['continue-on-error']) {fail('the test step does not keep going on a red run');}
  } else if (r.status !== 0) {
    fail(`step "${step.name ?? step.run}" exited ${r.status}`);
  }
}
if (!testsFailed) {fail('the fixture has a failing test, but the test step passed');}

// 3. The receipt.
const receiptStep = steps.find((s) => s.name === 'Print the receipt');
const report = join(project, receiptStep.with['test-output-file']);
if (!existsSync(report)) {fail(`no report at ${receiptStep.with['test-output-file']}`);}
const require = createRequire(join(resolve(tafGitArg), 'package.json'));
const { parseTestOutput } = require('./dist/parsers/index.js');
const parsed = parseTestOutput(readFileSync(report, 'utf-8'));
if (!parsed) {fail(`faf-taf-git could not read ${receiptStep.with['test-output-file']}`);}
const receipt = { passed: parsed.passed, failed: parsed.failed, skipped: parsed.skipped ?? 0 };

const m = runner.summary.exec(log);
if (!m) {fail(`no runner summary line in the test output (${runner.summary})`);}
const own = runner.counts(m);

const row = (label, c) => `${label.padEnd(8)} passed ${c.passed} · failed ${c.failed} · skipped ${c.skipped}`;
console.log(`\nrunner:  ${m[0].trim()}`);
console.log(row('runner', own));
console.log(row('receipt', receipt), `· total ${parsed.total} · ${parsed.result}`);

for (const k of ['passed', 'failed', 'skipped']) {
  if (own[k] !== FIXTURE[k]) {fail(`the runner counted ${own[k]} ${k}; the fixture has ${FIXTURE[k]}`);}
  const expected = runner.inReport?.[k] === false ? 0 : own[k];
  if (receipt[k] !== expected) {fail(`the receipt counted ${receipt[k]} ${k}; the runner counted ${own[k]}`);}
}
if (parsed.result !== 'FAILED') {fail(`the receipt reads ${parsed.result} for a run that failed`);}
if (runner.inReport?.skipped === false) {
  console.log('known gap: nextest leaves #[ignore] tests out of its JUnit file, so the receipt has no skip.');
}

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  writeFileSync(summary, `### ${lang}\n\n| | passed | failed | skipped | result |\n|---|---|---|---|---|\n` +
    `| runner (\`${m[0].trim()}\`) | ${own.passed} | ${own.failed} | ${own.skipped} | failed |\n` +
    `| receipt (faf-taf-git) | ${receipt.passed} | ${receipt.failed} | ${receipt.skipped} | ${parsed.result} |\n`, { flag: 'a' });
}
console.log(`\n${lang}: the receipt matches the runner.`);
