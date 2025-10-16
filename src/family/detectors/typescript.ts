/**
 * TypeScript Integration Detector
 *
 * Detects TypeScript usage and generates TypeScript-optimized .faf context
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const typescriptDetector: IntegrationDetector = {
  name: 'typescript',
  displayName: 'TypeScript',
  tier: 'trophy', // Based on evaluation: TypeScript will score 99+
  qualityScore: 99,
  weeklyAdoption: 40_000_000, // ~40M weekly downloads
  mcpServers: [
    'mcp-proxy',                 // #6: 197k/week - Infrastructure & proxy
    'chrome-devtools-mcp',       // #7: 156k/week - Chrome DevTools debugging
    '@mastra/mcp',               // #8: 130k/week - AI workflows & automation
    'mcp-framework',             // #12: 58k/week - Framework for building MCPs
    '@langchain/mcp-adapters',   // #13: 42k/week - LangChain AI integration
  ],
  contextContribution: ['main_language', 'type_system'],

  detect(projectPath: string): boolean {
    const packageJsonPath = join(projectPath, 'package.json');
    const tsconfigPath = join(projectPath, 'tsconfig.json');

    // Check for tsconfig.json first (strongest signal)
    if (existsSync(tsconfigPath)) {
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

      return 'typescript' in allDeps;
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    const tsconfigPath = join(projectPath, 'tsconfig.json');

    let version = 'unknown';
    let strictMode = false;
    let target = 'unknown';
    let moduleResolution = 'unknown';

    // Get TypeScript version from package.json
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        version = allDeps.typescript || 'latest';
      } catch {
        // Fallback
      }
    }

    // Get compiler options from tsconfig.json
    if (existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
        const compilerOptions = tsconfig.compilerOptions || {};

        strictMode = compilerOptions.strict === true;
        target = compilerOptions.target || 'ES2015';
        moduleResolution = compilerOptions.moduleResolution || 'node';
      } catch {
        // Fallback
      }
    }

    return {
      stack: {
        main_language: `TypeScript ${version}`,
        type_system: strictMode ? 'TypeScript Strict Mode' : 'TypeScript',
        build: 'TypeScript Compiler (tsc)',
      },
      project: {
        typescript_config: {
          strict: strictMode,
          target,
          module_resolution: moduleResolution,
        },
      },
      integration: {
        framework: 'typescript',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          'mcp-proxy - Infrastructure & proxy (197k weekly)',
          'chrome-devtools-mcp - Chrome DevTools debugging (156k weekly)',
          '@mastra/mcp - AI workflows & automation (130k weekly)',
          'mcp-framework - Framework for building MCPs (58k weekly)',
          '@langchain/mcp-adapters - LangChain AI integration (42k weekly)',
          'typescript-language-server for LSP support',
          'ts-node for development',
          'ESLint with @typescript-eslint plugin',
        ],
      },
    };
  },
};
