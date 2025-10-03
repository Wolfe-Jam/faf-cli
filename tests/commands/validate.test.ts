/**
 * Tests for validate command
 */

import { validateFafFile } from '../../src/commands/validate';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Validate Command', () => {
  const testDir = path.join(__dirname, '../temp-validate');
  
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

  it('should attempt to validate a .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const validFafContent = `faf_version: 2.5.0
generated: "${new Date().toISOString()}"
project:
  name: "test-project"
  main_language: "TypeScript"
  faf_score: 85

scores:
  slot_based_percentage: 85
  faf_score: 85
  total_slots: 20

ai_instructions:
  priority: "HIGH"
  usage: "Test usage instructions"
  message: "ATTENTION AI: This project is for testing validation functionality"

stack:
  frontend: "React"
  backend: "Node.js"
  runtime: "Node.js"
`;

    const fafPath = path.join(testDir, 'test.faf');
    await fs.writeFile(fafPath, validFafContent, 'utf-8');

    await validateFafFile(fafPath, { schema: 'latest', verbose: false });

    // The validation function should have been called and logged something
    expect(mockLog).toHaveBeenCalled();
  });

  it('should handle missing .faf file', async () => {
    const nonExistentPath = path.join(testDir, 'missing.faf');

    try {
      await validateFafFile(nonExistentPath, { schema: 'latest', verbose: false });
    } catch (error) {
      // Function might throw instead of calling process.exit
    }

    // Check if either error was logged OR exit was called
    const errorLogged = mockError.mock.calls.length > 0;
    const exitCalled = mockExit.mock.calls.length > 0;
    expect(errorLogged || exitCalled).toBe(true);
  });

  it('should handle invalid YAML', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const invalidFafContent = `invalid_yaml: [
  missing_closing_bracket: true
  - item1
  - item2
`;

    const fafPath = path.join(testDir, 'invalid.faf');
    await fs.writeFile(fafPath, invalidFafContent, 'utf-8');

    try {
      await validateFafFile(fafPath, { schema: 'latest', verbose: false });
    } catch (error) {
      // Function might throw instead of calling process.exit
    }

    // Check if either error was logged OR exit was called
    const errorLogged = mockError.mock.calls.length > 0;
    const exitCalled = mockExit.mock.calls.length > 0;
    expect(errorLogged || exitCalled).toBe(true);
  });
});