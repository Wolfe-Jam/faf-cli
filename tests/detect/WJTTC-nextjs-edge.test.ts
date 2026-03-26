/**
 * WJTTC — Next.js Edge Case Tests
 * Championship-Grade: When brakes must work flawlessly, so must our detection.
 *
 * TIER 1 (BRAKE): Project type detection — wrong type = wrong slots = wrong score
 * TIER 2 (ENGINE): Framework detection signals — missed framework = missed context
 * TIER 3 (AERO): Stack detection accuracy — hosting, build, runtime
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectFrameworks,
  detectProjectType,
  detectHosting,
  detectBuildTool,
  detectRuntime,
  detectPackageManager,
} from '../../src/detect/scanner.js';

describe('WJTTC — Next.js Edge Cases', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-wjttc-nextjs-${Date.now()}`);
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

  // ═══════════════════════════════════════════════════════════════
  // TIER 1: BRAKE — Project Type Detection
  // Wrong type = wrong slotignored = wrong score. Critical.
  // ═══════════════════════════════════════════════════════════════

  describe('TIER 1 BRAKE — Next.js project type', () => {
    test('Next.js 16 with react → fullstack', () => {
      writePkg({ next: '^16.2.0', react: '^19.0.0', 'react-dom': '^19.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js 15 with react → fullstack', () => {
      writePkg({ next: '^15.0.0', react: '^18.0.0', 'react-dom': '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js 14 (App Router era) → fullstack', () => {
      writePkg({ next: '^14.0.0', react: '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js 13 (Pages Router) → fullstack', () => {
      writePkg({ next: '^13.0.0', react: '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js detected by next.config.js only (no deps) → fullstack', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.js'), 'module.exports = {}');
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js detected by next.config.mjs → fullstack', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.mjs'), 'export default {}');
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js detected by next.config.ts → fullstack', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.ts'), 'export default {}');
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js with Express → still fullstack (not double-counted)', () => {
      writePkg({ next: '^16.0.0', react: '^19.0.0', express: '^4.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js with bin → cli takes priority', () => {
      writePkg({ next: '^16.0.0', react: '^19.0.0' }, {}, { bin: { mycli: 'dist/cli.js' } });
      expect(detectProjectType(testDir)).toBe('cli');
    });

    test('Nuxt 3 with Vue → fullstack', () => {
      writePkg({ nuxt: '^3.0.0', vue: '^3.0.0' });
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Nuxt detected by nuxt.config.ts → fullstack', () => {
      writePkg();
      writeFileSync(join(testDir, 'nuxt.config.ts'), 'export default {}');
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('React WITHOUT Next.js → frontend (not fullstack)', () => {
      writePkg({ react: '^18.0.0', 'react-dom': '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('frontend');
    });

    test('Vue WITHOUT Nuxt → frontend (not fullstack)', () => {
      writePkg({ vue: '^3.0.0' });
      expect(detectProjectType(testDir)).toBe('frontend');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: ENGINE — Framework Detection Signals
  // ═══════════════════════════════════════════════════════════════

  describe('TIER 2 ENGINE — Framework detection', () => {
    test('Next.js detected from dependency', () => {
      writePkg({ next: '^16.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
    });

    test('Next.js detected from next.config.js', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.js'), '');
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
    });

    test('Next.js detected from next.config.mjs', () => {
      writePkg();
      writeFileSync(join(testDir, 'next.config.mjs'), '');
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
    });

    test('Next.js + React both detected', () => {
      writePkg({ next: '^16.0.0', react: '^19.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
      expect(fws.some(f => f.slug === 'react')).toBe(true);
    });

    test('Next.js + Tailwind + shadcn detected together', () => {
      writePkg(
        { next: '^16.0.0', react: '^19.0.0' },
        { tailwindcss: '^4.0.0' }
      );
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nextjs')).toBe(true);
      expect(fws.some(f => f.slug === 'tailwind')).toBe(true);
    });

    test('Nuxt detected from dependency', () => {
      writePkg({ nuxt: '^3.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nuxt')).toBe(true);
    });

    test('Nuxt detected from nuxt.config.ts', () => {
      writePkg();
      writeFileSync(join(testDir, 'nuxt.config.ts'), '');
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'nuxt')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TIER 3: AERO — Stack Detection (hosting, build, runtime, pkg mgr)
  // ═══════════════════════════════════════════════════════════════

  describe('TIER 3 AERO — Stack detection for Next.js projects', () => {
    test('Vercel hosting detected from vercel.json', () => {
      writeFileSync(join(testDir, 'vercel.json'), '{}');
      expect(detectHosting(testDir)).toBe('Vercel');
    });

    test('Netlify hosting detected from netlify.toml', () => {
      writeFileSync(join(testDir, 'netlify.toml'), '');
      expect(detectHosting(testDir)).toBe('Netlify');
    });

    test('Docker hosting detected from Dockerfile', () => {
      writeFileSync(join(testDir, 'Dockerfile'), 'FROM node:20');
      expect(detectHosting(testDir)).toBe('Docker');
    });

    test('pnpm detected from pnpm-lock.yaml', () => {
      writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');
      expect(detectPackageManager(testDir)).toBe('pnpm');
    });

    test('yarn detected from yarn.lock', () => {
      writeFileSync(join(testDir, 'yarn.lock'), '');
      expect(detectPackageManager(testDir)).toBe('yarn');
    });

    test('Bun runtime detected from bunfig.toml', () => {
      writePkg();
      writeFileSync(join(testDir, 'bunfig.toml'), '');
      expect(detectRuntime(testDir)).toBe('Bun');
    });

    test('Node.js runtime as default', () => {
      writePkg();
      expect(detectRuntime(testDir)).toBe('Node.js');
    });

    test('TypeScript build detected', () => {
      writePkg({}, { typescript: '^5.0.0' });
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      expect(detectBuildTool(testDir)).toBe('TypeScript (tsc)');
    });

    test('Vite build detected over TypeScript', () => {
      writePkg({}, { vite: '^5.0.0', typescript: '^5.0.0' });
      expect(detectBuildTool(testDir)).toBe('Vite');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TIER 1 BRAKE — V0 App Edge Cases (real-world patterns)
  // ═══════════════════════════════════════════════════════════════

  describe('TIER 1 BRAKE — V0/Vercel app patterns', () => {
    test('V0 generated app (Next.js 16 + shadcn + motion)', () => {
      writePkg({
        next: '16.2.0',
        react: '19.2.4',
        'react-dom': '19.2.4',
        'motion': '^12.0.0',
        'lucide-react': '^0.564.0',
      }, {
        tailwindcss: '^4.2.0',
        typescript: '5.7.3',
      });
      writeFileSync(join(testDir, 'next.config.mjs'), 'export default {}');
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');

      expect(detectProjectType(testDir)).toBe('fullstack');
      expect(detectFrameworks(testDir).some(f => f.slug === 'nextjs')).toBe(true);
      expect(detectFrameworks(testDir).some(f => f.slug === 'tailwind')).toBe(true);
      expect(detectPackageManager(testDir)).toBe('pnpm');
    });

    test('Next.js app with Vercel deploy config', () => {
      writePkg({ next: '^16.0.0', react: '^19.0.0' });
      writeFileSync(join(testDir, 'vercel.json'), JSON.stringify({
        framework: 'nextjs',
        buildCommand: 'next build',
      }));

      expect(detectProjectType(testDir)).toBe('fullstack');
      expect(detectHosting(testDir)).toBe('Vercel');
    });

    test('Monorepo with Next.js app', () => {
      writePkg(
        { next: '^16.0.0', react: '^19.0.0', turbo: '^2.0.0' },
        {},
        { workspaces: ['apps/*', 'packages/*'] }
      );

      // Should still be fullstack, not get confused by monorepo
      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Next.js + Prisma (common fullstack pattern)', () => {
      writePkg({
        next: '^16.0.0',
        react: '^19.0.0',
        '@prisma/client': '^5.0.0',
      }, {
        prisma: '^5.0.0',
      });

      expect(detectProjectType(testDir)).toBe('fullstack');
    });

    test('Create Next App default (minimal deps)', () => {
      writePkg({
        next: '16.2.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      }, {
        '@types/node': '^22',
        '@types/react': '^19',
        typescript: '^5',
      });
      writeFileSync(join(testDir, 'next.config.ts'), 'export default {}');
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');

      expect(detectProjectType(testDir)).toBe('fullstack');
    });
  });
});
