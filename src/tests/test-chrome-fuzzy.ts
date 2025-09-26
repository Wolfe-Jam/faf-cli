/**
 * Test Chrome Extension fuzzy detection
 */

import { ChromeExtensionDetector } from '../utils/chrome-extension-detector';
import chalk from 'chalk';

console.log(chalk.cyan('🧪 Testing Chrome Extension Fuzzy Detection'));
console.log('=' .repeat(50));

const testCases = [
  // High confidence (should auto-detect)
  'chrome extension',
  'Chrome Extension for tab management',
  'browser extension',
  'chrome addon',

  // Medium confidence (needs confirmation)
  'chr ext',
  'c ext',
  'CE for managing tabs',
  'chrome-ext',
  'chr extension',

  // Typos (should auto-correct)
  'chrom extention',
  'chrome exension',
  'crome extension',
  'chrome extnsion',

  // Low confidence
  'extension',
  'popup manager',
  'browser tool',

  // Spaced patterns
  'c e x t',
  'ch ext',

  // Should NOT detect
  'react app',
  'cli tool',
  'web application'
];

console.log();
for (const testCase of testCases) {
  const result = ChromeExtensionDetector.detect(testCase);

  let icon = '❌';
  let status = 'Not detected';

  if (result.detected) {
    icon = '✅';
    status = `Detected (${result.confidence})`;
  } else if (result.confidence === 'low') {
    icon = '💭';
    status = `Maybe (${result.confidence})`;
  }

  console.log(`${icon} "${testCase}"`);
  console.log(`   → ${status}`);

  if (result.suggestion) {
    console.log(`   → Suggestion: ${result.suggestion}`);
  }

  if (result.needsConfirmation) {
    console.log(chalk.yellow(`   → Needs confirmation: "Did you mean Chrome Extension?"`));
  }

  console.log();
}

// Summary
console.log('=' .repeat(50));
console.log(chalk.green('✅ High Confidence: Auto-accepts Chrome Extension'));
console.log(chalk.yellow('💭 Medium/Low: Asks for confirmation'));
console.log(chalk.blue('🔧 Typos: Auto-corrected'));
console.log(chalk.red('❌ Non-matches: Correctly ignored'));