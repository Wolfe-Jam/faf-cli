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
    expect(wf).toContain('Wolfe-Jam/faf-taf-git@v2.4.6');
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
    ['a quoted extra name', '[project.optional-dependencies]\n"test" = ["pytest-cov"]\n', 'pip install -e ".[test]"'],
    ['a comment on the table header', '[project.optional-dependencies] # the test tools\ntest = ["pytest-cov"]\n', 'pip install -e ".[test]"'],
    ['a PEP 735 test group', '[project]\nname = "x"\n\n[dependency-groups]\ntest = ["pytest-cov"]\n', 'pip install --group test'],
    ['CRLF line endings', '[project.optional-dependencies]\r\ntest = ["pytest-cov"]\r\n', 'pip install -e ".[test]"'],
    ['a spaced header', '[ project.optional-dependencies ]\ntest = ["pytest-cov"]\n', 'pip install -e ".[test]"'],
    ['an inline table in [project]', '[project]\nname = "x"\noptional-dependencies = { docs = ["a"], test = ["pytest-cov"] }\n', 'pip install -e ".[test]"'],
    ['a dotted key in [project]', '[project]\nname = "x"\noptional-dependencies.test = ["pytest-cov"]\n', 'pip install -e ".[test]"'],
    ['a multi-line array, then a later table with a test key', '[project.optional-dependencies]\ndocs = [\n  "mkdocs",\n]\n\n[tool.x]\ntest = 1\n', 'pip install -e .; fi'],
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

  const wf = () => readFileSync(wfPath(), 'utf-8');
  const receiptFile = () => (steps().find((s) => s.name === 'Print the receipt') as { with: Record<string, string> }).with['test-output-file'];
  const stepNamed = (name: string) => steps().find((s) => s.name === name) as Record<string, unknown> | undefined;

  // ── Rust: cargo nextest ──
  test('Rust (Cargo.toml): the exact nextest recipe, and the receipt reads its JUnit file', () => {
    writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "x"\n');
    taf('setup', { write: true });
    expect(wf()).toContain(`      - uses: actions/checkout@v7
      - uses: dtolnay/rust-toolchain@stable
      - uses: taiki-e/install-action@v2
        with:
          tool: cargo-nextest@0.9.151
      - name: Configure the nextest JUnit report
        # Only when the repo has no .config/nextest.toml: yours is never overwritten.
        run: |
          if [ ! -e .config/nextest.toml ]; then
            mkdir -p .config
            printf '[profile.ci.junit]\\npath = "junit.xml"\\n' > .config/nextest.toml
          fi
      - name: Run tests
        id: tests
        continue-on-error: true    # keep going, so a failed run still gets a receipt
        run: |
          set -o pipefail
          cargo nextest run --profile ci --workspace --no-fail-fast
      - name: Print the receipt
`);
    expect(receiptFile()).toBe('target/nextest/ci/junit.xml');
    expect(wf()).not.toContain('TODO');
    expect(stepNamed('Join the reports into one file')).toBeUndefined();
  });

  test('Rust: the config step writes a ci profile with a JUnit path, and never over a nextest.toml', () => {
    writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "x"\n');
    taf('setup', { write: true });
    const run = stepNamed('Configure the nextest JUnit report')!.run as string;
    // Run the step itself: no config → it writes one; a config → left byte for byte.
    const sh = (cwd: string) => spawnSync('bash', ['-e', '-c', run], { cwd, encoding: 'utf-8' });
    const fresh = join(testDir, 'fresh');
    mkdirSync(fresh);
    expect(sh(fresh).status).toBe(0);
    expect(readFileSync(join(fresh, '.config', 'nextest.toml'), 'utf-8')).toBe('[profile.ci.junit]\npath = "junit.xml"\n');
    const own = join(testDir, 'own');
    mkdirSync(join(own, '.config'), { recursive: true });
    const mine = '[profile.default]\nretries = 2\n\n[profile.ci.junit]\npath = "junit.xml"\n';
    writeFileSync(join(own, '.config', 'nextest.toml'), mine);
    expect(sh(own).status).toBe(0);
    expect(readFileSync(join(own, '.config', 'nextest.toml'), 'utf-8')).toBe(mine);
  });

  test('Rust: a nextest.toml without [profile.ci.junit] gets a note, not a rewrite', () => {
    writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "x"\n');
    mkdirSync(join(testDir, '.config'));
    writeFileSync(join(testDir, '.config', 'nextest.toml'), '[profile.default]\nretries = 2\n');
    taf('setup', { write: true });
    expect(wf()).toContain('# .config/nextest.toml has no [profile.ci.junit]: add one with path = "junit.xml", or there is no report to read.');
    expect(readFileSync(join(testDir, '.config', 'nextest.toml'), 'utf-8')).toBe('[profile.default]\nretries = 2\n');
  });

  test('Rust: a nextest.toml with [profile.ci.junit] gets no note', () => {
    writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "x"\n');
    mkdirSync(join(testDir, '.config'));
    writeFileSync(join(testDir, '.config', 'nextest.toml'), '[profile.ci.junit]\npath = "junit.xml"\n');
    taf('setup', { write: true });
    expect(wf()).not.toContain('has no [profile.ci.junit]');
  });

  // ── Java: Maven ──
  const javaSetup = (cache: boolean) => `      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '21'          # your project's Java version${cache ? '\n          cache: maven' : ''}
`;

  test('Maven (pom.xml): mvn test, then the per-class files are joined into report.xml', () => {
    writeFileSync(join(testDir, 'pom.xml'), '<project></project>');
    taf('setup', { write: true });
    expect(wf()).toContain(`      - uses: actions/checkout@v7\n${javaSetup(true)}      - name: Run tests`);
    expect(wf()).toContain('          mvn -B --fail-at-end test\n');
    expect(wf()).toContain(`      - name: Join the reports into one file
        # One file per test class or assembly; one alone can read PASSED for a run that failed.
        run: cat target/surefire-reports/TEST-*.xml > report.xml
      - name: Print the receipt`);
    expect(receiptFile()).toBe('report.xml');
    expect(steps().map((s) => s.name).filter(Boolean)).toEqual(['Run tests', 'Join the reports into one file', 'Print the receipt', 'Fail the job if the tests failed']);
  });

  test('Maven with the wrapper (mvnw): ./mvnw', () => {
    writeFileSync(join(testDir, 'pom.xml'), '<project></project>');
    writeFileSync(join(testDir, 'mvnw'), '#!/bin/sh\n');
    taf('setup', { write: true });
    expect(wf()).toContain('          ./mvnw -B --fail-at-end test\n');
    expect(wf()).not.toMatch(/^\s+mvn /m);
  });

  test('Maven with <modules>: every module\'s reports are joined', () => {
    writeFileSync(join(testDir, 'pom.xml'), '<project><modules><module>a</module></modules></project>');
    taf('setup', { write: true });
    expect(wf()).toContain("run: find . -path '*/target/surefire-reports/TEST-*.xml' -exec cat {} + > report.xml");
  });

  // ── Java: Gradle ──
  for (const marker of ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts']) {
    test(`Gradle (${marker}) without a wrapper: setup-gradle installs Gradle, gradle test, the join`, () => {
      writeFileSync(join(testDir, marker), '');
      taf('setup', { write: true });
      expect(wf()).toContain(`      - uses: actions/checkout@v7\n${javaSetup(false)}      - uses: gradle/actions/setup-gradle@v6
        with:
          gradle-version: '9.8.2'   # no gradlew in the repo
      - name: Run tests`);
      expect(wf()).toContain('          gradle test --continue\n');
      expect(wf()).toContain('        run: cat build/test-results/test/TEST-*.xml > report.xml\n');
      expect(receiptFile()).toBe('report.xml');
    });
  }

  test('Gradle with the wrapper (gradlew): ./gradlew, and setup-gradle installs nothing', () => {
    writeFileSync(join(testDir, 'build.gradle.kts'), '');
    writeFileSync(join(testDir, 'gradlew'), '#!/bin/sh\n');
    taf('setup', { write: true });
    expect(wf()).toContain('      - uses: gradle/actions/setup-gradle@v6\n      - name: Run tests');
    expect(wf()).toContain('          ./gradlew test --continue\n');
    expect(wf()).not.toContain('gradle-version');
  });

  test('Gradle with subprojects (include in settings): every subproject\'s reports are joined', () => {
    writeFileSync(join(testDir, 'settings.gradle.kts'), 'rootProject.name = "x"\ninclude("app", "lib")\n');
    taf('setup', { write: true });
    expect(wf()).toContain("run: find . -path '*/build/test-results/test/TEST-*.xml' -exec cat {} + > report.xml");
  });

  // ── .NET ──
  for (const marker of ['App.sln', 'App.slnx', 'App.csproj', 'App.fsproj']) {
    test(`.NET (${marker}): the JUnit logger is added in CI, dotnet test writes one file per assembly, joined`, () => {
      writeFileSync(join(testDir, marker), '');
      taf('setup', { write: true });
      expect(wf()).toContain(`      - uses: actions/checkout@v7
      - uses: actions/setup-dotnet@v6
        with:
          dotnet-version: '10.0.x'      # your SDK version (or add a global.json)
      - name: Add the JUnit logger to each test project
        # In CI only: your project files are not changed in the repo.
        run: |
          grep -rlE --include='*.csproj' --include='*.fsproj' 'Microsoft\\.NET\\.Test\\.Sdk' . | while read -r p; do
            grep -q 'JunitXml.TestLogger' "$p" || dotnet add "$p" package JunitXml.TestLogger --version 8.1.0
          done
      - name: Run tests`);
      expect(wf()).toContain('          dotnet test --logger "junit;LogFilePath=$GITHUB_WORKSPACE/junit-reports/{assembly}.{framework}.xml"\n');
      expect(wf()).toContain('        run: cat junit-reports/*.xml > report.xml\n');
      expect(receiptFile()).toBe('report.xml');
    });
  }

  test('.NET with global.json: setup-dotnet reads the SDK version from it', () => {
    writeFileSync(join(testDir, 'App.sln'), '');
    writeFileSync(join(testDir, 'global.json'), '{"sdk":{"version":"8.0.100"}}');
    taf('setup', { write: true });
    expect(wf()).toContain('          global-json-file: global.json\n');
    expect(wf()).not.toContain('dotnet-version');
  });

  test('.NET: the logger step adds the package only to test projects without it', () => {
    writeFileSync(join(testDir, 'App.sln'), '');
    taf('setup', { write: true });
    const run = stepNamed('Add the JUnit logger to each test project')!.run as string;
    for (const [rel, body] of [
      ['src/App/App.csproj', '<Project><ItemGroup><PackageReference Include="Newtonsoft.Json" /></ItemGroup></Project>'],
      ['tests/A.Tests/A.Tests.csproj', '<Project><ItemGroup><PackageReference Include="Microsoft.NET.Test.Sdk" /></ItemGroup></Project>'],
      ['tests/B.Tests/B.Tests.fsproj', '<Project><ItemGroup><PackageReference Include="Microsoft.NET.Test.Sdk" /><PackageReference Include="JunitXml.TestLogger" Version="7.0.0" /></ItemGroup></Project>'],
    ]) {
      mkdirSync(join(testDir, rel, '..'), { recursive: true });
      writeFileSync(join(testDir, rel), body);
    }
    // A stand-in `dotnet` records what the step asks it to add.
    const bin = join(testDir, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'dotnet'), '#!/bin/sh\necho "$@" >> "$DOTNET_LOG"\n', { mode: 0o755 });
    const log = join(testDir, 'dotnet.log');
    const r = spawnSync('bash', ['-e', '-c', run], { cwd: testDir, encoding: 'utf-8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, DOTNET_LOG: log } });
    expect(r.status).toBe(0);
    expect(readFileSync(log, 'utf-8')).toBe('add ./tests/A.Tests/A.Tests.csproj package JunitXml.TestLogger --version 8.1.0\n');
  });

  test('.NET: a solution only in a subfolder is not detected (top-level files only)', () => {
    mkdirSync(join(testDir, 'src'));
    writeFileSync(join(testDir, 'src', 'App.sln'), '');
    taf('setup', { write: true });
    expect(wf()).toContain('TODO: your test command');
  });

  // ── Detection order ──
  for (const [label, files, want] of [
    ['a Rust repo with a requirements.txt is Rust', ['Cargo.toml', 'requirements.txt'], 'cargo nextest run'],
    ['a Rust repo with a pyproject.toml (maturin) is Rust', ['Cargo.toml', 'pyproject.toml'], 'cargo nextest run'],
    ['a Maven repo with a requirements.txt is Maven', ['pom.xml', 'requirements.txt'], 'mvn -B'],
    ['a Gradle repo with a pyproject.toml is Gradle', ['build.gradle', 'pyproject.toml'], 'gradle test'],
    ['a .NET repo with a requirements.txt is .NET', ['App.sln', 'requirements.txt'], 'dotnet test'],
    ['Go keeps first place (go.mod and Cargo.toml)', ['go.mod', 'Cargo.toml'], 'gotestsum'],
    ['Rust before Java (Cargo.toml and pom.xml)', ['Cargo.toml', 'pom.xml'], 'cargo nextest run'],
    ['Maven before Gradle (pom.xml and build.gradle)', ['pom.xml', 'build.gradle'], 'mvn -B'],
    ['Gradle before .NET (build.gradle and App.sln)', ['build.gradle', 'App.sln'], 'gradle test'],
    ['package.json still decides first (package.json and Cargo.toml)', ['package.json', 'Cargo.toml'], 'npm ci'],
  ] as const) {
    test(`detection: ${label}`, () => {
      for (const f of files) {writeFileSync(join(testDir, f), f === 'package.json' ? '{"name":"x"}' : '');}
      taf('setup', { write: true });
      expect(wf()).toContain(want);
    });
  }

  test('the new recipes keep the red-run recipe and are valid YAML', () => {
    for (const file of ['Cargo.toml', 'pom.xml', 'build.gradle', 'App.sln']) {
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, file), '');
      taf('setup', { write: true });
      rmSync(join(testDir, file));
      const names = steps().map((s) => s.name).filter(Boolean);
      expect(names.slice(-2)).toEqual(['Print the receipt', 'Fail the job if the tests failed']);
      expect((stepNamed('Run tests') as { 'continue-on-error'?: boolean })['continue-on-error']).toBe(true);
    }
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

  // node:test and mocha write JUnit XML when asked. The recipe runs the
  // project's own test command, so pretest/posttest run (review 3e).
  const NODE_JUNIT = 'NODE_OPTIONS="--test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=report.xml"';
  for (const [label, scripts, lock, run] of [
    ['node --test', { test: 'node --test' }, null, `${NODE_JUNIT} npm test`],
    ['node --test with a glob', { test: 'node --test "test/**/*.test.js"' }, null, `${NODE_JUNIT} npm test`],
    ['node --test behind a hand-off', { test: 'npm run unit', unit: 'node --test' }, null, `${NODE_JUNIT} npm test`],
    ['node --test with pnpm', { test: 'node --test' }, 'pnpm-lock.yaml', `${NODE_JUNIT} pnpm test`],
    ['mocha', { test: 'mocha' }, null, 'npm test -- --reporter xunit --reporter-option output=report.xml'],
    ['mocha --recursive', { test: 'mocha --recursive' }, null, 'npm test -- --reporter xunit --reporter-option output=report.xml'],
    ['mocha with pnpm', { test: 'mocha' }, 'pnpm-lock.yaml', 'pnpm test --reporter xunit --reporter-option output=report.xml'],
    ['mocha with yarn', { test: 'mocha' }, 'yarn.lock', 'yarn test --reporter xunit --reporter-option output=report.xml'],
  ] as const) {
    test(`JS, ${label}: runs the test command with a JUnit report and reads report.xml`, () => {
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'x', scripts }));
      if (lock) {writeFileSync(join(testDir, lock), '');}
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
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
    ['the script hands over to one that runs mocha (mocha flags would skip pretest)', '{"devDependencies":{"jest":"1"},"scripts":{"test":"pnpm test:unit","test:unit":"mocha"}}', false],
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
    // The current major of each action a recipe uses (checked 2026-11-04).
    const CURRENT: Record<string, string> = {
      'actions/checkout': 'v7', 'actions/setup-node': 'v7', 'actions/setup-python': 'v7', 'actions/setup-go': 'v7',
      'actions/setup-java': 'v6', 'actions/setup-dotnet': 'v6', 'gradle/actions/setup-gradle': 'v6',
      'pnpm/action-setup': 'v6', 'oven-sh/setup-bun': 'v2', 'taiki-e/install-action': 'v2',
      'dtolnay/rust-toolchain': 'stable', 'Wolfe-Jam/faf-taf-git': ciPin()!.split('@')[1],
    };
    const recipes: Array<[string, string]> = [
      ['package.json', '{"name":"x"}'], ['go.mod', 'module x\n'], ['pyproject.toml', ''],
      ['Cargo.toml', ''], ['pom.xml', ''], ['build.gradle', ''], ['App.sln', ''],
    ];
    for (const [file, body] of recipes) {
      // Never remove testDir itself: it is the cwd, and Windows refuses that.
      rmSync(join(testDir, '.github'), { recursive: true, force: true });
      writeFileSync(join(testDir, file), body);
      taf('setup', { write: true });
      const wf = readFileSync(wfPath(), 'utf-8');
      rmSync(join(testDir, file));
      expect(wf).toContain('actions/checkout@v7');
      for (const [, action, ref] of wf.matchAll(/uses: ([\w./-]+)@([\w.]+)/g)) {
        expect(`${action}@${ref}`).toBe(`${action}@${CURRENT[action]}`);
      }
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
