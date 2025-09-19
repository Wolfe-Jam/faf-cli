/**
 * Tests for ai-analyze command
 */

import { analyzeFafWithAI } from '../../src/commands/ai-analyze';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('AI Analyze Command', () => {
  const testDir = path.join(__dirname, '../temp-ai-analyze');
  
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
    await analyzeFafWithAI(undefined, { model: 'chatgpt', focus: 'quality' });

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAI Codex CLI not found'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('💡 Install with: npm install -g @openai/codex'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle different focus areas', async () => {
    const focusAreas = ['completeness', 'quality', 'ai-readiness', 'human-context'];
    
    for (const focus of focusAreas) {
      mockExit.mockClear();
      await analyzeFafWithAI(undefined, { focus });
      expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
    }
  });

  it('should handle verbose and suggestions options', async () => {
    await analyzeFafWithAI(undefined, { verbose: true, suggestions: true });

    // Should fail at the Codex check step
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should attempt to analyze existing file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
project:
  name: "analyze-test"
  main_language: "TypeScript"

scores:
  slot_based_percentage: 40
  faf_score: 40
  total_slots: 10
`;

    const fafPath = path.join(testDir, 'analyze-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await analyzeFafWithAI(fafPath, { model: 'gpt-4' });

    // Should still fail at Codex check, but demonstrates the flow
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});