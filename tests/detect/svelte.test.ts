import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectFrameworks,
  detectProjectType,
  detectSvelteAdapter,
} from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';

describe('Svelte-aware context engine', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-svelte-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function writePkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}): void {
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'test-svelte-project',
      version: '1.0.0',
      dependencies: deps,
      devDependencies: devDeps,
    }));
  }

  function writeSvelteConfig(adapter: string): void {
    writeFileSync(join(testDir, 'svelte.config.js'), `
import adapter from '@sveltejs/adapter-${adapter}';
export default { kit: { adapter: adapter() } };
`);
  }

  // --- Project Type Detection ---

  describe('detectProjectType', () => {
    test('detects svelte type for SvelteKit projects', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      expect(detectProjectType(testDir)).toBe('svelte');
    });

    test('detects svelte type for Svelte-only projects', () => {
      writePkg({ svelte: '^5.0.0' });
      expect(detectProjectType(testDir)).toBe('svelte');
    });

    test('svelte type takes priority over frontend', () => {
      writePkg({ svelte: '^5.0.0', react: '^18.0.0' });
      expect(detectProjectType(testDir)).toBe('svelte');
    });
  });

  // --- Adapter Detection ---

  describe('detectSvelteAdapter', () => {
    test('detects adapter-vercel', () => {
      writeSvelteConfig('vercel');
      expect(detectSvelteAdapter(testDir)).toBe('Vercel');
    });

    test('detects adapter-node', () => {
      writeSvelteConfig('node');
      expect(detectSvelteAdapter(testDir)).toBe('Node');
    });

    test('detects adapter-static', () => {
      writeSvelteConfig('static');
      expect(detectSvelteAdapter(testDir)).toBe('Static');
    });

    test('detects adapter-cloudflare', () => {
      writeSvelteConfig('cloudflare');
      expect(detectSvelteAdapter(testDir)).toBe('Cloudflare');
    });

    test('detects adapter-netlify', () => {
      writeSvelteConfig('netlify');
      expect(detectSvelteAdapter(testDir)).toBe('Netlify');
    });

    test('detects adapter-auto', () => {
      writeSvelteConfig('auto');
      expect(detectSvelteAdapter(testDir)).toBe('Auto');
    });

    test('returns null when no svelte.config.js', () => {
      expect(detectSvelteAdapter(testDir)).toBeNull();
    });

    test('returns null when no adapter in config', () => {
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      expect(detectSvelteAdapter(testDir)).toBeNull();
    });
  });

  // --- Framework Detection ---

  describe('detectFrameworks', () => {
    test('detects SvelteKit with full confidence', () => {
      writePkg({ '@sveltejs/kit': '^2.0.0', svelte: '^5.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const fws = detectFrameworks(testDir);
      const sveltekit = fws.find(f => f.slug === 'sveltekit');
      expect(sveltekit).toBeDefined();
      expect(sveltekit!.confidence).toBe(1);
    });

    test('detects SvelteKit adapter as hosting signal', () => {
      writePkg(
        { '@sveltejs/kit': '^2.0.0', svelte: '^5.0.0' },
        { '@sveltejs/adapter-vercel': '^4.0.0' },
      );
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'adapter-vercel')).toBe(true);
    });

    test('detects Tailwind in Svelte project', () => {
      writePkg({ svelte: '^5.0.0' }, { tailwindcss: '^3.0.0' });
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'tailwind')).toBe(true);
    });
  });

  // --- Stack Detection (Smart Defaults) ---

  describe('detectStack — Svelte smart defaults', () => {
    test('sets state_management to Runes for SvelteKit', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.state_management).toBe('Runes');
    });

    test('sets backend to SvelteKit', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.backend).toBe('SvelteKit');
    });

    test('sets build to Vite', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.build).toBe('Vite');
    });

    test('sets api_type to Server Routes for SvelteKit', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.api_type).toBe('Server Routes');
    });

    test('sets hosting from adapter detection', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeSvelteConfig('vercel');
      const data = detectStack(testDir);
      expect(data.stack?.hosting).toBe('Vercel');
    });

    test('sets hosting from adapter-cloudflare', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeSvelteConfig('cloudflare');
      const data = detectStack(testDir);
      expect(data.stack?.hosting).toBe('Cloudflare');
    });

    test('detects Prisma database in Svelte project', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' }, { prisma: '^5.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.database).toBe('Prisma');
      expect(data.stack?.connection).toBe('Prisma');
    });

    test('leaves database empty when no ORM detected', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.database).toBe('');
    });

    test('detects Tailwind as css_framework', () => {
      writePkg({ svelte: '^5.0.0' }, { tailwindcss: '^3.0.0' });
      const data = detectStack(testDir);
      expect(data.stack?.css_framework).toBe('Tailwind CSS');
    });

    test('uses external state library when present over Runes default', () => {
      writePkg({ svelte: '^5.0.0', zustand: '^4.0.0' });
      const data = detectStack(testDir);
      expect(data.stack?.state_management).toBe('Zustand');
    });

    test('sets project type to svelte', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('svelte');
    });

    test('frontend slot shows SvelteKit', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      expect(data.stack?.frontend).toBe('SvelteKit');
    });

    test('activates all expected slot categories', () => {
      writePkg({ svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' });
      writeFileSync(join(testDir, 'svelte.config.js'), 'export default {}');
      const data = detectStack(testDir);
      // Enterprise slots should be slotignored
      expect(data.stack?.monorepo_tool).toBe('slotignored');
      expect(data.stack?.admin).toBe('slotignored');
      // Frontend/backend/universal should be active (not slotignored)
      expect(data.stack?.frontend).not.toBe('slotignored');
      expect(data.stack?.backend).not.toBe('slotignored');
      expect(data.stack?.build).not.toBe('slotignored');
    });
  });

  // --- Full Svelte project simulation ---

  describe('full SvelteKit project', () => {
    test('comprehensive SvelteKit + Tailwind + Vercel project', () => {
      writePkg(
        { svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' },
        { tailwindcss: '^3.0.0', '@sveltejs/adapter-vercel': '^4.0.0', vite: '^5.0.0', typescript: '^5.0.0' },
      );
      writeSvelteConfig('vercel');
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      mkdirSync(join(testDir, '.github/workflows'), { recursive: true });
      writeFileSync(join(testDir, '.github/workflows/ci.yml'), 'name: CI');

      const data = detectStack(testDir);

      expect(data.project?.type).toBe('svelte');
      expect(data.project?.main_language).toBe('TypeScript');
      expect(data.stack?.frontend).toBe('SvelteKit');
      expect(data.stack?.css_framework).toBe('Tailwind CSS');
      expect(data.stack?.state_management).toBe('Runes');
      expect(data.stack?.backend).toBe('SvelteKit');
      expect(data.stack?.api_type).toBe('Server Routes');
      expect(data.stack?.build).toBe('Vite');
      expect(data.stack?.hosting).toBe('Vercel');
      expect(data.stack?.cicd).toBe('GitHub Actions');
      expect(data.stack?.database).toBe('');
    });

    test('SvelteKit + Drizzle + Cloudflare project', () => {
      writePkg(
        { svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0', 'drizzle-orm': '^0.30.0' },
        { '@sveltejs/adapter-cloudflare': '^4.0.0' },
      );
      writeSvelteConfig('cloudflare');

      const data = detectStack(testDir);

      expect(data.stack?.hosting).toBe('Cloudflare');
      expect(data.stack?.database).toBe('Drizzle');
      expect(data.stack?.connection).toBe('Drizzle');
      expect(data.stack?.backend).toBe('SvelteKit');
    });
  });
});
