/**
 * faf taf log - Log a test run
 *
 * Appends a test run entry to .taf file
 * Supports both minimal and detailed modes
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseTAF,
  serializeTAF,
  formatTAF,
  appendTestRun,
  createMinimalRun,
  createDetailedRun,
  detectResult,
  parseTestOutput,
  TestResult,
  EnvironmentInfo,
  VarianceType,
} from '../taf';

interface TAFLogOptions {
  minimal?: boolean;
  result?: TestResult;
  passed?: number;
  failed?: number;
  total?: number;
  skipped?: number;
  command?: string;
  trigger?: string;
  issues?: string[];
  root_cause?: string;
  resolution?: string;
  environment?: EnvironmentInfo;
  env_variance?: VarianceType;
  env_notes?: string;
  autoParsed?: boolean;
}

/**
 * Read stdin with passthrough — echoes each chunk to stdout so
 * the user sees test output live, returns accumulated buffer on EOF.
 */
function readStdinWithPassthrough(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk);
      chunks.push(chunk);
    });
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    process.stdin.on('error', reject);
  });
}

export async function tafLog(options: TAFLogOptions = {}): Promise<void> {
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

  // Validate required fields
  if (options.total === undefined || options.passed === undefined || options.failed === undefined) {
    console.error('❌ Missing required test counts');
    console.log('\nRequired: --total, --passed, --failed');
    console.log('Example: faf taf log --total 173 --passed 173 --failed 0');
    process.exit(1);
  }

  // Validate input types and values
  const total = options.total;
  const passed = options.passed;
  const failed = options.failed;
  const skipped = options.skipped || 0;

  // Check for NaN
  if (isNaN(total) || isNaN(passed) || isNaN(failed) || isNaN(skipped)) {
    console.error('❌ Invalid input: test counts must be numbers');
    console.log('\nExample: faf taf log --total 173 --passed 173 --failed 0');
    process.exit(1);
  }

  // Check for negative numbers
  if (total < 0 || passed < 0 || failed < 0 || skipped < 0) {
    console.error('❌ Invalid input: test counts cannot be negative');
    console.log(`\nReceived: total=${total}, passed=${passed}, failed=${failed}, skipped=${skipped}`);
    process.exit(1);
  }

  // Check for integers
  if (!Number.isInteger(total) || !Number.isInteger(passed) || !Number.isInteger(failed) || !Number.isInteger(skipped)) {
    console.error('❌ Invalid input: test counts must be integers');
    console.log(`\nReceived: total=${total}, passed=${passed}, failed=${failed}, skipped=${skipped}`);
    process.exit(1);
  }

  // Check math: passed + failed + skipped should equal total
  const sum = passed + failed + skipped;
  if (sum !== total) {
    console.error('❌ Invalid input: test counts do not add up');
    console.log(`\nPassed (${passed}) + Failed (${failed}) + Skipped (${skipped}) = ${sum}`);
    console.log(`But total is ${total}`);
    console.log('\nThe numbers must add up correctly.');
    process.exit(1);
  }

  // Check logical constraints
  if (passed > total) {
    console.error('❌ Invalid input: passed tests cannot exceed total tests');
    console.log(`\nPassed: ${passed}, Total: ${total}`);
    process.exit(1);
  }

  if (failed > total) {
    console.error('❌ Invalid input: failed tests cannot exceed total tests');
    console.log(`\nFailed: ${failed}, Total: ${total}`);
    process.exit(1);
  }

  // Detect result if not provided
  const previousRun = taf.test_history[taf.test_history.length - 1];
  const result = options.result || detectResult(
    { passed: options.passed, total: options.total },
    previousRun ? { passed: previousRun.tests.passed, total: previousRun.tests.total } : undefined
  );

  // Build environment info if variance detected
  let environment: EnvironmentInfo | undefined;
  if (options.env_variance || options.env_notes || options.environment) {
    environment = options.environment || {
      variance: options.env_variance ? [{
        type: options.env_variance,
        description: getVarianceDescription(options.env_variance),
        detected_at: new Date().toISOString(),
      }] : undefined,
      notes: options.env_notes,
    };
  }

  // Create test run entry
  const run = options.minimal
    ? createMinimalRun({
        result,
        total: options.total,
        passed: options.passed,
        failed: options.failed,
        skipped: options.skipped,
        environment,
      })
    : createDetailedRun({
        result,
        command: options.command,
        trigger: options.trigger,
        tests: {
          total: options.total,
          passed: options.passed,
          failed: options.failed,
          skipped: options.skipped,
        },
        issues: options.issues,
        root_cause: options.root_cause,
        resolution: options.resolution,
        environment,
      });

  // Append to TAF
  const updatedTAF = appendTestRun(taf, run);

  // Serialize and format
  const content = formatTAF(serializeTAF(updatedTAF));

  // Write back
  fs.writeFileSync(tafPath, content, 'utf-8');

  // Success message
  if (options.autoParsed) {
    console.log(`\n🏁 Receipt: ${options.passed}/${options.total} passed`);
  } else {
    const resultEmoji = result === 'PASSED' ? '✅' :
                        result === 'IMPROVED' ? '📈' :
                        result === 'DEGRADED' ? '📉' : '❌';

    console.log(`${resultEmoji} Logged test run: ${result}`);
    console.log(`\n   Tests: ${options.passed}/${options.total} passing`);
  }

  // Show environment variance if flagged
  if (environment?.variance && environment.variance.length > 0) {
    console.log(`   ⚠️  Environment variance detected:`);
    environment.variance.forEach(v => {
      console.log(`      - ${v.type}: ${v.description}`);
    });
  }

  if (environment?.notes) {
    console.log(`   📝 Environment notes: ${environment.notes}`);
  }

  if (result === 'PASSED') {
    const streak = countCurrentStreak(updatedTAF.test_history);
    if (streak > 1) {
      console.log(`   🔥 Streak: ${streak} passing runs`);
    }
  }

  if (options.root_cause) {
    console.log(`   Root cause: ${options.root_cause}`);
  }

  if (options.resolution) {
    console.log(`   Resolution: ${options.resolution}`);
  }

  console.log(`\nTotal runs: ${updatedTAF.test_history.length}`);
}

