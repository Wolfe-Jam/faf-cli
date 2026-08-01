/**
 * 🏎️ WJTTC — Go Content-Aware Context Engine
 *
 * F1 Philosophy: When brakes must work flawlessly, so must our code.
 *
 * BRAKE:  go.mod is NEVER blindly labeled "backend"
 * ENGINE: Gin/Cobra/MCP/cmd classification
 * AERO:   priority (MCP > server > CLI), scanner + turbo-cat compose
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectGoProject } from '../../src/detect/go.js';
import {
  detectProjectType,
  detectProjectTypeWithRationale,
  detectLanguage,
  detectPackageManager,
} from '../../src/detect/scanner.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import goSpec from '../../src/detect/go-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-go-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function file(rel: string, content = ''): void {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

const LIB = `module github.com/acme/lib

go 1.22
`;
const GIN = `module github.com/acme/api

go 1.22

require github.com/gin-gonic/gin v1.10.0
`;
const COBRA = `module github.com/acme/tool

go 1.22

require github.com/spf13/cobra v1.8.1
`;
const MCP = `module github.com/acme/mcp

go 1.22

require github.com/mark3labs/mcp-go v0.20.0
`;

// ============================================================
// BRAKE — never misclassify
// ============================================================
describe('WJTTC BRAKE: go.mod is never blindly "backend"', () => {
  test('pure Go module → library, not backend', () => {
    file('go.mod', LIB);
    const gp = detectGoProject(dir);
    expect(gp?.appType).toBe('library');
    expect(gp?.framework).toBe('');
    expect(detectProjectType(dir)).toBe('library');
  });

  test('no go.mod → null / not forced Go', () => {
    file('README.md', '# hi');
    expect(detectGoProject(dir)).toBeNull();
  });
});

// ============================================================
// ENGINE — core intelligence
// ============================================================
describe('WJTTC ENGINE: Go classification', () => {
  test('Gin → backend', () => {
    file('go.mod', GIN);
    const gp = detectGoProject(dir)!;
    expect(gp.appType).toBe('backend');
    expect(gp.framework).toBe('Gin');
    expect(detectProjectType(dir)).toBe('backend');
  });

  test('Cobra → cli', () => {
    file('go.mod', COBRA);
    expect(detectGoProject(dir)?.appType).toBe('cli');
    expect(detectProjectType(dir)).toBe('cli');
  });

  test('mcp-go → mcp', () => {
    file('go.mod', MCP);
    expect(detectGoProject(dir)?.appType).toBe('mcp');
    expect(detectProjectType(dir)).toBe('mcp');
  });

  test('cmd/ layout → cli', () => {
    file('go.mod', LIB);
    file('cmd/app/main.go', 'package main\nfunc main() {}\n');
    expect(detectGoProject(dir)?.appType).toBe('cli');
  });

  test('language + package manager', () => {
    file('go.mod', LIB);
    expect(detectLanguage(dir)).toBe('Go');
    expect(detectPackageManager(dir)).toMatch(/go/i);
  });

  test('Glass Hood found rationale on project type', () => {
    file('go.mod', GIN);
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('backend');
    expect(r.found.some(f => f.includes('gin'))).toBe(true);
  });
});

// ============================================================
// AERO — compose + priority
// ============================================================
describe('WJTTC AERO: priority + Turbo-Cat', () => {
  test('MCP wins over Gin when both present', () => {
    file(
      'go.mod',
      `module github.com/acme/both

go 1.22

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/mark3labs/mcp-go v0.20.0
)
`,
    );
    expect(detectGoProject(dir)?.appType).toBe('mcp');
  });

  test('Gin wins over Cobra when both present', () => {
    file(
      'go.mod',
      `module github.com/acme/svc

go 1.22

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/spf13/cobra v1.8.1
)
`,
    );
    const gp = detectGoProject(dir)!;
    expect(gp.appType).toBe('backend');
    expect(gp.framework).toBe('Gin');
  });

  test('turbo-cat slots: Gin → backend slot', () => {
    file('go.mod', GIN);
    const tc = turboCatSlots(dir);
    expect(tc.project?.main_language).toBe('Go');
    expect(tc.stack?.backend).toBe('Gin');
  });

  test('turbo-cat slots: MCP → apiType', () => {
    file('go.mod', MCP);
    const tc = turboCatSlots(dir);
    expect(tc.project?.main_language).toBe('Go');
    expect(tc.stack?.api_type).toBe('MCP');
  });

  test('knowledge JSON is the single source (version ≥ 1)', () => {
    expect(goSpec.version).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(goSpec.mcpModules)).toBe(true);
    expect(Array.isArray(goSpec.serverFrameworks)).toBe(true);
    expect(Array.isArray(goSpec.cliFrameworks)).toBe(true);
  });
});
