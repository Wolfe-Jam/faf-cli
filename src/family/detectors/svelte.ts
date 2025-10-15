/**
 * Svelte Integration Detector
 *
 * Detects Svelte/SvelteKit usage and generates Svelte-optimized .faf context
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const svelteDetector: IntegrationDetector = {
  name: 'svelte',
  displayName: 'Svelte',
  tier: 'gold', // Based on evaluation: Svelte will score 95+
  qualityScore: 96,
  weeklyAdoption: 400_000, // ~400k weekly downloads
  mcpServers: ['@sveltejs/mcp', 'svelte-kit-mcp'],
  contextContribution: ['frontend', 'ui_library', 'state_management'],

  detect(projectPath: string): boolean {
    const packageJsonPath = join(projectPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      return 'svelte' in allDeps || '@sveltejs/kit' in allDeps;
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    let version = 'unknown';
    let isSvelteKit = false;
    let hasTypeScript = false;

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        version = allDeps.svelte || allDeps['@sveltejs/kit'] || 'latest';
        isSvelteKit = '@sveltejs/kit' in allDeps;
        hasTypeScript = 'typescript' in allDeps || existsSync(join(projectPath, 'tsconfig.json'));
      } catch {
        // Fallback to defaults
      }
    }

    // Check for SvelteKit structure
    const svelteConfigExists = existsSync(join(projectPath, 'svelte.config.js'));

    const baseContext: Partial<FafFile> = {
      stack: {
        frontend: `Svelte ${version}`,
        ui_library: 'Svelte Components',
        state_management: 'Svelte Stores',
        main_language: hasTypeScript ? 'TypeScript' : 'JavaScript',
      },
      integration: {
        framework: 'svelte',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          'Svelte DevTools',
          '@sveltejs/mcp for Claude Desktop integration',
          'Vite for build tooling',
        ],
      },
    };

    // Add SvelteKit-specific context
    if (isSvelteKit) {
      baseContext.stack = {
        ...baseContext.stack,
        backend: 'SvelteKit Server Routes',
        build: 'Vite + SvelteKit',
        api_type: 'REST (SvelteKit endpoints)',
      };
      baseContext.project = {
        architecture: 'SvelteKit Full-Stack',
      };
    }

    return baseContext;
  },
};
