/**
 * 🧡 faf human - Interactive Human Context Collection
 * Asks for one W at a time, simple and focused
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  FAF_ICONS,
  FAF_COLORS,
} from "../utils/championship-style";
import { findFafFile } from "../utils/file-utils";
import * as readline from 'readline';

interface HumanOptions {
  all?: boolean;
  skip?: boolean;
  set?: string;  // "field:value" format
}

interface WField {
  key: string;
  question: string;
  example: string;
}

const W_FIELDS: WField[] = [
  { key: 'who', question: 'WHO is this for?', example: 'e.g., "Developers using AI assistants"' },
  { key: 'what', question: 'WHAT does it do?', example: 'e.g., "CLI tool for project context"' },
  { key: 'why', question: 'WHY does it exist?', example: 'e.g., "AI needs persistent context"' },
  { key: 'where', question: 'WHERE does it run?', example: 'e.g., "npm, browser, edge"' },
  { key: 'when', question: 'WHEN was it made/status?', example: 'e.g., "v1.0, production ready"' },
  { key: 'how', question: 'HOW do you use it?', example: 'e.g., "npm install -g faf-cli"' },
];

/**
 * Prompt for a single input
 */
async function askQuestion(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Main human command
 */
export async function humanCommand(
  projectPath?: string,
  options: HumanOptions = {}
) {
  const projectRoot = projectPath || process.cwd();

  try {
    // Find .faf file
    const fafPath = await findFafFile(projectRoot);

    if (!fafPath) {
      console.log();
      console.log(chalk.yellow(`${FAF_ICONS.robot} No .faf file found. Run 'faf init' first.`));
      return;
    }

    // Read existing .faf
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    const fafData = parseYAML(fafContent) || {};

    if (!fafData.human_context) {
      fafData.human_context = {};
    }

    // === NON-INTERACTIVE MODE: --set field "value" ===
    if (options.set) {
      const validFields = W_FIELDS.map(f => f.key);
      const field = options.set.toLowerCase();

      if (!validFields.includes(field)) {
        console.log();
        console.log(chalk.red(`Unknown field: ${field}`));
        console.log(chalk.gray(`Valid fields: ${validFields.join(', ')}`));
        return;
      }

      // The value comes as the next argument (projectPath in this case)
      // We need to handle this differently - the value is passed separately
      console.log();
      console.log(chalk.yellow(`Usage: faf human --set <field> "<value>"`));
      console.log(chalk.gray(`Example: faf human --set why "32x faster than Rust"`));
      return;
    }

    // === INTERACTIVE MODE ===
    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.heart_orange} Human Context Collection`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.gray('   Answer each question (Enter to skip)'));
    console.log();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let updatedCount = 0;

    for (const field of W_FIELDS) {
      const currentValue = fafData.human_context[field.key];
      const hasValue = currentValue && currentValue !== null && currentValue !== '';

      // Skip if already has value and not --all flag
      if (hasValue && !options.all) {
        console.log(chalk.gray(`   ${field.key.toUpperCase()}: ${currentValue} (keeping)`));
        continue;
      }

      // Show current value if exists
      if (hasValue) {
        console.log(chalk.gray(`   Current: ${currentValue}`));
      }

      // Ask the question
      console.log(FAF_COLORS.fafCyan(`   ${field.question}`));
      console.log(chalk.gray(`   ${field.example}`));

      const answer = await askQuestion(rl, FAF_COLORS.fafOrange('   > '));

      if (answer) {
        fafData.human_context[field.key] = answer;
        updatedCount++;
        console.log(chalk.green(`   ☑️ ${field.key} updated`));
      } else if (hasValue) {
        console.log(chalk.gray(`   (kept existing)`));
      } else {
        console.log(chalk.gray(`   (skipped)`));
      }

      console.log();
    }

    rl.close();

    // Save if any updates
    if (updatedCount > 0) {
      await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');

      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.heart_orange} Updated ${updatedCount} field${updatedCount > 1 ? 's' : ''}`));
      console.log(chalk.gray('   Run: faf score to see your new score'));
    } else {
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.gray('   No changes made'));
    }

    console.log();

  } catch {
    console.log(chalk.red(`\n${FAF_ICONS.fire} Human context collection failed`));
    process.exit(1);
  }
}

/**
 * Set a single human_context field (non-interactive)
 */
export async function humanSetCommand(
  field: string,
  value: string,
  projectPath?: string
) {
  const projectRoot = projectPath || process.cwd();
  const validFields = W_FIELDS.map(f => f.key);
  const fieldLower = field.toLowerCase();

  if (!validFields.includes(fieldLower)) {
    console.log();
    console.log(chalk.red(`Unknown field: ${field}`));
    console.log(chalk.gray(`Valid fields: ${validFields.join(', ')}`));
    return;
  }

  try {
    const fafPath = await findFafFile(projectRoot);

    if (!fafPath) {
      console.log();
      console.log(chalk.yellow(`${FAF_ICONS.robot} No .faf file found. Run 'faf init' first.`));
      return;
    }

    const fafContent = await fs.readFile(fafPath, 'utf-8');
    const fafData = parseYAML(fafContent) || {};

    if (!fafData.human_context) {
      fafData.human_context = {};
    }

    const oldValue = fafData.human_context[fieldLower];
    fafData.human_context[fieldLower] = value;

    await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');

    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.heart_orange} Human Context Updated`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green(`   ☑️ ${fieldLower.toUpperCase()}: ${value}`));
    if (oldValue) {
      console.log(chalk.gray(`      (was: ${oldValue})`));
    }
    console.log();

  } catch (error) {
    console.log(chalk.red(`\nFailed to set ${field}:`));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
