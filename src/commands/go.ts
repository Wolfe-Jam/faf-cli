/**
 * 🚀 faf go - Guided Path to Gold Code
 *
 * Interactive interview that guides users from their current score to 100%.
 * Works seamlessly in:
 * - Terminal: Uses inquirer prompts
 * - Claude Code: Returns structured questions for AskUserQuestion
 * - MCP: Returns JSON for AI handling
 *
 * "Just type faf go, Claude will ask you questions till you're done. 100% target."
 *
 * @since v3.5.0
 */

import { chalk } from '../fix-once/colors';
import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import { FAF_COLORS, FAF_ICONS, generateFAFHeader } from '../utils/championship-style';
import { findFafFile, fileExists } from '../utils/file-utils';
import { FafCompiler } from '../compiler/faf-compiler';
import { displayScoreWithBirthDNA, FafDNAManager } from '../engines/faf-dna';
import {
  detectExecutionContext,
  canPromptInteractively,
  shouldReturnStructuredQuestions,
  getContextDescription,
} from '../engines/execution-context';
import {
  FafQuestion,
  QUESTION_REGISTRY,
  buildQuestion,
  buildQuestionsForFields,
  askQuestions,
  formatForClaudeCode,
  outputForClaudeCode,
} from '../systems/question-system';

interface GoOptions {
  quiet?: boolean;
  force?: boolean;
}

/**
 * Analyze .faf file and find missing/empty fields
 */
async function analyzeMissingFields(fafPath: string): Promise<string[]> {
  const content = await fs.readFile(fafPath, 'utf-8');
  const fafData = parseYAML(content);
  const missingFields: string[] = [];

  // Check all fields in QUESTION_REGISTRY
  for (const fieldPath of Object.keys(QUESTION_REGISTRY)) {
    const parts = fieldPath.split('.');
    let value: unknown = fafData;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    // Field is missing if undefined, null, empty string, or placeholder
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'Unknown' ||
      value === 'TBD' ||
      value === 'None' ||
      (typeof value === 'string' && value.toLowerCase().includes('placeholder'));

    if (isEmpty) {
      missingFields.push(fieldPath);
    }
  }

  return missingFields;
}

/**
 * Get priority order for questions (most impactful first)
 */
function prioritizeFields(fields: string[]): string[] {
  const priorityOrder = [
    'project.goal', // Most important for AI understanding
    'human_context.why', // Critical motivation
    'human_context.who', // Target audience
    'human_context.what', // Problem being solved
    'project.name', // Project identity
    'project.main_language', // Technical foundation
    'stack.database', // Architecture choices
    'stack.hosting', // Deployment context
    'stack.frontend', // UI framework
    'stack.backend', // Server framework
    'stack.build', // Build system
    'stack.cicd', // CI/CD pipeline
    'human_context.where', // Environment
    'human_context.when', // Timeline/phase
    'human_context.how', // AI assistance preferences
  ];

  return fields.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a);
    const bIndex = priorityOrder.indexOf(b);
    // Unknown fields go to the end
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Apply answers to .faf file
 */
async function applyAnswers(
  fafPath: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  const content = await fs.readFile(fafPath, 'utf-8');
  const fafData = parseYAML(content);

  for (const [fieldPath, value] of Object.entries(answers)) {
    if (!value || (Array.isArray(value) && value.length === 0)) continue;

    const parts = fieldPath.split('.');
    let current = fafData;

    // Navigate to parent, creating objects as needed
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    // Set the value
    const finalKey = parts[parts.length - 1];
    current[finalKey] = Array.isArray(value) ? value.join(', ') : value;
  }

  await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');
}

/**
 * Main faf go command
 */
