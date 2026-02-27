#!/usr/bin/env node
/**
 * 🚀 .faf CLI - Command Line Interface
 * Universal AI Context Format Tooling
 */

import { program } from './fix-once/commander';
import { chalk } from './fix-once/colors';
import inquirer from 'inquirer';
import { validateFafFile } from './commands/validate';
import { initFafFile } from './commands/init';
import { scoreFafFile } from './commands/score';
import { showFafScoreCard } from './commands/show';
import { editFafFile } from './commands/edit-helper';
import { autoCommand } from './commands/auto';
import { goCommand } from './commands/go';
import { yoloCommand } from './commands/yolo';
import { formatsCommand } from './commands/formats';
import { versionCommand } from './commands/version';
import { syncFafFile } from './commands/sync';
import { auditFafFile } from './commands/audit';
import { lintFafFile } from './commands/lint';
import { enhanceFafWithAI } from './commands/ai-enhance';
import { realEnhanceFaf } from './commands/enhance-real';
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
import { famCommand } from './commands/fam';
import { editCommand } from './commands/edit';
import { searchCommand } from './commands/search';
import { indexCommand } from './commands/index';
import { shareCommand } from './commands/share';
import { chatCommand } from './commands/chat';
import { convertCommand, toMarkdown, toText } from './commands/convert';
import { notificationsCommand } from './commands/notifications';
import { skillsCommand } from './commands/skills';
import { demoCommand } from './commands/demo';
import { driftCommand } from './commands/drift';
import { gitCommand } from './commands/git';
import { tafCommand } from './commands/taf';
import { conductorCommand } from './commands/conductor';
import { geminiCommand } from './commands/gemini';
import { antigravityCommand } from './commands/antigravity';
import { agentsCommand } from './commands/agents';
import { cursorCommand } from './commands/cursor';
import { ramCommand } from './commands/ram';
import { migrateCommand } from './commands/migrate';
import { renameCommand } from './commands/rename';
import { readmeCommand } from './commands/readme';
import { humanCommand, humanSetCommand } from './commands/human';
import { sixwsCommand } from './commands/sixws';
import { registerPluginInstallCommand } from './commands/plugin-install';
// FAFb Commands - OFF by default (xAI exclusive)
// import { compileCommand } from './commands/compile';
// import { decompileCommand } from './commands/decompile';
import { setColorOptions, type ColorScheme } from './utils/color-utils';
import { generateFAFHeader, generateHelpHeader, FAF_COLORS } from './utils/championship-style';
import { analytics, trackCommand, trackError, withPerformanceTracking } from './telemetry/analytics';
import { checkForUpdates, forceUpdateCheck } from './utils/update-checker';
import { findFafFile } from './utils/file-utils';
import { getTrustCache } from './utils/trust-cache';
import { parse as parseYAML, stringify as stringifyYAML } from './fix-once/yaml';
import { showV240Announcement } from './utils/announcements';

const version = require('../package.json').version;

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
  // Check for quiet mode
  const opts = program.opts();
  if (opts.quiet) {
    return; // Skip header in quiet mode
  }

  const showHeaderCommands = ['help', 'clear', 'enhance', 'analyze', 'chat', 'formats', 'version'];
  if (!commandName || showHeaderCommands.includes(commandName)) {
    console.log(generateFAFHeader());
  }
}

