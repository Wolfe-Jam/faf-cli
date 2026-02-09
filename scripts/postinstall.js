#!/usr/bin/env node

/**
 * Post-install message: Confirm successful installation
 *
 * Shows clear success message with version and getting started commands.
 */

const packageJson = require('../package.json');

console.log('');
console.log('\x1b[32m✓\x1b[0m faf-cli@' + packageJson.version + ' installed successfully');
console.log('');
console.log('Getting started:');
console.log('  faf init          # Initialize .faf in your project');
console.log('  faf score         # Check AI-readiness (0-100%)');
console.log('');
console.log('Docs: https://faf.one');
console.log('');
