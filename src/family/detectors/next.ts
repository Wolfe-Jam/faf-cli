/**
 * Next.js Integration Detector
 *
 * Detects Next.js usage and generates Next.js-optimized .faf context
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const nextDetector: IntegrationDetector = {
  name: 'next',
  displayName: 'Next.js',
  tier: 'trophy', // Based on evaluation: Next will score 99+
  qualityScore: 99,
  weeklyAdoption: 5_000_000, // ~5M weekly downloads
  mcpServers: ['@vercel/mcp-server', '@nextjs/mcp-tools'],
  contextContribution: ['frontend', 'backend', 'runtime', 'hosting', 'api_type'],

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

      return 'next' in allDeps;
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    let version = 'unknown';
    let hasAppRouter = false;
    let hasTypeScript = false;

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        version = allDeps.next || 'latest';
        hasTypeScript = 'typescript' in allDeps || '@types/node' in allDeps;

        // Check if using App Router (Next 13+)
        const versionNum = parseFloat(version.replace(/[^\d.]/g, ''));
        hasAppRouter = versionNum >= 13;
      } catch {
        // Fallback to defaults
      }
    }

    // Check for app directory
    const appDirExists = existsSync(join(projectPath, 'app'));

    return {
      stack: {
        frontend: `Next.js ${version}`,
        backend: 'Next.js API Routes',
        runtime: 'Node.js (Vercel Edge Runtime compatible)',
        build: 'Next.js Compiler (Turbopack/Webpack)',
        api_type: 'REST/GraphQL',
        hosting: 'Vercel (optimized)',
        main_language: hasTypeScript ? 'TypeScript' : 'JavaScript',
      },
      project: {
        architecture: appDirExists || hasAppRouter ? 'App Router' : 'Pages Router',
      },
      integration: {
        framework: 'next',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          '@vercel/mcp-server for deployment and analytics',
          'Next.js DevTools',
          'Vercel CLI for local development',
          'React Developer Tools',
        ],
      },
    };
  },
};
