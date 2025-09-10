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
import { siameseSyncCommand } from './commands/siamese-sync';
import { creditCommand } from './commands/credit';
import { todoCommand } from './commands/todo';
import { checkCommand } from './commands/check';
import { clearCommand } from './commands/clear';
import { editCommand } from './commands/edit';
import { searchCommand } from './commands/search';
import { indexCommand } from './commands/index';
import { shareCommand } from './commands/share';
import { setColorOptions, type ColorScheme } from './utils/color-utils';
import { FAF_HEADER } from './utils/championship-style';

const version = require('../package.json').version;

// Championship Header 🏁
console.log(FAF_HEADER);

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

// 🎯 faf trust - Consolidated Trust Dashboard (The Emotional Core)
program
  .command('trust')
  .description('🎯 Unified trust dashboard - confidence, garage, panic, guarantee modes')
  .option('-d, --detailed', 'Show detailed trust metrics')
  .option('--confidence', 'Show AI confidence analysis')
  .option('--garage', 'Safe experimentation mode with backup')
  .option('--panic', 'Emergency context repair mode')
  .option('--guarantee', 'Quality assurance mode (85%+ threshold)')
  .addHelpText('after', `
Examples:
  $ faf trust                        # Main trust dashboard
  $ faf trust --detailed             # Detailed metrics breakdown
  $ faf trust --confidence           # AI confidence analysis
  $ faf trust --garage               # Safe experiment mode
  $ faf trust --panic                # Emergency repair
  $ faf trust --guarantee            # Quality guarantee check
  
Trust Modes:
  • Confidence: AI confidence levels and boosting tips
  • Garage: Safe experimentation with automatic backup  
  • Panic: Emergency repair and restoration
  • Guarantee: Championship quality assurance (85%+ standard)`)
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
  .action(() => statusCommand());

// 💎 faf credit - Technical Credit Dashboard (Revolutionary Psychology)
program
  .command('credit')
  .description('💎 Technical Credit Dashboard - See your accumulated development credits')
  .option('-d, --detailed', 'Show detailed credit breakdown by category')
  .option('-h, --history', 'Show credit earning history')
  .option('-c, --clear', 'Clear credit history (confirmation required)')
  .addHelpText('after', `
Examples:
  $ faf credit                       # Show credit dashboard
  $ faf credit --detailed            # Detailed breakdown by category
  $ faf credit --history             # See credit earning timeline
  
💎 Technical Credit System:
  • Earn credit for every improvement (vs. technical debt)
  • Transform developer psychology from anxiety to confidence
  • Track AI happiness improvements and context quality
  • Build trust through measurable technical achievements
  • Championship levels: Beginner → Professional → Championship
  
Expected Impact:
  😰 "I hope this works" → 😎 "I trust my context"`)
  .action((options) => creditCommand(options));

// 📝 faf todo - Claude-Inspired Todo System (The Gamifier)
program
  .command('todo')
  .description('📝 Claude-inspired todo system - gamify your context improvements')
  .option('-s, --show', 'Show current todo list')
  .option('-c, --complete <task>', 'Mark task as completed (by number or keyword)')
  .option('-r, --reset', 'Reset current todo list')
  .addHelpText('after', `
Examples:
  $ faf todo                            # Generate new improvement plan
  $ faf todo --show                     # View current todo list
  $ faf todo --complete 1               # Complete task #1
  $ faf todo --complete readme          # Complete README task
  $ faf todo --reset                    # Start fresh
  
Philosophy:
  • Transform low scores into exciting improvement games
  • Claude-inspired task prioritization and celebrations
  • Gamified progress tracking with championship rewards
  • Turn "I need better context" → "I'm completing achievements!"
  
Expected Impact:
  📉 47% score → 📈 85% score through guided achievements`)
  .action((options) => todoCommand(options));

// 📚 faf index - Universal A-Z Reference (The Everything Catalog)
program
  .command('index [term]')
  .description('📚 Universal A-Z reference - commands, concepts, features, everything!')
  .option('--category <category>', 'Filter by category (core, ai, trust, utilities, etc.)')
  .option('--search <query>', 'Search within index entries')
  .option('--examples', 'Show usage examples for commands')
  .addHelpText('after', `
Examples:
  $ faf index                           # Full A-Z catalog
  $ faf index trust                     # Everything about trust
  $ faf index --category ai             # All AI-related entries
  $ faf index --search "context"        # Search for "context" 
  $ faf index --examples                # Show usage examples
  
The Everything Catalog:
  • ⚡️ Commands: All available commands with usage
  • 💡 Concepts: Core FAF concepts (siamese-twins, technical-credit, etc.)
  • 🎯 Features: Specialized features (garage, panic, guarantee modes)
  • 📂 Categories: core, ai, trust, utilities, improvement, psychology
  
Perfect for:
  • New users: "What can FAF do?" → faf index
  • Power users: "What were trust options?" → faf index trust
  • Discovery: "Show me AI features" → faf index --category ai`)
  .action((term, options) => indexCommand(term, options));

