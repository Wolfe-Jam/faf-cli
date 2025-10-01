/**
 * 👋 FAF Welcome - First-time user onboarding
 * Shows a friendly guide for new users
 */

import { chalk } from '../fix-once/colors';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { fileExists } from '../utils/file-utils';
import * as path from 'path';
import { promises as fs } from 'fs';

export async function welcomeCommand(): Promise<void> {
  console.log();
  console.log(FAF_COLORS.fafCyan('━'.repeat(50)));
  console.log();
  console.log(FAF_COLORS.fafOrange(`  👋 Welcome to FAF - Project DNA for AI✨`));
  console.log();
  console.log(FAF_COLORS.fafCyan('━'.repeat(50)));
  console.log();

  console.log(FAF_COLORS.fafWhite('🎯 What is FAF?'));
  console.log(chalk.gray('   Universal AI-context format that makes any AI understand'));
  console.log(chalk.gray('   your project in seconds, not minutes.'));
  console.log();

  console.log(FAF_COLORS.fafWhite('🚀 Getting Started - Choose Your Speed:'));
  console.log();

  console.log(FAF_COLORS.fafCyan('   1. ⚡ Lightning Fast (10 seconds)'));
  console.log(chalk.gray('      faf quick "project-name, what it does"'));
  console.log(chalk.dim('      Example: faf quick "my-app, e-commerce platform"'));
  console.log();

  console.log(FAF_COLORS.fafCyan('   2. 🗣️  Conversational (2 minutes)'));
  console.log(chalk.gray('      faf chat'));
  console.log(chalk.dim('      Answer simple questions, get perfect .faf'));
  console.log();

  console.log(FAF_COLORS.fafCyan('   3. 🤖 Auto-Detect (instant)'));
  console.log(chalk.gray('      faf init'));
  console.log(chalk.dim('      Analyzes your existing code automatically'));
  console.log();

  console.log(FAF_COLORS.fafWhite('📈 After Creating Your .faf:'));
  console.log(chalk.gray('   • faf score     - Check AI-readiness (target: 70%+)'));
  console.log(chalk.gray('   • faf enhance   - Improve context automatically'));
  console.log(chalk.gray('   • faf show      - View your beautiful context'));
  console.log();

  console.log(FAF_COLORS.fafWhite('💡 Pro Tips:'));
  console.log(chalk.gray('   • Use --quiet flag to reduce output'));
  console.log(chalk.gray('   • Run faf auto for one-command magic'));
  console.log(chalk.gray('   • Check faf --help for all commands'));
  console.log();

  // Check if this is truly first time (no .faf in home config)
  const homeDir = require('os').homedir();
  const fafConfigPath = path.join(homeDir, '.faf-cli-config');

  if (!await fileExists(fafConfigPath)) {
    // Mark as welcomed
    await fs.writeFile(fafConfigPath, JSON.stringify({
      welcomed: true,
      firstRun: new Date().toISOString()
    }, null, 2));

    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} You're all set! Let's build something amazing.`));
  } else {
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.rocket} Welcome back! Ready to build?`));
  }

  console.log();
  console.log(FAF_COLORS.fafCyan('━'.repeat(50)));
  console.log();
}

/**
 * Check if user needs welcome message
 */
export async function shouldShowWelcome(): Promise<boolean> {
  const homeDir = require('os').homedir();
  const fafConfigPath = path.join(homeDir, '.faf-cli-config');

  // Show welcome if no config exists
  if (!await fileExists(fafConfigPath)) {
    return true;
  }

  // Check if user has any .faf files
  const cwd = process.cwd();
  const hasFafFile = await fileExists(path.join(cwd, '.faf')) ||
                     await fileExists(path.join(cwd, 'project.faf'));

  return !hasFafFile;
}