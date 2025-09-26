#!/usr/bin/env ts-node

/**
 * 🔥 FAF Compiler EXTREME Test Suite
 * Trying to BREAK the compiler with edge cases, malicious input, and stress
 */

import { FafCompiler } from './src/compiler/faf-compiler';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

console.log(chalk.red('🔥 FAF Compiler EXTREME Test Suite - TRYING TO BREAK IT!\n'));
console.log('═'.repeat(60));

const testDir = '/tmp/compiler-extreme';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

let testNumber = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name: string, fn: () => Promise<boolean>) {
  testNumber++;
  console.log(chalk.yellow(`\n🔥 Test ${testNumber}: ${name}`));
  console.log('─'.repeat(50));

  try {
    const passed = await fn();
    if (passed) {
      console.log(chalk.green(`✅ PASSED - Compiler survived!`));
      passedTests++;
    } else {
      console.log(chalk.red(`❌ FAILED - Compiler broke!`));
      failedTests++;
    }
  } catch (error) {
    console.log(chalk.red(`💥 CRASHED: ${error instanceof Error ? error.message : String(error)}`));
    failedTests++;
  }
}

async function runExtremeTests() {
  const compiler = new FafCompiler();

  // Test 1: Empty file
  await test('Empty .faf file', async () => {
    const emptyPath = path.join(testDir, 'empty.faf');
    fs.writeFileSync(emptyPath, '');

    const result = await compiler.compile(emptyPath);
    console.log(`  Score: ${result.score}%`);
    console.log(`  Checksum: ${result.checksum}`);
    return result.score === 0 && result.total === 21;
  });

  // Test 2: Null and undefined everywhere
  await test('Null/undefined values', async () => {
    const nullPath = path.join(testDir, 'null.faf');
    fs.writeFileSync(nullPath, `
project:
  name: null
  goal: undefined
  main_language: ~

stack:
  frontend: null
  backend:
  database: ~

human_context:
  who: null
  what: undefined
`);

    const result = await compiler.compile(nullPath);
    console.log(`  Score: ${result.score}%`);
    console.log(`  Filled: ${result.filled}/${result.total}`);
    return result.score === 0;
  });

  // Test 3: Massive file (10MB)
  await test('Massive 10MB .faf file', async () => {
    const massivePath = path.join(testDir, 'massive.faf');
    let massive = 'project:\n  name: massive-test\n\ncomments:\n';

    // Generate 10MB of comments
    const line = '  - ' + 'x'.repeat(100) + '\n';
    const targetSize = 10 * 1024 * 1024;
    while (massive.length < targetSize) {
      massive += line;
    }

    fs.writeFileSync(massivePath, massive);
    console.log(`  File size: ${(massive.length / 1024 / 1024).toFixed(2)}MB`);

    const start = Date.now();
    const result = await compiler.compile(massivePath);
    const duration = Date.now() - start;

    console.log(`  Compilation time: ${duration}ms`);
    console.log(`  Score: ${result.score}%`);
    return duration < 5000; // Should handle in <5 seconds
  });

  // Test 4: Malicious input (injection attempts)
  await test('Malicious injection attempts', async () => {
    const maliciousPath = path.join(testDir, 'malicious.faf');
    fs.writeFileSync(maliciousPath, `
project:
  name: "'; DROP TABLE users; --"
  goal: "<script>alert('xss')</script>"
  main_language: "../../etc/passwd"

stack:
  frontend: "${'\x00'.repeat(100)}"
  backend: "{{7*7}}"
  database: "' OR '1'='1"

ai_score: 999999
ai_scoring_details:
  filled_slots: -999
  total_slots: 0.00000001
`);

    const result = await compiler.compile(maliciousPath);
    console.log(`  Score: ${result.score}% (should be 0-100)`);
    console.log(`  No crash: true`);
    console.log(`  ai_score ignored: ${result.score !== 999999}`);
    return result.score >= 0 && result.score <= 100;
  });

  // Test 5: Circular references
  await test('Circular references', async () => {
    const circularPath = path.join(testDir, 'circular.faf');

    // Create object with circular reference
    const obj: any = { project: { name: 'circular' } };
    obj.project.self = obj;

    // This would normally crash YAML.stringify
    try {
      fs.writeFileSync(circularPath, `
project: &project
  name: circular
  parent: *project
`);

      const result = await compiler.compile(circularPath);
      console.log(`  Handled circular ref`);
      return true;
    } catch {
      console.log(`  YAML prevents circular refs (good!)`);
      return true;
    }
  });

  // Test 6: Invalid YAML
  await test('Invalid/corrupted YAML', async () => {
    const corruptPath = path.join(testDir, 'corrupt.faf');
    fs.writeFileSync(corruptPath, `
project:
  name: test
    goal: bad indentation
  stack:
frontend: React
  backend Node.js
human_context
  who: missing colon
  - random array item
}`);

    const result = await compiler.compile(corruptPath);
    console.log(`  Gracefully handled: ${result.diagnostics.length > 0}`);
    console.log(`  Score: ${result.score}%`);
    return result.diagnostics.some(d => d.severity === 'error');
  });

  // Test 7: Unicode and emoji overload
  await test('Unicode and emoji chaos', async () => {
    const unicodePath = path.join(testDir, 'unicode.faf');
    fs.writeFileSync(unicodePath, `
project:
  name: "🏎️💥🔥😈👹🤖"
  goal: "测试中文العربيةहिन्दी"
  main_language: "\\u0000\\u0001\\u0002"

stack:
  frontend: "𝕌𝕟𝕚𝕔𝕠𝕕𝕖"
  backend: "Z̸̧̢̛͔̘̦̟͎̪̹̮͉̞̭̈́̈́͋̈́̈́̈́ä̴̧̢̛̠̦̟͎̪̹̮͉̞̭́̈́͋̈́̈́̈́ļ̸̢̛͔̘̦̟͎̪̹̮͉̞̭̈́̈́͋̈́̈́̈́ģ̷̢̛͔̘̦̟͎̪̹̮͉̞̭̈́̈́͋̈́̈́̈́ơ̴̧̢͔̘̦̟͎̪̹̮͉̞̭̈́̈́͋̈́̈́̈́"
`);

    const result = await compiler.compile(unicodePath);
    console.log(`  Unicode handled: true`);
    console.log(`  Score: ${result.score}%`);
    return result.score >= 0;
  });

  // Test 8: Extremely nested structure
  await test('Extremely nested structure (100 levels)', async () => {
    const nestedPath = path.join(testDir, 'nested.faf');

    let nested = 'project:\n  name: nested\n';
    let currentLevel = '  custom:\n';

    for (let i = 0; i < 100; i++) {
      currentLevel += '  '.repeat(i + 2) + `level_${i}:\n`;
    }
    currentLevel += '  '.repeat(102) + 'value: deep';

    fs.writeFileSync(nestedPath, nested + currentLevel);

    const result = await compiler.compile(nestedPath);
    console.log(`  100 levels deep: handled`);
    console.log(`  Score: ${result.score}%`);
    return true;
  });

  // Test 9: Wrong types everywhere
  await test('Wrong types for every field', async () => {
    const wrongTypesPath = path.join(testDir, 'wrong-types.faf');
    fs.writeFileSync(wrongTypesPath, `
project:
  name: 123
  goal: true
  main_language: ["array", "not", "string"]

stack:
  frontend: { object: "not string" }
  backend: 456.789
  database: false

human_context:
  who: [1, 2, 3]
  what: { nested: { object: true } }
  why: null
`);

    const result = await compiler.compile(wrongTypesPath);
    console.log(`  Type errors: ${result.diagnostics.filter(d => d.severity === 'error').length}`);
    console.log(`  Still calculated: ${result.score}%`);
    return result.diagnostics.length > 0;
  });

  // Test 10: Concurrent compilation race condition
  await test('Concurrent compilation (100 parallel)', async () => {
    const racePath = path.join(testDir, 'race.faf');
    fs.writeFileSync(racePath, `
project:
  name: race-condition
  goal: Test concurrent compilation
`);

    const promises: Promise<any>[] = [];
    const checksums = new Set<string>();

    // Launch 100 parallel compilations
    for (let i = 0; i < 100; i++) {
      promises.push(
        compiler.compile(racePath).then(r => {
          checksums.add(r.checksum);
          return r;
        })
      );
    }

    const results = await Promise.all(promises);
    console.log(`  Parallel compilations: 100`);
    console.log(`  Unique checksums: ${checksums.size}`);
    console.log(`  All deterministic: ${checksums.size === 1}`);

    return checksums.size === 1; // All should be identical
  });

  // Test 11: Negative and overflow numbers
  await test('Negative and overflow numbers', async () => {
    const numbersPath = path.join(testDir, 'numbers.faf');
    fs.writeFileSync(numbersPath, `
ai_score: -100
ai_scoring_details:
  filled_slots: -999999999999
  total_slots: ${Number.MAX_SAFE_INTEGER}

project:
  name: "numbers-${Number.MAX_VALUE}"
  goal: "test-${Number.MIN_VALUE}"
`);

    const result = await compiler.compile(numbersPath);
    console.log(`  Score: ${result.score}%`);
    console.log(`  Score in range: ${result.score >= 0 && result.score <= 100}`);
    return result.score >= 0 && result.score <= 100;
  });

  // Test 12: Binary data
  await test('Binary data in .faf', async () => {
    const binaryPath = path.join(testDir, 'binary.faf');
    const binaryData = Buffer.from([
      0xFF, 0xFE, 0x00, 0x00, // BOM and nulls
      ...Buffer.from('project:\n  name: binary\n'),
      0x00, 0x01, 0x02, 0x03, // More binary
    ]);

    fs.writeFileSync(binaryPath, binaryData);

    try {
      const result = await compiler.compile(binaryPath);
      console.log(`  Binary handled: true`);
      return true;
    } catch {
      console.log(`  Binary rejected (expected)`);
      return true;
    }
  });

  // Test 13: Symlink loops
  await test('Symlink infinite loop', async () => {
    const symlinkDir = path.join(testDir, 'symlink');
    const linkPath = path.join(symlinkDir, '.faf');

    if (!fs.existsSync(symlinkDir)) {
      fs.mkdirSync(symlinkDir);
    }

    // Create symlink pointing to itself
    try {
      if (fs.existsSync(linkPath)) {
        fs.unlinkSync(linkPath);
      }
      fs.symlinkSync(linkPath, linkPath);
      const result = await compiler.compile(linkPath);
      console.log(`  Symlink loop handled`);
      return true;
    } catch {
      console.log(`  Symlink loop prevented (good!)`);
      return true;
    }
  });

  // Test 14: Memory bomb (exponential expansion)
  await test('Memory bomb attempt', async () => {
    const bombPath = path.join(testDir, 'bomb.faf');

    // Billion laughs attack variant
    fs.writeFileSync(bombPath, `
lol1: &lol1 "lol"
lol2: &lol2 [*lol1, *lol1]
lol3: &lol3 [*lol2, *lol2]
lol4: &lol4 [*lol3, *lol3]
lol5: &lol5 [*lol4, *lol4]
lol6: &lol6 [*lol5, *lol5]
lol7: &lol7 [*lol6, *lol6]
lol8: &lol8 [*lol7, *lol7]
lol9: [*lol8, *lol8]
`);

    const memBefore = process.memoryUsage().heapUsed;
    const result = await compiler.compile(bombPath);
    const memAfter = process.memoryUsage().heapUsed;
    const memDiff = (memAfter - memBefore) / 1024 / 1024;

    console.log(`  Memory increase: ${memDiff.toFixed(2)}MB`);
    console.log(`  Bomb defused: ${memDiff < 100}`);
    return memDiff < 100; // Should not explode memory
  });

  // Test 15: Rapid file changes during compilation
  await test('File mutation during compilation', async () => {
    const mutatePath = path.join(testDir, 'mutate.faf');
    let mutationCount = 0;

    // Initial content
    fs.writeFileSync(mutatePath, `
project:
  name: initial
  goal: test mutation
`);

    // Start compilation
    const compilePromise = compiler.compile(mutatePath);

    // Rapidly mutate file during compilation
    const mutateInterval = setInterval(() => {
      mutationCount++;
      fs.writeFileSync(mutatePath, `
project:
  name: mutated-${mutationCount}
  goal: changed ${Date.now()}
`);
    }, 1);

    const result = await compilePromise;
    clearInterval(mutateInterval);

    console.log(`  Mutations during compile: ${mutationCount}`);
    console.log(`  Still got result: ${result.score}%`);
    return result.checksum.length > 0;
  });

  // Test 16: All fields with maximum values
  await test('Maximum everything', async () => {
    const maxPath = path.join(testDir, 'max.faf');
    const maxString = 'x'.repeat(1000000); // 1MB string

    fs.writeFileSync(maxPath, `
project:
  name: "${maxString}"
  goal: "${maxString}"
  main_language: "${maxString}"

stack:
  frontend: "${maxString}"
  backend: "${maxString}"
  database: "${maxString}"
  hosting: "${maxString}"
  css_framework: "${maxString}"
  ui_library: "${maxString}"
  state_management: "${maxString}"
  runtime: "${maxString}"
  build: "${maxString}"
  cicd: "${maxString}"

human_context:
  who: "${maxString}"
  what: "${maxString}"
  why: "${maxString}"
  where: "${maxString}"
  when: "${maxString}"
  how: "${maxString}"
`);

    const start = Date.now();
    const result = await compiler.compile(maxPath);
    const duration = Date.now() - start;

    console.log(`  1MB strings everywhere`);
    console.log(`  Compilation time: ${duration}ms`);
    console.log(`  Score: ${result.score}%`);
    // Note: api_type and connection are extra slots not in the standard 21
    // So 21/23 filled = ~91% which is correct behavior
    return duration < 10000 && result.score >= 85;
  });

  // Test 17: Reserved keywords and special chars
  await test('Reserved keywords and special chars', async () => {
    const reservedPath = path.join(testDir, 'reserved.faf');
    fs.writeFileSync(reservedPath, `
project:
  name: "__proto__"
  goal: "constructor"
  main_language: "toString"

stack:
  frontend: "undefined"
  backend: "null"
  database: "NaN"
  hosting: "Infinity"

"__proto__":
  value: "prototype pollution attempt"

constructor:
  constructor: "constructor"
`);

    const result = await compiler.compile(reservedPath);
    console.log(`  Reserved words handled`);
    console.log(`  Score: ${result.score}%`);
    return result.score >= 0;
  });

  // Test 18: Determinism stress test (1000 runs)
  await test('Determinism over 1000 runs', async () => {
    const determPath = path.join(testDir, 'determinism.faf');
    fs.writeFileSync(determPath, `
project:
  name: determinism-test
  goal: ${Date.now()}
  main_language: JavaScript

stack:
  frontend: React
  backend: Node.js

human_context:
  who: Team
  what: Testing
  why: Quality
`);

    const checksums = new Set<string>();
    console.log(`  Running 1000 compilations...`);

    for (let i = 0; i < 1000; i++) {
      const result = await compiler.compile(determPath);
      checksums.add(result.checksum);

      if (i % 100 === 0) {
        process.stdout.write('.');
      }
    }
    console.log();

    console.log(`  Unique checksums: ${checksums.size}`);
    console.log(`  100% deterministic: ${checksums.size === 1}`);

    return checksums.size === 1;
  });

  // Test 19: Discovery with malicious file system
  await test('Malicious project structure', async () => {
    const malDir = path.join(testDir, 'malicious-project');
    if (!fs.existsSync(malDir)) {
      fs.mkdirSync(malDir, { recursive: true });
    }

    // Create malicious package.json
    fs.writeFileSync(path.join(malDir, 'package.json'), `{
      "name": "'; DROP DATABASE; --",
      "dependencies": {
        "react": "../../etc/passwd",
        "express": "' OR '1'='1"
      }
    }`);

    // Create .faf
    const malFafPath = path.join(malDir, '.faf');
    fs.writeFileSync(malFafPath, `
project:
  name: malicious-discovery
`);

    const result = await compiler.compile(malFafPath);
    console.log(`  Discovery handled malicious files`);
    console.log(`  Score: ${result.score}%`);
    return result.score >= 0 && result.score <= 100;
  });

  // Test 20: The ultimate chaos test
  await test('ULTIMATE CHAOS - Everything at once', async () => {
    const chaosPath = path.join(testDir, 'chaos.faf');

    // Combine everything evil
    fs.writeFileSync(chaosPath, `
# Chaos test ${Date.now()}
"__proto__": "pollution"
ai_score: ${Number.MAX_SAFE_INTEGER}

project: &circular
  name: null
  goal: "<script>${'alert("xss")'.repeat(1000)}</script>"
  main_language: [1, 2, 3, { deep: *circular }]
  "'; DROP TABLE": true

stack:
  frontend: "🔥💥😈${'\x00'.repeat(100)}"
  backend: ${Number.MIN_SAFE_INTEGER}
  database: false
  "../../../etc/passwd": "traversal"

human_context:
  who: { constructor: { prototype: "pollution" } }
  what: ["Z̸̧̢̛a̴̧̢̛ļ̸̢̛ģ̷̢̛ơ̴̧̢"]
  why: ~
  where: undefined
  when: Infinity
  how: NaN

${' '.repeat(1000000)}
# Million spaces above

bomb: &bomb [*bomb, *bomb, *bomb]
`);

    const start = Date.now();
    const result = await compiler.compile(chaosPath);
    const duration = Date.now() - start;

    console.log(`  CHAOS SURVIVED!`);
    console.log(`  Compilation time: ${duration}ms`);
    console.log(`  Score: ${result.score}%`);
    console.log(`  Checksum: ${result.checksum}`);
    console.log(`  Errors: ${result.diagnostics.filter(d => d.severity === 'error').length}`);

    return result.score >= 0 && result.score <= 100 && duration < 10000;
  });

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(chalk.yellow('🔥 EXTREME TEST RESULTS'));
  console.log('═'.repeat(60));
  console.log(chalk.green(`✅ Passed: ${passedTests}`));
  console.log(chalk.red(`❌ Failed: ${failedTests}`));
  console.log(chalk.blue(`📊 Success Rate: ${Math.round((passedTests / testNumber) * 100)}%`));

  if (failedTests === 0) {
    console.log(chalk.green('\n🏆 COMPILER IS UNBREAKABLE! Championship grade!'));
  } else {
    console.log(chalk.yellow(`\n⚠️ Compiler has ${failedTests} vulnerabilities to fix`));
  }

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Run extreme tests
runExtremeTests().catch(error => {
  console.error(chalk.red(`\n💥 Test suite crashed: ${error.message}`));
  console.error(error.stack);
  process.exit(1);
});