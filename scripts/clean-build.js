#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patterns = [
  'src/**/*.js',
  'src/**/*.js.map',
  'src/**/*.d.ts',
  'src/**/*.d.ts.map',
  'tests/**/*.js',
  'tests/**/*.js.map',
  'tests/**/*.d.ts',
  'tests/**/*.d.ts.map'
];

const seen = new Set();
for (const pattern of patterns) {
  const matches = glob.sync(pattern, { absolute: true, nodir: true });
  for (const file of matches) {
    if (seen.has(file)) continue;
    try {
      fs.rmSync(file);
      seen.add(file);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to remove ${file}:`, error.message);
        process.exitCode = 1;
      }
    }
  }
}
