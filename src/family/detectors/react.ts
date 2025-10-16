/**
 * React Integration Detector
 *
 * Detects React usage and generates React-optimized .faf context
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const reactDetector: IntegrationDetector = {
  name: 'react',
  displayName: 'React',
  tier: 'trophy', // Based on evaluation: React will score 99+
  qualityScore: 99,
  weeklyAdoption: 20_000_000, // ~20M weekly downloads
  mcpServers: [
    '@playwright/mcp',           // #2: 625k/week - Browser automation & testing
    '@expo/mcp-tunnel',          // #3: 543k/week - React Native & Expo mobile development
    'chrome-devtools-mcp',       // #7: 156k/week - Chrome DevTools debugging
    '@mastra/mcp',               // #8: 130k/week - AI workflows & automation
    '@langchain/mcp-adapters',   // #13: 42k/week - LangChain AI integration
    '@mzxrai/mcp-webresearch',   // #14: 36k/week - Web research tools
  ],
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

      return 'react' in allDeps || 'react-dom' in allDeps;
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    let version = 'unknown';
    let hasTypeScript = false;

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        version = allDeps.react || 'latest';
        hasTypeScript = 'typescript' in allDeps || '@types/react' in allDeps;
      } catch {
        // Fallback to defaults
      }
    }

    return {
      stack: {
        frontend: `React ${version}`,
        ui_library: 'React Components',
        state_management: 'React Hooks',
        main_language: hasTypeScript ? 'TypeScript' : 'JavaScript',
      },
      integration: {
        framework: 'react',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          '@playwright/mcp - Browser automation & testing (625k weekly)',
          '@expo/mcp-tunnel - React Native & Expo mobile (543k weekly)',
          'chrome-devtools-mcp - Chrome DevTools debugging (156k weekly)',
          '@mastra/mcp - AI workflows & automation (130k weekly)',
          '@langchain/mcp-adapters - LangChain AI integration (42k weekly)',
          '@mzxrai/mcp-webresearch - Web research tools (36k weekly)',
          'React Developer Tools (browser extension)',
          'ESLint with react plugin',
        ],
      },
    };
  },
};
