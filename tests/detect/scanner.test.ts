import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  readPackageJson,
  detectFrameworks,
  detectLanguage,
  detectProjectType,
  detectRuntime,
  detectPackageManager,
  detectCicd,
  detectHosting,
  detectBuildTool,
} from '../../src/detect/scanner.js';

describe('scanner', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-scan-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function writePkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}, extra: Record<string, unknown> = {}): void {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      dependencies: deps,
      devDependencies: devDeps,
      ...extra,
    }));
  }

  describe('readPackageJson', () => {
    test('reads valid package.json', () => {
      writePkg({ react: '^18.0.0' });
      const pkg = readPackageJson(testDir);
      expect(pkg?.dependencies?.react).toBe('^18.0.0');
    });

    test('returns null when missing', () => {
      expect(readPackageJson(testDir)).toBeNull();
    });
  });

  describe('detectFrameworks', () => {
    test('detects React', () => {
      writePkg({ react: '^18.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'react')).toBe(true);
    });

    test('detects Next.js', () => {
      writePkg({ next: '^14.0.0', react: '^18.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
    });

    test('detects Tailwind CSS', () => {
      writePkg({}, { tailwindcss: '^3.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'tailwind')).toBe(true);
    });

    test('detects Express', () => {
      writePkg({ express: '^4.18.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'express')).toBe(true);
    });

    test('detects by file pattern', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.js'), 'module.exports = {}');
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
    });

    test('returns empty for empty project', () => {
      writePkg();
      expect(detectFrameworks(testDir)).toHaveLength(0);
    });
  });

  describe('detectLanguage', () => {
    test('detects TypeScript', () => {
      writePkg({}, { typescript: '^5.0.0' });
      expect(detectLanguage(testDir)).toBe('TypeScript');
    });

    test('detects TypeScript by tsconfig', () => {
      writePkg();
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      expect(detectLanguage(testDir)).toBe('TypeScript');
    });

    test('detects Rust', () => {
      writeFileSync(join(testDir, 'Cargo.toml'), '[package]');
      expect(detectLanguage(testDir)).toBe('Rust');
    });

    test('detects Go', () => {
      writeFileSync(join(testDir, 'go.mod'), 'module test');
      expect(detectLanguage(testDir)).toBe('Go');
    });

    test('falls back to JavaScript with package.json', () => {
      writePkg();
      expect(detectLanguage(testDir)).toBe('JavaScript');
    });
  });

  describe('detectProjectType', () => {
    test('detects CLI project', () => {
      writePkg({}, {}, { bin: { test: 'dist/cli.js' } });
      expect(detectProjectType(testDir)).toBe('cli');
    });

    test('detects library', () => {
      writePkg({}, {}, { main: 'dist/index.js' });
      expect(detectProjectType(testDir)).toBe('library');
    });

    test('detects frontend', () => {
      writePkg({ react: '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('frontend');
    });

    test('detects backend', () => {
      writePkg({ express: '^4.0.0' });
      expect(detectProjectType(testDir)).toBe('backend');
    });

    test('detects fullstack', () => {
      writePkg({ react: '^18.0.0', express: '^4.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('detects Next.js as fullstack', () => {
      writePkg({ next: '^16.0.0', react: '^19.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('detects Nuxt as fullstack', () => {
      writePkg({ nuxt: '^3.0.0', vue: '^3.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });
  });

  describe('detectRuntime', () => {
    test('detects Bun', () => {
      writePkg();
      writeFileSync(join(testDir, 'bunfig.toml'), '');
      expect(detectRuntime(testDir)).toBe('Bun');
    });

    test('detects Node.js', () => {
      writePkg();
      expect(detectRuntime(testDir)).toBe('Node.js');
    });
  });

  describe('detectPackageManager', () => {
    test('detects npm', () => {
      writeFileSync(join(testDir, 'package-lock.json'), '{}');
      expect(detectPackageManager(testDir)).toBe('npm');
    });

    test('detects pnpm', () => {
      writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');
      expect(detectPackageManager(testDir)).toBe('pnpm');
    });

    test('detects yarn', () => {
      writeFileSync(join(testDir, 'yarn.lock'), '');
      expect(detectPackageManager(testDir)).toBe('yarn');
    });

    test('defaults to npm', () => {
      expect(detectPackageManager(testDir)).toBe('npm');
    });
  });

  describe('detectCicd', () => {
    test('detects GitHub Actions', () => {
      mkdirSync(join(testDir, '.github/workflows'), { recursive: true });
      expect(detectCicd(testDir)).toBe('GitHub Actions');
    });

    test('returns null when none', () => {
      expect(detectCicd(testDir)).toBeNull();
    });
  });

  describe('detectHosting', () => {
    test('detects Vercel', () => {
      writeFileSync(join(testDir, 'vercel.json'), '{}');
      expect(detectHosting(testDir)).toBe('Vercel');
    });

    test('detects Docker', () => {
      writeFileSync(join(testDir, 'Dockerfile'), 'FROM node');
      expect(detectHosting(testDir)).toBe('Docker');
    });
  });

  describe('detectBuildTool', () => {
    test('detects Vite', () => {
      writePkg({}, { vite: '^5.0.0' });
      expect(detectBuildTool(testDir)).toBe('Vite');
    });

    test('detects TypeScript', () => {
      writePkg({}, { typescript: '^5.0.0' });
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      expect(detectBuildTool(testDir)).toBe('TypeScript (tsc)');
    });
  });
});
