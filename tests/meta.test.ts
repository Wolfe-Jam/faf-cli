import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync, existsSync } from 'fs';
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

  // Build invariants — guard against bundler regressions that caused v6.3.0 install crash.
  // Bun (and other bundlers) can inline modules and convert __dirname into the
  // build-machine path as a string literal. Source can be clean while dist is poisoned.
  // This test enforces the "No Hardcode" policy on the actual published artifact.
  describe('build invariants — dist/ is portable', () => {
    const distDir = join(__dirname, '../dist');
    const distFiles = ['cli.js', 'index.js'];
    const buildMachinePatterns = [
      { name: 'macOS user paths', pattern: /\/Users\// },
      { name: 'GitHub Actions Linux paths', pattern: /\/home\/runner\// },
      { name: 'macOS tmp paths', pattern: /\/private\/var\// },
    ];

    test.each(distFiles)('dist/%s contains no build-machine paths', (file) => {
      const path = join(distDir, file);
      if (!existsSync(path)) {
        // dist not built; CI always builds before tests, but locally a dev may
        // run `bun test` without `bun run build` first. Surface a clear message.
        throw new Error(
          `dist/${file} not found. Run \`bun run build\` before running tests.`
        );
      }

      const content = readFileSync(path, 'utf-8');
      for (const { name, pattern } of buildMachinePatterns) {
        const match = content.match(pattern);
        if (match) {
          const idx = match.index ?? 0;
          const ctx = content.slice(Math.max(0, idx - 60), idx + 60);
          throw new Error(
            `dist/${file} leaked a ${name} build path matching ${pattern}.\n` +
            `Context: ...${ctx}...\n` +
            `Fix: externalize the offending dep in the build script (--external <pkg>).`
          );
        }
      }
    });
  });
});
