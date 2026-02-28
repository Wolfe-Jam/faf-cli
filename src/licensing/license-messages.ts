/**
 * FAF Pro — User-facing messages
 *
 * All copy in one place. Warm tone, zero pressure.
 *
 * Tagline: Bi-sync is core. Tri-sync adds more.
 */

import { chalk } from '../fix-once/colors';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';

// ---------------------------------------------------------------------------
// Raw message strings (testable without chalk)
// ---------------------------------------------------------------------------

export const MESSAGES = {
  tagline: 'Bi-sync is core. Tri-sync adds more.',

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
  console.log(FAF_COLORS.fafOrange(`   ${MESSAGES.tagline}`));
  console.log();
  console.log(chalk.white('   You\'re using tri-sync right now.'));
  console.log(chalk.white('   It adds RAM to FAF — another sync, this time to Claude\'s session memory.'));
  console.log();
  console.log(chalk.gray('     bi-sync  = ROM (.faf) ↔ CLAUDE.md'));
  console.log(chalk.gray('     tri-sync = ROM ↔ CLAUDE.md ↔ RAM (Claude\'s session memory)'));
  console.log();
  console.log(chalk.white('   bi-sync is also running right now. The stack, the config, the'));
  console.log(chalk.white('   languages — project.faf, exactly the same. Free for all devs, forever.'));
  console.log(chalk.white('   That\'s FAF — persistent project memory.'));
  console.log();
  console.log(chalk.white('   tri-sync is a Pro feature. You\'re trying it free for 14 days.'));
  console.log(chalk.gray('   Let us know what you think.'));
  console.log();
  console.log(chalk.gray('   $3/mo (a dime a day) · $19/yr (a nickel a day)'));
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
  console.log(FAF_COLORS.fafOrange(`   ${MESSAGES.tagline}`));
  console.log();
  console.log(chalk.white('   bi-sync is free — and always will be.'));
  console.log(chalk.white('   tri-sync adds RAM: your AI remembers across sessions.'));
  console.log();
  console.log(chalk.gray('   $3/mo (a dime a day) · $19/yr (a nickel a day)'));
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
  console.log(FAF_COLORS.fafOrange(`   ${MESSAGES.tagline}`));
  console.log(chalk.gray('   $3/mo (a dime a day) · $19/yr (a nickel a day)'));
  console.log(FAF_COLORS.fafOrange(`   ${FAF_ICONS.trophy} faf.one/pro`));
  console.log(chalk.gray('   Run: faf pro activate <key>'));
  console.log();
}
