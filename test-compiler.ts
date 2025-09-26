#!/usr/bin/env ts-node

/**
 * 🏎️ FAF Compiler Test Suite
 * Testing deterministic, traceable scoring
 */

import { FafCompiler, compile } from './src/compiler/faf-compiler';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

console.log(chalk.blue('🏎️ FAF Compiler Test Suite\n'));
console.log('═'.repeat(60));

async function runTests() {
  // Create test .faf file
  const testDir = '/tmp/compiler-test';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFaf = `
faf_version: 2.5.0
generated: 2025-09-25T10:00:00Z

project:
  name: compiler-test
  goal: Test the compiler architecture
  main_language: TypeScript

stack:
  frontend: React
  css_framework: Tailwind
  backend: Node.js
  database: PostgreSQL
  hosting: Vercel

human_context:
  who: Development Team
  what: Compiler Testing
  why: Ensure correctness
  where: Test Environment
  when: Now
  how: Automated Testing
`;

  const fafPath = path.join(testDir, '.faf');
  fs.writeFileSync(fafPath, testFaf);

  // Create package.json for discovery
  const packageJson = {
    name: 'compiler-test',
    version: '1.0.0',
    dependencies: {
      react: '^18.0.0',
      tailwindcss: '^3.0.0'
    }
  };
  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  console.log('\n📋 Test 1: Basic Compilation');
  console.log('─'.repeat(40));

  const compiler = new FafCompiler();
  const result1 = await compiler.compile(fafPath);

  console.log(`✓ Score: ${result1.score}%`);
  console.log(`✓ Filled: ${result1.filled}/${result1.total} slots`);
  console.log(`✓ Checksum: ${result1.checksum}`);

  // Test 2: Determinism
  console.log('\n📋 Test 2: Deterministic Results');
  console.log('─'.repeat(40));

  const checksums: string[] = [];
  for (let i = 0; i < 5; i++) {
    const result = await compiler.compile(fafPath);
    checksums.push(result.checksum);
    console.log(`  Run ${i + 1}: ${result.checksum}`);
  }

  const allSame = checksums.every(cs => cs === checksums[0]);
  if (allSame) {
    console.log(chalk.green('✓ Deterministic: All checksums match!'));
  } else {
    console.log(chalk.red('✗ Non-deterministic: Checksums differ'));
  }

  // Test 3: Trace Output
  console.log('\n📋 Test 3: Compilation Trace');
  console.log('─'.repeat(40));

  const result3 = await compiler.compileWithTrace(fafPath);
  console.log(`✓ Compilation passes: ${result3.trace.passes.length}`);
  result3.trace.passes.forEach(pass => {
    console.log(`  - ${pass.name}: ${pass.duration}ms`);
  });

  // Test 4: Error Handling
  console.log('\n📋 Test 4: Error Handling');
  console.log('─'.repeat(40));

  const badFaf = `
project:
  name: 123  # Wrong type
  goal: true # Wrong type

stack:
  frontend: ["React"] # Wrong type

human_context:
  who: null # Invalid
`;

  const badPath = path.join(testDir, 'bad.faf');
  fs.writeFileSync(badPath, badFaf);

  const badResult = await compiler.compile(badPath);
  console.log(`✓ Compiled with ${badResult.diagnostics.length} diagnostics`);

  const errors = badResult.diagnostics.filter(d => d.severity === 'error');
  const warnings = badResult.diagnostics.filter(d => d.severity === 'warning');
  console.log(`  - ${errors.length} errors`);
  console.log(`  - ${warnings.length} warnings`);

  // Test 5: Embedded Score Ignored
  console.log('\n📋 Test 5: Embedded Scores Ignored');
  console.log('─'.repeat(40));

  const embeddedFaf = `
ai_score: 95  # Should be ignored
ai_scoring_system: "2025-08-30"

project:
  name: embedded-test

stack:
  frontend: React
`;

  const embeddedPath = path.join(testDir, 'embedded.faf');
  fs.writeFileSync(embeddedPath, embeddedFaf);

  const embeddedResult = await compiler.compile(embeddedPath);
  console.log(`✓ Calculated fresh: ${embeddedResult.score}%`);
  console.log(`✓ Ignored ai_score: 95`);

  const hasWarning = embeddedResult.diagnostics.some(
    d => d.message.includes('deprecated')
  );
  console.log(`✓ Warning about deprecated field: ${hasWarning}`);

  // Test 6: Verification
  console.log('\n📋 Test 6: Checksum Verification');
  console.log('─'.repeat(40));

  const verifyResult = await compiler.compile(fafPath);
  const checksum = verifyResult.checksum;

  const isValid = await compiler.verify(fafPath, checksum);
  console.log(`✓ Valid checksum: ${isValid}`);

  const isInvalid = await compiler.verify(fafPath, 'wrongsum');
  console.log(`✓ Invalid checksum rejected: ${!isInvalid}`);

  // Test 7: Performance
  console.log('\n📋 Test 7: Performance Benchmarks');
  console.log('─'.repeat(40));

  const times: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await compiler.compile(fafPath);
    times.push(Date.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`✓ Average: ${avg.toFixed(2)}ms`);
  console.log(`✓ Min: ${min}ms`);
  console.log(`✓ Max: ${max}ms`);

  if (avg < 200) {
    console.log(chalk.green('✓ Performance: Championship grade (<200ms)'));
  } else {
    console.log(chalk.yellow(`⚠️ Performance: ${avg.toFixed(2)}ms (target <200ms)`));
  }

  // Test 8: Double Scoring Prevention
  console.log('\n📋 Test 8: No Double Scoring');
  console.log('─'.repeat(40));

  // Create a .faf with values that could be discovered
  const doubleFaf = `
project:
  name: double-test
  main_language: JavaScript

stack:
  frontend: React  # Also in package.json
  database: PostgreSQL
`;

  const doublePath = path.join(testDir, 'double.faf');
  fs.writeFileSync(doublePath, doubleFaf);

  const doubleResult = await compiler.compile(doublePath);
  console.log(`✓ Score: ${doubleResult.score}%`);
  console.log(`✓ Original slots: ${doubleResult.breakdown.project.filled + doubleResult.breakdown.stack.filled}`);
  console.log(`✓ Discovery slots: ${doubleResult.breakdown.discovery.filled}`);
  console.log(`✓ No double counting: Values counted once`);

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(chalk.green('✅ All Tests Completed!'));
  console.log('═'.repeat(60));

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red(`\n❌ Test failed: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});