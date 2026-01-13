/**
 * faf conductor - Google Conductor Interop Commands
 *
 * Bidirectional interoperability between FAF and Google's Conductor format.
 * Positions FAF as the universal AI-context interchange format.
 *
 * Commands:
 * - faf conductor import    Import conductor/ → project.faf
 * - faf conductor export    Export project.faf → conductor/
 * - faf conductor sync      Bidirectional sync
 *
 * @see /specs/FAF-CONDUCTOR-INTEROP.md
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  conductorImport,
  conductorExport,
  detectConductor,
  type FafFromConductor,
} from '../utils/conductor-parser';

// ============================================================================
// Main Command Router
// ============================================================================

export async function conductorCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'import':
      await runConductorImport(subcommandArgs);
      break;

    case 'export':
      await runConductorExport(subcommandArgs);
      break;

    case 'sync':
      await runConductorSync(subcommandArgs);
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showConductorHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown conductor command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showConductorHelp();
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

async function runConductorImport(args: string[]): Promise<void> {
  const options = parseImportArgs(args);
  const conductorPath = options.path || path.join(process.cwd(), 'conductor');
  const outputPath = options.output || path.join(process.cwd(), 'project.faf');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Importing Conductor format...`));
  console.log(chalk.gray(`   Source: ${conductorPath}`));
  console.log();

  // Check if conductor directory exists
  try {
    const stat = await fs.stat(conductorPath);
    if (!stat.isDirectory()) {
      console.log(chalk.red(`❌ Not a directory: ${conductorPath}`));
      return;
    }
  } catch {
    console.log(chalk.red(`❌ Conductor directory not found: ${conductorPath}`));
    console.log();
    console.log(chalk.gray('Expected structure:'));
    console.log(chalk.gray('  conductor/'));
    console.log(chalk.gray('  ├── product.md'));
    console.log(chalk.gray('  ├── tech-stack.md'));
    console.log(chalk.gray('  ├── workflow.md'));
    console.log(chalk.gray('  └── product-guidelines.md'));
    console.log();
    return;
  }

  // Import
  const result = await conductorImport(conductorPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Import failed - no files found`));
    return;
  }

  // Show warnings
  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`⚠️ Warnings:`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    console.log();
  }

  // Show processed files
  console.log(chalk.green(`☑️ Files processed:`));
  result.filesProcessed.forEach(f => console.log(chalk.gray(`   - ${f}`)));
  console.log();

  // Handle merge option
  if (options.merge && await fileExists(outputPath)) {
    try {
      const existingContent = await fs.readFile(outputPath, 'utf-8');
      const existingFaf = parseYAML(existingContent) as any;

      // Merge - conductor values override where they exist
      const merged = {
        ...existingFaf,
        project: {
          ...existingFaf.project,
          ...result.faf.project,
          stack: {
            ...existingFaf.project?.stack,
            ...result.faf.project.stack,
          },
        },
        metadata: {
          ...existingFaf.metadata,
          conductor_import: result.faf.metadata.imported,
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
      type: 'conductor-import',
      project: result.faf.project,
      metadata: result.faf.metadata,
    };

    await fs.writeFile(outputPath, stringifyYAML(fafContent));
    console.log(chalk.green(`☑️ Created: ${outputPath}`));
  }

  console.log();
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} Conductor import complete!`));
  console.log(chalk.gray('   FAF is now your universal AI-context format.'));
  console.log();
}

// ============================================================================
// Export Command
// ============================================================================

interface ExportOptions {
  path?: string;
  only?: string[];
  force?: boolean;
}

function parseExportArgs(args: string[]): ExportOptions {
  const options: ExportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === '--only' && args[i + 1]) {
      options.only = args[++i].split(',');
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

async function runConductorExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);
  const outputPath = options.path || path.join(process.cwd(), 'conductor');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Exporting to Conductor format...`));
  console.log();

  // Find FAF file
  const fafPath = await findFafFile(process.cwd());
  if (!fafPath) {
    console.log(chalk.red(`❌ No .faf file found in current directory`));
    console.log(chalk.gray('   Run "faf init" first to create one.'));
    console.log();
    return;
  }

  console.log(chalk.gray(`   Source: ${fafPath}`));
  console.log(chalk.gray(`   Output: ${outputPath}`));
  console.log();

  // Check if conductor directory exists
  if (await fileExists(outputPath) && !options.force) {
    console.log(chalk.yellow(`⚠️ conductor/ directory already exists`));
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

  // Convert to conductor format
  const fafData: FafFromConductor = {
    project: {
      name: fafContent.project?.name || fafContent.name || 'Unknown',
      description: fafContent.project?.description || fafContent.description || '',
      type: fafContent.type || 'unknown',
      goals: fafContent.project?.goals || [],
      stack: {
        languages: fafContent.project?.stack?.languages || fafContent.languages || [],
        frameworks: fafContent.project?.stack?.frameworks || fafContent.frameworks || [],
        databases: fafContent.project?.stack?.databases || fafContent.databases || [],
        infrastructure: fafContent.project?.stack?.infrastructure || fafContent.infrastructure || [],
      },
      rules: fafContent.project?.rules || fafContent.rules || [],
      guidelines: fafContent.project?.guidelines || fafContent.guidelines || [],
    },
    metadata: {
      source: 'faf',
      imported: new Date().toISOString(),
    },
  };

  // Export
  const result = await conductorExport(fafData, outputPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  // Show generated files
  console.log(chalk.green(`☑️ Files generated:`));
  result.filesGenerated.forEach(f => console.log(chalk.gray(`   - conductor/${f}`)));
  console.log();

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} Conductor export complete!`));
  console.log(chalk.gray('   Your project now works with Gemini CLI Conductor extension.'));
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

interface SyncOptions {
  source?: 'faf' | 'conductor';
  path?: string;
}

function parseSyncArgs(args: string[]): SyncOptions {
  const options: SyncOptions = { source: 'faf' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' && args[i + 1]) {
      const src = args[++i];
      if (src === 'faf' || src === 'conductor') {
        options.source = src;
      }
    } else if (arg === '--path' && args[i + 1]) {
      options.path = args[++i];
    }
  }

  return options;
}

async function runConductorSync(args: string[]): Promise<void> {
  const options = parseSyncArgs(args);
  const conductorPath = options.path || path.join(process.cwd(), 'conductor');

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Syncing FAF <-> Conductor...`));
  console.log(chalk.gray(`   Source of truth: ${options.source}`));
  console.log();

  const hasConductor = await detectConductor(process.cwd());
  const fafPath = await findFafFile(process.cwd());

  if (options.source === 'conductor') {
    // Conductor is source of truth
    if (!hasConductor) {
      console.log(chalk.red(`❌ No conductor/ directory found`));
      return;
    }

    // Import from conductor
    await runConductorImport(['--path', conductorPath, '--merge']);
  } else {
    // FAF is source of truth (default)
    if (!fafPath) {
      console.log(chalk.red(`❌ No .faf file found`));
      return;
    }

    // Export to conductor
    await runConductorExport(['--path', conductorPath, '--force']);
  }

  console.log(chalk.green(`☑️ Sync complete!`));
  console.log();
}

// ============================================================================
// Help
// ============================================================================

function showConductorHelp(): void {
  console.log();
  console.log(FAF_COLORS.fafOrange('faf conductor') + ' - Google Conductor Interop');
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf conductor import     Import conductor/ directory to project.faf');
  console.log('  faf conductor export     Export project.faf to conductor/ directory');
  console.log('  faf conductor sync       Bidirectional sync between formats');
  console.log();
  console.log(chalk.cyan('Import Options:'));
  console.log('  --path <dir>       Conductor directory path (default: ./conductor)');
  console.log('  --merge, -m        Merge with existing .faf instead of overwrite');
  console.log('  --output <file>    Output file path (default: ./project.faf)');
  console.log();
  console.log(chalk.cyan('Export Options:'));
  console.log('  --path <dir>       Output directory (default: ./conductor)');
  console.log('  --only <list>      Export specific sections (comma-separated)');
  console.log('  --force, -f        Overwrite existing conductor/ directory');
  console.log();
  console.log(chalk.cyan('Sync Options:'));
  console.log('  --source <faf|conductor>   Source of truth (default: faf)');
  console.log('  --path <dir>               Conductor directory path');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf conductor import                         # Import ./conductor to project.faf');
  console.log('  faf conductor import --path ./my-conductor   # Import from custom path');
  console.log('  faf conductor import --merge                 # Merge with existing .faf');
  console.log();
  console.log('  faf conductor export                         # Export to ./conductor');
  console.log('  faf conductor export --path ./output         # Export to custom path');
  console.log('  faf conductor export --force                 # Overwrite existing');
  console.log();
  console.log('  faf conductor sync                           # Sync (FAF is source of truth)');
  console.log('  faf conductor sync --source conductor        # Sync (Conductor is source)');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  FAF supports Google Gemini CLI Conductor extension format.'));
  console.log(chalk.gray('  This enables bidirectional interoperability - use FAF as'));
  console.log(chalk.gray('  your universal AI-context interchange format.'));
  console.log();
  console.log(chalk.gray('  Learn more: https://faf.one/docs/conductor'));
  console.log();
}
