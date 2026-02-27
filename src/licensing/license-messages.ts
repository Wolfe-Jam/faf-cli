/**
 * FAF Pro — User-facing messages
 *
 * All copy in one place. Warm tone, zero pressure.
 */

import { chalk } from '../fix-once/colors';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';

// ---------------------------------------------------------------------------
// Raw message strings (testable without chalk)
// ---------------------------------------------------------------------------

export const MESSAGES = {
  trialStarted:
    'tri-sync Pro trial started! 14 days of ROM/RAM sync. No signup needed.',

  trialReminder: (days: number) =>
    `tri-sync Pro: ${days} day${days === 1 ? '' : 's'} left in trial`,

  trialExpired:
    'Your tri-sync trial has ended. Unlock it permanently: faf.one/pro',

  licenseActivated: 'Pro activated! tri-sync is yours.',

  alreadyLicensed: "You're already Pro!",

  invalidKey:
    "That key doesn't look right. Format: FAF-PRO-XXXX-XXXX-XXXX",

  upgradePrompt:
    'Unlock tri-sync Pro — a dime-or-nickel decision: faf.one/pro',
};

// ---------------------------------------------------------------------------
// Formatted console output
// ---------------------------------------------------------------------------

export function showTrialStarted(): void {
  console.log();
  console.log(
    FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} ${MESSAGES.trialStarted}`)
  );
  console.log();
}

export function showTrialReminder(days: number): void {
  console.log(
    chalk.gray(`   ${FAF_ICONS.precision} ${MESSAGES.trialReminder(days)}`)
  );
}

export function showTrialExpired(): void {
  console.log();
  console.log(chalk.yellow(`${FAF_ICONS.precision} ${MESSAGES.trialExpired}`));
  console.log();
  console.log(
    FAF_COLORS.fafOrange(`   ${FAF_ICONS.trophy} ${MESSAGES.upgradePrompt}`)
  );
  console.log(
    chalk.gray('   Run: faf pro activate <key>')
  );
  console.log();
}

export function showLicenseActive(): void {
  // Silent on normal use — Pro users shouldn't see noise.
  // Only shown from `faf pro status`.
}

export function showUpgradePrompt(): void {
  console.log();
  console.log(
    FAF_COLORS.fafOrange(`${FAF_ICONS.trophy} ${MESSAGES.upgradePrompt}`)
  );
  console.log(chalk.gray('   Run: faf pro activate <key>'));
  console.log();
}
