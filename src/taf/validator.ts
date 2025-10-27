/**
 * TAF Validator - MCP-portable validation logic
 *
 * Pure validation functions with no external dependencies
 * Ready for MCP extraction
 */

import { TAFFile, TAFValidationResult, TestRun } from './types';

/**
 * Validate TAF file structure and content
 * MCP-portable: pure function
 */
export function validateTAF(taf: TAFFile): TAFValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!taf.format_version) {
    errors.push('Missing required field: format_version');
  } else if (taf.format_version !== '1.0.0') {
    warnings.push(`Unknown format_version: ${taf.format_version}`);
  }

  if (!taf.project) {
    errors.push('Missing required field: project');
  }

  if (!taf.created) {
    errors.push('Missing required field: created');
  } else if (!isValidISO8601(taf.created)) {
    errors.push(`Invalid ISO8601 timestamp: created = ${taf.created}`);
  }

  if (taf.last_updated && !isValidISO8601(taf.last_updated)) {
    errors.push(`Invalid ISO8601 timestamp: last_updated = ${taf.last_updated}`);
  }

  // FAF integration fields
  if (taf.faf_associated === true) {
    if (!taf.faf_location) {
      warnings.push('faf_associated is true but faf_location not specified');
    }
    if (taf.faf_score !== undefined && (taf.faf_score < 0 || taf.faf_score > 100)) {
      errors.push(`Invalid faf_score: ${taf.faf_score} (must be 0-100)`);
    }
  }

  // Test history
  if (!taf.test_history) {
    errors.push('Missing required field: test_history');
  } else if (!Array.isArray(taf.test_history)) {
    errors.push('test_history must be an array');
  } else {
    taf.test_history.forEach((run, index) => {
      const runErrors = validateTestRun(run, index);
      errors.push(...runErrors);
    });

    // Check chronological order
    for (let i = 1; i < taf.test_history.length; i++) {
      const prev = new Date(taf.test_history[i - 1].timestamp);
      const curr = new Date(taf.test_history[i].timestamp);
      if (curr < prev) {
        warnings.push(`Test run ${i} timestamp is before previous run (not chronological)`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate individual test run
 * MCP-portable: pure function
 */
function validateTestRun(run: TestRun, index: number): string[] {
  const errors: string[] = [];

  if (!run.timestamp) {
    errors.push(`Test run ${index}: missing timestamp`);
  } else if (!isValidISO8601(run.timestamp)) {
    errors.push(`Test run ${index}: invalid ISO8601 timestamp`);
  }

  if (!run.result) {
    errors.push(`Test run ${index}: missing result`);
  } else if (!['PASSED', 'FAILED', 'IMPROVED', 'DEGRADED'].includes(run.result)) {
    errors.push(`Test run ${index}: invalid result "${run.result}"`);
  }

  if (!run.tests) {
    errors.push(`Test run ${index}: missing tests field`);
  } else {
    if (typeof run.tests.total !== 'number' || run.tests.total < 0) {
      errors.push(`Test run ${index}: invalid tests.total`);
    }
    if (typeof run.tests.passed !== 'number' || run.tests.passed < 0) {
      errors.push(`Test run ${index}: invalid tests.passed`);
    }
    if (typeof run.tests.failed !== 'number' || run.tests.failed < 0) {
      errors.push(`Test run ${index}: invalid tests.failed`);
    }

    // Check consistency
    const sum = run.tests.passed + run.tests.failed + (run.tests.skipped || 0);
    if (sum !== run.tests.total) {
      errors.push(`Test run ${index}: tests counts don't add up (${sum} !== ${run.tests.total})`);
    }
  }

  if (run.suites) {
    if (typeof run.suites.total !== 'number' || run.suites.total < 0) {
      errors.push(`Test run ${index}: invalid suites.total`);
    }
    if (typeof run.suites.passed !== 'number' || run.suites.passed < 0) {
      errors.push(`Test run ${index}: invalid suites.passed`);
    }
    if (typeof run.suites.failed !== 'number' || run.suites.failed < 0) {
      errors.push(`Test run ${index}: invalid suites.failed`);
    }
  }

  if (run.duration_ms !== undefined && (typeof run.duration_ms !== 'number' || run.duration_ms < 0)) {
    errors.push(`Test run ${index}: invalid duration_ms`);
  }

  return errors;
}

/**
 * Validate ISO8601 timestamp format
 * MCP-portable: pure function
 */
function isValidISO8601(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    // Check if it's a valid date and roughly ISO8601 format
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp);
  } catch {
    return false;
  }
}

/**
 * Quick validation check (for MCP tools)
 * Returns true if .taf file is valid, false otherwise
 */
export function isTAFValid(taf: TAFFile): boolean {
  const result = validateTAF(taf);
  return result.valid;
}
