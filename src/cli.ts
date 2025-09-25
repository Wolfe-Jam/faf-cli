#!/usr/bin/env node
/**
 * 🚀 .faf CLI - Command Line Interface
 * Universal AI Context Format Tooling
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { validateFafFile } from './commands/validate';
import { initFafFile } from './commands/init';
import { scoreFafFile } from './commands/score';
import { showFafScoreCard } from './commands/show';
import { editFafFile } from './commands/edit-helper';
import { autoCommand } from './commands/auto';
import { formatsCommand } from './commands/formats';
import { versionCommand } from './commands/version';
import { syncFafFile } from './commands/sync';
import { auditFafFile } from './commands/audit';
import { lintFafFile } from './commands/lint';
import { enhanceFafWithAI } from './commands/ai-enhance';
import { analyzeFafWithAI } from './commands/ai-analyze';
import { trustCommand } from './commands/trust';
import { statusCommand } from './commands/status';
import { verifyCommand } from './commands/verify';
import { listStacks, scanCurrentProject, exportForGallery } from './commands/stacks';
import { biSyncCommand } from './commands/bi-sync';
import { creditCommand } from './commands/credit';
import { todoCommand } from './commands/todo';
import { checkCommand } from './commands/check';
import { clearCommand } from './commands/clear';
import { editCommand } from './commands/edit';
import { searchCommand } from './commands/search';
import { indexCommand } from './commands/index';
import { shareCommand } from './commands/share';
import { chatCommand } from './commands/chat';
import { convertCommand, toMarkdown, toText } from './commands/convert';
import { setColorOptions, type ColorScheme } from './utils/color-utils';
import { generateFAFHeader, generateHelpHeader, FAF_COLORS } from './utils/championship-style';
import { analytics, trackCommand, trackError, withPerformanceTracking } from './telemetry/analytics';
import { findFafFile } from './utils/file-utils';
import { calculateFafScore } from './scoring/score-calculator';
import { getTrustCache } from './utils/trust-cache';
import * as YAML from 'yaml';

const version = require('../package.json').version;


/**
 * Show current score as footer
 */
async function showScoreFooter(context?: string) {
  console.log('');
  // Show context status line
  if (context === 'device') {
    console.log(chalk.dim('Using Device CLI'));
  } else if (context === 'faf') {
    console.log(chalk.dim('Using faf CLI'));
  } else if (context === 'chat') {
    console.log(chalk.dim('Using faf chat'));
  }
  
  try {
    const existingFafPath = await findFafFile();
    if (existingFafPath) {
      const fs = await import('fs').then(m => m.promises);
      const fafContent = await fs.readFile(existingFafPath, 'utf-8');
      const fafData = YAML.parse(fafContent);
      const scoreResult = await calculateFafScore(fafData, existingFafPath);
      const percentage = Math.round(scoreResult.totalScore);
      
      // Get AI readiness from trust cache
      const trustCache = await getTrustCache(existingFafPath);
      const aiReadiness = trustCache?.aiCompatibilityScore || 0;
      
      // Style the scores with championship colors
      const scoreColor = percentage >= 85 ? FAF_COLORS.fafGreen : percentage >= 70 ? FAF_COLORS.fafCyan : FAF_COLORS.fafOrange;
      
      // RULE: Only show AI-Predictive if it's greater than FAF Score
      if (aiReadiness > percentage) {
        console.log(`Current Score: ${scoreColor(percentage + '%')} > AI-Predictive: ${FAF_COLORS.fafCyan(aiReadiness + '%')}`);
      } else {
        console.log(`Current Score: ${scoreColor(percentage + '%')}`);
      }
    } else {
      console.log(`Current Score: 0% > AI-Predictive: ${FAF_COLORS.fafCyan('0%')}`);
    }
  } catch {
    console.log(`Current Score: 0% > AI-Predictive: ${FAF_COLORS.fafCyan('0%')}`);
  }
}

/**
 * Analytics tracking wrapper for commands
 */
function withAnalyticsTracking<T extends (...args: any[]) => Promise<any> | any>(
  commandName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    const commandArgs = process.argv.slice(2);
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      await trackCommand(commandName, commandArgs, duration, true);
      
      // Show score footer after every command
      await showScoreFooter('device');
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await trackCommand(commandName, commandArgs, duration, false);
      await trackError(error as Error, commandName, commandArgs);
      throw error;
    }
  }) as T;
}

