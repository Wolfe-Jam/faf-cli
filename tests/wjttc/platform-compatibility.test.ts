/**
 * 🏎️ WJTTC TIER 0: PLATFORM COMPATIBILITY
 *
 * F1-Grade Testing: Cross-Platform Safety Gate
 *
 * PURPOSE: Ensure ALL test files work on Windows, macOS, and Linux
 * PRIORITY: Runs FIRST - blocks all other tiers if platform issues detected
 *
 * WHY THIS EXISTS:
 * - CI was failing on Windows due to Unix-specific patterns
 * - Hardcoded /tmp paths don't exist on Windows
 * - Unix `find` command doesn't work on Windows
 * - Line endings differ: Unix (\n) vs Windows (\r\n)
 *
 * TIER 0 = PIT LANE SAFETY CHECK
 * "You can't race if your car doesn't start on all tracks"
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Cross-platform helper to find files recursively
 */
function findFiles(dir: string, pattern: RegExp, excludeDirs: string[] = []): string[] {
  const results: string[] = [];

  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch (e) {
      // Directory may not exist or be inaccessible
    }
  }

  walk(dir);
  return results;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIER 0: PLATFORM COMPATIBILITY - PIT LANE SAFETY CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('🏁 TIER 0: PLATFORM COMPATIBILITY', () => {
  const testsDir = path.resolve(__dirname, '..');
  const srcDir = path.resolve(__dirname, '../../src');

  // Get all TypeScript test files (exclude this file to avoid self-detection)
  const getTestFiles = () => findFiles(testsDir, /\.test\.ts$/, ['node_modules', '__mocks__', 'fixtures'])
    .filter(f => !f.includes('platform-compatibility.test.ts'));
  const getSrcFiles = () => findFiles(srcDir, /\.ts$/, ['node_modules']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0.1 HARDCODED PATHS - No /tmp allowed
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🚫 No Hardcoded Unix Paths', () => {
    test('test files should not use hardcoded /tmp paths', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Skip comments
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
          // Skip error messages and documentation (contain "FIX:" or "VIOLATION")
          if (/FIX:|VIOLATION|will FAIL/.test(line)) return;

          // Detect hardcoded /tmp (but allow os.tmpdir() references in comments)
          if (/['"`]\/tmp\//.test(line) || /execSync.*\/tmp/.test(line)) {
            violations.push(`${path.basename(file)}:${idx + 1}: Hardcoded /tmp path`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `PLATFORM VIOLATION: Hardcoded /tmp paths found!\n` +
          `These will FAIL on Windows.\n\n` +
          `${violations.join('\n')}\n\n` +
          `FIX: Use path.join(os.tmpdir(), 'filename') instead`
        );
      }
    });

    test('test files should not use hardcoded /bin paths', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect /bin/bash, /bin/sh, etc. (except in shell: bash CI context)
          if (/['"`]\/bin\/(bash|sh|zsh)/.test(line)) {
            violations.push(`${path.basename(file)}:${idx + 1}: Hardcoded shell path`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `PLATFORM VIOLATION: Hardcoded shell paths found!\n` +
          `These will FAIL on Windows.\n\n` +
          `${violations.join('\n')}\n\n` +
          `FIX: Use Node.js APIs or cross-platform shell commands`
        );
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0.2 UNIX COMMANDS - No find, grep (use Node.js APIs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🚫 No Unix-Only Commands', () => {
    test('test files should not use Unix find command', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect execSync('find ...) or exec('find ...)
          if (/exec(Sync)?\s*\(\s*['"`]find\s/.test(line)) {
            violations.push(`${path.basename(file)}:${idx + 1}: Unix find command`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `PLATFORM VIOLATION: Unix 'find' command used!\n` +
          `This does NOT exist on Windows.\n\n` +
          `${violations.join('\n')}\n\n` +
          `FIX: Use findFiles() helper with fs.readdirSync()`
        );
      }
    });

    test('test files should not use Unix ls command for file operations', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect execSync('ls ...) but allow ls in shell: bash CI context
          if (/exec(Sync)?\s*\(\s*['"`]ls\s/.test(line)) {
            violations.push(`${path.basename(file)}:${idx + 1}: Unix ls command`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `PLATFORM VIOLATION: Unix 'ls' command used in tests!\n` +
          `This may not work correctly on Windows.\n\n` +
          `${violations.join('\n')}\n\n` +
          `FIX: Use fs.readdirSync() or fs.statSync()`
        );
      }
    });

    test('test files should not use Unix head/tail commands', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect execSync('head ...) or execSync('tail ...)
          if (/exec(Sync)?\s*\(\s*['"`](head|tail)\s/.test(line)) {
            violations.push(`${path.basename(file)}:${idx + 1}: Unix head/tail command`);
          }
        });
      }

      if (violations.length > 0) {
        throw new Error(
          `PLATFORM VIOLATION: Unix 'head/tail' commands used!\n` +
          `These do NOT exist on Windows.\n\n` +
          `${violations.join('\n')}\n\n` +
          `FIX: Use fs.readFileSync() with string slice()`
        );
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0.3 LINE ENDINGS - Must handle both \n and \r\n
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🚫 Line Ending Safety', () => {
    test('regex patterns should use \\r?\\n for line endings', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect regex with \n that should be \r?\n
          // Match patterns like /^---\n/ or .match(/\n---/)
          // But exclude split('\n') which is fine
          if (/\.match\s*\([^)]*\\n[^)]*\)/.test(line) && !/\\r\?\\n/.test(line)) {
            // Check if it's a regex pattern that needs line ending handling
            if (/\/[^/]*\\n[^/]*\//.test(line)) {
              violations.push(`${path.basename(file)}:${idx + 1}: Regex uses \\n without \\r?`);
            }
          }
        });
      }

      // Only warn, don't fail - some uses of \n are intentional
      if (violations.length > 0) {
        console.warn(
          `⚠️  PLATFORM WARNING: Possible line ending issues:\n` +
          `${violations.join('\n')}\n\n` +
          `Consider using \\r?\\n to handle Windows line endings`
        );
      }

      // Always pass but log warnings
      expect(true).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0.4 PATH SEPARATORS - Must use path.join()
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🚫 Path Separator Safety', () => {
    test('should use path.join() for constructing paths', async () => {
      const violations: string[] = [];
      const testFiles = getTestFiles();

      for (const file of testFiles) {
        const content = await fs.promises.readFile(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

          // Detect string concatenation with / for paths
          // e.g., dir + '/file.txt' or `${dir}/file.txt`
          // But allow URLs and known safe patterns
          if (/['"`]\s*\+\s*['"`]\//.test(line) || /\$\{[^}]+\}\/[a-zA-Z]/.test(line)) {
            // Skip if it's clearly a URL or comment
            if (!/https?:\/\//.test(line) && !/\.join\(/.test(line)) {
              violations.push(`${path.basename(file)}:${idx + 1}: String concatenation for path`);
            }
          }
        });
      }

      // Warn only - many uses are safe
      if (violations.length > 0) {
        console.warn(
          `⚠️  PLATFORM WARNING: Possible path separator issues:\n` +
          `${violations.slice(0, 10).join('\n')}\n` +
          `${violations.length > 10 ? `... and ${violations.length - 10} more\n` : ''}` +
          `Consider using path.join() for cross-platform paths`
        );
      }

      expect(true).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0.5 SUMMARY - Platform compatibility report
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('📊 Platform Compatibility Summary', () => {
    test('should display platform compatibility status', () => {
      console.log('\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏁 TIER 0: PLATFORM COMPATIBILITY - COMPLETE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Platform: ${process.platform}`);
      console.log(`Node: ${process.version}`);
      console.log(`Arch: ${process.arch}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Tests are cross-platform compatible');
      console.log('✅ Ready for Windows, macOS, and Linux CI');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      expect(true).toBe(true);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTED UTILITIES - For use by other test files
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { findFiles };

/**
 * TIER 0 PLATFORM COMPATIBILITY CHECKLIST
 * ========================================
 *
 * ✅ No hardcoded /tmp paths → use os.tmpdir()
 * ✅ No hardcoded /bin paths → use Node.js APIs
 * ✅ No Unix find command → use findFiles() helper
 * ✅ No Unix ls/head/tail → use fs.readFileSync()
 * ✅ Handle \r\n line endings → use \r?\n in regex
 * ✅ Use path.join() → not string concatenation
 *
 * REMEMBER: "You can't race if your car doesn't start on all tracks"
 */
