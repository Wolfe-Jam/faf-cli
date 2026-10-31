import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * `faf taf setup` — the activation bridge for the TAF Receipt Printer.
 * Locks: writes a wired workflow, detects the runner, and is NON-DESTRUCTIVE
 * (never clobbers an existing taf.yml) — and needs no .faf to run.
 */
describe('PIT: faf taf setup', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `taf-setup-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  const taf = (sub: string, opts: Record<string, unknown> = {}) => {
    const { tafCommand } = require('../../src/commands/taf.js');
    tafCommand(sub, opts);
  };
  const wfPath = () => join(testDir, '.github', 'workflows', 'taf.yml');

  // faf-cli's own CI pin. Dependabot bumps it on each faf-taf-git release; the
  // pin `faf taf setup` gives users is a string Dependabot can't see.
  const ciPin = () => {
    const ci = readFileSync(join(import.meta.dir, '..', '..', '.github', 'workflows', 'ci.yml'), 'utf-8');
    return ci.match(/Wolfe-Jam\/faf-taf-git@v[\d.]+/)?.[0];
  };

  test('setup pins the same faf-taf-git version as faf-cli CI (no drift)', () => {
    const pin = ciPin();
    expect(pin).toBeDefined();
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","scripts":{"test":"echo ok"}}');
    taf('setup', { write: true });
    // Red here after a Dependabot bump? Update FAF_TAF_GIT in src/commands/taf.ts.
    expect(readFileSync(wfPath(), 'utf-8')).toContain(pin!);
  });

  test('--write creates a workflow wired to faf-taf-git + the taf-receipts branch', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","scripts":{"test":"echo ok"}}');
    taf('setup', { write: true });
    expect(existsSync(wfPath())).toBe(true);
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('Wolfe-Jam/faf-taf-git@v2.4.3');
    expect(wf).toContain('test-output.txt');
    expect(wf).toContain('target-branch: taf-receipts');
  });

  test('the recipe: red runs get a receipt, only main is recorded, the job still goes red', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","scripts":{"test":"echo ok"}}');
    taf('setup', { write: true });
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('continue-on-error: true');
    expect(wf).toContain('set -o pipefail');
    expect(wf).toContain("if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'");
    expect(wf).toContain("if: steps.tests.outcome == 'failure'");
    expect(wf).toContain('contents: write');
    // No concurrency group: GitHub cancels a waiting run when a newer one
    // joins, and that run gets no receipt. faf-taf-git retries the push instead.
    expect(wf).not.toContain('concurrency');
    expect(wf).not.toContain('cannot be gamed');
  });

  test('the workflow is valid YAML with the steps in order', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', { write: true });
    const { parse } = require('yaml');
    const steps = parse(readFileSync(wfPath(), 'utf-8')).jobs.taf.steps.map((s: { name?: string }) => s.name).filter(Boolean);
    expect(steps).toEqual(['Run tests', 'Print the receipt', 'Fail the job if the tests failed']);
  });

  test('detects the bun runner from bun.lockb', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    writeFileSync(join(testDir, 'bun.lockb'), '');
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toContain('oven-sh/setup-bun');
  });

  test('defaults to npm when no lockfile is present', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', { write: true });
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('npm ci');
    expect(wf).toContain('actions/setup-node');
  });

  test('non-JS repo (no package.json) still emits a workflow with a test placeholder', () => {
    taf('setup', { write: true });
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('Wolfe-Jam/faf-taf-git');
    expect(wf).toContain('TODO: your test command');
  });

  test('NON-DESTRUCTIVE — refuses to overwrite an existing taf.yml', () => {
    mkdirSync(join(testDir, '.github', 'workflows'), { recursive: true });
    writeFileSync(wfPath(), 'name: my own workflow\n');
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toBe('name: my own workflow\n'); // untouched
    expect(process.exitCode).toBe(1); // refused, so scripts and CI can tell nothing was written
    process.exitCode = 0;
  });

  test('a fresh --write leaves the exit code alone', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    process.exitCode = 0;
    taf('setup', { write: true });
    expect(process.exitCode).toBe(0);
  });

  // Not JavaScript: faf-taf-git reads JUnit XML, so each recipe writes a report
  // and points the receipt step at it.
  const steps = () => {
    const { parse } = require('yaml');
    return parse(readFileSync(wfPath(), 'utf-8')).jobs.taf.steps as Array<Record<string, unknown>>;
  };

  for (const marker of ['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', 'pytest.ini']) {
    test(`Python (${marker}): pytest writes JUnit XML and the receipt reads it`, () => {
      writeFileSync(join(testDir, marker), '');
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('actions/setup-python@v7');
      expect(wf).toContain('pip install --upgrade pip pytest');
      expect(wf).toContain('pytest --junitxml=report.xml');
      expect(wf).not.toContain('TODO');
      const receipt = steps().find((s) => s.name === 'Print the receipt') as { with: Record<string, string> };
      expect(receipt.with['test-output-file']).toBe('report.xml');
    });
  }

  test('Go (go.mod): gotestsum writes JUnit XML and the receipt reads it', () => {
    writeFileSync(join(testDir, 'go.mod'), 'module x\n');
    taf('setup', { write: true });
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('actions/setup-go@v7');
    expect(wf).toContain('go-version-file: go.mod');
    // setup-go pins the go.mod toolchain (GOTOOLCHAIN=local) and gotestsum
    // needs Go 1.24: the install fetches a newer one, and the version is pinned.
    expect(wf).toContain('GOTOOLCHAIN=auto go install gotest.tools/gotestsum@v1.13.0');
    expect(wf).not.toContain('@latest');
    expect(wf).toContain('gotestsum --junitfile report.xml -- ./...');
    const receipt = steps().find((s) => s.name === 'Print the receipt') as { with: Record<string, string> };
    expect(receipt.with['test-output-file']).toBe('report.xml');
  });

  test('Python and Go recipes keep the red-run recipe and are valid YAML', () => {
    writeFileSync(join(testDir, 'go.mod'), 'module x\n');
    taf('setup', { write: true });
    const names = steps().map((s) => s.name).filter(Boolean);
    expect(names).toEqual(['Run tests', 'Print the receipt', 'Fail the job if the tests failed']);
    expect(readFileSync(wfPath(), 'utf-8')).toContain('continue-on-error: true');
  });

  test('package.json wins over a Python marker (a JS repo with a requirements.txt)', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    writeFileSync(join(testDir, 'requirements.txt'), '');
    taf('setup', { write: true });
    const wf = readFileSync(wfPath(), 'utf-8');
    expect(wf).toContain('npm ci');
    expect(wf).not.toContain('pytest');
  });

  test('Rust (Cargo.toml) keeps the placeholder: no recipe faf has checked yet', () => {
    writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "x"\n');
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toContain('TODO: your test command');
  });

  // faf-taf-git reads Jest, Vitest and Bun output. Any other JS runner gets the
  // placeholder, never a step whose output can't be read (red on every run).
  for (const [label, pkg] of [
    ['jest in devDependencies', '{"name":"x","devDependencies":{"jest":"^30.0.0"},"scripts":{"test":"jest"}}'],
    ['vitest in the test script', '{"name":"x","scripts":{"test":"vitest run"}}'],
  ] as const) {
    test(`JS, ${label}: runs the tests into test-output.txt`, () => {
      writeFileSync(join(testDir, 'package.json'), pkg);
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('npm test 2>&1 | tee test-output.txt');
      expect(wf).not.toContain('TODO');
    });
  }

  test('JS, bun test with bun: runs the tests', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","scripts":{"test":"bun test"}}');
    writeFileSync(join(testDir, 'bun.lock'), '');
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toContain('bun run test 2>&1 | tee test-output.txt');
  });

  test('JS, node:test or mocha: the placeholder, not a step faf-taf-git cannot read', () => {
    for (const script of ['node --test', 'mocha']) {
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'x', scripts: { test: script } }));
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('npm ci');
      expect(wf).toContain('TODO: your test command');
      expect(wf).toContain('faf-taf-git reads Jest, Vitest and Bun output, or JUnit XML');
    }
  });

  test('pnpm: a version for the action unless package.json pins one', () => {
    writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","scripts":{"test":"vitest"}}');
    taf('setup', { write: true });
    const loose = steps().find((st) => String(st.uses).startsWith('pnpm/action-setup')) as { uses: string; with?: Record<string, unknown> };
    expect(loose.uses).toBe('pnpm/action-setup@v6');
    expect(loose.with?.version).toBe(10);

    rmSync(join(testDir, '.github'), { recursive: true, force: true });
    writeFileSync(join(testDir, 'package.json'), '{"name":"x","packageManager":"pnpm@10.4.1","scripts":{"test":"vitest"}}');
    taf('setup', { write: true });
    const pinned = steps().find((st) => String(st.uses).startsWith('pnpm/action-setup')) as { with?: unknown };
    expect(pinned.with).toBeUndefined(); // two versions would fail the action
  });

  test('records the default branch, not always main', () => {
    spawnSync('git', ['init', '-q', '-b', 'trunk'], { cwd: testDir });
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', { write: true });
    const { parse } = require('yaml');
    const wf = parse(readFileSync(wfPath(), 'utf-8'));
    expect(wf.on.push.branches).toEqual(['trunk']);
    expect(wf.jobs.taf.steps.find((st: { name?: string }) => st.name === 'Print the receipt').if).toContain("'refs/heads/trunk'");
  });

  test('outside git it records main', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toContain('branches: [main]');
  });

  test('every action in every recipe is on its current major', () => {
    const recipes: Array<[string, string]> = [['package.json', '{"name":"x"}'], ['go.mod', 'module x\n'], ['pyproject.toml', '']];
    for (const [file, body] of recipes) {
      // Never remove testDir itself: it is the cwd, and Windows refuses that.
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, file), body);
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      rmSync(join(testDir, file));
      expect(wf).toContain('actions/checkout@v7');
      expect(wf).not.toMatch(/actions\/[a-z-]+@v6/);
    }
  });

  test('default (no --write) prints only — writes nothing', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', {});
    expect(existsSync(wfPath())).toBe(false);
  });

  test('needs no project.faf to run (TAF is FAF-independent)', () => {
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    expect(() => taf('setup', { write: true })).not.toThrow();
    expect(existsSync(wfPath())).toBe(true);
  });
});
