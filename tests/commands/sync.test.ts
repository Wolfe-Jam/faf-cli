/**
 * Tests for sync command
 */

import { syncFafFile } from '../../src/commands/sync';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Sync Command', () => {
  const testDir = path.join(__dirname, '../temp-sync');
  
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

  it('should attempt to sync a .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create package.json for sync to work with
    const packageJson = {
      name: "sync-test",
      version: "1.0.0",
      dependencies: {
        "express": "^4.18.0"
      }
    };
    
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const fafContent = `faf_version: 2.5.0
generated: "${new Date().toISOString()}"
project:
  name: "sync-test"
  main_language: "JavaScript"

scores:
  slot_based_percentage: 50
  faf_score: 50
  total_slots: 10
`;

    const fafPath = path.join(testDir, 'sync-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await syncFafFile(fafPath, { auto: false, dryRun: true });

    // The sync function should have been called and logged something
    expect(mockLog).toHaveBeenCalled();
  });

  it.skip('should handle missing .faf file', async () => {
    const nonExistentPath = path.join(testDir, 'missing.faf');

    await syncFafFile(nonExistentPath, { auto: false, dryRun: true });

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle auto sync mode', async () => {
    await fs.mkdir(testDir, { recursive: true });

    const packageJson = {
      name: "auto-sync-test",
      version: "1.0.0"
    };
    
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const fafContent = `faf_version: 2.5.0
project:
  name: "auto-sync-test"
  main_language: "JavaScript"
`;

    const fafPath = path.join(testDir, 'auto-sync.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await syncFafFile(fafPath, { auto: true, dryRun: false });

    // The sync function should have been called
    expect(mockLog).toHaveBeenCalled();
  });
});