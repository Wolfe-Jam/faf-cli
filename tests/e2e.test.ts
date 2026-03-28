import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';
import { execSync } from 'child_process';

/**
 * Full end-to-end test: exercises the entire CLI flow as a user would.
 * init → score → auto → sync → export → check → edit → drift → convert →
 * compile → decompile → taf → search → share → recover → migrate → demo → info → formats
 */
describe('faf e2e — full lifecycle', () => {
  let testDir: string;
  let originalCwd: string;
  const cli = join(__dirname, '../src/cli.ts');
  const run = (cmd: string) => execSync(`bun ${cli} ${cmd}`, { cwd: testDir, encoding: 'utf-8', timeout: 15000 });

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-e2e-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    // Seed a package.json so init/auto have something to detect
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'e2e-test-app',
      version: '1.0.0',
      dependencies: { express: '^4.18.0' },
      devDependencies: { typescript: '^5.3.0' },
    }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  // --- Phase 1: Create ---

  test('init creates project.faf', () => {
    run('init --yolo');
    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const faf = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(faf.faf_version).toBe('3.0');
    expect(faf.project.name).toBe('e2e-test-app');
  });

  test('auto enriches .faf', () => {
    run('auto');
    const faf = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(faf.project.name).toBe('e2e-test-app');
    expect(faf.faf_version).toBe('3.0');
  });

  // --- Phase 2: Score & Validate ---

  test('score outputs percentage', () => {
    run('auto');
    const out = run('score --json');
    const result = JSON.parse(out);
    expect(result.score).toBeGreaterThan(0);
    expect(result.populated).toBeGreaterThan(0);
  });

  test('score --status outputs compact line', () => {
    run('auto');
    const out = run('score --status');
    expect(out).toContain('%');
  });

  test('check validates .faf', () => {
    run('auto');
    const out = run('check');
    expect(out).toContain('valid');
  });

  // --- Phase 3: Edit & Drift ---

  test('edit modifies a slot', () => {
    run('auto');
    run('edit project.goal "The ultimate e2e test"');
    const faf = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(faf.project.goal).toBe('The ultimate e2e test');
  });

  test('drift runs without error', () => {
    run('auto');
    const out = run('drift');
    expect(out.length).toBeGreaterThan(0);
  });

  // --- Phase 4: Sync & Export ---

  test('sync generates CLAUDE.md', () => {
    run('auto');
    run('sync --direction push');
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);
    const claude = readFileSync(join(testDir, 'CLAUDE.md'), 'utf-8');
    expect(claude).toContain('e2e-test-app');
  });

  test('export generates AGENTS.md + .cursorrules + GEMINI.md', () => {
    run('auto');
    run('export --all');
    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(testDir, '.cursorrules'))).toBe(true);
    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(true);
  });

  // --- Phase 5: Convert & Compile ---

  test('convert --json outputs JSON', () => {
    run('auto');
    const out = run('convert --json');
    const data = JSON.parse(out);
    expect(data.project.name).toBe('e2e-test-app');
  });

  test('compile creates .fafb then decompile reads it', () => {
    run('auto');
    run('compile');
    const fafbPath = join(testDir, 'project.fafb');
    expect(existsSync(fafbPath)).toBe(true);

    const out = run(`decompile ${fafbPath}`);
    const info = JSON.parse(out);
    expect(info.version).toBeDefined();
    expect(info.sections.length).toBeGreaterThan(0);
  });

  // --- Phase 6: TAF & Share ---

  test('taf generates receipt', () => {
    run('auto');
    const receiptPath = join(testDir, 'receipt.json');
    run(`taf --output ${receiptPath}`);
    expect(existsSync(receiptPath)).toBe(true);
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf-8'));
    expect(receipt.taf_version).toBe('1.0.0');
    expect(receipt.project).toBe('e2e-test-app');
    expect(receipt.score).toBeGreaterThan(0);
  });

  test('share outputs encoded URL', () => {
    run('auto');
    const out = run('share --raw');
    expect(out.trim().length).toBeGreaterThan(0);
    // Should be valid base64url
    expect(out.trim()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  // --- Phase 7: Search & Formats ---

  test('search finds slots', () => {
    const out = run('search frontend');
    expect(out).toContain('stack.frontend');
  });

  test('formats lists categories', () => {
    const out = run('formats');
    expect(out).toContain('web');
    expect(out).toContain('TypeScript');
  });

  // --- Phase 8: Recover & Migrate ---

  test('recover recreates .faf from CLAUDE.md', () => {
    run('auto');
    run('sync --direction push');
    // Delete .faf, keep CLAUDE.md
    rmSync(join(testDir, 'project.faf'));
    expect(existsSync(join(testDir, 'project.faf'))).toBe(false);

    run('recover');
    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const faf = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(faf.project.name).toBe('e2e-test-app');
  });

  test('migrate on current version is no-op', () => {
    run('auto');
    const before = readFileSync(join(testDir, 'project.faf'), 'utf-8');
    const out = run('migrate');
    expect(out).toContain('already');
  });

  // --- Phase 9: Info & Demo ---

  test('info shows version', () => {
    const out = run('info');
    expect(out).toContain('faf');
    expect(out).toContain('v6');
  });

  test('demo runs full walkthrough', () => {
    const out = run('demo');
    expect(out).toContain('demo');
    expect(out).toContain('100%');
  });

  // --- Phase 10: Pro & Clear ---

  test('pro shows free status', () => {
    const out = run('pro');
    expect(out).toContain('Free');
  });

  test('clear runs without error', () => {
    const out = run('clear');
    expect(out.length).toBeGreaterThanOrEqual(0);
  });

  // --- Phase 11: Conductor ---

  test('conductor import from JSON', () => {
    const configPath = join(testDir, 'conductor.json');
    writeFileSync(configPath, JSON.stringify({ name: 'conductor-e2e', description: 'E2E test' }));
    run(`conductor import ${configPath}`);
    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);
    const faf = parse(readFileSync(join(testDir, 'project.faf'), 'utf-8'));
    expect(faf.project.name).toBe('conductor-e2e');
  });

  test('conductor export outputs JSON', () => {
    run('auto');
    const out = run('conductor export');
    const config = JSON.parse(out);
    expect(config.name).toBe('e2e-test-app');
  });

  // --- Full Flow: init → auto → score → sync → export → compile → taf ---

  test('full golden path lifecycle', () => {
    // 1. Init
    run('init --yolo');
    expect(existsSync(join(testDir, 'project.faf'))).toBe(true);

    // 2. Auto-enrich
    run('auto');
    const score1 = JSON.parse(run('score --json'));
    expect(score1.score).toBeGreaterThan(0);

    // 3. Edit to improve
    run('edit human_context.who "E2E test runner"');
    run('edit human_context.what "Testing faf-cli v6"');
    run('edit human_context.why "Quality assurance"');
    run('edit human_context.where "CI/CD"');
    run('edit human_context.when "2026"');
    run('edit human_context.how "Automated testing"');

    // 4. Score should improve
    const score2 = JSON.parse(run('score --json'));
    expect(score2.score).toBeGreaterThanOrEqual(score1.score);

    // 5. Sync to CLAUDE.md
    run('sync --direction push');
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);

    // 6. Export all formats
    run('export --all');
    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(testDir, '.cursorrules'))).toBe(true);
    expect(existsSync(join(testDir, 'GEMINI.md'))).toBe(true);

    // 7. Compile to binary
    run('compile');
    expect(existsSync(join(testDir, 'project.fafb'))).toBe(true);

    // 8. Generate TAF receipt
    const receiptPath = join(testDir, 'final-receipt.json');
    run(`taf --output ${receiptPath}`);
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf-8'));
    expect(receipt.score).toBeGreaterThanOrEqual(score1.score);

    // 9. Validate
    const out = run('check');
    expect(out).toContain('valid');
  });
});
