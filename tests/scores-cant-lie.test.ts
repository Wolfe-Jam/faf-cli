/**
 * SCORES CAN'T LIE
 *
 * This test enforces FAF's core scoring principle.
 * Empty input = 0%. No exceptions. No "helpful" defaults.
 *
 * If this test fails, someone added fake score inflation.
 * Fix the code, not the test.
 */

import { generateFafFromProject } from '../src/generators/faf-generator-championship';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe("SCORES CAN'T LIE", () => {
  let emptyDir: string;

  beforeAll(async () => {
    // Create truly empty directory
    emptyDir = path.join(os.tmpdir(), `faf-test-empty-${Date.now()}`);
    await fs.mkdir(emptyDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(emptyDir, { recursive: true, force: true });
  });

  test('empty project scores 0%', async () => {
    const content = await generateFafFromProject({
      projectRoot: emptyDir,
      outputPath: path.join(emptyDir, 'project.faf')
    });

    // Extract ai_score from generated content
    const scoreMatch = content.match(/ai_score:\s*"?(\d+)%?"?/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : -1;

    expect(score).toBe(0);
  });

  test('no fake defaults in output', async () => {
    const content = await generateFafFromProject({
      projectRoot: emptyDir,
      outputPath: path.join(emptyDir, 'project.faf')
    });

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
