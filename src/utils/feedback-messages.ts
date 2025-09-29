/**
 * 🩵 FAF Feedback Messages - Humble & Grateful
 * We only collect stars we deserve
 */

import chalk from 'chalk';

// FAF Cyan color
const fafCyan = chalk.hex('#0CC0DF');

export function getThankYouMessage(score?: number): string {
  if (score && score >= 85) {
    return `
${fafCyan('─'.repeat(60))}
Thanks for using FAF! 🩵⚡

${chalk.dim('🩵 If you feel FAF deserves a star, it really helps:')}
${chalk.dim('   https://github.com/Wolfe-Jam/faf ⭐')}

${chalk.dim('We only collect stars we deserve.')}
${fafCyan('─'.repeat(60))}`;
  }

  return `
${chalk.dim('─'.repeat(40))}
${chalk.dim('Thanks for using FAF 🩵')}
${chalk.dim('─'.repeat(40))}`;
}

export function getFeedbackPrompt(): string {
  return `
🩵 Tell us how to improve FAF:
${fafCyan('https://github.com/Wolfe-Jam/faf/discussions')}
${chalk.dim('All feedback is read, considered & replied to.')}
`;
}

export function getSuccessMessage(command: string): string {
  return `
✅ ${command} successful!

${chalk.dim('─'.repeat(50))}
${chalk.dim('Thank you for using FAF! 🩵📺')}

${chalk.dim('💬 Tell us how to improve:')}
${chalk.dim('   https://github.com/Wolfe-Jam/faf/discussions')}
${chalk.dim('   All feedback is read, considered & replied to.')}

${chalk.dim('⭐ If you feel we deserve it:')}
${chalk.dim('   https://github.com/Wolfe-Jam/faf')}
${chalk.dim('   Stars really help us continue. 🩵')}
${chalk.dim('─'.repeat(50))}
`;
}

export function getHighScoreMessage(score: number): string {
  const emojis = score >= 99 ? '🏁⚡' : score >= 90 ? '🏎️⚡' : '✨⚡';

  return `
${fafCyan('═'.repeat(60))}
${fafCyan(`Amazing! You reached ${score}% ${emojis}`)}

🩵 Your success makes FAF better for everyone!

${chalk.dim('If you feel we\'ve earned it: https://github.com/Wolfe-Jam/faf ⭐')}
${chalk.dim('We only collect stars we deserve.')}
${fafCyan('═'.repeat(60))}
`;
}

export function getWelcomeMessage(): string {
  return `
${fafCyan('Welcome to FAF! 🩵⚡📺')}

${chalk.dim('FAF = Fast AI Format')}
${chalk.dim('Making AI context simple, fast & trustworthy')}

${chalk.dim('All feedback welcome: https://github.com/Wolfe-Jam/faf/discussions')}
${chalk.dim('Thank you for trying FAF!')}
`;
}

export function getErrorHelpMessage(): string {
  return `
${chalk.dim('─'.repeat(50))}
${chalk.yellow('Need help with this error?')}

🩵 We respond to all discussions within 24 hours:
   ${fafCyan('https://github.com/Wolfe-Jam/faf/discussions')}

${chalk.dim('Your feedback helps us improve FAF for everyone.')}
${chalk.dim('Thank you for your patience! 📺')}
${chalk.dim('─'.repeat(50))}
`;
}

// Show gratitude after N successful commands
export function getMilestoneMessage(commandCount: number): string {
  if (commandCount === 10) {
    return `
${fafCyan('─'.repeat(60))}
🩵 You've run FAF ${commandCount} times! Thank you for being a regular user!

Your experience matters to us.
How can we make FAF better for you?
${fafCyan('https://github.com/Wolfe-Jam/faf/discussions')}

${chalk.dim('We only collect stars we deserve.')}
${chalk.dim('If you feel we\'ve earned one: https://github.com/Wolfe-Jam/faf ⭐')}
${fafCyan('─'.repeat(60))}
`;
  }

  return '';
}

export const FOOTER_SIGNATURE = chalk.dim(`
Thanks for using FAF 🩵⚡
Feedback always welcome 📺
`);