import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import spec from './csharp-detection.json';

/**
 * C# /.NET detection — CONTENT-AWARE .csproj classification.
 *
 * A .csproj alone does NOT mean Web API / ASP.NET. Microsoft encodes kind in
 * Project Sdk, then OutputType / Use* props / PackageReference / FrameworkReference.
 * Kill line: .csproj alone ≠ type.
 *
 * Same composition pattern as go.ts / dart.ts: knowledge in csharp-detection.json,
 * logic here. Turbo-Cat + scanner both call detectCsharpProject so they agree.
 */

/** FAF project types we emit (aligned with Go + mobile for MAUI). */
export type CsharpAppType = 'mcp' | 'backend' | 'cli' | 'library' | 'mobile';

export interface CsharpProject {
  appType: CsharpAppType;
  /** Assembly / project name from filename, or ''. */
  projectName: string;
  /** TargetFramework(s) raw string if present. */
  targetFramework: string;
  /** Sdk attribute (e.g. Microsoft.NET.Sdk.Web). */
  sdk: string;
  /** Primary framework label (ASP.NET Core / Worker / Cobra-equivalent / …). */
  framework: string;
  /** Human-readable rationale for the .faf `# found:` comment (Glass Hood). */
  found: string;
}

const MCP_PACKAGES = (spec.mcpPackages as string[]).map(p => p.toLowerCase());
const CLI_PACKAGES = (spec.cliPackages as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const TEST_PACKAGES = (spec.testPackages as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const GRPC_SERVER = (spec.grpcServerPackages as string[]).map(p => p.toLowerCase());
const SPECIALIZED = spec.specializedSdks as Array<[string, string, string]>;
const BASE_SDK = (spec.baseSdk as string).toLowerCase();

export interface ParsedCsproj {
  sdk: string;
  outputType: string;
  targetFramework: string;
  isTestProject: boolean;
  useMaui: boolean;
  useWpf: boolean;
  useWindowsForms: boolean;
  packages: Set<string>;
  frameworkRefs: Set<string>;
}

/** Parse the load-bearing fields of an SDK-style .csproj (regex — adequate for detection). */
export function parseCsproj(content: string): ParsedCsproj {
  // Sdk="Name" or Sdk="Name/1.2.3"
  const sdkAttr = content.match(/<Project\b[^>]*\bSdk\s*=\s*"([^"/]+)(?:\/[^"]*)?"/i);
  // Additive <Sdk Name="..." />
  const sdkElem = content.match(/<Sdk\b[^>]*\bName\s*=\s*"([^"]+)"/i);
  const sdk = (sdkAttr?.[1] || sdkElem?.[1] || '').trim();

  const outputType = (content.match(/<OutputType>\s*([^<]+?)\s*<\/OutputType>/i)?.[1] || '').trim();
  const tfSingle = content.match(/<TargetFramework>\s*([^<]+?)\s*<\/TargetFramework>/i)?.[1];
  const tfMulti = content.match(/<TargetFrameworks>\s*([^<]+?)\s*<\/TargetFrameworks>/i)?.[1];
  const targetFramework = (tfMulti || tfSingle || '').trim();

  const isTestProject = /<IsTestProject>\s*true\s*<\/IsTestProject>/i.test(content);
  const useMaui = /<UseMaui>\s*true\s*<\/UseMaui>/i.test(content);
  const useWpf = /<UseWPF>\s*true\s*<\/UseWPF>/i.test(content);
  const useWindowsForms = /<UseWindowsForms>\s*true\s*<\/UseWindowsForms>/i.test(content);

  const packages = new Set<string>();
  for (const m of content.matchAll(/<PackageReference\b[^>]*\bInclude\s*=\s*"([^"]+)"/gi)) {
    packages.add(m[1].toLowerCase());
  }
  // Versionless CPM still uses Include=
  for (const m of content.matchAll(/<PackageReference\s+Include\s*=\s*"([^"]+)"/gi)) {
    packages.add(m[1].toLowerCase());
  }

  const frameworkRefs = new Set<string>();
  for (const m of content.matchAll(/<FrameworkReference\b[^>]*\bInclude\s*=\s*"([^"]+)"/gi)) {
    frameworkRefs.add(m[1].toLowerCase());
  }

  return {
    sdk,
    outputType,
    targetFramework,
    isTestProject,
    useMaui,
    useWpf,
    useWindowsForms,
    packages,
    frameworkRefs,
  };
}