/**
 * Get human-readable description for variance type
 */
function getVarianceDescription(type: VarianceType): string {
  const descriptions: Record<VarianceType, string> = {
    background_execution: 'Test running in background shell',
    unstable_cwd: 'Working directory changing during test execution',
    missing_dependencies: 'Required dependencies not found',
    parallel_execution: 'Tests running in parallel when sequential expected',
    resource_contention: 'System resources constrained',
    network_unavailable: 'Network-dependent tests without network',
    timing_sensitive: 'Race conditions or timing issues detected',
    other: 'Custom environment variance',
  };
  return descriptions[type];
}

/**
 * Count current passing streak
 */
function countCurrentStreak(history: any[]): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].result === 'PASSED') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * CLI wrapper - parse arguments
 */
export async function runTAFLog(args: string[]): Promise<void> {
  const options: TAFLogOptions = {
    minimal: args.includes('--minimal') || args.includes('-m'),
  };

  // Parse test counts
  const totalIndex = args.findIndex(arg => arg === '--total' || arg === '-t');
  if (totalIndex !== -1 && args[totalIndex + 1]) {
    options.total = parseInt(args[totalIndex + 1]);
  }

  const passedIndex = args.findIndex(arg => arg === '--passed' || arg === '-p');
  if (passedIndex !== -1 && args[passedIndex + 1]) {
    options.passed = parseInt(args[passedIndex + 1]);
  }

  const failedIndex = args.findIndex(arg => arg === '--failed' || arg === '-f');
  if (failedIndex !== -1 && args[failedIndex + 1]) {
    options.failed = parseInt(args[failedIndex + 1]);
  }

  const skippedIndex = args.findIndex(arg => arg === '--skipped' || arg === '-s');
  if (skippedIndex !== -1 && args[skippedIndex + 1]) {
    options.skipped = parseInt(args[skippedIndex + 1]);
  }

  // Parse result (optional)
  const resultIndex = args.findIndex(arg => arg === '--result' || arg === '-r');
  if (resultIndex !== -1 && args[resultIndex + 1]) {
    const resultStr = args[resultIndex + 1].toUpperCase();
    if (['PASSED', 'FAILED', 'IMPROVED', 'DEGRADED'].includes(resultStr)) {
      options.result = resultStr as TestResult;
    }
  }

  // Parse detailed fields
  const commandIndex = args.findIndex(arg => arg === '--command' || arg === '-c');
  if (commandIndex !== -1 && args[commandIndex + 1]) {
    options.command = args[commandIndex + 1];
  }

  const triggerIndex = args.findIndex(arg => arg === '--trigger');
  if (triggerIndex !== -1 && args[triggerIndex + 1]) {
    options.trigger = args[triggerIndex + 1];
  }

  const rootCauseIndex = args.findIndex(arg => arg === '--root-cause');
  if (rootCauseIndex !== -1 && args[rootCauseIndex + 1]) {
    options.root_cause = args[rootCauseIndex + 1];
  }

  const resolutionIndex = args.findIndex(arg => arg === '--resolution');
  if (resolutionIndex !== -1 && args[resolutionIndex + 1]) {
    options.resolution = args[resolutionIndex + 1];
  }

  // Parse issues (comma-separated)
  const issuesIndex = args.findIndex(arg => arg === '--issues' || arg === '-i');
  if (issuesIndex !== -1 && args[issuesIndex + 1]) {
    options.issues = args[issuesIndex + 1].split(',').map(s => s.trim());
  }

  // Parse environment variance
  const envVarianceIndex = args.findIndex(arg => arg === '--env-variance');
  if (envVarianceIndex !== -1 && args[envVarianceIndex + 1]) {
    const variance = args[envVarianceIndex + 1];
    const validVariances: VarianceType[] = [
      'background_execution',
      'unstable_cwd',
      'missing_dependencies',
      'parallel_execution',
      'resource_contention',
      'network_unavailable',
      'timing_sensitive',
      'other',
    ];
    if (validVariances.includes(variance as VarianceType)) {
      options.env_variance = variance as VarianceType;
    }
  }

  const envNotesIndex = args.findIndex(arg => arg === '--env-notes');
  if (envNotesIndex !== -1 && args[envNotesIndex + 1]) {
    options.env_notes = args[envNotesIndex + 1];
  }

  // Stdin auto-parse: detect pipe and parse test output
  const hasFlags = options.total !== undefined || options.passed !== undefined || options.failed !== undefined;

  if (!process.stdin.isTTY && !hasFlags) {
    const stdinContent = await readStdinWithPassthrough();

    if (!stdinContent.trim()) {
      console.error('❌ No input received from pipe');
      process.exit(1);
    }

    const parsed = parseTestOutput(stdinContent);
    if (!parsed) {
      console.error('❌ Could not parse test output');
      console.log('\nSupported formats:');
      console.log('  Jest:   "Tests: 173 passed, 173 total"');
      console.log('  Vitest: " Tests  8 passed (8)"');
      console.log('\nOr provide counts manually:');
      console.log('  faf taf log --total 173 --passed 173 --failed 0');
      process.exit(1);
    }

    options.total = parsed.total;
    options.passed = parsed.passed;
    options.failed = parsed.failed;
    options.skipped = parsed.skipped;
    options.autoParsed = true;
  }

  await tafLog(options);
}
