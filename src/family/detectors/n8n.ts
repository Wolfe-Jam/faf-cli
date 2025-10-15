/**
 * n8n Integration Detector
 *
 * Detects n8n workflow automation usage and generates n8n-optimized .faf context
 *
 * n8n-mcp ecosystem: 87k/week + 314k/week (n8n-nodes-mcp) = 401k total reach
 */

import { IntegrationDetector, FafFile } from '../types.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const n8nDetector: IntegrationDetector = {
  name: 'n8n',
  displayName: 'n8n',
  tier: 'gold', // Based on evaluation: n8n will score 90+
  qualityScore: 92,
  weeklyAdoption: 401_000, // 87k (n8n-mcp) + 314k (n8n-nodes-mcp)
  mcpServers: ['n8n-mcp', 'n8n-nodes-mcp'],
  contextContribution: ['automation_platform', 'workflow_engine', 'integration_layer', 'api_orchestration'],

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

      // Check for n8n core or n8n custom nodes
      return 'n8n' in allDeps ||
             Object.keys(allDeps).some(dep => dep.startsWith('n8n-nodes-'));
    } catch {
      return false;
    }
  },

  generateContext(projectPath: string): Partial<FafFile> {
    const packageJsonPath = join(projectPath, 'package.json');
    let version = 'unknown';
    let customNodes: string[] = [];
    let hasTypeScript = false;

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        version = allDeps.n8n || 'latest';
        hasTypeScript = 'typescript' in allDeps || '@types/node' in allDeps;

        // Detect custom n8n nodes
        customNodes = Object.keys(allDeps).filter(dep => dep.startsWith('n8n-nodes-'));
      } catch {
        // Fallback to defaults
      }
    }

    // Check for n8n configuration
    const hasN8nConfig = existsSync(join(projectPath, '.n8n')) ||
                         existsSync(join(projectPath, 'n8n.config.json'));

    return {
      stack: {
        automation_platform: `n8n ${version}`,
        workflow_engine: 'n8n Workflow Automation',
        integration_layer: customNodes.length > 0 ? 'Custom n8n Nodes' : 'Standard n8n Nodes',
        api_orchestration: 'n8n API',
        backend: 'n8n Server',
        main_language: hasTypeScript ? 'TypeScript' : 'JavaScript',
      },
      project: {
        automation: {
          platform: 'n8n',
          custom_nodes: customNodes.length,
          node_packages: customNodes,
          has_config: hasN8nConfig,
        },
      },
      integration: {
        framework: 'n8n',
        mcp_servers: this.mcpServers,
        recommended_tools: [
          'n8n-mcp for MCP workflow integration (87k weekly)',
          'n8n-nodes-mcp for custom node development (314k weekly)',
          'n8n Desktop for workflow management',
          '@supabase/supabase-js for database integration (used by n8n-mcp)',
          'axios for HTTP requests (used by n8n-mcp)',
        ],
      },
    };
  },
};
