/**
 * 🧹 Clear Command - Reset caches and temporary state
 * Claude Code consistency: Similar to /clear command
 */

import { 
  FAF_ICONS, 
  FAF_COLORS
} from '../utils/championship-style';
import { findFafFile } from '../utils/file-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ClearCommandOptions {
  cache?: boolean;    // Clear trust cache only
  todos?: boolean;    // Clear todo lists only  
  backups?: boolean;  // Clear backup files only
  all?: boolean;      // Clear everything (default)
}

/**
 * Clear caches, temporary files, and reset state
 */
export async function clearCommand(options: ClearCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.broom} Clear Cache & State`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Resetting state for fresh context`);
    
    // Default to clearing all if no specific options
    const clearAll = options.all || (!options.cache && !options.todos && !options.backups);
    
    let itemsCleared = 0;
    
    // Clear trust cache
    if (options.cache || clearAll) {
      itemsCleared += await clearTrustCache();
    }
    
    // Clear todo lists
    if (options.todos || clearAll) {
      itemsCleared += await clearTodoLists();
    }
    
    // Clear backup files
    if (options.backups || clearAll) {
      itemsCleared += await clearBackupFiles();
    }
    
    const duration = Date.now() - startTime;
    
    console.log();
    if (itemsCleared > 0) {
      console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.party} Cleared ${itemsCleared} items in ${duration}ms!`));
      console.log(FAF_COLORS.fafCyan('Fresh start - all caches and temporary files removed'));
    } else {
      console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.sparkles} Already clean! No items to clear`));
    }
    
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf status${FAF_COLORS.fafCyan(' - Check fresh system status')}`);
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Clear failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Clear trust cache in home directory
 */
async function clearTrustCache(): Promise<number> {
  try {
    const cacheDir = path.join(os.homedir(), '.faf-cli-cache');
    const trustCachePath = path.join(cacheDir, 'trust-cache.json');
    
    try {
      await fs.access(trustCachePath);
      await fs.unlink(trustCachePath);
      console.log(`${FAF_COLORS.fafGreen('├─ ')}Trust cache cleared`);
      return 1;
    } catch {
      console.log(`${FAF_COLORS.fafCyan('├─ ')}No trust cache to clear`);
      return 0;
    }
  } catch {
    return 0;
  }
}

/**
 * Clear todo lists in current project and parents
 */
async function clearTodoLists(): Promise<number> {
  let cleared = 0;
  
  try {
    const fafPath = await findFafFile();
    if (fafPath) {
      const projectDir = path.dirname(fafPath);
      const todoPath = path.join(projectDir, '.faf-todos.json');
      
      try {
        await fs.access(todoPath);
        await fs.unlink(todoPath);
        console.log(`${FAF_COLORS.fafGreen('├─ ')}Todo list cleared`);
        cleared++;
      } catch {
        console.log(`${FAF_COLORS.fafCyan('├─ ')}No todo list to clear`);
      }
    }
  } catch {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}No .faf project found`);
  }
  
  return cleared;
}

/**
 * Clear backup files (.faf.backup*, .faf.garage-backup, etc.)
 */
async function clearBackupFiles(): Promise<number> {
  let cleared = 0;
  
  try {
    const fafPath = await findFafFile();
    if (fafPath) {
      const projectDir = path.dirname(fafPath);
      const files = await fs.readdir(projectDir);
      
      const backupFiles = files.filter(file => 
        file.startsWith('.faf.backup') || 
        file.endsWith('.garage-backup') ||
        file.endsWith('.backup')
      );
      
      for (const backupFile of backupFiles) {
        const backupPath = path.join(projectDir, backupFile);
        try {
          await fs.unlink(backupPath);
          console.log(`${FAF_COLORS.fafGreen('├─ ')}Cleared ${backupFile}`);
          cleared++;
        } catch {
          // Skip if can't delete
        }
      }
      
      if (backupFiles.length === 0) {
        console.log(`${FAF_COLORS.fafCyan('├─ ')}No backup files to clear`);
      }
    }
  } catch {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}No .faf project found`);
  }
  
  return cleared;
}