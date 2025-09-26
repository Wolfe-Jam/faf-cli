/**
 * Error handling wrapper for consistent error management
 * Provides clean error messages and telemetry
 */

import { log, error, OUTPUT_CONFIG } from './championship-style';
import { colors } from '../fix-once/colors';

export interface ErrorContext {
  command?: string;
  file?: string;
  operation?: string;
  details?: any;
}

/**
 * Standardized error handler
 */
export function handleError(err: any, context?: ErrorContext): void {
  // In quiet mode, only show critical errors
  if (OUTPUT_CONFIG.quiet && !isCriticalError(err)) {
    process.exit(1);
  }

  // Format error message based on environment
  const errorMessage = formatErrorMessage(err, context);

  if (!OUTPUT_CONFIG.quiet) {
    error(colors.error('─'.repeat(50)));
    error(colors.error('❌ ERROR'));
    error(colors.error('─'.repeat(50)));
  }

  error(errorMessage);

  if (OUTPUT_CONFIG.verbose && err.stack) {
    error(colors.secondary('\nStack trace:'));
    error(colors.secondary(err.stack));
  }

  // Log context if available
  if (context && !OUTPUT_CONFIG.quiet) {
    if (context.command) error(`Command: ${context.command}`);
    if (context.file) error(`File: ${context.file}`);
    if (context.operation) error(`Operation: ${context.operation}`);
  }

  // Exit with appropriate code
  const exitCode = getExitCode(err);
  process.exit(exitCode);
}

/**
 * Wrapper for async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (err) {
      handleError(err, {
        ...context,
        details: { args }
      });
    }
  }) as T;
}

/**
 * Wrapper for sync functions with error handling
 */
export function withSyncErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (err) {
      handleError(err, {
        ...context,
        details: { args }
      });
    }
  }) as T;
}

/**
 * Format error message based on error type
 */
function formatErrorMessage(err: any, context?: ErrorContext): string {
  // File not found
  if (err.code === 'ENOENT') {
    const file = err.path || context?.file || 'unknown file';
    return `File not found: ${file}`;
  }

  // Permission denied
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    const file = err.path || context?.file || 'unknown file';
    return `Permission denied: ${file}`;
  }

  // Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return `Network error: ${err.message}`;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return `Invalid JSON: ${err.message}`;
  }

  // FAF-specific errors
  if (err.message?.includes('FAF')) {
    return err.message;
  }

  // Default
  return err.message || 'An unexpected error occurred';
}

/**
 * Determine if error is critical (should show even in quiet mode)
 */
function isCriticalError(err: any): boolean {
  // Permission errors are critical
  if (err.code === 'EACCES' || err.code === 'EPERM') return true;

  // Out of memory/space
  if (err.code === 'ENOMEM' || err.code === 'ENOSPC') return true;

  // FAF corruption
  if (err.message?.includes('corrupt') || err.message?.includes('invalid format')) return true;

  return false;
}

/**
 * Get appropriate exit code for error type
 */
function getExitCode(err: any): number {
  // Standard POSIX codes
  if (err.code === 'ENOENT') return 2;  // File not found
  if (err.code === 'EACCES' || err.code === 'EPERM') return 126;  // Permission denied
  if (err.code === 'EINVAL') return 22;  // Invalid argument

  // FAF-specific codes
  if (err.message?.includes('score')) return 10;  // Scoring error
  if (err.message?.includes('sync')) return 11;   // Sync error
  if (err.message?.includes('trust')) return 12;  // Trust error

  return 1;  // General error
}

/**
 * Create a user-friendly error for common issues
 */
export function createUserError(message: string, suggestion?: string): Error {
  const err = new Error(message);
  if (suggestion) {
    err.message += `\n\n💡 Suggestion: ${suggestion}`;
  }
  return err;
}