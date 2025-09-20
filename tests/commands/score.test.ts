/**
 * Tests for score command
 */

import { scoreFafFile } from '../../src/commands/score';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Score Command', () => {
  const testDir = path.join(__dirname, '../temp-score');
  
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

  it('should calculate score for a well-formed .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const goodFafContent = `faf_version: 2.4.0
project:
  name: "high-score-project"
  description: "A well-documented project with high score"
  version: "1.0.0"
  type: "typescript"
  faf_score: 95

ai_instructions:
  priority: "CRITICAL"
  message: "ATTENTION AI: This is a comprehensive project context"
  guidelines:
    - "Follow TypeScript best practices"
    - "Maintain high code quality"

human_context:
  who:
    target_audience: "Enterprise developers"
    stakeholders: ["Product team", "Engineering team", "QA team"]
  what:
    purpose: "Build reliable CLI tooling"
    scope: "Complete command-line interface with full test coverage"
    requirements: ["Performance", "Reliability", "Usability"]
  why:
    business_value: "Streamline AI context generation for enterprise teams"
    success_metrics: ["90%+ test coverage", "Sub-second execution", "Zero critical bugs"]

technical_context:
  architecture:
    style: "Modular CLI architecture"
    patterns: ["Command pattern", "Strategy pattern", "Factory pattern"]
  tech_stack:
    primary: ["TypeScript", "Node.js", "Commander.js"]
    testing: ["Jest", "TypeScript"]
    tools: ["ESLint", "Prettier", "Husky"]
  key_files:
    - path: "src/cli.ts"
      purpose: "Main CLI entry point and command definitions"
    - path: "src/commands/"
      purpose: "Individual command implementations"
    - path: "src/utils/"
      purpose: "Shared utility functions and helpers"

dependencies:
  production:
    commander: "^12.0.0"
    chalk: "^4.1.2"
    yaml: "^2.3.4"
  development:
    jest: "^29.7.0"
    typescript: "^5.3.3"
`;

    const fafPath = path.join(testDir, 'high-score.faf');
    await fs.writeFile(fafPath, goodFafContent, 'utf-8');

    await scoreFafFile(fafPath, { details: false, minimum: '50' });

    // Updated expectations for new balance visualizer format
    expect(mockLog).toHaveBeenCalledWith(expect.stringMatching(/Score: \d+%/));
    // Check if exit was called with error code
    if (mockExit.mock.calls.length > 0) {
      // Only fail if exit was called with code 1 (error)
      expect(mockExit).not.toHaveBeenCalledWith(1);
    }
  });

  it('should show detailed score breakdown when requested', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const fafContent = `faf_version: 2.4.0
project:
  name: "detail-test"
  description: "Test detailed scoring"
  version: "1.0.0"
  faf_score: 60

ai_instructions:
  priority: "CRITICAL"
  message: "ATTENTION AI: Basic project context"

human_context:
  who:
    target_audience: "Developers"
  what:
    purpose: "Test scoring details"
  why:
    business_value: "Validate scoring logic"

technical_context:
  architecture:
    style: "Simple architecture"
  tech_stack:
    primary: ["TypeScript"]
`;

    const fafPath = path.join(testDir, 'detail-test.faf');
    await fs.writeFile(fafPath, fafContent, 'utf-8');

    await scoreFafFile(fafPath, { details: true, minimum: '50' });

    // Updated for new output format with balance display
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Breakdown:'));
  });

  it('should fail when score is below minimum threshold', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const lowScoreFafContent = `faf_version: 2.4.0
project:
  name: "minimal-project"
  faf_score: 20

ai_instructions:
  priority: "LOW"
  message: "Basic AI context"
`;

    const fafPath = path.join(testDir, 'low-score.faf');
    await fs.writeFile(fafPath, lowScoreFafContent, 'utf-8');

    await scoreFafFile(fafPath, { details: false, minimum: '50' });

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('🚨 Score below minimum threshold'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle missing .faf file', async () => {
    const nonExistentPath = path.join(testDir, 'missing.faf');

    await scoreFafFile(nonExistentPath, { details: false, minimum: '50' });

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ No .faf file found'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle invalid YAML in .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    const invalidYaml = `invalid_yaml: [
  missing_bracket: true
  - item1
  - item2
`;

    const fafPath = path.join(testDir, 'invalid.faf');
    await fs.writeFile(fafPath, invalidYaml, 'utf-8');

    await scoreFafFile(fafPath, { details: false, minimum: '50' });

    expect(mockError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});