function showHeaderIfAppropriate(commandName?: string) {
  const showHeaderCommands = ['help', 'init', 'clear', 'enhance', 'analyze', 'chat', 'formats', 'score', 'version'];
  if (!commandName || showHeaderCommands.includes(commandName)) {
    console.log(generateFAFHeader());
  }
}

program
  .name('faf')
  .description('.faf = THE JPEG for AI | Foundational AI-context Format | SPEEDY AI you can TRUST! 🧡⚡️')
  .version(version)
  .option('--no-color', 'Disable colored output for accessibility')
  .option('--color-scheme <scheme>', 'Color scheme for colorblind accessibility: normal|deuteranopia|protanopia|tritanopia', 'normal')
  .option('--auto', 'Auto mode - menu-driven interface for learning and exploration')
  .option('--manual', 'Manual mode - direct command-line interface for power users')
  .addHelpText('after', `
${FAF_COLORS.fafOrange('💡 In Terminal:')} Use ${chalk.cyan('faf')} prefix - like ${chalk.cyan('faf init')}, ${chalk.cyan('faf faq')}

${FAF_COLORS.fafCyan('🚀 Quick Start - Get Perfect AI Context:')}

  ${chalk.bold.green('FASTEST:')} ${chalk.cyan('faf auto')}     ${chalk.gray('# ONE COMMAND - Zero to Championship!')}

  ${chalk.gray('Or step by step:')}
  ${FAF_COLORS.fafOrange('1.')} ${chalk.cyan('faf init')}     ${chalk.gray('# Get your .faf file')}
  ${FAF_COLORS.fafOrange('2.')} ${chalk.cyan('faf score')}    ${chalk.gray('# Get a high score (70%+)')}
  ${FAF_COLORS.fafOrange('3.')} ${chalk.cyan('faf trust')}    ${chalk.gray('# Build AI trust & confidence')}
  ${FAF_COLORS.fafOrange('4.')} ${chalk.cyan('faf bi-sync')}  ${chalk.gray('# Set & forget - persistent context-mirroring')}

${FAF_COLORS.fafCyan('🎯 What is .faf?')}
  .faf = Foundational AI-context Format (THE JPEG for AI!)
  Just like JPEG makes images universal, .faf makes projects AI-readable.
  bi-sync = persistent context-mirroring through thick and thin
  Get high score, build trust, share freely!
  
${FAF_COLORS.fafOrange('📚 Need more?')} ${chalk.cyan('faf index')} ${chalk.gray('# Complete A-Z reference guide')}
${FAF_COLORS.fafOrange('🎯 VS Coders?')} ${chalk.cyan('faf faq')} ${chalk.gray('# VS Code extension & Command Palette info!')}
`);

// 🏎️ faf auto - The One Command Championship (PRIORITY #1)
program
  .command('auto [directory]')
  .description('🏎️ ONE COMMAND TO RULE THEM ALL - Zero to Championship instantly!')
  .option('-f, --force', 'Force overwrite existing files')
  .option('-a, --ai', 'Include AI enhancement (requires API key)')
  .option('--no-show', 'Skip showing scorecard at end')
  .addHelpText('after', `
Examples:
  $ faf auto                     # Transform current directory to Championship
  $ faf auto ./my-project        # Transform specific project
  $ faf auto --ai                # Include AI enhancements
  $ faf auto --force             # Overwrite everything, fresh start

🏎️ What FAF AUTO Does (in 30 seconds):
  1. Creates perfect .faf file
  2. Syncs all dependencies
  3. Generates CLAUDE.md
  4. Sets up bi-directional sync
  5. Shows your Championship scorecard

From 0% to 99% in one command. No faffing about!`)
  .action(withAnalyticsTracking('auto', autoCommand));

// Add all the command definitions back
program
  .command('init [directory]')
  .description('Create .faf file from your project (detects React, Python, Node.js, etc.)')
  .option('-f, --force', 'Overwrite existing .faf file')
  .option('-n, --new', 'Create a fresh .faf file (friendlier than --force)')
  .option('-c, --choose', 'Interactive choice when .faf exists')
  .option('-t, --template <type>', 'Use specific template (svelte, react, vue, node)', 'auto')
  .option('-o, --output <file>', 'Output file path')
  .addHelpText('after', `
Examples:
  $ faf init                     # Detect project type automatically
  $ faf init --new               # Create a fresh .faf file
  $ faf init --choose            # Interactive choice when .faf exists
  $ faf init my-app              # Create .faf for different directory
  $ faf init -t react            # Force React template`)
  .action(withAnalyticsTracking('init', (directory, options) => initFafFile(directory, options)));

