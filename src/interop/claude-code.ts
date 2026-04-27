/**
 * Claude Code Integration
 * Ensures faf-cli is perfectly aligned with Claude Code practices
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

interface ClaudeCodeSkill {
  name: string;
  description: string;
  'argument-hint'?: string;
}

interface ClaudeCodeIntegration {
  version: string;
  skills: ClaudeCodeSkill[];
  preferences: {
    conciseDescriptions: boolean;
    functionalLanguage: boolean;
    minimalEmojis: boolean;
  };
}

export class ClaudeCodeSync {
  private readonly skillsDir = join(homedir(), '.config', 'claude-code', 'skills');
  private readonly fafSkillsDir = join(this.skillsDir, 'faf-commands');
  private readonly claudeSkillsDir = join(homedir(), '.claude', 'skills', 'faf');
  
  /**
   * Sync faf-cli commands with Claude Code skills format
   */
  async syncSkills(): Promise<void> {
    // Sync to both old and new locations for compatibility
    await this.syncToLocation(this.fafSkillsDir);
    await this.syncToClaudeDir();
  }
  
  /**
   * Sync pre-built FAF skills to ~/.claude/skills/faf/
   */
  private async syncToClaudeDir(): Promise<void> {
    // Check if new skills directory exists
    if (!existsSync(this.claudeSkillsDir)) {
      return; // User hasn't created FAF skills yet
    }
    
    // Validate skills.json exists
    const skillsJsonPath = join(this.claudeSkillsDir, 'skills.json');
    if (!existsSync(skillsJsonPath)) {
      return;
    }
    
    // Update skills.json with current faf-cli version
    const skillsJson = JSON.parse(readFileSync(skillsJsonPath, 'utf-8'));
    const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf-8'));
    
    skillsJson.requirements['faf-cli'] = `>=${pkg.version}`;
    skillsJson.lastSync = new Date().toISOString();
    
    writeFileSync(skillsJsonPath, JSON.stringify(skillsJson, null, 2));
  }
  
  /**
   * Original sync method extracted to support multiple locations
   */
  private async syncToLocation(targetDir: string): Promise<void> {
    // Ensure skills directory exists
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    
    // Read all command files 
    const commandsDir = join(dirname(fileURLToPath(import.meta.url)), '../../commands');
    const { readdirSync } = await import('fs');
    
    const commandFiles = readdirSync(commandsDir)
      .filter(f => f.startsWith('faf-') && f.endsWith('.md'));
    
    // Generate Claude Code skill index
    const skillIndex: ClaudeCodeIntegration = {
      version: '1.0.0',
      skills: [],
      preferences: {
        conciseDescriptions: true,
        functionalLanguage: true,
        minimalEmojis: true
      }
    };
    
    for (const file of commandFiles) {
      const content = readFileSync(join(commandsDir, file), 'utf-8');
      const skill = this.parseCommandFile(content, file);
      
      if (skill) {
        skillIndex.skills.push(skill);
        
        // Create individual skill file for Claude Code
        await this.createSkillFileInDir(skill, content, targetDir);
      }
    }
    
    // Write skill index
    writeFileSync(
      join(targetDir, 'index.json'),
      JSON.stringify(skillIndex, null, 2)
    );
  }
  
  /**
   * Parse command markdown file into skill format
   */
  private parseCommandFile(content: string, filename: string): ClaudeCodeSkill | null {
    const lines = content.split('\n');
    let description = '';
    let argumentHint = '';
    
    for (const line of lines) {
      if (line.startsWith('description:')) {
        description = line.replace('description:', '').trim();
      }
      if (line.startsWith('argument-hint:')) {
        argumentHint = line.replace('argument-hint:', '').trim();
      }
    }
    
    if (!description) {return null;}
    
    const name = filename.replace('.md', '');
    
    return {
      name,
      description,
      ...(argumentHint && argumentHint !== 'None' ? { 'argument-hint': argumentHint } : {})
    };
  }
  
  /**
   * Create Claude Code compatible skill file in specified directory
   */
  private async createSkillFileInDir(skill: ClaudeCodeSkill, originalContent: string, baseDir: string): Promise<void> {
    const skillDir = join(baseDir, skill.name);
    
    if (!existsSync(skillDir)) {
      mkdirSync(skillDir, { recursive: true });
    }
    
    // Extract content after frontmatter
    const contentLines = originalContent.split('---');
    const mainContent = contentLines.slice(2).join('---').trim();
    
    // Create SKILL.md in Claude Code format
    const skillContent = `---
name: ${skill.name}
description: ${skill.description}${skill['argument-hint'] ? `\nargument-hint: ${skill['argument-hint']}` : ''}
allowed-tools: Bash, Read, Write, Glob, Grep, Task
---

${mainContent}

## Claude Code Integration Notes

This skill is automatically synced from faf-cli v6 commands.

### V6 Principles:
- Concise, functional descriptions
- No marketing language
- Minimal emoji usage (only 🏆 for 100%)
- Championship-grade execution

### Usage in Claude Code:
\`\`\`
/${skill.name}${skill['argument-hint'] && skill['argument-hint'] !== 'None' ? ` [${  skill['argument-hint']  }]` : ''}
\`\`\`
`;
    
    writeFileSync(join(skillDir, 'SKILL.md'), skillContent);
  }
  
  /**
   * Check if Claude Code integration is properly configured
   */
  async checkIntegration(): Promise<boolean> {
    // Check if skills directory exists
    if (!existsSync(this.fafSkillsDir)) {
      return false;
    }
    
    // Check if index exists
    const indexPath = join(this.fafSkillsDir, 'index.json');
    if (!existsSync(indexPath)) {
      return false;
    }
    
    // Validate index content
    try {
      const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
      return index.version && Array.isArray(index.skills);
    } catch {
      return false;
    }
  }
  
  /**
   * Get Claude Code best practices for faf-cli
   */
  getBestPractices(): string {
    return `
Claude Code Integration Best Practices for faf-cli:

1. **Command Descriptions**
   - Keep under 80 characters
   - Use functional language (what it does, not how amazing it is)
   - No marketing copy or superlatives
   - No performance claims in descriptions

2. **Skill Structure**
   - Each command = one skill
   - Clear argument hints when applicable
   - Tools limited to what's needed
   - Examples should be concise

3. **V6 Edition Alignment**
   - Minimal symbols (only 🏆 for 100% scores)
   - Clean output formatting
   - No "championship" language in UI
   - Professional, functional tone

4. **Integration Points**
   - Skills auto-discovered from ~/.config/claude-code/skills/
   - faf-cli commands appear as slash commands
   - Descriptions must be scannable in autocomplete
   - No duplicate commands

5. **Maintenance**
   - Run 'faf claude-sync' after command updates
   - Version descriptions properly
   - Test in Claude Code after changes
   - Keep skills directory clean
`;
  }
}