/**
 * Tests for audit command
 */

import { auditFafFile } from '../../src/commands/audit';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Audit Command', () => {
  const testDir = path.join(__dirname, '../temp-audit');
  
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

  it('should attempt to audit a .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
generated: "${new Date().toISOString()}"
project:
  name: "audit-test"
  main_language: "TypeScript"

scores:
  slot_based_percentage: 70
  faf_score: 70
  total_slots: 20

stack:
  runtime: "Node.js"
`;

    const fafPath = path.join(testDir, 'audit-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await auditFafFile(fafPath, { warnDays: '7', errorDays: '30' });

    // The audit function should have been called and logged something
    expect(mockLog).toHaveBeenCalled();
  });

  it('should handle missing .faf file', async () => {
    const nonExistentPath = path.join(testDir, 'missing.faf');

    await auditFafFile(nonExistentPath, { warnDays: '7', errorDays: '30' });

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});