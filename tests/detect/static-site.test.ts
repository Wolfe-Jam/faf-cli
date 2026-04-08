import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectProjectType, detectLanguage } from '../../src/detect/scanner.js';

describe('static-site detection', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-static-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('detectProjectType', () => {
    test('detects index.html as static-site', () => {
      writeFileSync(join(testDir, 'index.html'), '<html><body>Hello</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('detects index.htm as static-site', () => {
      writeFileSync(join(testDir, 'index.htm'), '<html><body>Hello</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('detects multi-page static site via 404.html', () => {
      writeFileSync(join(testDir, '404.html'), '<html><body>Not found</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('detects multi-page static site via about.html', () => {
      writeFileSync(join(testDir, 'about.html'), '<html><body>About</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('detects multi-page static site via contact.html', () => {
      writeFileSync(join(testDir, 'contact.html'), '<html><body>Contact</body></html>');
      expect(detectProjectType(testDir)).toBe('static-site');
    });

    test('does not detect static-site when no HTML files present', () => {
      writeFileSync(join(testDir, 'README.md'), '# My project');
      expect(detectProjectType(testDir)).not.toBe('static-site');
    });
  });

  describe('detectLanguage', () => {
    test('returns HTML for static site with index.html', () => {
      writeFileSync(join(testDir, 'index.html'), '<html><body>Hello</body></html>');
      expect(detectLanguage(testDir)).toBe('HTML');
    });

    test('returns HTML for static site with index.htm', () => {
      writeFileSync(join(testDir, 'index.htm'), '<html><body>Hello</body></html>');
      expect(detectLanguage(testDir)).toBe('HTML');
    });

    test('TypeScript takes priority over HTML when tsconfig present', () => {
      writeFileSync(join(testDir, 'index.html'), '<html><body>Hello</body></html>');
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      expect(detectLanguage(testDir)).toBe('TypeScript');
    });
  });
});
