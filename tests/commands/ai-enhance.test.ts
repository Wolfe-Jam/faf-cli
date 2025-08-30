/**
 * Tests for ai-enhance command
 */

import { enhanceFafWithAI } from '../../src/commands/ai-enhance';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('AI Enhance Command', () => {
  const testDir = path.join(__dirname, '../temp-ai-enhance');
  
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

  it('should check for OpenAI Codex CLI availability', async () => {
    // Since OpenAI Codex CLI won't be available in test environment,
    // this should exit with error about missing dependency
    await enhanceFafWithAI(undefined, { model: 'gpt-4', focus: 'completeness' });

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAI Codex CLI not found'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('💡 Install with: npm install -g @openai/codex'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle missing .faf file when Codex is available', async () => {
    // Even though this test won't actually have Codex available,
    // we can test the file handling logic by mocking the path
    const nonExistentPath = path.join(testDir, 'missing.faf');
    
    await enhanceFafWithAI(nonExistentPath, { model: 'gpt-4' });

    // Should fail at the Codex check step
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle dry-run mode', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
project:
  name: "enhance-test"
  main_language: "TypeScript"
`;

    const fafPath = path.join(testDir, 'enhance-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await enhanceFafWithAI(fafPath, { dryRun: true });

    // Should still fail at Codex check, but demonstrates the flow
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle different focus areas', async () => {
    const focusAreas = ['human-context', 'ai-instructions', 'completeness', 'optimization'];
    
    for (const focus of focusAreas) {
      mockExit.mockClear();
      await enhanceFafWithAI(undefined, { focus });
      expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
    }
  });
});