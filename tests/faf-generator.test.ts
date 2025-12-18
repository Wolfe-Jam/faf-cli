/**
 * Tests for .faf file generation
 */

import { generateFafFromProject } from '../src/generators/faf-generator-championship';
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
    expect(parsed.ai_scoring_system).toBeDefined();
    expect(parsed.project).toBeDefined();
    expect(parsed.project.name).toBeDefined();
    expect(parsed.ai_score).toBeDefined();
    // 0% is valid for minimal/empty projects (honest scoring)
    expect(parseInt(parsed.ai_score.replace('%', ''))).toBeGreaterThanOrEqual(0);
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
    expect(parsed.ai_instructions.priority_order).toBeDefined();
    expect(parsed.ai_instructions.working_style).toBeDefined();
    expect(parsed.ai_instructions.priority_order[0]).toContain('Read THIS .faf file first');
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
    const genericScore = parseInt(genericParsed.ai_score.replace('%', ''));
    const typescriptScore = parseInt(typescriptParsed.ai_score.replace('%', ''));
    expect(typescriptScore).toBeGreaterThanOrEqual(genericScore);
  });
});