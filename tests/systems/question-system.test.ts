/**
 * Unified Question System Tests
 */

import {
  FafQuestion,
  QuestionOption,
  QUESTION_REGISTRY,
  buildQuestion,
  buildQuestionsForFields,
  getAllQuestions,
  getGoldCodeQuestions,
  formatForClaudeCode,
} from '../../src/systems/question-system';

import { clearForcedContext } from '../../src/engines/execution-context';

describe('Question System', () => {
  afterEach(() => {
    clearForcedContext();
  });

  describe('QUESTION_REGISTRY', () => {
    it('should have questions for core project fields', () => {
      expect(QUESTION_REGISTRY['project.name']).toBeDefined();
      expect(QUESTION_REGISTRY['project.goal']).toBeDefined();
      expect(QUESTION_REGISTRY['project.main_language']).toBeDefined();
    });

    it('should have questions for human context (6 Ws)', () => {
      expect(QUESTION_REGISTRY['human_context.who']).toBeDefined();
      expect(QUESTION_REGISTRY['human_context.what']).toBeDefined();
      expect(QUESTION_REGISTRY['human_context.why']).toBeDefined();
      expect(QUESTION_REGISTRY['human_context.where']).toBeDefined();
      expect(QUESTION_REGISTRY['human_context.when']).toBeDefined();
      expect(QUESTION_REGISTRY['human_context.how']).toBeDefined();
    });

    it('should have questions for stack fields', () => {
      expect(QUESTION_REGISTRY['stack.frontend']).toBeDefined();
      expect(QUESTION_REGISTRY['stack.backend']).toBeDefined();
      expect(QUESTION_REGISTRY['stack.database']).toBeDefined();
      expect(QUESTION_REGISTRY['stack.hosting']).toBeDefined();
    });

    it('should have headers under 12 characters', () => {
      Object.entries(QUESTION_REGISTRY).forEach(([field, question]) => {
        expect(question.header.length).toBeLessThanOrEqual(12);
      });
    });

    it('should have valid question types', () => {
      const validTypes = ['text', 'select', 'multiselect', 'confirm'];
      Object.entries(QUESTION_REGISTRY).forEach(([field, question]) => {
        expect(validTypes).toContain(question.type);
      });
    });

    it('select questions should have options', () => {
      Object.entries(QUESTION_REGISTRY).forEach(([field, question]) => {
        if (question.type === 'select' || question.type === 'multiselect') {
          expect(question.options).toBeDefined();
          expect(question.options!.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('buildQuestion', () => {
    it('should build a complete question from field path', () => {
      const question = buildQuestion('project.goal');

      expect(question).not.toBeNull();
      expect(question!.id).toBe('project_goal');
      expect(question!.field).toBe('project.goal');
      expect(question!.question).toContain('project');
      expect(question!.header).toBe('Goal');
      expect(question!.type).toBe('text');
      expect(question!.required).toBe(true);
    });

    it('should return null for unknown fields', () => {
      const question = buildQuestion('unknown.field');
      expect(question).toBeNull();
    });

    it('should include options for select questions', () => {
      const question = buildQuestion('stack.database');

      expect(question).not.toBeNull();
      expect(question!.type).toBe('select');
      expect(question!.options).toBeDefined();
      expect(question!.options!.length).toBeGreaterThan(0);

      const pgOption = question!.options!.find((o) => o.value === 'PostgreSQL');
      expect(pgOption).toBeDefined();
      expect(pgOption!.label).toBe('PostgreSQL');
    });
  });

  describe('buildQuestionsForFields', () => {
    it('should build questions for multiple fields', () => {
      const fields = ['project.goal', 'human_context.why', 'stack.database'];
      const questions = buildQuestionsForFields(fields);

      expect(questions.length).toBe(3);
      expect(questions[0].field).toBe('project.goal');
      expect(questions[1].field).toBe('human_context.why');
      expect(questions[2].field).toBe('stack.database');
    });

    it('should filter out unknown fields', () => {
      const fields = ['project.goal', 'unknown.field', 'stack.database'];
      const questions = buildQuestionsForFields(fields);

      expect(questions.length).toBe(2);
    });

    it('should return empty array for all unknown fields', () => {
      const fields = ['unknown.one', 'unknown.two'];
      const questions = buildQuestionsForFields(fields);

      expect(questions).toEqual([]);
    });
  });

  describe('getAllQuestions', () => {
    it('should return all registered questions', () => {
      const questions = getAllQuestions();
      const registryCount = Object.keys(QUESTION_REGISTRY).length;

      expect(questions.length).toBe(registryCount);
    });

    it('should return valid FafQuestion objects', () => {
      const questions = getAllQuestions();

      questions.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(q.field).toBeDefined();
        expect(q.question).toBeDefined();
        expect(q.header).toBeDefined();
        expect(q.type).toBeDefined();
        expect(typeof q.required).toBe('boolean');
      });
    });
  });

  describe('getGoldCodeQuestions', () => {
    it('should return the most important questions for Gold Code', () => {
      const questions = getGoldCodeQuestions();

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThan(getAllQuestions().length);
    });

    it('should include project.goal (most important)', () => {
      const questions = getGoldCodeQuestions();
      const hasGoal = questions.some((q) => q.field === 'project.goal');

      expect(hasGoal).toBe(true);
    });

    it('should include human_context.why (critical for AI)', () => {
      const questions = getGoldCodeQuestions();
      const hasWhy = questions.some((q) => q.field === 'human_context.why');

      expect(hasWhy).toBe(true);
    });
  });

  describe('formatForClaudeCode', () => {
    it('should format questions for Claude Code AskUserQuestion', () => {
      const questions = [buildQuestion('project.goal')!];
      const output = formatForClaudeCode(questions, 72);

      expect(output.needsInput).toBe(true);
      expect(output.context).toContain('faf go');
      expect(output.currentScore).toBe(72);
      expect(output.targetScore).toBe(100);
      expect(output.questions.length).toBe(1);
    });

    it('should include question details in correct format', () => {
      const questions = [buildQuestion('stack.database')!];
      const output = formatForClaudeCode(questions);

      const q = output.questions[0];
      expect(q.question).toBeDefined();
      expect(q.header).toBe('Database');
      expect(q.field).toBe('stack.database');
      expect(q.type).toBe('select');
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThan(0);
    });

    it('should format options with label and description', () => {
      const questions = [buildQuestion('stack.hosting')!];
      const output = formatForClaudeCode(questions);

      const option = output.questions[0].options![0];
      expect(option.label).toBeDefined();
      expect(option.description).toBeDefined();
    });

    it('should handle questions without options', () => {
      const questions = [buildQuestion('human_context.why')!];
      const output = formatForClaudeCode(questions);

      expect(output.questions[0].options).toBeUndefined();
    });
  });

  describe('question content quality', () => {
    it('all questions should end with a question mark or be clear prompts', () => {
      Object.entries(QUESTION_REGISTRY).forEach(([field, question]) => {
        // Questions should either end with ? or contain clear directive words
        const isQuestion = question.question.includes('?');
        const hasDirective =
          question.question.toLowerCase().includes('what') ||
          question.question.toLowerCase().includes('who') ||
          question.question.toLowerCase().includes('where') ||
          question.question.toLowerCase().includes('when') ||
          question.question.toLowerCase().includes('how') ||
          question.question.toLowerCase().includes('why');

        expect(isQuestion || hasDirective).toBe(true);
      });
    });

    it('required questions should include the most critical fields', () => {
      const requiredFields = Object.entries(QUESTION_REGISTRY)
        .filter(([_, q]) => q.required)
        .map(([field, _]) => field);

      expect(requiredFields).toContain('project.goal');
      expect(requiredFields).toContain('human_context.why');
    });

    it('select options should have meaningful values', () => {
      Object.entries(QUESTION_REGISTRY).forEach(([field, question]) => {
        if (question.options) {
          question.options.forEach((opt) => {
            expect(opt.label.length).toBeGreaterThan(0);
            expect(opt.value.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });
});
