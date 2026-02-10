#!/usr/bin/env node

/**
 * Post-install message: Confirm successful installation
 *
 * Shows clear success message with version and getting started commands.
 *
 * Writes directly to /dev/tty to bypass npm output suppression.
 */

const packageJson = require('../package.json');
const fs = require('fs');

const message = `
\x1b[32m✓\x1b[0m faf-cli@${packageJson.version} installed successfully

Getting started:
  faf init          # Initialize .faf in your project
  faf score         # Check AI-readiness (0-100%)

Docs: https://faf.one
`;

try {
  // Write directly to terminal, bypassing npm's output suppression
  fs.writeSync(fs.openSync('/dev/tty', 'w'), message);
} catch (e) {
  // Fallback to stderr if /dev/tty not available (Windows, etc.)
  console.error(message);
}
