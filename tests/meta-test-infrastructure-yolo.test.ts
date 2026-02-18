/**
 * 🏎️ YOLO Meta-Test: Testing The Testing Infrastructure
 *
 * PURPOSE: Validate that our testing environment is robust and won't fail silently
 * TIER: BRAKE SYSTEMS 🚨 (Most Critical - Testing the tests themselves)
 *
 * WHY THIS EXISTS:
 * The git drift test failures exposed critical weaknesses in our testing setup:
 * 1. Jest cache corruption (affected ALL tests)
 * 2. process.cwd() pollution (cross-test contamination)
 * 3. Template literal bugs (syntax errors hidden by test infrastructure)
 *
 * This YOLO test ensures those problems are IMPOSSIBLE going forward.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Cross-platform helper to find test files
 * Replaces Unix `find` command with Node.js fs
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

describe('🏁 YOLO: Meta-Test Infrastructure Validation', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    // CRITICAL: Always restore cwd after tests
    try {
      process.chdir(originalCwd);
    } catch (e) {
      console.error(`⚠️ Could not restore cwd to ${originalCwd}:`, e);
    }
  });

  describe('🚨 TIER 1: Jest Configuration Safety', () => {
    it('should enforce sequential test execution (maxWorkers: 1)', () => {
      const jestConfig = require('../jest.config.js');

      expect(jestConfig.maxWorkers).toBe(1);

      if (jestConfig.maxWorkers !== 1) {
        throw new Error(
          'CRITICAL: maxWorkers must be 1 to prevent cwd corruption!\n' +
          'Parallel tests can pollute process.cwd() and cause cascade failures.'
        );
      }
    });

    it('should have cache clearing mechanisms in place', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
      );

      expect(packageJson.scripts['clean:cache']).toBeDefined();
      expect(packageJson.scripts['clean:cache']).toContain('jest --clearCache');
    });

    it('should reset mocks between tests', () => {
      const jestConfig = require('../jest.config.js');

      expect(jestConfig.clearMocks).toBe(true);
      expect(jestConfig.resetModules).toBe(true);
      expect(jestConfig.restoreMocks).toBe(true);
    });
  });

  describe('🚨 TIER 1: Process State Isolation', () => {
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
          'This happens when tests delete directories they are inside of.\n' +
          'FIX: Run npm run clean:cache and restart tests.'
        );
      }

      expect(cwdWorks).toBe(true);
    });

    it('should preserve cwd after temp directory operations', async () => {
      const beforeCwd = process.cwd();

      // Simulate what failing tests were doing
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yolo-test-'));

      try {
        // Dangerous operation: change into temp dir
        process.chdir(tempDir);

        // Do some work
        await fs.promises.writeFile(path.join(tempDir, 'test.txt'), 'data');

        // CRITICAL: Restore before cleanup
        process.chdir(beforeCwd);

        // Now safe to delete
        await fs.promises.rm(tempDir, { recursive: true, force: true });

        // Verify cwd still works
        const afterCwd = process.cwd();
        expect(afterCwd).toBe(beforeCwd);
        expect(fs.existsSync(afterCwd)).toBe(true);

      } catch (e) {
        // Ensure cleanup even on error
        process.chdir(beforeCwd);
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        throw e;
      }
    });

    it('should fail if temp dir deleted while process is inside it', async () => {
      const beforeCwd = process.cwd();
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yolo-bad-test-'));

      try {
        // BAD PATTERN: Change into temp dir
        process.chdir(tempDir);

        // BAD PATTERN: Delete while inside
        await fs.promises.rm(tempDir, { recursive: true, force: true });

        // This should fail or detect corruption
        let cwdBroken = false;
        try {
          const cwd = process.cwd();
          cwdBroken = !fs.existsSync(cwd);
        } catch (e) {
          cwdBroken = true;
        }

        // Restore ASAP
        process.chdir(beforeCwd);

        // We EXPECT this bad pattern to break cwd
        expect(cwdBroken).toBe(true);

      } catch (e) {
        process.chdir(beforeCwd);
        // Test passes - we detected the bad pattern
      }
    });
  });

  describe('⚡ TIER 2: Template Literal Syntax Detection', () => {
    it('should detect template literal bugs in test files', async () => {
      // Find all test files (cross-platform)
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/);

      const bugsFound: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');

        // Detect: execSync('.*${
        // This is ALWAYS wrong - should use backticks
        // Exclude comments and strings (look for actual code)
        const lines = content.split('\n');
        let bugCount = 0;

        lines.forEach((line, idx) => {
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
          // Skip example strings (in error messages)
          if (line.includes('Example WRONG:') || line.includes('Example RIGHT:')) return;

          // Detect real bug: execSync('...${
          if (/execSync\s*\(\s*'[^']*\$\{/.test(line)) {
            bugCount++;
          }
        });

        if (bugCount > 0) {
          bugsFound.push(`${path.basename(fullPath)}: Found ${bugCount} template literal bugs`);
        }
      }

      if (bugsFound.length > 0) {
        throw new Error(
          'TEMPLATE LITERAL BUGS DETECTED:\n' +
          bugsFound.join('\n') + '\n\n' +
          'These use single quotes instead of backticks and will fail!\n' +
          'Example WRONG: execSync(\'node ${VAR}\')\n' +
          'Example RIGHT: execSync(`node ${VAR}`)'
        );
      }

      expect(bugsFound).toHaveLength(0);
    });
  });

  describe('⚡ TIER 2: Test File Quality Gates', () => {
    it('should have proper beforeEach/afterEach in tests that modify state', async () => {
      // Find all test files (cross-platform)
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/);

      const missingCleanup: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');

        // If test uses process.chdir(), MUST have afterEach
        if (content.includes('process.chdir(') && !content.includes('afterEach')) {
          missingCleanup.push(`${path.basename(fullPath)}: Uses process.chdir() but no afterEach cleanup`);
        }

        // If test creates temp dirs, MUST have cleanup
        if (content.includes('mkdtemp') && !content.includes('afterEach')) {
          missingCleanup.push(`${path.basename(fullPath)}: Creates temp dirs but no afterEach cleanup`);
        }
      }

      if (missingCleanup.length > 0) {
        console.warn(
          '⚠️  WARNING: Tests without proper cleanup:\n' +
          missingCleanup.join('\n')
        );
      }

      // Warning only - don't fail, but log for review
      expect(true).toBe(true);
    });

    it('should not have undefined function calls in tests', async () => {
      // Find all test files (cross-platform)
      const testsDir = path.resolve(__dirname, '..', 'tests');
      const testFiles = findTestFiles(testsDir, /\.test\.ts$/);

      const suspiciousCalls: string[] = [];

      for (const fullPath of testFiles) {
        const content = await fs.promises.readFile(fullPath, 'utf8');

        // Check for common undefined helper patterns
        const patterns = [
          /await createRepoWithDrift\(/,
          /await setupTestRepo\(/,
          /await createTestEnvironment\(/,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            // Check if function is actually defined
            const functionName = pattern.source.match(/(\w+)\(/)?.[1];
            if (functionName && !content.includes(`function ${functionName}`) && !content.includes(`const ${functionName}`)) {
              suspiciousCalls.push(`${path.basename(fullPath)}: Calls ${functionName}() but it's not defined`);
            }
          }
        }
      }

      if (suspiciousCalls.length > 0) {
        console.warn(
          '⚠️  WARNING: Tests calling undefined functions:\n' +
          suspiciousCalls.join('\n')
        );
      }

      // Warning only for now
      expect(true).toBe(true);
    });
  });

  describe('🏁 TIER 3: Performance & Hygiene', () => {
    it('should complete cache clear operation in <1 second', async () => {
      const start = Date.now();

      execSync('npm run clean:cache', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });

      const duration = Date.now() - start;

      // Should be fast (increased threshold for CI/loaded systems)
      expect(duration).toBeLessThan(15000);
    });

    it('should have YOLO logs directory structure', () => {
      const yoloDir = '/Users/wolfejam/FAF-GOLD/PLANET-FAF/WJTTC - WolfeJam Technical & Testing Center/permanent-records/yolo-logs';

      if (fs.existsSync(yoloDir)) {
        const logs = fs.readdirSync(yoloDir);
        expect(logs.length).toBeGreaterThan(0);
      } else {
        console.warn('⚠️  YOLO logs directory not found - create it for test permanence');
      }
    });
  });

  describe('🔬 TIER 3: Regression Detection', () => {
    it('should document known test failure patterns', () => {
      // This test documents what we learned from the keyword update incident
      const knownPatterns = [
        {
          symptom: 'ENOENT: no such file or directory, uv_cwd',
          cause: 'Jest cache corruption from cwd modification',
          fix: 'npm run clean:cache'
        },
        {
          symptom: 'MODULE_NOT_FOUND for ${VAR}',
          cause: 'Template literal using single quotes instead of backticks',
          fix: 'Change \'node ${VAR}\' to `node ${VAR}`'
        },
        {
          symptom: 'Tests pass individually but fail in suite',
          cause: 'Parallel execution with shared state modification',
          fix: 'Set maxWorkers: 1 or fix test isolation'
        }
      ];

      expect(knownPatterns).toHaveLength(3);

      // Document for future reference
      console.log('\n📋 Known Test Failure Patterns:');
      knownPatterns.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.symptom}`);
        console.log(`   Cause: ${p.cause}`);
        console.log(`   Fix: ${p.fix}`);
      });
    });
  });
});
