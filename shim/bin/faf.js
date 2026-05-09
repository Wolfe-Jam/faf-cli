#!/usr/bin/env node

/**
 * FAF — Foundational AI-context Format
 * IANA-registered: application/vnd.faf+yaml
 *
 * Thin alias for `faf-cli`. Resolves the canonical CLI at install time
 * (via `faf-cli: latest` dependency) and forwards user args through.
 *
 * Install: bunx faf | npx faf | npm install -g faf
 * Usage:   faf | faf init | faf auto | faf go | faf wjttc | ...
 *
 * Canonical CLI:  https://npmjs.com/package/faf-cli
 * Spec:           https://faf.one
 * Bugs:           https://github.com/Wolfe-Jam/faf-cli/issues
 */

const { execFileSync } = require('child_process');
const path = require('path');

// Resolve faf-cli's main, then swap index.js for cli.js
const mainEntry = require.resolve('faf-cli');
const cliEntry = path.join(path.dirname(mainEntry), 'cli.js');

try {
  execFileSync(process.execPath, [cliEntry, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
