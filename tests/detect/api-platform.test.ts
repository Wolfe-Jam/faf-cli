import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectProjectType } from '../../src/detect/scanner.js';
import { APP_TYPE_CATEGORIES } from '../../src/core/slots.js';

describe('api-platform detection', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-api-platform-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('detectProjectType', () => {
    test('detects api/ + vercel.json as api-platform', () => {
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'endpoint.js'), 'export default function handler(req) {}');
      writeFileSync(join(testDir, 'vercel.json'), '{}');
      expect(detectProjectType(testDir)).toBe('api-platform');
    });

    test('detects api/ + index.html as api-platform', () => {
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'endpoint.js'), 'export default function handler(req) {}');
      writeFileSync(join(testDir, 'index.html'), '<html><body>App</body></html>');
      expect(detectProjectType(testDir)).toBe('api-platform');
    });

    test('detects api/ + wrangler.toml as api-platform', () => {
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'endpoint.js'), 'export default function handler(req) {}');
      writeFileSync(join(testDir, 'wrangler.toml'), 'name = "my-worker"');
      expect(detectProjectType(testDir)).toBe('api-platform');
    });

    test('detects api/ + wrangler.jsonc as api-platform', () => {
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'endpoint.js'), 'export default function handler(req) {}');
      writeFileSync(join(testDir, 'wrangler.jsonc'), '{}');
      expect(detectProjectType(testDir)).toBe('api-platform');
    });

    test('index.html WITHOUT api/ stays static-site', () => {
      writeFileSync(join(testDir, 'index.html'), '<html><body>Static</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('api/ alone without html or config does not trigger api-platform', () => {
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'endpoint.js'), 'export default function handler(req) {}');
      expect(detectProjectType(testDir)).not.toBe('api-platform');
    });

    test('FAF-Voice pattern: api/ + index.html + vercel.json = api-platform', () => {
      // Real-world: FAF-Voice has api/, index.html, vercel.json, package.json
      mkdirSync(join(testDir, 'api'));
      writeFileSync(join(testDir, 'api', 'voice-session.js'), 'export default async function handler(req) {}');
      writeFileSync(join(testDir, 'api', 'openai-voice-session.js'), 'export default async function handler(req) {}');
      writeFileSync(join(testDir, 'api', 'claude-chat.js'), 'export default async function handler(req) {}');
      writeFileSync(join(testDir, 'api', 'gemini-chat.js'), 'export default async function handler(req) {}');
      writeFileSync(join(testDir, 'index.html'), '<html><body>Nelly Never Forgets</body></html>');
      writeFileSync(join(testDir, 'vercel.json'), '{"buildCommand": null}');
      writeFileSync(join(testDir, 'package.json'), '{"name": "faf-voice", "version": "2.0.0"}');
      expect(detectProjectType(testDir)).toBe('api-platform');
    });
  });

  describe('slot categories', () => {
    test('api-platform has correct slot categories', () => {
      const categories = APP_TYPE_CATEGORIES['api-platform'];
      expect(categories).toBeDefined();
      expect(categories).toContain('project');
      expect(categories).toContain('frontend');
      expect(categories).toContain('backend');
      expect(categories).toContain('universal');
      expect(categories).toContain('human');
    });

    test('api-platform matches fullstack slot categories', () => {
      expect(APP_TYPE_CATEGORIES['api-platform']).toEqual(APP_TYPE_CATEGORIES['fullstack']);
    });
  });
});
