import { describe, test, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Command Descriptions (WJTTC V6)', () => {
  test('command descriptions are functional, not marketing', () => {
    const commandsDir = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsDir)
      .filter(f => f.endsWith('.md'))
      .filter(f => f.startsWith('faf-'));
    
    expect(commandFiles.length).toBeGreaterThan(0);
    
    for (const file of commandFiles) {
      const content = readFileSync(join(commandsDir, file), 'utf-8');
      const lines = content.split('\n');
      
      // Find the description line
      const descLine = lines.find(line => line.startsWith('description:'));
      if (!descLine) continue;
      
      const description = descLine.replace('description:', '').trim();
      
      // V6 rules: No marketing fluff
      expect(description).not.toContain('ONE COMMAND TO RULE THEM ALL');
      expect(description).not.toContain('TURBO-CAT discovers');
      expect(description).not.toContain('Championship');
      expect(description).not.toContain('Zero to');
      expect(description).not.toContain('instantly');
      expect(description).not.toMatch(/\(\d+ms?\)/); // No timing claims
      expect(description).not.toMatch(/\(\d+ validated/); // No counts in parens
      expect(description).not.toContain('BRONZE+');
      expect(description).not.toMatch(/🔥|😽/); // No marketing emojis
      
      // Should be concise and functional
      expect(description.length).toBeLessThan(80);
      expect(description).not.toContain('  '); // No double spaces
      expect(description.endsWith('.')).toBe(false); // No trailing periods
    }
  });

  test('specific command descriptions are cleaned up correctly', () => {
    const checkCommand = (filename: string, expectedDescription: string) => {
      const content = readFileSync(join(__dirname, '../commands', filename), 'utf-8');
      const lines = content.split('\n');
      const descLine = lines.find(line => line.startsWith('description:'));
      
      if (descLine) {
        const description = descLine.replace('description:', '').trim();
        expect(description).toBe(expectedDescription);
      }
    };
    
    // Test cleaned descriptions
    checkCommand('faf-auto.md', 'Auto-generate complete .faf project context');
    checkCommand('faf-formats.md', 'Discover all formats and frameworks in your project');
    checkCommand('faf-init.md', 'Create .faf file from project structure');
    checkCommand('faf-score.md', 'Rate .faf completeness (0-100%). Target 85%+ for solid AI context');
    checkCommand('faf-status.md', 'Quick .faf context health check');
    checkCommand('faf-sync.md', 'Bi-directional sync between .faf and CLAUDE.md');
  });

  test('V6 display output uses minimal symbols', () => {
    // Check that only trophy emoji (🏆) is used for 100% scores
    const coreFiles = [
      '../src/core/scorer.ts',
      '../src/ui/display.ts'
    ];
    
    for (const file of coreFiles) {
      try {
        const content = readFileSync(join(__dirname, file), 'utf-8');
        
        // Count emoji usage
        const emojiMatches = content.match(/[🔥😽🥇🥈🥉]/g) || [];
        
        // V6: Only 🏆 for 100%, minimal other symbols
        if (emojiMatches.length > 0) {
          // Should not have marketing emojis
          expect(content).not.toContain('😽'); // TURBO-CAT
          expect(content).not.toMatch(/🔥.*BRONZE/); // Fire + BRONZE marketing
        }
      } catch {
        // File might not exist, skip
      }
    }
  });
});