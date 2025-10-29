/**
 * 🔄 faf rename - Bulk Migration Command
 * Find and migrate all .faf files to project.faf (v1.2.0 standard)
 *
 * Use case: "faf rename ~/Projects" migrates entire system in one command
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import path from "path";
import { FAF_COLORS, FAF_ICONS } from "../utils/championship-style";
import { fileExists } from "../utils/file-utils";

interface RenameOptions {
  force?: boolean;
  dryRun?: boolean;
  noConfirm?: boolean;
  maxDepth?: number;
}

interface MigrationResult {
  path: string;
  success: boolean;
  reason?: string;
}

/**
 * Recursively find all .faf files
 */
async function findAllFafFiles(
  searchPath: string,
  currentDepth: number = 0,
  maxDepth: number = 10
): Promise<string[]> {
  const fafFiles: string[] = [];

  if (currentDepth > maxDepth) {
    return fafFiles;
  }

  try {
    const entries = await fs.readdir(searchPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(searchPath, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.isDirectory()) {
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', 'target', 'venv', '__pycache__'];
        if (skipDirs.includes(entry.name)) {
          continue;
        }

        // Recurse into subdirectories
        const subFiles = await findAllFafFiles(fullPath, currentDepth + 1, maxDepth);
        fafFiles.push(...subFiles);
      } else if (entry.isFile() && entry.name === '.faf') {
        // Found a .faf file!
        fafFiles.push(fullPath);
      }
    }
  } catch (error: any) {
    // Skip directories we can't read (permission errors, etc.)
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      // Log other errors but continue
      console.error(chalk.gray(`   Warning: Could not read ${searchPath}`));
    }
  }

  return fafFiles;
}

/**
 * Migrate a single .faf file to project.faf
 */
async function migrateSingleFile(
  fafPath: string,
  force: boolean
): Promise<MigrationResult> {
  const dir = path.dirname(fafPath);
  const projectFafPath = path.join(dir, 'project.faf');

  try {
    // Check if project.faf already exists
    const projectFafExists = await fileExists(projectFafPath);

    if (projectFafExists && !force) {
      return {
        path: fafPath,
        success: false,
        reason: 'project.faf already exists'
      };
    }

    // Perform the rename
    await fs.rename(fafPath, projectFafPath);

    return {
      path: fafPath,
      success: true
    };
  } catch (error: any) {
    return {
      path: fafPath,
      success: false,
      reason: error.message
    };
  }
}

/**
 * Main rename command
 */
export async function renameCommand(
  searchPath?: string,
  options: RenameOptions = {},
) {
  const startTime = Date.now();
  const rootPath = searchPath ? path.resolve(searchPath) : process.cwd();

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Searching for .faf files to migrate...`));
  console.log(chalk.gray(`   Searching in: ${rootPath}`));
  console.log();

  // Check if search path exists
  try {
    const stats = await fs.stat(rootPath);
    if (!stats.isDirectory()) {
      console.log(chalk.red('❌ Search path must be a directory'));
      console.log();
      return;
    }
  } catch (error: any) {
    console.log(chalk.red(`❌ Path not found: ${rootPath}`));
    console.log();
    return;
  }

  // Find all .faf files
  const fafFiles = await findAllFafFiles(rootPath, 0, options.maxDepth || 10);

  if (fafFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No .faf files found'));
    console.log();
    console.log(chalk.cyan('💡 Already using project.faf? Great! Nothing to migrate.'));
    console.log();
    return;
  }

  console.log(chalk.green(`Found ${fafFiles.length} .faf file${fafFiles.length !== 1 ? 's' : ''}`));
  console.log();

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.gray('🔍 Dry run mode - no files will be changed'));
    console.log();
    console.log(chalk.green('Would migrate:'));
    for (const fafPath of fafFiles) {
      const dir = path.dirname(fafPath);
      const relPath = path.relative(rootPath, dir);
      console.log(chalk.gray(`   ${relPath || '.'}/`) + chalk.red('.faf') + chalk.gray(' → ') + chalk.cyan('project.faf'));
    }
    console.log();
    console.log(chalk.cyan(`Run without --dry-run to perform migration`));
    console.log();
    return;
  }

  // Confirmation for large migrations
  if (fafFiles.length > 10 && !options.noConfirm) {
    console.log(chalk.yellow(`⚠️  About to migrate ${fafFiles.length} files`));
    console.log();
    console.log(chalk.gray('This will rename:'));
    console.log(chalk.gray('  .faf → project.faf'));
    console.log();
    console.log(chalk.cyan('Continue? (Use --no-confirm to skip this)'));
    console.log(chalk.gray('Press Ctrl+C to cancel, or wait 5 seconds to continue...'));
    console.log();

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Perform migrations
  console.log(FAF_COLORS.fafOrange('🚀 Migrating...'));
  console.log();

  const results: MigrationResult[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const fafPath of fafFiles) {
    const result = await migrateSingleFile(fafPath, options.force || false);
    results.push(result);

    const dir = path.dirname(fafPath);
    const relPath = path.relative(rootPath, dir);

    if (result.success) {
      successCount++;
      console.log(chalk.green('☑️ ') + chalk.gray(`${relPath || '.'}/`) + chalk.cyan('project.faf'));
    } else {
      if (result.reason?.includes('already exists')) {
        skipCount++;
        console.log(chalk.gray('⊘  ') + chalk.gray(`${relPath || '.'}/ (project.faf exists)`));
      } else {
        errorCount++;
        console.log(chalk.red('✖  ') + chalk.gray(`${relPath || '.'}/ - ${result.reason}`));
      }
    }
  }

  const elapsedTime = Date.now() - startTime;

  // Summary
  console.log();
  console.log(FAF_COLORS.fafOrange('━'.repeat(50)));
  console.log();
  console.log(chalk.green.bold(`✅ Migration complete!`));
  console.log();
  console.log(chalk.gray('Results:'));
  console.log(chalk.green(`  ☑️  Migrated: ${successCount}`));
  if (skipCount > 0) {
    console.log(chalk.gray(`  ⊘  Skipped: ${skipCount} (already using project.faf)`));
  }
  if (errorCount > 0) {
    console.log(chalk.red(`  ✖  Errors: ${errorCount}`));
  }
  console.log(chalk.gray(`  ⚡ Time: ${elapsedTime}ms`));
  console.log();

  if (successCount > 0) {
    console.log(FAF_COLORS.fafOrange('🎉 Your projects are now using the v1.2.0 standard!'));
    console.log();
    console.log(chalk.gray('Why project.faf?'));
    console.log(chalk.gray('  • Visible in file explorers (not hidden)'));
    console.log(chalk.gray('  • Easier to discover and share'));
    console.log(chalk.gray('  • Universal like package.json'));
    console.log();
  }

  if (skipCount > 0 && successCount === 0) {
    console.log(chalk.cyan('💡 All projects already using project.faf - you\'re all set!'));
    console.log();
  }

  if (errorCount > 0) {
    console.log(chalk.yellow('⚠️  Some migrations failed. Run with --force to overwrite existing files.'));
    console.log();
  }
}
