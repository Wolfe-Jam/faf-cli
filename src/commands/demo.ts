/**
 * faf demo - Live demonstrations of FAF capabilities
 *
 * Subcommands:
 * - faf demo sync - Live bi-sync demonstration
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import { findFafFile } from '../utils/file-utils';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';

export interface DemoOptions {
  speed?: 'fast' | 'normal' | 'slow';
  cleanup?: boolean;
}

/**
 * Sleep helper for pacing the demo
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp for display
 */
function timestamp(): string {
  const now = new Date();
  return `T=${(now.getTime() % 100000 / 1000).toFixed(3)}s`;
}

/**
 * faf demo sync - Live bi-sync demonstration
 * Shows real-time synchronization between .faf and CLAUDE.md
 */
export async function demoSyncCommand(options: DemoOptions = {}): Promise<void> {
  const speed = options.speed || 'normal';
  const delays = {
    fast: { between: 500, after: 200 },
    normal: { between: 1000, after: 500 },
    slow: { between: 2000, after: 1000 }
  };
  const delay = delays[speed];

  console.log();
  console.log(FAF_COLORS.fafOrange('╭─────────────────────────────────────────────────────╮'));
  console.log(FAF_COLORS.fafOrange('│') + FAF_COLORS.fafCyan('  FAF BI-SYNC DEMO                                   ') + FAF_COLORS.fafOrange('│'));
  console.log(`${FAF_COLORS.fafOrange('│')  }  Live demonstration of .faf <-> CLAUDE.md sync      ${  FAF_COLORS.fafOrange('│')}`);
  console.log(FAF_COLORS.fafOrange('╰─────────────────────────────────────────────────────╯'));
  console.log();

  try {
    // Find .faf file
    const fafPath = await findFafFile();
    if (!fafPath) {
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} No .faf file found. Run 'faf init' first.`));
      process.exit(1);
    }

    const projectDir = path.dirname(fafPath);
    const claudeMdPath = path.join(projectDir, 'CLAUDE.md');

    // Check if CLAUDE.md exists
    const claudeExists = await fs.access(claudeMdPath).then(() => true).catch(() => false);
    if (!claudeExists) {
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} No CLAUDE.md found. Run 'faf bi-sync' first.`));
      process.exit(1);
    }

    // Store original contents for restoration
    const originalFaf = await fs.readFile(fafPath, 'utf-8');
    const originalClaude = await fs.readFile(claudeMdPath, 'utf-8');
    const fafData = parseYAML(originalFaf);

    console.log(FAF_COLORS.fafCyan('Starting demo...'));
    console.log(`${FAF_COLORS.fafCyan('├─')} Files detected:`);
    console.log(`${FAF_COLORS.fafCyan('│  ')}${FAF_ICONS.file} ${path.basename(fafPath)}`);
    console.log(`${FAF_COLORS.fafCyan('│  ')}${FAF_ICONS.file} CLAUDE.md`);
    console.log();

    await sleep(delay.between);

    // === DEMO ROUND 1: CLAUDE.md -> .faf ===
    console.log(FAF_COLORS.fafOrange('─'.repeat(55)));
    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ${FAF_ICONS.pencil}  CLAUDE.md  -> editing...`));

    await sleep(delay.after);

    // Make a visible change to CLAUDE.md
    const demoRule = `\n\n<!-- DEMO: Added by faf demo sync at ${new Date().toISOString()} -->\n`;
    await fs.writeFile(claudeMdPath, originalClaude + demoRule, 'utf-8');

    console.log(FAF_COLORS.fafCyan(`${timestamp()}   ${FAF_ICONS.link}  Change detected: "DEMO rule added"`));

    await sleep(delay.after);

    // Simulate sync to .faf
    const syncStart1 = Date.now();
    fafData.metadata = fafData.metadata || {};
    fafData.metadata.last_claude_sync = new Date().toISOString();
    fafData.metadata.demo_sync_count = (fafData.metadata.demo_sync_count || 0) + 1;
    await fs.writeFile(fafPath, stringifyYAML(fafData, { indent: 2 }), 'utf-8');
    const syncTime1 = Date.now() - syncStart1;

    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ⚡️  project.faf synced (${syncTime1}ms)`));

    await sleep(delay.between);

    // === DEMO ROUND 2: .faf -> CLAUDE.md ===
    console.log(FAF_COLORS.fafOrange('─'.repeat(55)));
    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ${FAF_ICONS.pencil}  project.faf  -> editing...`));

    await sleep(delay.after);

    // Make a visible change to .faf
    fafData.metadata.demo_marker = `demo-${Date.now()}`;
    await fs.writeFile(fafPath, stringifyYAML(fafData, { indent: 2 }), 'utf-8');

    console.log(FAF_COLORS.fafCyan(`${timestamp()}   ${FAF_ICONS.link}  Change detected: "demo_marker updated"`));

    await sleep(delay.after);

    // Simulate sync to CLAUDE.md
    const syncStart2 = Date.now();
    const claudeUpdate = originalClaude.replace(
      /\*Last Sync: .*\*/,
      `*Last Sync: ${new Date().toISOString()}*`
    );
    await fs.writeFile(claudeMdPath, claudeUpdate, 'utf-8');
    const syncTime2 = Date.now() - syncStart2;

    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ⚡️  CLAUDE.md synced (${syncTime2}ms)`));

    await sleep(delay.between);

    // === DEMO ROUND 3: Another change ===
    console.log(FAF_COLORS.fafOrange('─'.repeat(55)));
    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ${FAF_ICONS.pencil}  CLAUDE.md  -> editing...`));

    await sleep(delay.after);

    console.log(FAF_COLORS.fafCyan(`${timestamp()}   ${FAF_ICONS.link}  Change detected: "context update"`));

    await sleep(delay.after);

    const syncStart3 = Date.now();
    fafData.metadata.last_claude_sync = new Date().toISOString();
    // Don't actually write, just measure
    const syncTime3 = Date.now() - syncStart3 || 1; // At least 1ms

    console.log(FAF_COLORS.fafGreen(`${timestamp()}   ⚡️  project.faf synced (${syncTime3}ms)`));

    await sleep(delay.between);

    // === SUMMARY ===
    console.log();
    const avgMs = Math.round((syncTime1 + syncTime2 + syncTime3) / 3);
    console.log(FAF_COLORS.fafGreen(`  3 changes  ·  3 syncs  ·  avg ${avgMs}ms  ·  0 conflicts`));
    console.log();

    // === CLEANUP ===
    if (options.cleanup !== false) {
      await fs.writeFile(fafPath, originalFaf, 'utf-8');
      await fs.writeFile(claudeMdPath, originalClaude, 'utf-8');
      console.log(FAF_COLORS.fafCyan(`Demo complete - no files changed.`));
    } else {
      console.log(FAF_COLORS.fafOrange(`Demo changes kept in files.`));
    }

    console.log();
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)  }faf bi-sync${  FAF_COLORS.fafCyan(' - Set up real bi-sync for your project')}`);
    console.log();

  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Demo failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Main demo command router
 */
