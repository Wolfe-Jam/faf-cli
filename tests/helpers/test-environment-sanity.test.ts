/**
 * Test Environment Sanity Check
 * Ensures no compiled JS files exist in src/ that could cause test failures
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Cross-platform helper to find files by pattern
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

describe('Test Environment Sanity Check', () => {
  it('should not have compiled JavaScript files in src directory', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const jsFiles = findFiles(srcDir, /\.js$/);

    if (jsFiles.length > 0) {
      throw new Error(
        `Found ${jsFiles.length} compiled JS files in src/ directory:\n` +
        `${jsFiles.slice(0, 10).map(f => path.relative(srcDir, f)).join('\n')}\n` +
        `${jsFiles.length > 10 ? `... and ${jsFiles.length - 10} more\n` : ''}` +
        `\nThis will cause Jest to use stale code!\n` +
        `Run: npm run clean`
      );
    }
  });

  it('should not have compiled JavaScript files in tests directory', () => {
    const testsDir = path.resolve(__dirname, '../..');
    const jsFiles = findFiles(path.join(testsDir, 'tests'), /\.js$/, ['node_modules', '__mocks__']);

    if (jsFiles.length > 0) {
      throw new Error(
        `Found ${jsFiles.length} compiled JS files in tests/ directory:\n` +
        `${jsFiles.slice(0, 10).map(f => path.relative(testsDir, f)).join('\n')}\n` +
        `${jsFiles.length > 10 ? `... and ${jsFiles.length - 10} more\n` : ''}` +
        `\nRun: npm run clean`
      );
    }
  });

  it('should have consistent TypeScript configuration', () => {
    const tsConfigPath = path.resolve(__dirname, '../../tsconfig.json');
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

    // Ensure outDir is set to prevent in-source compilation
    expect(tsConfig.compilerOptions?.outDir).toBeTruthy();
    expect(tsConfig.compilerOptions?.outDir).not.toBe('.');
    expect(tsConfig.compilerOptions?.outDir).not.toBe('./src');

    // Ensure we're not accidentally compiling tests
    const exclude = tsConfig.exclude || [];
    const hasTestExclusion = exclude.some((pattern: string) =>
      pattern.includes('test') || pattern.includes('spec')
    );

    if (!hasTestExclusion) {
      console.warn('Warning: tsconfig.json should exclude test files');
    }
  });

  it('should have clean npm scripts configured', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check that clean scripts exist
    expect(packageJson.scripts?.clean).toBeTruthy();
    expect(packageJson.scripts?.pretest).toContain('clean');

    // Verify build also cleans first
    if (packageJson.scripts?.build) {
      expect(packageJson.scripts.build).toMatch(/clean|tsc/);
    }
  });

  it('should not have stale build artifacts', () => {
    // Check if any .ts file is newer than its corresponding .js file
    // Using cross-platform Node.js fs.statSync instead of bash
    const srcDir = path.resolve(__dirname, '../../src');
    const tsFiles = findFiles(srcDir, /\.ts$/);
    const staleFiles: string[] = [];

    for (const tsFile of tsFiles) {
      const jsFile = tsFile.replace(/\.ts$/, '.js');
      try {
        const tsStat = fs.statSync(tsFile);
        const jsStat = fs.statSync(jsFile);
        if (tsStat.mtimeMs > jsStat.mtimeMs) {
          staleFiles.push(`${path.relative(srcDir, tsFile)} is newer than ${path.relative(srcDir, jsFile)}`);
        }
      } catch (e) {
        // JS file doesn't exist, which is fine (compiled to dist/)
      }
    }

    if (staleFiles.length > 0) {
      throw new Error(
        `Found stale compiled files:\n${staleFiles.join('\n')}\n` +
        `The TypeScript files are newer than their compiled JavaScript.\n` +
        `Run: npm run clean && npm run build`
      );
    }
  });
});