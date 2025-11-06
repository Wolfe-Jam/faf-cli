/**
 * TAF (Testing Activity Feed) Core Types
 *
 * MCP-portable type definitions for .taf format
 * Used by: faf-cli, claude-faf-mcp, claude-taf-mcp (future)
 */

export interface TAFFile {
  format_version: string;
  project: string;
  created: string; // ISO8601
  last_updated?: string; // ISO8601

  // FAF Integration (Optional - Native Reference)
  faf_associated?: boolean;
  faf_location?: string;
  faf_score?: number;

  // Test execution history (append-only)
  test_history: TestRun[];
}

export interface TestRun {
  timestamp: string; // ISO8601
  run_id?: string;
  command?: string;
  trigger?: string;
  result: TestResult;

  // Test counts
  suites?: TestCounts;
  tests: TestCounts;

  // Performance
  duration_ms?: number;
  exit_code?: number;

  // Failure tracking
  issues?: string[];
  root_cause?: string;
  resolution?: string;

  // Change tracking
  changes_since_last?: string[];

  // Recovery tracking
  recovery?: RecoveryInfo;

  // Environment variance tracking
  environment?: EnvironmentInfo;
}

export interface TestCounts {
  total: number;
  passed: number;
  failed: number;
  skipped?: number;
}

export interface RecoveryInfo {
  previous_result?: TestResult;
  time_to_fix_minutes?: number;
  fix_summary?: string;
}

export interface EnvironmentInfo {
  variance?: EnvironmentVariance[];
  notes?: string;
}

export interface EnvironmentVariance {
  type: VarianceType;
  description: string;
  detected_at?: string; // ISO8601
}

export type VarianceType =
  | 'background_execution'  // Test running in background shell
  | 'unstable_cwd'          // Working directory changing during test
  | 'missing_dependencies'  // Required dependencies not found
  | 'parallel_execution'    // Tests running in parallel when sequential expected
  | 'resource_contention'   // System resources constrained
  | 'network_unavailable'   // Network-dependent tests without network
  | 'timing_sensitive'      // Race conditions or timing issues
  | 'other';                // Custom variance

export type TestResult = 'PASSED' | 'FAILED' | 'IMPROVED' | 'DEGRADED';

export interface TAFStats {
  total_runs: number;
  pass_rate: string; // "85%"
  health_score: string; // 🏆 🥇 🥈 🥉
  last_run?: string; // ISO8601
  current_streak: number; // consecutive passes
  longest_streak: number;
  total_failures: number;
  avg_recovery_time_minutes?: number;
}

export interface TAFValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TAFScoreContribution {
  taf_present: number; // +5
  taf_validated: number; // +5
  pass_rate_bonus: number; // +5 if >80%
  total: number; // up to +15
}
