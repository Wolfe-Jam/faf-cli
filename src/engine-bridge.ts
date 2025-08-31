/**
 * 🚀 faf-engine Integration Bridge
 * Connects the CLI to the independent faf-engine Mk-1
 */

import { FafEngine } from '@faf/engine';
import { CLIAdapter } from '@faf/engine';
import type { FafData, FafScore, ContextOnDemandResult } from '@faf/engine';

// Export the engine for backwards compatibility
export { FafEngine } from '@faf/engine';
export type { FafData, FafScore, ContextOnDemandResult } from '@faf/engine';

/**
 * Create a CLI-configured engine instance
 */
export function createCLIEngine(projectDir?: string): FafEngine {
  return new FafEngine({
    platform: 'cli',
    projectDir: projectDir || process.cwd(),
    adapter: new CLIAdapter({ projectDir: projectDir || process.cwd() })
  });
}

/**
 * Bridge function for existing CLI score command
 */
export async function scoreWithEngine(fafFilePath: string): Promise<FafScore> {
  const engine = createCLIEngine();
  const fafData = await engine.loadFaf(fafFilePath);
  return engine.score(fafData);
}

/**
 * Bridge function for existing CLI init command
 */
export async function generateWithEngine(projectDir?: string): Promise<ContextOnDemandResult> {
  const engine = createCLIEngine(projectDir);
  return engine.generateContext(projectDir);
}

/**
 * Bridge function for existing CLI validate command
 */
export async function validateWithEngine(fafFilePath: string) {
  const engine = createCLIEngine();
  const fafData = await engine.loadFaf(fafFilePath);
  return engine.validate(fafData);
}

/**
 * Compatibility layer for existing CLI functions
 */
export const EngineBridge = {
  // Direct engine access
  createEngine: createCLIEngine,
  
  // Command bridges
  score: scoreWithEngine,
  generate: generateWithEngine,
  validate: validateWithEngine,
  
  // Utility functions
  async enhance(fafData: FafData, apiKey?: string): Promise<FafData> {
    // This would integrate with AI enhancement
    const engine = createCLIEngine();
    const validation = engine.validate(fafData);
    
    if (!validation.valid) {
      throw new Error(`Invalid .faf data: ${validation.errors.join(', ')}`);
    }
    
    // Return enhanced data (stub for now)
    return {
      ...fafData,
      ai_enhanced: true,
      enhancement_timestamp: new Date().toISOString()
    };
  }
};