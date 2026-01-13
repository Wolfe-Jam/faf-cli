/**
 * 🏆 Tests for git command
 *
 * WJTTC Prize Asset: End-to-End Integration Tests
 */

import { gitCommand } from '../../src/commands/git';
import { promises as fs } from 'fs';
import * as path from 'path';
import { parse as parseYAML } from '../../src/fix-once/yaml';

// Mock console to capture output
const mockLog = jest.fn();
const mockError = jest.fn();

const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = mockLog;
  console.error = mockError;
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Skipped: GitHub API integration tests - run with --runInBand when network available
describe.skip('Git Command - Integration Tests', () => {
  const testDir = path.join(__dirname, '../temp-git');
  let originalCwd: string;

  beforeEach(async () => {
    mockLog.mockClear();
    mockError.mockClear();

    // Save original cwd before changing
    originalCwd = process.cwd();

    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    // CRITICAL: Restore original cwd BEFORE deleting testDir
    process.chdir(originalCwd);

    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  describe('Shorthand Resolution', () => {
    it('should resolve react shorthand', async () => {
      await gitCommand('react', { scan: true });

      // Check that .faf file was created
      const files = await fs.readdir(testDir);
      expect(files).toContain('react.faf');
    }, 30000); // 30s timeout for network

    it('should resolve svelte shorthand', async () => {
      await gitCommand('svelte', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files).toContain('svelte.faf');
    }, 30000);

    it('should resolve typescript shorthand', async () => {
      await gitCommand('typescript', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files).toContain('TypeScript.faf');
    }, 30000);
  });

  describe('owner/repo Format', () => {
    it('should handle owner/repo format', async () => {
      await gitCommand('facebook/react', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files).toContain('react.faf');
    }, 30000);

    it('should handle owner/repo with hyphens', async () => {
      await gitCommand('n8n-io/n8n', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files).toContain('n8n.faf');
    }, 30000);
  });

  describe('Output Flag (-o)', () => {
    it('should respect -o flag for single repo', async () => {
      await gitCommand('react', { scan: true, o: 'custom-output.faf' });

      const files = await fs.readdir(testDir);
      expect(files).toContain('custom-output.faf');
    }, 30000);

    it('should respect --output flag for single repo', async () => {
      await gitCommand('react', { scan: true, output: 'my-react.faf' });

      const files = await fs.readdir(testDir);
      expect(files).toContain('my-react.faf');
    }, 30000);

    it('should handle nested paths', async () => {
      await fs.mkdir(path.join(testDir, 'nested'), { recursive: true });
      await gitCommand('react', { scan: true, o: 'nested/react.faf' });

      const filePath = path.join(testDir, 'nested', 'react.faf');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }, 30000);
  });

  describe('.faf File Content Validation', () => {
    it('should generate valid YAML', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');

      // Should parse without errors
      expect(() => parseYAML(content)).not.toThrow();
    }, 30000);

    it('should include version field', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.version).toBe('3.0');
    }, 30000);

    it('should include metadata fields', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.owner).toBe('facebook');
      expect(parsed.metadata.repository).toBe('react');
      expect(parsed.metadata.url).toBe('https://github.com/facebook/react');
    }, 30000);

    it('should include quality scoring', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.quality).toBeDefined();
      expect(parsed.quality.score).toBeGreaterThan(0);
      expect(parsed.quality.tier).toBeDefined();
    }, 30000);

    it('should include stack detection', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.stack).toBeDefined();
      expect(Array.isArray(parsed.stack.detected)).toBe(true);
    }, 30000);

    it('should include generated_by metadata', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      expect(parsed.generated_by).toBeDefined();
      expect(parsed.generated_by.tool).toBe('faf-cli');
      expect(parsed.generated_by.command).toBe('faf git');
    }, 30000);

    it('should include human-readable header', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');

      expect(content).toContain('# GITHUB REPOSITORY SUMMARY');
      expect(content).toContain('# Repository: facebook/react');
      expect(content).toContain('# URL: https://github.com/facebook/react');
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should show error for invalid repo', async () => {
      await gitCommand('wolfejam/totally-fake-repo-xyz-123', { scan: true });

      // Should have logged error message
      const errorCalls = mockLog.mock.calls.flat().join(' ');
      expect(errorCalls).toContain('not found');
    }, 30000);

    it('should show usage when no query provided', async () => {
      await gitCommand(undefined, {});

      const logCalls = mockLog.mock.calls.flat().join(' ');
      expect(logCalls).toContain('Usage:');
    });

    it('should handle network errors gracefully', async () => {
      // Test with invalid URL format that will fail early
      await gitCommand('not a valid query at all!!!', { scan: true });

      // Should not crash, should show helpful message
      expect(mockLog).toHaveBeenCalled();
    }, 30000);
  });

  describe('--scan Flag', () => {
    it('should skip file tree with --scan', async () => {
      await gitCommand('react', { scan: true });

      const content = await fs.readFile(path.join(testDir, 'react.faf'), 'utf-8');
      const parsed = parseYAML(content);

      // With --scan, file tree should be minimal or empty
      expect(parsed.structure.total_files).toBe(0);
    }, 30000);
  });

  describe('--list Flag', () => {
    it('should show popular repos with --list', async () => {
      await gitCommand(undefined, { list: true });

      const logCalls = mockLog.mock.calls.flat().join(' ');
      expect(logCalls).toContain('Popular'); // Or similar heading
    });

    it('should filter by category with --list --category', async () => {
      await gitCommand(undefined, { list: true, category: 'framework' });

      const logCalls = mockLog.mock.calls.flat().join(' ');
      // Should show framework-specific repos
      expect(logCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Championship Edge Cases', () => {
    it('should handle repos with dots in name', async () => {
      await gitCommand('vercel/next.js', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files.some(f => f.includes('next.js'))).toBe(true);
    }, 30000);

    it('should handle repos with numbers', async () => {
      await gitCommand('n8n', { scan: true });

      const files = await fs.readdir(testDir);
      expect(files).toContain('n8n.faf');
    }, 30000);

    it('should handle case variations in shorthand', async () => {
      // REACT should not match (case sensitive)
      await gitCommand('REACT', { scan: true });

      const logCalls = mockLog.mock.calls.flat().join(' ');
      // Should show "not found" or suggest alternatives
      expect(logCalls.length).toBeGreaterThan(0);
    }, 30000);

    it('should not crash on empty output path', async () => {
      await expect(async () => {
        await gitCommand('react', { scan: true, o: '' });
      }).not.toThrow();
    }, 30000);

    it('should handle concurrent extractions', async () => {
      // This tests that multiple simultaneous calls don't interfere
      const promises = [
        gitCommand('react', { scan: true }),
        gitCommand('svelte', { scan: true })
      ];

      await Promise.all(promises);

      const files = await fs.readdir(testDir);
      expect(files).toContain('react.faf');
      expect(files).toContain('svelte.faf');
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    it('should extract metadata in < 5 seconds', async () => {
      const start = Date.now();
      await gitCommand('react', { scan: true });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    }, 30000);

    it('should handle list command quickly', async () => {
      const start = Date.now();
      await gitCommand(undefined, { list: true });
      const duration = Date.now() - start;

      // List is instant (no network)
      expect(duration).toBeLessThan(1000);
    });
  });
});
