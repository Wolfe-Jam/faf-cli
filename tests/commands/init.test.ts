/**
 * Tests for init command
 */

import { initFafFile } from '../../src/commands/init';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock console.log to capture output
const mockLog = jest.fn();
const mockError = jest.fn();
const mockExit = jest.fn();

console.log = mockLog;
console.error = mockError;
process.exit = mockExit as any;

describe('Init Command', () => {
  const testDir = path.join(__dirname, '../temp-init');
  
  beforeEach(() => {
    mockLog.mockClear();
    mockError.mockClear();
    mockExit.mockClear();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  it('should create .faf file for TypeScript project', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create package.json to make it look like a real project
    const packageJson = {
      name: "test-typescript-project",
      version: "1.0.0",
      description: "Test TypeScript project",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        test: "jest"
      },
      dependencies: {
        "commander": "^12.0.0"
      },
      devDependencies: {
        "typescript": "^5.3.3",
        "@types/node": "^20.0.0"
      }
    };
    
    await fs.writeFile(
      path.join(testDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        outDir: "./dist",
        rootDir: "./src",
        strict: true
      }
    };
    
    await fs.writeFile(
      path.join(testDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    await initFafFile(testDir, { force: false, template: 'auto' });

    const fafPath = path.join(testDir, '.faf');
    const fafExists = await fs.access(fafPath).then(() => true).catch(() => false);

    expect(fafExists).toBe(true);
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Created'));

    // Verify file content
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    expect(fafContent).toContain('faf_version: "2.5.0"');
    expect(fafContent).toContain('name: Test Typescript Project');
    expect(fafContent).toContain('TypeScript');
  });

  it('should force overwrite existing .faf file', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create existing .faf file
    const existingFaf = `faf_version: 2.0.0
project:
  name: "old-project"
`;
    const fafPath = path.join(testDir, '.faf');
    await fs.writeFile(fafPath, existingFaf, 'utf-8');

    // Create minimal project structure
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify({ name: "new-project", version: "1.0.0" })
    );

    await initFafFile(testDir, { force: true, template: 'auto' });

    const newContent = await fs.readFile(fafPath, 'utf-8');
    expect(newContent).toContain('new-project');
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Created'));
  });

  it.skip('should refuse to overwrite existing .faf file without force', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create existing .faf file
    const existingFaf = `faf_version: 2.0.0
project:
  name: "existing-project"
`;
    const fafPath = path.join(testDir, 'project.faf');
    await fs.writeFile(fafPath, existingFaf, 'utf-8');

    await initFafFile(testDir, { force: false, template: 'auto' });

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ .faf file already exists'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it.skip('should use specific template when requested', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create basic package.json
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify({ name: "react-test", version: "1.0.0" })
    );

    await initFafFile(testDir, { force: false, template: 'react' });

    const fafPath = path.join(testDir, 'project.faf');
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    
    expect(fafContent).toContain('React');
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('✅ Created .faf file'));
  });

  it('should handle custom output path', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify({ name: "custom-output-test", version: "1.0.0" })
    );

    const customOutput = path.join(testDir, 'custom.faf');
    await initFafFile(testDir, { force: false, template: 'auto', output: customOutput });

    const fafExists = await fs.access(customOutput).then(() => true).catch(() => false);
    expect(fafExists).toBe(true);
    
    const fafContent = await fs.readFile(customOutput, 'utf-8');
    expect(fafContent).toContain('name: Custom Output Test');
  });

  it.skip('should detect and handle Svelte projects', async () => {
    await fs.mkdir(testDir, { recursive: true });
    
    // Create Svelte project structure
    const packageJson = {
      name: "svelte-test-project",
      version: "1.0.0",
      dependencies: {
        "svelte": "^4.0.0"
      },
      devDependencies: {
        "@sveltejs/kit": "^2.0.0",
        "vite": "^5.0.0"
      }
    };
    
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create svelte.config.js
    await fs.writeFile(
      path.join(testDir, 'svelte.config.js'),
      `import adapter from '@sveltejs/adapter-auto';
      export default {
        kit: { adapter: adapter() }
      };`
    );

    await initFafFile(testDir, { force: false, template: 'auto' });

    const fafPath = path.join(testDir, 'project.faf');
    const fafContent = await fs.readFile(fafPath, 'utf-8');
    
    expect(fafContent).toContain('Svelte');
    expect(fafContent).toContain('svelte-test-project');
  });
});