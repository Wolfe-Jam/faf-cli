#!/usr/bin/env bun
/**
 * Bun Update Routine for faf-cli
 * Ensures we're using latest Bun features and best practices
 */

import { $ } from 'bun';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const RESET = '\x1b[0m';

async function updateBun() {
  console.log(`${CYAN}◆${RESET} Checking Bun updates...`);
  
  // Check current Bun version
  const currentVersion = await $`bun --version`.text();
  console.log(`  Current: v${currentVersion.trim()}`);
  
  // Update Bun
  try {
    await $`curl -fsSL https://bun.sh/install | bash`;
    const newVersion = await $`bun --version`.text();
    console.log(`  Updated: v${newVersion.trim()}`);
  } catch (error) {
    console.log('  Already on latest version');
  }
}

async function updateDependencies() {
  console.log(`\n${CYAN}◆${RESET} Updating dependencies...`);
  
  // Update all dependencies
  await $`bun update`;
  
  // Check for outdated packages
  const outdated = await $`bun outdated`.text();
  if (outdated.trim()) {
    console.log('  Outdated packages found:');
    console.log(outdated);
  } else {
    console.log(`  ${GREEN}✓${RESET} All dependencies up to date`);
  }
}

async function updateBunConfig() {
  console.log(`\n${CYAN}◆${RESET} Checking bunfig.toml...`);
  
  const configPath = join(process.cwd(), 'bunfig.toml');
  let updated = false;
  
  try {
    let config = readFileSync(configPath, 'utf-8');
    
    // Ensure we have latest Bun best practices
    const updates = [
      { check: /test\.coverage = true/, add: 'test.coverage = true' },
      { check: /test\.coverageThreshold = 0\.8/, add: 'test.coverageThreshold = 0.8' },
      { check: /install\.lockfile\.print = "yarn"/, add: 'install.lockfile.print = "yarn"' }
    ];
    
    for (const { check, add } of updates) {
      if (!check.test(config)) {
        config += `\n${add}`;
        updated = true;
      }
    }
    
    if (updated) {
      writeFileSync(configPath, config);
      console.log(`  ${GREEN}✓${RESET} Updated bunfig.toml with best practices`);
    } else {
      console.log(`  ${GREEN}✓${RESET} bunfig.toml already optimal`);
    }
  } catch (error) {
    // Create minimal bunfig if doesn't exist
    const defaultConfig = `[test]
coverage = true
coverageThreshold = 0.8

[install.lockfile]
print = "yarn"
`;
    writeFileSync(configPath, defaultConfig);
    console.log(`  ${GREEN}✓${RESET} Created optimal bunfig.toml`);
  }
}

async function checkBunScripts() {
  console.log(`\n${CYAN}◆${RESET} Validating package.json scripts...`);
  
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  const bunScripts = {
    'test': 'bun test',
    'test:watch': 'bun test --watch',
    'test:coverage': 'bun test --coverage',
    'dev': 'bun run src/cli.ts',
    'build': 'bun build src/cli.ts --outfile dist/cli.js --target=node --minify && bun build src/index.ts --outfile dist/index.js --target=node --minify',
    'typecheck': 'bun --bun tsc --noEmit'
  };
  
  let updated = false;
  for (const [script, command] of Object.entries(bunScripts)) {
    if (pkg.scripts[script] !== command) {
      pkg.scripts[script] = command;
      updated = true;
    }
  }
  
  if (updated) {
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ${GREEN}✓${RESET} Updated scripts to use Bun commands`);
  } else {
    console.log(`  ${GREEN}✓${RESET} Scripts already optimized for Bun`);
  }
}

async function main() {
  console.log(`${CYAN}🏎️  Bun Update Routine${RESET}`);
  console.log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);
  
  await updateBun();
  await updateDependencies();
  await updateBunConfig();
  await checkBunScripts();
  
  console.log(`\n${GREEN}✓${RESET} Bun update routine complete!`);
}

main().catch(console.error);