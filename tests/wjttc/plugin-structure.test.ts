/**
 * WJTTC Test Suite: Claude Code Plugin Structure
 *
 * F1-Inspired Testing: "We break things so others never have to know they were broken"
 *
 * Tests the FAF Claude Code plugin structure for marketplace compatibility.
 *
 * Championship Standards:
 * - Brake Systems (Critical): Plugin must load
 * - Engine Systems (Core): Commands must be discoverable
 * - Aerodynamics (Performance): Skills must be accessible
 */

import * as fs from 'fs';
import * as path from 'path';

const PLUGIN_ROOT = path.resolve(__dirname, '../../');

describe('🏎️ WJTTC Plugin Structure Tests', () => {

  // =========================================================================
  // BRAKE SYSTEMS (Critical) - Plugin Must Load
  // =========================================================================
  describe('🛑 Brake Systems - Critical Plugin Structure', () => {

    test('plugin.json exists in .claude-plugin/', () => {
      const pluginJsonPath = path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
      expect(fs.existsSync(pluginJsonPath)).toBe(true);
    });

    test('plugin.json has required "name" field', () => {
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.name).toBeDefined();
      expect(typeof pluginJson.name).toBe('string');
      expect(pluginJson.name.length).toBeGreaterThan(0);
    });

    test('plugin.json name is kebab-case', () => {
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.name).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    test('commands directory exists at plugin root (NOT inside .claude-plugin)', () => {
      const commandsDir = path.join(PLUGIN_ROOT, 'commands');
      expect(fs.existsSync(commandsDir)).toBe(true);
      expect(fs.statSync(commandsDir).isDirectory()).toBe(true);
    });

    test('skills directory exists at plugin root (NOT inside .claude-plugin)', () => {
      const skillsDir = path.join(PLUGIN_ROOT, 'skills');
      expect(fs.existsSync(skillsDir)).toBe(true);
      expect(fs.statSync(skillsDir).isDirectory()).toBe(true);
    });

    test('NO commands inside .claude-plugin/ (common mistake)', () => {
      const claudePluginDir = path.join(PLUGIN_ROOT, '.claude-plugin');
      const files = fs.readdirSync(claudePluginDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      expect(mdFiles.length).toBe(0);
    });
  });

  // =========================================================================
  // ENGINE SYSTEMS (Core) - Commands Must Be Discoverable
  // =========================================================================
  describe('⚡ Engine Systems - Command Discovery', () => {

    const EXPECTED_COMMANDS = [
      'faf-auto.md',
      'faf-formats.md',
      'faf-init.md',
      'faf-score.md',
      'faf-status.md',
      'faf-sync.md'
    ];

    test('commands directory contains .md files', () => {
      const commandsDir = path.join(PLUGIN_ROOT, 'commands');
      const files = fs.readdirSync(commandsDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      expect(mdFiles.length).toBeGreaterThan(0);
    });

    test.each(EXPECTED_COMMANDS)('command %s exists', (command) => {
      const commandPath = path.join(PLUGIN_ROOT, 'commands', command);
      expect(fs.existsSync(commandPath)).toBe(true);
    });

    test.each(EXPECTED_COMMANDS)('command %s has frontmatter with description', (command) => {
      const content = fs.readFileSync(
        path.join(PLUGIN_ROOT, 'commands', command),
        'utf-8'
      );
      expect(content.startsWith('---')).toBe(true);
      expect(content).toMatch(/description:/);
    });

    test('all commands have valid frontmatter structure', () => {
      const commandsDir = path.join(PLUGIN_ROOT, 'commands');
      const commands = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

      commands.forEach(cmd => {
        const content = fs.readFileSync(path.join(commandsDir, cmd), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        expect(frontmatterMatch).not.toBeNull();
      });
    });
  });

  // =========================================================================
  // AERODYNAMICS (Performance) - Skills Must Be Accessible
  // =========================================================================
  describe('🌀 Aerodynamics - Skill Accessibility', () => {

    test('faf-expert skill directory exists', () => {
      const skillDir = path.join(PLUGIN_ROOT, 'skills', 'faf-expert');
      expect(fs.existsSync(skillDir)).toBe(true);
      expect(fs.statSync(skillDir).isDirectory()).toBe(true);
    });

    test('faf-expert has SKILL.md', () => {
      const skillMd = path.join(PLUGIN_ROOT, 'skills', 'faf-expert', 'SKILL.md');
      expect(fs.existsSync(skillMd)).toBe(true);
    });

    test('SKILL.md has required frontmatter', () => {
      const content = fs.readFileSync(
        path.join(PLUGIN_ROOT, 'skills', 'faf-expert', 'SKILL.md'),
        'utf-8'
      );
      expect(content.startsWith('---')).toBe(true);
      expect(content).toMatch(/name:/);
      expect(content).toMatch(/description:/);
    });

    test('SKILL.md name matches directory name', () => {
      const content = fs.readFileSync(
        path.join(PLUGIN_ROOT, 'skills', 'faf-expert', 'SKILL.md'),
        'utf-8'
      );
      const nameMatch = content.match(/name:\s*(.+)/);
      expect(nameMatch).not.toBeNull();
      expect(nameMatch![1].trim()).toBe('faf-expert');
    });
  });

  // =========================================================================
  // PIT LANE (Metadata) - Plugin Metadata Quality
  // =========================================================================
  describe('🔧 Pit Lane - Metadata Quality', () => {

    test('plugin.json has version', () => {
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.version).toBeDefined();
      expect(pluginJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('plugin.json has description', () => {
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.description).toBeDefined();
      expect(pluginJson.description.length).toBeGreaterThan(10);
    });

    test('plugin.json has repository URL', () => {
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.repository).toBeDefined();
      expect(pluginJson.repository).toMatch(/github\.com/);
    });
  });

  // =========================================================================
  // CHAMPIONSHIP (Integration) - Full Plugin Validation
  // =========================================================================
  describe('🏆 Championship - Full Plugin Validation', () => {

    test('plugin can be loaded without errors', () => {
      // Verify all required files exist and are readable
      const requiredFiles = [
        '.claude-plugin/plugin.json',
        'commands/faf-init.md',
        'commands/faf-score.md',
        'skills/faf-expert/SKILL.md'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(PLUGIN_ROOT, file);
        expect(() => fs.readFileSync(filePath, 'utf-8')).not.toThrow();
      });
    });

    test('no orphaned files in .claude-plugin/', () => {
      const claudePluginDir = path.join(PLUGIN_ROOT, '.claude-plugin');
      const files = fs.readdirSync(claudePluginDir);
      const allowedFiles = ['plugin.json', 'marketplace.json'];

      files.forEach(file => {
        expect(allowedFiles).toContain(file);
      });
    });

    test('IANA registration date is 2025', () => {
      const skillContent = fs.readFileSync(
        path.join(PLUGIN_ROOT, 'skills', 'faf-expert', 'SKILL.md'),
        'utf-8'
      );
      // Should say Oct 2025, not Oct 2024
      expect(skillContent).toMatch(/Oct(ober)?\s*(31,?\s*)?2025/i);
      expect(skillContent).not.toMatch(/Oct(ober)?\s*(31,?\s*)?2024/i);
    });
  });
});