function hasPackage(pkgs: Set<string>, id: string): boolean {
  const n = id.toLowerCase();
  if (pkgs.has(n)) {return true;}
  // Subpath-ish: ModelContextProtocol.AspNetCore when looking for ModelContextProtocol
  for (const p of pkgs) {
    if (p === n || p.startsWith(`${n}.`)) {return true;}
  }
  return false;
}

function findPackageLabel(pkgs: Set<string>, entries: Array<[string, string]>): [string, string] | undefined {
  let best: [string, string] | undefined;
  for (const [id, label] of entries) {
    if (!hasPackage(pkgs, id)) {continue;}
    if (!best || id.length > best[0].length) {best = [id, label];}
  }
  return best;
}

function findMcpPackage(pkgs: Set<string>): string | undefined {
  let best: string | undefined;
  for (const id of MCP_PACKAGES) {
    if (!hasPackage(pkgs, id)) {continue;}
    if (!best || id.length > best.length) {best = id;}
  }
  // Also: any package starting with modelcontextprotocol
  for (const p of pkgs) {
    if (p === 'modelcontextprotocol' || p.startsWith('modelcontextprotocol.')) {
      if (!best || p.length > best.length) {best = p;}
    }
  }
  return best;
}

function matchSpecializedSdk(sdk: string): [string, string, string] | undefined {
  const s = sdk.toLowerCase();
  if (!s) {return undefined;}
  // Longest specialized match (Web before bare if ever needed)
  let best: [string, string, string] | undefined;
  for (const row of SPECIALIZED) {
    const name = row[0].toLowerCase();
    if (s === name || s.startsWith(`${name}/`)) {
      if (!best || name.length > best[0].length) {best = row;}
    }
  }
  return best;
}

function isExe(outputType: string): boolean {
  const o = outputType.toLowerCase();
  return o === 'exe' || o === 'winexe';
}

/** Priority rank for multi-csproj roots — lower wins. */
function rank(appType: CsharpAppType, framework: string): number {
  if (appType === 'mcp') {return 0;}
  if (appType === 'mobile') {return 1;}
  if (appType === 'backend') {return 2;}
  if (appType === 'cli') {return 3;}
  if (framework && framework !== '') {return 4;} // test-labelled library etc.
  return 5;
}

