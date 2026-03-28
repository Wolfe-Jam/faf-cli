/**
 * WJTTC Championship Test Suite — MCP Server Detection
 *
 * Tests detection of MCP servers across all supported SDKs.
 * Real-world fixtures based on actual FAF ecosystem projects.
 *
 * BRAKE: Must never break — core detection
 * ENGINE: Should work — framework details
 * AERO: Edge cases — malformed input, mixed projects
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectStack } from '../../src/detect/stack.js';
import { detectFrameworks, detectProjectType } from '../../src/detect/scanner.js';

let testDir: string;
let originalCwd: string;

beforeEach(() => {
  testDir = join(tmpdir(), `faf-wjttc-mcp-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  originalCwd = process.cwd();
  process.chdir(testDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(testDir, { recursive: true, force: true });
});

// --- Helpers ---

function writePkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}, extras: Record<string, unknown> = {}) {
  writeFileSync(join(testDir, 'package.json'), JSON.stringify({
    name: 'test-mcp-server',
    description: 'Test MCP server',
    dependencies: deps,
    devDependencies: devDeps,
    ...extras,
  }));
}

function writePyproject(deps: string[], name = 'test-mcp-server', description = 'Test MCP server') {
  const depsStr = deps.map(d => `"${d}"`).join(', ');
  writeFileSync(join(testDir, 'pyproject.toml'), `[project]\nname = "${name}"\ndescription = "${description}"\ndependencies = [${depsStr}]\n`);
}

function writeCargo(deps: Record<string, string>, name = 'test-mcp-server') {
  const depsStr = Object.entries(deps).map(([k, v]) => `${k} = "${v}"`).join('\n');
  writeFileSync(join(testDir, 'Cargo.toml'), `[package]\nname = "${name}"\n\n[dependencies]\n${depsStr}\n`);
}

// =============================================================================
// TIER 1: BRAKE — Must never break
// =============================================================================

describe('WJTTC — MCP Server Detection', () => {
  describe('TIER 1 BRAKE — Core MCP Detection', () => {

    test('#1 @modelcontextprotocol/sdk detected as MCP (claude-faf-mcp pattern)', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0', 'faf-cli': '^6.0.0' }, { typescript: '^5.0.0' }, { bin: { 'claude-faf-mcp': 'dist/index.js' } });
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.framework).toBe('mcp-sdk-ts');
      expect(data.stack?.backend).toBe('MCP SDK (TS)');
      expect(data.stack?.api_type).toBe('MCP (stdio/SSE)');
    });

    test('#2 FastMCP detected from pyproject.toml (gemini-faf-mcp pattern)', () => {
      writePyproject(['fastmcp>=3.0.0', 'pyyaml', 'requests'], 'gemini-faf-mcp', 'FAF MCP Server for Gemini');
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.framework).toBe('fastmcp');
      expect(data.stack?.backend).toBe('FastMCP');
      expect(data.stack?.api_type).toBe('MCP (stdio/SSE)');
    });

    test('#3 Official Python MCP SDK detected', () => {
      writePyproject(['mcp>=1.0.0', 'pyyaml']);
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.framework).toBe('mcp-sdk-py');
      expect(data.stack?.backend).toBe('MCP SDK (Python)');
    });

    test('#4 rmcp detected from Cargo.toml (rust-faf-mcp pattern)', () => {
      writeCargo({ rmcp: '0.1', tokio: '1' }, 'rust-faf-mcp');
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.framework).toBe('rmcp');
      expect(data.stack?.backend).toBe('rmcp');
    });

    test('#5 MCP type takes priority over CLI (bin field present)', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' }, {}, { bin: { 'my-mcp': 'dist/index.js' } });
      const type = detectProjectType(testDir);
      expect(type).toBe('mcp');
    });

    test('#6 Project name from pyproject.toml for MCP servers', () => {
      writePyproject(['fastmcp>=3.0.0'], 'my-gemini-server', 'Custom Gemini MCP');
      const data = detectStack(testDir);
      expect(data.project?.name).toBe('my-gemini-server');
      expect(data.project?.goal).toBe('Custom Gemini MCP');
    });

    test('#7 MCP servers have backend slots active (not slotignored)', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' });
      const data = detectStack(testDir);
      expect(data.stack?.backend).not.toBe('slotignored');
      expect(data.stack?.api_type).not.toBe('slotignored');
      expect(data.stack?.runtime).not.toBe('slotignored');
      expect(data.stack?.hosting).not.toBe('slotignored');
      expect(data.stack?.build).not.toBe('slotignored');
      expect(data.stack?.cicd).not.toBe('slotignored');
    });

    test('#8 MCP servers have frontend slots slotignored', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' });
      const data = detectStack(testDir);
      expect(data.stack?.frontend).toBe('slotignored');
      expect(data.stack?.css_framework).toBe('slotignored');
      expect(data.stack?.ui_library).toBe('slotignored');
      expect(data.stack?.state_management).toBe('slotignored');
    });

    test('#9 faf_version is 3.0 for MCP servers', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' });
      const data = detectStack(testDir);
      expect(data.faf_version).toBe('3.0');
    });

    test('#10 MCP language detected correctly — TypeScript', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' }, { typescript: '^5.0.0' });
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      const data = detectStack(testDir);
      expect(data.project?.main_language).toBe('TypeScript');
    });

    test('#11 MCP language detected correctly — Python', () => {
      writePyproject(['fastmcp>=3.0.0']);
      const data = detectStack(testDir);
      expect(data.project?.main_language).toBe('Python');
    });
  });

  // =============================================================================
  // TIER 2: ENGINE — Should work
  // =============================================================================

  describe('TIER 2 ENGINE — Framework Details', () => {

    test('#12 FastMCP does NOT false-match as FastAPI', () => {
      writePyproject(['fastmcp>=3.0.0']);
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'fastmcp')).toBe(true);
      expect(fws.some(f => f.slug === 'fastapi')).toBe(false);
    });

    test('#13 MCP + SQLAlchemy detected together', () => {
      writePyproject(['fastmcp>=3.0.0', 'sqlalchemy>=2.0']);
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.stack?.backend).toBe('FastMCP');
      expect(data.stack?.database).toBe('SQLAlchemy');
    });

    test('#14 MCP + Express detected — MCP wins type, Express ignored for backend', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0', express: '^4.0.0' });
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.stack?.backend).toBe('MCP SDK (TS)');
    });

    test('#15 Multiple MCP signals — first by priority wins', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0', '@fastmcp/server': '^1.0.0' });
      const data = detectStack(testDir);
      expect(data.project?.framework).toBe('mcp-sdk-ts');
    });

    test('#16 MCP server scores higher than library', () => {
      // MCP server
      writePyproject(['fastmcp>=3.0.0']);
      const mcpData = detectStack(testDir);
      const mcpEmpty = Object.values(mcpData.stack ?? {}).filter(v => v === '').length;
      const mcpIgnored = Object.values(mcpData.stack ?? {}).filter(v => v === 'slotignored').length;

      // Library (reset)
      rmSync(join(testDir, 'pyproject.toml'));
      writePyproject(['pyyaml']);
      const libData = detectStack(testDir);
      const libIgnored = Object.values(libData.stack ?? {}).filter(v => v === 'slotignored').length;

      // MCP has more active slots (fewer slotignored)
      expect(mcpIgnored).toBeLessThan(libIgnored);
    });

    test('#17 grok-faf-mcp pattern — TS MCP with bin + SSE transport', () => {
      writePkg(
        { '@modelcontextprotocol/sdk': '^1.0.0', express: '^4.0.0' },
        { typescript: '^5.0.0' },
        { bin: { 'grok-faf-mcp': 'dist/index.js' } },
      );
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.main_language).toBe('TypeScript');
      expect(data.stack?.api_type).toBe('MCP (stdio/SSE)');
    });

    test('#18 @fastmcp/server (TS variant) detected', () => {
      writePkg({ '@fastmcp/server': '^1.0.0' });
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.framework).toBe('fastmcp-ts');
    });
  });

  // =============================================================================
  // TIER 3: AERO — Edge cases
  // =============================================================================

  describe('TIER 3 AERO — Edge Cases', () => {

    test('#19 Malformed pyproject.toml does not crash', () => {
      writeFileSync(join(testDir, 'pyproject.toml'), 'this is not valid toml {{{{');
      expect(() => detectStack(testDir)).not.toThrow();
    });

    test('#20 Empty dependencies array — no crash', () => {
      writePyproject([]);
      expect(() => detectStack(testDir)).not.toThrow();
    });

    test('#21 pyproject.toml with no [project] section', () => {
      writeFileSync(join(testDir, 'pyproject.toml'), '[build-system]\nrequires = ["setuptools"]\n');
      const data = detectStack(testDir);
      expect(data.project?.type).not.toBe('mcp');
    });

    test('#22 Python deps with version specifiers parsed correctly', () => {
      writePyproject(['fastmcp>=3.0.0', 'sqlalchemy[asyncio]>=2.0', 'uvicorn==0.20.0']);
      const fws = detectFrameworks(testDir);
      expect(fws.some(f => f.slug === 'fastmcp')).toBe(true);
      expect(fws.some(f => f.slug === 'sqlalchemy')).toBe(true);
    });

    test('#23 Non-MCP Python project stays as backend', () => {
      writePyproject(['fastapi>=0.100', 'sqlalchemy', 'redis']);
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('backend');
      expect(data.stack?.backend).toBe('FastAPI');
    });

    test('#24 Non-MCP Python library stays as library', () => {
      writePyproject(['pyyaml', 'requests']);
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('library');
    });

    test('#25 Mixed project — package.json MCP + pyproject.toml — TS MCP wins', () => {
      writePkg({ '@modelcontextprotocol/sdk': '^1.0.0' }, { typescript: '^5.0.0' });
      writePyproject(['fastmcp>=3.0.0']);
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      // TS SDK is #1 priority, should win
      expect(data.project?.framework).toBe('mcp-sdk-ts');
    });

    test('#26 Cargo.toml with rmcp — Rust MCP detected', () => {
      writeCargo({ rmcp: '0.1', 'serde' : '1', 'tokio': '1' });
      const data = detectStack(testDir);
      expect(data.project?.type).toBe('mcp');
      expect(data.project?.main_language).toBe('Rust');
    });

    test('#27 Empty directory — no crash, defaults to Unknown', () => {
      const data = detectStack(testDir);
      expect(data.project?.type).toBeDefined();
      expect(data.faf_version).toBe('3.0');
    });
  });
});
