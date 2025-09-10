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
import { enhanceFafWithAI } from './commands/ai-enhance';
import { analyzeFafWithAI } from './commands/ai-analyze';
import { trustCommand } from './commands/trust';
import { statusCommand } from './commands/status';
import { verifyCommand } from './commands/verify';
import { listStacks, scanCurrentProject, exportForGallery } from './commands/stacks';
import { setColorOptions, type ColorScheme } from './utils/color-utils';

const version = require('../package.json').version;

// CLI Header
console.log(chalk.cyan.bold(`
🚀 .faf CLI v${version}
Universal AI Context Format Tooling - F1-Inspired Software Engineering
`));

program
  .name('faf')
  .description('STOP faffing About! Generate perfect AI context files for any project.')
  .version(version)
  .option('--no-color', 'Disable colored output for accessibility')
  .option('--color-scheme <scheme>', 'Color scheme for colorblind accessibility: normal|deuteranopia|protanopia|tritanopia', 'normal');

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

// 🎯 faf trust - AI Trust Dashboard (The Emotional Core)
program
  .command('trust')
  .description('Show AI Trust Dashboard - "I don\'t worry about AI context anymore"')
  .option('-d, --detailed', 'Show detailed trust metrics')
  .addHelpText('after', `
Examples:
  $ faf trust                        # Show trust dashboard
  $ faf trust --detailed             # Detailed metrics breakdown
  
The Trust Dashboard shows:
  • Overall trust level (0-100%)
  • AI compatibility status (Claude, ChatGPT, Gemini)
  • Context completeness score
  • Freshness indicators
  • Actionable improvement suggestions`)
  .action((options) => trustCommand(options));

// 🚀 faf status - Quick context health check (git status equivalent)
program
  .command('status')
  .description('Show quick .faf context health status (<200ms)')
  .addHelpText('after', `
Examples:
  $ faf status                       # Quick health check
  
Shows:
  • Context health score (0-100%)
  • Files tracked and last sync time
  • AI readiness status
  • Performance metrics
  • Siamese twin (claude.md) status`)
  .action((options) => statusCommand(options));

// 🤖 faf verify - AI Verification System (The Trust Builder)
program
  .command('verify')
  .description('🤖 Test .faf context with Claude, ChatGPT & Gemini - prove AI understanding')
  .option('-d, --detailed', 'Show detailed verification results')
  .option('-m, --models <models>', 'Specify models to test (comma-separated)', 'claude,chatgpt,gemini')
  .option('-t, --timeout <ms>', 'Verification timeout in milliseconds', '30000')
  .addHelpText('after', `
Examples:
  $ faf verify                       # Test with all AI models
  $ faf verify --detailed            # Show detailed results & suggestions
  $ faf verify -m claude,chatgpt     # Test with specific models only
  
AI Verification Tests:
  • Claude: Context understanding & confidence
  • ChatGPT: Project comprehension & clarity  
  • Gemini: Technical stack recognition
  • Trust Score: Updated based on AI feedback
  
Expected Transformation:
  🔴 Needs improvement → ✅ Perfect context`)
  .action((options) => {
    const models = options.models ? options.models.split(',').map((m: string) => m.trim()) : undefined;
    verifyCommand({
      models,
      timeout: parseInt(options.timeout),
      detailed: options.detailed
    });
  });

// 🎯 faf stacks - STACKTISTICS: Stack Discovery & Collection
program
  .command('stacks')
  .description('🎯 Discover and collect technology stack signatures')
  .option('-s, --scan', 'Scan current project for stack signature')
  .option('-e, --export-gallery', 'Export stacks for Gallery-Svelte')
  .addHelpText('after', `
🎯 STACKTISTICS Examples:
  $ faf stacks                       # List your discovered stacks
  $ faf stacks --scan                # Discover current project stack
  $ faf stacks --export-gallery      # Export for Gallery-Svelte

Stack Discovery:
  • Extends fab-formats intelligence - zero performance impact
  • Simple YAML lookup of known stack patterns  
  • Builds collection of your technology experiences`)
  .action(async (options) => {
    if (options.scan) {
      await scanCurrentProject();
    } else if (options['export-gallery']) {
      await exportForGallery();
    } else {
      await listStacks();
    }
  });

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

// 🚀 faf ai-enhance - Claude-First, Big-3 Compatible Enhancement
program
  .command('ai-enhance [file]')
  .description('🚀 Claude-First AI Enhancement - Big-3 Compatible, Bullet-proof Universal')
  .option('-m, --model <model>', 'AI model: claude|chatgpt|gemini|big3|universal', 'claude')
  .option('-f, --focus <area>', 'Focus: human-context|ai-instructions|completeness|claude-exclusive', 'completeness')
  .option('--consensus', 'Build consensus from multiple models')
  .option('--dry-run', 'Show enhancement prompt without executing')
  .addHelpText('after', `
🎯 Claude-First Enhancement:
  $ faf ai-enhance                        # Claude intelligence (default)
  $ faf ai-enhance --model big3           # Big-3 consensus enhancement
  $ faf ai-enhance --focus claude-exclusive  # Claude's F1-inspired specialty
  $ faf ai-enhance --consensus            # Multi-model consensus
  $ faf ai-enhance --dry-run              # Preview enhancement

🚀 NO EXTERNAL DEPENDENCIES - Uses our own Big-3 verification engine!`)
  .action(enhanceFafWithAI);

// 🔍 faf ai-analyze - Claude-First, Big-3 Compatible Analysis
program
  .command('ai-analyze [file]')
  .description('🔍 Claude-First AI Analysis - Big-3 Compatible Intelligence')
  .option('-m, --model <model>', 'AI model: claude|chatgpt|gemini|big3|universal', 'claude')
  .option('-f, --focus <area>', 'Focus: completeness|quality|ai-readiness|human-context|claude-exclusive')
  .option('-v, --verbose', 'Show detailed section breakdown')
  .option('-s, --suggestions', 'Include automated suggestions')
  .option('-c, --comparative', 'Compare perspectives from multiple models')
  .addHelpText('after', `
🎯 Claude-First Analysis:
  $ faf ai-analyze                         # Claude intelligence (default)
  $ faf ai-analyze --model big3            # Big-3 perspective analysis
  $ faf ai-analyze --focus claude-exclusive  # Claude's championship analysis
  $ faf ai-analyze --comparative           # Multi-model comparison
  $ faf ai-analyze --verbose --suggestions # Detailed analysis + tips

🚀 NO EXTERNAL DEPENDENCIES - Uses our own Big-3 verification engine!`)
  .action(analyzeFafWithAI);

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

// Apply color accessibility settings after parsing
const options = program.opts();
if (options.noColor || process.env.NO_COLOR) {
  setColorOptions(false);
} else if (options.colorScheme) {
  const scheme = options.colorScheme as ColorScheme;
  const validSchemes: ColorScheme[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
  if (validSchemes.includes(scheme)) {
    setColorOptions(true, scheme);
  } else {
    console.log(chalk.red(`❌ Invalid color scheme: ${scheme}`));
    console.log(chalk.yellow(`💡 Valid schemes: ${validSchemes.join(', ')}`));
    process.exit(1);
  }
}

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