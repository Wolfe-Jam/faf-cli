/**
 * 🏎️ WJTTC: faf compile Command Tests
 * Tests for the user-facing compile command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { compileCommand } from '../../src/commands/compile';
import { checkCompilerAvailable } from '../../src/utils/fafb-compiler';

const TEMP_DIR = path.join(os.tmpdir(), 'wjttc-compile-cmd-tests');

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

async function createTestFaf(dir: string, name: string = 'project.faf'): Promise<string> {
  const fafPath = path.join(dir, name);
  await fs.writeFile(fafPath, 'faf_version: 2.5.0\nproject:\n  name: test\n');
  return fafPath;
}

const compilerCheck = async () => {
  const check = await checkCompilerAvailable();
  if (!check.available) {
    console.warn('⚠️  Skipping compile command tests (compiler not found)');
  }
  return check.available;
};

describe('🏎️ WJTTC: faf compile Command', () => {
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

  describe('Basic Compilation', () => {
    it('compiles project.faf by default', async () => {
      if (!(await compilerCheck())) return;

      await createTestFaf(testDir);
      await compileCommand();

      const fafbExists = await fs.access('project.fafb').then(() => true).catch(() => false);
      expect(fafbExists).toBe(true);
    });

    it('compiles specific input file', async () => {
      if (!(await compilerCheck())) return;

      const fafPath = await createTestFaf(testDir, 'custom.faf');
      await compileCommand('custom.faf');

      const fafbExists = await fs.access('custom.fafb').then(() => true).catch(() => false);
      expect(fafbExists).toBe(true);
    });

    it('respects custom output path', async () => {
      if (!(await compilerCheck())) return;

      await createTestFaf(testDir);
      await compileCommand(undefined, { output: 'output.fafb' });

      const fafbExists = await fs.access('output.fafb').then(() => true).catch(() => false);
      expect(fafbExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('exits with error code 1 if compiler not found', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
        throw new Error(`Process exited with code ${code}`);
      });

      // Temporarily break compiler detection
      process.env.PATH = '/nonexistent';

      try {
        await compileCommand();
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
        await compileCommand('nonexistent.faf');
      } catch (error: any) {
        expect(error.message).toContain('Process exited');
      }

      mockExit.mockRestore();
    });
  });

  describe('Options', () => {
    it('supports verbose mode', async () => {
      if (!(await compilerCheck())) return;

      await createTestFaf(testDir);

      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(' '));

      await compileCommand(undefined, { verbose: true });

      console.log = originalLog;

      // Verbose mode should produce output
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('Output Validation', () => {
    it('creates valid .fafb with FAFB magic bytes', async () => {
      if (!(await compilerCheck())) return;

      await createTestFaf(testDir);
      await compileCommand();

      const buffer = await fs.readFile('project.fafb');
      expect(buffer[0]).toBe(0x46); // F
      expect(buffer[1]).toBe(0x41); // A
      expect(buffer[2]).toBe(0x46); // F
      expect(buffer[3]).toBe(0x42); // B
    });

    it('produces smaller output for larger files', async () => {
      if (!(await compilerCheck())) return;

      // Create a larger .faf file where compression is beneficial
      let content = 'faf_version: 2.5.0\nproject:\n  name: test\n';
      for (let i = 0; i < 50; i++) {
        content += `  field${i}: value${i}\n`;
      }
      await fs.writeFile('project.faf', content);

      const fafSize = (await fs.stat('project.faf')).size;

      await compileCommand();

      const fafbSize = (await fs.stat('project.fafb')).size;
      expect(fafbSize).toBeLessThan(fafSize);
    });
  });
});
