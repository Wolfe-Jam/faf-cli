/**
 * Execution Context Engine Tests
 *
 * Tests for detecting and handling different execution contexts
 */

import {
  detectExecutionContext,
  canPromptInteractively,
  shouldReturnStructuredQuestions,
  isCI,
  getContextDescription,
  setExecutionContext,
  clearForcedContext,
  ExecutionContext,
  ExecutionContextInfo,
} from '../../src/engines/execution-context';

describe('Execution Context Engine', () => {
  // Save original env and restore after each test
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    clearForcedContext();
  });

  describe('detectExecutionContext', () => {
    it('should detect Claude Code context via CLAUDE_CODE env', () => {
      process.env.CLAUDE_CODE = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('claude-code');
      expect(ctx.interactive).toBe(false);
      expect(ctx.supportsAskUserQuestion).toBe(true);
      expect(ctx.detectedVia).toContain('env:CLAUDE_CODE');
    });

    it('should detect MCP server context', () => {
      process.env.MCP_SERVER = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('mcp-server');
      expect(ctx.interactive).toBe(false);
      expect(ctx.supportsAskUserQuestion).toBe(true);
    });

    it('should detect Cursor context', () => {
      process.env.CURSOR_EDITOR = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('cursor');
      expect(ctx.supportsAskUserQuestion).toBe(true);
    });

    it('should detect Gemini context', () => {
      process.env.GEMINI_CLI = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('gemini');
      expect(ctx.supportsAskUserQuestion).toBe(false); // Different pattern
    });

    it('should detect CI environment', () => {
      process.env.CI = 'true';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('terminal-script');
      expect(ctx.ci).toBe(true);
      expect(ctx.interactive).toBe(false);
    });

    it('should detect GitHub Actions', () => {
      // Clear CI marker that takes priority in the detection order
      delete process.env.CI;
      process.env.GITHUB_ACTIONS = 'true';
      const ctx = detectExecutionContext();

      expect(ctx.ci).toBe(true);
      expect(ctx.detectedVia).toContain('env:GITHUB_ACTIONS');
    });

    it('should prioritize MCP over Claude Code', () => {
      process.env.CLAUDE_CODE = '1';
      process.env.MCP_SERVER = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('mcp-server');
    });

    it('should detect API mode', () => {
      process.env.FAF_API_MODE = '1';
      const ctx = detectExecutionContext();

      expect(ctx.context).toBe('api');
      expect(ctx.supportsAskUserQuestion).toBe(false);
      expect(ctx.supportsColors).toBe(false);
    });
  });

  describe('helper functions', () => {
    it('canPromptInteractively returns false for Claude Code', () => {
      process.env.CLAUDE_CODE = '1';
      expect(canPromptInteractively()).toBe(false);
    });

    it('shouldReturnStructuredQuestions returns true for Claude Code', () => {
      process.env.CLAUDE_CODE = '1';
      expect(shouldReturnStructuredQuestions()).toBe(true);
    });

    it('shouldReturnStructuredQuestions returns true for MCP', () => {
      process.env.MCP_SERVER = '1';
      expect(shouldReturnStructuredQuestions()).toBe(true);
    });

    it('isCI returns true for CI environments', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('isCI returns false for Claude Code', () => {
      process.env.CLAUDE_CODE = '1';
      expect(isCI()).toBe(false);
    });
  });

  describe('getContextDescription', () => {
    it('describes Claude Code context', () => {
      process.env.CLAUDE_CODE = '1';
      expect(getContextDescription()).toBe('Claude Code');
    });

    it('describes MCP context', () => {
      process.env.MCP_SERVER = '1';
      expect(getContextDescription()).toBe('MCP Server');
    });

    it('describes CI context', () => {
      process.env.CI = 'true';
      expect(getContextDescription()).toBe('CI/CD pipeline');
    });

    it('describes Cursor context', () => {
      process.env.CURSOR_EDITOR = '1';
      expect(getContextDescription()).toBe('Cursor IDE');
    });
  });

  describe('setExecutionContext', () => {
    it('can force Claude Code context', () => {
      setExecutionContext('claude-code');
      expect(process.env.CLAUDE_CODE).toBe('1');

      const ctx = detectExecutionContext();
      expect(ctx.context).toBe('claude-code');
    });

    it('can force MCP context', () => {
      setExecutionContext('mcp-server');
      expect(process.env.MCP_SERVER).toBe('1');

      const ctx = detectExecutionContext();
      expect(ctx.context).toBe('mcp-server');
    });

    it('can force Cursor context', () => {
      setExecutionContext('cursor');
      const ctx = detectExecutionContext();
      expect(ctx.context).toBe('cursor');
    });
  });

  describe('clearForcedContext', () => {
    it('removes all forced context markers', () => {
      process.env.CLAUDE_CODE = '1';
      process.env.MCP_SERVER = '1';
      process.env.CURSOR_EDITOR = '1';

      clearForcedContext();

      expect(process.env.CLAUDE_CODE).toBeUndefined();
      expect(process.env.MCP_SERVER).toBeUndefined();
      expect(process.env.CURSOR_EDITOR).toBeUndefined();
    });
  });

  describe('TTY detection', () => {
    // Note: TTY tests are tricky because they depend on actual terminal state
    // These tests verify the detection reports TTY status

    it('includes tty status in detectedVia', () => {
      // Clear CI markers so detection reaches the TTY check (step 7)
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITLAB_CI;
      delete process.env.CIRCLECI;

      const ctx = detectExecutionContext();
      const hasTtyMarker = ctx.detectedVia.some(
        (v) => v === 'tty:true' || v === 'tty:false'
      );
      expect(hasTtyMarker).toBe(true);
    });
  });
});
