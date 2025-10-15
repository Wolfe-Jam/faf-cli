/**
 * FAF Integration Registry
 *
 * Central registry for all approved FAF integrations
 * Orchestrates detection and context generation
 */

import { IntegrationDetector, IntegrationRegistry, FafFile } from './types.js';
import { reactDetector } from './detectors/react.js';
import { nextDetector } from './detectors/next.js';
import { svelteDetector } from './detectors/svelte.js';
import { typescriptDetector } from './detectors/typescript.js';
import { viteDetector } from './detectors/vite.js';
import { n8nDetector } from './detectors/n8n.js';

/**
 * FAF Integration Registry
 *
 * Championship standard: Only integrations with 85+ quality score
 */
export class FafIntegrationRegistry implements IntegrationRegistry {
  integrations: Map<string, IntegrationDetector>;

  constructor() {
    this.integrations = new Map();

    // Phase 1: Core integrations (85+ quality score)
    this.register(reactDetector);
    this.register(nextDetector);
    this.register(svelteDetector);
    this.register(typescriptDetector);
    this.register(viteDetector);
    this.register(n8nDetector);
  }

  /**
   * Register a new integration
   */
  register(detector: IntegrationDetector): void {
    this.integrations.set(detector.name, detector);
  }

  /**
   * Get integration by name
   */
  get(name: string): IntegrationDetector | undefined {
    return this.integrations.get(name);
  }

  /**
   * Detect all integrations present in a project
   */
  async detectAll(projectPath: string): Promise<IntegrationDetector[]> {
    const detected: IntegrationDetector[] = [];

    for (const detector of this.integrations.values()) {
      try {
        const isPresent = await detector.detect(projectPath);
        if (isPresent) {
          detected.push(detector);
        }
      } catch (error) {
        console.error(`Error detecting ${detector.name}:`, error);
      }
    }

    return detected;
  }

  /**
   * Generate combined .faf context from all detected integrations
   */
  async generateContext(projectPath: string): Promise<Partial<FafFile>> {
    const detected = await this.detectAll(projectPath);

    // Merge contexts from all detected integrations
    let combinedContext: Partial<FafFile> = {
      stack: {},
      project: {},
      integration: {
        detected_frameworks: [],
        mcp_servers: [],
        recommended_tools: [],
      },
    };

    for (const detector of detected) {
      try {
        const context = await detector.generateContext(projectPath);

        // Merge stack information
        if (context.stack) {
          combinedContext.stack = {
            ...combinedContext.stack,
            ...context.stack,
          };
        }

        // Merge project information
        if (context.project) {
          combinedContext.project = {
            ...combinedContext.project,
            ...context.project,
          };
        }

        // Accumulate integration information
        if (context.integration) {
          combinedContext.integration!.detected_frameworks!.push(detector.name);
          combinedContext.integration!.mcp_servers!.push(...(context.integration.mcp_servers || []));
          combinedContext.integration!.recommended_tools!.push(...(context.integration.recommended_tools || []));
        }
      } catch (error) {
        console.error(`Error generating context for ${detector.name}:`, error);
      }
    }

    // Add integration summary
    combinedContext.integration!.summary = this.generateSummary(detected);

    return combinedContext;
  }

  /**
   * Generate human-readable summary of detected integrations
   */
  private generateSummary(detected: IntegrationDetector[]): string {
    if (detected.length === 0) {
      return 'No FAF integrations detected';
    }

    const tiers = detected.map((d) => `${d.displayName} (${d.tier})`);
    const frameworks = detected.map((d) => d.displayName).join(', ');

    return `Fully integrated with: ${frameworks} | ${detected.length} championship-grade integration${
      detected.length > 1 ? 's' : ''
    }`;
  }

  /**
   * Get all integration names
   */
  list(): string[] {
    return Array.from(this.integrations.keys());
  }

  /**
   * Get integration statistics
   */
  getStats(): {
    total: number;
    byTier: Record<string, number>;
    totalWeeklyAdoption: number;
  } {
    const stats = {
      total: this.integrations.size,
      byTier: {} as Record<string, number>,
      totalWeeklyAdoption: 0,
    };

    for (const detector of this.integrations.values()) {
      // Count by tier
      stats.byTier[detector.tier] = (stats.byTier[detector.tier] || 0) + 1;

      // Sum weekly adoption
      stats.totalWeeklyAdoption += detector.weeklyAdoption;
    }

    return stats;
  }
}

// Export singleton instance
export const integrationRegistry = new FafIntegrationRegistry();

// Export individual detectors for direct use
export { reactDetector, nextDetector, svelteDetector, typescriptDetector, viteDetector, n8nDetector };
