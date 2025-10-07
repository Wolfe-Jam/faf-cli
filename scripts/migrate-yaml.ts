#!/usr/bin/env ts-node
/**
 * 🔥 ROCK SOLID YAML FIX - Automated Migration
 * FIX ONCE, DONE FOREVER
 *
 * This script migrates ALL yaml imports to use fix-once/yaml
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src');

function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

interface MigrationResult {
  file: string;
  changed: boolean;
  errors: string[];
}

function getRelativeImportPath(filePath: string): string {
  // Get relative path from file to src/fix-once/yaml
  const fileDir = path.dirname(filePath);
  const targetPath = path.join(SRC_DIR, 'fix-once', 'yaml');
  const relativePath = path.relative(fileDir, targetPath);

  // Convert to Unix-style path for imports
  return relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
}

function migrateFile(filePath: string): MigrationResult {
  const result: MigrationResult = {
    file: filePath,
    changed: false,
    errors: []
  };

  // Skip the fix-once/yaml.ts file itself
  if (filePath.includes('fix-once/yaml.ts')) {
    return result;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Calculate correct relative path
  const relativePath = getRelativeImportPath(filePath);

  // Pattern 1: import * as YAML from 'yaml'
  content = content.replace(
    /import \* as YAML from ['"]yaml['"]/g,
    `import { parse as parseYAML, stringify as stringifyYAML } from '${relativePath}'`
  );

  // Pattern 2: import * as yaml from 'yaml'
  content = content.replace(
    /import \* as yaml from ['"]yaml['"]/g,
    `import { parse as parseYAML, stringify as stringifyYAML } from '${relativePath}'`
  );

  // Pattern 3: import yaml from 'yaml'
  content = content.replace(
    /import yaml from ['"]yaml['"]/g,
    `import { parse as parseYAML, stringify as stringifyYAML } from '${relativePath}'`
  );

  // Pattern 4: import { parse, stringify } from 'yaml'
  content = content.replace(
    /import { parse, stringify } from ['"]yaml['"]/g,
    `import { parse as parseYAML, stringify as stringifyYAML } from '${relativePath}'`
  );

  // Replace usage patterns (basic - may need manual fixes)
  content = content.replace(/YAML\.parse\(/g, 'parseYAML(');
  content = content.replace(/yaml\.parse\(/g, 'parseYAML(');
  content = content.replace(/YAML\.stringify\(/g, 'stringifyYAML(');
  content = content.replace(/yaml\.stringify\(/g, 'stringifyYAML(');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    result.changed = true;
  }

  return result;
}

// Find all TypeScript files
const files = getAllTypeScriptFiles(SRC_DIR);

console.log('🔥 ROCK SOLID YAML MIGRATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Found ${files.length} TypeScript files`);
console.log('');

const results: MigrationResult[] = [];
let changedCount = 0;

for (const file of files) {
  const result = migrateFile(file);
  if (result.changed) {
    console.log(`✅ ${file.replace(SRC_DIR, 'src')}`);
    changedCount++;
  }
  results.push(result);
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Migration complete: ${changedCount} files updated`);
console.log('');
console.log('⚠️  NEXT STEPS (Manual):');
console.log('   1. Search for parseYAML( calls');
console.log('   2. Add { filepath: <path> } option where appropriate');
console.log('   3. Example: parseYAML(content, { filepath: fafPath })');
console.log('   4. Run: npm test to verify');
console.log('');
console.log('🏎️ YAML IS NOW ROCK SOLID - FIX ONCE, DONE FOREVER');
