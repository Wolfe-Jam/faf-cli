/**
 * 🏆 faf fam - FAF Family Integration Marketplace
 *
 * Discovery, status, and marketplace for championship integrations
 */

import { chalk } from '../fix-once/colors';
import { FAF_COLORS } from '../utils/championship-style';
import { integrationRegistry } from '../family/registry';

export interface FamOptions {
  detected?: boolean;
  available?: boolean;
  all?: boolean;
}

/**
 * Get tier emoji
 */
function getTierEmoji(tier: string): string {
  const emojis: Record<string, string> = {
    trophy: '🏆',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
  };
  return emojis[tier] || '⚪';
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Check if integration requires TURBO
 */
function requiresTurbo(name: string): boolean {
  // n8n is our LEAD integration requiring TURBO
  return name === 'n8n';
}

/**
 * Main faf fam command - show integrations
 */
export async function famCommand(subcommand?: string, arg?: string, options?: FamOptions) {
  // Handle subcommands
  if (subcommand === 'show') {
    return await showIntegration(arg!);
  } else if (subcommand === 'install') {
    return await installIntegration(arg!);
  }

  // Default: List all integrations
  return await listIntegrations(options);
}

/**
 * List all integrations with status
 */
async function listIntegrations(options?: FamOptions) {
  console.log();
  console.log(FAF_COLORS.fafCyan('🏆 FAF Family - Championship Integrations'));
  console.log(FAF_COLORS.fafCyan('═'.repeat(50)));
  console.log();

  try {
    // Get current directory for detection
    const projectPath = process.cwd();
    const detected = await integrationRegistry.detectAll(projectPath);
    const stats = integrationRegistry.getStats();

    // Show detected integrations in project
    if (detected.length > 0) {
      console.log(FAF_COLORS.fafOrange('YOUR PROJECT:'));
      console.log();

      detected.forEach((integration) => {
        const emoji = getTierEmoji(integration.tier);
        console.log(`  ${chalk.green('✅')} ${chalk.bold(integration.displayName)}`);
        console.log(`     ${emoji} ${chalk.cyan(integration.tier)} tier`);
        console.log(`     ${chalk.gray(formatNumber(integration.weeklyAdoption) + ' weekly developers')}`);
        console.log();
      });

      // Show MCP recommendations
      const allMcpServers = detected.flatMap(d => d.mcpServers);
      if (allMcpServers.length > 0) {
        console.log(FAF_COLORS.fafCyan('  🎯 Recommended MCP Servers:'));
        allMcpServers.forEach(server => {
          console.log(`     ${chalk.gray('•')} ${chalk.cyan(server)}`);
        });
        console.log();
      }

      console.log(chalk.gray('─'.repeat(50)));
      console.log();
    } else {
      console.log(FAF_COLORS.fafOrange('YOUR PROJECT:'));
      console.log();
      console.log(chalk.gray('  No integrations detected in current project'));
      console.log();
      console.log(chalk.gray('─'.repeat(50)));
      console.log();
    }

    // Show available integrations
    console.log(FAF_COLORS.fafOrange('AVAILABLE INTEGRATIONS:'));
    console.log();

    // Get all integrations and sort by weekly adoption
    const allIntegrations = Array.from(integrationRegistry.integrations.values())
      .sort((a, b) => b.weeklyAdoption - a.weeklyAdoption);

    // Filter out already detected ones for "available" section
    const notDetected = allIntegrations.filter(
      integration => !detected.find(d => d.name === integration.name)
    );

    if (notDetected.length > 0) {
      notDetected.forEach((integration) => {
        const emoji = getTierEmoji(integration.tier);
        const turboTag = requiresTurbo(integration.name)
          ? ` ${FAF_COLORS.fafOrange('[TURBO ONLY]')}`
          : '';

        console.log(`  ${emoji} ${chalk.bold(integration.displayName)}${turboTag}`);
        console.log(`     ${chalk.gray(integration.tier + ' tier • ' + formatNumber(integration.weeklyAdoption) + ' weekly developers')}`);
        console.log(`     ${chalk.gray(integration.mcpServers.length + ' MCP server(s) • ' + integration.contextContribution.length + ' context slots')}`);
        console.log();
      });
    }

    // Show registry stats
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(FAF_COLORS.fafCyan('📊 ECOSYSTEM STATS:'));
    console.log();
    console.log(`  Total integrations: ${chalk.cyan(stats.total.toString())}`);
    console.log(`  Total reach: ${chalk.cyan(formatNumber(stats.totalWeeklyAdoption))} developers/week`);
    console.log();

    // Show tier breakdown
    console.log('  By tier:');
    Object.entries(stats.byTier).forEach(([tier, count]) => {
      const emoji = getTierEmoji(tier);
      console.log(`    ${emoji} ${tier}: ${chalk.cyan(count.toString())}`);
    });
    console.log();

    // Show help
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(FAF_COLORS.fafOrange('💡 COMMANDS:'));
    console.log();
    console.log(`  ${chalk.cyan('faf fam')}              ${chalk.gray('# Show all integrations (this view)')}`);
    console.log(`  ${chalk.cyan('faf fam show react')}   ${chalk.gray('# Details about React integration')}`);
    console.log(`  ${chalk.cyan('faf fam install n8n')}  ${chalk.gray('# Install integration (coming soon)')}`);
    console.log();

  } catch (error) {
    console.error(chalk.red('❌ Error loading integrations:'), error);
  }
}

/**
 * Show details about a specific integration
 */
async function showIntegration(name: string) {
  console.log();

  const integration = integrationRegistry.get(name);
  if (!integration) {
    console.log(chalk.red(`❌ Integration not found: ${name}`));
    console.log();
    console.log(FAF_COLORS.fafOrange('💡 Available integrations:'));
    const all = integrationRegistry.list();
    all.forEach(n => console.log(`  • ${n}`));
    console.log();
    return;
  }

  const emoji = getTierEmoji(integration.tier);
  const turboTag = requiresTurbo(integration.name)
    ? ` ${FAF_COLORS.fafOrange('[TURBO ONLY]')}`
    : '';

  console.log(FAF_COLORS.fafCyan(`${emoji} ${integration.displayName}${turboTag}`));
  console.log(FAF_COLORS.fafCyan('═'.repeat(50)));
  console.log();

  console.log(FAF_COLORS.fafOrange('OVERVIEW:'));
  console.log(`  Tier: ${chalk.cyan(integration.tier)}`);
  console.log(`  Quality Score: ${chalk.cyan(integration.qualityScore + '/100')}`);
  console.log(`  Weekly Adoption: ${chalk.cyan(formatNumber(integration.weeklyAdoption))} developers`);
  console.log();

  console.log(FAF_COLORS.fafOrange('MCP SERVERS:'));
  integration.mcpServers.forEach(server => {
    console.log(`  ${chalk.cyan('•')} ${server}`);
  });
  console.log();

  console.log(FAF_COLORS.fafOrange('CONTEXT CONTRIBUTION:'));
  console.log(`  Fills ${chalk.cyan(integration.contextContribution.length.toString())} .faf slots:`);
  integration.contextContribution.forEach(slot => {
    console.log(`  ${chalk.cyan('•')} ${slot}`);
  });
  console.log();

  // Check if detected in current project
  const projectPath = process.cwd();
  const isDetected = await integration.detect(projectPath);

  if (isDetected) {
    console.log(chalk.green('✅ DETECTED in your project!'));
    console.log();
  } else {
    console.log(chalk.gray('❌ Not detected in your project'));
    console.log();
  }

  // Show TURBO info if applicable
  if (requiresTurbo(integration.name)) {
    console.log(FAF_COLORS.fafOrange('🚀 TURBO FEATURE:'));
    console.log(`  This integration requires ${chalk.cyan('FAF TURBO')} ($19)`);
    console.log();
    console.log('  What you get:');
    console.log(`  ${chalk.cyan('✅')} ${integration.displayName} auto-detection`);
    console.log(`  ${chalk.cyan('✅')} MCP server recommendations`);
    console.log(`  ${chalk.cyan('✅')} Smart .faf context generation`);
    console.log(`  ${chalk.cyan('✅')} Priority integration updates`);
    console.log();
  }

  console.log(chalk.gray('─'.repeat(50)));
  console.log();
}

/**
 * Install integration (placeholder for now)
 */
async function installIntegration(name: string) {
  console.log();

  const integration = integrationRegistry.get(name);
  if (!integration) {
    console.log(chalk.red(`❌ Integration not found: ${name}`));
    console.log();
    return;
  }

  // Check if requires TURBO
  if (requiresTurbo(integration.name)) {
    console.log(FAF_COLORS.fafOrange(`🥇 ${integration.displayName} Integration`));
    console.log();
    console.log(chalk.yellow('⚠️  This integration requires FAF TURBO'));
    console.log();
    console.log('What you get:');
    console.log(`  ${chalk.cyan('✅')} Auto-detection and smart .faf generation`);
    console.log(`  ${chalk.cyan('✅')} MCP server setup (${integration.mcpServers.join(', ')})`);
    console.log(`  ${chalk.cyan('✅')} ${integration.contextContribution.length} context slots auto-filled`);
    console.log(`  ${chalk.cyan('✅')} Priority support and updates`);
    console.log();
    console.log(FAF_COLORS.fafOrange('💰 Upgrade to TURBO:'));
    console.log(`  Visit: ${chalk.cyan('https://faf.one/pricing')}`);
    console.log();
    return;
  }

  // For free integrations (future)
  console.log(FAF_COLORS.fafCyan(`🎯 Installing ${integration.displayName}...`));
  console.log();
  console.log(chalk.yellow('⚠️  Installation feature coming soon!'));
  console.log();
  console.log('For now:');
  console.log(`  1. Add ${integration.displayName} to your project`);
  console.log(`  2. Run ${chalk.cyan('faf init')} to detect it`);
  console.log(`  3. Run ${chalk.cyan('faf fam')} to see it in YOUR PROJECT`);
  console.log();
}
