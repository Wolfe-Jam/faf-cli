module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  // CRITICAL FIX: Run tests sequentially to prevent cwd corruption
  // Issue: Parallel tests change process.cwd(), then delete directories
  // Result: Other tests fail with "ENOENT: uv_cwd" when cwd no longer exists
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        rootDir: '.',
        outDir: './dist',
        module: 'commonjs',
        target: 'ES2020',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  // CRITICAL: Clear module cache between test runs
  clearMocks: true,
  resetModules: true,
  restoreMocks: true,
  // Mock problematic ES modules for testing
  moduleNameMapper: {
    // Force TypeScript resolution over JavaScript
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts' // Exclude CLI entry point from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // RATCHET: Thresholds set below current levels - can only go UP
  // Last updated: 2026-01-27 (21% baseline, -2% buffer for variance)
  // To update: run `npm test -- --coverage` and set to actual values
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 22,
      lines: 20,
      statements: 20
    }
  }
};