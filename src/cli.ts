#!/usr/bin/env node

import { Command } from 'commander';
import { scoreCommand } from './commands/score.js';
import { initCommand } from './commands/init.js';
import { autoCommand } from './commands/auto.js';
import { syncCommand } from './commands/sync.js';
import { compileCommand } from './commands/compile.js';
import { decompileCommand } from './commands/decompile.js';
import { checkCommand } from './commands/check.js';
import { exportCommand } from './commands/export.js';
import { gitCommand } from './commands/git.js';
import { infoCommand } from './commands/info.js';
import { formatsCommand } from './commands/formats.js';
import { clearCommand } from './commands/clear.js';
import { convertCommand } from './commands/convert.js';
import { contextCommand } from './commands/context.js';
import { driftCommand } from './commands/drift.js';
import { editCommand } from './commands/edit.js';
import { recoverCommand } from './commands/recover.js';
import { migrateCommand } from './commands/migrate.js';
import { proCommand } from './commands/pro.js';
import { shareCommand } from './commands/share.js';
import { demoCommand } from './commands/demo.js';
import { searchCommand } from './commands/search.js';
import { tafCommand } from './commands/taf.js';
import { goCommand } from './commands/go.js';
import { aiCommand } from './commands/ai.js';
import { conductorCommand } from './commands/conductor.js';

const VERSION = '6.0.5';

const program = new Command();

program
  .name('faf')
  .description('Foundational AI-Context Format — project DNA for any AI')
  .version(VERSION, '-v, --version');

// === Core Commands (Top 6) ===

program
  .command('init')
  .description('Create .faf from your project')
  .option('--yolo', 'Quick init with sensible defaults')
  .option('--quick', 'Alias for --yolo')
  .option('--force', 'Overwrite existing project.faf')
  .option('--output <path>', 'Output path')
  .action((options) => initCommand(options));

program
  .command('auto')
  .description('Zero to 100% in one command')
  .action(() => autoCommand());

program
  .command('go')
  .description('Guided interview to gold code')
  .option('--resume', 'Resume previous session')
  .action((options) => goCommand(options));

program
  .command('score [file]')
  .description('Score a .faf file')
  .option('--verbose', 'Show slot breakdown')
  .option('--status', 'Compact one-liner output')
  .option('--json', 'Output as JSON')
  .action((file, options) => scoreCommand(file, options));

program
  .command('sync')
  .description('.faf ↔ CLAUDE.md (bi-sync, mtime auto-direction)')
  .option('--watch', 'Watch for changes')
  .option('--direction <dir>', 'Force direction: auto|push|pull', 'auto')
  .action((options) => syncCommand(options));

// === Power Commands ===

program
  .command('compile [file]')
  .description('Compile .faf to .fafb binary')
  .option('--output <path>', 'Output path')
  .action((file, options) => compileCommand(file, options));

program
  .command('decompile <file>')
  .description('Decompile .fafb to JSON')
  .option('--output <path>', 'Output path')
  .action((file, options) => decompileCommand(file, options));

program
  .command('git <url>')
  .description('Instant .faf from any GitHub repo')
  .action((url) => gitCommand(url));

program
  .command('export')
  .description('Export context files from .faf')
  .option('--agents', 'Generate AGENTS.md')
  .option('--cursor', 'Generate .cursorrules')
  .option('--gemini', 'Generate GEMINI.md')
  .option('--conductor', 'Generate conductor config')
  .option('--all', 'Generate all formats')
  .action((options) => exportCommand(options));

program
  .command('check [file]')
  .description('Validate .faf file')
  .option('--strict', 'Require 100% score')
  .option('--fix', 'Auto-fix issues')
  .option('--doctor', 'Full diagnostic')
  .option('--trust', 'Verify trust chain')
  .action((file, options) => checkCommand(file, options));

program
  .command('info')
  .description('Show version and system info')
  .option('--version', 'Show version')
  .option('--faq', 'Show FAQ')
  .option('--index', 'Show command index')
  .option('--stacks', 'Show supported stacks')
  .action((options) => infoCommand(options));

// === Phase A Commands ===

program
  .command('formats')
  .description('Show supported formats')
  .action(() => formatsCommand());

program
  .command('clear')
  .description('Clear cached data')
  .action(() => clearCommand());