export async function goCommand(directory?: string, options: GoOptions = {}): Promise<void> {
  const startTime = Date.now();
  const ctx = detectExecutionContext();
  const projectRoot = directory || process.cwd();

  // Show header in terminal (not in Claude Code/MCP)
  if (canPromptInteractively(ctx) && !options.quiet) {
    console.log(generateFAFHeader('Guided Path to Gold Code'));
    console.log();
  }

  // Find .faf file
  const fafPath = await findFafFile(projectRoot);

  if (!fafPath) {
    // No .faf file - in terminal, suggest init; in Claude Code, return structured guidance
    if (shouldReturnStructuredQuestions(ctx)) {
      console.log(
        JSON.stringify(
          {
            needsInit: true,
            context: 'faf go',
            message: 'No .faf file found. Run `faf init` first to create project DNA.',
            suggestion: 'faf init',
          },
          null,
          2
        )
      );
      return;
    }

    console.log(FAF_COLORS.fafOrange(`⚠️ No .faf file found.`));
    console.log();
    console.log(chalk.white('Run ') + chalk.cyan('faf init') + chalk.white(' first to create your project DNA.'));
    console.log(chalk.gray('Then run ') + chalk.cyan('faf go') + chalk.gray(' to reach Gold Code!'));
    return;
  }

  // Get current score
  const compiler = new FafCompiler();
  const scoreResult = await compiler.compile(fafPath);
  const currentScore = Math.round(scoreResult.score || 0);

  // Already at 100%? Celebrate!
  if (currentScore >= 100) {
    if (shouldReturnStructuredQuestions(ctx)) {
      console.log(
        JSON.stringify(
          {
            complete: true,
            score: currentScore,
            message: 'Congratulations! You have achieved Gold Code (100%).',
            context: 'faf go',
          },
          null,
          2
        )
      );
      return;
    }

    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} GOLD CODE ACHIEVED!`));
    console.log();
    console.log(chalk.green(`Your project has ${currentScore}% AI-Readiness!`));
    console.log(chalk.gray('Your AI now has complete context for championship performance.'));
    return;
  }

  // Find missing fields
  const missingFields = await analyzeMissingFields(fafPath);
  const prioritizedFields = prioritizeFields(missingFields);

  // No missing fields but score < 100? Must be quality issues
  if (prioritizedFields.length === 0) {
    if (shouldReturnStructuredQuestions(ctx)) {
      console.log(
        JSON.stringify(
          {
            score: currentScore,
            message: `Score is ${currentScore}%. All fields are filled but content may need enhancement.`,
            suggestion: 'faf enhance',
            context: 'faf go',
          },
          null,
          2
        )
      );
      return;
    }

    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Current Score: ${currentScore}%`));
    console.log();
    console.log(chalk.white('All fields are filled! To reach 100%, try:'));
    console.log(chalk.cyan('  faf enhance') + chalk.gray(' - AI-powered content improvement'));
    return;
  }

  // Build questions for missing fields
  const questions = buildQuestionsForFields(prioritizedFields);

  // In Claude Code / MCP: output structured questions only (no terminal messages)
  if (shouldReturnStructuredQuestions(ctx)) {
    outputForClaudeCode(questions, currentScore);
    return;
  }

  // Non-interactive, non-AI context (piped shell, CI): output JSON only
  if (!canPromptInteractively(ctx)) {
    console.log(JSON.stringify({
      needsInput: true,
      context: 'faf go',
      currentScore,
      targetScore: 100,
      questions: questions.map((q) => ({
        question: q.question,
        header: q.header,
        field: q.field,
        type: q.type,
        options: q.options?.map((opt) => ({
          label: opt.label,
          description: opt.description || opt.value,
        })),
        required: q.required,
      })),
    }, null, 2));
    return;
  }

  // In interactive terminal: show progress and prompt
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Current Score: ${currentScore}%`));
  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.precision} Target: 100% Gold Code`));
  console.log();
  console.log(chalk.gray(`Found ${questions.length} questions to reach Gold Code.`));
  console.log(chalk.gray('Press Ctrl+C at any time to save progress and exit.'));
  console.log();

  // Ask questions interactively
  const result = await askQuestions(questions, ctx);

  if (result.cancelled) {
    console.log();
    console.log(chalk.yellow('Interview cancelled. No changes made.'));
    return;
  }

  if (result.mode === 'interactive' && result.answers) {
    // Apply answers to .faf file
    await applyAnswers(fafPath, result.answers);

    // Recalculate score
    const newScoreResult = await compiler.compile(fafPath);
    const newScore = Math.round(newScoreResult.score || 0);
    const improvement = newScore - currentScore;

    console.log();
    console.log(FAF_COLORS.fafGreen(`✅ Answers saved to .faf file!`));
    console.log();

    // Show score improvement
    if (improvement > 0) {
      console.log(
        FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Score improved: ${currentScore}% -> ${newScore}% (+${improvement}%)`)
      );
    } else {
      console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} Current Score: ${newScore}%`));
    }

    // Get birth DNA for display
    const dnaManager = new FafDNAManager(projectRoot);
    const dna = await dnaManager.load();

    if (dna && dna.birthCertificate) {
      console.log();
      displayScoreWithBirthDNA(newScore, dna.birthCertificate.birthDNA, dna.birthCertificate.born, {
        showGrowth: true,
      });
    }

    // Celebration or next steps
    if (newScore >= 100) {
      console.log();
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} GOLD CODE ACHIEVED! Congratulations!`));
      console.log(chalk.gray('Your AI now has complete context for championship performance.'));
    } else if (newScore >= 85) {
      console.log();
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Championship performance achieved (85%+)!`));
      console.log(chalk.gray('Run ') + chalk.cyan('faf go') + chalk.gray(' again to reach 100%.'));
    } else {
      console.log();
      console.log(chalk.gray('Run ') + chalk.cyan('faf go') + chalk.gray(' again to continue to Gold Code.'));
    }

    const elapsedTime = Date.now() - startTime;
    console.log();
    console.log(chalk.gray(`Completed in ${elapsedTime}ms`));
  }
}
