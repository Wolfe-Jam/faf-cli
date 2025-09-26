#!/usr/bin/env ts-node

import { FileSystemCache } from './src/utils/filesystem-cache';
import * as fs from 'fs';

// Create test file
const testFile = '/tmp/test.txt';
fs.writeFileSync(testFile, 'x'.repeat(1000000)); // 1MB file

console.log('Testing cache size enforcement:\n');

// Create small cache (500KB)
const cache = new FileSystemCache({ ttl: 60000, maxSize: 500 * 1024 });

console.log('Cache limit: 500KB');
console.log('File size: 1000KB (1MB)');
console.log('\nTrying to cache a file larger than cache limit...\n');

// Try to cache file larger than limit
(async () => {
  await cache.readFile(testFile);

  const stats = cache.getStats();
console.log('Result:');
console.log(`  Cache size: ${(stats.size / 1024).toFixed(2)}KB`);
console.log(`  Should be: <= 500KB`);
console.log(`  Actual: ${stats.size > 500 * 1024 ? '❌ EXCEEDS LIMIT' : '✅ Within limit'}`);

  // The issue: If file > maxSize, it still gets cached!
  console.log('\nRoot cause: Cache accepts files larger than maxSize');
  console.log('Solution needed: Reject files > maxSize or don\'t cache them');
})();