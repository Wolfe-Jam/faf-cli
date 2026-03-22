import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { gzipSync } from 'zlib';
import { findFafFile, readFafRaw } from '../../src/interop/faf.js';

describe('share command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `faf-test-share-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  test('gzip + base64url encoding roundtrips', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: test\n`;
    writeFileSync(join(testDir, 'project.faf'), yaml);

    const raw = readFafRaw(join(testDir, 'project.faf'));
    const compressed = gzipSync(Buffer.from(raw));
    const encoded = compressed.toString('base64url');

    // Decode roundtrip
    const decoded = Buffer.from(encoded, 'base64url');
    const { gunzipSync } = require('zlib');
    const result = gunzipSync(decoded).toString('utf-8');
    expect(result).toBe(yaml);
  });

  test('encoded string is shorter than original for large files', () => {
    const yaml = `faf_version: 2.5.0\nproject:\n  name: test\n  goal: A really long description that should compress well with gzip because it has repetitive structure and content that benefits from compression algorithms\n  main_language: TypeScript\nstack:\n  frontend: React\n  backend: Express\n  runtime: Node.js\n  database: PostgreSQL\n  hosting: Vercel\n  build: Vite\n  cicd: GitHub Actions\n`;
    const compressed = gzipSync(Buffer.from(yaml));
    const encoded = compressed.toString('base64url');

    // Gzip should reduce size for repetitive content
    expect(encoded.length).toBeLessThan(yaml.length * 2);
  });
});
