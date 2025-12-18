/**
 * 🔄 faf migrate - Migration Command
 * Migrate .faf (legacy) to project.faf (v1.2.0 standard)
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import path from "path";
import { FAF_COLORS, FAF_ICONS } from "../utils/championship-style";
import { fileExists } from "../utils/file-utils";

interface MigrateOptions {
  force?: boolean;
  dryRun?: boolean;
}

export async function migrateCommand(
  projectPath?: string,
  options: MigrateOptions = {},
) {
  try {
    const projectRoot = projectPath || process.cwd();
    const legacyPath = path.join(projectRoot, '.faf');
    const standardPath = path.join(projectRoot, 'project.faf');

    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Migrating to project.faf (v1.2.0 standard)...`));
    console.log();

    // Check if .faf exists
    const legacyExists = await fileExists(legacyPath);
    if (!legacyExists) {
      console.log(chalk.yellow('⚠️  No .faf file found in this directory'));
      console.log(chalk.gray(`   Looked in: ${projectRoot}`));
      console.log();
      console.log(chalk.cyan('💡 Already using project.faf? Great! Nothing to migrate.'));
      console.log();
      return;
    }

    // Check if project.faf already exists
    const standardExists = await fileExists(standardPath);
    if (standardExists && !options.force) {
      console.log(chalk.yellow('⚠️  project.faf already exists'));
      console.log(chalk.gray(`   ${standardPath}`));
      console.log();
      console.log(chalk.cyan('💡 Use --force to overwrite existing project.faf'));
      console.log();
      return;
    }

    // Dry run mode
    if (options.dryRun) {
      console.log(chalk.gray('🔍 Dry run mode - no files will be changed'));
      console.log();
      console.log(chalk.green('Would rename:'));
      console.log(chalk.gray(`   ${legacyPath}`));
      console.log(chalk.gray('   →'));
      console.log(chalk.cyan(`   ${standardPath}`));
      console.log();
      return;
    }

    // Perform migration
    try {
      await fs.rename(legacyPath, standardPath);

      console.log(chalk.green('☑️ Migration complete!'));
      console.log();
      console.log(chalk.green('Renamed:'));
      console.log(chalk.gray(`   ${legacyPath}`));
      console.log(chalk.gray('   →'));
      console.log(chalk.cyan(`   ${standardPath}`));
      console.log();
      console.log(FAF_COLORS.fafOrange('🎉 Your project is now using the v1.2.0 standard filename!'));
      console.log();
      console.log(chalk.gray('Why project.faf?'));
      console.log(chalk.gray('  • Visible in file explorers (not hidden)'));
      console.log(chalk.gray('  • Easier to discover and share'));
      console.log(chalk.gray('  • Universal like package.json'));
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Migration failed'));
      console.error(chalk.gray(`   ${error instanceof Error ? error.message : String(error)}`));
      console.log();
    }
  } catch (error) {
    console.error(chalk.red('❌ Error during migration'));
    console.error(chalk.gray(`   ${error instanceof Error ? error.message : String(error)}`));
    console.log();
  }
}
