/**
 * Tests for lint command
 */

import { lintFafFile } from '../../src/commands/lint';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Lint Command', () => {
  const testDir = path.join(__dirname, '../temp-lint');
  
  beforeEach(() => {
    mockLog.mockClear();
    mockError.mockClear();
    mockExit.mockClear();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  it('should attempt to lint a .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
generated: "${new Date().toISOString()}"
project:
  name: "lint-test"
  main_language: "TypeScript"

scores:
  slot_based_percentage: 60
  faf_score: 60
  total_slots: 15
`;

    const fafPath = path.join(testDir, 'lint-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await lintFafFile(fafPath, { fix: false, schemaVersion: 'latest' });

    // The lint function should have been called and logged something
    expect(mockLog).toHaveBeenCalled();
  });

  it('should handle missing .faf file', async () => {
    const nonExistentPath = path.join(testDir, 'missing.faf');

    await lintFafFile(nonExistentPath, { fix: false, schemaVersion: 'latest' });

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should attempt to fix issues when requested', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
project:
  name: "fix-test"
  main_language: "TypeScript"
`;

    const fafPath = path.join(testDir, 'fix-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await lintFafFile(fafPath, { fix: true, schemaVersion: 'latest' });

    // The lint function should have been called
    expect(mockLog).toHaveBeenCalled();
  });
});