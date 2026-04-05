import { fafCyan, bold, dim } from '../ui/colors.js';
import { existsSync, cpSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export async function skillsInstallCommand(): Promise<void> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  let sourceSkillsDir: string;
  
  // Try multiple paths for skills directory
  const possiblePaths = [
    join(currentDir, '../../../skills/faf'),  // Development
    join(currentDir, '../../skills/faf'),     // Distribution root
    join(currentDir, '../skills/faf'),       // Adjacent to dist
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      sourceSkillsDir = path;
      break;
    }
  }
  
  if (!sourceSkillsDir) {
    console.log(`${dim('  Skills package not found in distribution')}`);
    console.log(`${dim('  Checked:')} ${possiblePaths.join(', ')}`);
    console.log(`${dim('  Run')} ${bold('faf claude-sync')} ${dim('to generate skills from commands')}`);
    return;
  }
  
  const targetSkillsDir = join(homedir(), '.claude', 'skills', 'faf');
  
  console.log(`${fafCyan('◆')} Installing FAF skills for Claude Code...`);
  
  
  // Check if target directory already exists
  if (existsSync(targetSkillsDir)) {
    console.log(`${fafCyan('!')} FAF skills already installed at ${dim(targetSkillsDir)}`);
    console.log(`  To reinstall, first remove the existing directory`);
    return;
  }
  
  try {
    // Copy skills directory
    cpSync(sourceSkillsDir, targetSkillsDir, { recursive: true });
    
    console.log(`${fafCyan('✓')} Installed FAF skills to ~/.claude/skills/faf/`);
    console.log('');
    console.log('Available skills:');
    console.log(`  ${bold('/faf-champion')}      - Achieve 100% AI-readiness score`);
    console.log(`  ${bold('/faf-quickstart')}    - Initialize FAF context in seconds`);
    console.log(`  ${bold('/faf-sync-master')}   - Keep .faf and CLAUDE.md in sync`);
    console.log('');
    console.log(dim('  Restart Claude Code to see the new skills'));
  } catch (error) {
    console.error('Failed to install skills:', error);
    process.exit(1);
  }
}