program
  .name('faf')
  .description('.faf = Project DNA ✨ for ANY AI | Foundational AI-context Format | SPEEDY AI you can TRUST! 🧡⚡️')
  .version(version)
  .option('--no-color', 'Disable colored output for accessibility')
  .option('--color-scheme <scheme>', 'Color scheme for colorblind accessibility: normal|deuteranopia|protanopia|tritanopia', 'normal')
  .option('-q, --quiet', 'Quiet mode - minimal output, no ASCII banners (AI/Codex mode)')
  .option('--auto', 'Auto mode - menu-driven interface for learning and exploration')
  .option('--manual', 'Manual mode - direct command-line interface for power users')
  .addHelpText('after', `
${FAF_COLORS.fafOrange('💡 In Terminal:')} Use ${chalk.cyan('faf')} prefix - like ${chalk.cyan('faf init')}, ${chalk.cyan('faf faq')}

${FAF_COLORS.fafCyan('🚀 Quick Start - Get Perfect AI Context:')}

  ${chalk.green(chalk.bold('FASTEST:'))} ${chalk.cyan('faf auto')}     ${chalk.gray('# ONE COMMAND - Zero to Championship!')}

  ${chalk.gray('Or step by step:')}
  ${FAF_COLORS.fafOrange('1.')} ${chalk.cyan('faf init')}     ${chalk.gray('# Get your .faf file')}
  ${FAF_COLORS.fafOrange('2.')} ${chalk.cyan('faf score')}    ${chalk.gray('# Get a high score (70%+)')}
  ${FAF_COLORS.fafOrange('3.')} ${chalk.cyan('faf trust')}    ${chalk.gray('# Build AI trust & confidence')}
  ${FAF_COLORS.fafOrange('4.')} ${chalk.cyan('faf bi-sync')}  ${chalk.gray('# Set & forget - persistent context-mirroring')}

${FAF_COLORS.fafCyan('🎯 What is .faf?')}
  .faf = Foundational AI-context Format (Project DNA for AI✨)
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

// 🎯 faf go - Guided Path to Gold Code (Claude Code friendly!)
program
  .command('go [directory]')
  .description('🎯 Guided interview to Gold Code - Claude asks questions till you hit 100%!')
  .option('-q, --quiet', 'Minimal output')
  .option('-f, --force', 'Force even if already at 100%')
  .addHelpText('after', `
Examples:
  $ faf go                        # Start guided interview in current directory
  $ faf go ./my-project           # Start interview for specific project

🎯 How FAF GO Works:
  - In Terminal: Interactive prompts (inquirer)
  - In Claude Code: Returns structured questions for AskUserQuestion
  - Prioritizes most impactful questions first
  - Saves answers to .faf automatically
  - Run again to continue where you left off

Just type 'faf go' and answer questions till you're done. 100% target!`)
  .action(withAnalyticsTracking('go', goCommand));

// 🚀 faf yolo - Claude Power User Mode
program
  .command('yolo [directory]')
  .description('🚀 Claude Power User Mode - Maximum extraction, no prompts, speed run!')
  .option('-v, --verbose', 'Show verbose output')
  .addHelpText('after', `
Examples:
  $ faf yolo                      # YOLO the current directory
  $ faf yolo ./my-project         # YOLO a specific project
  $ faf yolo -v                   # Verbose output

🏎️ What FAF YOLO Does:
  - Force creates fresh .faf (no prompts!)
  - TURBO-CAT format discovery
  - Aggressive human context extraction (accepts INFERRED!)
  - Bi-syncs CLAUDE.md
  - Speed optimized output

For Claude power users who know what they want!`)
  .action(withAnalyticsTracking('yolo', yoloCommand));

// Add all the command definitions back
program
  .command('init [directory]')
  .description('Create .faf file from your project (detects React, Python, Node.js, etc.)')
  .option('-f, --force', 'Overwrite existing .faf file')
  .option('-n, --new', 'Create a fresh .faf file (friendlier than --force)')
  .option('-c, --choose', 'Interactive choice when .faf exists')
  .option('-t, --template <type>', 'Use specific template (svelte, react, vue, node)', 'auto')
  .option('-o, --output <file>', 'Output file path')
  .option('--xai', 'Generate xAI/Grok-optimized .faf with voice config')
  .option('--gemini', 'Configure Gemini CLI integration (auto-detects if installed)')
  .option('--taf', 'Create .taf file (Testing Activity Feed) instead of .faf')
  .addHelpText('after', `
Examples:
  $ faf init                     # Detect project type automatically
  $ faf init --new               # Create a fresh .faf file
  $ faf init --xai               # xAI/Grok-optimized with voice config
  $ faf init --gemini            # Gemini CLI native handshake
  $ faf init --taf               # Create .taf (Testing Activity Feed)
  $ faf init --choose            # Interactive choice when .faf exists
  $ faf init my-app              # Create .faf for different directory
  $ faf init -t react            # Force React template`)
  .action(withAnalyticsTracking('init', (directory, options) => initFafFile(directory, options)));

// 🇬🇧 faf innit - British slang fun version of init
program
  .command('innit [directory]')
  .description('🇬🇧 British version of init - same championship, more bruv!')
  .option('-f, --force', 'Overwrite existing .faf file')
  .option('-n, --new', 'Create a fresh .faf file')
  .option('-c, --choose', 'Interactive choice when .faf exists')
  .option('-t, --template <type>', 'Use specific template', 'auto')
  .option('-o, --output <file>', 'Output file path')
  .addHelpText('after', `
Examples:
  $ faf innit                    # Init bruv!
  $ faf innit --new              # Fresh start innit
  $ faf innit my-app             # Create .faf for different directory

🇬🇧 Same as 'faf init', just more British! Proper cheeky!`)
  .action(withAnalyticsTracking('innit', (directory, options) => {
    console.log(FAF_COLORS.fafOrange('🇬🇧 doing it now Bruv'));
    console.log('');
    return initFafFile(directory, options);
  }));

// 📖 faf readme - Extract 6 Ws from README intelligently
program
  .command('readme [directory]')
  .description('📋 6Ws README Builder - Interactive questionnaire with smart defaults')
  .option('-q, --quiet', 'Minimal output')
  .option('-o, --output <file>', 'Output file for README section (default: README-6ws.md)')
  .addHelpText('after', `
Examples:
  $ faf readme                   # Interactive 6Ws (auto-extracts from README)
  $ faf readme ./my-project      # Run in different directory
  $ faf readme --output CONTEXT.md # Save to custom file

📋 What faf readme does (v4.4.0):
  1. Auto-extracts 6 Ws from README.md (if exists)
  2. Interactive questionnaire with smart defaults
  3. Updates project.faf (context_score: 100%)
  4. Generates README section (copy/paste ready)

The 6 Ws (1W-6W notation):
  - 1W (WHO): Who is this for?
  - 2W (WHAT): What does it do?
  - 3W (WHERE): Where does it run?
  - 4W (WHY): Why does it exist?
  - 5W (WHEN): When to use it?
  - 6W (HOW): How to get started?

💡 User-provided answers = 100% context quality!

Replaces: 'faf human' (deprecated)`)
  .action(withAnalyticsTracking('readme', (directory, options) => readmeCommand(directory, options)));

// ✨ faf 6ws - Web-based 6Ws Builder
program
  .command('6ws')
  .description('✨ Open web interface for 6Ws - paste back to CLI')
  .addHelpText('after', `
Examples:
  $ faf 6ws                     # Open browser, paste results back

✨ Interactive paste-back workflow:
  1. Opens faf.one/6ws in your browser
  2. Fill out 6 questions (nice web UI)
  3. Copy the generated human_context YAML
  4. Paste back into CLI
  5. CLI validates and writes to project.faf

💡 Best of both worlds: Web UX + CLI automation!`)
  .action(withAnalyticsTracking('6ws', sixwsCommand));

// 🧡 faf human - Interactive Human Context Collection
program
  .command('human [directory]')
  .description('🧡 Fill human_context interactively - one question at a time')
  .option('-a, --all', 'Ask all questions (even if already filled)')
  .addHelpText('after', `
Examples:
  $ faf human                  # Fill empty human_context fields (interactive)
  $ faf human --all            # Re-answer all 6 Ws (interactive)
  $ faf human set why "Speed"  # Set single field (non-interactive)

🧡 The 6 Ws - Human Context:
  - WHO is this for?
  - WHAT does it do?
  - WHY does it exist?
  - WHERE does it run?
  - WHEN was it made?
  - HOW do you use it?

Interactive mode: Press Enter to skip any question.
Non-interactive: Use 'faf human set <field> "<value>"'`)
  .action(withAnalyticsTracking('human', (directory, options) => humanCommand(directory, options)));

// 🧡 faf human set - Set single human_context field (non-interactive)
program
  .command('human-set <field> <value> [directory]')
  .description('🧡 Set a single human_context field (non-interactive)')
  .addHelpText('after', `
Examples:
  $ faf human-set who "xAI developers"
  $ faf human-set what "6.4KB WASM scorer"
  $ faf human-set why "32x faster than Rust"
  $ faf human-set where "Browser, Edge, WASM"
  $ faf human-set when "Thanksgiving 2025"
  $ faf human-set how "zig build"

Valid fields: who, what, why, where, when, how`)
  .action(withAnalyticsTracking('human-set', (field, value, directory) => humanSetCommand(field, value, directory)));

// 🔄 faf migrate - Migrate .faf to project.faf (v1.2.0)
program
  .command('migrate [directory]')
  .description('Migrate .faf (legacy) to project.faf (v1.2.0 standard)')
  .option('-f, --force', 'Overwrite existing project.faf file')
  .option('--dry-run', 'Preview migration without making changes')
  .addHelpText('after', `
Examples:
  $ faf migrate                  # Migrate .faf to project.faf
  $ faf migrate --dry-run        # Preview migration
  $ faf migrate --force          # Overwrite existing project.faf

v1.2.0: project.faf is the new standard (visible, like package.json)`)
  .action(withAnalyticsTracking('migrate', (directory, options) => migrateCommand(directory, options)));

// 🔄 faf rename - Bulk migration across multiple projects
program
  .command('rename [path]')
  .description('Bulk migrate all .faf files to project.faf recursively')
  .option('-f, --force', 'Overwrite existing project.faf files')
  .option('--dry-run', 'Preview migration without making changes')
  .option('--no-confirm', 'Skip confirmation for large migrations')
  .option('--max-depth <number>', 'Maximum directory depth to search', '10')
  .addHelpText('after', `
Examples:
  $ faf rename ~/Projects          # Migrate all repos in ~/Projects
  $ faf rename . --dry-run         # Preview what would be migrated
  $ faf rename ~/code --force      # Overwrite existing project.faf files
  $ faf rename --no-confirm        # Skip confirmation prompt

Power user tool: Migrate your entire system in one command!
Searches recursively and renames all .faf → project.faf`)
  .action(withAnalyticsTracking('rename', (searchPath, options) => renameCommand(searchPath, options)));

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
  • Enables Context-Mirroring recovery`)
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
    const recoverPath = require('path').join(__dirname, 'commands', 'faf-recover.js');
    const args = [recoverPath];

    if (options.auto) {args.push('--auto');}
    if (options.backup) {args.push('--backup');}
    if (options.check) {args.push('--check');}
    if (options.force) {args.push('--force');}

    const child = spawn('node', args, { stdio: 'inherit' });
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAFb BINARY FORMAT COMMANDS - OFF BY DEFAULT (xAI Exclusive)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// To enable: Uncomment the imports at the top and these command registrations
//
// program
//   .command('compile [input]')
//   .description('🔨 Compile .faf to .fafb binary format (xAI exclusive)')
//   .option('-o, --output <file>', 'Output .fafb file path')
//   .option('-w, --watch', 'Watch and auto-recompile on changes')
//   .option('-b, --benchmark', 'Compare .faf vs .fafb parse speeds')
//   .option('-v, --verbose', 'Verbose output')
//   .action(withAnalyticsTracking('compile', (input, options) => compileCommand(input, options)));
//
// program
//   .command('decompile [input]')
//   .description('🔓 Decompile .fafb binary back to .faf YAML')
//   .option('-o, --output <file>', 'Output .faf file path')
//   .action(withAnalyticsTracking('decompile', (input, options) => decompileCommand(input, options)));
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🏆 faf version - Show version with MK3 status
program
  .command('version')
  .description('🏆 Show FAF version with MK3 Engine and TURBO-CAT status')
  .action(withAnalyticsTracking('version', () => versionCommand()));

// 🧡 faf trust - Consolidated Trust Dashboard (The Emotional Core)
program
  .command('trust')
  .description('🧡 Unified trust dashboard - confidence, garage, panic, quality modes')
  .option('-d, --detailed', 'Show detailed trust metrics')
  .option('--confidence', 'Show AI confidence analysis')
  .option('--garage', 'Safe experimentation mode with backup')
  .option('--panic', 'Emergency context repair mode')
  .option('--quality', 'Quality checks and validation mode')
  .addHelpText('after', `
Examples:
  $ faf trust                        # Main trust dashboard
  $ faf trust --detailed             # Detailed metrics breakdown
  $ faf trust --confidence           # AI confidence analysis
  $ faf trust --garage               # Safe experiment mode
  $ faf trust --panic                # Emergency repair
  $ faf trust --quality              # Quality validation check
  
Trust Modes:
  • Confidence: AI confidence levels and boosting tips
  • Garage: Safe experimentation with automatic backup  
  • Panic: Emergency repair and restoration
  • Quality: Championship quality checks and validation`)
  .action(withAnalyticsTracking('trust', (options) => trustCommand(options)));

// ⚡️ faf vibe - No-Code/Low-Code Builder Edition
program
  .command('vibe')
  .description('⚡️ FAF VIBE - Detect your development platform')
  .option('-p, --preview', 'Preview TURBO-CAT discovery')
  .addHelpText('after', `
Examples:
  $ faf vibe                         # Check platform type
  $ faf vibe --preview               # Include TURBO-CAT preview

⚡️ FAF VIBE Features:
  • Auto-detects no-code platforms (Replit, Lovable, Wix, etc.)
  • FREE CLI tool for all platforms
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
  .option('--oneline', 'Single line output for npm hooks (predev, prebuild)')
  .addHelpText('after', `
Examples:
  $ faf status                       # Quick health check
  $ faf status --oneline             # Single line for hooks

Shows:
  • Context health score (0-100%)
  • Files tracked and last sync time
  • AI readiness status
  • Performance metrics
  • Bi-sync (claude.md) status

Hook usage (package.json):
  "predev": "faf status --oneline"`)
  .action(withAnalyticsTracking('status', (options) => statusCommand(options)));

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

// 🏆 faf fam - FAF Family Integration Marketplace
program
  .command('fam [subcommand] [arg]')
  .description('🏆 FAF Family - Championship integration marketplace')
  .option('-d, --detected', 'Show only detected integrations')
  .option('-a, --available', 'Show only available integrations')
  .addHelpText('after', `
Examples:
  $ faf fam                         # Show all integrations + status
  $ faf fam show react              # Details about React integration
  $ faf fam install n8n             # Install integration (TURBO required)

🏆 FAF Family:
  • Discover 6 championship integrations (React, Next.js, Svelte, TypeScript, Vite, n8n)
  • See what's detected in YOUR project
  • Get MCP server recommendations
  • 74.8M+ developer ecosystem reach

Integrations:
  • Auto-detect modern stacks in your project
  • Smart .faf context generation
  • MCP server recommendations per stack
  • Quality-gated: 85% minimum (Bronze tier)`)
  .action(withAnalyticsTracking('fam', (subcommand, arg, options) => famCommand(subcommand, arg, options)));

// 🚀 faf git - GitHub Repository Context Extractor
program
  .command('git [query]')
  .description('🚀 Generate AI context for ANY GitHub repo without cloning')
  .option('-o, --output <path>', 'Output path for .faf file')
  .option('--list', 'Show popular repositories')
  .option('--category <category>', 'Filter popular repos by category')
  .option('--scan', 'Metadata only (skip file tree)')
  .option('--clone', 'Clone repo after generating .faf')
  .addHelpText('after', `
Examples:
  $ faf git react                     # Shorthand: facebook/react
  $ faf git svelte                    # Auto-resolve: sveltejs/svelte
  $ faf git facebook/react            # owner/repo format
  $ faf git https://github.com/...    # Full URL
  $ faf git --list                    # Show popular repos
  $ faf git --list --category auth    # Show auth libraries

  # Batch processing (comparison mode)
  $ faf git react vue svelte          # Compare multiple repos

🚀 Use Cases:
  • Get AI context for libraries you DON'T own
  • Compare repos before choosing one
  • Understand architecture before cloning
  • Ask AI about ANY repo instantly

Features:
  • ⚡ <200ms extraction (no clone needed)
  • 🔍 Fuzzy matching for typos (svelt → svelte)
  • 📊 Rich metadata (stars, topics, languages)
  • 🏆 Quality scoring (0-100%)
  • 🎯 Smart shorthand (react → facebook/react)`)
  .action(withAnalyticsTracking('git', (query, options) => gitCommand(query, options)));

// 📊 faf taf - Testing Activity Feed
program
  .command('taf')
  .description('📊 Testing Activity Feed - Git-friendly testing timeline')
  .addHelpText('after', `
Subcommands:
  init              Initialize .taf file
  log               Log a test run
  validate          Validate .taf format
  stats             Show test statistics

Examples:
  $ faf taf init                              # Create .taf file
  $ faf taf log --total 173 --passed 173 --failed 0
  $ faf taf validate                          # Check format
  $ faf taf stats                             # View statistics

Features:
  • 📝 Git-friendly YAML format (append-only)
  • 🔗 Native Reference with .faf
  • 🏆 Podium scoring (🏆 🥇 🥈 🥉)
  • 📊 Pass rate tracking and trends
  • ⚡ Lightweight (5-60 lines per run)`)
  .action(withAnalyticsTracking('taf', () => {
    // Get raw arguments after 'taf' command
    const tafIndex = process.argv.indexOf('taf');
    const args = tafIndex >= 0 ? process.argv.slice(tafIndex + 1) : [];
    return tafCommand(args);
  }));

// 🔄 faf conductor - Google Conductor Interop
program
  .command('conductor')
  .description('🔄 Google Conductor interop - Import/export between FAF and Conductor')
  .addHelpText('after', `
Subcommands:
  import            Import conductor/ directory to project.faf
  export            Export project.faf to conductor/ directory
  sync              Bidirectional sync between formats

Examples:
  $ faf conductor import                     # Import ./conductor to project.faf
  $ faf conductor import --merge             # Merge with existing .faf
  $ faf conductor export                     # Export to ./conductor
  $ faf conductor sync                       # Sync (FAF is source of truth)
  $ faf conductor sync --source conductor    # Sync (Conductor is source)

About:
  FAF supports Google Gemini CLI Conductor extension format.
  Position FAF as the universal AI-context interchange format.`)
  .action(withAnalyticsTracking('conductor', () => {
    const conductorIndex = process.argv.indexOf('conductor');
    const args = conductorIndex >= 0 ? process.argv.slice(conductorIndex + 1) : [];
    return conductorCommand(args);
  }));

// 🔷 faf gemini - Gemini CLI / Antigravity Interop
program
  .command('gemini')
  .description('🔷 Gemini CLI / Antigravity interop - Import/export GEMINI.md')
  .addHelpText('after', `
Subcommands:
  import            Import GEMINI.md to project.faf
  export            Export project.faf to GEMINI.md
  sync              Bidirectional sync between formats

Examples:
  $ faf gemini import                     # Import ./GEMINI.md
  $ faf gemini import --global            # Import ~/.gemini/GEMINI.md
  $ faf gemini export                     # Export to ./GEMINI.md
  $ faf gemini export --global            # Export to ~/.gemini/GEMINI.md
  $ faf gemini sync                       # Sync (FAF is source of truth)

About:
  FAF supports Gemini CLI and Google Antigravity GEMINI.md files.
  Position FAF as the universal AI-context interchange format.`)
  .action(withAnalyticsTracking('gemini', () => {
    const geminiIndex = process.argv.indexOf('gemini');
    const args = geminiIndex >= 0 ? process.argv.slice(geminiIndex + 1) : [];
    return geminiCommand(args);
  }));

// 📋 faf agents - AGENTS.md Interop
program
  .command('agents')
  .description('📋 AGENTS.md interop - Import/export AGENTS.md')
  .addHelpText('after', `
Subcommands:
  import            Import AGENTS.md to project.faf
  export            Export project.faf to AGENTS.md
  sync              Bidirectional sync between formats

Examples:
  $ faf agents import                     # Import ./AGENTS.md
  $ faf agents import --global            # Import ~/.codex/AGENTS.md
  $ faf agents export                     # Export to ./AGENTS.md
  $ faf agents export --force             # Overwrite existing
  $ faf agents sync                       # Sync (FAF is source of truth)

About:
  FAF supports AGENTS.md files used by OpenAI Codex, Linux Foundation,
  and 20+ tools. Define once in .faf, generate everywhere.`)
  .action(withAnalyticsTracking('agents', () => {
    const agentsIndex = process.argv.indexOf('agents');
    const args = agentsIndex >= 0 ? process.argv.slice(agentsIndex + 1) : [];
    return agentsCommand(args);
  }));

// 🖱️ faf cursor - Cursor IDE Interop
program
  .command('cursor')
  .description('🖱️ Cursor IDE interop - Import/export .cursorrules')
  .addHelpText('after', `
Subcommands:
  import            Import .cursorrules to project.faf
  export            Export project.faf to .cursorrules
  sync              Bidirectional sync between formats

Examples:
  $ faf cursor import                     # Import ./.cursorrules
  $ faf cursor import --merge             # Merge with existing .faf
  $ faf cursor export                     # Export to ./.cursorrules
  $ faf cursor export --force             # Overwrite existing
  $ faf cursor sync                       # Sync (FAF is source of truth)

About:
  FAF supports Cursor IDE .cursorrules files. Define once in .faf,
  generate .cursorrules, AGENTS.md, CLAUDE.md, GEMINI.md, and more.`)
  .action(withAnalyticsTracking('cursor', () => {
    const cursorIndex = process.argv.indexOf('cursor');
    const args = cursorIndex >= 0 ? process.argv.slice(cursorIndex + 1) : [];
    return cursorCommand(args);
  }));

// 🧠 faf ram - ROM ↔ RAM (tri-sync)
program
  .command('ram')
  .description('🧠 ROM ↔ RAM — tri-sync .faf ↔ Claude Code MEMORY.md')
  .addHelpText('after', `
Subcommands:
  export            ROM → RAM (seed MEMORY.md from .faf)
  import            RAM → ROM (harvest Claude's notes into .faf)
  sync              Bidirectional sync (ROM is source of truth)
  status            Show RAM path, line count, breakdown

Examples:
  $ faf ram export                       # Seed RAM from ROM
  $ faf ram export --force               # Overwrite (don't merge)
  $ faf ram import                       # Harvest Claude's notes into ROM
  $ faf ram status                       # Check RAM path and line count

About:
  .faf is ROM — persistent, structured, portable.
  MEMORY.md is RAM — session-loaded, personal, Claude's workspace.
  tri-sync bridges ROM ↔ RAM.
  RAM lives at ~/.claude/projects/<id>/memory/MEMORY.md
  First 200 lines auto-loaded into every Claude Code session.`)
  .action(withAnalyticsTracking('ram', () => {
    const ramIndex = process.argv.indexOf('ram');
    const args = ramIndex >= 0 ? process.argv.slice(ramIndex + 1) : [];
    return ramCommand(args);
  }));

// 🚀 faf antigravity - Google Antigravity IDE Global Context
program
  .command('antigravity')
  .description('🚀 Antigravity IDE integration - Global AI context for every project')
  .addHelpText('after', `
Subcommands:
  import            Import global ~/.gemini/GEMINI.md to project.faf
  export            Export project.faf to global ~/.gemini/GEMINI.md
  sync              Bidirectional sync with global config
  status            Show current global config status

Examples:
  $ faf antigravity status             # Check global config
  $ faf antigravity export             # Push .faf to global config
  $ faf antigravity import             # Pull global config to .faf
  $ faf antigravity sync               # Sync FAF with global config

About:
  Antigravity is Google's AI-powered IDE built on Gemini.
  Your coding standards defined once, applied everywhere.
  Global config: ~/.gemini/GEMINI.md`)
  .action(withAnalyticsTracking('antigravity', () => {
    const agIndex = process.argv.indexOf('antigravity');
    const agShortIndex = process.argv.indexOf('ag');
    const cmdIndex = agIndex >= 0 ? agIndex : agShortIndex;
    const args = cmdIndex >= 0 ? process.argv.slice(cmdIndex + 1) : [];
    return antigravityCommand(args);
  }));

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
  • 🧡 Features: Specialized features (garage, panic, quality modes)
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

// 👋 faf welcome - First-time user guide
program
  .command('welcome')
  .description('👋 Welcome guide for new users')
  .action(withAnalyticsTracking('welcome', async () => {
    const { welcomeCommand } = await import('./commands/welcome');
    return welcomeCommand();
  }));

// 🏥 faf doctor - Diagnose issues
program
  .command('doctor')
  .description('🏥 Diagnose and fix common FAF issues')
  .addHelpText('after', `
Examples:
  $ faf doctor                       # Run health check

🏥 Health Checks:
  • .faf file validity
  • Score assessment
  • Project detection
  • Configuration status
  • Provides fixes for any issues found`)
  .action(withAnalyticsTracking('doctor', async () => {
    const { doctorCommand } = await import('./commands/doctor');
    return doctorCommand();
  }));

// ⚡ faf quick - Lightning-fast one-liner .faf creation
program
  .command('quick [input]')
  .description('⚡ Quick .faf creation - one-liner format for instant context')
  .option('--force', 'Overwrite existing .faf file')
  .addHelpText('after', `
Examples:
  $ faf quick "my-app, e-commerce platform, typescript, react, vercel"
  $ faf quick "api, REST API for mobile, python, fastapi, aws"
  $ faf quick "cli-tool, dev productivity, go"

⚡ Lightning Format:
  • Comma-separated: name, description, language, framework, hosting
  • Minimum: just name and description
  • Auto-detects the rest from your project
  • 0 to .faf in under 100ms!`)
  .action(withAnalyticsTracking('quick', async (input, options) => {
    const { quickCommand } = await import('./commands/quick');
    return quickCommand(input, options);
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

// 🔍 faf check - Quality inspection & protection system
program
  .command('check')
  .description('🔍 Quality inspection for human_context + field protection')
  .option('--format', 'Check format/validity (old validate)')
  .option('--fresh', 'Check freshness/completeness (old audit)')
  .option('--fix', 'Auto-fix issues where possible')
  .option('-d, --detailed', 'Show detailed check results')
  .option('--protect', 'Auto-protect good/excellent fields from overwrite')
  .option('--unlock', 'Remove all field protections')
  .option('-q, --quiet', 'Minimal output')
  .addHelpText('after', `
Examples:
  $ faf check                    # Quality inspection of human_context
  $ faf check --protect          # Lock good/excellent fields
  $ faf check --unlock           # Remove all protections
  $ faf check --format           # Format validation only
  $ faf check --fresh            # Freshness audit only

Quality Levels:
  ⬜ empty      - Not filled
  🟡 generic    - Placeholder or too short
  🟢 good       - Quality content
  💎 excellent  - High-value content

Protection:
  • Protected fields are skipped by faf readme and faf auto
  • Use --unlock to remove all protections
  • Shows 🔒 next to protected fields`)
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
  .description('Rate your .faf completeness (0-100%). Aim for 🥉85% BRONZE+ for solid AI context you can build on')
  .option('-d, --details', 'Show detailed scoring breakdown')
  .option('-m, --minimum <score>', 'Minimum required score (fails if below)')
  .option('-c, --compiler', 'Use new compiler-based scoring (v3)')
  .option('--trace', 'Show compilation trace (with --compiler)')
  .option('--verify <checksum>', 'Verify checksum (with --compiler)')
  .option('--checksum', 'Show checksum for verification')
  .option('--breakdown', 'Show section breakdown (with --compiler)')
  .addHelpText('after', `
Examples:
  $ faf score                    # Quick score check
  $ faf score --details          # See what's missing for higher score
  $ faf score --minimum 80       # Fail if score below 80%
  $ faf score --compiler         # Use v3 compiler scoring
  $ faf score -c --trace         # Show compilation process
  $ faf score -c --checksum      # Get verification checksum`)
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

// 🏎️  faf show - FAF Stats Display
program
  .command('show [directory]')
  .description('🏎️  Display FAF Stats with clean markdown output')
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

// 🛂 faf tsa - Dependency Inspector (The TSA of Dependencies!)
program
  .command('tsa')
  .description('🛂 Inspect dependencies - The TSA of package.json')
  .option('-d, --detailed', 'Show detailed analysis')
  .action(withAnalyticsTracking('tsa', async (options) => {
    const { tsaCommand } = await import('./commands/tsa');
    await tsaCommand(options);
  }));

// 🔗 faf bi-sync - Standalone bi-directional sync command
program
  .command('bi-sync')
  .description('🔗 Bi-directional sync .faf ↔ claude.md')
  .option('-a, --auto', 'Automatic sync without prompts')
  .option('-w, --watch', 'Start real-time file watching')
  .option('-f, --force', 'Force overwrite conflicts')
  .option('--agents', 'Also sync to AGENTS.md')
  .option('--cursor', 'Also sync to .cursorrules')
  .option('--ram', 'Also sync to MEMORY.md (tri-sync — ROM↔RAM)')
  .option('--all', 'Sync to all targets (CLAUDE.md + AGENTS.md + .cursorrules + GEMINI.md + MEMORY.md)')
  .addHelpText('after', `
Examples:
  $ faf bi-sync                  # Create claude.md and sync
  $ faf bi-sync --auto           # Automatic conflict-free sync
  $ faf bi-sync --watch          # Continuous real-time monitoring
  $ faf bi-sync --agents         # Also generate AGENTS.md
  $ faf bi-sync --cursor         # Also generate .cursorrules
  $ faf bi-sync --ram             # tri-sync: also seed RAM from ROM
  $ faf bi-sync --all            # Sync to ALL targets including RAM

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
      force: options.force || false,
      agents: options.agents,
      cursor: options.cursor,
      ram: options.ram,
      all: options.all,
    });
  });

// 🧠 faf tri-sync - bi-sync + RAM (the third leg)
program
  .command('tri-sync')
  .description('🧠 tri-sync — bi-sync + RAM (.faf ↔ CLAUDE.md ↔ MEMORY.md)')
  .option('-a, --auto', 'Automatic sync without prompts')
  .option('-f, --force', 'Force overwrite conflicts')
  .option('--all', 'Also sync AGENTS.md, .cursorrules, GEMINI.md')
  .addHelpText('after', `
Examples:
  $ faf tri-sync                   # bi-sync + RAM
  $ faf tri-sync --force           # Force overwrite
  $ faf tri-sync --all             # All targets (tip: you don't need --all)

What tri-sync does:
  bi-sync = .faf ↔ CLAUDE.md (the pair)
  tri-sync = bi-sync + RAM (the triangle)

  .faf is ROM. MEMORY.md is RAM. tri-sync is the bus.`)
  .action(async (options) => {
    await biSyncCommand({
      auto: options.auto,
      force: options.force || false,
      ram: true,
      all: options.all || false,
    });
  });

// 📧 faf notifications - Version update notifications
program
  .command('notifications')
  .description('📧 Add your email for new version notifications')
  .option('--email <email>', 'Add email for notifications')
  .option('--status', 'Check notification status')
  .option('--remove', 'Remove email from notifications')
  .option('-q, --quiet', 'Skip interactive prompts')
  .addHelpText('after', `
Examples:
  $ faf notifications            # Interactive email add
  $ faf notifications --email me@example.com  # Direct add
  $ faf notifications --status   # Check if email added
  $ faf notifications --remove   # Remove your email

What you get notified about:
  • New versions with features
  • Breaking changes that affect you
  • Critical security updates
  • Only major releases (not every patch)`)
  .action((options) => notificationsCommand(options));

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

// 🎬 faf demo - Live Demonstrations
program
  .command('demo [subcommand]')
  .description('Live demonstrations of FAF capabilities')
  .option('--speed <speed>', 'Demo pacing: fast, normal, slow (default: normal)')
  .option('--no-cleanup', 'Keep demo changes in files')
  .addHelpText('after', `
Examples:
  $ faf demo              # Show available demos
  $ faf demo sync         # Live bi-sync demonstration
  $ faf demo sync --fast  # Speed up the demo
  $ faf demo sync --slow  # Slow down for presentations

Available demos:
  sync    Live .faf <-> CLAUDE.md synchronization
          Shows real-time bidirectional sync with timestamps`)
  .action(withAnalyticsTracking('demo', (subcommand, options) => demoCommand(subcommand, options)));

// 🍊 faf drift - Context-Drift Analyzer
program
  .command('drift')
  .description('🍊 Analyze git history for context-drift - Context-drift makes you pay')
  .option('--since <period>', 'Analyze drift since period (e.g., "90d", "6m")')
  .option('--detailed', 'Show detailed breakdown of drift events')
  .option('--export <file>', 'Export analysis to JSON file')
  .addHelpText('after', `
Examples:
  $ faf drift                    # Analyze entire git history
  $ faf drift --since 90d        # Last 90 days only
  $ faf drift --detailed         # Full breakdown
  $ faf drift --export drift.json # Save to file

What is Context-Drift?
  • AI makes decisions without project context
  • Each guess creates drift from your true architecture
  • Drift compounds: auth → state → styling → framework
  • Eventually: rewrites, migrations, or project death

What faf drift detects:
  • Auth system changes (JWT → Firebase → Supabase)
  • State management swaps (Redux → Zustand)
  • Styling migrations (CSS → Tailwind)
  • Framework changes (React → Next.js)
  • Database migrations (MongoDB → Postgres)

Shows you:
  • Files rewritten due to drift
  • Weeks lost to cascade fixes
  • Future drift risk level
  • What .faf would have prevented

Context-drift makes you pay.
.faf keeps you drift-free.`)
  .action(withAnalyticsTracking('drift', (options) => driftCommand(options)));

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

// 🎸 faf skills - Claude Code Skills Integration
program
  .command('skills')
  .description('🎸 List Claude Code skills from .faf file')
  .option('-p, --path <path>', 'Path to .faf file or directory')
  .addHelpText('after', `
Examples:
  $ faf skills                   # List skills from .faf
  $ faf skills --path ./project  # Check specific project

Claude Code Skills:
  • Skills are loaded from ~/.claude/skills/
  • Configure in .faf: skills: [faf, wjttc-tester]
  • See: https://github.com/anthropics/skills`)
  .action(withAnalyticsTracking('skills', (options) => skillsCommand(options)));

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
      console.log(chalk.yellow('⚠️  Analytics reset not available'));
      console.log(chalk.gray('   Use: faf analytics --disable to turn off analytics'));
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

// 🚀 faf enhance - REAL Enhancement based on facts
program
  .command('enhance [file]')
  .description('🚀 REAL Enhancement - Analyzes your project for actual improvements')
  .option('-v, --verbose', 'Show detailed changes')
  .option('--dry-run', 'Preview improvements without applying')
  .option('--auto-fill', 'Automatically fill all detectable fields')
  .option('-t, --target-score <score>', 'Target score to achieve (default: 100)', '100')
  .option('-i, --interactive <bool>', 'Ask for missing data (default: true)', 'true')
  .addHelpText('after', `
🚀 REAL Enhancement:
  $ faf enhance              # Apply real improvements from project analysis
  $ faf enhance --dry-run    # Preview what will be improved
  $ faf enhance --verbose    # Show detailed changes
  $ faf enhance -t 90        # RELENTLESSLY enhance until 90% score

✅ No BS, No Placeholders - Only facts from your actual project!
🎯 Relentless mode: Keeps enhancing until target score achieved`)
  .action((file, options) => {
    const enhanceOptions = {
      verbose: options.verbose,
      dryRun: options.dryRun,
      autoFill: options.autoFill,
      targetScore: parseInt(options.targetScore),
      interactive: options.interactive !== 'false'
    };
    return realEnhanceFaf(file, enhanceOptions);
  });

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

// 🔌 faf plugin-install - Workaround for Claude Code SSH bug
registerPluginInstallCommand(program);

// Handle unknown commands with helpful suggestions
program
  .command('*')
  .action((cmd) => {
    console.log(chalk.red(`❌ Unknown command: ${cmd}`));
    console.log('');
    console.log(FAF_COLORS.fafOrange('💡 Did you mean:'));
    console.log(`  ${  chalk.cyan('faf init')  }     # Create .faf file`);
    console.log(`  ${  chalk.cyan('faf score')  }    # Check completeness`);
    console.log(`  ${  chalk.cyan('faf --help')  }   # See all commands`);
    process.exit(1);
  });

/**
 * Interactive welcome screen with persistent bottom command line
 */
async function showInteractiveWelcome() {
  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.log('\n🏎️ FAF Interactive Menu requires an interactive terminal\n');
    console.log('💡 When using AI assistants or CI/CD:\n');
    console.log('   faf init      - Create .faf file');
    console.log('   faf auto      - Automatically enhance context');
    console.log('   faf score     - Check your score');
    console.log('   faf --help    - See all commands\n');
    return;
  }

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
                console.log(`\n${  chalk.dim('🎯 Switching to menu...')}`);
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
  const parsed = program.parse(process.argv);
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

    // Check for updates (non-blocking, respects quiet mode)
    checkForUpdates({ quiet: options.quiet }).catch(() => {
      // Silent fail - update check is not critical
    });

    // Show v2.4.0 announcement to existing users (one time only)
    showV240Announcement();

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

    // Execute the parsed command
    program.execute(parsed).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }
}

// (Removed - handled earlier with minimal welcome screen)

// Export for programmatic use
export { program };