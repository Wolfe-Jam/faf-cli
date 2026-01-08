/**
 * 🍊 Drift Command - Context-Drift Makes You Pay
 * Analyzes git history to detect and quantify context-drift
 *
 * Shows the cascade of poor decisions when AI lacks context
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { chalk } from '../fix-once/colors';
import { FAF_COLORS } from '../utils/championship-style';
import { findFafFile } from '../utils/file-utils';
import { FafCompiler } from '../compiler/faf-compiler';

export interface DriftOptions {
  since?: string;        // e.g., "90d", "6m"
  detailed?: boolean;    // Show detailed breakdown
  export?: string;       // Export to JSON file
}

interface DriftEvent {
  type: 'auth' | 'state' | 'styling' | 'framework' | 'database' | 'other';
  severity: 'low' | 'medium' | 'high';
  day: number;
  description: string;
  filesChanged: number;
  commits: string[];
  estimatedCost: string;
}

interface DriftAnalysis {
  project: string;
  totalCommits: number;
  daysAnalyzed: number;
  currentFafScore: number;
  events: DriftEvent[];
  summary: {
    totalEvents: number;
    filesRewritten: number;
    cascadeFixCommits: number;
    estimatedTimeLost: string;
  };
  futureRisk: {
    level: 'low' | 'medium' | 'high';
    inconsistencies: string[];
    nextEventLikely: string;
  };
  prevention: {
    fafRecommendations: Record<string, any>;
    weeksSaved: string;
  };
}

/**
 * Drift detection patterns for common technology changes
 */
const DRIFT_PATTERNS = {
  auth: {
    packages: [
      'passport', 'next-auth', '@supabase/auth-helpers',
      'firebase/auth', 'auth0', '@auth0/nextjs-auth0',
      'lucia-auth', 'better-auth'
    ],
    commits: /migrate.*auth|switch.*auth|replace.*auth|move.*auth|refactor.*auth/i,
    files: /auth|login|session|user.*auth/i,
    severity: 'high' as const,
    estimatedCost: '2-3 weeks'
  },
  state: {
    packages: [
      'redux', '@reduxjs/toolkit', 'zustand', 'jotai',
      'mobx', 'recoil', 'valtio', 'nanostores'
    ],
    commits: /migrate.*state|switch.*store|replace.*redux|move.*state/i,
    files: /store|state|redux|zustand|atoms/i,
    severity: 'medium' as const,
    estimatedCost: '3-5 days'
  },
  styling: {
    packages: [
      'styled-components', '@emotion/react', '@emotion/styled',
      'tailwindcss', 'sass', 'less', 'postcss',
      '@vanilla-extract/css', 'linaria'
    ],
    commits: /migrate.*css|switch.*styling|replace.*styles|tailwind.*migration/i,
    files: /\.css$|\.scss$|\.less$|tailwind\.config|styled\./i,
    severity: 'medium' as const,
    estimatedCost: '1 week'
  },
  framework: {
    packages: [
      'react', 'vue', 'svelte', 'next', 'vite', 'remix',
      'express', 'fastify', 'hono', 'nestjs'
    ],
    commits: /migrate.*framework|switch to|upgrade to|move to.*next|vite.*migration/i,
    files: /app\/|pages\/|routes\//i,
    severity: 'high' as const,
    estimatedCost: '2-4 weeks'
  },
  database: {
    packages: [
      'prisma', '@prisma/client', 'drizzle-orm', 'typeorm',
      'mongoose', '@supabase/supabase-js', 'postgres', 'mysql2'
    ],
    commits: /migrate.*database|switch.*db|replace.*orm|prisma.*drizzle|db.*migration/i,
    files: /schema|migrations|models|prisma|drizzle/i,
    severity: 'high' as const,
    estimatedCost: '1-2 weeks'
  }
};

/**
 * Check if directory is a git repository
 */
