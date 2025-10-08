/**
 * 🏎️ Question Asker - Championship 3-Question System
 *
 * Asks minimal questions to get maximum context
 * Uses inquirer for beautiful CLI interaction
 */

import inquirer from 'inquirer';
import { chalk } from '../fix-once/colors';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';

export interface ThreeQuestions {
  useCase: string;
  issues: string;
  other: string;
}

export class QuestionAsker {

  /**
   * Ask the 3 championship questions
   */
  async ask3Questions(): Promise<ThreeQuestions> {
    // Check if we're in an interactive terminal
    if (!process.stdin.isTTY) {
      console.log();
      console.log(FAF_COLORS.fafOrange('⚠️  Interactive questions require a terminal (TTY)'));
      console.log();
      console.log(FAF_COLORS.fafWhite('💡 When using AI assistants or CI/CD:'));
      console.log(FAF_COLORS.fafCyan('   faf init      - Create basic .faf file'));
      console.log(FAF_COLORS.fafCyan('   faf auto      - Automatically enhance context'));
      console.log(FAF_COLORS.fafCyan('   faf enhance   - Improve .faf programmatically'));
      console.log();

      // Return minimal answers for non-interactive mode
      return {
        useCase: 'Workflow automation (run in terminal for interactive setup)',
        issues: '',
        other: ''
      };
    }

    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Now, 3 quick questions to make this championship-grade:\n`));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'useCase',
        message: chalk.bold('Q1: What\'s the use case for this workflow?'),
        validate: (input: string) => {
          if (!input || input.trim().length < 10) {
            return chalk.red('Please provide at least 10 characters - this is the most important question!');
          }
          return true;
        },
        transformer: (input: string) => {
          // Show character count as they type
          return input.length > 0 ? `${input} ${chalk.gray(`(${input.length} chars)`)}` : input;
        }
      },
      {
        type: 'input',
        name: 'issues',
        message: chalk.bold('Q2: Any specific issues or problems?') + chalk.gray(' (optional)'),
        default: '',
        transformer: (input: string) => {
          return input.length > 0 ? `${input} ${chalk.gray(`(${input.length} chars)`)}` : chalk.gray('(skip or type)');
        }
      },
      {
        type: 'input',
        name: 'other',
        message: chalk.bold('Q3: Anything else important?') + chalk.gray(' (optional)'),
        default: '',
        transformer: (input: string) => {
          return input.length > 0 ? `${input} ${chalk.gray(`(${input.length} chars)`)}` : chalk.gray('(skip or type)');
        }
      }
    ]);

    // Show confirmation
    console.log();
    if (answers.useCase && answers.useCase.length > 10) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.green_heart} Got it!`));
    }
    if (answers.issues && answers.issues.length > 5) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.green_heart} Noted!`));
    }
    if (answers.other && answers.other.length > 5) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.green_heart} Perfect!`));
    }

    console.log();
    console.log(FAF_COLORS.fafCyan('━'.repeat(60)));
    console.log();

    return answers as ThreeQuestions;
  }

  /**
   * Ask use case question ONLY (for quick mode)
   */
  async askUseCaseOnly(): Promise<string> {
    // Check if we're in an interactive terminal
    if (!process.stdin.isTTY) {
      console.log();
      console.log(FAF_COLORS.fafOrange('⚠️  Interactive questions require a terminal (TTY)'));
      console.log();
      console.log(FAF_COLORS.fafWhite('💡 When using AI assistants or CI/CD:'));
      console.log(FAF_COLORS.fafCyan('   faf init      - Create basic .faf file'));
      console.log(FAF_COLORS.fafCyan('   faf auto      - Automatically enhance context'));
      console.log();

      return 'Workflow automation (run in terminal for interactive setup)';
    }

    console.log();
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'useCase',
        message: chalk.bold('What\'s the use case?'),
        validate: (input: string) => {
          if (!input || input.trim().length < 5) {
            return chalk.red('Please describe what this does');
          }
          return true;
        }
      }
    ]);

    return answer.useCase;
  }
}
