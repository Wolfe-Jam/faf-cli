/**
 * SCORES CAN'T LIE
 *
 * This test enforces FAF's core scoring principle.
 * Empty input = 0%. No exceptions. No "helpful" defaults.
 *
 * If this test fails, someone added fake score inflation.
 * Fix the code, not the test.
 *
 * NOTE: Uses execSync to spawn a child process because bun runs all tests
 * in a single process, and the generator's dependencies carry cached state
 * from other tests. A child process gets a clean module graph.
 */

import { execSync } from 'child_process';
import { promises as fs, writeFileSync, unlinkSync } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generate .faf content in a child process to avoid bun's shared module cache.
 * Writes a temp script, executes it with node, returns the generated content.
 */
function generateInChildProcess(emptyDir: string): string {
  const cliRoot = path.join(__dirname, '..');
  const scriptPath = path.join(emptyDir, '_gen.js');

  writeFileSync(scriptPath, `
    const { generateFafFromProject } = require('${cliRoot}/dist/generators/faf-generator-championship');
    const path = require('path');
    const dir = process.argv[2];
    generateFafFromProject({
      projectRoot: dir,
      outputPath: path.join(dir, 'project.faf')
    }).then(content => {
      process.stdout.write(content);
    }).catch(e => {
      process.stderr.write(e.message);
      process.exit(1);
    });
  `);

  const content = execSync(`node "${scriptPath}" "${emptyDir}"`, {
    encoding: 'utf-8',
    cwd: cliRoot,
  });

  unlinkSync(scriptPath);
  return content;
}

describe("SCORES CAN'T LIE", () => {
  let emptyDir: string;

  beforeEach(async () => {
    emptyDir = path.join(os.tmpdir(), `faf-test-empty-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(emptyDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(emptyDir, { recursive: true, force: true });
  });

  test('empty project scores 0%', () => {
    const content = generateInChildProcess(emptyDir);

    // Extract ai_score from generated content
    const scoreMatch = content.match(/ai_score:\s*"?(\d+)%?"?/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : -1;

    expect(score).toBe(0);
  });

  test('no fake defaults in output', () => {
    const content = generateInChildProcess(emptyDir);

    // These strings should NEVER appear for empty projects
    const fakeDefaults = [
      'main_language: TypeScript',
      'main_language: JavaScript',
      'package_manager: npm',
      'api_type: REST',
      'Universal AI-context',
      'Trust-Driven Infrastructure'
    ];

    for (const fake of fakeDefaults) {
      expect(content).not.toContain(fake);
    }
  });
});
