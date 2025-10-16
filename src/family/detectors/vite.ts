/**
 * Vite Integration Detector
 *
 * Detects Vite usage and generates Vite-optimized .faf context
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const viteDetector: IntegrationDetector = {
  name: 'vite',
  displayName: 'Vite',
  tier: 'gold', // Based on evaluation: Vite will score 95+
  qualityScore: 97,
  weeklyAdoption: 9_000_000, // ~9M weekly downloads
  mcpServers: [
    '@playwright/mcp',           // #2: 625k/week - Browser automation & testing
    'mcp-proxy',                 // #6: 197k/week - Infrastructure & proxy
    'chrome-devtools-mcp',       // #7: 156k/week - Chrome DevTools debugging
    '@mastra/mcp',               // #8: 130k/week - AI workflows & automation
  ],
  contextContribution: ['build', 'package_manager'],

  detect(projectPath: string): boolean {
    const packageJsonPath = join(projectPath, 'package.json');
    const viteConfigExists =
      existsSync(join(projectPath, 'vite.config.js')) ||
      existsSync(join(projectPath, 'vite.config.ts'));

    // vite.config.* is strongest signal
    if (viteConfigExists) {
      return true;
    }

    // Check package.json dependencies
    if (!existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      return 'vite' in allDeps;
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    let version = 'unknown';
    let plugins: string[] = [];

    // Get Vite version and plugins from package.json
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        version = allDeps.vite || 'latest';

        // Detect common Vite plugins
        const vitePlugins = Object.keys(allDeps).filter((dep) =>
          dep.startsWith('@vitejs/plugin-') || dep.startsWith('vite-plugin-')
        );
        plugins = vitePlugins.map((plugin) => plugin.replace('@vitejs/plugin-', '').replace('vite-plugin-', ''));
      } catch {
        // Fallback
      }
    }

    return {
      stack: {
        build: `Vite ${version}`,
        package_manager: 'npm/pnpm/yarn (Vite compatible)',
      },
      project: {
        build_config: {
          tool: 'vite',
          plugins: plugins.length > 0 ? plugins : ['none detected'],
          hmr: 'enabled',
          optimization: 'production builds',
        },
      },
      integration: {
        framework: 'vite',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          '@playwright/mcp - Browser automation & testing (625k weekly)',
          'mcp-proxy - Infrastructure & proxy (197k weekly)',
          'chrome-devtools-mcp - Chrome DevTools debugging (156k weekly)',
          '@mastra/mcp - AI workflows & automation (130k weekly)',
          'Vite DevTools (browser extension)',
          '@vitejs/plugin-react or @vitejs/plugin-vue for framework support',
        ],
      },
    };
  },
};
