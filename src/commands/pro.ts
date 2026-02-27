/**
 * faf pro — Manage FAF Pro license (tri-sync)
 *
 * Subcommands:
 *   faf pro            Show Pro status
 *   faf pro status     Show Pro status (alias)
 *   faf pro activate <key>  Activate a license key
 */

import { chalk } from '../fix-once/colors';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';
import {
  activateLicense,
  getProStatus,
} from '../licensing/pro-gate';
import { MESSAGES } from '../licensing/license-messages';

// ============================================================================
// Main Command Router
// ============================================================================

export async function proCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'activate': {
      const key = args[1];
      if (!key) {
        console.log();
        console.log(chalk.red('Usage: faf pro activate <key>'));
        console.log(chalk.gray('  Format: FAF-PRO-XXXX-XXXX-XXXX'));
        console.log();
        return;
      }
      runActivate(key);
      break;
    }

    case 'status':
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      showProStatus();
      break;

    default:
      console.error(chalk.red(`\n  Unknown pro command: ${subcommand}`));
      console.log('  Available: faf pro, faf pro status, faf pro activate <key>\n');
      process.exit(1);
  }
}

// ============================================================================
// Status
// ============================================================================

function showProStatus(): void {
  const status = getProStatus();

  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.trophy} FAF Pro Status`));
  console.log();

  switch (status.state) {
    case 'licensed':
      console.log(chalk.green(`   ${FAF_ICONS.gem} Pro Licensed`));
      if (status.key) {
        console.log(chalk.gray(`   Key:       ${status.key}`));
      }
      if (status.tier) {
        console.log(chalk.gray(`   Tier:      ${status.tier}`));
      }
      if (status.activatedAt) {
        console.log(
          chalk.gray(
            `   Activated: ${new Date(status.activatedAt).toLocaleDateString()}`
          )
        );
      }
      break;

    case 'trial':
      console.log(chalk.green(`   ${FAF_ICONS.rocket} Trial Active`));
      console.log(
        chalk.gray(`   Days left: ${status.daysLeft}`)
      );
      if (status.trialExpires) {
        console.log(
          chalk.gray(
            `   Expires:   ${new Date(status.trialExpires).toLocaleDateString()}`
          )
        );
      }
      console.log();
      console.log(chalk.gray('   Activate: faf pro activate <key>'));
      console.log(chalk.gray('   Purchase: faf.one/pro'));
      break;

    case 'trial_expired':
      console.log(chalk.yellow(`   ${FAF_ICONS.precision} Trial Expired`));
      if (status.trialExpires) {
        console.log(
          chalk.gray(
            `   Expired:  ${new Date(status.trialExpires).toLocaleDateString()}`
          )
        );
      }
      console.log();
      console.log(
        FAF_COLORS.fafOrange(`   ${FAF_ICONS.trophy} ${MESSAGES.upgradePrompt}`)
      );
      console.log(chalk.gray('   Activate: faf pro activate <key>'));
      break;

    case 'legacy_dev':
      console.log(chalk.green(`   ${FAF_ICONS.trophy} Legacy Developer Access`));
      console.log(chalk.gray('   All Pro features unlocked via turbo-license.'));
      break;

    case 'none':
      console.log(chalk.gray(`   No trial started yet.`));
      console.log(
        chalk.gray('   Run a Pro command (faf ram, faf tri-sync) to start your 14-day trial.')
      );
      break;
  }

  console.log();
}

// ============================================================================
// Activate
// ============================================================================

function runActivate(key: string): void {
  console.log();

  const result = activateLicense(key);

  if (result.success) {
    console.log(chalk.green(`   ${FAF_ICONS.trophy} ${result.message}`));
  } else {
    console.log(chalk.yellow(`   ${result.message}`));
  }

  console.log();
}
