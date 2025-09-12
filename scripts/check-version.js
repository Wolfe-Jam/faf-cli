#!/usr/bin/env node

/**
 * 🔍 Version Check Script - Ensures version consistency before commits
 * Run automatically in pre-commit hook
 */

const fs = require('fs');
const path = require('path');

function checkVersionConsistency() {
  console.log('🔍 Checking version consistency...');
  
  // Get package.json version
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const packageVersion = packageJson.version;
  
  console.log(`📦 Package version: ${packageVersion}`);
  
  // Check championship-style.ts
  const championshipPath = path.join(__dirname, '..', 'src', 'utils', 'championship-style.ts');
  const championshipContent = fs.readFileSync(championshipPath, 'utf8');
  
  // Extract version from ASCII art
  const asciiMatch = championshipContent.match(/🏎️⚡️🏁\s+v(\d+\.\d+\.\d+)/);
  const asciiVersion = asciiMatch ? asciiMatch[1] : null;
  
  // Extract version from comments
  const commentMatch = championshipContent.match(/FAF CLI v(\d+\.\d+\.\d+)/);
  const commentVersion = commentMatch ? commentMatch[1] : null;
  
  let hasErrors = false;
  
  // Check ASCII art version
  if (asciiVersion !== packageVersion) {
    console.error(`❌ Version mismatch in championship-style.ts ASCII art:`);
    console.error(`   Package.json: ${packageVersion}`);
    console.error(`   ASCII art:    ${asciiVersion || 'NOT FOUND'}`);
    hasErrors = true;
  } else {
    console.log(`✅ ASCII art version matches: v${asciiVersion}`);
  }
  
  // Check comment version
  if (commentVersion !== packageVersion) {
    console.error(`❌ Version mismatch in championship-style.ts comments:`);
    console.error(`   Package.json: ${packageVersion}`);
    console.error(`   Comment:      ${commentVersion || 'NOT FOUND'}`);
    hasErrors = true;
  } else {
    console.log(`✅ Comment version matches: v${commentVersion}`);
  }
  
  // Check CLI --version output (if built)
  const cliBinPath = path.join(__dirname, '..', 'dist', 'cli.js');
  if (fs.existsSync(cliBinPath)) {
    try {
      const { execSync } = require('child_process');
      const cliVersion = execSync('node dist/cli.js --version', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      }).trim();
      
      if (cliVersion !== packageVersion) {
        console.error(`❌ CLI --version output mismatch:`);
        console.error(`   Package.json: ${packageVersion}`);
        console.error(`   CLI output:   ${cliVersion}`);
        console.error(`   💡 Run: npm run build`);
        hasErrors = true;
      } else {
        console.log(`✅ CLI version output matches: ${cliVersion}`);
      }
    } catch (error) {
      console.warn('⚠️  Could not check CLI version (build may be needed)');
    }
  }
  
  if (hasErrors) {
    console.error('\n❌ Version inconsistencies detected!');
    console.error('💡 Fix: npm run version:update ' + packageVersion);
    process.exit(1);
  } else {
    console.log('\n✅ All version references are consistent!');
  }
}

checkVersionConsistency();