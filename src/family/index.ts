/**
 * FAF Integration System
 *
 * Championship-grade integration detection and context generation
 *
 * Phase 1: Core integrations (React, Next, Svelte, TypeScript, Vite, n8n)
 * Minimum quality: 85% (Bronze tier)
 */

// Export types
export type { FafFile, IntegrationDetector, IntegrationRegistry } from './types.js';

// Export registry (primary interface)
export { FafIntegrationRegistry, integrationRegistry } from './registry.js';

// Export individual detectors (for direct use)
export { reactDetector } from './detectors/react.js';
export { nextDetector } from './detectors/next.js';
export { svelteDetector } from './detectors/svelte.js';
export { typescriptDetector } from './detectors/typescript.js';
export { viteDetector } from './detectors/vite.js';
export { n8nDetector } from './detectors/n8n.js';

// Convenience function: Detect and generate context in one call
export async function detectAndGenerate(projectPath: string) {
  const { integrationRegistry } = await import('./registry.js');
  const detected = await integrationRegistry.detectAll(projectPath);
  const context = await integrationRegistry.generateContext(projectPath);

  return {
    detected,
    context,
  };
}
