/**
 * 🎯 Skills Command - Claude Code Skills Integration
 * List skills from .faf file
 */

import { findFafFile } from '../utils/file-utils';
import { readFileSync } from 'fs';
import { parse as parseYAML } from '../fix-once/yaml';
import { chalk } from '../fix-once/colors';

export async function skillsCommand(options: { path?: string } = {}): Promise<void> {
  try {
    const fafPath = await findFafFile(options.path);

    if (!fafPath) {
      console.log(chalk.yellow('⚠️  No .faf file found'));
      console.log(chalk.dim('Run `faf init` to create one'));
      return;
    }

    const content = readFileSync(fafPath, 'utf-8');
    const data = parseYAML(content);

    if (!data.skills || data.skills.length === 0) {
      console.log(chalk.dim('No skills configured in .faf'));
      console.log(chalk.dim('Add skills to your .faf file:'));
      console.log(chalk.dim('  skills:'));
      console.log(chalk.dim('    - faf'));
      console.log(chalk.dim('    - wjttc-tester'));
      return;
    }

    console.log(chalk.cyan.bold('\n🎸 Claude Code Skills\n'));
    console.log(chalk.dim(`From: ${fafPath}\n`));

    data.skills.forEach((skill: string, index: number) => {
      console.log(`  ${index + 1}. ${chalk.bold(skill)}`);
    });

    console.log(chalk.dim(`\n${data.skills.length} skill(s) configured`));
    console.log(chalk.dim('Skills loaded from ~/.claude/skills/'));
  } catch (error) {
    console.error(chalk.red('Error reading skills:'), error);
    throw error;
  }
}
