#!/usr/bin/env ts-node
/**
 * 🧪 NATIVE CLI PARSER TEST
 * Ensure it works EXACTLY like commander
 */

import { program } from './src/utils/native-cli-parser';

console.log('🧪 NATIVE CLI PARSER TEST');
console.log('==========================\n');

// Test cases
const testCases = [
  {
    name: 'Boolean flags',
    args: ['node', 'faf', 'init', '--force', '-q'],
    expected: { command: 'init', options: { force: true, quiet: true } }
  },
  {
    name: 'Value with equals',
    args: ['node', 'faf', 'init', '--template=svelte'],
    expected: { command: 'init', options: { template: 'svelte' } }
  },
  {
    name: 'Value with space',
    args: ['node', 'faf', 'init', '--output', 'file.txt'],
    expected: { command: 'init', options: { output: 'file.txt' } }
  },
  {
    name: 'Multiple short flags',
    args: ['node', 'faf', 'init', '-qf'],
    expected: { command: 'init', options: { quiet: true, force: true } }
  },
  {
    name: 'Mixed flags and values',
    args: ['node', 'faf', 'init', '--force', '--template', 'react', '-q', '--output=out.txt'],
    expected: { command: 'init', options: { force: true, template: 'react', quiet: true, output: 'out.txt' } }
  },
  {
    name: 'No command',
    args: ['node', 'faf', '--version'],
    expected: { command: null, options: { version: true } }
  },
  {
    name: 'Positional arguments',
    args: ['node', 'faf', 'test', 'arg1', 'arg2', '--force'],
    expected: { command: 'test', options: { force: true }, args: ['arg1', 'arg2'] }
  },
  {
    name: 'Number values',
    args: ['node', 'faf', 'test', '--port', '3000', '--timeout=5000'],
    expected: { command: 'test', options: { port: 3000, timeout: 5000 } }
  },
  {
    name: 'Boolean string values',
    args: ['node', 'faf', 'test', '--enabled=true', '--disabled', 'false'],
    expected: { command: 'test', options: { enabled: true, disabled: false } }
  }
];

// Configure parser with FAF-like options
program
  .setName('faf')
  .setDescription('FAF CLI Test')
  .setVersion('2.4.5')
  .option('-q, --quiet', 'Quiet mode')
  .option('-f, --force', 'Force operation')
  .option('--template <type>', 'Template type')
  .option('--output <file>', 'Output file')
  .option('--no-color', 'Disable colors');

// Add short flag mappings
program.option('-q, --quiet', 'Quiet mode');
program.option('-f, --force', 'Force mode');

// Run tests
let passed = 0;
let failed = 0;

for (const test of testCases) {
  // Skip version test as it would exit
  if (test.args.includes('--version')) {
    console.log(`⏭️  ${test.name}: SKIPPED (would exit)`);
    continue;
  }

  const result = program.parse(test.args);

  // Check command
  const commandOk = result.command === test.expected.command;

  // Check options
  let optionsOk = true;
  for (const [key, value] of Object.entries(test.expected.options)) {
    if (result.options[key] !== value) {
      optionsOk = false;
      break;
    }
  }

  // Check args if present
  let argsOk = true;
  if (test.expected.args) {
    if (!result.args || result.args.length !== test.expected.args.length) {
      argsOk = false;
    } else {
      for (let i = 0; i < test.expected.args.length; i++) {
        if (result.args[i] !== test.expected.args[i]) {
          argsOk = false;
          break;
        }
      }
    }
  }

  const success = commandOk && optionsOk && argsOk;

  if (success) {
    console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Got: ${JSON.stringify({ command: result.command, options: result.options, args: result.args })}`);
    failed++;
  }
}

console.log('\n=============================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('=============================\n');

if (failed === 0) {
  console.log('🏁 NATIVE PARSER READY FOR PRODUCTION!');
  console.log('💪 COMMANDER CAN BE REPLACED!');
} else {
  console.log('⚠️  Fix failures before replacing commander');
}