/**
 * `faf wjttc` — vendor-neutral test-suite audit.
 *
 * Reads tests across TypeScript / Rust / Python / Zig / Go and classifies
 * each by WJTTC tier (BRAKE / ENGINE / AERO / TYRE / PIT) based on the test name.
 * Tier-balance + untiered-test report. Forward-compatible with TAF receipts.
 *
 * Per the original v6.5.0 brief — "WJTTC moves from doctrine to enforced
 * discipline. Run anywhere, in any FAF-aware repo, see the tier balance."
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

export interface WjttcOptions {
  path?: string;
  strict?: boolean;
  json?: boolean;
}

// The full WJTTC five: BRAKE (safety) · ENGINE (core) · AERO (polish) ·
// TYRE (live — the real road) · PIT (operational, when needed). TYRE was the
// historically-dropped fifth; omitting it mislabels every live test as untiered.
const TIERS = ['BRAKE', 'ENGINE', 'AERO', 'TYRE', 'PIT'] as const;
type Tier = (typeof TIERS)[number];
type Language = 'typescript' | 'rust' | 'python' | 'zig' | 'go';

interface TestFinding {
  file: string;
  language: Language;
  testName: string;
  tier: Tier | null;
}

export interface WjttcReport {
  totalTests: number;
  byTier: Record<Tier, number>;
  untiered: number;
  untieredExamples: string[];
  filesScanned: number;
  byLanguage: Record<string, number>;
}

// Match tier word with non-alphabetic boundary on both sides — `\b` treats
// underscore as a word char, so "engine_test_001" wouldn't match. We want
// any non-alpha (including _, -, :, space) to count as a boundary.
const TIER_REGEX = /(?:^|[^A-Za-z])(BRAKE|ENGINE|AERO|TYRE|PIT)(?:[^A-Za-z]|$)/i;

/** Classify a test by name. Returns null if no tier marker is present. */
export function detectTier(testName: string): Tier | null {
  const m = testName.match(TIER_REGEX);
  if (!m) return null;
  return m[1].toUpperCase() as Tier;
}

/** Identify a file as a test file by extension/naming convention,
 *  returning the language for parser dispatch. */
export function classifyTestFile(filename: string): { ok: boolean; lang?: Language } {
  const lower = filename.toLowerCase();
  if (
    lower.endsWith('.test.ts') ||
    lower.endsWith('.test.js') ||
    lower.endsWith('.test.tsx') ||
    lower.endsWith('.test.jsx') ||
    lower.endsWith('.spec.ts') ||
    lower.endsWith('.spec.js')
  ) {
    return { ok: true, lang: 'typescript' };
  }
  if (lower.endsWith('.rs')) return { ok: true, lang: 'rust' };
  if (lower.endsWith('_test.go')) return { ok: true, lang: 'go' };
  if ((lower.startsWith('test_') || lower.endsWith('_test.py')) && lower.endsWith('.py')) {
    return { ok: true, lang: 'python' };
  }
  // Zig: any .zig file MAY have test blocks; we still scan, but most won't
  if (lower.endsWith('.zig')) return { ok: true, lang: 'zig' };
  return { ok: false };
}

/** Extract test names from file content per language.
 *
 *  For TypeScript/JS, the tier marker typically lives on the parent `describe`
 *  block (e.g. `describe('WJTTC ENGINE: ...', () => { test('...', () => {}) })`).
 *  We track the most recent describe and prepend it to inner test names, so
 *  tier detection sees the parent's marker. Also avoids double-counting:
 *  describes themselves are NOT emitted as separate test names. */
export function extractTestNames(content: string, lang: Language): string[] {
  const names: string[] = [];
  switch (lang) {
    case 'typescript': {
      // Brace-depth-tracked parser. Push a describe onto the stack when its
      // opening `{` is processed; pop when the matching `}` closes the scope.
      // Tests inherit the full describe-stack path so tier markers on parent
      // describes propagate to nested tests. Handles same-line describe+test
      // and multiple sibling describes correctly.
      const callRe = /\b(describe|test|it)\s*\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g;
      const calls: { idx: number; type: 'describe' | 'test'; name: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = callRe.exec(content)) !== null) {
        calls.push({
          idx: m.index,
          type: m[1] === 'describe' ? 'describe' : 'test',
          name: m[3],
        });
      }

      type Frame = { name: string; openDepth: number };
      const stack: Frame[] = [];
      let depth = 0;
      let pendingDescribe: string | null = null;
      let callIdx = 0;

      for (let i = 0; i < content.length; i++) {
        // Process calls whose match position is `i`
        while (callIdx < calls.length && calls[callIdx].idx === i) {
          const call = calls[callIdx];
          if (call.type === 'describe') {
            // Wait for the opening `{` of the arrow body before pushing scope.
            pendingDescribe = call.name;
          } else {
            const parents = stack.map(f => f.name);
            const full = parents.length > 0 ? `${parents.join(' > ')} > ${call.name}` : call.name;
            names.push(full);
          }
          callIdx++;
        }

        const ch = content[i];
        if (ch === '{') {
          depth++;
          if (pendingDescribe !== null) {
            stack.push({ name: pendingDescribe, openDepth: depth });
            pendingDescribe = null;
          }
        } else if (ch === '}') {
          depth--;
          while (stack.length > 0 && depth < stack[stack.length - 1].openDepth) {
            stack.pop();
          }
        }
      }
      break;
    }
    case 'rust': {
      // #[test] on its own line, then `fn name()` — function name IS the test name.
      const re = /#\[test\]\s*(?:\r?\n)\s*(?:pub\s+)?fn\s+([a-zA-Z_][a-zA-Z_0-9]*)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) names.push(m[1]);
      break;
    }
    case 'python': {
      // def test_name(...) — function name IS the test name.
      const re = /^\s*def\s+(test_[a-zA-Z_0-9]+)\s*\(/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) names.push(m[1]);
      break;
    }
    case 'zig': {
      // test "name" { ... }
      const re = /\btest\s+"((?:\\.|[^"\\])+)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) names.push(m[1]);
      break;
    }
    case 'go': {
      // func TestName(t *testing.T)
      const re = /\bfunc\s+(Test[A-Z][a-zA-Z_0-9]*)\s*\(/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content)) !== null) names.push(m[1]);
      break;
    }
  }
  return names;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'target', 'dist', 'build', '.next', '.nuxt', 'coverage']);

