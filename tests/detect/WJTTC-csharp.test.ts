/**
 * WJTTC — C# Content-Aware Context Engine
 *
 * BRAKE:  .csproj is NEVER blindly labeled "backend" / Web API
 * ENGINE: Sdk.Web / Worker / CLI / MCP / classlib classification
 * AERO:   priority (MCP > web), scanner + turbo-cat compose
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectCsharpProject } from '../../src/detect/csharp.js';
import {
  detectProjectType,
  detectProjectTypeWithRationale,
  detectLanguage,
  detectPackageManager,
} from '../../src/detect/scanner.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import csSpec from '../../src/detect/csharp-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-cs-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

const LIB = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
</Project>
`;
const WEB = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
</Project>
`;
const CLI = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="System.CommandLine" Version="2.0.0" />
  </ItemGroup>
</Project>
`;
const MCP = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="ModelContextProtocol" Version="2.0.0" />
  </ItemGroup>
</Project>
`;

describe('WJTTC BRAKE: .csproj is never blindly "backend"', () => {
  test('pure classlib → library, not backend', () => {
    file('Acme.Lib.csproj', LIB);
    const cp = detectCsharpProject(dir);
    expect(cp?.appType).toBe('library');
    expect(cp?.framework).toBe('');
    expect(detectProjectType(dir)).toBe('library');
  });

  test('no csproj → null / not forced C#', () => {
    file('README.md', '# hi');
    expect(detectCsharpProject(dir)).toBeNull();
  });
});

describe('WJTTC ENGINE: C# classification', () => {
  test('Sdk.Web → backend ASP.NET Core', () => {
    file('Acme.Api.csproj', WEB);
    const cp = detectCsharpProject(dir)!;
    expect(cp.appType).toBe('backend');
    expect(cp.framework).toBe('ASP.NET Core');
    expect(detectProjectType(dir)).toBe('backend');
  });

  test('System.CommandLine → cli', () => {
    file('Acme.Tool.csproj', CLI);
    expect(detectCsharpProject(dir)?.appType).toBe('cli');
    expect(detectProjectType(dir)).toBe('cli');
  });

  test('ModelContextProtocol → mcp', () => {
    file('Acme.Mcp.csproj', MCP);
    expect(detectCsharpProject(dir)?.appType).toBe('mcp');
    expect(detectProjectType(dir)).toBe('mcp');
  });

  test('language + package manager', () => {
    file('Acme.Lib.csproj', LIB);
    expect(detectLanguage(dir)).toBe('C#');
    expect(detectPackageManager(dir)).toMatch(/nuget/i);
  });

  test('Glass Hood found rationale on project type', () => {
    file('Acme.Api.csproj', WEB);
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('backend');
    expect(r.found.some(f => f.includes('Sdk.Web') || f.includes('ASP.NET'))).toBe(true);
  });
});

describe('WJTTC AERO: priority + Turbo-Cat', () => {
  test('MCP wins over Web Sdk when both present', () => {
    file(
      'Acme.Both.csproj',
      `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="ModelContextProtocol.AspNetCore" Version="2.0.0" />
  </ItemGroup>
</Project>
`,
    );
    expect(detectCsharpProject(dir)?.appType).toBe('mcp');
  });

  test('turbo-cat slots: Web → backend slot', () => {
    file('Acme.Api.csproj', WEB);
    const tc = turboCatSlots(dir);
    expect(tc.project?.main_language).toBe('C#');
    expect(tc.stack?.backend).toBe('ASP.NET Core');
  });

  test('turbo-cat slots: MCP → apiType', () => {
    file('Acme.Mcp.csproj', MCP);
    const tc = turboCatSlots(dir);
    expect(tc.project?.main_language).toBe('C#');
    expect(tc.stack?.api_type).toBe('MCP');
  });

  test('knowledge JSON is the single source (version ≥ 1)', () => {
    expect(csSpec.version).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(csSpec.mcpPackages)).toBe(true);
    expect(Array.isArray(csSpec.specializedSdks)).toBe(true);
    expect(Array.isArray(csSpec.cliPackages)).toBe(true);
  });
});
