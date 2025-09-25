/**
 * Smart FAF Command Logic
 * Contextually aware command that adapts based on project state
 *
 * Flow:
 * 1. No .faf → auto (create)
 * 2. Score < 99 → enhance (boost)
 * 3. Still < 99 → chat (interactive)
 * 4. Score 99-100 → bi-sync (maintain)
 * 5. Already perfect → status/commit
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface FafState {
  exists: boolean;
  score: number;
  lastEnhanced: boolean;
  lastChatted: boolean;
  synced: boolean;
  locked: boolean;
}

class SmartFaf {
  private stateFile = '.faf-state.json';
  private fafFile = '.faf';

  /**
   * Main entry point - smart contextual command
   */
  async execute(): Promise<void> {
    // CRITICAL: Check if we're in home or root directory
    const currentDir = process.cwd();
    const homeDir = require('os').homedir();

    if (currentDir === homeDir || currentDir === '/') {
      console.log('\n⚠️  For speed and safety, we do not work on ROOT directories.');
      console.log('Please provide or cd my-project\n');
      return;
    }

    const state = this.getState();

    console.log('🏎️ FAF Smart Mode Engaged...\n');

    // Decision tree based on current state
    if (!state.exists) {
      this.runCommand('auto', 'Creating your .faf file...');
      return;
    }

    // Check current score
    if (state.score >= 99) {
      if (!state.synced) {
        this.runCommand('bi-sync', '🏆 Perfect score! Syncing with CLAUDE.md...');
        this.updateState({ synced: true });

        // After bi-sync, suggest commit
        console.log('\n🏆 You\'re at 99%+ with perfect sync!');
        console.log('→ Run: faf commit');
        console.log('   Lock in this excellence forever\n');
        return;
      } else if (!state.locked) {
        // They've synced but haven't committed - remind them
        this.suggestCommit(state);
        return;
      } else {
        this.showStatus(state);
      }
      return;
    }

    // Score < 99 - Progressive enhancement
    if (!state.lastEnhanced) {
      this.runCommand('enhance', `📈 Boosting from ${state.score}%...`);
      this.updateState({ lastEnhanced: true });

      // Re-check score after enhance
      const newScore = this.getCurrentScore();
      if (newScore >= 99) {
        console.log(`\n🎯 Achieved ${newScore}%! You're done!`);
        this.updateState({ score: newScore });
      } else {
        console.log(`\n📊 Now at ${newScore}%. Run 'faf' again or 'faf chat' for help.`);
        this.updateState({ score: newScore });
      }
      return;
    }

    if (!state.lastChatted) {
      console.log(`📊 Current score: ${state.score}%`);
      console.log('\n🎯 Getting to 99% requires some human context.');
      console.log('\nOptions:');
      console.log('  1. faf chat    → Let me ask you questions (recommended)');
      console.log('  2. faf index   → See all commands and drive yourself');
      console.log('  3. faf score --details → See what\'s missing\n');

      this.updateState({ lastChatted: true });
      return;
    }

    // User has tried everything, show escape routes
    this.showEscapeRoutes(state);
  }

  /**
   * Get current FAF state from file and system
   */
  private getState(): FafState {
    const exists = fs.existsSync(this.fafFile);

    if (!exists) {
      return {
        exists: false,
        score: 0,
        lastEnhanced: false,
        lastChatted: false,
        synced: false,
        locked: false
      };
    }

    // Load saved state
    let savedState: Partial<FafState> = {};
    if (fs.existsSync(this.stateFile)) {
      try {
        savedState = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      } catch (e) {
        // State file corrupted, start fresh
      }
    }

    // Check if context is committed (locked)
    let isLocked = savedState.locked || false;
    if (fs.existsSync(this.fafFile)) {
      const fafContent = fs.readFileSync(this.fafFile, 'utf-8');
      if (fafContent.includes('excellence_locked: true')) {
        isLocked = true;
      }
    }

    return {
      exists: true,
      score: this.getCurrentScore(),
      lastEnhanced: savedState.lastEnhanced || false,
      lastChatted: savedState.lastChatted || false,
      synced: savedState.synced || false,
      locked: isLocked
    };
  }

  /**
   * Get current FAF score by parsing .faf file
   */
  private getCurrentScore(): number {
    if (!fs.existsSync(this.fafFile)) return 0;

    try {
      const content = fs.readFileSync(this.fafFile, 'utf-8');
      const scoreMatch = content.match(/ai_score:\s*(\d+)%?/);
      if (scoreMatch) {
        return parseInt(scoreMatch[1]);
      }

      // Fallback: run score command and parse output
      const cliPath = path.join(__dirname, 'cli.js');
      const output = execSync(`node "${cliPath}" score`, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      const outputMatch = output.match(/Score:\s*(\d+)/);
      if (outputMatch) {
        return parseInt(outputMatch[1]);
      }
    } catch (e) {
      // Error getting score, assume needs improvement
      return 50;
    }

    return 50; // Default middle score
  }

  /**
   * Update state file
   */
  private updateState(updates: Partial<FafState>): void {
    let state: Partial<FafState> = {};

    if (fs.existsSync(this.stateFile)) {
      try {
        state = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      } catch (e) {
        // Start fresh if corrupted
      }
    }

    state = { ...state, ...updates };
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  /**
   * Run a FAF command
   */
  private runCommand(command: string, message: string): void {
    console.log(message);
    console.log('━'.repeat(50) + '\n');

    try {
      execSync(`faf ${command}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`\n❌ Command failed. Try 'faf ${command}' directly.`);
    }
  }

  /**
   * Show current status for perfect score
   */
  private showStatus(state: FafState): void {
    console.log('🏆 FAF Status: PERFECT\n');
    console.log(`✅ Score: ${state.score}%`);
    console.log('✅ Synced with CLAUDE.md');
    if (state.locked) {
      console.log('✅ Context locked');
    }
    console.log('\n🎯 Your AI understands everything!');
    console.log('\nMaintenance commands:');
    console.log('  • faf watch    → Auto-sync on changes');
    console.log('  • faf trust    → Verify integrity');
    console.log('  • faf share    → Share with others');
  }

  /**
   * Show escape routes when stuck
   */
  private showEscapeRoutes(state: FafState): void {
    console.log(`📊 Still at ${state.score}%\n`);
    console.log('🚪 Escape Routes:\n');
    console.log('  🎰 faf chat         → Interactive mode (easy)');
    console.log('  🏎️  faf index        → See all 30+ commands');
    console.log('  📊 faf score --fix  → Auto-fix missing items');
    console.log('  📝 faf edit         → Manual edit .faf file');
    console.log('  🔄 faf reset        → Start over fresh\n');
    console.log('💡 Tip: Most users reach 99% with "faf chat"');
  }

  /**
   * Suggest commit when at 99% but not locked
   */
  private suggestCommit(state: FafState): void {
    console.log(`🏆 You're at ${state.score}% excellence!\n`);
    console.log('Your AI context is perfect, but not locked in.\n');
    console.log('→ Run: faf commit');
    console.log('   Lock in this excellence forever');
    console.log('   (Your context will never degrade)\n');
    console.log('Or continue with:');
    console.log('  • faf bi-sync  → Keep files synchronized');
    console.log('  • faf status   → See current state');
  }

  /**
   * Reset state for fresh start
   */
  resetState(): void {
    if (fs.existsSync(this.stateFile)) {
      fs.unlinkSync(this.stateFile);
    }
    console.log('🔄 State reset. Run "faf" to start fresh.');
  }
}

// Export for CLI integration
export default SmartFaf;

// Direct execution support
if (require.main === module) {
  const smartFaf = new SmartFaf();

  // Check for reset flag
  if (process.argv.includes('--reset')) {
    smartFaf.resetState();
  } else {
    smartFaf.execute().catch(console.error);
  }
}