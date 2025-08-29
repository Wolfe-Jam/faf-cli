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
  .description('STOP faffing About! Generate perfect AI context files from any project.')
  .version(version);

// Add comprehensive help examples
program.on('--help', () => {
  console.log('');
  console.log(chalk.yellow.bold('🎯 Quick Start:'));
  console.log('');
  console.log('  $ ' + chalk.cyan('faf init') + '                    # Generate .faf file for this project');
  console.log('  $ ' + chalk.cyan('faf score --details') + '         # See completeness score breakdown');
  console.log('  $ ' + chalk.cyan('faf validate') + '               # Check if .faf file is valid');
  console.log('');
  console.log(chalk.yellow.bold('💡 Common Workflows:'));
  console.log('');
  console.log(chalk.gray('  New project:'));
  console.log('  $ ' + chalk.cyan('faf init --force') + '           # Create .faf file (overwrite existing)');
  console.log('  $ ' + chalk.cyan('faf score') + '                  # Check initial score');
  console.log('');
  console.log(chalk.gray('  Improve quality:'));
  console.log('  $ ' + chalk.cyan('faf score --details') + '         # See what\'s missing');
  console.log('  $ ' + chalk.cyan('faf lint --fix') + '             # Auto-fix formatting');
  console.log('  $ ' + chalk.cyan('faf audit') + '                  # Check freshness');
  console.log('');
  console.log(chalk.gray('  Team handoff:'));
  console.log('  $ ' + chalk.cyan('faf sync --auto') + '            # Update with latest changes');
  console.log('  $ ' + chalk.cyan('faf validate') + '               # Ensure it\'s ready');
  console.log('');
  console.log(chalk.yellow.bold('🚀 What is .faf?'));
  console.log('');
  console.log('  .faf files contain your project\'s "DNA" - everything an AI needs to understand');
  console.log('  your codebase instantly. Think package.json, but for AI collaboration.');
  console.log('');
  console.log('  • ' + chalk.green('Replaces 20+ questions') + ' with one file');
  console.log('  • ' + chalk.green('Works with any project type') + ' (React, Python, Node.js, etc.)');
  console.log('  • ' + chalk.green('Scores your context quality') + ' (aim for 70%+)');
  console.log('');
  console.log(chalk.gray('  Learn more: https://github.com/wolfejam/faf-cli'));
});

// 📊 faf init - Create perfect AI context instantly
program
  .command('init [directory]')
  .description('Create .faf file from your project (detects React, Python, Node.js, etc.)')
  .option('-f, --force', 'Overwrite existing .faf file')
  .option('-t, --template <type>', 'Use specific template (svelte, react, vue, node)', 'auto')
  .option('-o, --output <file>', 'Output file path')
  .addHelpText('after', `
Examples:
  $ faf init                     # Detect project type automatically
  $ faf init --force             # Overwrite existing .faf file
  $ faf init my-app              # Create .faf for different directory
  $ faf init -t react            # Force React template`)
  .action((directory, options) => initFafFile(directory, options));

// ✅ faf validate - Check your .faf file is correct
program
  .command('validate [file]')
  .description('Check if .faf file is valid and properly formatted')
  .option('-s, --schema <version>', 'Schema version to validate against', 'latest')
  .option('-v, --verbose', 'Show detailed validation results')
  .addHelpText('after', `
Examples:
  $ faf validate                 # Check .faf in current directory
  $ faf validate project.faf     # Check specific file
  $ faf validate --verbose       # See detailed validation info`)
  .action(validateFafFile);

// 🎯 faf score - See how complete your context is  
program
  .command('score [file]')
  .description('Rate your .faf completeness (0-100%). Aim for 70%+ for good AI context.')
  .option('-d, --details', 'Show detailed scoring breakdown')
  .option('-m, --minimum <score>', 'Minimum required score', '50')
  .addHelpText('after', `
Examples:
  $ faf score                    # Quick score check
  $ faf score --details          # See what's missing for higher score
  $ faf score --minimum 80       # Fail if score below 80%`)
  .action(scoreFafFile);

// 🔄 faf sync - Keep .faf up-to-date automatically
program
  .command('sync [file]')
  .description('Update .faf when package.json or dependencies change')
  .option('-a, --auto', 'Automatically apply detected changes')
  .option('-d, --dry-run', 'Show changes without applying')
  .addHelpText('after', `
Examples:
  $ faf sync                     # Show what needs updating
  $ faf sync --auto              # Update automatically
  $ faf sync --dry-run           # Preview changes only`)
  .action(syncFafFile);

// 🔍 faf audit - Check if your .faf is fresh
program
  .command('audit [file]')
  .description('Check if .faf file is up-to-date and complete')
  .option('-w, --warn-days <days>', 'Warn if older than N days', '7')
  .option('-e, --error-days <days>', 'Error if older than N days', '30')
  .addHelpText('after', `
Examples:
  $ faf audit                    # Check freshness and completeness
  $ faf audit --warn-days 14     # Warn if older than 2 weeks
  $ faf audit --error-days 60    # Error if older than 2 months`)
  .action(auditFafFile);

// 🔧 faf lint - Clean up formatting automatically
program
  .command('lint [file]')
  .description('Fix .faf formatting and style issues')
  .option('-f, --fix', 'Automatically fix formatting issues')
  .option('--schema-version <version>', 'Validate against specific schema version')
  .addHelpText('after', `
Examples:
  $ faf lint                     # Check formatting issues
  $ faf lint --fix               # Fix formatting automatically
  $ faf lint --schema-version 2.4.0  # Use specific schema`)
  .action(lintFafFile);

// Handle unknown commands with helpful suggestions
program
  .command('*', { noHelp: true })
  .action((cmd) => {
    console.log(chalk.red(`❌ Unknown command: ${cmd}`));
    console.log('');
    console.log(chalk.yellow('💡 Did you mean:'));
    console.log('  ' + chalk.cyan('faf init') + '     # Create .faf file');
    console.log('  ' + chalk.cyan('faf score') + '    # Check completeness');
    console.log('  ' + chalk.cyan('faf --help') + '   # See all commands');
    process.exit(1);
  });

// Parse CLI arguments
program.parse(process.argv);

// Enhanced onboarding for first-time users
if (!process.argv.slice(2).length) {
  console.log(chalk.yellow.bold('👋 Welcome to .faf CLI!'));
  console.log('');
  console.log('Generate perfect AI context files in seconds:');
  console.log('');
  console.log('  ' + chalk.cyan('faf init') + '        # Create .faf file for this project');
  console.log('  ' + chalk.cyan('faf score') + '       # See completeness score');
  console.log('  ' + chalk.cyan('faf --help') + '      # See all commands');
  console.log('');
  console.log(chalk.gray('Learn more: Run "faf --help" for examples and workflows'));
}

// Export for programmatic use
export { program };