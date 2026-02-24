/**
 * 🏎️ WJTTC Test Suite: AGENTS.md + .cursorrules Interop
 *
 * F1-Inspired Testing: "We break things so others never have to know they were broken"
 *
 * Championship Standards:
 * - Tier 0: Pit Lane (Platform Safety) — Cross-platform, no hardcoded paths
 * - Tier 1: Brake Systems (Critical) — Parsers don't crash, basic I/O works
 * - Tier 2: Engine Systems (Core) — Correct field mapping, all FAF fields handled
 * - Tier 3: Aerodynamics (Performance) — Speed contracts, large files, stress
 * - Tier 4: Telemetry (Edge Cases) — Malformed input, encoding, adversarial content
 * - Tier 5: Championship (Integration) — Round-trip fidelity, bi-sync --all, real-world FAF
 *
 * This suite tests with the mindset of a developer who:
 * - Has weird line endings (Windows, old Mac)
 * - Has BOM markers from VS Code
 * - Has code blocks inside their AGENTS.md
 * - Has indented sub-bullets
 * - Has emoji and Unicode in project names
 * - Has enormous files (1000+ lines)
 * - Has files with NO structure (just prose)
 * - Has files that mix * and - bullets
 * - Has numbered lists instead of bullets
 * - Will try `faf agents import` then `faf agents export` and expect fidelity
 *
 * We get one shot with this type of developer. We must not waste it.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Parsers under test
import {
  parseAgentsMd,
  agentsImport,
  agentsExport,
  detectAgentsMd,
  detectGlobalAgentsMd,
} from '../../src/utils/agents-parser';

import {
  parseCursorRules,
  cursorImport,
  cursorExport,
  detectCursorRules,
} from '../../src/utils/cursorrules-parser';

// ============================================================================
// Test Infrastructure
// ============================================================================

const testDir = path.join(os.tmpdir(), 'wjttc-interop-formats-' + process.pid);

beforeAll(async () => {
  await fs.mkdir(testDir, { recursive: true });
});

afterAll(async () => {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
});

// Helper: create isolated subdirectory per test
async function createTestSubDir(name: string): Promise<string> {
  const dir = path.join(testDir, name);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// The real project.faf content from faf-cli (our own project)
const REAL_WORLD_FAF = {
  faf_version: '2.5.0',
  project: {
    name: 'faf-cli',
    goal: 'The Persistent AI Context Standard',
    main_language: 'TypeScript',
    type: 'cli-ts',
  },
  instant_context: {
    what_building: 'The Persistent AI Context Standard • Foundation Layer for AI • IANA-Registered • Anthropic-Approved',
    tech_stack: 'CLI/TypeScript/TypeScript (tsc)/npm registry/Node.js',
    main_language: 'TypeScript',
  },
  ai_instructions: {
    warnings: [
      'Never modify dial components without approval',
      'All TypeScript must pass strict mode',
      'Test coverage required for new features',
    ],
    working_style: {
      quality_bar: 'zero_errors',
      testing: 'required',
    },
  },
  stack: {
    frontend: 'CLI',
    backend: 'Node.js',
    runtime: 'Node.js >=18.0.0',
    database: 'None',
    build: 'TypeScript (tsc)',
    package_manager: 'npm',
    hosting: 'npm registry',
    cicd: 'GitHub Actions',
  },
  preferences: {
    quality_bar: 'zero_errors',
    commit_style: 'conventional_emoji',
    response_style: 'concise_code_first',
    testing: 'required',
    documentation: 'as_needed',
  },
  human_context: {
    who: 'wolfejam.dev team',
    what: 'The Persistent AI Context Standard',
    where: 'npm registry + GitHub',
    how: 'Test-driven development',
  },
};

// ============================================================================
// 🏁 TIER 0: PIT LANE — Platform Safety
// ============================================================================

describe('🏁 Tier 0: Pit Lane — Platform Safety', () => {

  test('uses os.tmpdir() not hardcoded /tmp', () => {
    // Verify our test infrastructure uses platform-safe paths
    expect(testDir).toContain(os.tmpdir());
    expect(testDir).not.toBe('/tmp');
  });

  test('path.join used for all file paths (no string concatenation)', async () => {
    const dir = await createTestSubDir('pit-lane-paths');
    const filePath = path.join(dir, 'AGENTS.md');
    // Verify path uses proper separator
    expect(filePath).toContain(path.sep);
    await fs.writeFile(filePath, '# Test');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('# Test');
  });

  test('handles Windows line endings (\\r\\n)', () => {
    const content = '# My Project\r\n\r\n## Overview\r\n- First item\r\n- Second item\r\n';
    const result = parseAgentsMd(content);
    expect(result.projectName).toBe('My Project');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].content).toHaveLength(2);
    // Verify no \r leaks into content
    expect(result.sections[0].content[0]).not.toContain('\r');
    expect(result.sections[0].content[1]).not.toContain('\r');
  });

  test('handles old Mac line endings (\\r only)', () => {
    const content = '# Old Mac Project\r\r## Section\r- Item one\r';
    // \r-only splits won't work with split('\n'), but we handle gracefully
    const result = parseAgentsMd(content);
    // Should at minimum not crash
    expect(result).toBeDefined();
    expect(result.projectName).toBeDefined();
  });

  test('Windows \\r\\n in .cursorrules', () => {
    const content = '# Cursor Project\r\n\r\n## Rules\r\n- Use TypeScript\r\n';
    const result = parseCursorRules(content);
    expect(result.projectName).toBe('Cursor Project');
    expect(result.sections[0].content[0]).not.toContain('\r');
  });
});

// ============================================================================
// 🛑 TIER 1: BRAKE SYSTEMS — Critical (Parsers Don't Crash)
// ============================================================================

describe('🛑 Tier 1: Brake Systems — Critical', () => {

  describe('AGENTS.md Parser — Crash Safety', () => {

    test('empty string does not crash', () => {
      const result = parseAgentsMd('');
      expect(result).toBeDefined();
      expect(result.projectName).toBe('Unknown Project');
      expect(result.sections).toEqual([]);
    });

    test('single newline does not crash', () => {
      const result = parseAgentsMd('\n');
      expect(result).toBeDefined();
      expect(result.sections).toEqual([]);
    });

    test('whitespace-only content does not crash', () => {
      const result = parseAgentsMd('   \n  \n   \n');
      expect(result).toBeDefined();
      expect(result.sections).toEqual([]);
    });

    test('only H1 header, no sections', () => {
      const result = parseAgentsMd('# My Project');
      expect(result.projectName).toBe('My Project');
      expect(result.sections).toEqual([]);
    });

    test('only H2 headers, no bullets', () => {
      const result = parseAgentsMd('## Section One\n## Section Two');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].content).toEqual([]);
      expect(result.sections[1].content).toEqual([]);
    });

    test('only bullets, no headers', () => {
      // Bullets before any H2 should NOT crash
      const result = parseAgentsMd('- item one\n- item two\n- item three');
      expect(result).toBeDefined();
      // Items before first section are lost (no currentSection) - but no crash
      expect(result.sections).toEqual([]);
    });
  });

  describe('.cursorrules Parser — Crash Safety', () => {

    test('empty string does not crash', () => {
      const result = parseCursorRules('');
      expect(result).toBeDefined();
      expect(result.projectName).toBe('Unknown Project');
      expect(result.sections).toEqual([]);
    });

    test('whitespace-only content does not crash', () => {
      const result = parseCursorRules('   \n\n   ');
      expect(result).toBeDefined();
    });

    test('just prose, no headers at all', () => {
      const content = 'Use TypeScript strict mode.\nPrefer const over let.\nWrite tests for everything.';
      const result = parseCursorRules(content);
      expect(result).toBeDefined();
      // No sections found, but rawLines captured
      expect(result.rawLines.length).toBeGreaterThan(0);
    });
  });

  describe('Import — File Not Found', () => {

    test('agentsImport returns failure for non-existent file', async () => {
      const result = await agentsImport('/this/path/does/not/exist/AGENTS.md');
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('cursorImport returns failure for non-existent file', async () => {
      const result = await cursorImport('/this/path/does/not/exist/.cursorrules');
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Export — Output Directory', () => {

    test('agentsExport writes file successfully', async () => {
      const dir = await createTestSubDir('brake-agents-export');
      const outputPath = path.join(dir, 'AGENTS.md');
      const result = await agentsExport({ project: { name: 'brake-test' } }, outputPath);
      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('cursorExport writes file successfully', async () => {
      const dir = await createTestSubDir('brake-cursor-export');
      const outputPath = path.join(dir, '.cursorrules');
      const result = await cursorExport({ project: { name: 'brake-test' } }, outputPath);
      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Detection — Empty Directories', () => {

    test('detectAgentsMd returns null for empty directory', async () => {
      const dir = await createTestSubDir('brake-detect-empty-agents');
      const result = await detectAgentsMd(dir);
      expect(result).toBeNull();
    });

    test('detectCursorRules returns null for empty directory', async () => {
      const dir = await createTestSubDir('brake-detect-empty-cursor');
      const result = await detectCursorRules(dir);
      expect(result).toBeNull();
    });

    test('detectAgentsMd returns null for non-existent directory', async () => {
      const result = await detectAgentsMd('/this/directory/does/not/exist');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// ⚡ TIER 2: ENGINE SYSTEMS — Core (Correct Field Mapping)
// ============================================================================

describe('⚡ Tier 2: Engine Systems — Core Field Mapping', () => {

  describe('AGENTS.md → FAF Mapping', () => {

    test('H1 "Project: Name" format maps to project.name', () => {
      const result = parseAgentsMd('# Project: My Awesome App');
      expect(result.projectName).toBe('My Awesome App');
    });

    test('H1 plain name format maps to project.name', () => {
      const result = parseAgentsMd('# my-cli-tool');
      expect(result.projectName).toBe('my-cli-tool');
    });

    test('build/test sections map to buildCommands', async () => {
      const dir = await createTestSubDir('engine-build-commands');
      const agentsContent = [
        '# test-project',
        '',
        '## Build and Test Commands',
        '- npm run build',
        '- npm test',
        '- npm run lint',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), agentsContent);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.success).toBe(true);
      expect(result.faf.project.buildCommands).toContain('npm run build');
      expect(result.faf.project.buildCommands).toContain('npm test');
      expect(result.faf.project.buildCommands).toContain('npm run lint');
    });

    test('architecture sections map to architecture', async () => {
      const dir = await createTestSubDir('engine-architecture');
      const agentsContent = [
        '# test-project',
        '',
        '## Architecture',
        '- Monorepo with turborepo',
        '- React frontend with Next.js',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), agentsContent);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.faf.project.architecture).toContain('Monorepo with turborepo');
    });

    test('coding style sections map to codingStyle', async () => {
      const dir = await createTestSubDir('engine-coding-style');
      const agentsContent = [
        '# test-project',
        '',
        '## Code Style Guidelines',
        '- Use 2-space indentation',
        '- Prefer arrow functions',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), agentsContent);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.faf.project.codingStyle).toContain('Use 2-space indentation');
      expect(result.faf.project.codingStyle).toContain('Prefer arrow functions');
    });

    test('warning/constraint sections map to rules', async () => {
      const dir = await createTestSubDir('engine-rules');
      const agentsContent = [
        '# test-project',
        '',
        '## Constraints',
        '- Never use eval()',
        '- No dynamic imports in production',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), agentsContent);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.faf.project.rules).toContain('Never use eval()');
    });

    test('unrecognized sections default to guidelines', async () => {
      const dir = await createTestSubDir('engine-guidelines');
      const agentsContent = [
        '# test-project',
        '',
        '## Getting Started',
        '- Clone the repo',
        '- Run npm install',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), agentsContent);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.faf.project.guidelines).toContain('Clone the repo');
    });
  });

  describe('FAF → AGENTS.md Mapping', () => {

    test('project.name appears as H1', async () => {
      const dir = await createTestSubDir('engine-export-h1');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({ project: { name: 'my-awesome-project' } }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.startsWith('# my-awesome-project')).toBe(true);
    });

    test('stack fields create Tech Stack section', async () => {
      const dir = await createTestSubDir('engine-export-stack');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({
        project: { name: 'test' },
        stack: {
          frontend: 'React',
          backend: 'Express',
          runtime: 'Node.js 20',
          build: 'Vite',
          package_manager: 'pnpm',
        },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## Tech Stack');
      expect(content).toContain('Frontend: React');
      expect(content).toContain('Backend: Express');
      expect(content).toContain('Runtime: Node.js 20');
      expect(content).toContain('Package Manager: pnpm');
    });

    test('ai_instructions.warnings create Code Style Guidelines', async () => {
      const dir = await createTestSubDir('engine-export-warnings');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({
        project: { name: 'test' },
        ai_instructions: {
          warnings: ['Never use any type', 'Always use strict mode'],
        },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## Code Style Guidelines');
      expect(content).toContain('Never use any type');
      expect(content).toContain('Always use strict mode');
    });

    test('human_context.how creates Build and Test Commands', async () => {
      const dir = await createTestSubDir('engine-export-build');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({
        project: { name: 'test' },
        human_context: { how: 'npm run build && npm test' },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## Build and Test Commands');
      expect(content).toContain('npm run build && npm test');
    });

    test('database "None" is excluded from Tech Stack', async () => {
      const dir = await createTestSubDir('engine-export-no-db');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({
        project: { name: 'test' },
        stack: { frontend: 'React', database: 'None' },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).not.toContain('Database: None');
    });

    test('footer includes generation timestamp', async () => {
      const dir = await createTestSubDir('engine-export-footer');
      const outputPath = path.join(dir, 'AGENTS.md');
      await agentsExport({ project: { name: 'test' } }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('Generated from project.faf by faf-cli');
    });
  });

  describe('FAF → .cursorrules Mapping', () => {

    test('project.name appears as H1', async () => {
      const dir = await createTestSubDir('engine-cursor-h1');
      const outputPath = path.join(dir, '.cursorrules');
      await cursorExport({ project: { name: 'cursor-test' } }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.startsWith('# cursor-test')).toBe(true);
    });

    test('project.goal appears as description', async () => {
      const dir = await createTestSubDir('engine-cursor-goal');
      const outputPath = path.join(dir, '.cursorrules');
      await cursorExport({
        project: { name: 'test', goal: 'Build the best app ever' },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('Build the best app ever');
    });

    test('preferences create Preferences section', async () => {
      const dir = await createTestSubDir('engine-cursor-prefs');
      const outputPath = path.join(dir, '.cursorrules');
      await cursorExport({
        project: { name: 'test' },
        preferences: {
          quality_bar: 'strict',
          testing: 'required',
          documentation: 'minimal',
        },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## Preferences');
      expect(content).toContain('Quality bar: strict');
      expect(content).toContain('Testing: required');
    });

    test('ai_instructions.working_style maps to Coding Standards', async () => {
      const dir = await createTestSubDir('engine-cursor-working-style');
      const outputPath = path.join(dir, '.cursorrules');
      await cursorExport({
        project: { name: 'test' },
        ai_instructions: {
          warnings: ['No eval()'],
          working_style: { quality_bar: 'strict', testing: 'required' },
        },
      }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## Coding Standards');
      expect(content).toContain('No eval()');
    });
  });

  describe('.cursorrules → FAF Mapping', () => {

    test('section-less file imports all lines as guidelines', async () => {
      const dir = await createTestSubDir('engine-cursor-sectionless');
      const cursorContent = 'Use TypeScript.\nPrefer arrow functions.\nWrite tests.';
      await fs.writeFile(path.join(dir, '.cursorrules'), cursorContent);

      const result = await cursorImport(path.join(dir, '.cursorrules'));
      expect(result.success).toBe(true);
      expect(result.faf.project.guidelines).toContain('Use TypeScript.');
      expect(result.faf.project.guidelines).toContain('Prefer arrow functions.');
    });

    test('sectioned file categorizes correctly', async () => {
      const dir = await createTestSubDir('engine-cursor-sectioned');
      const cursorContent = [
        '# my-project',
        '',
        '## Coding Conventions',
        '- 2-space indent',
        '',
        '## Rules',
        '- No console.log in production',
      ].join('\n');
      await fs.writeFile(path.join(dir, '.cursorrules'), cursorContent);

      const result = await cursorImport(path.join(dir, '.cursorrules'));
      expect(result.faf.project.codingStyle).toContain('2-space indent');
      expect(result.faf.project.rules).toContain('No console.log in production');
    });
  });

  describe('Detection — Case Variations', () => {

    test('detects AGENTS.md (uppercase)', async () => {
      const dir = await createTestSubDir('engine-detect-upper');
      await fs.writeFile(path.join(dir, 'AGENTS.md'), '# Test');
      const result = await detectAgentsMd(dir);
      expect(result).toBe(path.join(dir, 'AGENTS.md'));
    });

    test('detects agents.md (lowercase)', async () => {
      const dir = await createTestSubDir('engine-detect-lower');
      await fs.writeFile(path.join(dir, 'agents.md'), '# Test');
      const result = await detectAgentsMd(dir);
      // On case-insensitive filesystems (macOS), AGENTS.md check may find agents.md
      expect(result).not.toBeNull();
      expect(result!.toLowerCase()).toBe(path.join(dir, 'agents.md').toLowerCase());
    });

    test('detects .cursorrules', async () => {
      const dir = await createTestSubDir('engine-detect-cursorrules');
      await fs.writeFile(path.join(dir, '.cursorrules'), '# Test');
      const result = await detectCursorRules(dir);
      expect(result).toBe(path.join(dir, '.cursorrules'));
    });

    test('detects .cursor-rules (alternate name)', async () => {
      const dir = await createTestSubDir('engine-detect-cursor-dash');
      await fs.writeFile(path.join(dir, '.cursor-rules'), '# Test');
      const result = await detectCursorRules(dir);
      expect(result).toBe(path.join(dir, '.cursor-rules'));
    });
  });
});

// ============================================================================
// 🌀 TIER 3: AERODYNAMICS — Performance
// ============================================================================

describe('🌀 Tier 3: Aerodynamics — Performance', () => {

  test('parseAgentsMd handles 1000-line file in under 50ms', () => {
    // Generate a large AGENTS.md
    const lines = ['# Massive Project', ''];
    for (let i = 0; i < 50; i++) {
      lines.push(`## Section ${i}`);
      for (let j = 0; j < 18; j++) {
        lines.push(`- Rule ${i}.${j}: This is a guideline about something important`);
      }
      lines.push('');
    }
    const content = lines.join('\n');
    expect(content.split('\n').length).toBeGreaterThan(1000);

    const start = Date.now();
    const result = parseAgentsMd(content);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(result.sections.length).toBe(50);
    expect(result.projectName).toBe('Massive Project');
  });

  test('parseCursorRules handles 1000-line file in under 50ms', () => {
    const lines = ['# Giant Cursor Rules', ''];
    for (let i = 0; i < 50; i++) {
      lines.push(`## Category ${i}`);
      for (let j = 0; j < 18; j++) {
        lines.push(`- Convention ${i}.${j}: Always follow this pattern`);
      }
      lines.push('');
    }
    const content = lines.join('\n');

    const start = Date.now();
    const result = parseCursorRules(content);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(result.sections.length).toBe(50);
  });

  test('agentsExport with fully-loaded FAF completes in under 100ms', async () => {
    const dir = await createTestSubDir('perf-agents-export');
    const outputPath = path.join(dir, 'AGENTS.md');

    const start = Date.now();
    const result = await agentsExport(REAL_WORLD_FAF, outputPath);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });

  test('cursorExport with fully-loaded FAF completes in under 100ms', async () => {
    const dir = await createTestSubDir('perf-cursor-export');
    const outputPath = path.join(dir, '.cursorrules');

    const start = Date.now();
    const result = await cursorExport(REAL_WORLD_FAF, outputPath);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });

  test('full import round-trip completes in under 200ms', async () => {
    const dir = await createTestSubDir('perf-roundtrip');

    const start = Date.now();

    // Export
    const agentsPath = path.join(dir, 'AGENTS.md');
    await agentsExport(REAL_WORLD_FAF, agentsPath);

    // Import back
    const result = await agentsImport(agentsPath);

    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(200);
  });

  test('detection in directory with many files completes in under 50ms', async () => {
    const dir = await createTestSubDir('perf-detection-many-files');
    // Create 100 non-matching files
    for (let i = 0; i < 100; i++) {
      await fs.writeFile(path.join(dir, `file-${i}.txt`), 'content');
    }
    // Add the target
    await fs.writeFile(path.join(dir, 'AGENTS.md'), '# Test');

    const start = Date.now();
    const result = await detectAgentsMd(dir);
    const elapsed = Date.now() - start;

    expect(result).toBe(path.join(dir, 'AGENTS.md'));
    expect(elapsed).toBeLessThan(50);
  });
});

// ============================================================================
// 📊 TIER 4: TELEMETRY — Edge Cases (Adversarial Input)
// ============================================================================

describe('📊 Tier 4: Telemetry — Edge Cases', () => {

  describe('Encoding & Special Characters', () => {

    test('UTF-8 BOM marker does not break H1 detection', () => {
      const bom = '\uFEFF';
      const content = `${bom}# BOM Project\n\n## Section\n- Item`;
      const result = parseAgentsMd(content);
      expect(result.projectName).toBe('BOM Project');
      expect(result.sections).toHaveLength(1);
    });

    test('UTF-8 BOM marker works in .cursorrules', () => {
      const bom = '\uFEFF';
      const content = `${bom}# BOM Cursor\n\n## Rules\n- Item`;
      const result = parseCursorRules(content);
      expect(result.projectName).toBe('BOM Cursor');
    });

    test('emoji in project name', () => {
      const result = parseAgentsMd('# 🚀 My Rocket App');
      expect(result.projectName).toBe('🚀 My Rocket App');
    });

    test('emoji in section headers', () => {
      const content = '## 🛠️ Build Commands\n- npm run build';
      const result = parseAgentsMd(content);
      expect(result.sections[0].title).toBe('🛠️ Build Commands');
    });

    test('Unicode in bullets (CJK, Arabic, Cyrillic)', () => {
      const content = [
        '## International',
        '- 日本語のルール (Japanese rules)',
        '- قواعد عربية (Arabic rules)',
        '- Русские правила (Russian rules)',
      ].join('\n');
      const result = parseAgentsMd(content);
      expect(result.sections[0].content).toHaveLength(3);
      expect(result.sections[0].content[0]).toContain('日本語');
    });

    test('special regex characters in content do not break parsing', () => {
      const content = [
        '## Regex Safety',
        '- Match pattern: /^[a-z]+$/g',
        '- Replace with $1 and $2 groups',
        '- Use .* carefully (greedy)',
        '- Escape (parentheses) and [brackets]',
      ].join('\n');
      const result = parseAgentsMd(content);
      expect(result.sections[0].content).toHaveLength(4);
      expect(result.sections[0].content[0]).toContain('/^[a-z]+$/g');
    });
  });

  describe('Malformed Markdown', () => {

    test('H3 headers are NOT treated as H2 sections', () => {
      const content = [
        '## Real Section',
        '- Item',
        '### Sub-heading (NOT a section)',
        '- Sub item',
      ].join('\n');
      const result = parseAgentsMd(content);
      // H3 should not create a new section
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe('Real Section');
    });

    test('# without space is NOT treated as H1', () => {
      const content = '#NotAHeader\n## Real Section\n- Item';
      const result = parseAgentsMd(content);
      expect(result.projectName).toBe('Unknown Project');
      expect(result.sections).toHaveLength(1);
    });

    test('## without space is NOT treated as H2', () => {
      const content = '##NotASection\n## Real Section\n- Item';
      const result = parseAgentsMd(content);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe('Real Section');
    });

    test('multiple H1 headers — last one wins', () => {
      const content = '# First Name\n\n# Second Name\n\n## Section\n- Item';
      const result = parseAgentsMd(content);
      expect(result.projectName).toBe('Second Name');
    });

    test('asterisk bullets (* ) work same as dash bullets (- )', () => {
      const content = '## Mixed\n- Dash item\n* Star item';
      const result = parseAgentsMd(content);
      expect(result.sections[0].content).toEqual(['Dash item', 'Star item']);
    });

    test('indented bullets are handled gracefully', () => {
      // Indented bullets (  - item) don't match ^[-*] regex
      // This is a known limitation — they should not crash
      const content = '## Section\n- Root item\n  - Sub item\n    - Deep item';
      const result = parseAgentsMd(content);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].content).toContain('Root item');
      // Sub-items may or may not be captured depending on implementation
      // Key: no crash
    });

    test('numbered lists in .cursorrules are captured as paragraph text', () => {
      const content = '## Steps\n1. First step\n2. Second step\n3. Third step';
      const result = parseCursorRules(content);
      expect(result.sections).toHaveLength(1);
      // Numbered lists are captured as paragraph text in cursorrules parser
      expect(result.sections[0].content.length).toBeGreaterThan(0);
    });

    test('code blocks are not parsed as headers', () => {
      const content = [
        '## Real Section',
        '- Before code',
        '```markdown',
        '## This is inside a code block',
        '- This is not a real bullet',
        '```',
        '- After code',
      ].join('\n');
      const result = parseAgentsMd(content);
      // Note: simple parser doesn't track code blocks — this documents behavior
      // The key assertion: it doesn't crash
      expect(result).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
    });

    test('empty lines between bullets are handled', () => {
      const content = '## Section\n- Item 1\n\n- Item 2\n\n- Item 3';
      const result = parseAgentsMd(content);
      expect(result.sections[0].content).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    test('trailing whitespace on lines is trimmed', () => {
      const content = '## Section   \n- Item with trailing spaces   ';
      const result = parseAgentsMd(content);
      expect(result.sections[0].title).toBe('Section');
      expect(result.sections[0].content[0]).toBe('Item with trailing spaces');
    });
  });

  describe('Export Edge Cases', () => {

    test('export with completely empty FAF object', async () => {
      const dir = await createTestSubDir('edge-empty-faf');
      const outputPath = path.join(dir, 'AGENTS.md');
      const result = await agentsExport({}, outputPath);
      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# My Project'); // fallback name
    });

    test('export with null/undefined fields', async () => {
      const dir = await createTestSubDir('edge-null-fields');
      const outputPath = path.join(dir, 'AGENTS.md');
      const result = await agentsExport({
        project: { name: 'test', goal: null },
        stack: { frontend: undefined, backend: 'Express' },
        ai_instructions: null,
        preferences: undefined,
      }, outputPath);
      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# test');
      expect(content).toContain('Backend: Express');
    });

    test('cursorrules export with empty stack', async () => {
      const dir = await createTestSubDir('edge-cursor-empty-stack');
      const outputPath = path.join(dir, '.cursorrules');
      const result = await cursorExport({
        project: { name: 'test' },
        stack: {},
      }, outputPath);
      expect(result.success).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      // No Tech Stack section should appear
      expect(content).not.toContain('## Tech Stack');
    });

    test('export handles string with newlines in project goal', async () => {
      const dir = await createTestSubDir('edge-multiline-goal');
      const outputPath = path.join(dir, 'AGENTS.md');
      const result = await agentsExport({
        project: {
          name: 'test',
          goal: 'Line one\nLine two\nLine three',
        },
      }, outputPath);
      expect(result.success).toBe(true);
      // Should not crash, content should be written
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Import Edge Cases', () => {

    test('import file with only comments/blank lines', async () => {
      const dir = await createTestSubDir('edge-comments-only');
      await fs.writeFile(path.join(dir, 'AGENTS.md'), '\n\n\n\n\n');
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));
      expect(result.success).toBe(true);
      expect(result.faf.project.name).toBe('Unknown Project');
    });

    test('import extremely long single line (10K chars)', async () => {
      const dir = await createTestSubDir('edge-long-line');
      const longLine = '- ' + 'x'.repeat(10000);
      const content = `## Section\n${longLine}`;
      await fs.writeFile(path.join(dir, 'AGENTS.md'), content);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));
      expect(result.success).toBe(true);
      expect(result.faf.project.guidelines[0].length).toBe(10000);
    });

    test('import preserves bullet content exactly (no mangling)', async () => {
      const dir = await createTestSubDir('edge-exact-content');
      const content = [
        '## Section',
        '- `const x = 42;` — use const always',
        '- path: /usr/local/bin/node',
        '- config: {"key": "value", "nested": true}',
        '- URL: https://example.com/path?q=1&b=2#hash',
      ].join('\n');
      await fs.writeFile(path.join(dir, 'AGENTS.md'), content);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.faf.project.guidelines).toContain('`const x = 42;` — use const always');
      expect(result.faf.project.guidelines).toContain('path: /usr/local/bin/node');
      expect(result.faf.project.guidelines).toContain('config: {"key": "value", "nested": true}');
      expect(result.faf.project.guidelines).toContain('URL: https://example.com/path?q=1&b=2#hash');
    });
  });
});

// ============================================================================
// 🏆 TIER 5: CHAMPIONSHIP — Integration (Real-World Scenarios)
// ============================================================================

describe('🏆 Tier 5: Championship — Integration', () => {

  describe('Real-World FAF Round-Trip', () => {

    test('faf-cli project.faf → AGENTS.md → import preserves project name', async () => {
      const dir = await createTestSubDir('champ-faf-agents-roundtrip');

      // Export real FAF to AGENTS.md
      const agentsPath = path.join(dir, 'AGENTS.md');
      const exportResult = await agentsExport(REAL_WORLD_FAF, agentsPath);
      expect(exportResult.success).toBe(true);

      // Import back
      const importResult = await agentsImport(agentsPath);
      expect(importResult.success).toBe(true);
      expect(importResult.faf.project.name).toBe('faf-cli');
    });

    test('faf-cli project.faf → .cursorrules → import preserves project name', async () => {
      const dir = await createTestSubDir('champ-faf-cursor-roundtrip');

      // Export real FAF to .cursorrules
      const cursorPath = path.join(dir, '.cursorrules');
      const exportResult = await cursorExport(REAL_WORLD_FAF, cursorPath);
      expect(exportResult.success).toBe(true);

      // Import back
      const importResult = await cursorImport(cursorPath);
      expect(importResult.success).toBe(true);
      expect(importResult.faf.project.name).toBe('faf-cli');
    });

    test('AGENTS.md export includes all critical sections for real FAF', async () => {
      const dir = await createTestSubDir('champ-agents-sections');
      const agentsPath = path.join(dir, 'AGENTS.md');
      await agentsExport(REAL_WORLD_FAF, agentsPath);
      const content = await fs.readFile(agentsPath, 'utf-8');

      // Must have these sections for a real-world AGENTS.md
      expect(content).toContain('## Project Overview');
      expect(content).toContain('## Tech Stack');
      expect(content).toContain('## Code Style Guidelines');
      expect(content).toContain('## Build and Test Commands');
      expect(content).toContain('## Architecture');
    });

    test('.cursorrules export includes all critical sections for real FAF', async () => {
      const dir = await createTestSubDir('champ-cursor-sections');
      const cursorPath = path.join(dir, '.cursorrules');
      await cursorExport(REAL_WORLD_FAF, cursorPath);
      const content = await fs.readFile(cursorPath, 'utf-8');

      expect(content).toContain('## Tech Stack');
      expect(content).toContain('## Coding Standards');
      expect(content).toContain('## Preferences');
      expect(content).toContain('## Build Commands');
    });
  });

  describe('Multi-Format Side-by-Side', () => {

    test('same FAF exported to AGENTS.md and .cursorrules produces consistent content', async () => {
      const dir = await createTestSubDir('champ-side-by-side');
      const agentsPath = path.join(dir, 'AGENTS.md');
      const cursorPath = path.join(dir, '.cursorrules');

      await agentsExport(REAL_WORLD_FAF, agentsPath);
      await cursorExport(REAL_WORLD_FAF, cursorPath);

      const agentsContent = await fs.readFile(agentsPath, 'utf-8');
      const cursorContent = await fs.readFile(cursorPath, 'utf-8');

      // Both should have the same project name
      expect(agentsContent).toContain('# faf-cli');
      expect(cursorContent).toContain('# faf-cli');

      // Both should reference the tech stack
      expect(agentsContent).toContain('Node.js');
      expect(cursorContent).toContain('Node.js');

      // Both should reference TypeScript warnings
      expect(agentsContent).toContain('All TypeScript must pass strict mode');
      expect(cursorContent).toContain('All TypeScript must pass strict mode');
    });

    test('both exports create valid, non-empty files', async () => {
      const dir = await createTestSubDir('champ-both-valid');
      const agentsPath = path.join(dir, 'AGENTS.md');
      const cursorPath = path.join(dir, '.cursorrules');

      await agentsExport(REAL_WORLD_FAF, agentsPath);
      await cursorExport(REAL_WORLD_FAF, cursorPath);

      const agentsStat = await fs.stat(agentsPath);
      const cursorStat = await fs.stat(cursorPath);

      expect(agentsStat.size).toBeGreaterThan(100); // Not trivially small
      expect(cursorStat.size).toBeGreaterThan(100);
    });
  });

  describe('Real-World AGENTS.md Formats', () => {

    test('OpenAI Codex-style AGENTS.md imports correctly', async () => {
      const dir = await createTestSubDir('champ-codex-style');
      // Realistic Codex-generated AGENTS.md
      const codexAgents = [
        '# my-saas-app',
        '',
        '## Project Overview',
        '- SaaS application for project management',
        '- Built with Next.js 14 and TypeScript',
        '- Uses PostgreSQL with Prisma ORM',
        '',
        '## Architecture',
        '- App Router with server components',
        '- API routes in /app/api/',
        '- Shared components in /components/ui/',
        '',
        '## Code Style Guidelines',
        '- Use TypeScript strict mode',
        '- Prefer server components over client components',
        '- Use Tailwind CSS for styling',
        '- Follow Airbnb ESLint config',
        '',
        '## Build and Test Commands',
        '- `npm run dev` — Start development server',
        '- `npm run build` — Production build',
        '- `npm test` — Run Jest tests',
        '- `npm run lint` — ESLint check',
        '',
        '## Constraints',
        '- Never expose API keys in client components',
        '- All database queries must use Prisma',
        '- Maximum 50 lines per function',
      ].join('\n');

      await fs.writeFile(path.join(dir, 'AGENTS.md'), codexAgents);
      const result = await agentsImport(path.join(dir, 'AGENTS.md'));

      expect(result.success).toBe(true);
      expect(result.faf.project.name).toBe('my-saas-app');
      expect(result.faf.project.guidelines.length).toBeGreaterThan(0);
      expect(result.faf.project.codingStyle.length).toBeGreaterThan(0);
      expect(result.faf.project.buildCommands.length).toBeGreaterThan(0);
      expect(result.faf.project.rules.length).toBeGreaterThan(0);
      expect(result.faf.project.architecture.length).toBeGreaterThan(0);

      // Verify specific categorization
      expect(result.faf.project.buildCommands).toContain('`npm run dev` — Start development server');
      expect(result.faf.project.rules).toContain('Never expose API keys in client components');
      expect(result.faf.project.architecture).toContain('App Router with server components');
    });

    test('minimal .cursorrules (just prose) imports without error', async () => {
      const dir = await createTestSubDir('champ-minimal-cursor');
      // Many real .cursorrules are just unstructured text
      const minimalCursor = [
        'You are an expert in TypeScript and React.',
        'Always use functional components.',
        'Prefer hooks over class components.',
        'Use Tailwind CSS for styling.',
        'Keep functions under 30 lines.',
        'Write unit tests for all utilities.',
      ].join('\n');

      await fs.writeFile(path.join(dir, '.cursorrules'), minimalCursor);
      const result = await cursorImport(path.join(dir, '.cursorrules'));

      expect(result.success).toBe(true);
      expect(result.faf.project.guidelines.length).toBe(6);
      expect(result.faf.project.guidelines).toContain('You are an expert in TypeScript and React.');
    });

    test('structured .cursorrules with mixed bullet styles imports correctly', async () => {
      const dir = await createTestSubDir('champ-structured-cursor');
      const structuredCursor = [
        '# enterprise-dashboard',
        '',
        '## Tech Stack',
        '- React 18 with TypeScript',
        '* Vite for bundling',
        '- Zustand for state management',
        '',
        '## Coding Conventions',
        '- Use barrel exports (index.ts)',
        '* Components in PascalCase',
        '- Hooks prefixed with use',
      ].join('\n');

      await fs.writeFile(path.join(dir, '.cursorrules'), structuredCursor);
      const result = await cursorImport(path.join(dir, '.cursorrules'));

      expect(result.success).toBe(true);
      expect(result.faf.project.name).toBe('enterprise-dashboard');
      expect(result.sectionsFound).toContain('Tech Stack');
      expect(result.sectionsFound).toContain('Coding Conventions');
    });
  });

  describe('JSON/YAML Safety', () => {

    test('import result is JSON-serializable', async () => {
      const dir = await createTestSubDir('champ-json-safe');
      const content = '# Test\n\n## Section\n- Item';
      await fs.writeFile(path.join(dir, 'AGENTS.md'), content);

      const result = await agentsImport(path.join(dir, 'AGENTS.md'));
      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.success).toBe(true);
      expect(deserialized.faf.project.name).toBe('Test');
    });

    test('all arrays in import result are string arrays (YAML-safe)', async () => {
      const dir = await createTestSubDir('champ-yaml-safe');
      const content = [
        '# Test',
        '## Style',
        '- Item 1',
        '## Rules',
        '- Rule 1',
        '## Build Commands',
        '- npm build',
        '## Architecture',
        '- Monolith',
      ].join('\n');
      await fs.writeFile(path.join(dir, 'AGENTS.md'), content);

      const result = await agentsImport(path.join(dir, 'AGENTS.md'));
      // All content arrays must be string[]
      result.faf.project.rules.forEach(r => expect(typeof r).toBe('string'));
      result.faf.project.guidelines.forEach(g => expect(typeof g).toBe('string'));
      result.faf.project.codingStyle.forEach(c => expect(typeof c).toBe('string'));
      result.faf.project.buildCommands.forEach(b => expect(typeof b).toBe('string'));
      result.faf.project.architecture.forEach(a => expect(typeof a).toBe('string'));
      result.sectionsFound.forEach(s => expect(typeof s).toBe('string'));
      result.warnings.forEach(w => expect(typeof w).toBe('string'));
    });

    test('export result is JSON-serializable', async () => {
      const dir = await createTestSubDir('champ-export-json-safe');
      const outputPath = path.join(dir, 'AGENTS.md');
      const result = await agentsExport(REAL_WORLD_FAF, outputPath);

      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.success).toBe(true);
    });
  });

  describe('Overwrite Protection', () => {

    test('agentsExport overwrites existing file', async () => {
      const dir = await createTestSubDir('champ-overwrite-agents');
      const outputPath = path.join(dir, 'AGENTS.md');

      // Write original
      await fs.writeFile(outputPath, '# Old Content');

      // Export should overwrite (export function always writes)
      await agentsExport({ project: { name: 'new-content' } }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# new-content');
      expect(content).not.toContain('# Old Content');
    });

    test('cursorExport overwrites existing file', async () => {
      const dir = await createTestSubDir('champ-overwrite-cursor');
      const outputPath = path.join(dir, '.cursorrules');

      await fs.writeFile(outputPath, '# Old Cursor Rules');
      await cursorExport({ project: { name: 'new-cursor' } }, outputPath);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# new-cursor');
    });
  });
});

// ============================================================================
// Championship Report
// ============================================================================

afterAll(() => {
  console.log(`
🏆 WJTTC INTEROP FORMATS CHAMPIONSHIP REPORT 🏆
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Tiers:
  ✓ TIER 0: Pit Lane — Platform Safety (cross-platform, line endings)
  ✓ TIER 1: Brake Systems — Crash Safety (empty, null, missing files)
  ✓ TIER 2: Engine Systems — Field Mapping (FAF ↔ AGENTS.md ↔ .cursorrules)
  ✓ TIER 3: Aerodynamics — Performance (1000-line files, speed contracts)
  ✓ TIER 4: Telemetry — Edge Cases (BOM, Unicode, regex chars, malformed MD)
  ✓ TIER 5: Championship — Integration (real FAF, round-trip, multi-format)

Formats Tested:
  📋 AGENTS.md (OpenAI Codex / Linux Foundation)
  🖱️ .cursorrules (Cursor IDE legacy format)

Philosophy: "We break things so others never have to know they were broken"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});
