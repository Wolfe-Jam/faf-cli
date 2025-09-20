/**
 * 📝 faf edit - Quick edit helper
 * Opens .faf file in default editor or shows edit instructions
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { findFafFile } from '../utils/file-utils';

export async function editFafFile(file?: string, options: any = {}) {
  try {
    const fafPath = file || await findFafFile();

    if (!fafPath) {
      console.error(chalk.red('❌ No .faf file found'));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`\n📝 Edit your .faf file to improve your score:\n`));
    console.log(chalk.white(`   File: ${fafPath}\n`));

    console.log(chalk.cyan('   Key fields to fill for higher score:'));
    console.log(chalk.gray('   HUMAN Context (most important):'));
    console.log(chalk.gray('     • human_context.who - Who is this for?'));
    console.log(chalk.gray('     • human_context.what - What problem does it solve?'));
    console.log(chalk.gray('     • human_context.why - Why does it matter?'));
    console.log(chalk.gray('     • human_context.where - Where will it be used?'));
    console.log(chalk.gray('     • human_context.when - When is it needed?'));
    console.log(chalk.gray('     • human_context.how - How will it work?'));
    console.log();
    console.log(chalk.gray('   Technical Context:'));
    console.log(chalk.gray('     • stack.frontend - Frontend framework'));
    console.log(chalk.gray('     • stack.backend - Backend technology'));
    console.log(chalk.gray('     • stack.database - Database system'));
    console.log(chalk.gray('     • project.goal - Project objective'));

    console.log(chalk.green('\n   After editing, run: ') + chalk.white.bold('faf score') + chalk.green(' to see improvements'));

    // Try to open in default editor if requested
    if (options.open) {
      const editor = process.env.EDITOR || 'vi';
      console.log(chalk.gray(`\n   Opening in ${editor}...`));
      spawn(editor, [fafPath], { stdio: 'inherit' });
    } else {
      console.log(chalk.gray('\n   💡 Tip: Use "faf edit --open" to open in your default editor'));
    }

  } catch (error) {
    console.error(chalk.red('💥 Edit guidance failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}