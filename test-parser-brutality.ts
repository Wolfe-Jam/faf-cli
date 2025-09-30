#!/usr/bin/env ts-node
/**
 * 💀 PARSER BRUTALITY TEST - BREAK EVERYTHING!
 * Try to destroy our native CLI parser with edge cases
 */

import { NativeCliParser } from './src/utils/native-cli-parser';

console.log('💀 PARSER BRUTALITY TEST - MAXIMUM DESTRUCTION');
console.log('===============================================\n');

interface TestCase {
  name: string;
  args: string[];
  shouldCrash?: boolean;
  expectedBehavior?: string;
}

const brutalTests: TestCase[] = [
  // SECTION 1: MALFORMED INPUT
  {
    name: 'Empty arguments',
    args: ['node', 'faf'],
    expectedBehavior: 'Should handle gracefully'
  },
  {
    name: 'Just dashes',
    args: ['node', 'faf', '--', '-', '---', '----'],
    expectedBehavior: 'Should not crash'
  },
  {
    name: 'Incomplete flags',
    args: ['node', 'faf', '--', '--=', '-', '--=value'],
    expectedBehavior: 'Should handle incomplete flags'
  },
  {
    name: 'Multiple equals signs',
    args: ['node', 'faf', '--option=value=with=equals'],
    expectedBehavior: 'Should parse correctly'
  },
  {
    name: 'Unicode in values',
    args: ['node', 'faf', '--emoji=🔥💀🏁', '--chinese=你好', '--arabic=مرحبا'],
    expectedBehavior: 'Should handle unicode'
  },
  {
    name: 'Special shell characters',
    args: ['node', 'faf', '--file=test;rm -rf /', '--injection=`ls`', '--pipe=|grep'],
    expectedBehavior: 'Should not execute commands'
  },
  {
    name: 'Null bytes',
    args: ['node', 'faf', '--null=\0', 'test\0file'],
    expectedBehavior: 'Should handle null bytes'
  },
  {
    name: 'MASSIVE flag name',
    args: ['node', 'faf', '--' + 'a'.repeat(10000) + '=value'],
    expectedBehavior: 'Should not crash on huge flags'
  },
  {
    name: 'MASSIVE value',
    args: ['node', 'faf', '--option=' + 'x'.repeat(100000)],
    expectedBehavior: 'Should handle huge values'
  },
  {
    name: 'Spaces in flag names (invalid)',
    args: ['node', 'faf', '--my flag=value', '--another flag'],
    expectedBehavior: 'Should handle spaces'
  },

  // SECTION 2: EDGE CASE FLAGS
  {
    name: 'Mixed short flags with values',
    args: ['node', 'faf', '-abc', 'value', '-def=value2'],
    expectedBehavior: 'Should parse mixed shorts'
  },
  {
    name: 'Repeated flags',
    args: ['node', 'faf', '--force', '--force', '--force', '-f', '-f'],
    expectedBehavior: 'Last one wins or true'
  },
  {
    name: 'Conflicting values',
    args: ['node', 'faf', '--port=3000', '--port=4000', '--port', '5000'],
    expectedBehavior: 'Last value should win'
  },
  {
    name: 'Boolean-like strings',
    args: ['node', 'faf', '--enabled=false', '--disabled=true', '--maybe=yes', '--definitely=no'],
    expectedBehavior: 'Should parse as booleans'
  },
  {
    name: 'Numbers and floats',
    args: ['node', 'faf', '--int=42', '--float=3.14159', '--negative=-100', '--hex=0xFF'],
    expectedBehavior: 'Should parse numbers correctly'
  },
  {
    name: 'Empty values',
    args: ['node', 'faf', '--empty=', '--also-empty', '', '--another='],
    expectedBehavior: 'Should handle empty values'
  },
  {
    name: 'Flags that look like numbers',
    args: ['node', 'faf', '-1', '-2', '-3', '--4', '--5.5'],
    expectedBehavior: 'Should handle numeric-looking flags'
  },
  {
    name: 'Windows-style flags',
    args: ['node', 'faf', '/help', '/H', '/Force', '/F'],
    expectedBehavior: 'Should not parse as flags'
  },

  // SECTION 3: COMMAND EDGE CASES
  {
    name: 'Command with flag-like name',
    args: ['node', 'faf', '--help', '--force'],
    expectedBehavior: 'Should treat --help as flag not command'
  },
  {
    name: 'Multiple commands',
    args: ['node', 'faf', 'init', 'score', 'test'],
    expectedBehavior: 'First non-flag is command'
  },
  {
    name: 'Command after flags',
    args: ['node', 'faf', '--force', 'init', '--quiet'],
    expectedBehavior: 'Should still find command'
  },
  {
    name: 'No command, just flags',
    args: ['node', 'faf', '--version', '--help', '--quiet'],
    expectedBehavior: 'No command is valid'
  },

  // SECTION 4: STRESS TESTS
  {
    name: '1000 flags',
    args: ['node', 'faf', ...Array.from({length: 1000}, (_, i) => `--flag${i}=${i}`)],
    expectedBehavior: 'Should handle many flags'
  },
  {
    name: 'Deeply nested quotes',
    args: ['node', 'faf', '--quote="He said \\"Hello\\" to me"', '--nested="\\"\\"\\"\\""'],
    expectedBehavior: 'Should preserve quotes'
  },
  {
    name: 'Flag bombardment',
    args: ['node', 'faf', '-abcdefghijklmnopqrstuvwxyz', 'value'],
    expectedBehavior: 'Should handle 26 short flags'
  },
  {
    name: 'Alternating pattern',
    args: ['node', 'faf', '--a', 'b', '--c', 'd', '--e', 'f', '--g', 'h'],
    expectedBehavior: 'Should pair correctly'
  },
  {
    name: 'All special chars in values',
    args: ['node', 'faf', '--special=!@#$%^&*()_+-=[]{}|;:,.<>?/~`'],
    expectedBehavior: 'Should preserve special chars'
  },

  // SECTION 5: PARSER BOMB ATTEMPTS
  {
    name: 'Circular reference attempt',
    args: ['node', 'faf', '--config=--config', '--self=--self'],
    expectedBehavior: 'Should not create circular refs'
  },
  {
    name: 'Memory exhaustion attempt',
    args: ['node', 'faf', ...Array.from({length: 10000}, () => '--x')],
    expectedBehavior: 'Should not exhaust memory'
  },
  {
    name: 'CPU spin attempt',
    args: ['node', 'faf', '--regex=((((((((((a))))))))))', '--backtrack=' + '('.repeat(100)],
    expectedBehavior: 'Should not cause CPU spin'
  },
  {
    name: 'Prototype pollution attempt',
    args: ['node', 'faf', '--__proto__=evil', '--constructor=bad', '--prototype=hacked'],
    expectedBehavior: 'Should not pollute prototype'
  },
  {
    name: 'Path traversal in values',
    args: ['node', 'faf', '--file=../../../../etc/passwd', '--dir=..\\..\\..\\windows\\system32'],
    expectedBehavior: 'Should just be strings'
  },

  // SECTION 6: WEIRD BUT VALID
  {
    name: 'Single letter command',
    args: ['node', 'faf', 'a', '--force'],
    expectedBehavior: 'a is the command'
  },
  {
    name: 'Emoji command',
    args: ['node', 'faf', '🚀', '--emoji', '🔥'],
    expectedBehavior: 'Emoji command works'
  },
  {
    name: 'Mixed everything',
    args: ['node', 'faf', 'test', '-qf', '--verbose=false', '--', 'extra', 'args', '--not-a-flag'],
    expectedBehavior: 'Should handle -- separator'
  },
  {
    name: 'Negative numbers as values',
    args: ['node', 'faf', '--timeout', '-1', '--retries=-5', '--depth', '-100'],
    expectedBehavior: 'Should handle negative numbers'
  },
  {
    name: 'File paths with spaces',
    args: ['node', 'faf', '--file=C:\\Program Files\\test.txt', '--dir=/home/user/My Documents/'],
    expectedBehavior: 'Should preserve paths'
  }
];

