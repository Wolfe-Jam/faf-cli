import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFaf, readFafRaw } from '../../src/interop/faf.js';
import { detectStack } from '../../src/detect/stack.js';
import * as kernel from '../../src/wasm/kernel.js';
import { enrichScore } from '../../src/core/scorer.js';
import { writeFaf } from '../../src/interop/faf.js';

describe('init command integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-init-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('detects CLI project and creates .faf', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'my-cli-tool',
      version: '1.0.0',
      bin: { mycli: 'dist/cli.js' },
      dependencies: { commander: '^14.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    }));
    writeFileSync(join(testDir, 'tsconfig.json'), '{}');

    const data = detectStack(testDir);
    expect(data.project?.name).toBe('my-cli-tool');
    expect(data.project?.type).toBe('cli');
    expect(data.project?.main_language).toBe('TypeScript');
    expect(data.stack?.frontend).toBe('slotignored');

    // Write and score
    const fafPath = join(testDir, 'project.faf');
    writeFaf(fafPath, data);
    const result = enrichScore(kernel.score(readFafRaw(fafPath)));
    expect(result.score).toBeGreaterThan(0);
    expect(result.ignored).toBeGreaterThan(0);
  });

  test('detects fullstack project', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'my-fullstack',
      dependencies: { react: '^18.0.0', express: '^4.0.0' },
      devDependencies: { typescript: '^5.0.0', tailwindcss: '^3.0.0' },
    }));

    const data = detectStack(testDir);
    expect(data.project?.type).toBe('fullstack');
    expect(data.stack?.frontend).toBe('React');
    expect(data.stack?.backend).toBe('Express');
  });

  test('detects frontend project', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'my-react-app',
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    }));

    const data = detectStack(testDir);
    expect(data.project?.type).toBe('frontend');
    expect(data.stack?.frontend).toBe('React');
  });

  test('generates valid YAML that kernel can score', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
    }));

    const data = detectStack(testDir);
    const fafPath = join(testDir, 'project.faf');
    writeFaf(fafPath, data);

    expect(existsSync(fafPath)).toBe(true);
    const yaml = readFafRaw(fafPath);
    expect(kernel.validate(yaml)).toBe(true);

    const result = kernel.score(yaml);
    expect(result.total).toBe(21);
  });

  test('slotignored math is correct for CLI', () => {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'my-cli',
      bin: { cli: 'index.js' },
    }));

    const data = detectStack(testDir);
    const fafPath = join(testDir, 'project.faf');
    writeFaf(fafPath, data);

    const result = kernel.score(readFafRaw(fafPath));
    // CLI: 9 active slots (project=3, human=6), 12 slotignored in base tier
    expect(result.active).toBe(9);
    expect(result.ignored).toBe(12);
  });
});
