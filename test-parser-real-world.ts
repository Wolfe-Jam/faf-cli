#!/usr/bin/env ts-node
/**
 * 🌍 REAL-WORLD PARSER TEST
 * Actual command-line scenarios that users might throw at us
 */

import { NativeCliParser } from './src/utils/native-cli-parser';

console.log('🌍 REAL-WORLD PARSER TEST');
console.log('=========================\n');

interface RealWorldTest {
  name: string;
  input: string; // What user actually types
  expected: {
    command?: string;
    options?: Record<string, any>;
    args?: string[];
  };
}

const realWorldTests: RealWorldTest[] = [
  {
    name: 'Basic init with force',
    input: 'faf init --force',
    expected: {
      command: 'init',
      options: { force: true }
    }
  },
  {
    name: 'Quiet mode short flag',
    input: 'faf score -q',
    expected: {
      command: 'score',
      options: { quiet: true }
    }
  },
  {
    name: 'Template with equals',
    input: 'faf init --template=react',
    expected: {
      command: 'init',
      options: { template: 'react' }
    }
  },
  {
    name: 'Template with space',
    input: 'faf init --template svelte',
    expected: {
      command: 'init',
      options: { template: 'svelte' }
    }
  },
  {
    name: 'Multiple short flags combined',
    input: 'faf init -qf',
    expected: {
      command: 'init',
      options: { quiet: true, force: true }
    }
  },
  {
    name: 'Path with spaces (quoted)',
    input: 'faf init --output "/Users/John Doe/Projects/my app"',
    expected: {
      command: 'init',
      options: { output: '/Users/John Doe/Projects/my app' }
    }
  },
  {
    name: 'Negative port number',
    input: 'faf serve --port -1',
    expected: {
      command: 'serve',
      options: { port: -1 }
    }
  },
  {
    name: 'Boolean false value',
    input: 'faf build --minify false',
    expected: {
      command: 'build',
      options: { minify: false }
    }
  },
  {
    name: 'Mixed order of flags and args',
    input: 'faf --quiet init --force --template react ./my-app',
    expected: {
      command: 'init',
      options: { quiet: true, force: true, template: 'react' },
      args: ['./my-app']
    }
  },
  {
    name: 'Double dash separator',
    input: 'faf test -- --grep "should work"',
    expected: {
      command: 'test',
      options: {},
      args: ['--grep', 'should work']
    }
  },
  {
    name: 'URL as value',
    input: 'faf fetch --url https://api.example.com/data?key=value&foo=bar',
    expected: {
      command: 'fetch',
      options: { url: 'https://api.example.com/data?key=value&foo=bar' }
    }
  },
  {
    name: 'JSON string as value',
    input: 'faf config --data \'{"name":"test","value":123}\'',
    expected: {
      command: 'config',
      options: { data: '{"name":"test","value":123}' }
    }
  },
  {
    name: 'Multiple values same flag',
    input: 'faf build --exclude node_modules --exclude dist --exclude .git',
    expected: {
      command: 'build',
      options: { exclude: '.git' } // Last one wins (or could be array)
    }
  },
  {
    name: 'No command, just version',
    input: 'faf --version',
    expected: {
      options: { version: true }
    }
  },
  {
    name: 'Help for specific command',
    input: 'faf init --help',
    expected: {
      command: 'init',
      options: { help: true }
    }
  },
  {
    name: 'Complex real FAF command',
    input: 'faf auto -q --force --project-type python-fastapi --no-show',
    expected: {
      command: 'auto',
      options: {
        quiet: true,
        force: true,
        'project-type': 'python-fastapi',
        show: false  // --no-show sets show to false
      }
    }
  },
  {
    name: 'File path that looks like flag',
    input: 'faf read --file',
    expected: {
      command: 'read',
      options: { file: true } // No value provided
    }
  },
  {
    name: 'Numbers in various formats',
    input: 'faf test --timeout 5000 --retries 3 --threshold 0.95',
    expected: {
      command: 'test',
      options: { timeout: 5000, retries: 3, threshold: 0.95 }
    }
  }
];

// Run the tests
let passed = 0;
let failed = 0;

console.log('Testing real-world command patterns:\n');

