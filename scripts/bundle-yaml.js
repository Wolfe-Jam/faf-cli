#!/usr/bin/env node
/**
 * 🍜 YAML BUNDLER SCRIPT - Simple, no webpack needed!
 *
 * This script bundles the yaml package into FAF
 * Run: node scripts/bundle-yaml.js
 */

const fs = require('fs');
const path = require('path');

console.log('🍜 Bundling YAML into FAF...');

// Check if yaml is installed
try {
  require.resolve('yaml');
} catch (e) {
  console.error('❌ yaml package not found. Run: npm install yaml');
  process.exit(1);
}

// Read the entire yaml package
const yamlPath = require.resolve('yaml');
const yamlDir = path.dirname(yamlPath);

// Read the main yaml file
const yamlContent = fs.readFileSync(yamlPath, 'utf8');

// Read package.json to get version
const yamlPkgPath = path.join(yamlDir, '../package.json');
const yamlPkg = JSON.parse(fs.readFileSync(yamlPkgPath, 'utf8'));

// Create our bundled version
const bundledContent = `/**
 * 🍜 BUNDLED YAML v${yamlPkg.version}
 *
 * This is the yaml package bundled directly into FAF
 * No external dependency needed!
 *
 * Original: https://www.npmjs.com/package/yaml
 * Bundled: ${new Date().toISOString()}
 *
 * FAF ADOPTION STATUS: FAMILY MEMBER 🧡
 */

// Check if we're already using the bundled version
if (typeof __FAF_BUNDLED_YAML__ !== 'undefined') {
  module.exports = __FAF_BUNDLED_YAML__;
  return;
}

// Mark as bundled
global.__FAF_BUNDLED_YAML__ = true;

// Try to use installed yaml first (for development)
try {
  if (process.env.NODE_ENV === 'development') {
    module.exports = require('yaml');
    return;
  }
} catch (e) {
  // Fall through to bundled version
}

// START BUNDLED YAML
${yamlContent}
// END BUNDLED YAML

// Export what FAF needs
const yaml = module.exports;
global.__FAF_BUNDLED_YAML__ = yaml;
`;

// Create bundled directory
const bundledDir = path.join(__dirname, '../src/bundled');
if (!fs.existsSync(bundledDir)) {
  fs.mkdirSync(bundledDir, { recursive: true });
}

// Write bundled file
const outputPath = path.join(bundledDir, 'yaml.js');
fs.writeFileSync(outputPath, bundledContent);

console.log(`✅ YAML v${yamlPkg.version} bundled successfully!`);
console.log(`📦 Output: ${outputPath}`);
console.log(`📏 Size: ${Math.round(bundledContent.length / 1024)}KB`);
console.log('\n🍜 YAML is now PART OF FAF! No external dependency needed!');