function isGitRepo(dir: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git log data
 */
function getGitLog(projectDir: string, since?: string): string {
  try {
    const sinceFlag = since ? `--since="${since}"` : '--all';
    const cmd = `git log ${sinceFlag} --numstat --date=short --pretty=format:"%H|%ad|%s"`;
    return execSync(cmd, { cwd: projectDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return '';
  }
}

/**
 * Get package.json history
 */
function getPackageHistory(projectDir: string): string {
  try {
    const cmd = 'git log --all -p package.json';
    return execSync(cmd, { cwd: projectDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch {
    return '';
  }
}

/**
 * Parse git log to extract commits
 */
function parseGitLog(logOutput: string): Array<{
  hash: string;
  date: string;
  message: string;
  filesChanged: number;
}> {
  const commits: Array<{ hash: string; date: string; message: string; filesChanged: number }> = [];
  const lines = logOutput.split('\n');

  let currentCommit: any = null;

  for (const line of lines) {
    if (line.includes('|')) {
      const [hash, date, message] = line.split('|');
      currentCommit = { hash, date, message, filesChanged: 0 };
      commits.push(currentCommit);
    } else if (currentCommit && line.trim() && !line.startsWith('-')) {
      // numstat line: additions deletions filename
      currentCommit.filesChanged++;
    }
  }

  return commits;
}

/**
 * Detect package changes from package.json history
 */
function detectPackageChanges(packageHistory: string): Map<string, string[]> {
  const changes = new Map<string, string[]>();

  for (const [category, config] of Object.entries(DRIFT_PATTERNS)) {
    const categoryChanges: string[] = [];

    for (const pkg of config.packages) {
      // Look for additions and removals
      const addPattern = new RegExp(`\\+.*"${pkg}"`, 'g');
      const removePattern = new RegExp(`-.*"${pkg}"`, 'g');

      const additions = packageHistory.match(addPattern);
      const removals = packageHistory.match(removePattern);

      if (additions && removals) {
        categoryChanges.push(`${pkg} (added then removed)`);
      } else if (additions) {
        categoryChanges.push(`${pkg} (added)`);
      } else if (removals) {
        categoryChanges.push(`${pkg} (removed)`);
      }
    }

    if (categoryChanges.length > 0) {
      changes.set(category, categoryChanges);
    }
  }

  return changes;
}

/**
 * Detect drift events from commits
 */
function detectDriftEvents(
  commits: Array<{ hash: string; date: string; message: string; filesChanged: number }>,
  packageChanges: Map<string, string[]>
): DriftEvent[] {
  const events: DriftEvent[] = [];
  const startDate = commits.length > 0 ? new Date(commits[commits.length - 1].date) : new Date();

  // Detect from commit messages and file changes
  for (const commit of commits) {
    const commitDate = new Date(commit.date);
    const daysSinceStart = Math.floor((commitDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (const [type, config] of Object.entries(DRIFT_PATTERNS)) {
      if (config.commits.test(commit.message)) {
        events.push({
          type: type as DriftEvent['type'],
          severity: config.severity,
          day: daysSinceStart,
          description: commit.message,
          filesChanged: commit.filesChanged,
          commits: [commit.hash.substring(0, 7)],
          estimatedCost: config.estimatedCost
        });
      }
    }
  }

  // Add package change events
  for (const [type, changes] of packageChanges.entries()) {
    if (changes.length > 1) {
      // Multiple changes = drift
      events.push({
        type: type as DriftEvent['type'],
        severity: DRIFT_PATTERNS[type as keyof typeof DRIFT_PATTERNS].severity,
        day: 0, // Approximate
        description: `Multiple ${type} changes detected: ${changes.join(', ')}`,
        filesChanged: 0,
        commits: [],
        estimatedCost: DRIFT_PATTERNS[type as keyof typeof DRIFT_PATTERNS].estimatedCost
      });
    }
  }

  return events;
}

/**
 * Calculate drift summary
 */
function calculateSummary(events: DriftEvent[]): DriftAnalysis['summary'] {
  const totalEvents = events.length;
  const filesRewritten = events.reduce((sum, e) => sum + e.filesChanged, 0);

  // Estimate cascade fix commits (rough heuristic: 2-5 fix commits per drift event)
  const cascadeFixCommits = totalEvents * 3;

  // Sum up estimated time lost
  const totalWeeks = events.reduce((sum, e) => {
    const match = e.estimatedCost.match(/(\d+)-?(\d+)?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const avg = (min + max) / 2;

      if (e.estimatedCost.includes('week')) {
        return sum + avg;
      } else if (e.estimatedCost.includes('day')) {
        return sum + (avg / 5); // Convert days to weeks
      }
    }
    return sum;
  }, 0);

  const estimatedTimeLost = totalWeeks >= 1
    ? `${Math.floor(totalWeeks)}-${Math.ceil(totalWeeks + 1)} weeks`
    : `${Math.floor(totalWeeks * 5)}-${Math.ceil((totalWeeks + 0.5) * 5)} days`;

  return {
    totalEvents,
    filesRewritten,
    cascadeFixCommits,
    estimatedTimeLost
  };
}

/**
 * Assess future drift risk
 */
function assessFutureRisk(events: DriftEvent[]): DriftAnalysis['futureRisk'] {
  const recentEvents = events.filter(e => e.day > 0); // Rough filter
  const highSeverityCount = events.filter(e => e.severity === 'high').length;

  let level: 'low' | 'medium' | 'high' = 'low';
  if (highSeverityCount >= 2 || recentEvents.length >= 4) {
    level = 'high';
  } else if (highSeverityCount >= 1 || recentEvents.length >= 2) {
    level = 'medium';
  }

  const inconsistencies: string[] = [];
  const categoryCount = new Map<string, number>();

  for (const event of events) {
    categoryCount.set(event.type, (categoryCount.get(event.type) || 0) + 1);
  }

  for (const [type, count] of categoryCount.entries()) {
    if (count >= 2) {
      inconsistencies.push(`Multiple ${type} changes (${count} detected)`);
    }
  }

  const nextEventLikely = level === 'high'
    ? '2-3 weeks'
    : level === 'medium'
    ? '1-2 months'
    : '6+ months';

  return {
    level,
    inconsistencies,
    nextEventLikely
  };
}

/**
 * Generate .faf recommendations to prevent future drift
 */
function generateRecommendations(events: DriftEvent[]): Record<string, any> {
  const recommendations: Record<string, any> = {};

  // Based on detected drift, suggest locked-in decisions
  for (const event of events) {
    if (event.type === 'auth' && !recommendations.auth) {
      recommendations.auth = {
        provider: 'supabase', // Example - would detect from final state
        method: 'oauth'
      };
    }
    if (event.type === 'state' && !recommendations.state) {
      recommendations.state = {
        library: 'zustand' // Example
      };
    }
    if (event.type === 'styling' && !recommendations.styling) {
      recommendations.styling = {
        approach: 'tailwind' // Example
      };
    }
  }

  return recommendations;
}

/**
 * Perform drift analysis
 */
async function analyzeDrift(
  projectDir: string,
  options: DriftOptions
): Promise<DriftAnalysis> {
  const projectName = path.basename(projectDir);

  // Get git data
  const gitLog = getGitLog(projectDir, options.since);
  const packageHistory = getPackageHistory(projectDir);

  // Parse commits
  const commits = parseGitLog(gitLog);
  const totalCommits = commits.length;
  const daysAnalyzed = commits.length > 0
    ? Math.floor((new Date(commits[0].date).getTime() - new Date(commits[commits.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Detect package changes
  const packageChanges = detectPackageChanges(packageHistory);

  // Detect drift events
  const events = detectDriftEvents(commits, packageChanges);

  // Get current .faf score
  let currentFafScore = 0;
  try {
    const fafPath = await findFafFile(projectDir);
    if (fafPath) {
      const compiler = new FafCompiler();
      const result = await compiler.compile(fafPath);
      currentFafScore = result.score || 0;
    }
  } catch {
    // No .faf file
  }

  // Calculate summary
  const summary = calculateSummary(events);

  // Assess future risk
  const futureRisk = assessFutureRisk(events);

  // Generate recommendations
  const fafRecommendations = generateRecommendations(events);
  const weeksSaved = summary.estimatedTimeLost;

  return {
    project: projectName,
    totalCommits,
    daysAnalyzed,
    currentFafScore,
    events,
    summary,
    futureRisk,
    prevention: {
      fafRecommendations,
      weeksSaved
    }
  };
}

/**
 * Display drift analysis results
 */
function displayDriftAnalysis(analysis: DriftAnalysis): void {
  const { project, totalCommits, daysAnalyzed, currentFafScore, events, summary, futureRisk, prevention } = analysis;

  console.log();
  console.log(FAF_COLORS.fafOrange('🍊 FAF DRIFT ANALYSIS'));
  console.log();
  console.log(`Project: ${FAF_COLORS.fafCyan(project)}`);
  console.log(`Analyzed: ${totalCommits} commits over ${daysAnalyzed} days`);
  console.log(`Current .faf: ${currentFafScore > 0 ? `${currentFafScore}% ${getFafEmoji(currentFafScore)}` : 'None (0% 🤍)'}`);
  console.log();
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();

  if (events.length === 0) {
    console.log(FAF_COLORS.fafGreen('✓ No drift detected!'));
    console.log();
    console.log('Your project shows consistent architecture.');
    console.log();
    if (currentFafScore === 0) {
      console.log(FAF_COLORS.fafOrange('💡 Lock in your current decisions:'));
      console.log(`   ${FAF_COLORS.fafCyan('faf init')} - Create .faf to prevent future drift`);
    }
    console.log();
    return;
  }

  console.log(FAF_COLORS.fafOrange('DETECTED DRIFT EVENTS:'));
  console.log();

  // Group events by type
  const eventsByType = new Map<string, DriftEvent[]>();
  for (const event of events) {
    const list = eventsByType.get(event.type) || [];
    list.push(event);
    eventsByType.set(event.type, list);
  }

  // Display by type
  for (const [type, typeEvents] of eventsByType.entries()) {
    const emoji = getSeverityEmoji(typeEvents[0].severity);
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const changeSuffix = typeEvents.length > 1 ? 's' : '';

    console.log(`${emoji} ${FAF_COLORS.fafOrange(`${typeLabel} (${typeEvents.length} change${changeSuffix})`)}`);

    for (let i = 0; i < typeEvents.length; i++) {
      const event = typeEvents[i];
      const prefix = i === typeEvents.length - 1 ? '└─' : '├─';
      console.log(`   ${FAF_COLORS.fafCyan(prefix)} ${event.description}`);
      if (event.filesChanged > 0) {
        console.log(`      ${event.filesChanged} files changed`);
      }
    }

    console.log(`   Drift Cost: ${FAF_COLORS.fafOrange(typeEvents[0].estimatedCost)}`);
    console.log();
  }

  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
  console.log(FAF_COLORS.fafOrange('DRIFT SUMMARY:'));
  console.log();
  console.log(`Total Drift Events: ${FAF_COLORS.fafOrange(summary.totalEvents.toString())}`);
  console.log(`Files Rewritten: ${FAF_COLORS.fafOrange(summary.filesRewritten.toString())}`);
  console.log(`Cascade-Fix Commits: ${FAF_COLORS.fafOrange(summary.cascadeFixCommits.toString())}`);
  console.log(`Estimated Time Lost: ${FAF_COLORS.fafOrange(summary.estimatedTimeLost)}`);
  console.log();
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
  console.log(FAF_COLORS.fafOrange('DRIFT RISK (Future):'));
  console.log();

  if (futureRisk.inconsistencies.length > 0) {
    console.log('Current inconsistencies detected:');
    for (const inconsistency of futureRisk.inconsistencies) {
      console.log(`  - ${inconsistency}`);
    }
    console.log();
  }

  const riskEmoji = futureRisk.level === 'high' ? '🔴' : futureRisk.level === 'medium' ? '🟡' : '🟢';
  const riskLabel = futureRisk.level.toUpperCase();
  console.log(`Risk Level: ${riskEmoji} ${FAF_COLORS.fafOrange(riskLabel)}`);
  console.log(`Next drift event likely within: ${futureRisk.nextEventLikely}`);
  console.log();
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
  console.log(FAF_COLORS.fafGreen('WITH .FAF FROM DAY 1:'));
  console.log();
  console.log('If you had defined in .faf:');

  if (Object.keys(prevention.fafRecommendations).length > 0) {
    for (const [key, value] of Object.entries(prevention.fafRecommendations)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  } else {
    console.log('  Your architectural decisions locked in');
  }

  console.log();
  console.log('You would have:');
  console.log(`✓ Zero rewrites (saved ${FAF_COLORS.fafGreen(prevention.weeksSaved)})`);
  console.log('✓ Consistent architecture from start');
  console.log(`✓ ${summary.filesRewritten} files never rewritten`);
  console.log(`✓ Project ${summary.estimatedTimeLost} ahead`);
  console.log();
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
  console.log(FAF_COLORS.fafOrange('STOP THE DRIFT:'));
  console.log();
  console.log(`  ${FAF_COLORS.fafCyan('faf init')}           Create .faf to lock in decisions`);
  console.log(`  ${FAF_COLORS.fafCyan('faf auto')}           Auto-generate championship .faf`);
  console.log(`  ${FAF_COLORS.fafCyan('faf drift --help')}   Learn more`);
  console.log();
  console.log(FAF_COLORS.fafOrange('Context-drift makes you pay.'));
  console.log(FAF_COLORS.fafGreen('.faf keeps you drift-free.'));
  console.log();
}

/**
 * Get emoji for .faf score - correct tier system
 */
function getFafEmoji(score: number): string {
  if (score >= 100) {return '🏆';}  // Trophy 100%
  if (score >= 99) {return '🥇';}   // Gold 99%+
  if (score >= 95) {return '🥈';}   // Silver 95%+
  if (score >= 85) {return '🥉';}   // Bronze 85%+
  if (score >= 70) {return '🟢';}   // Green 70%+
  if (score >= 55) {return '🟡';}   // Yellow 55%+
  if (score > 0) {return '🔴';}     // Red <55%
  return '🤍';                      // White 0%
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: 'low' | 'medium' | 'high'): string {
  return severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
}

/**
 * Main drift command handler
 */
export async function driftCommand(options: DriftOptions = {}): Promise<void> {
  try {
    const projectDir = process.cwd();

    // Check if git repo
    if (!isGitRepo(projectDir)) {
      console.log(chalk.red('❌ Not a git repository'));
      console.log(chalk.dim('💡 faf drift requires git history to analyze'));
      process.exit(1);
    }

    console.log();
    console.log(FAF_COLORS.fafOrange('🍊 Analyzing git history for context-drift...'));
    console.log();

    // Analyze drift
    const analysis = await analyzeDrift(projectDir, options);

    // Display results
    displayDriftAnalysis(analysis);

    // Export if requested
    if (options.export) {
      const exportPath = path.resolve(projectDir, options.export);
      await fs.writeFile(exportPath, JSON.stringify(analysis, null, 2), 'utf-8');
      console.log(FAF_COLORS.fafGreen(`✓ Analysis exported to: ${exportPath}`));
      console.log();
    }

  } catch (error) {
    console.error(chalk.red('❌ Error analyzing drift:'), error);
    process.exit(1);
  }
}