for (const test of realWorldTests) {
  // Simulate what shell would give us
  const args = ['node', 'faf', ...test.input.split(' ').slice(1)];

  // Handle quoted strings properly
  const processedArgs: string[] = ['node', 'faf'];
  let current = '';
  let inQuote = false;

  for (let i = 2; i < test.input.split(' ').length + 1; i++) {
    const part = test.input.split(' ')[i - 1];
    if (!part) continue;

    if ((part.startsWith('"') || part.startsWith("'")) && !inQuote) {
      inQuote = true;
      current = part.substring(1);
      if (part.endsWith('"') || part.endsWith("'")) {
        processedArgs.push(current.substring(0, current.length - 1));
        current = '';
        inQuote = false;
      }
    } else if (inQuote) {
      current += ' ' + part;
      if (part.endsWith('"') || part.endsWith("'")) {
        processedArgs.push(current.substring(0, current.length - 1));
        current = '';
        inQuote = false;
      }
    } else {
      processedArgs.push(part);
    }
  }

  try {
    const parser = new NativeCliParser();
    parser.setName('faf')
      .setDescription('FAF CLI')
      .setVersion('2.4.5')
      .option('-q, --quiet', 'Quiet mode')
      .option('-f, --force', 'Force mode')
      .option('--no-show', 'Skip showing');

    // Mock up some commands
    parser.command('init').description('Initialize');
    parser.command('score').description('Score');
    parser.command('auto').description('Auto');
    parser.command('test').description('Test');
    parser.command('build').description('Build');
    parser.command('serve').description('Serve');
    parser.command('fetch').description('Fetch');
    parser.command('config').description('Config');
    parser.command('read').description('Read');

    // Suppress output
    const originalExit = process.exit;
    const originalLog = console.log;
    (process as any).exit = () => {};
    console.log = () => {};

    const result = parser.parse(processedArgs);

    // Restore
    process.exit = originalExit;
    console.log = originalLog;

    // Compare results
    let success = true;

    if (test.expected.command !== undefined) {
      if (result.command !== test.expected.command) {
        success = false;
      }
    }

    if (test.expected.options) {
      for (const [key, value] of Object.entries(test.expected.options)) {
        if (result.options[key] !== value) {
          success = false;
          break;
        }
      }
    }

    if (test.expected.args) {
      if (JSON.stringify(result.args) !== JSON.stringify(test.expected.args)) {
        success = false;
      }
    }

    if (success) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Input: ${test.input}`);
      console.log(`   Expected: ${JSON.stringify(test.expected)}`);
      console.log(`   Got: ${JSON.stringify({
        command: result.command,
        options: result.options,
        args: result.args
      })}`);
      failed++;
    }
  } catch (error: any) {
    console.log(`💥 ${test.name} - ${error.message}`);
    failed++;
  }
}

// Test against actual FAF commands
console.log('\n🏁 ACTUAL FAF COMMANDS TEST');
console.log('----------------------------\n');

const fafCommands = [
  'faf init --force',
  'faf auto -q',
  'faf score --details',
  'faf trust --detailed',
  'faf enhance --force',
  'faf tsa -q',
  'faf bi-sync --force',
  'faf formats --pyramid',
  'faf dna',
  'faf clear --cache',
  'faf version',
  'faf --help'
];

console.log('Testing actual FAF commands:');
for (const cmd of fafCommands) {
  const args = ['node', ...cmd.split(' ')];

  try {
    const parser = new NativeCliParser();
    parser.setName('faf').setVersion('2.4.5');

    // Suppress output
    const originalExit = process.exit;
    const originalLog = console.log;
    (process as any).exit = () => {};
    console.log = () => {};

    const result = parser.parse(args);

    process.exit = originalExit;
    console.log = originalLog;

    console.log(`✅ ${cmd.padEnd(30)} → command: ${result.command || 'none'}`);
  } catch (error) {
    console.log(`💥 ${cmd} - FAILED`);
  }
}

// Summary
console.log('\n===============================================');
console.log(`REAL-WORLD TEST RESULTS:`);
console.log(`✅ Passed: ${passed}/${realWorldTests.length}`);
console.log(`❌ Failed: ${failed}/${realWorldTests.length}`);

if (failed === 0) {
  console.log('\n🏆 PARSER HANDLES ALL REAL-WORLD SCENARIOS!');
} else {
  console.log('\n⚠️ Some real-world cases need attention');
}
console.log('===============================================');