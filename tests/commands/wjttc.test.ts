/**
 * WJTTC — `faf wjttc` self-audit (recursive, vendor-neutral)
 *
 * ENGINE: tier detection, multi-language test extraction, describe-scope
 *         inheritance, JSON output shape.
 * BRAKE:  --strict mode exits non-zero when untiered tests exist.
 *         Glass Hood for test-suite quality.
 */

import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectTier,
  classifyTestFile,
  extractTestNames,
  scanTests,
  aggregateReport,
} from '../../src/commands/wjttc.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-wjttc-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('WJTTC ENGINE: detectTier — tier marker recognition', () => {
  test('detects BRAKE in describe-style name', () => {
    expect(detectTier('WJTTC BRAKE: build artifact is portable')).toBe('BRAKE');
  });

  test('detects ENGINE', () => {
    expect(detectTier('WJTTC ENGINE: build pipeline integrity')).toBe('ENGINE');
  });

  test('detects AERO', () => {
    expect(detectTier('WJTTC AERO: drift detection')).toBe('AERO');
  });

  test('detects PIT', () => {
    expect(detectTier('PIT: setup fixtures')).toBe('PIT');
  });

  test('detects TYRE — the live / real-road tier (the historically-dropped fifth)', () => {
    expect(detectTier('WJTTC TYRE: live CLI — the real road')).toBe('TYRE');
    expect(detectTier('tyre-live-001: real clone')).toBe('TYRE');
  });

  test('case-insensitive detection', () => {
    expect(detectTier('brake-S010: detectSvelteAdapter')).toBe('BRAKE');
    expect(detectTier('engine_test_001')).toBe('ENGINE');
  });

  test('returns null when no tier marker', () => {
    expect(detectTier('detects react projects')).toBeNull();
    expect(detectTier('test_helper_function')).toBeNull();
  });

  test('detects tier in nested describe > test format', () => {
    expect(detectTier('WJTTC BRAKE: frame > test foo')).toBe('BRAKE');
    expect(detectTier('WJTTC ENGINE: section > does X')).toBe('ENGINE');
  });
});

describe('WJTTC ENGINE: classifyTestFile — multi-language detection', () => {
  test.each([
    ['foo.test.ts', 'typescript'],
    ['foo.test.tsx', 'typescript'],
    ['foo.test.js', 'typescript'],
    ['foo.spec.ts', 'typescript'],
    ['integration_tests.rs', 'rust'],
    ['main_test.go', 'go'],
    ['test_module.py', 'python'],
    ['module_test.py', 'python'],
    ['my_lib.zig', 'zig'],
  ])('classifies "%s" as %s', (name, lang) => {
    const r = classifyTestFile(name);
    expect(r.ok).toBe(true);
    expect(r.lang).toBe(lang);
  });

  test('rejects non-test files', () => {
    expect(classifyTestFile('regular.ts').ok).toBe(false);
    expect(classifyTestFile('package.json').ok).toBe(false);
    expect(classifyTestFile('README.md').ok).toBe(false);
  });
});

describe('WJTTC ENGINE: extractTestNames — TypeScript with describe inheritance', () => {
  test('inherits parent describe name into nested test', () => {
    const code = `
describe('WJTTC ENGINE: outer', () => {
  test('does the thing', () => {});
  test('does another thing', () => {});
});
`;
    const names = extractTestNames(code, 'typescript');
    expect(names).toContain('WJTTC ENGINE: outer > does the thing');
    expect(names).toContain('WJTTC ENGINE: outer > does another thing');
  });

  test('handles it() and test() interchangeably', () => {
    const code = `
describe('block', () => {
  it('via it', () => {});
  test('via test', () => {});
});
`;
    const names = extractTestNames(code, 'typescript');
    expect(names.some(n => n.includes('via it'))).toBe(true);
    expect(names.some(n => n.includes('via test'))).toBe(true);
  });

  test('handles all three quote styles', () => {
    const code = `
describe('single', () => { test('a', () => {}); });
describe("double", () => { test("b", () => {}); });
describe(\`backtick\`, () => { test(\`c\`, () => {}); });
`;
    const names = extractTestNames(code, 'typescript');
    expect(names).toContain('single > a');
    expect(names).toContain('double > b');
    expect(names).toContain('backtick > c');
  });

  test('tests outside any describe — no parent prefix', () => {
    const code = `
test('top-level', () => {});
`;
    const names = extractTestNames(code, 'typescript');
    expect(names).toContain('top-level');
  });
});

describe('WJTTC ENGINE: extractTestNames — Rust', () => {
  test('extracts function names following #[test]', () => {
    const code = `
#[test]
fn test_basic_score() {}

#[test]
fn brake_critical_path() {}
`;
    const names = extractTestNames(code, 'rust');
    expect(names).toContain('test_basic_score');
    expect(names).toContain('brake_critical_path');
  });

  test('respects pub fn declarations', () => {
    const code = `
#[test]
pub fn engine_subsystem_works() {}
`;
    const names = extractTestNames(code, 'rust');
    expect(names).toContain('engine_subsystem_works');
  });
});

