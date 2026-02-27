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
  trialReminder: (days: number) =>
    `tri-sync Pro: ${days} day${days === 1 ? '' : 's'} left in trial`,

  trialExpired:
    'Your tri-sync Pro trial has ended.',

  licenseActivated: 'Pro activated! tri-sync is yours.',

  alreadyLicensed: "You're already Pro!",

  invalidKey:
    "That key doesn't look right. Format: FAF-PRO-XXXX-XXXX-XXXX",
};

// ---------------------------------------------------------------------------
// Formatted console output
// ---------------------------------------------------------------------------

export function showTrialStarted(): void {
  console.log();
  console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} 14-Day Free Trial of tri-sync Pro`));
  console.log();
  console.log(chalk.white('   bi-sync is free forever — 30K+ people use it, and that never changes.'));
  console.log();
  console.log(chalk.white('   tri-sync is new. It adds RAM to the equation:'));
  console.log(chalk.gray('     bi-sync  = ROM (.faf) ↔ CLAUDE.md'));
  console.log(chalk.gray('     tri-sync = ROM ↔ CLAUDE.md ↔ RAM (Claude\'s session memory)'));
  console.log();
  console.log(chalk.white('   Your AI remembers across sessions. That\'s the upgrade.'));
  console.log();
  console.log(chalk.gray('   $3/mo (a dime a day) · $29/yr (a nickel a day)'));
  console.log(chalk.gray('   No signup needed for the trial. No credit card.'));
  console.log(chalk.gray('   faf.one/pro when you\'re ready.'));
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
  console.log(chalk.white('   bi-sync is free — and always will be.'));
  console.log(chalk.white('   tri-sync Pro adds RAM: your AI remembers across sessions.'));
  console.log();
  console.log(chalk.gray('   $3/mo (a dime a day) · $29/yr (a nickel a day)'));
  console.log(chalk.gray('   A small fee to help us grow and serve you better.'));
  console.log();
  console.log(FAF_COLORS.fafOrange(`   ${FAF_ICONS.trophy} faf.one/pro`));
  console.log(chalk.gray('   Run: faf pro activate <key>'));
  console.log();
}

export function showLicenseActive(): void {
  // Silent on normal use — Pro users shouldn't see noise.
  // Only shown from `faf pro status`.
}

export function showUpgradePrompt(): void {
  console.log();
  console.log(chalk.white('   bi-sync is free forever. tri-sync Pro adds RAM.'));
  console.log(chalk.gray('   $3/mo (a dime a day) · $29/yr (a nickel a day)'));
  console.log(FAF_COLORS.fafOrange(`   ${FAF_ICONS.trophy} faf.one/pro`));
  console.log(chalk.gray('   Run: faf pro activate <key>'));
  console.log();
}
