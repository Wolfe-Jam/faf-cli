/**
 * 🚀 .faf-engine Mk-1
 * Universal Context-On-Demand Engine
 * Platform-agnostic intelligence for any architecture
 */

// Core Engine Exports
export { FafEngine } from './core/FafEngine';
export { FabFormatsEngine } from './formats/FabFormatsEngine';
export { ContextOnDemand } from './context/ContextOnDemand';
export { ScoreCalculator } from './scoring/ScoreCalculator';

// Type Exports
export type {
  FafConfig,
  FafData,
  FafScore,
  FafValidation,
  EngineOptions,
  PlatformAdapter,
  ContextOnDemandResult
} from './types';

// Utility Exports  
export { YamlGenerator } from './generators/YamlGenerator';
export { FileDiscovery } from './discovery/FileDiscovery';
export { FrameworkDetector } from './detection/FrameworkDetector';

// Platform Adapters
export { VercelAdapter } from './adapters/VercelAdapter';
export { CLIAdapter } from './adapters/CLIAdapter';
export { WebAdapter } from './adapters/WebAdapter';

// Constants & Knowledge Base
export { KNOWLEDGE_BASE } from './knowledge/KnowledgeBase';
export { VERSION, ENGINE_NAME } from './constants';

/**
 * Quick Start Function
 */
export async function createFafEngine(options?: any) {
  const { FafEngine } = await import('./core/FafEngine');
  return new FafEngine(options);
}