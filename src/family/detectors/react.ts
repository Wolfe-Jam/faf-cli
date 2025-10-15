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
  mcpServers: ['@react-mcp/server', 'react-mcp-tools'],
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
          'React Developer Tools (browser extension)',
          '@react-mcp/server for Claude Desktop integration',
          'ESLint with react plugin',
        ],
      },
    };
  },
};
