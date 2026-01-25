/**
 * FAF Execution Context Engine
 *
 * Detects the runtime context to enable context-aware behavior:
 * - Terminal interactive (human typing, TTY)
 * - Terminal script (CI/CD, piped input)
 * - Claude Code (running via Claude Code bash/MCP)
 * - MCP Server (direct MCP tool call)
 * - API (programmatic usage)
 *
 * This enables the "faf go" guided experience to work seamlessly
 * across all contexts, using inquirer in terminal and returning
 * structured questions for Claude Code's AskUserQuestion.
 *
 * @since v3.5.0
 */

/**
 * All possible execution contexts for FAF CLI
 */
export type ExecutionContext =
  | 'terminal-interactive'  // TTY, human typing
  | 'terminal-script'       // Non-TTY, CI/CD, piped
  | 'claude-code'           // Claude Code calling via bash/MCP
  | 'mcp-server'            // Direct MCP tool call
  | 'cursor'                // Cursor IDE agent
  | 'gemini'                // Gemini CLI context
  | 'api';                  // Programmatic API usage

/**
 * Detailed context information
 */
export interface ExecutionContextInfo {
  context: ExecutionContext;
  interactive: boolean;         // Can prompt for user input?
  supportsAskUserQuestion: boolean;  // Can return structured questions?
  supportsColors: boolean;      // ANSI colors supported?
  supportsEmoji: boolean;       // Emoji rendering supported?
  ci: boolean;                  // Running in CI/CD?
  detectedVia: string[];        // How was this detected?
  rawMode: boolean;             // Can use raw keyboard input?
}

/**
 * Environment variable markers for different contexts
 */
const CONTEXT_MARKERS = {
  // Claude Code markers
  claudeCode: [
    'CLAUDE_CODE',
    'CLAUDE_CODE_VERSION',
    'ANTHROPIC_API_KEY',  // Often present in Claude Code
  ],

  // MCP markers
  mcp: [
    'MCP_SERVER',
    'FAF_MCP_MODE',
    'CLAUDE_MCP_SERVER',
  ],

  // Cursor markers
  cursor: [
    'CURSOR_EDITOR',
    'CURSOR_SESSION_ID',
    'CURSOR_TRACE_ID',
  ],

  // Gemini markers
  gemini: [
    'GEMINI_CLI',
    'GOOGLE_GENAI_API_KEY',
    'GEMINI_API_KEY',
  ],

  // CI/CD markers
  ci: [
    'CI',
    'CONTINUOUS_INTEGRATION',
    'GITHUB_ACTIONS',
    'GITLAB_CI',
    'CIRCLECI',
    'TRAVIS',
    'JENKINS_URL',
    'BUILDKITE',
    'CODEBUILD_BUILD_ID',
    'BITBUCKET_BUILD_NUMBER',
  ],

  // API/programmatic markers
  api: [
    'FAF_API_MODE',
    'FAF_PROGRAMMATIC',
  ],
};

/**
 * Check if any environment variables from a list are set
 */
function hasEnvMarker(markers: string[]): string | null {
  for (const marker of markers) {
    if (process.env[marker]) {
      return marker;
    }
  }
  return null;
}

/**
 * Detect the current execution context
 *
 * Priority order (first match wins):
 * 1. Explicit MCP mode
 * 2. Explicit API mode
 * 3. Claude Code context
 * 4. Cursor context
 * 5. Gemini context
 * 6. CI/CD environment
 * 7. TTY check (interactive vs script)
 */
