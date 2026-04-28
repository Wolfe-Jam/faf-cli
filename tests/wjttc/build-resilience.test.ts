/**
 * WJTTC — Build Resilience Suite (2026-04-28 lessons learned)
 *
 * Locks in every regression class surfaced during the v6.0.12 → v6.3.3
 * recovery. When this suite is green, the build pipeline is provably
 * portable, version-correct, externalize-disciplined, and CI-ready.
 *
 * Tiers (F1-inspired):
 *   BRAKE  — catastrophic if broken (production crashes for end users)
 *   ENGINE — quality regressions (devs / CI affected, not users directly)
 *   AERO   — polish / non-blocking signals (drift detection)
 *
 * Each test maps to a numbered Lesson (L1-L11) from today's recovery.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(__dirname, '../..');
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

// ─────────────────────────────────────────────────────────────────────────────
// BRAKE TIER — production crashes / user-facing breakage
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC BRAKE: build artifact is portable + correct', () => {
  beforeAll(() => {
    if (!existsSync(DIST)) {
      throw new Error(`dist/ not found. Run \`bun run build\` before tests.`);
    }
  });

  // L1
  test('L1: dist/ contains zero build-machine paths', () => {
    const files = ['cli.js', 'index.js'];
    const patterns = [
      { name: 'macOS user paths', re: /\/Users\// },
      { name: 'GitHub Actions paths', re: /\/home\/runner\// },
      { name: 'macOS tmp paths', re: /\/private\/var\// },
    ];
    for (const file of files) {
      const path = join(DIST, file);
      expect(existsSync(path), `dist/${file} must exist`).toBe(true);
      const content = readFileSync(path, 'utf-8');
      for (const { name, re } of patterns) {
        const m = content.match(re);
        if (m) {
          const ctx = content.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + 60);
          throw new Error(
            `dist/${file} leaked a ${name} path matching ${re}.\nContext: ...${ctx}...`
          );
        }
      }
    }
  });

  // L2
  test('L2: faf-scoring-kernel is externalized (runtime require, not inlined)', () => {
    const cli = readFileSync(join(DIST, 'cli.js'), 'utf-8');
    // The bundle should reference faf-scoring-kernel by name (runtime resolution)
    expect(cli).toMatch(/["']faf-scoring-kernel["']/);
    // It should NOT contain the kernel's distinctive WASM-loader signature
    // (faf_wasm_sdk_bg.wasm is the bundled file inside the kernel package)
    expect(cli).not.toMatch(/faf_wasm_sdk_bg\.wasm/);
  });

  // L3
  test('L3: `open` is externalized (runtime import, not inlined)', () => {
    const cli = readFileSync(join(DIST, 'cli.js'), 'utf-8');
    // Should reference 'open' by name
    expect(cli).toMatch(/["']open["']/);
    // Should NOT contain the open package's xdg-open binary path resolution code
    expect(cli).not.toMatch(/xdg-open/);
  });

  // L4
  test('L4: --version source matches package.json (no hardcoded VERSION drift)', () => {
    const cli = readFileSync(join(DIST, 'cli.js'), 'utf-8');
    // The dist must carry the current package.json version string somewhere
    // (Bun inlines require('../package.json') at build time)
    expect(cli).toContain(PKG.version);
    // And the source MUST NOT have a hardcoded VERSION literal that differs
    const cliSrc = readFileSync(join(SRC, 'cli.ts'), 'utf-8');
    const hardcoded = cliSrc.match(/const\s+VERSION\s*=\s*["']([\d.]+)["']/);
    if (hardcoded) {
      throw new Error(
        `cli.ts has a hardcoded VERSION constant '${hardcoded[1]}'. ` +
        `Use require('../package.json') so version stays in sync.`
      );
    }
  });

  // L9
  test('L9: dist/cli.js + dist/index.js exist with non-trivial size', () => {
    const cli = statSync(join(DIST, 'cli.js'));
    const idx = statSync(join(DIST, 'index.js'));
    expect(cli.size).toBeGreaterThan(50_000); // 50KB minimum sanity
    expect(idx.size).toBeGreaterThan(1_000);
    // Both should be parseable as JS (rough check: start with valid char)
    const cliHead = readFileSync(join(DIST, 'cli.js'), 'utf-8').slice(0, 200);
    expect(cliHead).toMatch(/^(#!|\/\/|\/\*|"use|import|var|const|let|function|export)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE TIER — dev / CI quality regressions
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC ENGINE: build pipeline integrity', () => {
  // L5 + L11 — top-level await outside async wrappers breaks `bun build --compile`
  test('L5/L11: src/cli.ts has no unwrapped top-level await', () => {
    const cli = readFileSync(join(SRC, 'cli.ts'), 'utf-8');
    // Find all `await` keywords. They should be inside async functions, async
    // arrow functions, or async IIFEs. Top-level await outside those contexts
    // breaks `bun build --compile` (regression on 2026-04-28).
    //
    // Heuristic: split by lines, find lines with `await ` not inside an
    // identifiable async context. We look for the simplest violation:
    // an `await` on a line that is at the document's top indent and not
    // inside a `(async () => {` block.
    //
    // Conservative check: count `await` outside `async` contexts at top scope.
    // The IIFE wrapping pattern looks like `(async () => { ... await ... })()`
    const lines = cli.split('\n');
    const violations: { line: number; text: string }[] = [];
    let asyncDepth = 0;
    let braceDepth = 0;
    let inAsyncBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      // Track entering an async function/IIFE
      if (/\basync\b\s*(\([^)]*\)\s*=>|function|\(\s*\)\s*=>)/.test(ln)) {
        asyncDepth++;
        inAsyncBlock = true;
      }
      // Track brace depth (rough)
      const opens = (ln.match(/\{/g) ?? []).length;
      const closes = (ln.match(/\}/g) ?? []).length;
      braceDepth += opens - closes;
      if (asyncDepth > 0 && braceDepth === 0) {
        asyncDepth = 0;
        inAsyncBlock = false;
      }
      // Detect await usage outside async blocks (top level)
      if (/(^|[\s;({,=])await\s/.test(ln) && !inAsyncBlock) {
        // Skip false positives in comments / strings (very rough)
        if (!/^\s*(\/\/|\*)/.test(ln)) {
          violations.push({ line: i + 1, text: ln.trim() });
        }
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `src/cli.ts has ${violations.length} top-level await(s) outside async wrappers. ` +
        `This breaks \`bun build --compile\`. Wrap in (async () => { ... })().\n` +
        violations.map(v => `  line ${v.line}: ${v.text}`).join('\n')
      );
    }
  });

  // L6
  test('L6: CHANGELOG.md has an entry for the current package.json version', () => {
    const changelogPath = join(ROOT, 'CHANGELOG.md');
    expect(existsSync(changelogPath), 'CHANGELOG.md must exist').toBe(true);
    const changelog = readFileSync(changelogPath, 'utf-8');
    // Look for `## [X.Y.Z]` matching package.json version
    const versionPattern = new RegExp(
      `^##\\s+\\[${PKG.version.replace(/\./g, '\\.')}\\]`,
      'm'
    );
    expect(changelog).toMatch(versionPattern);
  });

  // L7
  test('L7: package.json + package-lock.json are in sync (npm ci would pass)', () => {
    try {
      execSync('npm ci --dry-run', {
        cwd: ROOT,
        stdio: 'pipe',
        timeout: 60_000,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? '';
      throw new Error(
        `package.json + package-lock.json out of sync. ` +
        `Run \`npm install\` to resync.\n${stderr || msg}`
      );
    }
  });

  // L10
  test('L10: ESLint config dependencies are resolvable', () => {
    const configPath = join(ROOT, 'eslint.config.mjs');
    if (!existsSync(configPath)) return; // not all forks have eslint
    const config = readFileSync(configPath, 'utf-8');
    // Find every `from '<pkg>'` import in the config
    const imports = [...config.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
    for (const dep of imports) {
      // Skip relative imports
      if (dep.startsWith('.') || dep.startsWith('/')) continue;
      try {
        require.resolve(dep, { paths: [ROOT] });
      } catch {
        throw new Error(
          `eslint.config.mjs imports '${dep}' but it's not installed. ` +
          `Add to devDependencies in package.json.`
        );
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AERO TIER — polish / drift detection
// ─────────────────────────────────────────────────────────────────────────────

describe('WJTTC AERO: drift detection', () => {
  // L4 (cross-check)
  test('AERO: package.json version is a valid semver', () => {
    expect(PKG.version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/);
  });

  // L8 — slow (~1-2s) but the canonical security gate.
  // Skipped in fast-test env; runs in CI.
  test('L8: no moderate+ CVEs in production deps', () => {
    if (process.env.WJTTC_SKIP_AUDIT === '1') return;
    try {
      execSync('npm audit --audit-level=moderate --omit=dev', {
        cwd: ROOT,
        stdio: 'pipe',
        timeout: 60_000,
      });
    } catch (err) {
      const stdout = (err as { stdout?: Buffer }).stdout?.toString() ?? '';
      throw new Error(
        `npm audit found vulnerabilities at moderate+ level.\n` +
        `Run \`npm audit fix\`. Output:\n${stdout.slice(0, 1500)}`
      );
    }
  });

  // Engines field present (sanity)
  test('AERO: package.json declares engines.node', () => {
    expect(PKG.engines?.node).toBeDefined();
  });

  // CHANGELOG newest entry version matches package.json (catches forgot-bump)
  test('AERO: most-recent CHANGELOG entry matches package.json version', () => {
    const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
    const firstEntry = changelog.match(/^##\s+\[([\d.]+)\]/m);
    expect(firstEntry, 'CHANGELOG must have at least one ## [X.Y.Z] entry').toBeTruthy();
    expect(firstEntry![1]).toBe(PKG.version);
  });
});
