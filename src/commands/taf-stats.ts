/**
 * faf taf stats - Display testing statistics
 *
 * Shows pass rate, health score, streaks, and trends from .taf file
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseTAF, calculateStats, getPassRateTrend, calculateScoreContribution } from '../taf';

export async function tafStats(): Promise<void> {
  const tafPath = path.join(process.cwd(), '.taf');

  // Check if .taf exists
  if (!fs.existsSync(tafPath)) {
    console.error('❌ No .taf file found');
    console.log('\nRun: faf taf init');
    process.exit(1);
  }

  // Read and parse
  let taf;
  try {
    const content = fs.readFileSync(tafPath, 'utf-8');
    taf = parseTAF(content);
  } catch (error) {
    console.error('❌ Failed to parse .taf file');
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
    }
    process.exit(1);
  }

  // Calculate statistics
  const stats = calculateStats(taf);
  const trend = getPassRateTrend(taf);
  const scoreContribution = calculateScoreContribution(taf);

  // Display header
  console.log('📊 Testing Statistics\n');

  // Project info
  console.log(`Project: ${taf.project}`);
  console.log(`Created: ${new Date(taf.created).toLocaleDateString()}\n`);

  // Core stats
  console.log(`${stats.health_score} Health Score: ${stats.pass_rate}`);
  console.log(`   Total runs: ${stats.total_runs}`);
  console.log(`   Current streak: ${stats.current_streak} passing`);
  console.log(`   Longest streak: ${stats.longest_streak} passing`);
  console.log(`   Total failures: ${stats.total_failures}`);

  if (stats.avg_recovery_time_minutes) {
    console.log(`   Avg recovery: ${stats.avg_recovery_time_minutes} minutes`);
  }

  // Trend
  const trendEmoji = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
  console.log(`\n${trendEmoji} Trend: ${trend}`);

  // Last run
  if (stats.last_run) {
    const lastRunDate = new Date(stats.last_run);
    const now = new Date();
    const hoursSince = Math.round((now.getTime() - lastRunDate.getTime()) / 1000 / 60 / 60);
    console.log(`\n⏱️  Last run: ${hoursSince}h ago`);
  }

  // Score contribution (for .faf integration)
  console.log(`\n🏆 .faf Score Contribution:`);
  console.log(`   .taf present: +${scoreContribution.taf_present} points`);
  console.log(`   .taf validated: +${scoreContribution.taf_validated} points`);
  console.log(`   Pass rate bonus: +${scoreContribution.pass_rate_bonus} points`);
  console.log(`   Total: +${scoreContribution.total} points`);

  // FAF integration status
  if (taf.faf_associated) {
    console.log(`\n🔗 Native Reference: .faf linked`);
    if (taf.faf_score !== undefined) {
      console.log(`   Current .faf score: ${taf.faf_score}/100`);
      const projectedScore = taf.faf_score + scoreContribution.total;
      if (projectedScore > taf.faf_score) {
        console.log(`   Projected with .taf: ${projectedScore}/100 (+${scoreContribution.total})`);
      }
    }
  } else {
    console.log(`\nℹ️  No .faf link (optional)`);
    console.log(`   Run 'faf taf init' in a project with .faf to enable native reference`);
  }

  // Recent runs preview
  if (taf.test_history.length > 0) {
    console.log(`\n📋 Recent Runs (last 5):`);
    const recent = taf.test_history.slice(-5);
    recent.forEach(run => {
      const date = new Date(run.timestamp);
      const resultEmoji = run.result === 'PASSED' ? '✅' :
                          run.result === 'IMPROVED' ? '📈' :
                          run.result === 'DEGRADED' ? '📉' : '❌';
      console.log(`   ${resultEmoji} ${date.toLocaleString()}: ${run.tests.passed}/${run.tests.total} passing`);
    });
  }
}

// CLI wrapper
export async function runTAFStats(): Promise<void> {
  await tafStats();
}
