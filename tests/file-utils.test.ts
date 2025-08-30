/**
 * Tests for file utility functions
 */

import { detectProjectType, fileExists } from '../src/utils/file-utils';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('File Utils', () => {
  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      const testFile = path.join(__dirname, '../package.json');
      const exists = await fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing files', async () => {
      const testFile = path.join(__dirname, 'non-existent-file.json');
      const exists = await fileExists(testFile);
      expect(exists).toBe(false);
    });
  });

  describe('detectProjectType', () => {
    it('should detect typescript projects', async () => {
      // Create temp directory with TypeScript config
      const tempDir = path.join(__dirname, '../temp-test-ts');
      await fs.mkdir(tempDir, { recursive: true });
      
      try {
        // Create tsconfig.json
        await fs.writeFile(
          path.join(tempDir, 'tsconfig.json'), 
          JSON.stringify({ compilerOptions: { target: 'ES2020' } })
        );
        
        const projectType = await detectProjectType(tempDir);
        expect(projectType).toBe('typescript');
      } finally {
        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should detect generic projects when no specific type found', async () => {
      // Create empty temp directory
      const tempDir = path.join(__dirname, '../temp-test-generic');
      await fs.mkdir(tempDir, { recursive: true });
      
      try {
        const projectType = await detectProjectType(tempDir);
        expect(projectType).toBe('latest-idea');
      } finally {
        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});