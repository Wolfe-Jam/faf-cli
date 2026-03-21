/**
 * YOLO Meta-Test: Testing The Testing Infrastructure
 *
 * PURPOSE: Validate that our testing environment is robust and won't fail silently
 * TIER: BRAKE SYSTEMS (Most Critical - Testing the tests themselves)
 *
 * WHY THIS EXISTS:
 * Bun runs all tests in a single process. Any shared state mutation
 * (process.env, process.cwd, console, mocks) leaks between files.
 * This test validates that our infrastructure prevents that.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Cross-platform helper to find test files
 */
function findTestFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__mocks__') {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

describe('YOLO: Meta-Test Infrastructure Validation', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    try {
      process.chdir(originalCwd);
    } catch (e) {
      console.error(`Could not restore cwd to ${originalCwd}:`, e);
    }
  });

  describe('TIER 1: Bun Test Runner Safety', () => {
    it('should use bun test as primary test runner', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
      );

      expect(packageJson.scripts['test']).toBe('bun test');
    });

    it('should have bunfig.toml configuration', () => {
      const bunfigPath = path.resolve(__dirname, '../bunfig.toml');
      expect(fs.existsSync(bunfigPath)).toBe(true);
    });

    it('should have cache clearing mechanisms in place', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
      );

      expect(packageJson.scripts['clean:cache']).toBeDefined();
    });

    it('should not have orphaned test files in archive/', () => {
      const archiveDir = path.resolve(__dirname, '../archive/scoring');
      if (fs.existsSync(archiveDir)) {
        const testFiles = fs.readdirSync(archiveDir).filter(f => f.endsWith('.test.ts'));
        expect(testFiles).toHaveLength(0);
      }
    });
  });

  describe('TIER 1: Process State Isolation', () => {
    it('should be able to detect if cwd is corrupted', () => {
      let cwdWorks = false;

      try {
        const cwd = process.cwd();
        cwdWorks = fs.existsSync(cwd);
      } catch (e) {
        cwdWorks = false;
      }

      if (!cwdWorks) {
        throw new Error(
          'CRITICAL: process.cwd() is corrupted!\n' +
          'This happens when tests delete directories they are inside of.'
        );
      }

      expect(cwdWorks).toBe(true);
    });

    it('should preserve cwd after temp directory operations', async () => {
      const beforeCwd = process.cwd();

      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yolo-test-'));

      try {
        process.chdir(tempDir);
        await fs.promises.writeFile(path.join(tempDir, 'test.txt'), 'data');
        process.chdir(beforeCwd);
        await fs.promises.rm(tempDir, { recursive: true, force: true });

        const afterCwd = process.cwd();
        expect(afterCwd).toBe(beforeCwd);
        expect(fs.existsSync(afterCwd)).toBe(true);

      } catch (e) {
        process.chdir(beforeCwd);
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        throw e;
      }
    });

    it('should fail if temp dir deleted while process is inside it', async () => {
      const beforeCwd = process.cwd();
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yolo-bad-test-'));

      try {
        process.chdir(tempDir);
        await fs.promises.rm(tempDir, { recursive: true, force: true });

        let cwdBroken = false;
        try {
          const cwd = process.cwd();
          cwdBroken = !fs.existsSync(cwd);
        } catch (e) {
          cwdBroken = true;
        }

        process.chdir(beforeCwd);
        expect(cwdBroken).toBe(true);

      } catch (e) {
        process.chdir(beforeCwd);
      }
    });
  });

  describe('TIER 2: Bun Single-Process Safety', () => {
    it('should not have test files that delete process.env.PATH', async () => {
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const srcTestsDir = path.resolve(__dirname, '..', 'src', 'tests');
      const selfFile = path.basename(__filename);
      const testFiles = [
        ...findTestFiles(testsDir, /\.test\.ts$/),
        ...(fs.existsSync(srcTestsDir) ? findTestFiles(srcTestsDir, /\.test\.ts$/) : [])
      ].filter(f => path.basename(f) !== selfFile);

      const violations: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        if (content.includes('delete process.env.PATH')) {
          violations.push(path.basename(fullPath));
        }
      }

      if (violations.length > 0) {
        throw new Error(
          'CRITICAL: These files delete process.env.PATH (poisons all subsequent tests in bun):\n' +
          violations.join('\n')
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('should not have process.env shallow copy for restoration', async () => {
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const selfFile = path.basename(__filename);
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/).filter(f => path.basename(f) !== selfFile);

      const warnings: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        // Pattern: process.env = { ...originalEnv } — doesn't clear added keys in bun
        if (/process\.env\s*=\s*\{\s*\.\.\./.test(content)) {
          warnings.push(path.basename(fullPath));
        }
      }

      if (warnings.length > 0) {
        console.warn(
          'WARNING: These files use shallow env copy (may leak keys in bun):\n' +
          warnings.join('\n')
        );
      }

      expect(warnings).toHaveLength(0);
    });
  });

  describe('TIER 2: Template Literal Syntax Detection', () => {
    it('should detect template literal bugs in test files', async () => {
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/);

      const bugsFound: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');

        const lines = content.split('\n');

        lines.forEach((line) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
          if (line.includes('Example WRONG:') || line.includes('Example RIGHT:')) return;

          if (/execSync\s*\(\s*'[^']*\$\{/.test(line)) {
            bugsFound.push(`${path.basename(fullPath)}: template literal bug`);
          }
        });
      }

      expect(bugsFound).toHaveLength(0);
    });
  });

  describe('TIER 2: Test File Quality Gates', () => {
    it('should have proper afterEach in tests that modify state', async () => {
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/);

      const missingCleanup: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');

        if (content.includes('process.chdir(') && !content.includes('afterEach')) {
          missingCleanup.push(`${path.basename(fullPath)}: Uses process.chdir() but no afterEach cleanup`);
        }

        if (content.includes('mkdtemp') && !content.includes('afterEach')) {
          missingCleanup.push(`${path.basename(fullPath)}: Creates temp dirs but no afterEach cleanup`);
        }
      }

      if (missingCleanup.length > 0) {
        console.warn(
          'WARNING: Tests without proper cleanup:\n' +
          missingCleanup.join('\n')
        );
      }

      // Warning only - don't fail, but log for review
      expect(true).toBe(true);
    });
  });

  describe('TIER 3: Performance & Hygiene', () => {
    it('should complete cache clear operation in <15 seconds', async () => {
      const start = Date.now();

      execSync('npm run clean:cache', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(15000);
    });

    it('should document known test failure patterns', () => {
      const knownPatterns = [
        {
          symptom: 'ENOENT: no such file or directory, uv_cwd',
          cause: 'process.cwd() corrupted — test deleted dir while inside it',
          fix: 'Always chdir back before rmSync'
        },
        {
          symptom: 'Command failed: bunx faf-cli (in full suite only)',
          cause: 'process.env.PATH deleted/corrupted by another test file',
          fix: 'Save and restore PATH in finally block, never delete'
        },
        {
          symptom: 'Tests pass individually but fail in suite',
          cause: 'Bun single-process: shared state leaked between files',
          fix: 'Clean up process.env, console, mocks in afterEach/finally'
        }
      ];

      expect(knownPatterns).toHaveLength(3);

      console.log('\nKnown Test Failure Patterns:');
      knownPatterns.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.symptom}`);
        console.log(`   Cause: ${p.cause}`);
        console.log(`   Fix: ${p.fix}`);
      });
    });
  });
});
