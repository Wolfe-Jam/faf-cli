#!/usr/bin/env node
/**
 * Sync version from package.json to project.faf
 * Run: npm run sync-version
 * Auto-runs on: npm version (via "version" lifecycle hook)
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const projectFafPath = path.join(__dirname, '..', 'project.faf');

try {
  // Read version from package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  // Read project.faf
  let projectFaf = fs.readFileSync(projectFafPath, 'utf-8');

  // Update version field
  projectFaf = projectFaf.replace(
    /^(\s*version:\s*).+$/m,
    `$1${version}`
  );

  // Write back
  fs.writeFileSync(projectFafPath, projectFaf);

  console.log(`Synced project.faf version to ${version}`);
} catch (error) {
  console.error('Failed to sync version:', error.message);
  process.exit(1);
}