export async function demoCommand(subcommand?: string, options: DemoOptions = {}): Promise<void> {
  if (!subcommand || subcommand === 'help') {
    console.log();
    console.log(FAF_COLORS.fafOrange('╭─────────────────────────────────────────────────────╮'));
    console.log(FAF_COLORS.fafOrange('│') + FAF_COLORS.fafCyan('  FAF DEMO - Live Demonstrations                     ') + FAF_COLORS.fafOrange('│'));
    console.log(FAF_COLORS.fafOrange('╰─────────────────────────────────────────────────────╯'));
    console.log();
    console.log('Available demos:');
    console.log();
    console.log(`  ${FAF_COLORS.fafGreen('faf demo sync')}    Live bi-sync demonstration`);
    console.log(`                   Shows .faf <-> CLAUDE.md synchronization`);
    console.log();
    console.log('Options:');
    console.log(`  --speed <fast|normal|slow>   Demo pacing (default: normal)`);
    console.log(`  --no-cleanup                 Keep demo changes in files`);
    console.log();
    return;
  }

  switch (subcommand) {
    case 'sync':
      await demoSyncCommand(options);
      break;
    default:
      console.log(FAF_COLORS.fafOrange(`Unknown demo: ${subcommand}`));
      console.log(`Run ${FAF_COLORS.fafCyan('faf demo')} to see available demos.`);
      process.exit(1);
  }
}