// 🧬 faf dna - Show your journey at a glance
program
  .command('dna')
  .description('🧬 Show your FAF DNA journey (22% → 85% → 99% ← 92%)')
  .addHelpText('after', `
Examples:
  $ faf dna                      # See your journey at a glance

🧬 Shows instantly:
  • Your complete journey line
  • Quick stats and growth
  • Achievements unlocked
  • Links to detailed info`)
  .action(withAnalyticsTracking('dna', () => {
    const dnaCommand = require('./commands/faf-dna');
    return dnaCommand.default?.();
  }));

// 🔐 faf auth - Authenticate your FAF DNA
program
  .command('auth')
  .description('🔐 Authenticate your FAF project with a birth certificate')
  .option('--verify <certificate>', 'Verify an existing certificate')
  .option('--show', 'Show current authentication status')
  .addHelpText('after', `
Examples:
  $ faf auth                     # Authenticate your project
  $ faf auth --show              # Show authentication status
  $ faf auth --verify FAF-2025-PROJECT-XXXX  # Verify certificate

🔐 Birth Certificate:
  • Proves origin of your context
  • Tracks evolution from birth weight
  • Enables Context-Mirroring guarantee`)
  .action(withAnalyticsTracking('auth', () => {
    const authCommand = require('./commands/faf-auth');
    return authCommand.default?.();
  }));

// 📜 faf log - View context evolution history
program
  .command('log')
  .description('📜 View complete evolution history of your FAF context')
  .option('--milestones', 'Show milestones only')
  .option('--analytics', 'Show growth analytics')
  .option('--json', 'Output as JSON')
  .addHelpText('after', `
Examples:
  $ faf log                      # Full evolution history
  $ faf log --milestones         # Key milestones only
  $ faf log --analytics          # Growth analytics
  $ faf log --json               # Export as JSON

📜 Shows Your Journey:
  • Birth weight (from CLAUDE.md)
  • Every version and growth
  • Milestones achieved
  • Current position vs peak`)
  .action(withAnalyticsTracking('log', () => {
    const logCommand = require('./commands/faf-log');
    return logCommand.default?.();
  }));

// 💾 faf update - Save your current version
program
  .command('update')
  .description('💾 Save your current FAF version (checkpoint your progress)')
  .addHelpText('after', `
Examples:
  $ faf update                   # Save current version

💾 Simple checkpoint:
  • Marks current state as good
  • Creates reference point
  • Track future changes from here`)
  .action(withAnalyticsTracking('update', () => {
    const updateCommand = require('./commands/faf-update');
    return updateCommand.default?.();
  }));

// 🚨 faf recover - Disaster Recovery
program
  .command('recover')
  .description('🚨 Disaster recovery for corrupted or missing FAF files')
  .option('--auto', 'Attempt automatic recovery')
  .option('--backup', 'List available backups')
  .option('--check', 'Check health without recovery')
  .option('--force', 'Force recovery even if risky')
  .addHelpText('after', `
Examples:
  $ faf recover                  # Interactive recovery
  $ faf recover --auto           # Try automatic fix
  $ faf recover --backup         # List backups
  $ faf recover --check          # Health check only

🚨 Emergency Commands:
  • faf recover --auto: Try automatic recovery
  • git checkout HEAD -- .faf: Restore from git
  • faf init --force: Start fresh (loses history)`)
  .action(withAnalyticsTracking('recover', (options) => {
    const { spawn } = require('child_process');
    const recoverPath = require('path').join(__dirname, 'commands', 'faf-recover.ts');
    const args = ['ts-node', recoverPath];

    if (options.auto) args.push('--auto');
    if (options.backup) args.push('--backup');
    if (options.check) args.push('--check');
    if (options.force) args.push('--force');

    const child = spawn('npx', args, { stdio: 'inherit' });
    child.on('exit', (code: number | null) => {
      process.exit(code || 0);
    });
  }));

// 😽 faf formats - TURBO-CAT Format Discovery
program
  .command('formats [directory]')
  .description('😽 TURBO-CAT™ discovers all formats in your project (154 validated types!)')
  .option('-e, --export', 'Export as JSON')
  .option('-c, --category', 'Show by category')
  .addHelpText('after', `
Examples:
  $ faf formats                  # List all discovered formats
  $ faf formats --category       # Show by category
  $ faf formats --export         # Export as JSON`)
  .action(withAnalyticsTracking('formats', (directory, options) => formatsCommand(directory, options)));