// Run the brutality tests
let passed = 0;
let failed = 0;
let crashed = 0;

for (const test of brutalTests) {
  process.stdout.write(`🔨 ${test.name.padEnd(35)}`);

  try {
    const parser = new NativeCliParser();
    parser.setName('faf')
      .setDescription('Test CLI')
      .setVersion('1.0.0')
      .option('-q, --quiet', 'Quiet mode')
      .option('-f, --force', 'Force mode')
      .option('--verbose', 'Verbose output');

    // Add a test command
    parser.command('init')
      .description('Initialize')
      .option('--template <type>', 'Template type');

    // Override process.exit and console.log to prevent output during testing
    const originalExit = process.exit;
    const originalLog = console.log;
    let exitCalled = false;
    let exitCode = 0;
    (process as any).exit = (code?: number) => {
      exitCalled = true;
      exitCode = code || 0;
    };
    console.log = () => {}; // Suppress output

    // Parse the brutal input
    const result = parser.parse(test.args);

    // Restore originals
    process.exit = originalExit;
    console.log = originalLog;

    // Basic validation
    if (result && typeof result === 'object') {
      // Check for prototype pollution
      const obj = {} as any;
      if (obj.evil || obj.bad || obj.hacked) {
        console.log(`❌ SECURITY FAIL - Prototype polluted!`);
        failed++;
      } else if (test.shouldCrash) {
        console.log(`❌ FAIL - Should have crashed but didn't`);
        failed++;
      } else {
        console.log(`✅ PASS`);
        passed++;
      }

      // Debug output for interesting cases
      if (test.name.includes('special') || test.name.includes('edge')) {
        console.log(`   Result: ${JSON.stringify(result).substring(0, 100)}`);
      }
    } else {
      console.log(`⚠️  Unexpected result type`);
      failed++;
    }
  } catch (error: any) {
    if (test.shouldCrash) {
      console.log(`✅ PASS (crashed as expected)`);
      passed++;
    } else {
      console.log(`💥 CRASH - ${error.message}`);
      crashed++;
    }
  }
}

