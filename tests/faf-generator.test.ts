/**
 * Tests for .faf file generation
 */

import { generateFafFromProject } from '../src/generators/faf-generator';
import * as YAML from 'yaml';

describe('FAF Generator', () => {
  it('should generate valid YAML output', async () => {
    const options = {
      projectType: 'typescript',
      outputPath: 'test.faf',
      projectRoot: process.cwd()
    };

    const result = await generateFafFromProject(options);
    
    // Should be valid YAML
    expect(() => YAML.parse(result)).not.toThrow();
    
    // Should contain required fields
    const parsed = YAML.parse(result);
    expect(parsed.faf_version).toBeDefined();
    expect(parsed.project).toBeDefined();
    expect(parsed.project.name).toBeDefined();
    expect(parsed.project.faf_score).toBeGreaterThan(0);
  });

  it('should include AI instructions section', async () => {
    const options = {
      projectType: 'generic',
      outputPath: 'test.faf',
      projectRoot: process.cwd()
    };

    const result = await generateFafFromProject(options);
    const parsed = YAML.parse(result);
    
    expect(parsed.ai_instructions).toBeDefined();
    expect(parsed.ai_instructions.priority).toBe('CRITICAL');
    expect(parsed.ai_instructions.message).toContain('ATTENTION AI');
  });

  it('should generate different scores for different project types', async () => {
    const genericOptions = {
      projectType: 'generic',
      outputPath: 'test.faf',
      projectRoot: process.cwd()
    };

    const typescriptOptions = {
      projectType: 'typescript',
      outputPath: 'test.faf', 
      projectRoot: process.cwd()
    };

    const genericResult = await generateFafFromProject(genericOptions);
    const typescriptResult = await generateFafFromProject(typescriptOptions);
    
    const genericParsed = YAML.parse(genericResult);
    const typescriptParsed = YAML.parse(typescriptResult);
    
    // TypeScript projects should typically have higher scores
    expect(typescriptParsed.project.faf_score).toBeGreaterThanOrEqual(genericParsed.project.faf_score);
  });
});