function walk(dir: string, results: string[] = []): string[] {
  let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

/** Scan a directory tree and return findings. Pure / testable. */
export function scanTests(rootDir: string): TestFinding[] {
  const findings: TestFinding[] = [];
  if (!existsSync(rootDir)) return findings;
  const allFiles = walk(rootDir);
  for (const file of allFiles) {
    const filename = file.split('/').pop() ?? '';
    const cls = classifyTestFile(filename);
    if (!cls.ok || !cls.lang) continue;
    let content: string;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    // Filter Rust files that don't actually contain #[test] — most src/ files
    if (cls.lang === 'rust' && !/#\[test\]/.test(content)) continue;
    // Filter Zig files that don't have test blocks
    if (cls.lang === 'zig' && !/\btest\s+"/.test(content)) continue;
    const names = extractTestNames(content, cls.lang);
    const relFile = file.replace(`${rootDir}/`, '');
    for (const name of names) {
      findings.push({
        file: relFile,
        language: cls.lang,
        testName: name,
        tier: detectTier(name),
      });
    }
  }
  return findings;
}

/** Aggregate findings into a tier-balance report. */
export function aggregateReport(findings: TestFinding[]): WjttcReport {
  const byTier: Record<Tier, number> = { BRAKE: 0, ENGINE: 0, AERO: 0, TYRE: 0, PIT: 0 };
  const byLanguage: Record<string, number> = {};
  let untiered = 0;
  const untieredExamples: string[] = [];
  const files = new Set<string>();

  for (const f of findings) {
    files.add(f.file);
    byLanguage[f.language] = (byLanguage[f.language] ?? 0) + 1;
    if (f.tier) byTier[f.tier]++;
    else {
      untiered++;
      if (untieredExamples.length < 5) {
        untieredExamples.push(`${f.file}: ${f.testName}`);
      }
    }
  }

  return {
    totalTests: findings.length,
    byTier,
    untiered,
    untieredExamples,
    filesScanned: files.size,
    byLanguage,
  };
}

function printReport(report: WjttcReport): void {
  console.log(`${fafCyan(bold('faf wjttc'))} ${dim('— vendor-neutral test audit')}`);
  console.log('');
  console.log(`  Files scanned: ${bold(String(report.filesScanned))}`);
  console.log(`  Tests found:   ${bold(String(report.totalTests))}`);
  console.log('');

  if (report.totalTests === 0) {
    console.log(dim('  no tests found'));
    return;
  }

  console.log(dim('  Tiers:'));
  for (const tier of TIERS) {
    const count = report.byTier[tier];
    const pct = ((count / report.totalTests) * 100).toFixed(0);
    const indicator =
      tier === 'BRAKE' ? orange('●') :
      tier === 'ENGINE' ? fafCyan('●') :
      tier === 'AERO' ? dim('●') :
      tier === 'TYRE' ? fafCyan('◐') :
      dim('○');
    console.log(`    ${indicator} ${tier.padEnd(7)} ${bold(String(count).padStart(4))}  ${dim(`(${pct}%)`)}`);
  }
  if (report.untiered > 0) {
    const pct = ((report.untiered / report.totalTests) * 100).toFixed(0);
    console.log(`    ${dim('○')} ${'untiered'.padEnd(7)} ${bold(String(report.untiered).padStart(4))}  ${dim(`(${pct}%)`)}`);
  }

  if (report.untiered > 0 && report.untieredExamples.length > 0) {
    console.log('');
    console.log(dim(`  Untiered examples (first ${report.untieredExamples.length}):`));
    for (const ex of report.untieredExamples) {
      console.log(`    ${dim('·')} ${ex}`);
    }
  }

  if (Object.keys(report.byLanguage).length > 1) {
    console.log('');
    console.log(dim('  Languages:'));
    for (const [lang, count] of Object.entries(report.byLanguage)) {
      console.log(`    ${dim('·')} ${lang.padEnd(12)} ${bold(String(count))}`);
    }
  }

  // Coverage hints
  if (report.byTier.BRAKE === 0 && report.totalTests > 0) {
    console.log('');
    console.log(orange(`  ⚠ no BRAKE-tier tests — no safety canaries`));
  }
}

export function wjttcCommand(options: WjttcOptions = {}): void {
  const root = options.path ?? 'tests';
  const findings = scanTests(root);
  const report = aggregateReport(findings);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  if (options.strict && report.untiered > 0) {
    process.exit(1);
  }
}
