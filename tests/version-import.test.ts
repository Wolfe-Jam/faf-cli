import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Version Import (WJTTC)', () => {
  test('version is imported from package.json, not hardcoded', () => {
    const cliContent = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');
    
    // Should NOT have hardcoded version
    expect(cliContent).not.toMatch(/const VERSION = ['"`]6\./);
    expect(cliContent).not.toMatch(/const version = ['"`]6\./);
    
    // Should have proper import from package.json
    expect(cliContent).toContain('readFileSync');
    expect(cliContent).toContain('package.json');
    expect(cliContent).toContain('JSON.parse');
    expect(cliContent).toMatch(/const \{ version \}/);
  });

  test('CLI version matches package.json version', async () => {
    const { spawn } = require('child_process');
    
    // Get version from package.json
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    const expectedVersion = pkg.version;
    
    // Get version from CLI
    const result = await new Promise<string>((resolve, reject) => {
      const proc = spawn('node', [join(__dirname, '../dist/cli.js'), '--version'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      proc.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      
      proc.on('close', (code: number) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`CLI exited with code ${code}`));
        }
      });
      
      proc.on('error', reject);
    });
    
    expect(result).toBe(expectedVersion);
  });

  test('no hardcoded versions in any source files', () => {
    const checkFile = (file: string) => {
      const content = readFileSync(file, 'utf-8');
      
      // Allow version in package.json itself and test files
      if (file.includes('package.json') || file.includes('.test.ts')) {
        return;
      }
      
      // No hardcoded 6.x.x versions in source
      expect(content).not.toMatch(/['"`]6\.\d+\.\d+['"`]/);
      expect(content).not.toMatch(/version.*=.*['"`]6\./);
    };
    
    const findFiles = (dir: string, ext: string): string[] => {
      const results: string[] = [];
      try {
        const { readdirSync } = require('fs');
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            results.push(...findFiles(full, ext));
          } else if (entry.name.endsWith(ext)) {
            results.push(full);
          }
        }
      } catch {}
      return results;
    };
    
    const srcFiles = findFiles(join(__dirname, '../src'), '.ts');
    expect(srcFiles.length).toBeGreaterThan(0);
    
    for (const file of srcFiles) {
      checkFile(file);
    }
  });
});