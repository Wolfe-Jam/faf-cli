import { Command } from 'commander';
import { ClaudeCodeSync } from '../interop/claude-code.js';
import { fafCyan, bold, dim } from '../ui/colors.js';

export function claudeSyncCommand() {
  return new Command('claude-sync')
    .description('Sync faf commands with Claude Code integration')
    .option('--check', 'Check integration status only')
    .option('--best-practices', 'Show Claude Code integration best practices')
    .action(async (options) => {
      const sync = new ClaudeCodeSync();
      
      if (options.bestPractices) {
        console.log(sync.getBestPractices());
        return;
      }
      
      if (options.check) {
        const isIntegrated = await sync.checkIntegration();
        if (isIntegrated) {
          console.log(`${fafCyan('✓')} Claude Code integration is properly configured`);
        } else {
          console.log(`${fafCyan('◆')} Claude Code integration needs setup`);
          console.log(`  Run ${bold('faf claude-sync')} to configure`);
        }
        return;
      }
      
      console.log(`${fafCyan('◆')} Syncing with Claude Code...`);
      
      try {
        await sync.syncSkills();
        console.log(`${fafCyan('✓')} Skills synced to ~/.config/claude-code/skills/faf-commands/`);
        console.log(dim('  Restart Claude Code to see updated slash commands'));
      } catch (error) {
        console.error('Failed to sync:', error);
        process.exit(1);
      }
    });
}