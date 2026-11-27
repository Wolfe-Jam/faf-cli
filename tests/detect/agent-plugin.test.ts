/**
 * WJTTC — #262: an Agent Plugins package is the `agent-plugin` app-type.
 *
 * A `plugin.json` or `mcp.json` with the agent-plugins.org `$schema`, at the
 * root or in `plugins/<name>/`, and no code signal: 11 slots (the 9 of
 * documentation, plus the format it ships and where it ships). No build,
 * runtime or CI: there is nothing to build, so it can reach 100%.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { tempDirs } from '../helpers/temp-dirs.js';
import { detectProjectTypeWithRationale } from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { SLOTS, appTypeUsesSlot } from '../../src/core/slots.js';

const temp = tempDirs();
afterAll(() => temp.removeAll());

function repo(files: Record<string, string>): string {
  const dir = realpathSync(temp.mkdtemp(join(tmpdir(), 'faf-agent-plugin-')));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

const PLUGIN = JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', name: 'faf', version: '0.1.0' });
const MCP = JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: { faf: { type: 'stdio', command: 'npx', args: ['-y', 'faf-mcp'] } } });

describe('BRAKE: Agent Plugins manifests make an agent-plugin (#262)', () => {
  test('context-plugin\'s shape: plugins/faf/plugin.json + mcp.json', () => {
    const dir = repo({ 'README.md': '# FAF plugin\n', 'plugins/faf/plugin.json': PLUGIN, 'plugins/faf/mcp.json': MCP });
    const { type, found } = detectProjectTypeWithRationale(dir);
    expect(type).toBe('agent-plugin');
    expect(found).toContain('Agent Plugins plugins/faf/plugin.json, plugins/faf/mcp.json');
    const stack = (detectStack(dir) as { stack: Record<string, string> }).stack;
    expect(stack.frontend).toBe('Agent Plugins');
    expect(stack.build).toBe('slotignored');
    expect(stack.cicd).toBe('slotignored');
    expect(stack.runtime).toBe('slotignored');
  });

  test('a root plugin.json alone counts', () => {
    expect(detectProjectTypeWithRationale(repo({ 'plugin.json': PLUGIN })).type).toBe('agent-plugin');
  });

  test('a plugin.json or mcp.json without the agent-plugins.org $schema does not', () => {
    const dir = repo({ 'plugin.json': JSON.stringify({ name: 'x' }), 'mcp.json': JSON.stringify({ mcpServers: {} }), 'plugins/a/plugin.json': '{not json' });
    expect(detectProjectTypeWithRationale(dir).type).not.toBe('agent-plugin');
  });

  test('a code signal wins: a package with a bin that also ships a plugin stays a cli', () => {
    const dir = repo({ 'package.json': JSON.stringify({ name: 'tool', bin: { tool: 'cli.js' } }), 'plugins/tool/plugin.json': PLUGIN });
    expect(detectProjectTypeWithRationale(dir).type).toBe('cli');
  });

  test('a plugins folder linked out of the project is not read', () => {
    const outside = repo({ 'faf/plugin.json': PLUGIN });
    const dir = repo({ 'README.md': '# x\n' });
    symlinkSync(outside, join(dir, 'plugins'));
    expect(detectProjectTypeWithRationale(dir).type).not.toBe('agent-plugin');
  });
});

describe('ENGINE: the agent-plugin slots', () => {
  test('11 slots: project, human, framework and hosting; no build, runtime or CI', () => {
    const used = SLOTS.filter(s => appTypeUsesSlot('agent-plugin', s)).map(s => s.path);
    expect(used.length).toBe(11);
    expect(used).toContain('stack.frontend');
    expect(used).toContain('stack.hosting');
    for (const p of ['stack.build', 'stack.runtime', 'stack.cicd']) {expect(used).not.toContain(p);}
  });

  test('a language manifest means code: a Python or TypeScript project that ships a manifest keeps its own type', () => {
    expect(detectProjectTypeWithRationale(repo({ 'pyproject.toml': '[project]\nname = "p"\n', 'plugins/p/plugin.json': PLUGIN })).type).not.toBe('agent-plugin');
    expect(detectProjectTypeWithRationale(repo({ 'tsconfig.json': '{}', 'plugin.json': PLUGIN })).type).not.toBe('agent-plugin');
  });

  test('a plugin that also carries a SKILL.md: the format is Agent Plugins, as the type says', () => {
    const dir = repo({ 'plugins/faf/plugin.json': PLUGIN, 'skills/x/SKILL.md': '---\nname: x\ndescription: Does x. Use when testing.\n---\n' });
    const data = detectStack(dir) as { project: { type: string }; stack: Record<string, string> };
    if (data.project.type === 'agent-plugin') {expect(data.stack.frontend).toBe('Agent Plugins');}
  });
});
