/**
 * faf ram — Claude Code RAM Interop (tri-sync)
 *
 * Bidirectional interoperability between FAF (ROM) and Claude Code's
 * auto-memory MEMORY.md (RAM).
 *
 * .faf = ROM (persistent, structured, portable)
 * MEMORY.md = RAM (session-loaded, personal, Claude's workspace)
 *
 * Commands:
 * - faf ram export    ROM → RAM (.faf → MEMORY.md)
 * - faf ram import    RAM → ROM (MEMORY.md → harvest into .faf)
 * - faf ram sync      Bidirectional sync (ROM is source of truth)
 * - faf ram status    Show RAM path, line count, breakdown
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  memoryExport,
  memoryImport,
  getMemoryStatus,
  resolveMemoryPath,
  getGitRoot,
  detectMemoryMd,
} from '../utils/memory-parser';

// ============================================================================
// Main Command Router
// ============================================================================

export async function ramCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'export':
      await runRamExport(subcommandArgs);
      break;

    case 'import':
      await runRamImport(subcommandArgs);
      break;

    case 'sync':
      await runRamSync(subcommandArgs);
      break;

    case 'status':
      await runRamStatus(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showRamHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown ram command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showRamHelp();
      process.exit(1);
  }
}

// ============================================================================
// Options Parsing
// ============================================================================

interface RamOptions {
  path?: string;
  force?: boolean;
  projectPath?: string;
}

function parseRamArgs(args: string[]): RamOptions {
  const options: RamOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--project-path' && args[i + 1]) {
      options.projectPath = args[++i];
    }
  }

  return options;
}

/**
 * Resolve the project root — git root or cwd.
 */
function resolveProjectRoot(override?: string): string {
  if (override) return path.resolve(override);
  return getGitRoot() || process.cwd();
}

// ============================================================================
// Export Command: ROM → RAM (.faf → MEMORY.md)
// ============================================================================

async function runRamExport(args: string[]): Promise<void> {
  const options = parseRamArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Exporting ROM → RAM (tri-sync)...`));
  console.log();

  // Find FAF file (ROM)
  const fafPath = await findFafFile(process.cwd());
  if (!fafPath) {
    console.log(chalk.red(`❌ No .faf file found in current directory`));
    console.log(chalk.gray('   Run "faf init" first to create one.'));
    console.log();
    return;
  }

  // Resolve project root and RAM path
  const projectRoot = resolveProjectRoot(options.projectPath);
  const outputPath = options.path || resolveMemoryPath(projectRoot);

  console.log(chalk.gray(`   ROM:  ${fafPath}`));
  console.log(chalk.gray(`   RAM:  ${outputPath}`));
  console.log();

  // Read FAF file (ROM)
  let fafContent: any;
  try {
    const content = await fs.readFile(fafPath, 'utf-8');
    fafContent = parseYAML(content);
  } catch (err) {
    console.log(chalk.red(`❌ Failed to read .faf: ${err}`));
    return;
  }

  // Export
  const result = await memoryExport(fafContent, outputPath, {
    merge: !options.force,
  });

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.log(chalk.yellow(`   ⚠️  ${w}`));
    }
    console.log();
  }

  console.log(chalk.green(`☑️  Created: ${result.filePath}`));
  console.log(chalk.gray(`   Lines: ${result.linesWritten} / 200 ceiling`));
  if (result.merged) {
    console.log(chalk.gray(`   Mode: Merged (Claude's existing notes preserved)`));
  }
  console.log();

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} tri-sync export complete! ROM → RAM`));
  console.log(chalk.gray('   Claude Code will auto-load this context in your next session.'));
  console.log();
}

// ============================================================================
// Import Command: RAM → ROM (MEMORY.md → .faf harvest)
// ============================================================================

async function runRamImport(args: string[]): Promise<void> {
  const options = parseRamArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Importing RAM → ROM (harvest)...`));
  console.log();

  // Resolve RAM path
  const projectRoot = resolveProjectRoot(options.projectPath);
  const ramPath = options.path || resolveMemoryPath(projectRoot);

  console.log(chalk.gray(`   RAM: ${ramPath}`));
  console.log();

  // Import
  const result = await memoryImport(ramPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Import failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.log(chalk.yellow(`   ⚠️  ${w}`));
    }
    console.log();
  }

  // Show harvested data
  const h = result.harvested;
  const total = h.patterns.length + h.conventions.length + h.keyFiles.length + h.notes.length;

  if (total === 0) {
    console.log(chalk.gray('   No structured entries to harvest.'));
    console.log();
    return;
  }

  console.log(chalk.green(`☑️  Harvested ${total} entries from Claude's notes:`));
  if (h.patterns.length > 0) {
    console.log(chalk.gray(`   Patterns: ${h.patterns.length}`));
    h.patterns.forEach(p => console.log(chalk.gray(`     - ${p}`)));
  }
  if (h.conventions.length > 0) {
    console.log(chalk.gray(`   Conventions: ${h.conventions.length}`));
    h.conventions.forEach(c => console.log(chalk.gray(`     - ${c}`)));
  }
  if (h.keyFiles.length > 0) {
    console.log(chalk.gray(`   Key Files: ${h.keyFiles.length}`));
    h.keyFiles.forEach(f => console.log(chalk.gray(`     - ${f}`)));
  }
  if (h.notes.length > 0) {
    console.log(chalk.gray(`   Notes: ${h.notes.length}`));
    h.notes.forEach(n => console.log(chalk.gray(`     - ${n}`)));
  }
  console.log();

  // Merge into .faf (ROM) if found
  const fafPath = await findFafFile(process.cwd());
  if (fafPath) {
    try {
      const fafRaw = await fs.readFile(fafPath, 'utf-8');
      const fafData = parseYAML(fafRaw) as any;

      // Add harvested data under ram_harvest
      fafData.ram_harvest = {
        last_import: new Date().toISOString(),
        patterns: h.patterns.length > 0 ? h.patterns : undefined,
        conventions: h.conventions.length > 0 ? h.conventions : undefined,
        key_files: h.keyFiles.length > 0 ? h.keyFiles : undefined,
        notes: h.notes.length > 0 ? h.notes : undefined,
      };

      await fs.writeFile(fafPath, stringifyYAML(fafData));
      console.log(chalk.green(`☑️  Merged into ROM: ${fafPath}`));
    } catch (err) {
      console.log(chalk.yellow(`   ⚠️  Could not merge into .faf: ${err}`));
    }
  }

  console.log();
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} tri-sync import complete! RAM → ROM`));
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

async function runRamSync(args: string[]): Promise<void> {
  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Syncing ROM ↔ RAM (tri-sync)...`));
  console.log(chalk.gray('   Source of truth: ROM (.faf)'));
  console.log();

  // Export first (ROM → RAM)
  await runRamExport(args);
}

