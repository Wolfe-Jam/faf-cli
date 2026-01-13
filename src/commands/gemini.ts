/**
 * faf gemini - Gemini CLI / Antigravity Interop Commands
 *
 * Bidirectional interoperability between FAF and GEMINI.md files.
 * Works with both Gemini CLI and Google Antigravity IDE.
 *
 * Commands:
 * - faf gemini import    Import GEMINI.md → project.faf
 * - faf gemini export    Export project.faf → GEMINI.md
 * - faf gemini sync      Bidirectional sync
 *
 * @see https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  geminiImport,
  geminiExport,
  detectGeminiMd,
  detectGlobalGeminiMd,
} from '../utils/gemini-parser';

// ============================================================================
// Main Command Router
// ============================================================================

export async function geminiCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'import':
      await runGeminiImport(subcommandArgs);
      break;

    case 'export':
      await runGeminiExport(subcommandArgs);
      break;

    case 'sync':
      await runGeminiSync(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showGeminiHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown gemini command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showGeminiHelp();
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

async function runGeminiImport(args: string[]): Promise<void> {
  const options = parseImportArgs(args);
  const outputPath = options.output || path.join(process.cwd(), 'project.faf');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Importing GEMINI.md...`));

  // Determine source path
  let geminiPath: string | null = null;

  if (options.path) {
    geminiPath = options.path;
  } else if (options.global) {
    geminiPath = await detectGlobalGeminiMd();
    if (!geminiPath) {
      console.log(chalk.red(`❌ Global GEMINI.md not found at ~/.gemini/GEMINI.md`));
      return;
    }
  } else {
    geminiPath = await detectGeminiMd(process.cwd());
    if (!geminiPath) {
      console.log(chalk.red(`❌ GEMINI.md not found in current directory`));
      console.log(chalk.gray('   Use --path to specify location, or --global for ~/.gemini/GEMINI.md'));
      console.log();
      return;
    }
  }

  console.log(chalk.gray(`   Source: ${geminiPath}`));
  console.log();

  // Import
  const result = await geminiImport(geminiPath);

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

      // Merge - gemini values override where they exist
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
          gemini_import: result.faf.metadata.imported,
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
      type: 'gemini-import',
      project: result.faf.project,
      metadata: result.faf.metadata,
    };

    await fs.writeFile(outputPath, stringifyYAML(fafContent));
    console.log(chalk.green(`☑️ Created: ${outputPath}`));
  }

  console.log();
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} GEMINI.md import complete!`));
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

async function runGeminiExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Exporting to GEMINI.md...`));
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
    const geminiDir = path.join(home, '.gemini');
    // Ensure .gemini directory exists
    try {
      await fs.mkdir(geminiDir, { recursive: true });
    } catch {
      // Already exists
    }
    outputPath = path.join(geminiDir, 'GEMINI.md');
  } else {
    outputPath = path.join(process.cwd(), 'GEMINI.md');
  }

  console.log(chalk.gray(`   Source: ${fafPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  // Check if file exists
  if (await fileExists(outputPath) && !options.force) {
    console.log(chalk.yellow(`⚠️ GEMINI.md already exists`));
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
  const result = await geminiExport(fafContent, outputPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  console.log(chalk.green(`☑️ Created: ${result.filePath}`));
  console.log();

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} GEMINI.md export complete!`));
  if (options.global) {
    console.log(chalk.gray('   Your global Gemini CLI / Antigravity rules are now set.'));
  } else {
    console.log(chalk.gray('   Your project now works with Gemini CLI and Antigravity.'));
  }
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

interface SyncOptions {
  source?: 'faf' | 'gemini';
  global?: boolean;
  path?: string;
}

function parseSyncArgs(args: string[]): SyncOptions {
  const options: SyncOptions = { source: 'faf' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' && args[i + 1]) {
      const src = args[++i];
      if (src === 'faf' || src === 'gemini') {
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

async function runGeminiSync(args: string[]): Promise<void> {
  const options = parseSyncArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Syncing FAF <-> GEMINI.md...`));
  console.log(chalk.gray(`   Source of truth: ${options.source}`));
  if (options.global) {
    console.log(chalk.gray(`   Target: ~/.gemini/GEMINI.md (global)`));
  }
  console.log();

  if (options.source === 'gemini') {
    // GEMINI.md is source of truth
    const importArgs = options.global ? ['--global', '--merge'] : ['--merge'];
    if (options.path) {
      importArgs.push('--path', options.path);
    }
    await runGeminiImport(importArgs);
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
    await runGeminiExport(exportArgs);
  }

  console.log(chalk.green(`☑️ Sync complete!`));
  console.log();
}

// ============================================================================
// Help
// ============================================================================

function showGeminiHelp(): void {
  console.log();
  console.log(FAF_COLORS.fafOrange('faf gemini') + ' - Gemini CLI / Antigravity Interop');
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf gemini import     Import GEMINI.md to project.faf');
  console.log('  faf gemini export     Export project.faf to GEMINI.md');
  console.log('  faf gemini sync       Bidirectional sync between formats');
  console.log();
  console.log(chalk.cyan('Import Options:'));
  console.log('  --path <file>    GEMINI.md file path');
  console.log('  --global, -g     Import from ~/.gemini/GEMINI.md');
  console.log('  --merge, -m      Merge with existing .faf instead of overwrite');
  console.log('  --output <file>  Output file path (default: ./project.faf)');
  console.log();
  console.log(chalk.cyan('Export Options:'));
  console.log('  --path <file>    Output file path');
  console.log('  --global, -g     Export to ~/.gemini/GEMINI.md');
  console.log('  --force, -f      Overwrite existing GEMINI.md');
  console.log();
  console.log(chalk.cyan('Sync Options:'));
  console.log('  --source <faf|gemini>   Source of truth (default: faf)');
  console.log('  --global, -g            Sync with ~/.gemini/GEMINI.md');
  console.log('  --path <file>           GEMINI.md file path');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf gemini import                    # Import ./GEMINI.md to project.faf');
  console.log('  faf gemini import --global           # Import ~/.gemini/GEMINI.md');
  console.log('  faf gemini import --merge            # Merge with existing .faf');
  console.log();
  console.log('  faf gemini export                    # Export to ./GEMINI.md');
  console.log('  faf gemini export --global           # Export to ~/.gemini/GEMINI.md');
  console.log('  faf gemini export --force            # Overwrite existing');
  console.log();
  console.log('  faf gemini sync                      # Sync (FAF is source of truth)');
  console.log('  faf gemini sync --source gemini      # Sync (GEMINI.md is source)');
  console.log('  faf gemini sync --global             # Sync with global GEMINI.md');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  FAF supports Gemini CLI and Google Antigravity GEMINI.md files.'));
  console.log(chalk.gray('  This enables bidirectional interoperability - use FAF as'));
  console.log(chalk.gray('  your universal AI-context interchange format.'));
  console.log();
  console.log(chalk.gray('  Locations:'));
  console.log(chalk.gray('    Project: ./GEMINI.md'));
  console.log(chalk.gray('    Global:  ~/.gemini/GEMINI.md'));
  console.log();
  console.log(chalk.gray('  Learn more: https://faf.one/docs/gemini'));
  console.log();
}
