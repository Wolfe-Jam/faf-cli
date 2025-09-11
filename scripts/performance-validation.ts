#!/usr/bin/env ts-node

/**
 * ⚡ F1-Inspired Performance Validation Suite
 * Validates championship performance claims in real-world environments
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import { FAF_COLORS, FAF_ICONS, PERFORMANCE_STANDARDS } from '../src/utils/championship-style';

interface PerformanceTest {
  name: string;
  description: string;
  target: number; // ms
  command: string;
  args: string[];
  iterations: number;
  warmup?: boolean;
}

interface PerformanceResult {
  test: string;
  results: number[]; // Array of execution times in ms
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  target: number;
  passed: boolean;
  percentile95: number;
}

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  freeMemory: number;
  loadAverage: number[];
}

/**
 * F1-Inspired Performance Test Suite
 */
const PERFORMANCE_TESTS: PerformanceTest[] = [
  {
    name: 'status_command',
    description: 'faf status - Git status equivalent speed',
    target: PERFORMANCE_STANDARDS.status_command, // 38ms
    command: 'faf',
    args: ['status'],
    iterations: 50,
    warmup: true
  },
  {
    name: 'trust_dashboard',
    description: 'faf trust - Real-time trust calculation',
    target: PERFORMANCE_STANDARDS.trust_dashboard, // 40ms  
    command: 'faf',
    args: ['trust'],
    iterations: 30,
    warmup: true
  },
  {
    name: 'help_command',
    description: 'faf --help - Instant help display',
    target: 50, // ms
    command: 'faf',
    args: ['--help'],
    iterations: 20
  },
  {
    name: 'index_command',
    description: 'faf index - Universal A-Z reference',
    target: 100, // ms
    command: 'faf',
    args: ['index'],
    iterations: 20
  },
  {
    name: 'score_basic',
    description: 'faf score - Quick score check',
    target: 150, // ms
    command: 'faf',
    args: ['score'],
    iterations: 20,
    warmup: true
  },
  {
    name: 'analytics_summary',
    description: 'faf analytics --summary - Performance metrics',
    target: 100, // ms
    command: 'faf',
    args: ['analytics', '--summary'],
    iterations: 15
  }
];

/**
 * Main performance validation function
 */
