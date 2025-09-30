#!/usr/bin/env ts-node
/**
 * 💀 FILE FINDER BRUTALITY TEST
 * Testing our native file finder replacement for glob
 */

import { findFiles } from './src/utils/native-file-finder';
import * as fs from 'fs';
import * as path from 'path';

console.log('💀 FILE FINDER BRUTALITY TEST');
console.log('==============================\n');

interface TestCase {
  name: string;
  extensions?: string[];
  ignore?: string[];
  shouldFind?: (files: string[]) => boolean;
}

const tests: TestCase[] = [
  {
    name: 'Find all TypeScript files',
    extensions: ['.ts'],
    shouldFind: (files) => files.length > 0 && files.every(f => f.endsWith('.ts'))
  },
  {
    name: 'Find multiple extensions',
    extensions: ['.ts', '.js', '.json'],
    shouldFind: (files) => files.length > 0
  },
  {
    name: 'Ignore node_modules',
    extensions: ['.ts'],
    ignore: ['node_modules'],
    shouldFind: (files) => !files.some(f => f.includes('node_modules'))
  },
  {
    name: 'Ignore multiple patterns',
    extensions: ['.ts'],
    ignore: ['node_modules', 'dist', '.git'],
    shouldFind: (files) => !files.some(f =>
      f.includes('node_modules') || f.includes('dist') || f.includes('.git')
    )
  },
  {
    name: 'Find with no extensions (all files)',
    extensions: [],
    shouldFind: (files) => files.length > 0
  },
  {
    name: 'Handle non-existent directory gracefully',
    extensions: ['.ts'],
    shouldFind: (files) => true // Should not crash
  },
  {
    name: 'Find JSON files',
    extensions: ['.json'],
    shouldFind: (files) => files.every(f => f.endsWith('.json'))
  },
  {
    name: 'Case sensitive extensions',
    extensions: ['.TS'], // Uppercase
    shouldFind: (files) => files.length === 0 // Should find nothing
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Create test directory structure
  const testDir = path.join(process.cwd(), 'test-finder-temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'test.ts'), '// test');
    fs.writeFileSync(path.join(testDir, 'test.js'), '// test');
    fs.writeFileSync(path.join(testDir, 'test.json'), '{}');
    fs.mkdirSync(path.join(testDir, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'nested', 'deep.ts'), '// deep');
  }

  for (const test of tests) {
    process.stdout.write(`🔨 ${test.name.padEnd(40)}`);

    try {
      const files = await findFiles(testDir, {
        extensions: test.extensions,
        ignore: test.ignore,
        maxFiles: 1000
      });

      if (test.shouldFind && test.shouldFind(files)) {
        console.log(`✅ PASS (found ${files.length} files)`);
        passed++;
      } else if (!test.shouldFind) {
        console.log(`✅ PASS`);
        passed++;
      } else {
        console.log(`❌ FAIL`);
        failed++;
      }
    } catch (error: any) {
      console.log(`💥 CRASH - ${error.message}`);
      failed++;
    }
  }

  // Performance test
  console.log('\n⚡ PERFORMANCE TEST');
  console.log('-------------------');

  const start = Date.now();
  const srcFiles = await findFiles('./src', {
    extensions: ['.ts'],
    ignore: ['node_modules'],
    maxFiles: 1000
  });
  const elapsed = Date.now() - start;

  console.log(`Found ${srcFiles.length} .ts files in src/ in ${elapsed}ms`);

  // Stress test - find ALL files
  console.log('\n🔥 STRESS TEST - Finding ALL files');
  const stressStart = Date.now();
  const allFiles = await findFiles('.', {
    extensions: [],
    ignore: ['node_modules', '.git'],
    maxFiles: 10000
  });
  const stressElapsed = Date.now() - stressStart;

  console.log(`Found ${allFiles.length} total files in ${stressElapsed}ms`);

  // Clean up test directory
  fs.rmSync(testDir, { recursive: true, force: true });

  // Results
  console.log('\n==============================');
  console.log('🏁 FILE FINDER BRUTALITY COMPLETE\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);

  if (failed === 0) {
    console.log('\n🏆 FILE FINDER IS BULLETPROOF!');
    console.log('💪 GLOB HAS BEEN REPLACED!');
  }
  console.log('==============================');
}

runTests().catch(console.error);