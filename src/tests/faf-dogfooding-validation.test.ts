/**
 * 🏎️ WJTTC: FAF Dogfooding Validation Test Suite
 *
 * TIER: BRAKE TEST (Critical - must never fail)
 *
 * Tests that faf-cli correctly analyzes itself and other repos.
 * Prevents regression of bugs where FAB/README override package.json.
 *
 * Compares `faf init` vs `faf git` to ensure both produce accurate results.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import path from 'path';
import os from 'os';

const TEST_TIMEOUT = 30000; // 30 seconds per test

/**
 * Test fixture: Known repository data
 */
interface RepoFixture {
  name: string;
  path?: string; // Local path for faf init
  github?: string; // GitHub slug for faf git
  expectedName: string;
  expectedVersion?: string;
  expectedLanguage: string;
  expectedType?: string;
  manifest: 'package.json' | 'pyproject.toml' | 'Cargo.toml' | 'none';
}

const FIXTURES: RepoFixture[] = [
  {
    name: 'faf-cli itself (dogfooding)',
    path: path.resolve(__dirname, '../..'), // /Users/wolfejam/FAF/cli
    github: 'Wolfe-Jam/faf-cli',
    expectedName: 'faf-cli',
    expectedVersion: '4.2.1', // Current version
    expectedLanguage: 'TypeScript',
    expectedType: 'cli-ts',
    manifest: 'package.json'
  },
  {
    name: 'whisper.cpp (C++ with CMake)',
    github: 'ggml-org/whisper.cpp',
    expectedName: 'whisper.cpp',
    expectedLanguage: 'C++',
    manifest: 'none' // Uses CMakeLists.txt
  }
];

/**
 * Helper: Run faf init and return parsed .faf data
 */
function runFafInit(repoPath: string): any {
  const fafPath = path.join(repoPath, 'project.faf');

  // Clean up any existing .faf
  if (existsSync(fafPath)) {
    unlinkSync(fafPath);
  }

  // Run faf init
  execSync('faf init --force --quiet', {
    cwd: repoPath,
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  // Read and parse
  const content = readFileSync(fafPath, 'utf-8');
  return parseYAML(content);
}

/**
 * Helper: Run faf git and return parsed .faf data
 */
function runFafGit(githubSlug: string): any {
  const tempDir = path.join(os.tmpdir(), `faf-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    // Run faf git
    const output = execSync(`faf git ${githubSlug}`, {
      cwd: tempDir,
      encoding: 'utf-8'
    });

    // Find the generated .faf file (repository name from slug)
    const repoName = githubSlug.split('/')[1];
    const fafFileName = `${repoName}.faf`;
    const fafPath = path.join(tempDir, fafFileName);

    if (!existsSync(fafPath)) {
      // Debug: list all files in temp dir
      const files = execSync('ls -la', { cwd: tempDir, encoding: 'utf-8' });
      throw new Error(
        `faf git did not create ${fafFileName}\nOutput: ${output}\nFiles in ${tempDir}:\n${files}`
      );
    }

    // Read and parse
    const content = readFileSync(fafPath, 'utf-8');
    const data = parseYAML(content);

    // Clean up the temp file before returning
    unlinkSync(fafPath);

    return data;
  } finally {
    // Cleanup temp directory
    try {
      execSync(`rm -rf ${tempDir}`);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * TIER 1: BRAKE TESTS - Must never fail
 */
describe('🔴 TIER 1: BRAKE - Critical Dogfooding Validation', () => {
  describe('faf-cli dogfooding (self-analysis)', () => {
    test('faf init: extracts correct name from package.json', () => {
      const fixture = FIXTURES[0]; // faf-cli
      if (!fixture.path) return;

      const data = runFafInit(fixture.path);

      expect(data.project.name).toBe(fixture.expectedName);
      expect(data.project.name).not.toBe('Install'); // Regression check!
    }, TEST_TIMEOUT);

    test('faf init: extracts correct version from package.json', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path) return;

      const data = runFafInit(fixture.path);

      expect(data.state.version).toBe(fixture.expectedVersion);
      expect(data.state.version).not.toBe('1.0.0'); // Regression check!
    }, TEST_TIMEOUT);

    test('faf init: detects TypeScript as main language', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path) return;

      const data = runFafInit(fixture.path);

      expect(data.project.main_language).toBe(fixture.expectedLanguage);
    }, TEST_TIMEOUT);

    test('faf init: detects cli-ts as project type', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path) return;

      const data = runFafInit(fixture.path);

      expect(data.project.type).toBe(fixture.expectedType);
    }, TEST_TIMEOUT);

    test('faf git: extracts correct name from GitHub', () => {
      const fixture = FIXTURES[0];
      if (!fixture.github) return;

      const data = runFafGit(fixture.github);

      expect(data.name).toBe(fixture.expectedName);
      expect(data.name).not.toBe('Install');
    }, TEST_TIMEOUT);

    test('faf init vs faf git: name consistency', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path || !fixture.github) return;

      const initData = runFafInit(fixture.path);
      const gitData = runFafGit(fixture.github);

      // Both should agree on the project name
      expect(initData.project.name).toBe(gitData.name);
    }, TEST_TIMEOUT * 2); // Runs both commands
  });

  describe('manifest file authority (package.json/pyproject.toml/Cargo.toml)', () => {
    test('package.json ALWAYS overrides FAB/README guesses', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path) return;

      const data = runFafInit(fixture.path);

      // Should use package.json, not README title or FAB guess
      expect(data.project.name).toBe('faf-cli');
      expect(data.project.goal).toContain('IANA-Registered'); // From package.json description
    }, TEST_TIMEOUT);

    test('version field is populated when manifest exists', () => {
      const fixture = FIXTURES[0];
      if (!fixture.path || !fixture.expectedVersion) return;

      const data = runFafInit(fixture.path);

      expect(data.state.version).toBeDefined();
      expect(data.state.version).not.toBe('1.0.0'); // Not the default
      expect(data.state.version).toBe(fixture.expectedVersion);
    }, TEST_TIMEOUT);
  });
});

/**
 * TIER 2: ENGINE TESTS - Core functionality
 */
describe('🟡 TIER 2: ENGINE - Multi-Language Support', () => {
  describe('C++ projects (whisper.cpp)', () => {
    test('faf git: correctly detects C++ as primary language', () => {
      const fixture = FIXTURES[1]; // whisper.cpp
      if (!fixture.github) return;

      const data = runFafGit(fixture.github);

      expect(data.stack.primary_language).toBe('C++');
      expect(data.stack.primary_language).not.toBe('Python'); // Regression check!
    }, TEST_TIMEOUT);

    test('faf git: extracts correct name for C++ project', () => {
      const fixture = FIXTURES[1];
      if (!fixture.github) return;

      const data = runFafGit(fixture.github);

      expect(data.name).toBe(fixture.expectedName);
    }, TEST_TIMEOUT);

    test('faf git: detects multiple languages with correct weighting', () => {
      const fixture = FIXTURES[1];
      if (!fixture.github) return;

      const data = runFafGit(fixture.github);

      // Should detect C++ as dominant, Python as minor
      const languages = data.metadata.languages;
      expect(languages).toBeDefined();

      // Find C++ and Python percentages
      const cppLang = languages.find((l: string) => l.includes('C++'));
      const pyLang = languages.find((l: string) => l.includes('Python'));

      expect(cppLang).toBeDefined();
      expect(pyLang).toBeDefined();

      // C++ should be > 50%, Python should be < 5%
      const cppPercent = parseFloat(cppLang.match(/\(([0-9.]+)%\)/)?.[1] || '0');
      const pyPercent = parseFloat(pyLang.match(/\(([0-9.]+)%\)/)?.[1] || '0');

      expect(cppPercent).toBeGreaterThan(50);
      expect(pyPercent).toBeLessThan(5);
    }, TEST_TIMEOUT);
  });
});

/**
 * TIER 3: AERO - Edge Cases & Robustness
 */
describe('🟢 TIER 3: AERO - Edge Cases', () => {
  test('faf init handles missing package.json gracefully', () => {
    const tempDir = path.join(os.tmpdir(), `faf-no-manifest-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });

    try {
      // Create minimal project with just a README
      const readmePath = path.join(tempDir, 'README.md');
      const fs = require('fs');
      fs.writeFileSync(readmePath, '# Test Project\n\nA test project without manifest.');

      const data = runFafInit(tempDir);

      // Should use directory name or README extraction as fallback
      expect(data.project.name).toBeDefined();
      expect(data.project.name).not.toBe('Install'); // Should not be garbage
    } finally {
      execSync(`rm -rf ${tempDir}`);
    }
  }, TEST_TIMEOUT);

  test('faf git handles repos without topics gracefully', () => {
    // Test with a minimal repo (if we have one)
    // Skip for now - add when we have a suitable fixture
  });
});