async function runPerformanceValidation(): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('⚡ F1-Inspired Performance Validation')}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Championship engineering demands measurable speed`);
  console.log(`${FAF_COLORS.fafCyan('└─')} Validating real-world performance claims`);
  console.log();

  // Gather system information
  const systemInfo = await getSystemInfo();
  displaySystemInfo(systemInfo);

  // Setup test environment
  await setupTestEnvironment();

  // Run performance tests
  const results: PerformanceResult[] = [];
  
  for (const test of PERFORMANCE_TESTS) {
    console.log(`${FAF_COLORS.fafCyan('🏎️')} Running: ${test.description}`);
    
    try {
      const result = await runPerformanceTest(test);
      results.push(result);
      
      const status = result.passed ? 
        `${FAF_COLORS.fafGreen('✅ PASS')} (${result.average.toFixed(1)}ms)` :
        `${FAF_COLORS.fafOrange('⚠️ SLOW')} (${result.average.toFixed(1)}ms vs ${result.target}ms target)`;
      
      console.log(`${FAF_COLORS.fafCyan('   ')}${status}`);
      
    } catch (error) {
      console.log(`${FAF_COLORS.fafOrange('   ❌ ERROR:')} ${error}`);
      
      // Create failed result
      results.push({
        test: test.name,
        results: [],
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        standardDeviation: 0,
        target: test.target,
        passed: false,
        percentile95: 0
      });
    }
    
    console.log();
  }

  // Generate comprehensive report
  await generatePerformanceReport(results, systemInfo);
  
  // Show championship summary
  showChampionshipSummary(results);
}

/**
 * Get detailed system information
 */
async function getSystemInfo(): Promise<SystemInfo> {
  const cpus = os.cpus();
  
  return {
    platform: `${os.platform()}-${os.arch()}`,
    arch: os.arch(),
    nodeVersion: process.version,
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuCores: cpus.length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
    freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
    loadAverage: os.loadavg()
  };
}

/**
 * Display system information
 */
function displaySystemInfo(info: SystemInfo): void {
  console.log(`${FAF_COLORS.fafCyan('🖥️ System Information:')}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Platform: ${info.platform}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Node.js: ${info.nodeVersion}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} CPU: ${info.cpuModel} (${info.cpuCores} cores)`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Memory: ${info.freeMemory}MB / ${info.totalMemory}MB available`);
  console.log(`${FAF_COLORS.fafCyan('└─')} Load: ${info.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
  console.log();
}

/**
 * Setup test environment
 */
async function setupTestEnvironment(): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('🔧 Setting up test environment...')}`);
  
  // Create temporary test directory
  const testDir = path.join(os.tmpdir(), 'faf-performance-test');
  await fs.mkdir(testDir, { recursive: true });
  
  // Create minimal .faf file for tests
  const testFafContent = `
project:
  name: "Performance Test Project"
  description: "Minimal project for performance testing"
  
stack:
  primary_language: "typescript"
  framework: "node"
  
context_quality:
  slots_filled: 5
  
ai_score: 75
`.trim();
  
  await fs.writeFile(path.join(testDir, '.faf'), testFafContent);
  
  // Change to test directory
  process.chdir(testDir);
  
  console.log(`${FAF_COLORS.fafGreen('✅')} Test environment ready: ${testDir}`);
  console.log();
}

/**
 * Run a single performance test
 */
async function runPerformanceTest(test: PerformanceTest): Promise<PerformanceResult> {
  const results: number[] = [];
  
  // Warmup iterations
  if (test.warmup) {
    for (let i = 0; i < 3; i++) {
      try {
        await executeCommand(test.command, test.args, 5000); // 5s timeout for warmup
      } catch {
        // Ignore warmup failures
      }
    }
  }
  
  // Main test iterations
  for (let i = 0; i < test.iterations; i++) {
    try {
      const startTime = performance.now();
      await executeCommand(test.command, test.args, 10000); // 10s timeout
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      results.push(duration);
      
    } catch (error) {
      // For failed executions, record a very high time
      results.push(10000); // 10 seconds = failure
    }
  }
  
  if (results.length === 0) {
    throw new Error('No successful test iterations');
  }
  
  // Calculate statistics
  const sorted = results.sort((a, b) => a - b);
  const average = results.reduce((sum, val) => sum + val, 0) / results.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const percentile95 = sorted[Math.floor(sorted.length * 0.95)];
  
  // Calculate standard deviation
  const variance = results.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / results.length;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    test: test.name,
    results,
    average,
    median,
    min,
    max,
    standardDeviation,
    target: test.target,
    passed: average <= test.target,
    percentile95
  };
}

/**
 * Execute a command with timeout
 */
async function executeCommand(command: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execSync(`${command} ${args.join(' ')}`, {
      stdio: 'pipe',
      timeout: timeoutMs
    });
    resolve();
  });
}

/**
 * Generate comprehensive performance report
 */
async function generatePerformanceReport(results: PerformanceResult[], systemInfo: SystemInfo): Promise<void> {
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    systemInfo,
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      overallScore: (results.filter(r => r.passed).length / results.length) * 100
    },
    results: results.map(result => ({
      ...result,
      results: undefined // Remove raw data from summary
    })),
    rawData: results // Keep detailed data
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`${FAF_COLORS.fafGreen('📊')} Performance report saved: ${reportPath}`);
}

/**
 * Show championship summary
 */
