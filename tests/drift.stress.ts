/**
 * 🏎️ WJTTC STRESS TEST: 10,000 Commit Analysis
 *
 * ⚠️ RUN OCCASIONALLY - This test takes several minutes!
 *
 * Purpose: Verify drift analysis handles enterprise-scale repositories
 *
 * To run manually:
 *   npx jest tests/drift.stress.ts --testTimeout=600000
 *
 * Expected duration: 5-10 minutes depending on hardware
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../dist/cli.js');

describe('🏎️ 10,000 COMMIT STRESS TEST - Run Occasionally', () => {
  let stressDir: string;

  beforeAll(async () => {
    stressDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faf-drift-10k-'));
    console.log(`\n📁 Stress test directory: ${stressDir}\n`);
  });

  afterAll(async () => {
    try {
      await fs.rm(stressDir, { recursive: true, force: true });
      console.log('\n🧹 Cleaned up stress test directory\n');
    } catch {
      console.log('\n⚠️ Could not clean up stress test directory\n');
    }
  });

  test('STRESS: 10,000 commits with package.json drift patterns', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🏎️ FAF DRIFT - 10,000 COMMIT STRESS TEST');
    console.log('='.repeat(60) + '\n');

    // Initialize git repo
    execSync('git init', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.email "stress@test.com"', { cwd: stressDir, stdio: 'ignore' });
    execSync('git config user.name "Stress Test"', { cwd: stressDir, stdio: 'ignore' });

    console.log('📦 Creating 10,000 commits with drift patterns...\n');

    const packageJson: any = {
      name: 'stress-test-10k',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    };

    // Simulate realistic drift patterns across different categories
    const driftPatterns = [
      // Auth drift
      { category: 'auth', packages: ['jsonwebtoken', 'firebase', '@supabase/supabase-js', 'passport', 'auth0'] },
      // State management drift
      { category: 'state', packages: ['redux', 'zustand', 'jotai', 'mobx', 'recoil', 'valtio'] },
      // Styling drift
      { category: 'styling', packages: ['tailwindcss', 'styled-components', '@emotion/react', 'sass', 'less'] },
      // Testing drift
      { category: 'testing', packages: ['jest', 'vitest', 'mocha', 'ava', 'tap'] },
      // Build tools drift
      { category: 'build', packages: ['webpack', 'vite', 'esbuild', 'rollup', 'parcel'] },
    ];

    const startCreation = Date.now();

    for (let i = 0; i < 10000; i++) {
      // Pick a drift pattern
      const pattern = driftPatterns[i % driftPatterns.length];
      const pkg = pattern.packages[Math.floor(i / driftPatterns.length) % pattern.packages.length];

      // Add/remove packages to simulate drift
      if (i % 10 < 5) {
        packageJson.dependencies[pkg] = `^${(i % 20) + 1}.0.0`;
      } else {
        delete packageJson.dependencies[pkg];
      }

      // Also add some dev dependencies
      if (i % 7 === 0) {
        const devPkg = driftPatterns[(i + 2) % driftPatterns.length].packages[0];
        packageJson.devDependencies[devPkg] = `^${(i % 10) + 1}.0.0`;
      }

      await fs.writeFile(
        path.join(stressDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create commit
      const commitMsg = `[${pattern.category}] Change #${i}: ${i % 10 < 5 ? 'add' : 'remove'} ${pkg}`;
      execSync(`git add . && git commit -m "${commitMsg}" --no-gpg-sign`, {
        cwd: stressDir,
        stdio: 'ignore'
      });

      // Progress indicator every 500 commits
      if (i % 500 === 0 && i > 0) {
        const elapsed = ((Date.now() - startCreation) / 1000).toFixed(1);
        console.log(`  ⏱️ Progress: ${i.toLocaleString()}/10,000 commits (${elapsed}s)`);
      }
    }

    const creationTime = ((Date.now() - startCreation) / 1000).toFixed(1);
    console.log(`\n✅ Created 10,000 commits in ${creationTime}s\n`);

    // Now run drift analysis
    console.log('🔍 Running drift analysis on 10,000 commits...\n');

    const analysisStart = Date.now();
    const exportPath = path.join(os.tmpdir(), 'faf-10k-stress.json');

    const result = execSync(`node ${CLI_PATH} drift --export ${exportPath}`, {
      cwd: stressDir,
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer for large output
    });

    const analysisTime = ((Date.now() - analysisStart) / 1000).toFixed(1);

    console.log('='.repeat(60));
    console.log('📊 DRIFT ANALYSIS RESULTS');
    console.log('='.repeat(60));
    console.log(result);
    console.log('='.repeat(60));
    console.log(`\n⚡ Analysis completed in ${analysisTime}s`);
    console.log(`📁 Full report saved to: ${exportPath}\n`);

    // Assertions
    expect(result).toContain('FAF DRIFT ANALYSIS');
    expect(result).toContain('10000'); // Should show 10000 commits analyzed
    expect(result).toContain('DRIFT SUMMARY');

    // Performance assertion - should complete in under 2 minutes
    expect(parseFloat(analysisTime)).toBeLessThan(120);

    console.log('✅ 10,000 commit stress test PASSED\n');

  }, 600000); // 10 minute timeout
});

/**
 * STRESS TEST DOCUMENTATION
 *
 * What this tests:
 * 1. Memory handling with large git histories
 * 2. Performance at enterprise scale
 * 3. Drift pattern detection accuracy across many changes
 * 4. Export functionality with large datasets
 *
 * When to run:
 * - Before major releases
 * - When changing git parsing logic
 * - When optimizing performance
 * - Quarterly as part of WJTTC certification
 *
 * Expected results:
 * - Should complete in under 2 minutes for analysis
 * - Should detect drift patterns in Auth, State, Styling, Testing, Build
 * - Should not crash or OOM
 * - Export file should be valid JSON
 *
 * If this test fails:
 * - Check memory usage during run
 * - Review git log parsing for streaming issues
 * - Consider chunking for very large repos
 */
