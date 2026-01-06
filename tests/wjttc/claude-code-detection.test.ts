/**
 * WJTTC Test Suite: Claude Code Detection
 *
 * F1-Inspired Testing: "We break things so others never have to know they were broken"
 *
 * Tests the detectClaudeCode() function for Boris-grade Claude Code structure detection.
 * Next tester: Boris Cherny (Creator of Claude Code at Anthropic)
 *
 * Championship Standards:
 * - Brake Systems (Critical): Core detection must work
 * - Engine Systems (Core): All structures must be detected
 * - Aerodynamics (Performance): Detection must be fast
 * - Telemetry (Edge Cases): Handle malformed/missing data
 *
 * What we detect (from Boris's workflow):
 * - .claude/agents/*.md → subagents
 * - .claude/commands/*.md → commands
 * - .claude/settings.json → permissions
 * - CLAUDE.md → hasClaudeMd
 * - .mcp.json → mcpServers
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectClaudeCode, ClaudeCodeResult } from '../../src/framework-detector';

// Test fixtures directory
const TEST_FIXTURES_DIR = path.join(os.tmpdir(), 'faf-claude-code-tests');

// Helper to create test project structure
async function createTestProject(structure: {
  claudeMd?: boolean;
  agents?: string[];
  commands?: string[];
  settings?: object;
  mcpJson?: object;
}): Promise<string> {
  const projectDir = path.join(TEST_FIXTURES_DIR, `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });

  // Create CLAUDE.md
  if (structure.claudeMd) {
    fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), '# Project Context\n');
  }

  // Create .claude/agents/
  if (structure.agents && structure.agents.length > 0) {
    const agentsDir = path.join(projectDir, '.claude', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    for (const agent of structure.agents) {
      fs.writeFileSync(path.join(agentsDir, `${agent}.md`), `# ${agent}\n`);
    }
  }

  // Create .claude/commands/
  if (structure.commands && structure.commands.length > 0) {
    const commandsDir = path.join(projectDir, '.claude', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    for (const cmd of structure.commands) {
      fs.writeFileSync(path.join(commandsDir, `${cmd}.md`), `# ${cmd}\n`);
    }
  }

  // Create .claude/settings.json
  if (structure.settings) {
    const claudeDir = path.join(projectDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify(structure.settings, null, 2)
    );
  }

  // Create .mcp.json
  if (structure.mcpJson) {
    fs.writeFileSync(
      path.join(projectDir, '.mcp.json'),
      JSON.stringify(structure.mcpJson, null, 2)
    );
  }

  return projectDir;
}

// Cleanup helper
function cleanupTestProject(projectDir: string) {
  try {
    fs.rmSync(projectDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('🏎️ WJTTC Claude Code Detection Tests', () => {

  // Setup: Create fixtures directory
  beforeAll(() => {
    fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
  });

  // Cleanup: Remove fixtures directory
  afterAll(() => {
    try {
      fs.rmSync(TEST_FIXTURES_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // =========================================================================
  // BRAKE SYSTEMS (Critical) - Core Detection Must Work
  // =========================================================================
  describe('🛑 Brake Systems - Critical Detection', () => {

    test('detectClaudeCode returns valid result structure', async () => {
      const projectDir = await createTestProject({});
      try {
        const result = await detectClaudeCode(projectDir);

        expect(result).toBeDefined();
        expect(typeof result.detected).toBe('boolean');
        expect(Array.isArray(result.subagents)).toBe(true);
        expect(Array.isArray(result.commands)).toBe(true);
        expect(Array.isArray(result.permissions)).toBe(true);
        expect(Array.isArray(result.mcpServers)).toBe(true);
        expect(typeof result.hasClaudeMd).toBe('boolean');
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('empty project returns detected: false', async () => {
      const projectDir = await createTestProject({});
      try {
        const result = await detectClaudeCode(projectDir);

        expect(result.detected).toBe(false);
        expect(result.subagents).toEqual([]);
        expect(result.commands).toEqual([]);
        expect(result.permissions).toEqual([]);
        expect(result.mcpServers).toEqual([]);
        expect(result.hasClaudeMd).toBe(false);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('non-existent directory does not throw', async () => {
      const result = await detectClaudeCode('/non/existent/path/12345');

      expect(result.detected).toBe(false);
    });

  });

  // =========================================================================
  // ENGINE SYSTEMS (Core) - All Structures Must Be Detected
  // =========================================================================
  describe('🔧 Engine Systems - Structure Detection', () => {

    // ----- CLAUDE.md Detection -----
    describe('CLAUDE.md Detection', () => {

      test('detects CLAUDE.md when present', async () => {
        const projectDir = await createTestProject({ claudeMd: true });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.hasClaudeMd).toBe(true);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('hasClaudeMd is false when CLAUDE.md missing', async () => {
        const projectDir = await createTestProject({ agents: ['test'] });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.hasClaudeMd).toBe(false);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

    });

    // ----- Subagents Detection -----
    describe('.claude/agents/ Detection', () => {

      test('detects single subagent', async () => {
        const projectDir = await createTestProject({ agents: ['code-reviewer'] });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.subagents).toEqual(['code-reviewer']);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('detects multiple subagents', async () => {
        const projectDir = await createTestProject({
          agents: ['code-reviewer', 'test-runner', 'doc-writer', 'bug-fixer']
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.subagents).toHaveLength(4);
          expect(result.subagents).toContain('code-reviewer');
          expect(result.subagents).toContain('test-runner');
          expect(result.subagents).toContain('doc-writer');
          expect(result.subagents).toContain('bug-fixer');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('strips .md extension from agent names', async () => {
        const projectDir = await createTestProject({ agents: ['verify-app'] });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.subagents).toEqual(['verify-app']);
          expect(result.subagents).not.toContain('verify-app.md');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('empty agents directory returns empty array', async () => {
        const projectDir = await createTestProject({});
        const agentsDir = path.join(projectDir, '.claude', 'agents');
        fs.mkdirSync(agentsDir, { recursive: true });

        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.subagents).toEqual([]);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

    });

    // ----- Commands Detection -----
    describe('.claude/commands/ Detection', () => {

      test('detects single command', async () => {
        const projectDir = await createTestProject({ commands: ['commit-push-pr'] });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.commands).toEqual(['commit-push-pr']);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('detects multiple commands', async () => {
        const projectDir = await createTestProject({
          commands: ['commit-push-pr', 'run-tests', 'deploy', 'lint-fix']
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.commands).toHaveLength(4);
          expect(result.commands).toContain('commit-push-pr');
          expect(result.commands).toContain('run-tests');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('strips .md extension from command names', async () => {
        const projectDir = await createTestProject({ commands: ['score'] });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.commands).toEqual(['score']);
          expect(result.commands).not.toContain('score.md');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

    });

    // ----- Permissions Detection -----
    describe('.claude/settings.json Permissions Detection', () => {

      test('detects permissions from settings.json', async () => {
        const projectDir = await createTestProject({
          settings: {
            permissions: {
              allow: ['Bash(npm run)', 'Read(**/*)', 'Write(src/**)']
            }
          }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.permissions).toHaveLength(3);
          expect(result.permissions).toContain('Bash');
          expect(result.permissions).toContain('Read');
          expect(result.permissions).toContain('Write');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('extracts tool name before parentheses', async () => {
        const projectDir = await createTestProject({
          settings: {
            permissions: {
              allow: ['Bash(git commit)', 'WebFetch(domain:github.com)']
            }
          }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.permissions).toContain('Bash');
          expect(result.permissions).toContain('WebFetch');
          expect(result.permissions).not.toContain('Bash(git commit)');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('limits permissions to 10 entries', async () => {
        const projectDir = await createTestProject({
          settings: {
            permissions: {
              allow: Array(15).fill(0).map((_, i) => `Tool${i}(arg)`)
            }
          }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.permissions.length).toBeLessThanOrEqual(10);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('handles missing permissions.allow gracefully', async () => {
        const projectDir = await createTestProject({
          settings: { someOtherField: 'value' }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.permissions).toEqual([]);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

    });

    // ----- MCP Servers Detection -----
    describe('.mcp.json Detection', () => {

      test('detects MCP servers from .mcp.json', async () => {
        const projectDir = await createTestProject({
          mcpJson: {
            mcpServers: {
              github: { command: 'npx', args: ['-y', '@mcp/github'] },
              slack: { command: 'node', args: ['slack-mcp.js'] }
            }
          }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.detected).toBe(true);
          expect(result.mcpServers).toHaveLength(2);
          expect(result.mcpServers).toContain('github');
          expect(result.mcpServers).toContain('slack');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('detects Boris-style MCP setup (slack, bigquery, sentry)', async () => {
        const projectDir = await createTestProject({
          mcpJson: {
            mcpServers: {
              slack: { command: 'npx', args: ['-y', '@mcp/slack'] },
              bigquery: { command: 'npx', args: ['-y', '@mcp/bigquery'] },
              sentry: { command: 'npx', args: ['-y', '@mcp/sentry'] }
            }
          }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.mcpServers).toContain('slack');
          expect(result.mcpServers).toContain('bigquery');
          expect(result.mcpServers).toContain('sentry');
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('limits mcpServers to 10 entries', async () => {
        const mcpServers: Record<string, object> = {};
        for (let i = 0; i < 15; i++) {
          mcpServers[`server${i}`] = { command: 'test' };
        }

        const projectDir = await createTestProject({
          mcpJson: { mcpServers }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.mcpServers.length).toBeLessThanOrEqual(10);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

      test('handles missing mcpServers key gracefully', async () => {
        const projectDir = await createTestProject({
          mcpJson: { someOtherField: 'value' }
        });
        try {
          const result = await detectClaudeCode(projectDir);

          expect(result.mcpServers).toEqual([]);
        } finally {
          cleanupTestProject(projectDir);
        }
      });

    });

  });

  // =========================================================================
  // AERODYNAMICS (Performance) - Detection Must Be Fast
  // =========================================================================
  describe('⚡ Aerodynamics - Performance', () => {

    test('detection completes in under 100ms', async () => {
      const projectDir = await createTestProject({
        claudeMd: true,
        agents: ['a1', 'a2', 'a3'],
        commands: ['c1', 'c2'],
        settings: { permissions: { allow: ['Bash(test)'] } },
        mcpJson: { mcpServers: { github: {} } }
      });

      try {
        const start = Date.now();
        await detectClaudeCode(projectDir);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(100);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('detection on empty project is fast (<50ms)', async () => {
      const projectDir = await createTestProject({});

      try {
        const start = Date.now();
        await detectClaudeCode(projectDir);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(50);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

  });

  // =========================================================================
  // TELEMETRY (Edge Cases) - Handle Malformed/Missing Data
  // =========================================================================
  describe('📊 Telemetry - Edge Cases', () => {

    test('handles malformed settings.json gracefully', async () => {
      const projectDir = await createTestProject({});
      const claudeDir = path.join(projectDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'settings.json'), 'not valid json{{{');

      try {
        const result = await detectClaudeCode(projectDir);

        // Should not throw, should return empty permissions
        expect(result.permissions).toEqual([]);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('handles malformed .mcp.json gracefully', async () => {
      const projectDir = await createTestProject({});
      fs.writeFileSync(path.join(projectDir, '.mcp.json'), 'invalid json content');

      try {
        const result = await detectClaudeCode(projectDir);

        // Should not throw, should return empty mcpServers
        expect(result.mcpServers).toEqual([]);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('ignores non-.md files in agents directory', async () => {
      const projectDir = await createTestProject({ agents: ['valid-agent'] });
      const agentsDir = path.join(projectDir, '.claude', 'agents');
      fs.writeFileSync(path.join(agentsDir, 'README.txt'), 'not an agent');
      fs.writeFileSync(path.join(agentsDir, '.DS_Store'), '');

      try {
        const result = await detectClaudeCode(projectDir);

        expect(result.subagents).toEqual(['valid-agent']);
        expect(result.subagents).not.toContain('README');
        expect(result.subagents).not.toContain('.DS_Store');
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('ignores non-.md files in commands directory', async () => {
      const projectDir = await createTestProject({ commands: ['valid-cmd'] });
      const commandsDir = path.join(projectDir, '.claude', 'commands');
      fs.writeFileSync(path.join(commandsDir, 'script.sh'), '#!/bin/bash');

      try {
        const result = await detectClaudeCode(projectDir);

        expect(result.commands).toEqual(['valid-cmd']);
        expect(result.commands).not.toContain('script');
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('full Boris setup detection', async () => {
      // Simulate Boris's complete Claude Code setup
      const projectDir = await createTestProject({
        claudeMd: true,
        agents: ['code-simplifier', 'verify-app', 'test-runner'],
        commands: ['commit-push-pr', 'run-tests', 'deploy-staging'],
        settings: {
          permissions: {
            allow: [
              'Bash(npm run)',
              'Bash(git commit)',
              'Read(**/*)',
              'Write(src/**)',
              'WebFetch(domain:github.com)'
            ]
          }
        },
        mcpJson: {
          mcpServers: {
            slack: { command: 'npx', args: ['-y', '@mcp/slack'] },
            bigquery: { command: 'npx', args: ['-y', '@mcp/bigquery'] },
            sentry: { command: 'npx', args: ['-y', '@mcp/sentry'] },
            github: { command: 'npx', args: ['-y', '@mcp/github'] }
          }
        }
      });

      try {
        const result = await detectClaudeCode(projectDir);

        // Everything should be detected
        expect(result.detected).toBe(true);
        expect(result.hasClaudeMd).toBe(true);

        // Subagents
        expect(result.subagents).toHaveLength(3);
        expect(result.subagents).toContain('code-simplifier');
        expect(result.subagents).toContain('verify-app');

        // Commands
        expect(result.commands).toHaveLength(3);
        expect(result.commands).toContain('commit-push-pr');

        // Permissions
        expect(result.permissions.length).toBeGreaterThan(0);
        expect(result.permissions).toContain('Bash');
        expect(result.permissions).toContain('Read');
        expect(result.permissions).toContain('Write');

        // MCP Servers
        expect(result.mcpServers).toHaveLength(4);
        expect(result.mcpServers).toContain('slack');
        expect(result.mcpServers).toContain('bigquery');
        expect(result.mcpServers).toContain('sentry');
        expect(result.mcpServers).toContain('github');
      } finally {
        cleanupTestProject(projectDir);
      }
    });

  });

  // =========================================================================
  // CHAMPIONSHIP VALIDATION - Boris-Ready
  // =========================================================================
  describe('🏆 Championship Validation - Boris Ready', () => {

    test('detection result is JSON-serializable', async () => {
      const projectDir = await createTestProject({
        claudeMd: true,
        agents: ['test'],
        mcpJson: { mcpServers: { github: {} } }
      });

      try {
        const result = await detectClaudeCode(projectDir);

        // Should not throw
        const json = JSON.stringify(result);
        const parsed = JSON.parse(json);

        expect(parsed.detected).toBe(result.detected);
        expect(parsed.subagents).toEqual(result.subagents);
      } finally {
        cleanupTestProject(projectDir);
      }
    });

    test('all arrays are string arrays (YAML-safe)', async () => {
      const projectDir = await createTestProject({
        agents: ['agent1'],
        commands: ['cmd1'],
        settings: { permissions: { allow: ['Bash(test)'] } },
        mcpJson: { mcpServers: { server1: {} } }
      });

      try {
        const result = await detectClaudeCode(projectDir);

        result.subagents.forEach(s => expect(typeof s).toBe('string'));
        result.commands.forEach(c => expect(typeof c).toBe('string'));
        result.permissions.forEach(p => expect(typeof p).toBe('string'));
        result.mcpServers.forEach(m => expect(typeof m).toBe('string'));
      } finally {
        cleanupTestProject(projectDir);
      }
    });

  });

});
