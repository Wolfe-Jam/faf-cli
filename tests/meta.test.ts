import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('YOLO Infrastructure Safety', () => {
  test('no .test.ts files in src/', () => {
    const find = (dir: string): string[] => {
      const results: string[] = [];
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            results.push(...find(full));
          } else if (entry.name.endsWith('.test.ts')) {
            results.push(full);
          }
        }
      } catch {}
      return results;
    };

    const testFiles = find(join(__dirname, '../src'));
    expect(testFiles).toHaveLength(0);
  });

  test('all test files use bun:test imports', () => {
    const find = (dir: string): string[] => {
      const results: string[] = [];
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) {
            results.push(...find(full));
          } else if (entry.name.endsWith('.test.ts')) {
            results.push(full);
          }
        }
      } catch {}
      return results;
    };

    const testFiles = find(join(__dirname));
    expect(testFiles.length).toBeGreaterThan(0);

    for (const file of testFiles) {
      if (file.includes('meta.test.ts')) continue; // skip self
      const content = readFileSync(file, 'utf-8');
      expect(content).toContain("from 'bun:test'");
    }
  });

  test('no test.skip or describe.skip', () => {
    const find = (dir: string): string[] => {
      const results: string[] = [];
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) {
            results.push(...find(full));
          } else if (entry.name.endsWith('.test.ts')) {
            results.push(full);
          }
        }
      } catch {}
      return results;
    };

    const testFiles = find(join(__dirname));
    for (const file of testFiles) {
      if (file.includes('meta.test.ts')) continue;
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/\btest\.skip\b/);
      expect(content).not.toMatch(/\bdescribe\.skip\b/);
    }
  });

  test('package.json has correct v6 config', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.version).toMatch(/^6\./);
    expect(pkg.type).toBe('module');
    expect(pkg.dependencies?.commander).toBeDefined();
    expect(pkg.dependencies?.['faf-scoring-kernel']).toBeDefined();
    expect(pkg.dependencies?.inquirer).toBeUndefined();
    expect(pkg.scripts?.test).toBe('bun test');
  });

  test('source files are in correct directories', () => {
    const srcDirs = readdirSync(join(__dirname, '../src'), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    expect(srcDirs).toContain('core');
    expect(srcDirs).toContain('commands');
    expect(srcDirs).toContain('detect');
    expect(srcDirs).toContain('interop');
    expect(srcDirs).toContain('wasm');
    expect(srcDirs).toContain('ui');
  });
});
