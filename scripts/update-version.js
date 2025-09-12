#!/usr/bin/env node

/**
 * 🏎️ Version Update Script - Ensures all version references stay synchronized
 * Run this BEFORE committing any version changes
 * Usage: npm run version:update 2.8.0
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const VERSION_PATTERN = /v?\d+\.\d+\.\d+/g;

// Files that should always have the latest version
const VERSION_FILES = [
  {
    path: 'package.json',
    pattern: /"version":\s*"[\d.]+"/,
    replacement: (version) => `"version": "${version}"`
  },
  {
    path: 'src/utils/championship-style.ts',
    patterns: [
      {
        pattern: /FAF CLI v\d+\.\d+\.\d+/g,
        replacement: (version) => `FAF CLI v${version}`
      },
      {
        pattern: /🏎️⚡️🏁\s+v\d+\.\d+\.\d+/g,
        replacement: (version) => `🏎️⚡️🏁  v${version}`
      },
      {
        pattern: /\(v\d+\.\d+\.\d+ [^)]+\)/g,
        replacement: (version) => `(v${version} White Stripe Edition)`
      }
    ]
  }
];

// Files that should keep their specific version references (schemas, etc.)
const IGNORE_PATTERNS = [
  'tests/**/*.test.ts',
  '**/node_modules/**',
  'dist/**',
  '*.md' // Documentation can reference old versions
];

function updateVersion(newVersion) {
  if (!newVersion || !newVersion.match(/^\d+\.\d+\.\d+$/)) {
    console.error('❌ Invalid version format. Use: X.Y.Z (e.g., 2.8.0)');
    process.exit(1);
  }

  console.log(`🏎️ Updating all version references to v${newVersion}...`);
  
  let updatedFiles = [];
  
  VERSION_FILES.forEach(file => {
    const filePath = path.join(__dirname, '..', file.path);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${file.path}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    if (file.pattern) {
      // Single pattern
      const newContent = content.replace(file.pattern, file.replacement(newVersion));
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    } else if (file.patterns) {
      // Multiple patterns
      file.patterns.forEach(patternObj => {
        const newContent = content.replace(patternObj.pattern, patternObj.replacement(newVersion));
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      updatedFiles.push(file.path);
      console.log(`✅ Updated: ${file.path}`);
    }
  });
  
  // Check for any remaining old versions in critical files
  console.log('\n🔍 Checking for stray version references...');
  
  const criticalFiles = glob.sync('src/**/*.ts', {
    ignore: IGNORE_PATTERNS,
    cwd: path.join(__dirname, '..')
  });
  
  let strayVersions = [];
  
  criticalFiles.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const matches = content.match(/v2\.\d+\.\d+/g);
    
    if (matches) {
      const nonCurrentVersions = matches.filter(v => {
        const version = v.replace('v', '');
        return version !== newVersion && !isSchemaVersion(version);
      });
      
      if (nonCurrentVersions.length > 0) {
        strayVersions.push({
          file,
          versions: [...new Set(nonCurrentVersions)]
        });
      }
    }
  });
  
  if (strayVersions.length > 0) {
    console.log('\n⚠️  Found stray version references (review these manually):');
    strayVersions.forEach(item => {
      console.log(`   ${item.file}: ${item.versions.join(', ')}`);
    });
  } else {
    console.log('✅ No stray version references found!');
  }
  
  console.log(`\n🏁 Version update complete! Now at v${newVersion}`);
  console.log('📝 Remember to:');
  console.log('   1. Run: npm run build');
  console.log('   2. Test: npm test');
  console.log('   3. Commit with message: "chore: bump version to v' + newVersion + '"');
}

function isSchemaVersion(version) {
  // These are schema versions that shouldn't change automatically
  const schemaVersions = ['2.4.0', '2.5.0'];
  return schemaVersions.includes(version);
}

// Get version from command line
const newVersion = process.argv[2];
updateVersion(newVersion);