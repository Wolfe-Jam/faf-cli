import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
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
    expect(wf).toContain('Wolfe-Jam/faf-taf-git@v2.4.4');
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

  // Test tools (pytest plugins) often live in an extra; pip installs it (review N8).
  for (const [label, toml, want] of [
    ['a test extra', '[project]\nname = "x"\n\n[project.optional-dependencies]\ntest = ["pytest-cov"]\ndocs = ["mkdocs"]\n', 'pip install -e ".[test]"'],
    ['a dev extra', '[project.optional-dependencies]\ndev = ["pytest-mock"]\n', 'pip install -e ".[dev]"'],
    ['no extras', '[project]\nname = "x"\n', 'pip install -e .; fi'],
    ['a dev key in another table', '[tool.poetry.group.dev.dependencies]\ndev = "1"\n', 'pip install -e .; fi'],
  ] as const) {
    test(`Python, pyproject with ${label}: ${want}`, () => {
      writeFileSync(join(testDir, 'pyproject.toml'), toml);
      taf('setup', { write: true });
      expect(readFileSync(wfPath(), 'utf-8')).toContain(want);
    });
  }

  test('Python with poetry.lock, uv.lock or pdm.lock: a note to install dev dependencies with that tool', () => {
    for (const lock of ['poetry.lock', 'uv.lock', 'pdm.lock']) {
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      for (const l of ['poetry.lock', 'uv.lock', 'pdm.lock']) {rmSync(join(testDir, l), { force: true });}
      writeFileSync(join(testDir, 'pyproject.toml'), '[project]\nname = "x"\n');
      writeFileSync(join(testDir, lock), '');
      taf('setup', { write: true });
      expect(readFileSync(wfPath(), 'utf-8')).toContain(`# ${lock} found: install your dev dependencies with that tool here, before pytest.`);
    }
  });

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

  // node:test and mocha write JUnit XML when asked: the recipe asks.
  for (const [script, run] of [
    ['node --test', 'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=report.xml'],
    ['node --test "test/**/*.test.js"', 'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=report.xml "test/**/*.test.js"'],
    ['mocha', 'npx mocha --reporter xunit --reporter-option output=report.xml'],
    ['mocha --recursive', 'npx mocha --recursive --reporter xunit --reporter-option output=report.xml'],
  ] as const) {
    test(`JS, ${script}: runs it with a JUnit report and reads report.xml`, () => {
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'x', scripts: { test: script } }));
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('npm ci');
      expect(wf).toContain(run);
      expect(wf).not.toContain('TODO');
      const receipt = steps().find((s) => s.name === 'Print the receipt') as { with: Record<string, string> };
      expect(receipt.with['test-output-file']).toBe('report.xml');
    });
  }

  test('JS, node:test or mocha that pick their own reporter, or come after another command: the placeholder', () => {
    for (const script of ['node --test --test-reporter=tap', 'mocha --reporter dot', 'tsc && mocha', 'node --test && echo done']) {
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'x', scripts: { test: script } }));
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      expect(wf).toContain('TODO: your test command');
      expect(wf).toContain('node --test: --test-reporter=junit; mocha: --reporter xunit');
    }
  });

  // The test script decides, not the dependencies (review W3).
  for (const [label, pkg, step] of [
    ['jest installed, the script runs mocha', '{"devDependencies":{"jest":"1","mocha":"1"},"scripts":{"test":"mocha"}}', true],
    ['vitest installed, no test script', '{"devDependencies":{"vitest":"1"}}', false],
    ['jest-junit is not jest', '{"scripts":{"test":"node --test --test-reporter=jest-junit"}}', false],
    ['the script hands over to one that runs jest', '{"scripts":{"test":"npm run test:unit","test:unit":"jest --ci"}}', true],
    ['the script hands over to one that runs mocha', '{"devDependencies":{"jest":"1"},"scripts":{"test":"pnpm test:unit","test:unit":"mocha"}}', true],
    ['the script hands over to one that is not there; jest installed', '{"devDependencies":{"jest":"1"},"scripts":{"test":"npm run unit"}}', true],
    ['jest after another command', '{"scripts":{"test":"tsc && jest"}}', true],
  ] as const) {
    test(`JS, ${label}: ${step ? 'the test step' : 'the placeholder'}`, () => {
      writeFileSync(join(testDir, 'package.json'), pkg);
      taf('setup', { write: true });
      expect(readFileSync(wfPath(), 'utf-8').includes('TODO: your test command')).toBe(!step);
    });
  }

  test('pnpm: npm\'s packageManager, or devEngines without a pnpm version, is not a pnpm pin', () => {
    writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');
    for (const pkg of [
      { packageManager: 'npm@10.9.0' },
      { devEngines: { packageManager: { name: 'npm', version: '10.x' } } },
      { devEngines: { packageManager: { name: 'pnpm' } } },
    ]) {
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'x', scripts: { test: 'jest' }, ...pkg }));
      taf('setup', { write: true });
      const action = steps().find((st) => String(st.uses).startsWith('pnpm/action-setup')) as { with?: Record<string, unknown> };
      expect(action.with?.version).toBe(10);
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

  /** A bare origin with these branches, cloned into testDir (origin/HEAD removed when asked). */
  const cloneWith = (branches: string[], keepHead = true) => {
    const g = (cwd: string, ...a: string[]) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf-8' });
    const origin = `${testDir}-origin.git`;
    const seed = `${testDir}-seed`;
    g(tmpdir(), 'init', '-q', '--bare', '-b', branches[0], origin);
    g(tmpdir(), 'init', '-q', '-b', branches[0], seed);
    writeFileSync(join(seed, 'x'), 'x');
    g(seed, 'add', 'x');
    g(seed, 'commit', '-q', '-m', 'i');
    for (const b of branches) {g(seed, 'push', '-q', origin, `HEAD:refs/heads/${b}`);}
    g(testDir, 'clone', '-q', origin, '.');
    if (!keepHead) {g(testDir, 'remote', 'set-head', 'origin', '-d');}
    g(testDir, 'checkout', '-q', '-b', 'feat/x');
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    return () => { rmSync(origin, { recursive: true, force: true }); rmSync(seed, { recursive: true, force: true }); };
  };

  test('on a feature branch, origin/HEAD decides', () => {
    const done = cloneWith(['trunk']);
    taf('setup', { write: true });
    expect(readFileSync(wfPath(), 'utf-8')).toContain('branches: [trunk]');
    done();
  });

  // No origin/HEAD (a clone made with init + fetch never gets one): never the feature branch.
  for (const [branches, want] of [[['main', 'dev'], 'main'], [['master', 'dev'], 'master'], [['trunk'], 'trunk']] as const) {
    test(`no origin/HEAD, origin has ${branches.join(' + ')}: records ${want}`, () => {
      const done = cloneWith([...branches], false);
      taf('setup', { write: true });
      expect(readFileSync(wfPath(), 'utf-8')).toContain(`branches: [${want}]`);
      done();
    });
  }

  test('a guess is said out loud', () => {
    const done = cloneWith(['dev', 'trunk'], false); // no origin/HEAD, no main or master, two branches
    const log = spyOn(console, 'log').mockImplementation(() => {});
    taf('setup', {});
    const out = log.mock.calls.map((c) => String(c[0])).join('\n');
    log.mockRestore();
    expect(out).toContain('branches: [feat/x]');
    expect(out).toContain('Records feat/x (origin/HEAD is not set, so this is the current branch)');
    done();
  });

  test('a branch name GitHub reads as a pattern is escaped, never swapped for main', () => {
    spawnSync('git', ['init', '-q', '-b', 'release/v1+x'], { cwd: testDir });
    writeFileSync(join(testDir, 'package.json'), '{"name":"x"}');
    taf('setup', { write: true });
    const { parse } = require('yaml');
    const wf = parse(readFileSync(wfPath(), 'utf-8'));
    expect(wf.on.push.branches).toEqual(['release/v1\\+x']);
    expect(wf.jobs.taf.steps.find((st: { name?: string }) => st.name === 'Print the receipt').if).toContain("'refs/heads/release/v1+x'");
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
