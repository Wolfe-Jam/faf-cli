/**
 * 🧪 C-Mirror Conversion Test Runner
 * WJTC Standard Testing
 *
 * Tests YAML ↔ Markdown conversion resilience
 * Focus: Find every way this breaks and fix it
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';
import { fafToClaudeMd } from '../../src/engines/c-mirror/core/faf-to-claude';
import { claudeMdToFaf } from '../../src/engines/c-mirror/core/claude-to-faf';

interface TestResult {
  testId: string;
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  roundTripPassed?: boolean;
  roundTripError?: string;
  duration: number;
}

interface TestSuite {
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  duration: number;
  results: TestResult[];
}

/**
 * Run a single conversion test
 */
async function runTest(testId: string, testName: string, category: string): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    testId,
    name: testName,
    category,
    passed: false,
    duration: 0
  };

  try {
    const fixturesDir = path.join(__dirname, 'fixtures');
    const resultsDir = path.join(__dirname, 'results');

    // Read input .faf file
    const fafPath = path.join(fixturesDir, `${testId}.faf`);
    const fafContent = await fs.readFile(fafPath, 'utf-8');

    // Read expected CLAUDE.md output (if exists)
    const expectedPath = path.join(fixturesDir, `${testId}.expected.md`);
    const expectedExists = await fs.access(expectedPath).then(() => true).catch(() => false);

    // Convert .faf → CLAUDE.md
    console.log(`  Converting ${testId}.faf → CLAUDE.md...`);
    const claudeMdContent = await fafToClaudeMd(fafContent, process.cwd());

    // Save actual output
    const actualPath = path.join(resultsDir, `${testId}.actual.md`);
    await fs.writeFile(actualPath, claudeMdContent, 'utf-8');

    // Compare to expected (if exists)
    if (expectedExists) {
      const expectedContent = await fs.readFile(expectedPath, 'utf-8');
      if (claudeMdContent.trim() === expectedContent.trim()) {
        console.log(`  ✅ Output matches expected`);
        result.passed = true;
      } else {
        console.log(`  ❌ Output differs from expected`);
        result.passed = false;
        result.error = 'Output does not match expected';

        // Save diff
        const diffPath = path.join(resultsDir, `${testId}.diff`);
        await fs.writeFile(diffPath, `EXPECTED:\n${expectedContent}\n\nACTUAL:\n${claudeMdContent}`, 'utf-8');
      }
    } else {
      // No expected file - just verify it doesn't crash
      console.log(`  ✅ Conversion completed (no expected file to compare)`);
      result.passed = true;
    }

    // Test round-trip conversion
    console.log(`  Testing round-trip: CLAUDE.md → .faf...`);
    try {
      const originalFafData = YAML.parse(fafContent);
      const roundTripFafContent = await claudeMdToFaf(claudeMdContent, originalFafData, process.cwd());
      const roundTripFafData = YAML.parse(roundTripFafContent);

      // Save round-trip result
      const roundTripPath = path.join(resultsDir, `${testId}.roundtrip.faf`);
      await fs.writeFile(roundTripPath, roundTripFafContent, 'utf-8');

      // Check critical fields preserved
      const criticalFields = ['project', 'faf_score', 'ai_score', 'human_score', 'technical_credit'];
      let roundTripOk = true;

      for (const field of criticalFields) {
        if (originalFafData[field] !== undefined) {
          if (JSON.stringify(originalFafData[field]) !== JSON.stringify(roundTripFafData[field])) {
            console.log(`  ⚠️  Round-trip: Field '${field}' changed`);
            roundTripOk = false;
          }
        }
      }

      if (roundTripOk) {
        console.log(`  ✅ Round-trip preserves critical fields`);
        result.roundTripPassed = true;
      } else {
        console.log(`  ❌ Round-trip lost data`);
        result.roundTripPassed = false;
        result.roundTripError = 'Critical fields not preserved';
      }

    } catch (error) {
      console.log(`  ❌ Round-trip failed: ${error instanceof Error ? error.message : String(error)}`);
      result.roundTripPassed = false;
      result.roundTripError = error instanceof Error ? error.message : String(error);
    }

  } catch (error) {
    console.log(`  ❌ Test error: ${error instanceof Error ? error.message : String(error)}`);
    result.passed = false;
    result.error = error instanceof Error ? error.message : String(error);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<TestSuite> {
  console.log('🧪 C-MIRROR CONVERSION TESTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();
  const suite: TestSuite = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: 0,
    duration: 0,
    results: []
  };

  // Define test cases
  const tests: Array<{ id: string; name: string; category: string }> = [
    // Category A: Special Characters
    { id: '001-colons-in-text', name: 'Colons in text values', category: 'Special Characters' },
    { id: '002-hashes-in-text', name: 'Hash symbols in text', category: 'Special Characters' },
    { id: '003-pipes-in-text', name: 'Pipe symbols in text', category: 'Special Characters' },
    { id: '004-backticks-in-text', name: 'Backticks in text', category: 'Special Characters' },
    { id: '005-asterisks-in-text', name: 'Asterisks in text', category: 'Special Characters' },
    { id: '006-brackets-in-text', name: 'Brackets in text', category: 'Special Characters' },
    { id: '007-quotes-in-text', name: 'Quotes in text', category: 'Special Characters' },
    { id: '008-backslashes', name: 'Backslashes in paths', category: 'Special Characters' },
    { id: '009-emoji-hell', name: 'Emoji chaos', category: 'Special Characters' },
    { id: '010-unicode', name: 'Unicode characters', category: 'Special Characters' },

    // Category B: Whitespace
    { id: '011-trailing-spaces', name: 'Trailing spaces', category: 'Whitespace' },
    { id: '012-leading-spaces', name: 'Leading spaces', category: 'Whitespace' },
    { id: '013-multiple-blank-lines', name: 'Multiple blank lines', category: 'Whitespace' },

    // Category C: Multiline
    { id: '014-literal-block', name: 'Literal block scalar', category: 'Multiline' },
    { id: '015-folded-block', name: 'Folded block scalar', category: 'Multiline' },

    // Category D: YAML Edge Cases
    { id: '016-null-values', name: 'Null values', category: 'YAML Edge Cases' },
    { id: '017-boolean-variations', name: 'Boolean variations', category: 'YAML Edge Cases' },
    { id: '018-numbers', name: 'Number types', category: 'YAML Edge Cases' },

    // Category F: Round-Trip
    { id: '019-round-trip-basic', name: 'Basic round-trip', category: 'Round-Trip' },
    { id: '020-round-trip-complex', name: 'Complex nested round-trip', category: 'Round-Trip' },
  ];

  // Run each test
  for (const test of tests) {
    console.log(`\n📝 Test ${test.id}: ${test.name}`);
    console.log(`   Category: ${test.category}`);

    const result = await runTest(test.id, test.name, test.category);
    suite.results.push(result);
    suite.totalTests++;

    if (result.passed && result.roundTripPassed) {
      suite.passed++;
    } else if (result.error) {
      suite.errors++;
    } else {
      suite.failed++;
    }
  }

  suite.duration = Date.now() - startTime;

  // Print summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Tests: ${suite.totalTests}`);
  console.log(`✅ Passed: ${suite.passed}`);
  console.log(`❌ Failed: ${suite.failed}`);
  console.log(`💥 Errors: ${suite.errors}`);
  console.log(`⏱️  Duration: ${suite.duration}ms`);
  console.log('');

  // Print failures
  if (suite.failed > 0 || suite.errors > 0) {
    console.log('🚨 FAILED TESTS:');
    for (const result of suite.results) {
      if (!result.passed || !result.roundTripPassed) {
        console.log(`  ${result.testId}: ${result.name}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
        if (result.roundTripError) {
          console.log(`    Round-trip error: ${result.roundTripError}`);
        }
      }
    }
    console.log('');
  }

  // Save results
  const resultsPath = path.join(__dirname, 'results', 'test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(suite, null, 2), 'utf-8');
  console.log(`📄 Results saved to: ${resultsPath}`);

  return suite;
}

// Run tests
runAllTests()
  .then((suite) => {
    process.exit(suite.failed === 0 && suite.errors === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