// 🚀 faf share - Universal .faf Distribution System  
program
  .command('share [file]')
  .description('🚀 Secure .faf sharing with auto-sanitization')
  .option('-p, --private', 'Keep sensitive info (default: sanitize)')
  .option('-f, --format <format>', 'Output format: yaml|json|url', 'yaml')
  .option('-e, --expires <duration>', 'Expiration: 24h|7d|30d', '7d')
  .option('--password <password>', 'Password protect shared .faf')
  .option('-d, --description <text>', 'Share description')
  .option('-a, --anonymous', 'Remove author information')
  .addHelpText('after', `
Examples:
  $ faf share                        # Share with auto-sanitization
  $ faf share --private              # Share with sensitive info intact
  $ faf share --format json          # Share as JSON format
  $ faf share --expires 24h          # Expire in 24 hours
  $ faf share --anonymous            # Remove author info
  $ faf share --password secret123   # Password protect
  
Security Features:
  • 🔒 Auto-sanitization removes sensitive data by default
  • 🎭 Anonymous sharing option removes author info
  • ⏰ Configurable expiration (24h, 7d, 30d)
  • 🔐 Optional password protection
  • 📝 Multiple formats: YAML, JSON, shareable URLs
  
Perfect for:
  • Team handoffs: Clean context sharing
  • Community help: Sanitized project sharing
  • Documentation: Shareable project examples`)
  .action((file, options) => shareCommand(file, options));

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

// 🔍 faf check - Comprehensive validation & audit (merged validate + audit)
program
  .command('check')
  .description('🔍 Comprehensive .faf validation and freshness check')
  .option('--format', 'Check format/validity only (old validate)')
  .option('--fresh', 'Check freshness/completeness only (old audit)')
  .option('--fix', 'Auto-fix issues where possible')
  .option('-d, --detailed', 'Show detailed check results')
  .addHelpText('after', `
Examples:
  $ faf check                    # Full check (format + freshness)
  $ faf check --format           # Format validation only
  $ faf check --fresh            # Freshness audit only
  $ faf check --fix              # Auto-fix issues
  $ faf check --detailed         # Detailed diagnostics
  
Combines old validate + audit:
  • Format validation (schema, YAML syntax, required fields)
  • Freshness audit (up-to-date, completeness, staleness)
  • Auto-fix capabilities for common issues`)
  .action((options) => checkCommand(options));

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

// 🔄 faf sync - Keep .faf up-to-date automatically + Siamese Twin sync
program
  .command('sync [file]')
  .description('Update .faf when dependencies change OR sync with claude.md (Siamese Twins)')
  .option('-a, --auto', 'Automatically apply detected changes')
  .option('-d, --dry-run', 'Show changes without applying')
  .option('-t, --twins', '🔗 Sync .faf ↔ claude.md (Siamese Twin mode)')
  .option('-w, --watch', 'Start real-time file watching (with --twins)')
  .addHelpText('after', `
Examples:
  $ faf sync                     # Show what needs updating
  $ faf sync --auto              # Update automatically
  $ faf sync --dry-run           # Preview changes only
  
🔗 Siamese Twin Examples:
  $ faf sync --twins             # Create/sync claude.md with .faf
  $ faf sync --twins --watch     # Real-time sync monitoring
  $ faf sync --twins --auto      # Auto-sync without prompts`)
  .action(async (file, options) => {
    if (options.twins) {
      // Siamese Twin sync mode
      await siameseSyncCommand({
        auto: options.auto,
        watch: options.watch,
        force: false
      });
    } else {
      // Original sync functionality
      await syncFafFile(file, options);
    }
  });

// 🧹 faf clear - Reset caches and state (Claude Code consistency)
program
  .command('clear')
  .description('🧹 Clear caches, temporary files, and reset state')
  .option('--cache', 'Clear trust cache only')
  .option('--todos', 'Clear todo lists only')
  .option('--backups', 'Clear backup files only')
  .option('--all', 'Clear everything (default)')
  .addHelpText('after', `
Examples:
  $ faf clear                    # Clear all caches and temp files
  $ faf clear --cache            # Clear trust cache only
  $ faf clear --todos            # Clear todo lists only
  $ faf clear --backups          # Clear backup files only
  
Claude Code Consistency:
  • Similar to /clear command in Claude Code
  • Fresh start for .faf system
  • Removes temporary files and cached data`)
  .action((options) => clearCommand(options));

// ✏️ faf edit - Interactive .faf editor (Claude Code consistency)  
program
  .command('edit')
  .description('✏️ Interactive .faf editor with validation')
  .option('--editor <editor>', 'Specific editor to use (code, vim, nano)')
  .option('--section <section>', 'Edit specific section (project, stack, etc.)')
  .option('--no-validate', 'Skip validation after editing')
  .addHelpText('after', `
Examples:
  $ faf edit                     # Open .faf in default editor
  $ faf edit --editor vim        # Use specific editor
  $ faf edit --section project   # Edit project section only
  $ faf edit --no-validate       # Skip post-edit validation
  
Claude Code Consistency:
  • Similar to /edit command in Claude Code
  • Automatic backup before editing
  • Post-edit validation with restore on errors`)
  .action((options) => editCommand(options));

// 🔍 faf search - Search .faf content (Claude Code consistency)
program
  .command('search <query>')
  .description('🔍 Search within .faf file content with highlighting')
  .option('--section <section>', 'Search in specific section only')
  .option('--case', 'Case sensitive search')
  .option('--keys', 'Search keys only')
  .option('--values', 'Search values only')  
  .option('--count', 'Show match count only')
  .addHelpText('after', `
Examples:
  $ faf search "react"           # Search for "react" anywhere
  $ faf search "api" --section project  # Search in project section only
  $ faf search "test" --keys     # Search in keys only
  $ faf search "node" --case     # Case sensitive search
  $ faf search "component" --count  # Just show match count
  
Claude Code Consistency:
  • Similar to /search command in Claude Code
  • Intelligent highlighting of matches
  • Section-aware searching with path display`)
  .action((query, options) => searchCommand(query, options));

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