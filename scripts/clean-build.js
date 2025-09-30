#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Native file cleaning - no glob needed!
function cleanDirectory(dir, extensions) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      cleanDirectory(fullPath, extensions);
    } else if (file.isFile()) {
      if (extensions.some(ext => file.name.endsWith(ext))) {
        try {
          fs.rmSync(fullPath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`Failed to remove ${fullPath}:`, error.message);
            process.exitCode = 1;
          }
        }
      }
    }
  }
}

// Clean generated files
const extensionsToClean = ['.js', '.js.map', '.d.ts', '.d.ts.map'];
cleanDirectory('./src', extensionsToClean);
cleanDirectory('./tests', extensionsToClean);