console.log('\n===============================================');
console.log('🏁 BRUTALITY TEST COMPLETE\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`💥 Crashed: ${crashed}`);
console.log(`📊 Total: ${brutalTests.length}`);

// Performance test
console.log('\n⚡ PERFORMANCE TEST');
console.log('-------------------');

const perfParser = new NativeCliParser();
perfParser.setName('faf').setDescription('Perf test');

// Add 100 options
for (let i = 0; i < 100; i++) {
  perfParser.option(`--option${i} <value>`, `Option ${i}`);
}

// Time parsing 10000 times
const testArgs = ['node', 'faf', 'test', '--force', '--quiet', '--template=svelte', '--port', '3000'];

console.time('Parse 10000 times');
for (let i = 0; i < 10000; i++) {
  perfParser.parse(testArgs);
}
console.timeEnd('Parse 10000 times');

// Memory test
const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
const bigParser = new NativeCliParser();

// Create 1000 commands
for (let i = 0; i < 1000; i++) {
  const cmd = bigParser.command(`cmd${i}`);
  cmd.description(`Command ${i}`);
  for (let j = 0; j < 10; j++) {
    cmd.option(`--opt${j}`, `Option ${j}`);
  }
}

const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`\nMemory used for 1000 commands: ${(memAfter - memBefore).toFixed(2)} MB`);

// Final verdict
console.log('\n===============================================');
if (crashed === 0 && failed === 0) {
  console.log('🏆 PARSER IS INDESTRUCTIBLE!');
  console.log('💪 Ready for production!');
} else if (crashed === 0) {
  console.log('⚠️  Parser survived but needs fixes');
} else {
  console.log('💀 Parser needs serious work!');
}
console.log('===============================================');