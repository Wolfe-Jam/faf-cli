#!/usr/bin/env ts-node
/**
 * 🥊 GLOB vs NATIVE - HEAD TO HEAD COMPARISON
 * Install glob temporarily to compare results
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { findFiles, globReplacements } from './src/utils/native-file-finder';

const TEST_DIR = '/tmp/glob-comparison-test';

console.log('🥊 GLOB vs NATIVE - HEAD TO HEAD');
console.log('==================================\n');

// Install glob temporarily for comparison
console.log('📦 Installing glob temporarily for comparison...');
execSync('npm install glob@11.0.3 --no-save', { cwd: process.cwd() });

// Now import glob
const { glob } = require('glob');

// Clean up and create test directory
if (fs.existsSync(TEST_DIR)) {
  execSync(`rm -rf ${TEST_DIR}`);
}
fs.mkdirSync(TEST_DIR, { recursive: true });

// Create test files with tricky names
const structure = {
  // Standard files
  'src/main.ts': 'main',
  'src/util.js': 'util',
  'src/app.tsx': 'app',
  'src/comp.jsx': 'comp',
  'src/style.css': 'style',
  'src/config.json': 'config',

  // Edge cases that glob handles
  'src/[bracket].ts': 'bracket',
  'src/{brace}.js': 'brace',
  'src/(paren).tsx': 'paren',
  'src/*star*.jsx': 'star',
  'src/?.ts': 'question',
  'src/!bang.js': 'bang',

  // Deep paths
  'src/a/b/c/deep.ts': 'deep',
  'lib/utils/helper.js': 'helper',
  'test/spec/test.spec.ts': 'spec',

  // Should be ignored
  'node_modules/pkg/index.js': 'ignore',
  'dist/bundle.js': 'ignore',
  '.git/config': 'ignore',

  // Python
  'scripts/run.py': 'py',
  'scripts/test.pyw': 'pyw',

  // Framework files
  'pages/index.vue': 'vue',
  'components/App.svelte': 'svelte',
};

// Create files
for (const [filePath, content] of Object.entries(structure)) {
  const fullPath = path.join(TEST_DIR, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

console.log(`✅ Created ${Object.keys(structure).length} test files\n`);

async function compareResults(pattern: string, nativeFunc: () => Promise<string[]>, description: string) {
  console.log(`🔍 TEST: ${description}`);
  console.log(`   Pattern: ${pattern}`);

  // Run glob
  const globFiles = await glob(pattern, {
    cwd: TEST_DIR,
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
  });

  // Run native
  const nativeFiles = await nativeFunc();

  // Normalize paths for comparison
  const globSet = new Set(globFiles.sort());
  const nativeSet = new Set(nativeFiles.map(f => String(f).replace(/^\//, '')).sort());

  // Find differences
  const onlyInGlob = [...globSet].filter(f => !nativeSet.has(f as any));
  const onlyInNative = [...nativeSet].filter(f => !globSet.has(f as any));

  const match = globSet.size === nativeSet.size && onlyInGlob.length === 0;

  console.log(`   Glob found: ${globSet.size} files`);
  console.log(`   Native found: ${nativeSet.size} files`);
  console.log(`   Result: ${match ? '✅ PERFECT MATCH' : '❌ MISMATCH'}`);

  if (!match) {
    if (onlyInGlob.length > 0) {
      console.log(`   Only in glob: ${onlyInGlob.join(', ')}`);
    }
    if (onlyInNative.length > 0) {
      console.log(`   Only in native: ${onlyInNative.join(', ')}`);
    }
  }

  console.log('');
  return match;
}

async function runComparison() {
  const results: boolean[] = [];

  console.log('🏁 STARTING HEAD-TO-HEAD COMPARISON\n');

  // Test 1: All JS/TS files
  results.push(await compareResults(
    '**/*.{js,jsx,ts,tsx}',
    () => globReplacements.jsAndTs(TEST_DIR),
    'JavaScript and TypeScript files'
  ));

  // Test 2: All source files
  results.push(await compareResults(
    '**/*.{svelte,jsx,tsx,vue,ts,js,py}',
    () => globReplacements.allSource(TEST_DIR),
    'All source files'
  ));

  // Test 3: Just TypeScript
  results.push(await compareResults(
    '**/*.ts',
    () => findFiles(TEST_DIR, { extensions: ['.ts'] }),
    'TypeScript only'
  ));

  // Test 4: Python files
  results.push(await compareResults(
    '**/*.py',
    () => globReplacements.python(TEST_DIR),
    'Python files'
  ));

  // Test 5: Deep nested files
  results.push(await compareResults(
    'src/**/*.ts',
    () => findFiles(TEST_DIR, { extensions: ['.ts'] }),
    'TypeScript in src directory'
  ));

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('═══════════════════════════════════');
  console.log(`🏆 COMPARISON COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('═══════════════════════════════════');

  if (passed === total) {
    console.log('🎉 NATIVE FILE FINDER IS 100% GLOB-COMPATIBLE!');
    console.log('💪 ZERO DEPENDENCIES, SAME RESULTS!');
  } else {
    console.log('⚠️  Some differences detected - review needed');
  }

  // Clean up glob
  console.log('\n🧹 Removing temporary glob installation...');
  execSync('npm uninstall glob', { cwd: process.cwd() });
  console.log('✅ Cleanup complete');
}

runComparison().catch(console.error);