/** Classify a single parsed csproj. */
export function classifyCsproj(
  parsed: ParsedCsproj,
  projectFileName: string,
): Omit<CsharpProject, 'projectName'> & { projectName: string } {
  const name = projectFileName.replace(/\.csproj$/i, '');
  const { sdk, packages, frameworkRefs, outputType } = parsed;

  let appType: CsharpAppType;
  let framework = '';
  let found: string;

  const mcpPkg = findMcpPackage(packages);
  const specialized = matchSpecializedSdk(sdk);
  const testPkg = findPackageLabel(packages, TEST_PACKAGES);
  const cliPkg = findPackageLabel(packages, CLI_PACKAGES);
  const hasGrpcServer = GRPC_SERVER.some(g => hasPackage(packages, g));
  const hasAspNetRef = frameworkRefs.has('microsoft.aspnetcore.app');

  // Priority: MCP → test → maui/desktop → specialized Sdk → AspNet FrameworkRef host → CLI → console Exe → library
  // .csproj alone (base Sdk, no signals) is never web/backend.
  if (mcpPkg) {
    appType = 'mcp';
    framework = 'MCP';
    found = `${projectFileName} + ${mcpPkg} (C# MCP server)`;
  } else if (parsed.isTestProject || specialized?.[1] === 'test' || testPkg) {
    appType = 'library';
    framework = testPkg?.[1] || (specialized?.[1] === 'test' ? specialized[2] : 'Test');
    found = `${projectFileName} + test (${framework})`;
  } else if (parsed.useMaui) {
    appType = 'mobile';
    framework = 'MAUI';
    found = `${projectFileName} + UseMaui (MAUI)`;
  } else if (parsed.useWpf || parsed.useWindowsForms) {
    appType = 'backend'; // desktop host — nearest durable type for agents
    framework = parsed.useWpf && parsed.useWindowsForms
      ? 'WPF+WinForms'
      : parsed.useWpf
        ? 'WPF'
        : 'Windows Forms';
    found = `${projectFileName} + ${framework}`;
  } else if (specialized?.[1] === 'web') {
    appType = 'backend';
    framework = hasGrpcServer ? 'gRPC' : specialized[2];
    found = `${projectFileName} + Sdk=${specialized[0]}${hasGrpcServer ? ' + Grpc.AspNetCore' : ''} (ASP.NET Core)`;
  } else if (specialized?.[1] === 'worker') {
    appType = 'backend';
    framework = specialized[2];
    found = `${projectFileName} + Sdk=${specialized[0]} (Worker)`;
  } else if (specialized?.[1] === 'blazor-wasm') {
    appType = 'backend';
    framework = specialized[2];
    found = `${projectFileName} + Sdk=${specialized[0]} (Blazor WASM)`;
  } else if (specialized?.[1] === 'aspire') {
    appType = 'backend';
    framework = specialized[2];
    found = `${projectFileName} + Sdk=${specialized[0]} (Aspire)`;
  } else if (specialized?.[1] === 'razor-lib') {
    appType = 'library';
    framework = specialized[2];
    found = `${projectFileName} + Sdk=${specialized[0]} (Razor class library)`;
  } else if (hasAspNetRef && isExe(outputType)) {
    // Non-Web Sdk host that still pulls ASP.NET shared framework
    appType = 'backend';
    framework = 'ASP.NET Core';
    found = `${projectFileName} + FrameworkReference Microsoft.AspNetCore.App (host)`;
  } else if (hasAspNetRef && !isExe(outputType)) {
    appType = 'library';
    framework = 'ASP.NET Core';
    found = `${projectFileName} + FrameworkReference Microsoft.AspNetCore.App (web library)`;
  } else if (cliPkg && (isExe(outputType) || !outputType)) {
    // CLI packages often on Exe; if OutputType omitted but CLI pkg present, still CLI
    appType = 'cli';
    framework = cliPkg[1];
    found = `${projectFileName} + ${cliPkg[0]} (C# CLI)`;
  } else if (isExe(outputType)) {
    appType = 'cli';
    found = `${projectFileName} + OutputType=Exe (C# console)`;
  } else {
    appType = 'library';
    const sdkNote = sdk ? ` Sdk=${sdk}` : '';
    found = `${projectFileName}${sdkNote} (C# class library)`.replace(' Sdk=Microsoft.NET.Sdk', '');
    if (!sdk || sdk.toLowerCase() === BASE_SDK || sdk.toLowerCase().startsWith(`${BASE_SDK}/`)) {
      found = `${projectFileName} (C# class library)`;
    }
  }

  return {
    appType,
    projectName: name,
    targetFramework: parsed.targetFramework,
    sdk: sdk || 'Microsoft.NET.Sdk',
    framework,
    found,
  };
}

/** List root-level .csproj filenames in a directory. */
export function listRootCsprojs(dir: string): string[] {
  if (!existsSync(dir)) {return [];}
  try {
    return readdirSync(dir).filter(f => f.toLowerCase().endsWith('.csproj')).sort();
  } catch {
    return [];
  }
}

/**
 * Classify a C# project directory from root-level .csproj file(s).
 * Multiple projects: pick highest-priority classification (MCP > mobile > backend > cli > library).
 * Returns null if no .csproj at this directory level.
 */
export function detectCsharpProject(dir: string): CsharpProject | null {
  const files = listRootCsprojs(dir);
  if (files.length === 0) {return null;}

  let best: CsharpProject | null = null;
  let bestRank = 999;

  for (const file of files) {
    const path = join(dir, file);
    let content: string;
    try {
      content = readFileSync(path, 'utf-8');
    } catch {
      continue;
    }
    const parsed = parseCsproj(content);
    const classified = classifyCsproj(parsed, file);
    const r = rank(classified.appType, classified.framework);
    if (!best || r < bestRank) {
      best = classified;
      bestRank = r;
    }
  }

  return best;
}
