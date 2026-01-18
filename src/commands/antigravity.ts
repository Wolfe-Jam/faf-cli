/**
 * faf antigravity - Google Antigravity IDE Integration
 *
 * Dedicated command for managing global AI context with Google's Antigravity IDE.
 * Works with ~/.gemini/GEMINI.md - the global config that applies to every project.
 *
 * Commands:
 * - faf antigravity import    Import global GEMINI.md → project.faf
 * - faf antigravity export    Export project.faf → global GEMINI.md
 * - faf antigravity sync      Bidirectional sync with global config
 * - faf antigravity status    Show current global config status
 *
 * @see https://developers.google.com/gemini
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FAF_ICONS } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { parse as parseYAML } from '../fix-once/yaml';
import {
  geminiImport,
  geminiExport,
  detectGlobalGeminiMd,
} from '../utils/gemini-parser';

// ============================================================================
// Constants
// ============================================================================

const ANTIGRAVITY_COLORS = {
  // Antigravity theme: magenta/purple family
  primary: (text: string) => chalk.magenta(text),
  secondary: (text: string) => chalk.blue(text),
  accent: (text: string) => chalk.cyan(text),
};

function getGlobalGeminiPath(): string {
  const home = os.homedir();
  return path.join(home, '.gemini', 'GEMINI.md');
}

function getGlobalGeminiDir(): string {
  const home = os.homedir();
  return path.join(home, '.gemini');
}

// ============================================================================
// Main Command Router
// ============================================================================

export async function antigravityCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const subcommandArgs = args.slice(1);

  switch (subcommand) {
    case 'import':
      await runAntigravityImport(subcommandArgs);
      break;

    case 'export':
      await runAntigravityExport(subcommandArgs);
      break;

    case 'sync':
      await runAntigravitySync(subcommandArgs);
      break;

    case 'status':
      await runAntigravityStatus();
      break;

    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showAntigravityHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown antigravity command: ${subcommand}`));
      console.log('\nAvailable commands:');
      showAntigravityHelp();
      process.exit(1);
  }
}

// ============================================================================
// Import Command
// ============================================================================

interface ImportOptions {
  merge?: boolean;
  output?: string;
}

function parseImportArgs(args: string[]): ImportOptions {
  const options: ImportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--merge' || arg === '-m') {
      options.merge = true;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  return options;
}

async function runAntigravityImport(args: string[]): Promise<void> {
  const options = parseImportArgs(args);
  const outputPath = options.output || path.join(process.cwd(), 'project.faf');

  console.log();
  console.log(ANTIGRAVITY_COLORS.primary(`🚀 Importing from Antigravity global config...`));

  // Check for global GEMINI.md
  const globalPath = await detectGlobalGeminiMd();
  if (!globalPath) {
    console.log(chalk.red(`❌ No global GEMINI.md found`));
    console.log(chalk.gray(`   Expected: ${getGlobalGeminiPath()}`));
    console.log();
    console.log(chalk.gray('   Create one with: faf antigravity export'));
    console.log();
    return;
  }

  console.log(chalk.gray(`   Source: ${globalPath}`));
  console.log();

  // Import
  const result = await geminiImport(globalPath);

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
      const { stringify: stringifyYAML } = await import('../fix-once/yaml');

      // Merge - global values supplement local
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
          antigravity_import: result.faf.metadata.imported,
        },
      };

      await fs.writeFile(outputPath, stringifyYAML(merged));
      console.log(chalk.green(`☑️ Merged into: ${outputPath}`));
    } catch (err) {
      console.log(chalk.red(`❌ Merge failed: ${err}`));
      return;
    }
  } else {
    const { stringify: stringifyYAML } = await import('../fix-once/yaml');

    // Convert to FAF YAML format
    const fafContent = {
      version: '1.0',
      type: 'antigravity-import',
      project: result.faf.project,
      metadata: result.faf.metadata,
    };

    await fs.writeFile(outputPath, stringifyYAML(fafContent));
    console.log(chalk.green(`☑️ Created: ${outputPath}`));
  }

  console.log();
  console.log(ANTIGRAVITY_COLORS.accent(`${FAF_ICONS.trophy} Antigravity import complete!`));
  console.log(chalk.gray('   Your global preferences are now in your local .faf file.'));
  console.log();
}

// ============================================================================
// Export Command
// ============================================================================

interface ExportOptions {
  force?: boolean;
}

function parseExportArgs(args: string[]): ExportOptions {
  const options: ExportOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

async function runAntigravityExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);
  const globalPath = getGlobalGeminiPath();
  const globalDir = getGlobalGeminiDir();

  console.log();
  console.log(ANTIGRAVITY_COLORS.primary(`🚀 Exporting to Antigravity global config...`));
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
  console.log(chalk.gray(`   Output: ${globalPath}`));
  console.log();

  // Ensure .gemini directory exists
  try {
    await fs.mkdir(globalDir, { recursive: true });
  } catch {
    // Already exists
  }

  // Check if file exists
  if (await fileExists(globalPath) && !options.force) {
    console.log(chalk.yellow(`⚠️ Global GEMINI.md already exists`));
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
  const result = await geminiExport(fafContent, globalPath);

  if (!result.success) {
    console.log(chalk.red(`❌ Export failed`));
    result.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    return;
  }

  console.log(chalk.green(`☑️ Created: ${result.filePath}`));
  console.log();

  console.log(ANTIGRAVITY_COLORS.accent(`${FAF_ICONS.trophy} Antigravity export complete!`));
  console.log(chalk.gray('   Your global context is now set for all Antigravity projects.'));
  console.log();
  console.log(ANTIGRAVITY_COLORS.secondary('   Every project in Antigravity IDE now inherits these defaults.'));
  console.log();
}

// ============================================================================
// Sync Command
// ============================================================================

interface SyncOptions {
  source?: 'faf' | 'antigravity';
}

function parseSyncArgs(args: string[]): SyncOptions {
  const options: SyncOptions = { source: 'faf' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' && args[i + 1]) {
      const src = args[++i];
      if (src === 'faf' || src === 'antigravity') {
        options.source = src;
      }
    }
  }

  return options;
}

async function runAntigravitySync(args: string[]): Promise<void> {
  const options = parseSyncArgs(args);

  console.log();
  console.log(ANTIGRAVITY_COLORS.primary(`🚀 Syncing with Antigravity global config...`));
  console.log(chalk.gray(`   Source of truth: ${options.source}`));
  console.log();

  if (options.source === 'antigravity') {
    // Global config is source of truth
    await runAntigravityImport(['--merge']);
  } else {
    // FAF is source of truth (default)
    const fafPath = await findFafFile(process.cwd());
    if (!fafPath) {
      console.log(chalk.red(`❌ No .faf file found`));
      return;
    }

    await runAntigravityExport(['--force']);
  }

  console.log(chalk.green(`☑️ Sync complete!`));
  console.log();
}

// ============================================================================
// Status Command
// ============================================================================

async function runAntigravityStatus(): Promise<void> {
  console.log();
  console.log(ANTIGRAVITY_COLORS.primary(`🚀 Antigravity Global Config Status`));
  console.log();

  const globalPath = getGlobalGeminiPath();
  const exists = await fileExists(globalPath);

  if (!exists) {
    console.log(chalk.yellow(`⚠️ No global config found`));
    console.log(chalk.gray(`   Expected: ${globalPath}`));
    console.log();
    console.log(chalk.gray('   Create one with: faf antigravity export'));
    console.log();
    return;
  }

  // Read and show status
  try {
    const content = await fs.readFile(globalPath, 'utf-8');
    const stats = await fs.stat(globalPath);
    const lines = content.split('\n').length;
    const sections = (content.match(/^##?\s+/gm) || []).length;

    console.log(chalk.green(`☑️ Global config active`));
    console.log(chalk.gray(`   Location: ${globalPath}`));
    console.log(chalk.gray(`   Size: ${content.length} bytes, ${lines} lines`));
    console.log(chalk.gray(`   Sections: ${sections}`));
    console.log(chalk.gray(`   Modified: ${stats.mtime.toLocaleDateString()}`));
    console.log();

    // Show section headers
    const headers = content.match(/^##?\s+.+$/gm) || [];
    if (headers.length > 0) {
      console.log(ANTIGRAVITY_COLORS.secondary('   Sections:'));
      headers.slice(0, 8).forEach(h => {
        console.log(chalk.gray(`     ${h.replace(/^#+\s*/, '')}`));
      });
      if (headers.length > 8) {
        console.log(chalk.gray(`     ... and ${headers.length - 8} more`));
      }
    }

    console.log();
    console.log(ANTIGRAVITY_COLORS.accent(`${FAF_ICONS.trophy} Antigravity IDE will apply this to all projects.`));
    console.log();

  } catch (err) {
    console.log(chalk.red(`❌ Failed to read global config: ${err}`));
  }
}

// ============================================================================
// Help
// ============================================================================

function showAntigravityHelp(): void {
  console.log();
  console.log(`${ANTIGRAVITY_COLORS.primary('faf antigravity')} - Google Antigravity IDE Integration`);
  console.log();
  console.log(chalk.cyan('Commands:'));
  console.log('  faf antigravity import     Import global config to project.faf');
  console.log('  faf antigravity export     Export project.faf to global config');
  console.log('  faf antigravity sync       Bidirectional sync with global config');
  console.log('  faf antigravity status     Show current global config status');
  console.log();
  console.log(chalk.cyan('Import Options:'));
  console.log('  --merge, -m      Merge with existing .faf instead of overwrite');
  console.log('  --output <file>  Output file path (default: ./project.faf)');
  console.log();
  console.log(chalk.cyan('Export Options:'));
  console.log('  --force, -f      Overwrite existing global GEMINI.md');
  console.log();
  console.log(chalk.cyan('Sync Options:'));
  console.log('  --source <faf|antigravity>   Source of truth (default: faf)');
  console.log();
  console.log(chalk.cyan('Examples:'));
  console.log('  faf antigravity status               # Check global config');
  console.log('  faf antigravity export               # Push .faf to global config');
  console.log('  faf antigravity export --force       # Overwrite global config');
  console.log('  faf antigravity import               # Pull global config to .faf');
  console.log('  faf antigravity sync                 # Sync (FAF is source)');
  console.log();
  console.log(chalk.gray('About:'));
  console.log(chalk.gray('  Antigravity is Google\'s AI-powered IDE built on Gemini.'));
  console.log(chalk.gray('  It reads global context from ~/.gemini/GEMINI.md'));
  console.log(chalk.gray('  that applies to every project you open.'));
  console.log();
  console.log(chalk.gray('  Your coding standards, preferences, and philosophy -'));
  console.log(chalk.gray('  defined once, applied everywhere.'));
  console.log();
  console.log(chalk.gray('  Global config: ~/.gemini/GEMINI.md'));
  console.log();
  console.log(chalk.gray('  Learn more: https://faf.one/docs/antigravity'));
  console.log();
}