describe('WJTTC ENGINE: extractTestNames — Python / Zig / Go', () => {
  test('Python def test_*', () => {
    const code = `
def test_brake_critical():
    pass

def test_engine_normal():
    pass

def helper_function():
    pass
`;
    const names = extractTestNames(code, 'python');
    expect(names).toContain('test_brake_critical');
    expect(names).toContain('test_engine_normal');
    expect(names).not.toContain('helper_function');
  });

  test('Zig test "name"', () => {
    const code = `
test "BRAKE: parses YAML" {}

test "ENGINE: scores correctly" {}
`;
    const names = extractTestNames(code, 'zig');
    expect(names).toContain('BRAKE: parses YAML');
    expect(names).toContain('ENGINE: scores correctly');
  });

  test('Go func TestX', () => {
    const code = `
func TestBrakeCritical(t *testing.T) {}
func TestEngineNormal(t *testing.T) {}
func helper() {}
`;
    const names = extractTestNames(code, 'go');
    expect(names).toContain('TestBrakeCritical');
    expect(names).toContain('TestEngineNormal');
    expect(names).not.toContain('helper');
  });
});

describe('WJTTC ENGINE: scanTests + aggregateReport (end-to-end)', () => {
  test('counts tiers correctly across a fixture suite', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'), `
describe('WJTTC BRAKE: foo', () => {
  test('a1', () => {});
  test('a2', () => {});
});
describe('WJTTC ENGINE: bar', () => {
  test('b1', () => {});
});
test('untiered top-level', () => {});
`);
    const findings = scanTests(join(dir, 'tests'));
    const report = aggregateReport(findings);
    expect(report.totalTests).toBe(4);
    expect(report.byTier.BRAKE).toBe(2);
    expect(report.byTier.ENGINE).toBe(1);
    expect(report.untiered).toBe(1);
    expect(report.filesScanned).toBe(1);
  });

  test('counts all five tiers — TYRE + PIT included (no fifth-tier drop)', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'five.test.ts'), `
describe('WJTTC BRAKE: b', () => { test('1', () => {}); });
describe('WJTTC ENGINE: e', () => { test('2', () => {}); });
describe('WJTTC AERO: a', () => { test('3', () => {}); });
describe('WJTTC TYRE: t', () => { test('4', () => {}); });
describe('WJTTC PIT: p', () => { test('5', () => {}); });
`);
    const report = aggregateReport(scanTests(join(dir, 'tests')));
    expect(report.byTier.BRAKE).toBe(1);
    expect(report.byTier.ENGINE).toBe(1);
    expect(report.byTier.AERO).toBe(1);
    expect(report.byTier.TYRE).toBe(1);
    expect(report.byTier.PIT).toBe(1);
    expect(report.untiered).toBe(0);
  });

  test('skips node_modules / .git / target / dist', () => {
    mkdirSync(join(dir, 'tests'));
    mkdirSync(join(dir, 'tests', 'node_modules'));
    mkdirSync(join(dir, 'tests', 'node_modules', 'somepkg'));
    writeFileSync(join(dir, 'tests', 'node_modules', 'somepkg', 'foo.test.ts'),
      `test('should not be counted', () => {});`);
    writeFileSync(join(dir, 'tests', 'real.test.ts'),
      `test('should be counted', () => {});`);
    const findings = scanTests(join(dir, 'tests'));
    expect(findings.length).toBe(1);
    expect(findings[0].testName).toBe('should be counted');
  });

  test('returns empty report for nonexistent dir', () => {
    const findings = scanTests('/this/does/not/exist');
    const report = aggregateReport(findings);
    expect(report.totalTests).toBe(0);
    expect(report.untiered).toBe(0);
    expect(report.filesScanned).toBe(0);
  });

  test('untieredExamples capped at 5', () => {
    mkdirSync(join(dir, 'tests'));
    const tests = Array.from({ length: 10 }, (_, i) => `test('untiered_${i}', () => {});`).join('\n');
    writeFileSync(join(dir, 'tests', 'a.test.ts'), tests);
    const findings = scanTests(join(dir, 'tests'));
    const report = aggregateReport(findings);
    expect(report.untiered).toBe(10);
    expect(report.untieredExamples.length).toBe(5);
  });
});

describe('WJTTC BRAKE: aggregateReport — Rust + TypeScript polyglot', () => {
  test('mixed-language test suite reports byLanguage breakdown', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `describe('WJTTC BRAKE: ts', () => { test('t1', () => {}); });`);
    writeFileSync(join(dir, 'tests', 'b.rs'),
      `#[test]\nfn brake_critical() {}\n#[test]\nfn engine_normal() {}`);
    const findings = scanTests(join(dir, 'tests'));
    const report = aggregateReport(findings);
    expect(report.totalTests).toBe(3);
    expect(report.byLanguage.typescript).toBe(1);
    expect(report.byLanguage.rust).toBe(2);
  });
});

