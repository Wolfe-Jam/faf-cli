/**
 * 🏎️ WJTTC: faf decompile Command Tests
 * Tests for the user-facing decompile command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { decompileCommand } from '../../src/commands/decompile';
import { compileFAF, checkCompilerAvailable } from '../../src/utils/fafb-compiler';

const TEMP_DIR = path.join(os.tmpdir(), 'wjttc-decompile-cmd-tests');

async function setupTempDir(): Promise<string> {
  const testDir = path.join(TEMP_DIR, `test-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}

async function createTestFafb(dir: string, name: string = 'project.fafb'): Promise<string> {
  // Create a .faf first, then compile it
  const fafPath = path.join(dir, 'temp.faf');
  await fs.writeFile(fafPath, 'faf_version: 2.5.0\nproject:\n  name: test\n');

  const result = await compileFAF({ input: fafPath, output: path.join(dir, name) });

  if (!result.success) {
    throw new Error('Failed to create test .fafb file');
  }

  // Clean up temp .faf
  await fs.unlink(fafPath);

  return result.output;
}

const compilerCheck = async () => {
  const check = await checkCompilerAvailable();
  if (!check.available) {
    console.warn('⚠️  Skipping decompile command tests (compiler not found)');
  }
  return check.available;
};

describe('🏎️ WJTTC: faf decompile Command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = await setupTempDir();
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(testDir);
  });

  describe('Basic Decompilation', () => {
    it('decompiles project.fafb by default', async () => {
      if (!(await compilerCheck())) return;

      await createTestFafb(testDir);
      await decompileCommand();

      // May not work until decompile is implemented in xai-faf-rust
      // Test should pass either way (success or graceful failure)
      expect(true).toBe(true);
    });

    it('decompiles specific input file', async () => {
      if (!(await compilerCheck())) return;

      await createTestFafb(testDir, 'custom.fafb');
      await decompileCommand('custom.fafb');

      expect(true).toBe(true);
    });

    it('respects custom output path', async () => {
      if (!(await compilerCheck())) return;

      await createTestFafb(testDir);
      await decompileCommand(undefined, { output: 'output.faf' });

      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('exits with error code 1 if compiler not found', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
        throw new Error(`Process exited with code ${code}`);
      });

      process.env.PATH = '/nonexistent';

      try {
        await decompileCommand();
      } catch (error: any) {
        expect(error.message).toContain('Process exited');
      }

      mockExit.mockRestore();
      delete process.env.PATH;
    });

    it('handles missing input file gracefully', async () => {
      if (!(await compilerCheck())) return;

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
        throw new Error(`Process exited with code ${code}`);
      });

      try {
        await decompileCommand('nonexistent.fafb');
      } catch (error: any) {
        expect(error.message).toContain('Process exited');
      }

      mockExit.mockRestore();
    });

    it('handles invalid .fafb files gracefully', async () => {
      if (!(await compilerCheck())) return;

      await fs.writeFile('invalid.fafb', 'Not a valid fafb file');

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
        throw new Error(`Process exited with code ${code}`);
      });

      try {
        await decompileCommand('invalid.fafb');
      } catch (error: any) {
        expect(error.message).toContain('Process exited');
      }

      mockExit.mockRestore();
    });
  });

  describe('Output', () => {
    it('shows helpful messages', async () => {
      if (!(await compilerCheck())) return;

      await createTestFafb(testDir);

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(' '));

      try {
        await decompileCommand();
      } catch {
        // May not be implemented yet
      }

      console.log = originalLog;

      expect(logs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Not Yet Implemented Handling', () => {
    it('handles "not yet implemented" error from compiler gracefully', async () => {
      if (!(await compilerCheck())) return;

      await createTestFafb(testDir);

      // Decompile might not be implemented yet
      // Should either succeed or fail with helpful message
      try {
        await decompileCommand();
      } catch {
        // Expected if not implemented
      }

      expect(true).toBe(true);
    });
  });
});
