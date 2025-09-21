/**
 * Test Environment Sanity Check
 * Ensures no compiled JS files exist in src/ that could cause test failures
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Test Environment Sanity Check', () => {
  it('should not have compiled JavaScript files in src directory', () => {
    const jsFiles = execSync('find src -name "*.js" 2>/dev/null || true', {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8'
    }).trim();

    if (jsFiles) {
      const fileList = jsFiles.split('\n').filter(f => f);
      throw new Error(
        `Found ${fileList.length} compiled JS files in src/ directory:\n` +
        `${fileList.slice(0, 10).join('\n')}\n` +
        `${fileList.length > 10 ? `... and ${fileList.length - 10} more\n` : ''}` +
        `\nThis will cause Jest to use stale code!\n` +
        `Run: npm run clean`
      );
    }
  });

  it('should not have compiled JavaScript files in tests directory', () => {
    const jsFiles = execSync('find tests -name "*.js" ! -path "*/node_modules/*" ! -path "*/__mocks__/*" 2>/dev/null || true', {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8'
    }).trim();

    if (jsFiles) {
      const fileList = jsFiles.split('\n').filter(f => f);
      throw new Error(
        `Found ${fileList.length} compiled JS files in tests/ directory:\n` +
        `${fileList.slice(0, 10).join('\n')}\n` +
        `${fileList.length > 10 ? `... and ${fileList.length - 10} more\n` : ''}` +
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
    const checkResult = execSync(
      `find src -name "*.ts" -type f | while read ts; do
        js="\${ts%.ts}.js"
        if [ -f "$js" ]; then
          ts_time=$(stat -f %m "$ts" 2>/dev/null || stat -c %Y "$ts" 2>/dev/null || echo 0)
          js_time=$(stat -f %m "$js" 2>/dev/null || stat -c %Y "$js" 2>/dev/null || echo 0)
          if [ "$ts_time" -gt "$js_time" ]; then
            echo "$ts is newer than $js"
          fi
        fi
      done`,
      {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        shell: '/bin/bash'
      }
    ).trim();

    if (checkResult) {
      throw new Error(
        `Found stale compiled files:\n${checkResult}\n` +
        `The TypeScript files are newer than their compiled JavaScript.\n` +
        `Run: npm run clean && npm run build`
      );
    }
  });
});