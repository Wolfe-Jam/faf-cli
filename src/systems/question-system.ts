/**
 * FAF Unified Question System
 *
 * Provides a unified interface for asking questions that works across:
 * - Terminal (inquirer prompts)
 * - Claude Code (AskUserQuestion structured output)
 * - MCP (JSON response for AI handling)
 *
 * This enables "faf go" to guide users to Gold Code regardless of context.
 *
 * @since v3.5.0
 */

import inquirer from 'inquirer';
import {
  detectExecutionContext,
  canPromptInteractively,
  shouldReturnStructuredQuestions,
  ExecutionContextInfo,
} from '../engines/execution-context';

// ============================================================================
// Types
// ============================================================================

/**
 * Question types supported by the system
 */
export type QuestionType = 'text' | 'select' | 'multiselect' | 'confirm';

/**
 * Option for select/multiselect questions
 */
export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
}

/**
 * A single question in the unified format
 */
export interface FafQuestion {
  /** Unique identifier for the question */
  id: string;

  /** The full question text */
  question: string;

  /** Short header/label (max 12 chars, for Claude Code chips) */
  header: string;

  /** The .faf field path this question populates (e.g., "project.goal") */
  field: string;

  /** Question type */
  type: QuestionType;

  /** Options for select/multiselect */
  options?: QuestionOption[];

  /** Is this question required? */
  required: boolean;

  /** Default value if any */
  defaultValue?: string;

  /** Validation function */
  validate?: (value: string) => boolean | string;

  /** Help text shown below the question */
  helpText?: string;
}

/**
 * Result from asking questions
 */
export interface QuestionResult {
  /** How were questions answered? */
  mode: 'interactive' | 'structured' | 'skipped';

  /** Collected answers (for interactive mode) */
  answers?: Record<string, string | string[]>;

  /** Questions to present (for structured mode / Claude Code) */
  questions?: FafQuestion[];

  /** Was the flow cancelled? */
  cancelled?: boolean;
}

/**
 * Structured output format for Claude Code / MCP
 */
export interface StructuredQuestionOutput {
  needsInput: true;
  context: string;
  currentScore?: number;
  targetScore: number;
  questions: Array<{
    question: string;
    header: string;
    field: string;
    type: QuestionType;
    options?: Array<{ label: string; description: string }>;
    required: boolean;
  }>;
}

// ============================================================================
// Question Registry - Maps .faf fields to human-friendly questions
// ============================================================================

/**
 * Registry of questions for .faf fields
 * These are the questions asked during "faf go"
 */
