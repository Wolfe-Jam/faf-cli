/**
 * 6Ws Builder Command
 * Opens web interface for interactive project context creation
 */

import { chalk } from '../fix-once/colors';
import inquirer from 'inquirer';
import open from 'open';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import { findFafFile } from '../utils/file-utils';
import { promises as fs } from 'fs';
import * as path from 'path';

export async function sixwsCommand(): Promise<void> {
  console.log(chalk.cyan('\n✨ 6Ws Builder - Web Interface\n'));
  console.log('Opening browser to https://faf.one/6ws...\n');

  // Open browser to 6ws builder
  await open('https://faf.one/6ws');

  console.log(chalk.gray('Fill out the 6 questions in your browser.'));
  console.log(chalk.gray('When done, copy the') + chalk.cyan(' human_context: ') + chalk.gray('section.\n'));

  // Prompt for paste
  const { yamlInput } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'yamlInput',
      message: 'Paste the human_context YAML here (opens your editor):',
      default: 'human_context:\n  who: ""\n  what: ""\n  where: ""\n  why: ""\n  when: ""\n  how: ""\n',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Please paste the human_context YAML';
        }

        // Validate YAML syntax
        try {
          parseYAML(input);
          return true;
        } catch (error) {
          return `Invalid YAML: ${(error as Error).message}`;
        }
      }
    }
  ]);

  // Parse the YAML
  let humanContext: any;
  try {
    const parsed = parseYAML(yamlInput);
    humanContext = parsed;

    // Validate it has human_context
    if (!humanContext.human_context) {
      console.log(chalk.yellow('\n⚠️  No human_context section found. Adding it...\n'));
      humanContext = { human_context: parsed };
    }
  } catch (error) {
    console.log(chalk.red(`\n❌ Failed to parse YAML: ${(error as Error).message}\n`));
    process.exit(1);
  }

  // Check if project.faf exists
  const fafPath = await findFafFile();

  if (fafPath) {
    // Merge into existing file
    console.log(chalk.gray(`\nFound existing file: ${fafPath}`));

    const { shouldMerge } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldMerge',
        message: 'Merge human_context into existing project.faf?',
        default: true
      }
    ]);

    if (shouldMerge) {
      try {
        const existingYaml = await fs.readFile(fafPath, 'utf-8');
        const existingContent = parseYAML(existingYaml);
        const merged = { ...existingContent, ...humanContext };
        await fs.writeFile(fafPath, stringifyYAML(merged), 'utf-8');
        console.log(chalk.green(`\n✅ Updated ${fafPath} with human_context\n`));
      } catch (error) {
        console.log(chalk.red(`\n❌ Failed to merge: ${(error as Error).message}\n`));
        process.exit(1);
      }
    } else {
      console.log(chalk.gray('\nSkipped merge. You can manually add it to your project.faf\n'));
    }
  } else {
    // Create new project.faf
    const projectFafPath = path.join(process.cwd(), 'project.faf');

    const { shouldCreate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCreate',
        message: 'Create new project.faf with this context?',
        default: true
      }
    ]);

    if (shouldCreate) {
      try {
        await fs.writeFile(projectFafPath, stringifyYAML(humanContext), 'utf-8');
        console.log(chalk.green(`\n✅ Created ${projectFafPath}\n`));
        console.log(chalk.gray('Next steps:'));
        console.log(chalk.gray('  1. Run') + chalk.cyan(' faf score ') + chalk.gray('to check completeness'));
        console.log(chalk.gray('  2. Share project.faf with Claude, Gemini, or ChatGPT\n'));
      } catch (error) {
        console.log(chalk.red(`\n❌ Failed to create file: ${(error as Error).message}\n`));
        process.exit(1);
      }
    } else {
      console.log(chalk.gray('\nSkipped file creation. You can save it manually.\n'));
    }
  }
}
