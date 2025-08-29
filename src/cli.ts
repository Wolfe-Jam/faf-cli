#!/usr/bin/env node
/**
 * 🚀 .faf CLI - Command Line Interface
 * Universal AI Context Format Tooling
 */

import { program } from 'commander';
import chalk from 'chalk';
import { validateFafFile } from './commands/validate';
import { initFafFile } from './commands/init';
import { scoreFafFile } from './commands/score';
import { syncFafFile } from './commands/sync';
import { auditFafFile } from './commands/audit';
import { lintFafFile } from './commands/lint';

const version = require('../package.json').version;

// CLI Header
console.log(chalk.cyan.bold(`
🚀 .faf CLI v${version}
Universal AI Context Format Tooling
`));

program
  .name('faf')
  .description('CLI tools for .faf (Foundational AI-Context Format)')
  .version(version);

// 📊 faf init - Generate initial .faf file
program
  .command('init')
  .description('Generate initial .faf file from project structure')
  .option('-f, --force', 'Overwrite existing .faf file')
  .option('-t, --template <type>', 'Use specific template (svelte, react, vue, node)', 'auto')
  .option('-o, --output <file>', 'Output file path', '.faf')
  .action(initFafFile);

// ✅ faf validate - Validate .faf format
program
  .command('validate [file]')
  .description('Validate .faf file against schema')
  .option('-s, --schema <version>', 'Schema version to validate against', 'latest')
  .option('-v, --verbose', 'Show detailed validation results')
  .action(validateFafFile);

// 🎯 faf score - Calculate completeness score  
program
  .command('score [file]')
  .description('Calculate .faf completeness score (0-100%)')
  .option('-d, --details', 'Show detailed scoring breakdown')
  .option('-m, --minimum <score>', 'Minimum required score', '50')
  .action(scoreFafFile);

// 🔄 faf sync - Sync with project changes
program
  .command('sync [file]')
  .description('Sync .faf with package.json and project changes')
  .option('-a, --auto', 'Automatically apply detected changes')
  .option('-d, --dry-run', 'Show changes without applying')
  .action(syncFafFile);

// 🔍 faf audit - Check freshness and completeness
program
  .command('audit [file]')
  .description('Audit .faf file for staleness and gaps')
  .option('-w, --warn-days <days>', 'Warn if older than N days', '7')
  .option('-e, --error-days <days>', 'Error if older than N days', '30')
  .action(auditFafFile);

// 🔧 faf lint - Format compliance checking
program
  .command('lint [file]')
  .description('Lint .faf file for format compliance')
  .option('-f, --fix', 'Automatically fix formatting issues')
  .option('--schema-version <version>', 'Validate against specific schema version')
  .action(lintFafFile);

// Handle unknown commands
program
  .command('*', { noHelp: true })
  .action((cmd) => {
    console.log(chalk.red(`❌ Unknown command: ${cmd}`));
    console.log(chalk.yellow('Run "faf --help" to see available commands'));
    process.exit(1);
  });

// Parse CLI arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export for programmatic use
export { program };