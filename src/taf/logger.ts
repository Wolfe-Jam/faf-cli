/**
 * TAF Logger - MCP-portable test run logging
 *
 * Pure functions for appending test runs
 * Ready for MCP extraction
 */

import { TAFFile, TestRun, TestResult } from './types';

/**
 * Append a test run to TAF history
 * MCP-portable: pure function (immutable)
 */
export function appendTestRun(taf: TAFFile, run: TestRun): TAFFile {
  return {
    ...taf,
    last_updated: new Date().toISOString(),
    test_history: [...taf.test_history, run],
  };
}

/**
 * Create a minimal test run entry (Phase 1 Minimal Mode)
 * MCP-portable: pure function
 */
export function createMinimalRun(options: {
  result: TestResult;
  total: number;
  passed: number;
  failed: number;
  skipped?: number;
}): TestRun {
  return {
    timestamp: new Date().toISOString(),
    result: options.result,
    tests: {
      total: options.total,
      passed: options.passed,
      failed: options.failed,
      skipped: options.skipped,
    },
  };
}

/**
 * Create a detailed test run entry (Phase 1 Detailed Mode)
 * MCP-portable: pure function
 */
export function createDetailedRun(options: {
  run_id?: string;
  command?: string;
  trigger?: string;
  result: TestResult;
  suites?: {
    total: number;
    passed: number;
    failed: number;
  };
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped?: number;
  };
  duration_ms?: number;
  exit_code?: number;
  issues?: string[];
  root_cause?: string;
  resolution?: string;
  changes_since_last?: string[];
}): TestRun {
  return {
    timestamp: new Date().toISOString(),
    run_id: options.run_id,
    command: options.command,
    trigger: options.trigger,
    result: options.result,
    suites: options.suites,
    tests: options.tests,
    duration_ms: options.duration_ms,
    exit_code: options.exit_code,
    issues: options.issues,
    root_cause: options.root_cause,
    resolution: options.resolution,
    changes_since_last: options.changes_since_last,
  };
}

/**
 * Detect test result from test counts
 * MCP-portable: pure function
 */
export function detectResult(
  current: { passed: number; total: number },
  previous?: { passed: number; total: number }
): TestResult {
  if (current.passed === current.total) {
    return 'PASSED';
  }

  if (!previous) {
    return current.passed > 0 ? 'FAILED' : 'FAILED';
  }

  if (current.passed > previous.passed) {
    return 'IMPROVED';
  }

  if (current.passed < previous.passed) {
    return 'DEGRADED';
  }

  return 'FAILED';
}

/**
 * Calculate recovery info from previous run
 * MCP-portable: pure function
 */
export function calculateRecovery(
  currentRun: TestRun,
  previousRun?: TestRun
): TestRun {
  if (!previousRun || previousRun.result === 'PASSED') {
    return currentRun;
  }

  // Calculate time to fix
  const currentTime = new Date(currentRun.timestamp).getTime();
  const previousTime = new Date(previousRun.timestamp).getTime();
  const time_to_fix_minutes = Math.round((currentTime - previousTime) / 1000 / 60);

  return {
    ...currentRun,
    recovery: {
      previous_result: previousRun.result,
      time_to_fix_minutes,
      fix_summary: currentRun.resolution,
    },
  };
}

/**
 * Get last N test runs
 * MCP-portable: pure function
 */
export function getRecentRuns(taf: TAFFile, count: number): TestRun[] {
  return taf.test_history.slice(-count);
}

/**
 * Get test runs within time range
 * MCP-portable: pure function
 */
export function getRunsInRange(
  taf: TAFFile,
  startDate: Date,
  endDate: Date
): TestRun[] {
  return taf.test_history.filter(run => {
    const runDate = new Date(run.timestamp);
    return runDate >= startDate && runDate <= endDate;
  });
}

/**
 * Update FAF integration fields
 * MCP-portable: pure function
 */
export function updateFAFIntegration(
  taf: TAFFile,
  options: {
    faf_associated: boolean;
    faf_location?: string;
    faf_score?: number;
  }
): TAFFile {
  return {
    ...taf,
    last_updated: new Date().toISOString(),
    faf_associated: options.faf_associated,
    faf_location: options.faf_location,
    faf_score: options.faf_score,
  };
}