function showChampionshipSummary(results: PerformanceResult[]): void {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const score = (passed / total) * 100;
  
  console.log(`${FAF_COLORS.fafCyan('🏁 Championship Performance Summary:')}`);
  console.log();
  
  // Overall score
  const scoreColor = score >= 90 ? FAF_COLORS.fafGreen : 
                     score >= 70 ? FAF_COLORS.fafOrange : FAF_COLORS.fafOrange;
  
  console.log(`${FAF_COLORS.fafCyan('├─')} Overall Score: ${scoreColor(score.toFixed(1))}% (${passed}/${total} tests passed)`);
  
  // Individual test summary
  console.log(`${FAF_COLORS.fafCyan('├─')} Test Results:`);
  results.forEach((result, index) => {
    const connector = index === results.length - 1 ? '└─' : '├─';
    const status = result.passed ? 
      `${FAF_ICONS.trophy} ${result.average.toFixed(1)}ms` :
      `${FAF_ICONS.shield} ${result.average.toFixed(1)}ms (target: ${result.target}ms)`;
    
    console.log(`${FAF_COLORS.fafCyan(`│   ${connector}`)} ${result.test}: ${status}`);
  });
  
  console.log();
  
  // Championship verdict
  if (score >= 90) {
    console.log(`${FAF_COLORS.fafGreen('🏆 CHAMPIONSHIP PERFORMANCE ACHIEVED!')}`);
    console.log(`${FAF_COLORS.fafGreen('⚡ F1-inspired engineering delivers on promises!')}`);
  } else if (score >= 70) {
    console.log(`${FAF_COLORS.fafOrange('🥈 SOLID PERFORMANCE - Minor optimizations needed')}`);
    console.log(`${FAF_COLORS.fafOrange('🔧 Some commands could use championship tuning')}`);
  } else {
    console.log(`${FAF_COLORS.fafOrange('🔧 PERFORMANCE TUNING REQUIRED')}`);
    console.log(`${FAF_COLORS.fafOrange('⚡ Time to unleash the F1 engineering spirit!')}`);
  }
  
  console.log();
  console.log(`${FAF_COLORS.fafCyan('📈 Performance Standards:')}`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Status command: <38ms (faster than git status)`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Trust dashboard: <40ms (real-time calculation)`);
  console.log(`${FAF_COLORS.fafCyan('├─')} Help/Index: <100ms (instant reference)`);
  console.log(`${FAF_COLORS.fafCyan('└─')} Score calculation: <150ms (comprehensive analysis)`);
}

/**
 * CLI for running specific tests
 */
function parseArgs(): { testNames?: string[], verbose?: boolean } {
  const args = process.argv.slice(2);
  const options: { testNames?: string[], verbose?: boolean } = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--tests':
        options.testNames = args[++i].split(',');
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
⚡ FAF CLI Performance Validation Suite

Usage: npm run performance [options]

Options:
  --tests <names>     Run specific tests (comma-separated)
  --verbose          Show detailed execution logs
  --help             Show this help

Examples:
  npm run performance                          # Run all tests
  npm run performance -- --tests status,trust # Run specific tests
  npm run performance -- --verbose            # Detailed output

Available Tests:
${PERFORMANCE_TESTS.map(t => `  - ${t.name}: ${t.description} (target: ${t.target}ms)`).join('\n')}

🏎️ F1-inspired engineering - Every millisecond matters!
`);
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  
  // Filter tests if specific ones requested
  if (options.testNames) {
    const filteredTests = PERFORMANCE_TESTS.filter(t => 
      options.testNames!.includes(t.name)
    );
    
    if (filteredTests.length === 0) {
      console.error('No matching tests found');
      process.exit(1);
    }
    
    // Replace global test array
    PERFORMANCE_TESTS.length = 0;
    PERFORMANCE_TESTS.push(...filteredTests);
  }
  
  runPerformanceValidation().catch(console.error);
}

export { runPerformanceValidation, PERFORMANCE_TESTS };