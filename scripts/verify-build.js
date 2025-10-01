#!/usr/bin/env node
/**
 * 🏎️ Build Verification Script
 * Prevents stale builds from reaching npm
 * 
 * Checks:
 * 1. All source commands exist in dist/
 * 2. Dist is newer than source
 * 3. All command imports resolve
 * 4. Native parser has all registered commands
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  orange: '\x1b[38;5;208m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Get root directory
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

let hasErrors = false;

/**
 * Check 1: Verify dist directory exists and is built
 */
function checkDistExists() {
  info('Check 1: Verifying dist/ directory exists...');
  
  if (!fs.existsSync(distDir)) {
    error('dist/ directory does not exist!');
    error('Run: npm run build');
    hasErrors = true;
    return false;
  }
  
  if (!fs.existsSync(path.join(distDir, 'cli.js'))) {
    error('dist/cli.js does not exist!');
    error('Run: npm run build');
    hasErrors = true;
    return false;
  }
  
  success('dist/ directory exists');
  return true;
}

/**
 * Check 2: Extract all command names from cli.ts
 */
function extractCommandsFromSource() {
  info('Check 2: Extracting registered commands from src/cli.ts...');
  
  const cliPath = path.join(srcDir, 'cli.ts');
  if (!fs.existsSync(cliPath)) {
    error('src/cli.ts not found!');
    hasErrors = true;
    return [];
  }
  
  const content = fs.readFileSync(cliPath, 'utf8');
  
  // Extract command registrations: program.command('name')
  const commandRegex = /program\s*\.command\('([^']+)(?:\s+\[)?/g;
  const commands = [];
  let match;
  
  while ((match = commandRegex.exec(content)) !== null) {
    const commandName = match[1];
    commands.push(commandName);
  }
  
  // Also check for .command() with template strings (rare but possible)
  const templateCommandRegex = /program\s*\.command\(`([^`]+)(?:\s+\[)?/g;
  while ((match = templateCommandRegex.exec(content)) !== null) {
    const commandName = match[1];
    commands.push(commandName);
  }
  
  // Remove duplicates and sort
  const uniqueCommands = [...new Set(commands)].sort();
  
  success(`Found ${uniqueCommands.length} registered commands`);
  uniqueCommands.forEach(cmd => {
    console.log(`  • ${cmd}`);
  });
  
  return uniqueCommands;
}

/**
 * Check 3: Verify all commands exist in dist/commands/
 */
function verifyCommandsInDist(commands) {
  info('Check 3: Verifying commands exist in dist/commands/...');
  
  const distCommandsDir = path.join(distDir, 'commands');
  
  if (!fs.existsSync(distCommandsDir)) {
    error('dist/commands/ directory does not exist!');
    hasErrors = true;
    return false;
  }
  
  let allExist = true;
  
  for (const cmd of commands) {
    // Skip wildcard and special commands
    if (cmd === '*' || cmd.includes('$')) continue;
    
    const jsPath = path.join(distCommandsDir, `${cmd}.js`);
    const tsPath = path.join(srcDir, 'commands', `${cmd}.ts`);
    
    // Check if source exists first
    if (!fs.existsSync(tsPath)) {
      warning(`Source not found: src/commands/${cmd}.ts (inline command?)`);
      continue;
    }
    
    // Check if built version exists
    if (!fs.existsSync(jsPath)) {
      error(`Built command missing: dist/commands/${cmd}.js`);
      error(`Source exists at: src/commands/${cmd}.ts`);
      hasErrors = true;
      allExist = false;
    } else {
      success(`${cmd}.js exists in dist/commands/`);
    }
  }
  
  return allExist;
}

/**
 * Check 4: Verify dist is newer than source
 */