// 🏆 faf version - Show version with MK2 status
program
  .command('version')
  .description('🏆 Show FAF version with MK2 Engine and TURBO-CAT status')
  .action(withAnalyticsTracking('version', () => versionCommand()));

// 🧡 faf trust - Consolidated Trust Dashboard (The Emotional Core)
program
  .command('trust')
  .description('🧡 Unified trust dashboard - confidence, garage, panic, guarantee modes')
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
  .action(withAnalyticsTracking('trust', (options) => trustCommand(options)));

// ⚡️ faf vibe - No-Code/Low-Code Builder Edition
program
  .command('vibe')
  .description('⚡️ FAF VIBE - Check $9 tier eligibility for no-code builders')
  .option('-p, --preview', 'Preview TURBO-CAT discovery')
  .addHelpText('after', `
Examples:
  $ faf vibe                         # Check platform & pricing
  $ faf vibe --preview               # Include TURBO-CAT preview

⚡️ FAF VIBE Features:
  • Auto-detects no-code platforms (Replit, Lovable, Wix, etc.)
  • $9/month FOREVER (limited time offer)
  • Same features as $100 Pro Plan
  • TURBO-CAT format discovery
  • Lightning not rainbows!`)
  .action(withAnalyticsTracking('vibe', (options) => {
    const { vibeCommand } = require('./commands/vibe');
    return vibeCommand(options);
  }));

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
  • Bi-sync (claude.md) status`)
  .action(withAnalyticsTracking('status', () => statusCommand()));

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
  • 💡 Concepts: Core FAF concepts (bi-sync, technical-credit, etc.)
  • 🧡 Features: Specialized features (garage, panic, guarantee modes)
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

// 🏆 GOLDEN RULE: faf convert - YAML to MD/TXT
program
  .command('convert [file]')
  .alias('to-md')
  .description('🔄 Convert .faf YAML to Markdown or Text (Golden Rule: We SPEAK YAML)')
  .option('-f, --format <type>', 'Output format (md|txt)', 'md')
  .option('-o, --output <file>', 'Output file path')
  .option('-s, --save', 'Save to file (.faf.md or .faf.txt)')
  .addHelpText('after', `
Examples:
  $ faf convert              # Convert .faf to Markdown (console output)
  $ faf convert --save       # Save as .faf.md
  $ faf to-md                # Quick alias for Markdown
  $ faf convert -f txt       # Convert to plain text
  $ faf convert -f txt -s    # Save as .faf.txt

🏆 GOLDEN RULE: .faf = YAML ONLY
  • One source of truth: Pure YAML
  • Convert when needed: MD for docs, TXT for sharing
  • No parse errors ever again!`)
  .action(withAnalyticsTracking('convert', async (file, options) => {
    await convertCommand(file, options);
  }));

program
  .command('to-txt [file]')
  .description('📝 Quick convert .faf YAML to plain text')
  .action(withAnalyticsTracking('to-txt', async (file) => {
    await toText(file);
  }));

// 🗣️ faf chat - Natural Language .faf Generation
program
  .command('chat')
  .description('🗣️ Natural language .faf generation - conversation-driven context building')
  .addHelpText('after', `
Examples:
  $ faf chat                         # Start conversational .faf creation
  
🗣️ Simple Natural Language Interface:
  • Answer simple questions about your project
  • Choose from numbered options (KISS method)
  • Get perfect .faf file without technical flags
  • Same championship output, accessible input
  
Perfect for:
  • Non-technical team members
  • Quick project setup
  • Learning FAF concepts through conversation`)
  .action(withAnalyticsTracking('chat', () => chatCommand()));

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
  🔴 Needs improvement → ☑️ Perfect context`)
  .action((options) => {
    const models = options.models ? options.models.split(',').map((m: string) => m.trim()) : undefined;
    verifyCommand({
      models,
      timeout: parseInt(options.timeout),
      detailed: options.detailed
    });
  });