// ============================================================================
// Status Command
// ============================================================================

async function runRamStatus(args: string[]): Promise<void> {
  const options = parseRamArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.lightning} RAM Status (tri-sync)`));
  console.log();

  const projectRoot = resolveProjectRoot(options.projectPath);
  const status = await getMemoryStatus(projectRoot);

  console.log(chalk.gray(`   Project Root:   ${projectRoot}`));
  console.log(chalk.gray(`   RAM Path:       ${status.path}`));
  console.log();

  if (status.exists) {
    console.log(chalk.green(`   ☑️  MEMORY.md exists`));
    console.log(chalk.gray(`   Total Lines:    ${status.totalLines} / 200 ceiling`));
    if (status.totalLines > 200) {
      console.log(chalk.yellow(`   ⚠️  Over 200-line ceiling! Lines 201+ silently truncated by Claude Code.`));
    }
    console.log(chalk.gray(`   FAF Section:    ${status.hasFafSection ? `${status.fafSectionLines} lines` : 'Not present'}`));
    console.log(chalk.gray(`   Claude Notes:   ${status.claudeNotesLines} lines`));
  } else {
    console.log(chalk.yellow(`   ⚠️  MEMORY.md not found`));
    console.log(chalk.gray('   Run "faf ram export" to seed RAM from ROM'));
  }

  console.log();
}

// ============================================================================
// Help
// ============================================================================

function showRamHelp(): void {
  console.log();
  console.log(`${FAF_COLORS.fafOrange('faf ram')} — ROM ↔ RAM (tri-sync)`);
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf ram export     ROM → RAM (seed Claude\'s MEMORY.md from .faf)');
  console.log('  faf ram import     RAM → ROM (harvest Claude\'s notes into .faf)');
  console.log('  faf ram sync       Bidirectional sync (ROM is source of truth)');
  console.log('  faf ram status     Show RAM path, line count, breakdown');
  console.log();
  console.log(chalk.cyan('Options:'));
  console.log('  --path <file>          Custom MEMORY.md path');
  console.log('  --force, -f            Overwrite entirely (don\'t merge)');
  console.log('  --project-path <dir>   Override project root for path resolution');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf ram export                     # Seed RAM from ROM');
  console.log('  faf ram export --force              # Overwrite (don\'t preserve Claude\'s notes)');
  console.log('  faf ram import                      # Harvest Claude\'s notes into ROM');
  console.log('  faf ram status                      # Check RAM path and line count');
  console.log();
  console.log(chalk.cyan('Bi-sync integration:'));
  console.log('  faf bi-sync --ram                  # tri-sync: also seed RAM');
  console.log('  faf bi-sync --all                  # Sync ALL targets including RAM');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  .faf is ROM — persistent, structured, portable.'));
  console.log(chalk.gray('  MEMORY.md is RAM — session-loaded, personal, Claude\'s workspace.'));
  console.log(chalk.gray('  tri-sync bridges ROM ↔ RAM.'));
  console.log(chalk.gray('  RAM lives at ~/.claude/projects/<id>/memory/MEMORY.md'));
  console.log(chalk.gray('  First 200 lines auto-loaded into every Claude Code session.'));
  console.log(chalk.gray('  Merge mode preserves Claude\'s own notes — we only touch our section.'));
  console.log();
}