/**
 * TIER 4: COMPARISON MATRIX - faf init vs faf git
 */
describe('🔵 TIER 4: COMPARISON - Init vs Git Consistency', () => {
  test('both methods produce valid .faf files', () => {
    const fixture = FIXTURES[0];
    if (!fixture.path || !fixture.github) return;

    const initData = runFafInit(fixture.path);
    const gitData = runFafGit(fixture.github);

    // Both should have required fields
    expect(initData.faf_version).toBeDefined();
    expect(gitData.version).toBeDefined();

    expect(initData.project).toBeDefined();
    expect(gitData.metadata).toBeDefined();
  }, TEST_TIMEOUT * 2);

  test('both methods agree on project name', () => {
    const fixture = FIXTURES[0];
    if (!fixture.path || !fixture.github) return;

    const initData = runFafInit(fixture.path);
    const gitData = runFafGit(fixture.github);

    expect(initData.project.name).toBe(gitData.name);
  }, TEST_TIMEOUT * 2);

  test('both methods detect primary language correctly', () => {
    const fixture = FIXTURES[0];
    if (!fixture.path || !fixture.github) return;

    const initData = runFafInit(fixture.path);
    const gitData = runFafGit(fixture.github);

    expect(initData.project.main_language).toBe(gitData.stack.primary_language);
  }, TEST_TIMEOUT * 2);
});

/**
 * WJTTC Report Summary
 */
afterAll(() => {
  console.log('\n🏎️ WJTTC: FAF Dogfooding Validation Complete');
  console.log('   Brake Tests: Critical dogfooding scenarios');
  console.log('   Engine Tests: Multi-language support');
  console.log('   Aero Tests: Edge case handling');
  console.log('   Comparison: faf init vs faf git consistency');
  console.log('\n   Championship Standard: ZERO ERRORS REQUIRED');
});