// 📊 faf stacks - STACKTISTICS: Stack Discovery & Collection
program
  .command('stacks')
  .description('📊 Discover and collect technology stack signatures')
  .option('-s, --scan', 'Scan current project for stack signature')
  .option('-e, --export-gallery', 'Export stacks for Gallery-Svelte')
  .addHelpText('after', `
📊 STACKTISTICS Examples:
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

// ✅ faf validate - Check if .faf file is valid
program
  .command('validate [file]')
  .description('Validate .faf file structure and content')
  .option('-v, --verbose', 'Show detailed validation output')
  .option('-s, --schema <path>', 'Custom schema file to validate against')
  .addHelpText('after', `
Examples:
  $ faf validate                 # Validate current .faf file
  $ faf validate --verbose       # Show detailed validation report`)
  .action(withAnalyticsTracking('validate', validateFafFile));

// 🔍 faf audit - Check freshness and quality
program
  .command('audit [file]')
  .description('Check .faf file freshness and identify improvement areas')
  .option('-w, --warn-days <days>', 'Days before warning about staleness', '7')
  .option('-e, --error-days <days>', 'Days before marking as stale', '30')
  .addHelpText('after', `
Examples:
  $ faf audit                    # Check freshness and quality
  $ faf audit --warn-days 3      # Warn if older than 3 days`)
  .action(withAnalyticsTracking('audit', auditFafFile));

// 📈 faf score - See how complete your context is
program
  .command('score [file]')
  .description('Rate your .faf completeness (0-100%). Aim for 70%+ for good AI context.')
  .option('-d, --details', 'Show detailed scoring breakdown')
  .option('-m, --minimum <score>', 'Minimum required score (fails if below)')
  .addHelpText('after', `
Examples:
  $ faf score                    # Quick score check
  $ faf score --details          # See what's missing for higher score
  $ faf score --minimum 80       # Fail if score below 80%`)
  .action(withAnalyticsTracking('score', scoreFafFile));

// 📝 faf edit - Edit helper
program
  .command('edit [file]')
  .description('Get guidance on editing your .faf file to improve score')
  .option('-o, --open', 'Open in default editor')
  .addHelpText('after', `
Examples:
  $ faf edit                     # Show what to edit
  $ faf edit --open              # Open in $EDITOR

Helps you understand which fields to fill for a higher score.`)
  .action(withAnalyticsTracking('edit', editFafFile));

// 🏎️ faf show - Championship Score Card Display
program
  .command('show [directory]')
  .description('🏎️ Display FAF Championship Score Card with clean markdown output')
  .option('-r, --raw', 'Output raw markdown (for piping)')
  .addHelpText('after', `
Examples:
  $ faf show                     # Show score card for current directory
  $ faf show ./my-project        # Show score card for specific directory
  $ faf show --raw               # Output raw markdown for piping
  $ faf show --raw | pbcopy      # Copy score card to clipboard

🍫🍊 CHOCOLATE ORANGE - NO WRAPPERS!
Clean markdown output that displays naturally.`)
  .action(withAnalyticsTracking('show', showFafScoreCard));

// 🔄 faf sync - Keep .faf up-to-date automatically + Bi-directional sync
program
  .command('sync [file]')
  .description('Update .faf when dependencies change OR sync with claude.md (bi-directional sync)')
  .option('-a, --auto', 'Automatically apply detected changes')
  .option('-d, --dry-run', 'Show changes without applying')
  .option('-b, --bi-sync', '🔗 Bi-directional sync .faf ↔ claude.md')
  .option('-w, --watch', 'Start real-time file watching (with --bi-sync)')
  .addHelpText('after', `
Examples:
  $ faf sync                     # Show what needs updating
  $ faf sync --auto              # Update automatically
  $ faf sync --dry-run           # Preview changes only
  
🔗 Bi-Sync Examples:
  $ faf sync --bi-sync           # Real-time .faf ↔ claude.md sync
  $ faf sync --bi-sync --watch   # Continuous real-time monitoring
  $ faf sync --bi-sync --auto    # Automatic conflict-free sync

Championship Bi-Sync Features:
  • ⚡ Sub-40ms sync time (faster than most file operations)
  • 🧠 Smart merge algorithms prevent conflicts and data corruption
  • 🔄 Self-healing: Auto-recovers from file locks/system issues
  • 💎 Credit propagation: Technical credit updates both files
  • 🧡 Trust synchronization: AI compatibility scores stay aligned
  • 🛡️ Conflict prevention: Detects simultaneous edits safely`)
  .action(async (file, options) => {
    if (options.biSync) {
      // Bi-directional sync mode
      await biSyncCommand({
        auto: options.auto,
        watch: options.watch,
        force: false
      });
    } else {
      // Original sync functionality
      await syncFafFile(file, options);
    }
  });

// 🔗 faf bi-sync - Standalone bi-directional sync command
program
  .command('bi-sync')
  .description('🔗 Bi-directional sync .faf ↔ claude.md')
  .option('-a, --auto', 'Automatic sync without prompts')
  .option('-w, --watch', 'Start real-time file watching')
  .option('-f, --force', 'Force overwrite conflicts')
  .addHelpText('after', `
Examples:
  $ faf bi-sync                  # Create claude.md and sync
  $ faf bi-sync --auto           # Automatic conflict-free sync
  $ faf bi-sync --watch          # Continuous real-time monitoring
  
Championship Bi-Sync Features:
  • ⚡ Sub-40ms sync time (faster than most file operations)
  • 🧠 Smart merge algorithms prevent conflicts and data corruption
  • 🔄 Self-healing: Auto-recovers from file locks/system issues
  • 💎 Credit propagation: Technical credit updates both files
  • 🧡 Trust synchronization: AI compatibility scores stay aligned
  • 🛡️ Conflict prevention: Detects simultaneous edits safely`)
  .action(async (options) => {
    await biSyncCommand({
      auto: options.auto,
      watch: options.watch,
      force: options.force || false
    });
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
  .action(withAnalyticsTracking('search', (query, options) => searchCommand(query, options)));

// 📊 faf analytics - Analytics & Telemetry Management
program
  .command('analytics')
  .description('📊 View usage analytics and manage telemetry settings')
  .option('-s, --summary', 'Show analytics summary')
  .option('-d, --disable', 'Disable telemetry collection')
  .option('-e, --enable', 'Enable telemetry collection')
  .option('--reset', 'Reset all analytics data')
  .addHelpText('after', `
Examples:
  $ faf analytics --summary          # View usage statistics
  $ faf analytics --disable          # Turn off telemetry
  $ faf analytics --enable           # Turn on telemetry
  $ faf analytics --reset            # Clear analytics data
  
Championship Analytics:
  • 📊 Performance metrics (F1-inspired speed tracking)
  • 📊 Command usage patterns and favorites
  • 📈 Trust score improvements over time
  • 🔒 Privacy-first: All data anonymized and local
  • 🚀 Help make FAF better for everyone!
  
Privacy Controls:
  • Telemetry can be disabled anytime
  • No sensitive data collected (keys, tokens filtered)
  • All metrics stored locally first
  • Opt-in for improvement insights`)
  .action(withAnalyticsTracking('analytics', async (options) => {
    if (options.summary) {
      await analytics.showAnalyticsSummary();
    } else if (options.disable) {
      await analytics.disableTelemetry();
    } else if (options.enable) {
      await analytics.enableTelemetry();
    } else if (options.reset) {
      // Reset analytics would be implemented
      console.log('🔄 Analytics reset functionality coming soon!');
    } else {
      // Default: show summary
      await analytics.showAnalyticsSummary();
    }
  }));

// 🩵 faf faq - Show FAQ
program
  .command('faq')
  .description('🩵 Frequently Asked Questions - Get help with common issues')
  .option('-s, --search <term>', 'Search FAQ for specific topic')
  .addHelpText('after', `
Examples:
  $ faf faq                      # Show full FAQ
  $ faf faq --search spacebar    # Search for spacebar info
  $ faf faq --search commands    # Search for command info`)
  .action(withAnalyticsTracking('faq', async (options) => {
    const faqCommand = await import('./commands/faq');
    await faqCommand.faqCommand(options);
  }));

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

// 🚀 faf enhance - Claude-First, Big-3 Compatible Enhancement
program
  .command('enhance [file]')
  .description('🚀 Claude-First AI Enhancement - Big-3 Compatible, Bullet-proof Universal')
  .option('-m, --model <model>', 'AI model: claude|chatgpt|gemini|big3|universal', 'claude')
  .option('-f, --focus <area>', 'Focus: human-context|ai-instructions|completeness|claude-exclusive', 'completeness')
  .option('--consensus', 'Build consensus from multiple models')
  .option('--dry-run', 'Show enhancement prompt without executing')
  .addHelpText('after', `
🤖 Claude-First Enhancement:
  $ faf enhance                           # Claude intelligence (default)
  $ faf enhance --model big3              # Big-3 consensus enhancement
  $ faf enhance --focus claude-exclusive  # Claude's F1-inspired specialty
  $ faf enhance --consensus               # Multi-model consensus
  $ faf enhance --dry-run                 # Preview enhancement

🚀 NO EXTERNAL DEPENDENCIES - Uses our own Big-3 verification engine!`)
  .action(enhanceFafWithAI);

// 🔍 faf analyze - Claude-First, Big-3 Compatible Analysis
program
  .command('analyze [file]')
  .description('🔍 Claude-First AI Analysis - Big-3 Compatible Intelligence')
  .option('-m, --model <model>', 'AI model: claude|chatgpt|gemini|big3|universal', 'claude')
  .option('-f, --focus <area>', 'Focus: completeness|quality|ai-readiness|human-context|claude-exclusive')
  .option('-v, --verbose', 'Show detailed section breakdown')
  .option('-s, --suggestions', 'Include automated suggestions')
  .option('-c, --comparative', 'Compare perspectives from multiple models')
  .addHelpText('after', `
🤖 Claude-First Analysis:
  $ faf analyze                            # Claude intelligence (default)
  $ faf analyze --model big3               # Big-3 perspective analysis
  $ faf analyze --focus claude-exclusive   # Claude's championship analysis
  $ faf analyze --comparative              # Multi-model comparison
  $ faf analyze --verbose --suggestions    # Detailed analysis + tips

🚀 NO EXTERNAL DEPENDENCIES - Uses our own Big-3 verification engine!`)
  .action(analyzeFafWithAI);

// Handle unknown commands with helpful suggestions
program
  .command('*', { noHelp: true })
  .action((cmd) => {
    console.log(chalk.red(`❌ Unknown command: ${cmd}`));
    console.log('');
    console.log(FAF_COLORS.fafOrange('💡 Did you mean:'));
    console.log('  ' + chalk.cyan('faf init') + '     # Create .faf file');
    console.log('  ' + chalk.cyan('faf score') + '    # Check completeness');
    console.log('  ' + chalk.cyan('faf --help') + '   # See all commands');
    process.exit(1);
  });

/**
 * Interactive welcome screen with persistent bottom command line
 */
async function showInteractiveWelcome() {
  // Clear screen and set up persistent layout
  console.clear();
  
  // ASCII Header
  console.log(generateFAFHeader());
  console.log('');
  console.log(chalk.dim('Using faf menu'));
  console.log('');
  
  // Hello User  
  const username = require('os').userInfo().username;
  console.log(chalk.cyan.bold(`  👋 Hello ${username}!`));
  console.log('');
  
  // Ready message
  console.log(chalk.white('  Ready to make your AI happy again?'));
  console.log('');
  
  // Footer - show BEFORE menu
  await showScoreFooter();
  console.log('');
  
  try {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select an option',
        choices: [
          { name: '1. Create your first .faf file', value: 'init' },
          { name: '2. Interactive context builder', value: 'chat' },
          { name: '3. See all commands', value: 'help' },
          { name: '4. FAQ - Get help & answers', value: 'faq' },
          { name: '5. Browse everything A-Z', value: 'index' },
          { name: '6. Switch to command line', value: 'commandline' },
          new inquirer.Separator('')
        ]
      }
    ]);
    
    
    // If user selected command line mode, switch to persistent typing
    if (answer.action === 'commandline') {
      console.clear();
      console.log(generateFAFHeader());
      console.log('');
      console.log(chalk.dim('Using faf CLI'));
      console.log('');
      console.log(chalk.cyan.bold('⌨️  Command Line Mode'));
      console.log(chalk.gray('Type commands, "menu" for menu, or "index" for the .faf A-Z'));
      console.log('');
      
      // Persistent command line loop with spacebar detection
      let inCommandMode = true;
      while (inCommandMode) {
        const cmdAnswer = await new Promise<{command: string}>((resolve) => {
          let inputBuffer = '';
          
          // Show prompt
          process.stdout.write('> ');
          
          // Set up raw keyboard input for spacebar detection
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            
            const keyHandler = (key: string) => {
              // Spacebar pressed - toggle to menu
              if (key === ' ' && inputBuffer === '') {
                process.stdin.setRawMode(false);
                process.stdin.removeListener('data', keyHandler);
                console.log('\n' + chalk.dim('🎯 Switching to menu...'));
                resolve({ command: 'menu' });
                return;
              }
              
              // Escape pressed - exit
              if (key === '\u001b') {
                process.stdin.setRawMode(false);
                process.stdin.removeListener('data', keyHandler);
                console.log('\n👋 Goodbye!');
                process.exit(0);
              }
              
              // Enter pressed - execute command
              if (key === '\r' || key === '\n') {
                process.stdin.setRawMode(false);
                process.stdin.removeListener('data', keyHandler);
                console.log('');
                resolve({ command: inputBuffer });
                return;
              }
              
              // Backspace
              if (key === '\u007f') {
                if (inputBuffer.length > 0) {
                  inputBuffer = inputBuffer.slice(0, -1);
                  process.stdout.write('\b \b');
                }
                return;
              }
              
              // Regular character
              if (key >= ' ' && key <= '~') {
                inputBuffer += key;
                process.stdout.write(key);
              }
            };
            
            process.stdin.on('data', keyHandler);
          } else {
            // Fallback for non-TTY - use regular inquirer
            inquirer.prompt([{
              type: 'input',
              name: 'command',
              message: '>'
            }]).then(resolve);
          }
        });
        
        const command = cmdAnswer.command.trim().toLowerCase();
        
        // Handle mode switching commands
        if (command === 'exit' || command === 'quit') {
          console.log('👋 Goodbye!');
          process.exit(0);
        }
        
        if (command === 'menu') {
          inCommandMode = false;
          console.log(chalk.dim('↩️  Returning to menu...'));
          console.log('');
          // Recursively call showInteractiveWelcome to return to menu
          await showInteractiveWelcome();
          return;
        }
        
        // Execute typed command
        switch (command) {
          case 'init':
            await initFafFile();
            break;
          case 'chat':
            await chatCommand();
            break;
          case 'help':
            program.help();
            break;
          case 'index':
            await indexCommand();
            break;
          case 'status':
            await statusCommand();
            break;
          case 'faq':
            const faqCommand = await import('./commands/faq');
            await faqCommand.faqCommand();
            break;
          case '':
            // Empty command, just continue
            break;
          default:
            // Check if user tried a slash command
            if (command.startsWith('/')) {
              const commandWithoutSlash = command.slice(1);
              console.log(chalk.red(`❌ Unknown command: ${command}`));
              console.log(FAF_COLORS.fafCyan('🎉 Good news! You don\'t need a slash in FAF CLI mode'));
              console.log(FAF_COLORS.fafOrange(`💡 Try: ${commandWithoutSlash} (without the /)`));
            } else {
              console.log(chalk.red(`❌ Unknown command: ${command}`));
              console.log(FAF_COLORS.fafOrange('💡 Try: init, chat, help, index, status, score, exit'));
            }
            break;
        }
        
        // Show footer after each command (unless it was help which shows its own footer)
        if (command !== 'help' && command !== '') {
          await showScoreFooter('faf');
        }
        console.log('');
      }
    } else {
      // Execute selected menu item
      const action = answer.action;
      switch (action) {
        case 'init':
          await initFafFile();
          break;
        case 'chat':
          await chatCommand();
          break;
        case 'help':
          program.help();
          break;
        case 'faq':
          const faqMenuCommand = await import('./commands/faq');
          await faqMenuCommand.faqCommand();
          break;
        case 'index':
          await indexCommand();
          break;
      }
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log(`\n${chalk.cyan('👋 See you later!')}\n`);
    } else {
      console.error(`\n${chalk.red('❌ Error:')} ${error}\n`);
    }
  }
}