describe('WJTTC ENGINE: wjttcCommand — JSON + path + strict modes', () => {
  test('--json output is valid JSON with the AuditReport shape', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'sample.test.ts'),
      `describe('WJTTC ENGINE: x', () => { test('y', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    wjttcCommand({ path: join(dir, 'tests'), json: true });
    spy.mockRestore();

    const output = logs.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed.totalTests).toBe(1);
    expect(parsed.byTier.ENGINE).toBe(1);
    expect(parsed.byLanguage.typescript).toBe(1);
    expect(parsed.untieredExamples).toEqual([]);
  });

  test('--path option respects custom directory', async () => {
    mkdirSync(join(dir, 'custom-test-dir'));
    writeFileSync(join(dir, 'custom-test-dir', 'a.test.ts'),
      `describe('WJTTC BRAKE: in-custom', () => { test('z', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    wjttcCommand({ path: join(dir, 'custom-test-dir'), json: true });
    spy.mockRestore();

    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.totalTests).toBe(1);
    expect(parsed.byTier.BRAKE).toBe(1);
  });

  test('--strict flag exits non-zero when untiered tests exist', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `test('untiered', () => {});`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as never);

    wjttcCommand({ path: join(dir, 'tests'), strict: true, json: true });

    expect(exitSpy).toHaveBeenCalledWith(1);
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('--strict does NOT exit when zero untiered tests', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `describe('WJTTC ENGINE: clean', () => { test('all-tiered', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logSpy = spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as never);

    wjttcCommand({ path: join(dir, 'tests'), strict: true, json: true });

    expect(exitSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('default (no --json) prints human-readable report', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `describe('WJTTC ENGINE: x', () => { test('y', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    wjttcCommand({ path: join(dir, 'tests') });
    spy.mockRestore();

    const out = logs.join('\n');
    expect(out).toMatch(/faf wjttc/);
    expect(out).toMatch(/Files scanned/);
    expect(out).toMatch(/Tests found/);
    expect(out).toMatch(/Tiers:/);
  });
});

describe('WJTTC ENGINE: wjttcCommand — coverage warning', () => {
  test('warns "no BRAKE-tier tests" when zero BRAKE-tagged', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `describe('WJTTC ENGINE: x', () => { test('y', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    wjttcCommand({ path: join(dir, 'tests') });
    spy.mockRestore();

    const out = logs.join('\n');
    expect(out).toMatch(/no BRAKE-tier tests/);
  });

  test('does NOT warn when BRAKE-tier tests exist', async () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'a.test.ts'),
      `describe('WJTTC BRAKE: critical', () => { test('y', () => {}); });`);

    const { wjttcCommand } = await import('../../src/commands/wjttc.js');
    const logs: string[] = [];
    const spy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    wjttcCommand({ path: join(dir, 'tests') });
    spy.mockRestore();

    const out = logs.join('\n');
    expect(out).not.toMatch(/no BRAKE-tier tests/);
  });
});

describe('WJTTC AERO: edge cases', () => {
  test('empty test dir returns 0 tests, no crash', () => {
    mkdirSync(join(dir, 'tests'));
    const findings = scanTests(join(dir, 'tests'));
    const report = aggregateReport(findings);
    expect(report.totalTests).toBe(0);
    expect(report.filesScanned).toBe(0);
  });

  test('test file with no actual tests returns 0 findings', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'empty.test.ts'),
      `// just a comment, no tests\nconst x = 1;`);
    const findings = scanTests(join(dir, 'tests'));
    expect(findings.length).toBe(0);
  });

  test('Rust file without #[test] is excluded from scan', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'helpers.rs'),
      `pub fn helper() -> i32 { 42 }`);
    const findings = scanTests(join(dir, 'tests'));
    expect(findings.length).toBe(0);
  });

  test('Zig file without test "..." block is excluded', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'helpers.zig'),
      `pub fn helper() i32 { return 42; }`);
    const findings = scanTests(join(dir, 'tests'));
    expect(findings.length).toBe(0);
  });

  test('nested describes inherit ALL ancestors in test path', () => {
    mkdirSync(join(dir, 'tests'));
    writeFileSync(join(dir, 'tests', 'nested.test.ts'), `
describe('WJTTC BRAKE: outer', () => {
  describe('inner block', () => {
    test('leaf', () => {});
  });
});
`);
    const findings = scanTests(join(dir, 'tests'));
    expect(findings.length).toBe(1);
    expect(findings[0].testName).toContain('WJTTC BRAKE: outer');
    expect(findings[0].testName).toContain('inner block');
    expect(findings[0].tier).toBe('BRAKE');
  });
});
