/**
 * TAF Stats Calculator - MCP-portable statistics
 *
 * Pure functions for calculating test statistics
 * Ready for MCP extraction
 */

import { TAFFile, TAFStats, TAFScoreContribution } from './types';

/**
 * Calculate statistics from TAF file
 * MCP-portable: pure function
 */
export function calculateStats(taf: TAFFile): TAFStats {
  const runs = taf.test_history;
  const total_runs = runs.length;

  if (total_runs === 0) {
    return {
      total_runs: 0,
      pass_rate: '0%',
      health_score: '🤍',
      current_streak: 0,
      longest_streak: 0,
      total_failures: 0,
    };
  }

  // Calculate pass rate
  const passes = runs.filter(r => r.result === 'PASSED').length;
  const pass_rate_decimal = passes / total_runs;
  const pass_rate = `${Math.round(pass_rate_decimal * 100)}%`;

  // Calculate health score (podium emoji)
  const health_score = getHealthScore(pass_rate_decimal);

  // Calculate streaks
  let current_streak = 0;
  let longest_streak = 0;
  let temp_streak = 0;

  for (let i = runs.length - 1; i >= 0; i--) {
    if (runs[i].result === 'PASSED') {
      temp_streak++;
      if (i === runs.length - 1) {
        current_streak = temp_streak;
      }
      longest_streak = Math.max(longest_streak, temp_streak);
    } else {
      if (i < runs.length - 1) {
        break; // Stop counting current streak
      }
      temp_streak = 0;
    }
  }

  // Count total failures
  const total_failures = runs.filter(r => r.result === 'FAILED').length;

  // Calculate average recovery time
  const recovery_times: number[] = [];
  for (const run of runs) {
    if (run.recovery?.time_to_fix_minutes) {
      recovery_times.push(run.recovery.time_to_fix_minutes);
    }
  }
  const avg_recovery_time_minutes = recovery_times.length > 0
    ? Math.round(recovery_times.reduce((sum, t) => sum + t, 0) / recovery_times.length)
    : undefined;

  // Last run timestamp
  const last_run = runs[runs.length - 1]?.timestamp;

  return {
    total_runs,
    pass_rate,
    health_score,
    last_run,
    current_streak,
    longest_streak,
    total_failures,
    avg_recovery_time_minutes,
  };
}

/**
 * Calculate .taf contribution to .faf AI-readiness score
 * MCP-portable: pure function
 */
export function calculateScoreContribution(taf: TAFFile): TAFScoreContribution {
  let taf_present = 5; // File exists
  let taf_validated = 0;
  let pass_rate_bonus = 0;

  // Validate structure
  if (taf.format_version && taf.project && taf.created && Array.isArray(taf.test_history)) {
    taf_validated = 5;
  }

  // Check pass rate
  if (taf.test_history.length > 0) {
    const stats = calculateStats(taf);
    const pass_rate_num = parseInt(stats.pass_rate.replace('%', ''));
    if (pass_rate_num > 80) {
      pass_rate_bonus = 5;
    }
  }

  return {
    taf_present,
    taf_validated,
    pass_rate_bonus,
    total: taf_present + taf_validated + pass_rate_bonus,
  };
}

/**
 * Get health score emoji based on pass rate
 * MCP-portable: pure function
 */
function getHealthScore(pass_rate: number): string {
  if (pass_rate >= 0.95) return '🏆'; // Trophy: 95%+
  if (pass_rate >= 0.85) return '🥇'; // Gold: 85%+
  if (pass_rate >= 0.70) return '🥈'; // Silver: 70%+
  if (pass_rate >= 0.50) return '🥉'; // Bronze: 50%+
  return '🤍'; // White heart: <50%
}

/**
 * Get pass rate trend (improving/declining/stable)
 * MCP-portable: pure function
 */
export function getPassRateTrend(taf: TAFFile, window: number = 10): string {
  const runs = taf.test_history;
  if (runs.length < 2) return 'stable';

  const recent = runs.slice(-window);
  const older = runs.slice(-window * 2, -window);

  if (older.length === 0) return 'stable';

  const recentPassRate = recent.filter(r => r.result === 'PASSED').length / recent.length;
  const olderPassRate = older.filter(r => r.result === 'PASSED').length / older.length;

  const diff = recentPassRate - olderPassRate;

  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

/**
 * Get failure patterns for WJTTC analysis
 * MCP-portable: pure function
 */
export function getFailurePatterns(taf: TAFFile): {
  most_common_issues: string[];
  failure_rate_by_hour: Record<number, number>;
} {
  const issues: Record<string, number> = {};
  const hourCounts: Record<number, { total: number; failures: number }> = {};

  for (const run of taf.test_history) {
    // Count issues
    if (run.issues) {
      for (const issue of run.issues) {
        issues[issue] = (issues[issue] || 0) + 1;
      }
    }

    // Count failures by hour
    const hour = new Date(run.timestamp).getHours();
    if (!hourCounts[hour]) {
      hourCounts[hour] = { total: 0, failures: 0 };
    }
    hourCounts[hour].total++;
    if (run.result === 'FAILED') {
      hourCounts[hour].failures++;
    }
  }

  // Sort issues by frequency
  const most_common_issues = Object.entries(issues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue]) => issue);

  // Calculate failure rate by hour
  const failure_rate_by_hour: Record<number, number> = {};
  for (const [hour, counts] of Object.entries(hourCounts)) {
    failure_rate_by_hour[parseInt(hour)] = counts.failures / counts.total;
  }

  return {
    most_common_issues,
    failure_rate_by_hour,
  };
}