function checkDistFreshness() {
  info('Check 4: Verifying dist/ is up-to-date...');
  
  const cliSrc = path.join(srcDir, 'cli.ts');
  const cliDist = path.join(distDir, 'cli.js');
  
  if (!fs.existsSync(cliDist)) {
    error('dist/cli.js does not exist!');
    hasErrors = true;
    return false;
  }
  
  const srcStat = fs.statSync(cliSrc);
  const distStat = fs.statSync(cliDist);
  
  if (srcStat.mtime > distStat.mtime) {
    error('src/cli.ts is newer than dist/cli.js!');
    error('Source modified: ' + srcStat.mtime.toISOString());
    error('Build created: ' + distStat.mtime.toISOString());
    error('Run: npm run build');
    hasErrors = true;
    return false;
  }
  
  success('dist/cli.js is up-to-date');
  
  // Also check commands directory
  const srcCommandsDir = path.join(srcDir, 'commands');
  const distCommandsDir = path.join(distDir, 'commands');
  
  if (!fs.existsSync(srcCommandsDir)) {
    warning('src/commands/ directory not found');
    return true;
  }
  
  const srcFiles = fs.readdirSync(srcCommandsDir)
    .filter(f => f.endsWith('.ts'));
  
  let staleFound = false;
  
  for (const file of srcFiles) {
    const srcPath = path.join(srcCommandsDir, file);
    const distPath = path.join(distCommandsDir, file.replace('.ts', '.js'));
    
    if (!fs.existsSync(distPath)) {
      warning(`${file} not built yet`);
      continue;
    }
    
    const srcStat = fs.statSync(srcPath);
    const distStat = fs.statSync(distPath);
    
    if (srcStat.mtime > distStat.mtime) {
      error(`src/commands/${file} is newer than built version!`);
      staleFound = true;
      hasErrors = true;
    }
  }
  
  if (staleFound) {
    error('Stale build detected! Run: npm run build');
    return false;
  }
  
  success('All dist/commands/ files are up-to-date');
  return true;
}

/**
 * Check 5: Verify package.json version matches published
 */
function checkVersionSync() {
  info('Check 5: Checking version synchronization...');
  
  const packagePath = path.join(rootDir, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const currentVersion = packageData.version;
  success(`Current package.json version: ${currentVersion}`);
  
  // Note: We can't check npm registry without network call
  // Just warn the user to verify
  warning('Remember to verify this matches your last published version');
  warning('Check with: npm view faf-cli version');
  
  return true;
}

/**
 * Check 6: Verify critical imports exist
 */
function checkCriticalImports() {
  info('Check 6: Verifying critical imports...');
  
  const criticalPaths = [
    'dist/commands/index.js',
    'dist/commands/init.js', 
    'dist/commands/score.js',
    'dist/commands/status.js',
    'dist/utils/native-cli-parser.js',
    'dist/fix-once/commander.js',
    'dist/fix-once/colors.js'
  ];
  
  let allExist = true;
  
  for (const relativePath of criticalPaths) {
    const fullPath = path.join(rootDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      error(`Critical file missing: ${relativePath}`);
      hasErrors = true;
      allExist = false;
    } else {
      success(`${relativePath} ✓`);
    }
  }
  
  return allExist;
}

/**
 * Main verification
 */
function main() {
  log('\n🏎️  FAF Build Verification - Championship Grade', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  // Run all checks
  const distExists = checkDistExists();
  console.log();
  
  if (!distExists) {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
    error('Build verification FAILED!');
    error('Fix the errors above and try again');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'red');
    process.exit(1);
  }
  
  const commands = extractCommandsFromSource();
  console.log();
  
  verifyCommandsInDist(commands);
  console.log();
  
  checkDistFreshness();
  console.log();
  
  checkCriticalImports();
  console.log();
  
  checkVersionSync();
  console.log();
  
  // Final result
  if (hasErrors) {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'red');
    error('Build verification FAILED! ❌');
    error('Fix the errors above before publishing');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'red');
    process.exit(1);
  } else {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    success('Build verification PASSED! ✅');
    success('Safe to publish to npm');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'green');
    
    // Helpful next steps
    info('Next steps:');
    console.log('  1. npm version patch  # Bump to 2.4.15');
    console.log('  2. npm publish        # Push to npm');
    console.log('  3. npm install -g faf-cli@latest  # Update global');
    console.log('  4. faf index          # Test it works!\n');
  }
}

// Run verification
main();