export function detectExecutionContext(): ExecutionContextInfo {
  const detectedVia: string[] = [];

  // 1. Check for explicit MCP mode
  const mcpMarker = hasEnvMarker(CONTEXT_MARKERS.mcp);
  if (mcpMarker) {
    detectedVia.push(`env:${mcpMarker}`);
    return {
      context: 'mcp-server',
      interactive: false,
      supportsAskUserQuestion: true,  // MCP can relay to Claude Code
      supportsColors: false,
      supportsEmoji: true,
      ci: false,
      detectedVia,
      rawMode: false,
    };
  }

  // 2. Check for explicit API mode
  const apiMarker = hasEnvMarker(CONTEXT_MARKERS.api);
  if (apiMarker) {
    detectedVia.push(`env:${apiMarker}`);
    return {
      context: 'api',
      interactive: false,
      supportsAskUserQuestion: false,
      supportsColors: false,
      supportsEmoji: false,
      ci: false,
      detectedVia,
      rawMode: false,
    };
  }

  // 3. Check for Claude Code context
  const claudeMarker = hasEnvMarker(CONTEXT_MARKERS.claudeCode);
  if (claudeMarker) {
    detectedVia.push(`env:${claudeMarker}`);
    return {
      context: 'claude-code',
      interactive: false,  // Can't prompt directly
      supportsAskUserQuestion: true,  // Can return structured questions
      supportsColors: true,  // Claude Code terminal supports colors
      supportsEmoji: true,
      ci: false,
      detectedVia,
      rawMode: false,
    };
  }

  // 4. Check for Cursor context
  const cursorMarker = hasEnvMarker(CONTEXT_MARKERS.cursor);
  if (cursorMarker) {
    detectedVia.push(`env:${cursorMarker}`);
    return {
      context: 'cursor',
      interactive: false,
      supportsAskUserQuestion: true,  // Cursor may support similar
      supportsColors: true,
      supportsEmoji: true,
      ci: false,
      detectedVia,
      rawMode: false,
    };
  }

  // 5. Check for Gemini context
  const geminiMarker = hasEnvMarker(CONTEXT_MARKERS.gemini);
  if (geminiMarker) {
    detectedVia.push(`env:${geminiMarker}`);
    return {
      context: 'gemini',
      interactive: false,
      supportsAskUserQuestion: false,  // Gemini has different patterns
      supportsColors: true,
      supportsEmoji: true,
      ci: false,
      detectedVia,
      rawMode: false,
    };
  }

  // 6. Check for CI/CD environment
  const ciMarker = hasEnvMarker(CONTEXT_MARKERS.ci);
  if (ciMarker) {
    detectedVia.push(`env:${ciMarker}`);
    return {
      context: 'terminal-script',
      interactive: false,
      supportsAskUserQuestion: false,
      supportsColors: true,  // Most CI supports colors
      supportsEmoji: true,
      ci: true,
      detectedVia,
      rawMode: false,
    };
  }

  // 7. Check TTY for interactive vs script
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  detectedVia.push(isTTY ? 'tty:true' : 'tty:false');

  if (isTTY) {
    return {
      context: 'terminal-interactive',
      interactive: true,
      supportsAskUserQuestion: false,  // Use inquirer instead
      supportsColors: true,
      supportsEmoji: true,
      ci: false,
      detectedVia,
      rawMode: true,
    };
  }

  // Default: non-interactive terminal script
  return {
    context: 'terminal-script',
    interactive: false,
    supportsAskUserQuestion: false,
    supportsColors: process.env.FORCE_COLOR !== '0',
    supportsEmoji: true,
    ci: false,
    detectedVia,
    rawMode: false,
  };
}

/**
 * Quick check: can we prompt the user interactively?
 */
export function canPromptInteractively(ctx?: ExecutionContextInfo): boolean {
  const context = ctx || detectExecutionContext();
  return context.interactive;
}

/**
 * Quick check: should we return structured questions for AI?
 */
export function shouldReturnStructuredQuestions(ctx?: ExecutionContextInfo): boolean {
  const context = ctx || detectExecutionContext();
  return context.supportsAskUserQuestion && !context.interactive;
}

/**
 * Quick check: is this a CI/CD environment?
 */
export function isCI(ctx?: ExecutionContextInfo): boolean {
  const context = ctx || detectExecutionContext();
  return context.ci;
}

/**
 * Get a human-readable description of the context
 */
export function getContextDescription(ctx?: ExecutionContextInfo): string {
  const context = ctx || detectExecutionContext();

  switch (context.context) {
    case 'terminal-interactive':
      return 'Interactive terminal (human)';
    case 'terminal-script':
      return context.ci ? 'CI/CD pipeline' : 'Non-interactive terminal';
    case 'claude-code':
      return 'Claude Code';
    case 'mcp-server':
      return 'MCP Server';
    case 'cursor':
      return 'Cursor IDE';
    case 'gemini':
      return 'Gemini CLI';
    case 'api':
      return 'Programmatic API';
    default:
      return 'Unknown context';
  }
}

/**
 * Log context detection for debugging
 */
export function logContextDetection(ctx?: ExecutionContextInfo): void {
  const context = ctx || detectExecutionContext();

  if (process.env.FAF_DEBUG) {
    console.error('[FAF Context Detection]');
    console.error(`  Context: ${context.context}`);
    console.error(`  Interactive: ${context.interactive}`);
    console.error(`  AskUserQuestion: ${context.supportsAskUserQuestion}`);
    console.error(`  Detected via: ${context.detectedVia.join(', ')}`);
  }
}

/**
 * Set execution context explicitly (for testing or forcing behavior)
 */
export function setExecutionContext(context: ExecutionContext): void {
  switch (context) {
    case 'claude-code':
      process.env.CLAUDE_CODE = '1';
      break;
    case 'mcp-server':
      process.env.MCP_SERVER = '1';
      break;
    case 'cursor':
      process.env.CURSOR_EDITOR = '1';
      break;
    case 'gemini':
      process.env.GEMINI_CLI = '1';
      break;
    case 'api':
      process.env.FAF_API_MODE = '1';
      break;
    // terminal-interactive and terminal-script depend on TTY, can't be forced via env
  }
}

/**
 * Clear forced execution context (for testing)
 */
export function clearForcedContext(): void {
  delete process.env.CLAUDE_CODE;
  delete process.env.MCP_SERVER;
  delete process.env.CURSOR_EDITOR;
  delete process.env.GEMINI_CLI;
  delete process.env.FAF_API_MODE;
  delete process.env.FAF_MCP_MODE;
}