export const QUESTION_REGISTRY: Record<string, Omit<FafQuestion, 'id' | 'field'>> = {
  // Project section
  'project.name': {
    question: 'What is the name of this project?',
    header: 'Name',
    type: 'text',
    required: true,
    helpText: 'The project name as it appears in package.json or the main identifier',
  },

  'project.goal': {
    question: 'What does this project do? (one sentence)',
    header: 'Goal',
    type: 'text',
    required: true,
    helpText: 'A clear, concise description of what the project accomplishes',
  },

  'project.main_language': {
    question: 'What is the primary programming language?',
    header: 'Language',
    type: 'select',
    required: true,
    options: [
      { label: 'TypeScript', value: 'TypeScript', description: 'JavaScript with types' },
      { label: 'JavaScript', value: 'JavaScript', description: 'Vanilla JS or Node.js' },
      { label: 'Python', value: 'Python', description: 'Python 3.x' },
      { label: 'Rust', value: 'Rust', description: 'Systems programming' },
      { label: 'Go', value: 'Go', description: 'Golang' },
      { label: 'Java', value: 'Java', description: 'JVM language' },
      { label: 'C#', value: 'C#', description: '.NET ecosystem' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  // Human context section (the 6 Ws)
  'human_context.who': {
    question: 'Who uses this project? (target audience)',
    header: 'Who',
    type: 'text',
    required: false,
    helpText: 'Developers, end users, specific teams, etc.',
  },

  'human_context.what': {
    question: 'What problem does this solve?',
    header: 'What',
    type: 'text',
    required: false,
    helpText: 'The core problem or need this project addresses',
  },

  'human_context.why': {
    question: 'Why does this project exist?',
    header: 'Why',
    type: 'text',
    required: true,
    helpText: 'The motivation, business case, or reason for building this',
  },

  'human_context.where': {
    question: 'Where does this run? (environment)',
    header: 'Where',
    type: 'text',
    required: false,
    helpText: 'Cloud, local, browser, mobile, edge, etc.',
  },

  'human_context.when': {
    question: 'When was this started or what phase is it in?',
    header: 'When',
    type: 'text',
    required: false,
    helpText: 'MVP, production, maintenance, etc.',
  },

  'human_context.how': {
    question: 'How should AI assist with this project?',
    header: 'How',
    type: 'text',
    required: false,
    helpText: 'Coding style, review preferences, areas to focus on',
  },

  // Stack section
  'stack.frontend': {
    question: 'What frontend framework do you use?',
    header: 'Frontend',
    type: 'select',
    required: false,
    options: [
      { label: 'React', value: 'React', description: 'React.js' },
      { label: 'Vue', value: 'Vue', description: 'Vue.js' },
      { label: 'Svelte', value: 'Svelte', description: 'Svelte/SvelteKit' },
      { label: 'Angular', value: 'Angular', description: 'Angular framework' },
      { label: 'Next.js', value: 'Next.js', description: 'React framework' },
      { label: 'None', value: 'None', description: 'No frontend / backend only' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  'stack.backend': {
    question: 'What backend framework do you use?',
    header: 'Backend',
    type: 'select',
    required: false,
    options: [
      { label: 'Express', value: 'Express', description: 'Node.js Express' },
      { label: 'Fastify', value: 'Fastify', description: 'Node.js Fastify' },
      { label: 'Django', value: 'Django', description: 'Python Django' },
      { label: 'FastAPI', value: 'FastAPI', description: 'Python FastAPI' },
      { label: 'Rails', value: 'Rails', description: 'Ruby on Rails' },
      { label: 'Spring', value: 'Spring', description: 'Java Spring Boot' },
      { label: 'None', value: 'None', description: 'No backend / frontend only' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  'stack.database': {
    question: 'What database do you use?',
    header: 'Database',
    type: 'select',
    required: false,
    options: [
      { label: 'PostgreSQL', value: 'PostgreSQL', description: 'Relational database' },
      { label: 'MySQL', value: 'MySQL', description: 'Relational database' },
      { label: 'MongoDB', value: 'MongoDB', description: 'Document database' },
      { label: 'SQLite', value: 'SQLite', description: 'File-based database' },
      { label: 'Redis', value: 'Redis', description: 'In-memory store' },
      { label: 'Supabase', value: 'Supabase', description: 'Postgres + auth + realtime' },
      { label: 'None', value: 'None', description: 'No database' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  'stack.hosting': {
    question: 'Where is this hosted/deployed?',
    header: 'Hosting',
    type: 'select',
    required: false,
    options: [
      { label: 'Vercel', value: 'Vercel', description: 'Frontend/serverless' },
      { label: 'Netlify', value: 'Netlify', description: 'Frontend/serverless' },
      { label: 'AWS', value: 'AWS', description: 'Amazon Web Services' },
      { label: 'GCP', value: 'GCP', description: 'Google Cloud Platform' },
      { label: 'Cloudflare', value: 'Cloudflare', description: 'Workers/Pages' },
      { label: 'Railway', value: 'Railway', description: 'App hosting' },
      { label: 'Fly.io', value: 'Fly.io', description: 'Edge deployment' },
      { label: 'Self-hosted', value: 'Self-hosted', description: 'Own infrastructure' },
      { label: 'Local only', value: 'Local', description: 'Not deployed' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  'stack.build': {
    question: 'What build tool do you use?',
    header: 'Build',
    type: 'select',
    required: false,
    options: [
      { label: 'Vite', value: 'Vite', description: 'Fast dev server & bundler' },
      { label: 'Webpack', value: 'Webpack', description: 'Module bundler' },
      { label: 'esbuild', value: 'esbuild', description: 'Fast bundler' },
      { label: 'Rollup', value: 'Rollup', description: 'ES module bundler' },
      { label: 'Turbopack', value: 'Turbopack', description: 'Next.js bundler' },
      { label: 'tsc', value: 'tsc', description: 'TypeScript compiler' },
      { label: 'None', value: 'None', description: 'No build step' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },

  'stack.cicd': {
    question: 'What CI/CD system do you use?',
    header: 'CI/CD',
    type: 'select',
    required: false,
    options: [
      { label: 'GitHub Actions', value: 'GitHub Actions', description: 'GitHub workflow automation' },
      { label: 'GitLab CI', value: 'GitLab CI', description: 'GitLab pipelines' },
      { label: 'CircleCI', value: 'CircleCI', description: 'Cloud CI/CD' },
      { label: 'Jenkins', value: 'Jenkins', description: 'Self-hosted CI' },
      { label: 'None', value: 'None', description: 'No CI/CD configured' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },
};

// ============================================================================
// Question Builder
// ============================================================================

/**
 * Build a FafQuestion from a field path
 */
export function buildQuestion(field: string): FafQuestion | null {
  const template = QUESTION_REGISTRY[field];
  if (!template) {
    return null;
  }

  return {
    id: field.replace(/\./g, '_'),
    field,
    ...template,
  };
}

/**
 * Build questions for a list of missing fields
 */
export function buildQuestionsForFields(fields: string[]): FafQuestion[] {
  return fields
    .map(buildQuestion)
    .filter((q): q is FafQuestion => q !== null);
}

/**
 * Get all available questions (for full interview)
 */
export function getAllQuestions(): FafQuestion[] {
  return Object.keys(QUESTION_REGISTRY).map((field) => buildQuestion(field)!);
}

/**
 * Get questions for reaching Gold Code (most important fields)
 */
export function getGoldCodeQuestions(): FafQuestion[] {
  const goldFields = [
    'project.goal',
    'human_context.why',
    'human_context.who',
    'human_context.what',
    'stack.database',
    'stack.hosting',
  ];
  return buildQuestionsForFields(goldFields);
}

// ============================================================================
// Question Execution
// ============================================================================

/**
 * Convert FafQuestion to inquirer format
 * Returns a plain object that inquirer.prompt() can use
 */
function toInquirerQuestion(q: FafQuestion): Record<string, unknown> {
  switch (q.type) {
    case 'text':
      return {
        name: q.field,
        message: q.question,
        type: 'input',
        default: q.defaultValue,
        validate: q.validate,
      };

    case 'select':
      return {
        name: q.field,
        message: q.question,
        type: 'list',
        choices: q.options?.map((opt) => ({
          name: `${opt.label}${opt.description ? ` - ${opt.description}` : ''}`,
          value: opt.value,
        })) || [],
        default: q.defaultValue,
      };

    case 'multiselect':
      return {
        name: q.field,
        message: q.question,
        type: 'checkbox',
        choices: q.options?.map((opt) => ({
          name: `${opt.label}${opt.description ? ` - ${opt.description}` : ''}`,
          value: opt.value,
        })) || [],
        default: q.defaultValue?.split(','),
      };

    case 'confirm':
      return {
        name: q.field,
        message: q.question,
        type: 'confirm',
        default: q.defaultValue === 'true',
      };

    default:
      return {
        name: q.field,
        message: q.question,
        type: 'input',
      };
  }
}

/**
 * Convert FafQuestion to Claude Code AskUserQuestion format
 * @internal Reserved for future Claude Code integration
 */
function _toClaudeCodeQuestion(q: FafQuestion): object {
  return {
    question: q.question,
    header: q.header,
    field: q.field,
    type: q.type,
    required: q.required,
    options: q.options?.map((opt) => ({
      label: opt.label,
      description: opt.description || opt.value,
    })),
  };
}

/**
 * Ask questions using the appropriate method for the current context
 */
export async function askQuestions(
  questions: FafQuestion[],
  context?: ExecutionContextInfo
): Promise<QuestionResult> {
  const ctx = context || detectExecutionContext();

  // No questions? Skip.
  if (questions.length === 0) {
    return { mode: 'skipped', answers: {} };
  }

  // Interactive terminal: use inquirer
  if (canPromptInteractively(ctx)) {
    try {
      const inquirerQuestions = questions.map(toInquirerQuestion);
      // Use type assertion for inquirer v12 compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const answers = await (inquirer.prompt as any)(inquirerQuestions);
      return { mode: 'interactive', answers };
    } catch (_error) {
      // User cancelled (Ctrl+C)
      return { mode: 'interactive', cancelled: true };
    }
  }

  // Claude Code / MCP: return structured questions
  if (shouldReturnStructuredQuestions(ctx)) {
    return {
      mode: 'structured',
      questions,
    };
  }

  // Non-interactive, non-AI context: output JSON and exit
  const output: StructuredQuestionOutput = {
    needsInput: true,
    context: 'faf go',
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
  };

  console.log(JSON.stringify(output, null, 2));
  return { mode: 'structured', questions };
}

/**
 * Ask a single question
 */
export async function askQuestion(
  question: FafQuestion,
  context?: ExecutionContextInfo
): Promise<QuestionResult> {
  return askQuestions([question], context);
}

// ============================================================================
// Output Formatting for Claude Code
// ============================================================================

/**
 * Format questions as structured output for Claude Code
 * This is what Claude Code sees and uses with AskUserQuestion
 */
export function formatForClaudeCode(
  questions: FafQuestion[],
  currentScore?: number
): StructuredQuestionOutput {
  return {
    needsInput: true,
    context: 'faf go - guided path to Gold Code',
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
  };
}

/**
 * Print structured output for Claude Code to consume
 */
export function outputForClaudeCode(
  questions: FafQuestion[],
  currentScore?: number
): void {
  const output = formatForClaudeCode(questions, currentScore);
  console.log(JSON.stringify(output, null, 2));
}
