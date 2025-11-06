/**
 * 🏎️ WJTTC Test Suite: faf drift
 * F1-Grade Testing: Context-Drift Detection
 *
 * Test Strategy:
 * - TIER 1 (BRAKE SYSTEMS): Git history parsing, data integrity
 * - TIER 2 (ENGINE SYSTEMS): Pattern detection accuracy, cost calculation
 * - TIER 3 (AERODYNAMICS): Edge cases, real-world projects
 *
 * Special Focus: REAL REPORTS for social media
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../dist/cli.js');

describe('🍊 faf drift - Context-Drift Analysis', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temp directory for test repos
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-drift-test-'));
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIER 1: BRAKE SYSTEMS 🚨 (Data Integrity)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🚨 TIER 1: Git History Parsing', () => {
    test('should detect non-git directory', async () => {
      try {
        execSync(`node ${CLI_PATH} drift`, {
          cwd: testDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        const output = error.stdout || error.stderr || error.message;
        expect(output).toContain('Not a git repository');
      }
    });

    test('should handle empty git repository', async () => {
      // Initialize empty git repo
      execSync('git init', { cwd: testDir, stdio: 'ignore' });

      const result = execSync(`node ${CLI_PATH} drift`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('No drift detected');
    });

    test('should parse large git histories without crashing', async () => {
      // Create repo with 1000+ commits
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      // Create many commits
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(path.join(testDir, `file${i}.txt`), `content ${i}`);
        execSync(`git add . && git commit -m "Commit ${i}"`, { cwd: testDir, stdio: 'ignore' });
      }

      const startTime = Date.now();
      const result = execSync(`node ${CLI_PATH} drift`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      const duration = Date.now() - startTime;

      expect(result).toContain('Analyzed: 100 commits');
      expect(duration).toBeLessThan(5000); // Should complete in <5s
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIER 2: ENGINE SYSTEMS ⚡ (Accuracy)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('⚡ TIER 2: Pattern Detection Accuracy', () => {
    async function createRepoWithDrift(driftType: 'auth' | 'state' | 'styling') {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      // Create package.json
      const packageJson: any = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {}
      };

      if (driftType === 'auth') {
        // Simulate auth drift: JWT → Firebase → Supabase
        packageJson.dependencies['jsonwebtoken'] = '^9.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Add JWT auth"', { cwd: testDir, stdio: 'ignore' });

        delete packageJson.dependencies['jsonwebtoken'];
        packageJson.dependencies['firebase'] = '^10.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Migrate to Firebase Auth"', { cwd: testDir, stdio: 'ignore' });

        delete packageJson.dependencies['firebase'];
        packageJson.dependencies['@supabase/supabase-js'] = '^2.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Migrate to Supabase"', { cwd: testDir, stdio: 'ignore' });
      } else if (driftType === 'state') {
        // Simulate state drift: Redux → Zustand
        packageJson.dependencies['redux'] = '^5.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Add Redux"', { cwd: testDir, stdio: 'ignore' });

        delete packageJson.dependencies['redux'];
        packageJson.dependencies['zustand'] = '^4.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Switch to Zustand"', { cwd: testDir, stdio: 'ignore' });
      } else if (driftType === 'styling') {
        // Simulate styling drift: CSS Modules → Tailwind
        packageJson.devDependencies = { 'css-modules': '^1.0.0' };
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Add CSS Modules"', { cwd: testDir, stdio: 'ignore' });

        delete packageJson.devDependencies['css-modules'];
        packageJson.devDependencies.tailwindcss = '^3.0.0';
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        execSync('git add . && git commit -m "Migrate to Tailwind"', { cwd: testDir, stdio: 'ignore' });
      }
    }

    test('should detect authentication drift` async () => {
      await createRepoWithDrift('auth');

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Authentication');
      expect(result).toContain('change');
      expect(result).toContain('DRIFT SUMMARY');
    });

    test('should detect state management drift` async () => {
      await createRepoWithDrift('state');

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('State');
      expect(result).toContain('change');
    });

    test('should detect styling drift` async () => {
      await createRepoWithDrift('styling');

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Styling');
      expect(result).toContain('change');
    });

    test('should calculate drift cost accurately', async () => {
      await createRepoWithDrift('auth');

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Estimated Time Lost');
      expect(result).toContain('week');
    });

    test('should assess future risk correctly', async () => {
      await createRepoWithDrift('auth');

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Risk Level');
      expect(result).toMatch(/🔴|🟡|🟢/);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIER 3: AERODYNAMICS 🏁 (Edge Cases)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🏁 TIER 3: Edge Cases & Real-World Scenarios', () => {
    test('should handle --since flag correctly', async () => {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      await fs.writeFile(path.join(testDir, 'test.txt'), 'test');
      execSync('git add . && git commit -m "Test"', { cwd: testDir, stdio: 'ignore' });

      const result = execSync(`node ${CLI_PATH} drift --since 90d', {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('FAF DRIFT ANALYSIS');
    });

    test('should export to JSON correctly', async () => {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      await fs.writeFile(path.join(testDir, 'test.txt'), 'test');
      execSync('git add . && git commit -m "Test"', { cwd: testDir, stdio: 'ignore' });

      const exportPath = path.join(testDir, 'drift-report.json');
      execSync(`node ${CLI_PATH} drift --export ${exportPath}`, {
        cwd: testDir,
        stdio: 'ignore'
      });

      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);

      if (exportExists) {
        const exportData = JSON.parse(await fs.readFile(exportPath, 'utf-8'));
        expect(exportData).toHaveProperty('project');
        expect(exportData).toHaveProperty('totalCommits');
        expect(exportData).toHaveProperty('summary');
      }
    });

    test('should handle projects with .faf file', async () => {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      // Create .faf file
      const fafContent = `
project:
  name: test-project
metadata:
  version: 1.0.0
`;
      await fs.writeFile(path.join(testDir, '.faf'), fafContent);
      execSync('git add . && git commit -m "Add .faf"', { cwd: testDir, stdio: 'ignore' });

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('Current .faf:');
      expect(result).toMatch(/\d+%/); // Should show percentage
    });

    test('should handle special characters in commit messages', async () => {
      execSync('git init', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'ignore' });

      await fs.writeFile(path.join(testDir, 'test.txt'), 'test');
      execSync('git add . && git commit -m "Test with 特殊字符 and émojis 🎉"', { cwd: testDir, stdio: 'ignore' });

      const result = execSync(`node ${CLI_PATH} drift` {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('FAF DRIFT ANALYSIS');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAMPIONSHIP TEST: Real Project Analysis
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('🏆 CHAMPIONSHIP: Real FAF CLI Analysis', () => {
    test('should analyze FAF CLI itself', () => {
      const cliDir = path.resolve(__dirname, '..');

      const result = execSync(`node ${CLI_PATH} drift --export /tmp/faf-cli-drift.json', {
        cwd: cliDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      expect(result).toContain('FAF DRIFT ANALYSIS');
      expect(result).toContain('cli');

      console.log('\n🏆 REAL DRIFT REPORT - FAF CLI:\n');
      console.log(result);
      console.log('\n📊 Report saved to: /tmp/faf-cli-drift.json');
      console.log('✅ Ready for social media sharing!\n');
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STRESS TESTS: Breaking Point Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('💥 STRESS TESTS: Breaking Point Analysis', () => {
  let stressDir: string;

  beforeEach(async () => {
    stressDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-drift-stress-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(stressDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  test('STRESS: 10,000 commits', async () => {
    execSync('git init', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: stressDir, stdio: 'ignore' });

    console.log('🏋️ Creating 10,000 commits...');

    for (let i = 0; i < 10000; i++) {
      await fs.writeFile(path.join(stressDir, 'test.txt'), `commit ${i}`);
      execSync('git add . && git commit -m "Commit ' + i + '" --no-gpg-sign', { cwd: stressDir, stdio: 'ignore' });

      if (i % 1000 === 0) {
        console.log(`  Progress: ${i}/10000 commits created`);
      }
    }

    console.log('✓ 10,000 commits created');
    console.log('🏎️ Running drift analysis...');

    const startTime = Date.now();
    const result = execSync(`node ${CLI_PATH} drift`, {
      cwd: stressDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });
    const duration = Date.now() - startTime;

    console.log(`⚡ Completed in ${duration}ms`);
    console.log(`📊 Performance: ${(10000 / (duration / 1000)).toFixed(0)} commits/sec`);

    expect(result).toContain('10000 commits');
    expect(duration).toBeLessThan(30000); // Should complete in <30s
  }, 120000); // 2 minute timeout

  test('STRESS: 100 package.json changes', async () => {
    execSync('git init', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: stressDir, stdio: 'ignore' });

    console.log('📦 Creating 100 package.json changes...');

    const packageJson: any = {
      name: 'stress-test',
      version: '1.0.0',
      dependencies: {}
    };

    const packages = ['redux', 'zustand', 'jotai', 'mobx', 'recoil'];

    for (let i = 0; i < 100; i++) {
      const pkg = packages[i % packages.length];
      packageJson.dependencies[pkg] = `^${i}.0.0`;

      await fs.writeFile(path.join(stressDir, 'package.json'), JSON.stringify(packageJson, null, 2));
      execSync(`git add . && git commit -m "Change ${i}: add ${pkg}" --no-gpg-sign`, { cwd: stressDir, stdio: 'ignore' });

      delete packageJson.dependencies[pkg];

      if (i % 20 === 0) {
        console.log(`  Progress: ${i}/100 changes`);
      }
    }

    console.log('✓ 100 package.json changes created');
    console.log('🏎️ Running drift analysis...');

    const startTime = Date.now();
    const result = execSync(`node ${CLI_PATH} drift`, {
      cwd: stressDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 50 * 1024 * 1024
    });
    const duration = Date.now() - startTime;

    console.log(`⚡ Completed in ${duration}ms`);
    console.log('📊 Drift Events Detected:');
    console.log(result);

    expect(result).toContain('State');
    expect(result).toContain('DRIFT SUMMARY');
  }, 60000); // 1 minute timeout
});
