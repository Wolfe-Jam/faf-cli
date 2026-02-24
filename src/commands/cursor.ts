/**
 * faf cursor - Cursor IDE Interop Commands
 *
 * Bidirectional interoperability between FAF and .cursorrules files.
 * Generates legacy .cursorrules format (single file) for widest compatibility.
 *
 * Commands:
 * - faf cursor import    Import .cursorrules → project.faf
 * - faf cursor export    Export project.faf → .cursorrules
 * - faf cursor sync      Bidirectional sync
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  cursorImport,
  cursorExport,
  detectCursorRules,
} from '../utils/cursorrules-parser';

// ============================================================================
// Main Command Router
// ============================================================================

export async function cursorCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'import':
      await runCursorImport(subcommandArgs);
      break;

    case 'export':
      await runCursorExport(subcommandArgs);
      break;

    case 'sync':
      await runCursorSync(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showCursorHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown cursor command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showCursorHelp();
      process.exit(1);
  }
}

// ============================================================================
// Import Command
// ============================================================================

interface ImportOptions {
  path?: string;
  merge?: boolean;
  output?: string;
}

function parseImportArgs(args: string[]): ImportOptions {
  const options: ImportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--merge' || arg === '-m') {
      options.merge = true;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  return options;
}

async function runCursorImport(args: string[]): Promise<void> {
  const options = parseImportArgs(args);
  const outputPath = options.output || path.join(process.cwd(), 'project.faf');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Importing .cursorrules...`));

  // Determine source path
  let cursorPath: string | null = null;

  if (options.path) {
    cursorPath = options.path;
  } else {
    cursorPath = await detectCursorRules(process.cwd());
    if (!cursorPath) {
      console.log(chalk.red(`❌ .cursorrules not found in current directory`));
      console.log(chalk.gray('   Use --path to specify location'));
      console.log();
      return;
    }
  }

  console.log(chalk.gray(`   Source: ${cursorPath}`));
  console.log();

  // Import
  const result = await cursorImport(cursorPath);

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

      // Merge - cursor values add to existing
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
          cursor_import: result.faf.metadata.imported,
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
      type: 'cursor-import',
      project: result.faf.project,
      metadata: result.faf.metadata,
    };

    await fs.writeFile(outputPath, stringifyYAML(fafContent));
    console.log(chalk.green(`☑️ Created: ${outputPath}`));
  }

  console.log();
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} .cursorrules import complete!`));
  console.log(chalk.gray('   FAF is now your universal AI-context format.'));
  console.log();
}

// ============================================================================
// Export Command
// ============================================================================

interface ExportOptions {
  path?: string;
  force?: boolean;
}

function parseExportArgs(args: string[]): ExportOptions {
  const options: ExportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

async function runCursorExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Exporting to .cursorrules...`));
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
  } else {
    outputPath = path.join(process.cwd(), '.cursorrules');
  }

  console.log(chalk.gray(`   Source: ${fafPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  // Check if file exists
  if (await fileExists(outputPath) && !options.force) {
    console.log(chalk.yellow(`⚠️ .cursorrules already exists`));
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
  const result = await cursorExport(fafContent, outputPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  console.log(chalk.green(`☑️ Created: ${result.filePath}`));
  console.log();

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} .cursorrules export complete!`));
  console.log(chalk.gray('   Your project now works with Cursor IDE.'));
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

interface SyncOptions {
  source?: 'faf' | 'cursor';
  path?: string;
}

function parseSyncArgs(args: string[]): SyncOptions {
  const options: SyncOptions = { source: 'faf' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' && args[i + 1]) {
      const src = args[++i];
      if (src === 'faf' || src === 'cursor') {
        options.source = src;
      }
    } else if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    }
  }

  return options;
}

async function runCursorSync(args: string[]): Promise<void> {
  const options = parseSyncArgs(args);

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Syncing FAF <-> .cursorrules...`));
  console.log(chalk.gray(`   Source of truth: ${options.source}`));
  console.log();

  if (options.source === 'cursor') {
    // .cursorrules is source of truth
    const importArgs = ['--merge'];
    if (options.path) {
      importArgs.push('--path', options.path);
    }
    await runCursorImport(importArgs);
  } else {
    // FAF is source of truth (default)
    const fafPath = await findFafFile(process.cwd());
    if (!fafPath) {
      console.log(chalk.red(`❌ No .faf file found`));
      return;
    }

    const exportArgs = ['--force'];
    if (options.path) {
      exportArgs.push('--path', options.path);
    }
    await runCursorExport(exportArgs);
  }

  console.log(chalk.green(`☑️ Sync complete!`));
  console.log();
}

// ============================================================================
// Help
// ============================================================================

function showCursorHelp(): void {
  console.log();
  console.log(`${FAF_COLORS.fafOrange('faf cursor')} - Cursor IDE Interop`);
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf cursor import     Import .cursorrules to project.faf');
  console.log('  faf cursor export     Export project.faf to .cursorrules');
  console.log('  faf cursor sync       Bidirectional sync between formats');
  console.log();
  console.log(chalk.cyan('Import Options:'));
  console.log('  --path <file>    .cursorrules file path');
  console.log('  --merge, -m      Merge with existing .faf instead of overwrite');
  console.log('  --output <file>  Output file path (default: ./project.faf)');
  console.log();
  console.log(chalk.cyan('Export Options:'));
  console.log('  --path <file>    Output file path');
  console.log('  --force, -f      Overwrite existing .cursorrules');
  console.log();
  console.log(chalk.cyan('Sync Options:'));
  console.log('  --source <faf|cursor>   Source of truth (default: faf)');
  console.log('  --path <file>           .cursorrules file path');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf cursor import                    # Import ./.cursorrules to project.faf');
  console.log('  faf cursor import --merge            # Merge with existing .faf');
  console.log();
  console.log('  faf cursor export                    # Export to ./.cursorrules');
  console.log('  faf cursor export --force            # Overwrite existing');
  console.log();
  console.log('  faf cursor sync                      # Sync (FAF is source of truth)');
  console.log('  faf cursor sync --source cursor      # Sync (.cursorrules is source)');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  FAF supports Cursor IDE .cursorrules files. Use FAF as your'));
  console.log(chalk.gray('  universal AI-context interchange format — define once in .faf,'));
  console.log(chalk.gray('  generate .cursorrules, AGENTS.md, CLAUDE.md, GEMINI.md, and more.'));
  console.log();
  console.log(chalk.gray('  Note: Generates legacy .cursorrules (single file) for widest'));
  console.log(chalk.gray('  compatibility. .cursor/rules/ MDC format is a future enhancement.'));
  console.log();
}