// Show header based on command used BEFORE parsing
const commandUsed = process.argv[2];

// Special case: No arguments at all - use smart FAF logic
if (!commandUsed) {
  import('./smart-faf').then(module => {
    const SmartFaf = module.default;
    const smartFaf = new SmartFaf();
    return smartFaf.execute();
  }).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Parse CLI arguments to check for gearbox flags
  program.parse(process.argv);
  const options = program.opts();

  // Gearbox system: Auto/Manual mode detection
  const isAutoMode = options.auto;
  const isManualMode = options.manual;

  // Auto mode - show interactive welcome
  if (isAutoMode) {
    showInteractiveWelcome().then(() => process.exit(0)).catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    const isHelp = commandUsed === '--help' || commandUsed === '-h' || commandUsed === 'help';
    showHeaderIfAppropriate(isHelp ? 'help' : commandUsed);

    // Apply color accessibility settings after parsing
    if (options.noColor || process.env.NO_COLOR) {
      setColorOptions(false);
    } else if (options.colorScheme) {
      const scheme = options.colorScheme as ColorScheme;
      const validSchemes: ColorScheme[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
      if (validSchemes.includes(scheme)) {
        setColorOptions(true, scheme);
      } else {
        console.log(chalk.red(`❌ Invalid color scheme: ${scheme}`));
        console.log(FAF_COLORS.fafOrange(`💡 Valid schemes: ${validSchemes.join(', ')}`));
        process.exit(1);
      }
    }
  }
}

// (Removed - handled earlier with minimal welcome screen)

// Export for programmatic use
export { program };