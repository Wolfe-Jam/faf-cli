/**
 * faf plugin-install
 *
 * Workaround for Claude Code marketplace SSH bug.
 * Uses HTTPS clone (which works) instead of SSH (which hangs).
 *
 * References:
 * - https://github.com/anthropics/claude-code/issues/9297
 * - https://github.com/anthropics/claude-code/issues/9719
 * - https://github.com/anthropics/claude-code/issues/9730
 * - https://github.com/anthropics/claude-code/issues/9740
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { chalk } from '../fix-once/colors';

const CLAUDE_PLUGINS_DIR = path.join(
  process.env.HOME || '',
  '.claude/plugins/marketplaces'
);

interface PluginInstallOptions {
  repo: string;
  force?: boolean;
}

function parseRepoInput(input: string): { owner: string; repo: string } | null {
  // Handle: owner/repo
  const slashMatch = input.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }

  // Handle: https://github.com/owner/repo.git
  const httpsMatch = input.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // Handle: git@github.com:owner/repo.git
  const sshMatch = input.match(/git@github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

export async function pluginInstall(options: PluginInstallOptions): Promise<void> {
  const { repo, force } = options;

  console.log(chalk.cyan('\n🔌 FAF Plugin Install'));
  console.log(chalk.gray('   Workaround for Claude Code SSH bug\n'));

  // Parse repo input
  const parsed = parseRepoInput(repo);
  if (!parsed) {
    console.error(chalk.red('❌ Invalid repo format.'));
    console.log(chalk.gray('   Accepted formats:'));
    console.log(chalk.gray('   - owner/repo'));
    console.log(chalk.gray('   - https://github.com/owner/repo'));
    console.log(chalk.gray('   - https://github.com/owner/repo.git'));
    process.exit(1);
  }

  const { owner, repo: repoName } = parsed;
  const installDir = path.join(CLAUDE_PLUGINS_DIR, `${owner}-${repoName}`);

  // Use HTTPS (the fix!)
  const httpsUrl = `https://github.com/${owner}/${repoName}.git`;

  console.log(chalk.white(`   Repo: ${owner}/${repoName}`));
  console.log(chalk.white(`   URL:  ${httpsUrl}`));
  console.log(chalk.white(`   Into: ${installDir}\n`));

  // Check if already installed
  if (fs.existsSync(installDir)) {
    if (force) {
      console.log(chalk.yellow('⚠️  Removing existing installation...'));
      fs.rmSync(installDir, { recursive: true, force: true });
    } else {
      console.log(chalk.yellow('⚠️  Already installed.'));
      console.log(chalk.gray('   Use --force to reinstall.\n'));

      // Verify structure
      verifyPluginStructure(installDir);
      return;
    }
  }

  // Ensure parent directory exists
  if (!fs.existsSync(CLAUDE_PLUGINS_DIR)) {
    fs.mkdirSync(CLAUDE_PLUGINS_DIR, { recursive: true });
  }

  // Clone using HTTPS (the fix!)
  console.log(chalk.cyan('📥 Cloning via HTTPS...'));

  try {
    const startTime = Date.now();
    execSync(`git clone ${httpsUrl} "${installDir}"`, {
      stdio: 'pipe',
      timeout: 60000, // 60 second timeout
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(chalk.green(`✓  Cloned in ${elapsed}s\n`));
  } catch (error: any) {
    console.error(chalk.red('❌ Clone failed.'));
    console.error(chalk.gray(`   ${error.message}`));
    process.exit(1);
  }

  // Verify plugin structure
  verifyPluginStructure(installDir);

  console.log(chalk.green('\n✓  Plugin installed successfully!'));
  console.log(chalk.gray('   Restart Claude Code to load the plugin.\n'));
}

function verifyPluginStructure(installDir: string): void {
  console.log(chalk.cyan('🔍 Verifying plugin structure...'));

  const checks = [
    { path: '.claude-plugin/plugin.json', name: 'plugin.json', required: true },
    { path: 'commands', name: 'commands/', required: false },
    { path: 'skills', name: 'skills/', required: false },
  ];

  let hasCommands = false;
  let hasSkills = false;

  for (const check of checks) {
    const fullPath = path.join(installDir, check.path);
    const exists = fs.existsSync(fullPath);

    if (check.path === 'commands') { hasCommands = exists; }
    if (check.path === 'skills') { hasSkills = exists; }

    if (exists) {
      console.log(chalk.green(`   ✓ ${check.name}`));
    } else if (check.required) {
      console.log(chalk.red(`   ✗ ${check.name} (MISSING - required)`));
    } else {
      console.log(chalk.gray(`   - ${check.name} (optional)`));
    }
  }

  // Count commands and skills
  if (hasCommands) {
    const commands = fs.readdirSync(path.join(installDir, 'commands'))
      .filter(f => f.endsWith('.md'));
    console.log(chalk.green(`   ✓ ${commands.length} commands found`));
  }

  if (hasSkills) {
    const skills = fs.readdirSync(path.join(installDir, 'skills'))
      .filter(f => fs.statSync(path.join(installDir, 'skills', f)).isDirectory());
    console.log(chalk.green(`   ✓ ${skills.length} skills found`));
  }
}

// CLI entry point
export function registerPluginInstallCommand(program: any): void {
  program
    .command('plugin-install <repo>')
    .description('Install Claude Code plugin via HTTPS (workaround for SSH bug)')
    .option('-f, --force', 'Force reinstall if already exists')
    .action(async (repo: string, options: { force?: boolean }) => {
      await pluginInstall({ repo, force: options.force });
    });
}
