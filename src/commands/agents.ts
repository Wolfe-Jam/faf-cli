/**
 * faf agents - AGENTS.md Interop Commands
 *
 * Bidirectional interoperability between FAF and AGENTS.md files.
 * Works with OpenAI Codex, Linux Foundation tooling, and any tool
 * that reads AGENTS.md.
 *
 * Commands:
 * - faf agents import    Import AGENTS.md → project.faf
 * - faf agents export    Export project.faf → AGENTS.md
 * - faf agents sync      Bidirectional sync
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  agentsImport,
  agentsExport,
  detectAgentsMd,
  detectGlobalAgentsMd,
} from '../utils/agents-parser';

// ============================================================================
// Main Command Router
// ============================================================================

export async function agentsCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'import':
      await runAgentsImport(subcommandArgs);
      break;

    case 'export':
      await runAgentsExport(subcommandArgs);
      break;

    case 'sync':
      await runAgentsSync(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showAgentsHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown agents command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showAgentsHelp();
      process.exit(1);
  }
}

// ============================================================================
// Import Command
// ============================================================================

interface ImportOptions {
  path?: string;
  global?: boolean;
  merge?: boolean;
  output?: string;
}

function parseImportArgs(args: string[]): ImportOptions {
  const options: ImportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--merge' || arg === '-m') {
      options.merge = true;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  return options;
}

async function runAgentsImport(args: string[]): Promise<void> {
  const options = parseImportArgs(args);
  const outputPath = options.output || path.join(process.cwd(), 'project.faf');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Importing AGENTS.md...`));

  // Determine source path
  let agentsPath: string | null = null;

  if (options.path) {
    agentsPath = options.path;
  } else if (options.global) {
    agentsPath = await detectGlobalAgentsMd();
    if (!agentsPath) {
      console.log(chalk.red(`❌ Global AGENTS.md not found at ~/.codex/AGENTS.md`));
      return;
    }
  } else {
    agentsPath = await detectAgentsMd(process.cwd());
    if (!agentsPath) {
      console.log(chalk.red(`❌ AGENTS.md not found in current directory`));
      console.log(chalk.gray('   Use --path to specify location, or --global for ~/.codex/AGENTS.md'));
      console.log();
      return;
    }
  }

  console.log(chalk.gray(`   Source: ${agentsPath}`));
  console.log();

  // Import
  const result = await agentsImport(agentsPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Import failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`⚠️ Warnings:`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    console.log();
  }

  // Show sections found
  if (result.sectionsFound.length > 0) {
    console.log(chalk.green(`☑️ Sections imported:`));
    result.sectionsFound.forEach(s => console.log(chalk.gray(`   - ${s}`)));
    console.log();
  }

  // Handle merge option
  if (options.merge && await fileExists(outputPath)) {
    try {
      const existingContent = await fs.readFile(outputPath, 'utf-8');
      const existingFaf = parseYAML(existingContent) as any;

      // Merge - agents values add to existing
      const merged = {
        ...existingFaf,
        project: {
          ...existingFaf.project,
          rules: [...(existingFaf.project?.rules || []), ...result.faf.project.rules],
          guidelines: [...(existingFaf.project?.guidelines || []), ...result.faf.project.guidelines],
          codingStyle: [...(existingFaf.project?.codingStyle || []), ...result.faf.project.codingStyle],
        },
        metadata: {
          ...existingFaf.metadata,
          agents_import: result.faf.metadata.imported,
        },
      };

      await fs.writeFile(outputPath, stringifyYAML(merged));
      console.log(chalk.green(`☑️ Merged into: ${outputPath}`));
    } catch (err) {
      console.log(chalk.red(`❌ Merge failed: ${err}`));
      return;
    }
  } else {
    // Convert to FAF YAML format
    const fafContent = {
      version: '1.0',
      type: 'agents-import',
      project: result.faf.project,
      metadata: result.faf.metadata,
    };

    await fs.writeFile(outputPath, stringifyYAML(fafContent));
    console.log(chalk.green(`☑️ Created: ${outputPath}`));
  }

  console.log();
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} AGENTS.md import complete!`));
  console.log(chalk.gray('   FAF is now your universal AI-context format.'));
  console.log();
}

// ============================================================================
// Export Command
// ============================================================================

interface ExportOptions {
  path?: string;
  global?: boolean;
  force?: boolean;
}

function parseExportArgs(args: string[]): ExportOptions {
  const options: ExportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

async function runAgentsExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Exporting to AGENTS.md...`));
  console.log();

  // Find FAF file
  const fafPath = await findFafFile(process.cwd());
  if (!fafPath) {
    console.log(chalk.red(`❌ No .faf file found in current directory`));
    console.log(chalk.gray('   Run "faf init" first to create one.'));
    console.log();
    return;
  }

  // Determine output path
  let outputPath: string;
  if (options.path) {
    outputPath = options.path;
  } else if (options.global) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const codexDir = path.join(home, '.codex');
    try {
      await fs.mkdir(codexDir, { recursive: true });
    } catch {
      // Already exists
    }
    outputPath = path.join(codexDir, 'AGENTS.md');
  } else {
    outputPath = path.join(process.cwd(), 'AGENTS.md');
  }

  console.log(chalk.gray(`   Source: ${fafPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  // Check if file exists
  if (await fileExists(outputPath) && !options.force) {
    console.log(chalk.yellow(`⚠️ AGENTS.md already exists`));
    console.log(chalk.gray('   Use --force to overwrite'));
    console.log();
    return;
  }

  // Read FAF file
  let fafContent: any;
  try {
    const content = await fs.readFile(fafPath, 'utf-8');
    fafContent = parseYAML(content);
  } catch (err) {
    console.log(chalk.red(`❌ Failed to read FAF file: ${err}`));
    return;
  }

  // Export
  const result = await agentsExport(fafContent, outputPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  console.log(chalk.green(`☑️ Created: ${result.filePath}`));
  console.log();

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} AGENTS.md export complete!`));
  if (options.global) {
    console.log(chalk.gray('   Your global Codex AGENTS.md is now set.'));
  } else {
    console.log(chalk.gray('   Your project now works with OpenAI Codex and 20+ tools.'));
  }
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

interface SyncOptions {
  source?: 'faf' | 'agents';
  global?: boolean;
  path?: string;
}

function parseSyncArgs(args: string[]): SyncOptions {
  const options: SyncOptions = { source: 'faf' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' && args[i + 1]) {
      const src = args[++i];
      if (src === 'faf' || src === 'agents') {
        options.source = src;
      }
    } else if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    }
  }

  return options;
}

async function runAgentsSync(args: string[]): Promise<void> {
  const options = parseSyncArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Syncing FAF <-> AGENTS.md...`));
  console.log(chalk.gray(`   Source of truth: ${options.source}`));
  if (options.global) {
    console.log(chalk.gray(`   Target: ~/.codex/AGENTS.md (global)`));
  }
  console.log();

  if (options.source === 'agents') {
    // AGENTS.md is source of truth
    const importArgs = options.global ? ['--global', '--merge'] : ['--merge'];
    if (options.path) {
      importArgs.push('--path', options.path);
    }
    await runAgentsImport(importArgs);
  } else {
    // FAF is source of truth (default)
    const fafPath = await findFafFile(process.cwd());
    if (!fafPath) {
      console.log(chalk.red(`❌ No .faf file found`));
      return;
    }

    const exportArgs = options.global ? ['--global', '--force'] : ['--force'];
    if (options.path) {
      exportArgs.push('--path', options.path);
    }
    await runAgentsExport(exportArgs);
  }

  console.log(chalk.green(`☑️ Sync complete!`));
  console.log();
}

// ============================================================================
// Help
// ============================================================================

function showAgentsHelp(): void {
  console.log();
  console.log(`${FAF_COLORS.fafOrange('faf agents')} - AGENTS.md Interop`);
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf agents import     Import AGENTS.md to project.faf');
  console.log('  faf agents export     Export project.faf to AGENTS.md');
  console.log('  faf agents sync       Bidirectional sync between formats');
  console.log();
  console.log(chalk.cyan('Import Options:'));
  console.log('  --path <file>    AGENTS.md file path');
  console.log('  --global, -g     Import from ~/.codex/AGENTS.md');
  console.log('  --merge, -m      Merge with existing .faf instead of overwrite');
  console.log('  --output <file>  Output file path (default: ./project.faf)');
  console.log();
  console.log(chalk.cyan('Export Options:'));
  console.log('  --path <file>    Output file path');
  console.log('  --global, -g     Export to ~/.codex/AGENTS.md');
  console.log('  --force, -f      Overwrite existing AGENTS.md');
  console.log();
  console.log(chalk.cyan('Sync Options:'));
  console.log('  --source <faf|agents>   Source of truth (default: faf)');
  console.log('  --global, -g            Sync with ~/.codex/AGENTS.md');
  console.log('  --path <file>           AGENTS.md file path');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf agents import                    # Import ./AGENTS.md to project.faf');
  console.log('  faf agents import --global           # Import ~/.codex/AGENTS.md');
  console.log('  faf agents import --merge            # Merge with existing .faf');
  console.log();
  console.log('  faf agents export                    # Export to ./AGENTS.md');
  console.log('  faf agents export --global           # Export to ~/.codex/AGENTS.md');
  console.log('  faf agents export --force            # Overwrite existing');
  console.log();
  console.log('  faf agents sync                      # Sync (FAF is source of truth)');
  console.log('  faf agents sync --source agents      # Sync (AGENTS.md is source)');
  console.log('  faf agents sync --global             # Sync with global AGENTS.md');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  FAF supports AGENTS.md files used by OpenAI Codex, Linux Foundation'));
  console.log(chalk.gray('  tooling, and 20+ other tools. Use FAF as your universal AI-context'));
  console.log(chalk.gray('  interchange format — define once, generate everywhere.'));
  console.log();
  console.log(chalk.gray('  Locations:'));
  console.log(chalk.gray('    Project: ./AGENTS.md'));
  console.log(chalk.gray('    Global:  ~/.codex/AGENTS.md'));
  console.log();
}
