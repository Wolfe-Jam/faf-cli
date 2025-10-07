#!/usr/bin/env node

import { Command } from '../fix-once/commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import { chalk } from '../fix-once/colors';

// Simple color utilities
const colors = {
  success: (text: string) => chalk.green(text),
  error: (text: string) => chalk.red(text),
  warning: (text: string) => chalk.yellow(text),
  header: (text: string) => chalk.bold.cyan(text),
  highlight: (text: string) => chalk.yellow.bold(text),
  command: (text: string) => chalk.cyan(text),
  file: (text: string) => chalk.blue(text),
  url: (text: string) => chalk.underline.blue(text)
};

// Simple logger
const logger = {
  error: (message: string, error?: any) => {
    console.error(colors.error(message));
    if (error) console.error(error);
  }
};

async function findProjectRoot(startDir: string): Promise<string> {
  return startDir; // Simple implementation - use current dir
}

const program = new Command();

interface RecoveryReport {
  status: 'healthy' | 'corrupted' | 'missing' | 'recoverable';
  issues: string[];
  fixes: string[];
  autoFixed: boolean;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkFafHealth(projectRoot: string): Promise<RecoveryReport> {
  const report: RecoveryReport = {
    status: 'healthy',
    issues: [],
    fixes: [],
    autoFixed: false
  };

  const fafPath = path.join(projectRoot, '.faf');
  const dnaPath = path.join(projectRoot, '.faf-dna.json');
  const backupPath = path.join(projectRoot, '.faf.backup');

  // Check .faf file
  const fafExists = await fileExists(fafPath);
  if (!fafExists) {
    report.status = 'missing';
    report.issues.push('.faf file is missing');

    if (await fileExists(backupPath)) {
      report.status = 'recoverable';
      report.fixes.push('Found .faf.backup - can restore');
    } else {
      report.fixes.push('Run: faf init --force to recreate');
    }
  } else {
    // Try to parse .faf
    try {
      const content = await fs.readFile(fafPath, 'utf-8');
      parseYAML(content);
    } catch (error) {
      report.status = 'corrupted';
      report.issues.push('.faf file is corrupted (invalid YAML)');

      if (await fileExists(backupPath)) {
        report.status = 'recoverable';
        report.fixes.push('Found .faf.backup - can restore');
      } else {
        report.fixes.push('Check git: git checkout HEAD -- .faf');
        report.fixes.push('Or rebuild: faf init --force');
      }
    }
  }

  // Check DNA file
  const dnaExists = await fileExists(dnaPath);
  if (!dnaExists) {
    report.issues.push('.faf-dna.json is missing (journey history lost)');
    report.fixes.push('Run: faf auth to start new journey');
  } else {
    try {
      const content = await fs.readFile(dnaPath, 'utf-8');
      JSON.parse(content);
    } catch {
      report.issues.push('.faf-dna.json is corrupted');
      report.fixes.push('Delete and recreate: rm .faf-dna.json && faf auth');
    }
  }

  // Check for backups
  const backups = await findBackups(projectRoot);
  if (backups.length > 0) {
    report.fixes.push(`Found ${backups.length} backup(s): ${backups.join(', ')}`);
  }

  return report;
}

async function findBackups(projectRoot: string): Promise<string[]> {
  const backups: string[] = [];

  try {
    const files = await fs.readdir(projectRoot);
    for (const file of files) {
      if (file.startsWith('.faf.backup') || file.endsWith('.faf.bak')) {
        backups.push(file);
      }
    }
  } catch {
    // Directory not readable
  }

  return backups;
}

async function autoRecover(projectRoot: string, report: RecoveryReport): Promise<boolean> {
  const fafPath = path.join(projectRoot, '.faf');
  const backupPath = path.join(projectRoot, '.faf.backup');

  if (report.status === 'recoverable' && await fileExists(backupPath)) {
    try {
      // Validate backup first
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      parseYAML(backupContent); // Will throw if invalid

      // Backup is valid, restore it
      await fs.copyFile(backupPath, fafPath);

      console.log(colors.success(`\n✅ Restored .faf from backup`));
      return true;
    } catch (error) {
      console.log(colors.error(`\n❌ Backup is also corrupted`));
      return false;
    }
  }

  return false;
}

async function showRecoveryPlan(report: RecoveryReport): Promise<void> {
  console.log('\n' + colors.header('🚨 FAF DISASTER RECOVERY'));
  console.log('═'.repeat(50));

  // Status
  const statusEmoji = {
    healthy: '✅',
    corrupted: '💥',
    missing: '❌',
    recoverable: '🔧'
  }[report.status];

  console.log(`\n${statusEmoji} Status: ${colors.highlight(report.status.toUpperCase())}`);

  // Issues
  if (report.issues.length > 0) {
    console.log('\n' + colors.error('Issues Detected:'));
    report.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }

  // Recovery options
  if (report.fixes.length > 0) {
    console.log('\n' + colors.success('Recovery Options:'));
    report.fixes.forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`);
    });
  }

  // Emergency commands
  console.log('\n' + colors.header('EMERGENCY COMMANDS:'));
  console.log('─'.repeat(50));
  console.log(colors.command('  faf recover --auto     ') + '# Try automatic recovery');
  console.log(colors.command('  faf recover --backup   ') + '# List all backups');
  console.log(colors.command('  faf init --force       ') + '# Start fresh (loses history)');
  console.log(colors.command('  faf help disaster      ') + '# Full recovery guide');

  // Git recovery
  console.log('\n' + colors.header('GIT RECOVERY:'));
  console.log('─'.repeat(50));
  console.log(colors.command('  git status             ') + '# Check git state');
  console.log(colors.command('  git checkout HEAD -- .faf') + '# Restore from git');
  console.log(colors.command('  git log -p .faf        ') + '# View .faf history');

  // Support
  console.log('\n' + colors.header('GET HELP:'));
  console.log('─'.repeat(50));
  console.log(`  📚 Docs: ${colors.url('https://faf.dev/disaster-recovery')}`);
  console.log(`  💬 Discord: ${colors.url('https://discord.gg/faf')}`);
  console.log(`  📧 Email: ${colors.url('help@faf.dev')}`);
}

program
  .name('faf-recover')
  .description('🚨 Disaster recovery for corrupted or missing FAF files')
  .option('--auto', 'Attempt automatic recovery')
  .option('--backup', 'List available backups')
  .option('--force', 'Force recovery even if risky')
  .option('--check', 'Check health without recovery')
  .action(async (options) => {
    try {
      const projectRoot = await findProjectRoot(process.cwd());

      // Check health
      const report = await checkFafHealth(projectRoot);

      if (options.backup) {
        const backups = await findBackups(projectRoot);
        console.log('\n' + colors.header('📦 AVAILABLE BACKUPS'));
        console.log('═'.repeat(50));

        if (backups.length === 0) {
          console.log(colors.warning('\nNo backups found'));
          console.log('Tip: FAF creates automatic backups before risky operations');
        } else {
          for (const backup of backups) {
            const stats = await fs.stat(path.join(projectRoot, backup));
            console.log(`\n  • ${colors.file(backup)}`);
            console.log(`    Modified: ${stats.mtime.toLocaleString()}`);
            console.log(`    Size: ${stats.size} bytes`);
          }
          console.log('\n' + colors.success('To restore a backup:'));
          console.log(colors.command(`  cp ${backups[0]} .faf`));
        }
        return;
      }

      if (report.status === 'healthy' && !options.check) {
        console.log(colors.success('\n✅ Your FAF files are healthy!'));
        console.log('\nNo recovery needed. Keep going! 🚀');
        return;
      }

      // Show recovery plan
      await showRecoveryPlan(report);

      // Auto-recover if requested
      if (options.auto && report.status === 'recoverable') {
        console.log('\n' + colors.warning('Attempting automatic recovery...'));
        const recovered = await autoRecover(projectRoot, report);

        if (recovered) {
          console.log(colors.success('\n🎉 Recovery successful!'));
          console.log('Your .faf file has been restored.');
          console.log('\nNext steps:');
          console.log('  1. Run: faf score   # Check your score');
          console.log('  2. Run: faf dna     # Check your journey');
          console.log('  3. Run: faf update  # Save a checkpoint');
        } else {
          console.log(colors.error('\n❌ Automatic recovery failed'));
          console.log('Please try manual recovery options above.');
        }
      }

      // Show prevention tips
      if (report.issues.length > 0) {
        console.log('\n' + colors.header('💡 PREVENTION TIPS:'));
        console.log('─'.repeat(50));
        console.log('  • Commit .faf to git regularly');
        console.log('  • Use "faf update" to save checkpoints');
        console.log('  • Enable auto-backup: faf trust --backup-mode');
        console.log('  • Keep score above 70% for best results');
      }

    } catch (error) {
      logger.error('Recovery failed:', error);
      console.log(colors.error('\n❌ Critical error during recovery'));
      console.log('\nLast resort options:');
      console.log('  1. Delete everything and start fresh:');
      console.log('     rm -f .faf .faf-dna.json');
      console.log('     faf init --force');
      console.log('  2. Contact support: help@faf.dev');
    }
  });

program.parse(process.argv);