import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // TypeScript-specific rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Security rules (these stay as errors — non-negotiable)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code quality rules
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',

      // Performance rules
      'no-duplicate-imports': 'warn',
      'no-useless-concat': 'error',
      'prefer-template': 'error',

      // Complexity rules
      'complexity': ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': ['warn', { max: 50 }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'faf-engine/**', '**/*.js'],
  }
);