program
  .command('convert')
  .description('Convert .faf to other formats')
  .option('--json', 'Output as JSON')
  .action((options) => convertCommand(options));

program
  .command('context')
  .description('Generate context output')
  .action(() => contextCommand());

program
  .command('drift')
  .description('Check context drift')
  .action(() => driftCommand());

program
  .command('edit <path> <value>')
  .description('Edit .faf fields')
  .action((path, value) => editCommand(path, value));

// === Phase B Commands ===

program
  .command('recover')
  .description('Recover .faf from context files')
  .action(() => recoverCommand());

program
  .command('migrate')
  .description('Migrate .faf to latest version')
  .option('--dry-run', 'Preview changes without writing')
  .action((options) => migrateCommand(options));

program
  .command('pro [subcommand]')
  .description('Pro features & licensing')
  .action((subcommand) => proCommand(subcommand));

program
  .command('share')
  .description('Share .faf via URL')
  .option('--copy', 'Copy to clipboard')
  .option('--raw', 'Output encoded string only')
  .action((options) => shareCommand(options));

program
  .command('demo')
  .description('Demo walkthrough')
  .action(() => demoCommand());

program
  .command('search <query>')
  .description('Search slots and formats')
  .option('--slots', 'Search slots only')
  .option('--formats', 'Search formats only')
  .action((query, options) => searchCommand(query, options));

program
  .command('taf')
  .description('Test Archive Format receipt')
  .option('--output <path>', 'Write receipt to file')
  .action((options) => tafCommand(options));

// === Phase C Commands ===

program
  .command('ai [subcommand]')
  .description('AI-powered features (enhance|analyze)')
  .action((subcommand) => aiCommand(subcommand));

program
  .command('conductor [subcommand] [path]')
  .description('Conductor integration')
  .action((subcommand, path) => conductorCommand(subcommand, path));

// === Soft Deprecation Aliases (v5.x compat) ===

program.command('bi-sync', { hidden: true }).action(() => syncCommand());
program.command('status', { hidden: true }).action(() => scoreCommand(undefined, { status: true }));
program.command('agents', { hidden: true }).action(() => exportCommand({ agents: true }));
program.command('cursor', { hidden: true }).action(() => exportCommand({ cursor: true }));
program.command('gemini', { hidden: true }).action(() => exportCommand({ gemini: true }));
program.command('validate', { hidden: true }).action((file: string) => checkCommand(file));
program.command('yolo', { hidden: true }).action(() => initCommand({ yolo: true }));

// === Parse and run ===

// No command given → show Nelly header + score + help
if (process.argv.length <= 2) {
  const { bold, dim, fafCyan } = await import('./ui/colors.js');
  const cwd = process.cwd().replace(process.env.HOME ?? '', '~');

  // Nelly — pixel-art elephant (10×6 grid, half-block rendering)
  const G = '\x1b[38;2;150;150;150m';   // gray fg
  const GB = '\x1b[48;2;150;150;150m';  // gray bg
  const DF = '\x1b[38;2;29;29;29m';     // dark fg (▄ trick)
  const DB = '\x1b[48;2;29;29;29m';     // dark bg
  const RS = '\x1b[0m';
  console.log('');
  console.log(`${DB} ${G}▄${GB}███████${DB}${G}▄${RS}`);
  console.log(`${DB} ${GB}${G}█${DB}${G}▀${GB}███████${RS}  ${fafCyan(bold('faf'))} ${dim(`v${VERSION}`)}`);
  const GR = '\x1b[38;2;39;174;96m';    // grass green
  console.log(`${DB}${G}▀${GB}${DF}▄${DB}${GR}░${GB}${G}██${DB}${GR}░░${GB}${G}██${DB}${GR}░${RS}  ${dim('Nelly Never Forgets')}`);
  console.log(`${GR}▔▔▔▔▔▔▔▔▔▔▔▔${RS}`);
  console.log(`${dim('  ' + cwd)}`);
  console.log('');
  try { await scoreCommand(undefined, { status: true }); } catch {}
  console.log('');
  console.log(`  ${dim('Run')} ${fafCyan('faf --help')} ${dim('for commands')}`);
} else {
  program.parse(process.argv);
}
