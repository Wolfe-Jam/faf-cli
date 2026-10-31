import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
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
    expect(wf).toContain('Wolfe-Jam/faf-taf-git@v2.4.2');
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
    expect(wf).toContain('group: taf-${{ github.ref }}');
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

  for (const marker of ['pyproject.toml', 'setup.py', 'requirements.txt', 'pytest.ini']) {
    test(`Python (${marker}): pytest writes JUnit XML and the receipt reads it`, () => {
      writeFileSync(join(testDir, marker), '');
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('actions/setup-python@v6');
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
    expect(wf).toContain('actions/setup-go@v6');
    expect(wf).toContain('go-version-file: go.mod');
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
