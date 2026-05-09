import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { DetectedFramework, Signal } from '../core/types.js';
import { FRAMEWORKS } from './frameworks.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  type?: string;
  main?: string;
  bin?: string | Record<string, string>;
  private?: boolean;
  workspaces?: string[] | { packages?: string[] };
}

/** Read and parse package.json from a directory */
export function readPackageJson(dir: string): PackageJson | null {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Scan a directory for files matching patterns */
function fileExists(dir: string, pattern: string): boolean {
  // Handle simple file checks
  if (!pattern.includes('*')) {
    return existsSync(join(dir, pattern));
  }

  // Handle glob patterns like "next.config.*" or ".github/workflows/*.yml"
  const parts = pattern.split('/');
  if (parts.length === 1) {
    // Simple wildcard: "next.config.*"
    const prefix = pattern.split('*')[0];
    try {
      return readdirSync(dir).some(f => f.startsWith(prefix));
    } catch {
      return false;
    }
  }

  // Multi-level: ".github/workflows/*.yml"
  const subdir = join(dir, ...parts.slice(0, -1));
  const filePattern = parts[parts.length - 1];
  const prefix = filePattern.split('*')[0];
  const suffix = filePattern.split('*')[1] || '';
  try {
    return readdirSync(subdir).some(f => f.startsWith(prefix) && f.endsWith(suffix));
  } catch {
    return false;
  }
}

/** Match a single signal against project data */
function matchSignal(signal: Signal, pkg: PackageJson | null, dir: string): boolean {
  switch (signal.type) {
    case 'dependency':
      return !!(pkg?.dependencies?.[signal.key!]);
    case 'devDependency':
      return !!(pkg?.devDependencies?.[signal.key!]);
    case 'file':
      return fileExists(dir, signal.pattern!);
    default:
      return false;
  }
}

/** Detect frameworks in a directory */
export function detectFrameworks(dir: string): DetectedFramework[] {
  const pkg = readPackageJson(dir);

  return FRAMEWORKS
    .map(fw => {
      const matched = fw.signals.filter(s => matchSignal(s, pkg, dir));
      const confidence = matched.length / fw.signals.length;
      return { name: fw.name, slug: fw.slug, category: fw.category, confidence };
    })
    .filter(fw => fw.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
}

/** Detect the primary language of a project */
export function detectLanguage(dir: string): string {
  const pkg = readPackageJson(dir);

  // Check for TypeScript
  if (pkg?.devDependencies?.typescript || pkg?.dependencies?.typescript) return 'TypeScript';
  if (existsSync(join(dir, 'tsconfig.json'))) return 'TypeScript';

  // Check for common language indicators
  if (existsSync(join(dir, 'Cargo.toml'))) return 'Rust';
  if (existsSync(join(dir, 'go.mod'))) return 'Go';
  if (existsSync(join(dir, 'pyproject.toml')) || existsSync(join(dir, 'setup.py'))) return 'Python';
  if (existsSync(join(dir, 'Gemfile'))) return 'Ruby';
  if (existsSync(join(dir, 'pom.xml')) || existsSync(join(dir, 'build.gradle'))) return 'Java';
  if (existsSync(join(dir, 'Package.swift'))) return 'Swift';
  if (existsSync(join(dir, 'build.zig'))) return 'Zig';

  // Fallback to JS if package.json exists
  if (pkg) return 'JavaScript';

  return 'Unknown';
}

/** Project-type detection result + rationale (the #found list).
 *  Each `found` entry is a human-readable signal that contributed to the
 *  classification — emitted as a YAML comment by `writeFaf` for transparency
 *  ("Glass Hood" doctrine: the user sees WHY the cli classified as it did). */
export interface ProjectTypeDetection {
  type: string;
  /** Signals that matched, in order observed. */
  found: string[];
}

/** Detect the project type with rationale. The `found` list captures every
 *  positive signal that contributed to the classification — used downstream
 *  by `writeFaf` to render `# found: <list>` next to `type:` in the .faf.
 *
 *  Rule: SDK keyword takes priority (per app-types-canonical-v6.5 doctrine). */
export function detectProjectTypeWithRationale(dir: string): ProjectTypeDetection {
  const pkg = readPackageJson(dir);
  const frameworks = detectFrameworks(dir);
  const found: string[] = [];

  // CLI detection — Node bin
  if (pkg?.bin) {
    found.push('package.json bin');
    return { type: 'cli', found };
  }

  // MCP detection
  const hasMcp = frameworks.some(f => f.slug === 'mcp');
  if (hasMcp) {
    found.push('MCP SDK signal');
    return { type: 'mcp', found };
  }

  // Zig project-type detection — build.zig + entry-file convention.
  // src/main.zig → cli (executable); src/root.zig → library.
  // main.zig wins when both exist (typical: cli with internal lib exports).
  if (existsSync(join(dir, 'build.zig'))) {
    found.push('build.zig');
    if (existsSync(join(dir, 'src/main.zig'))) {
      found.push('src/main.zig');
      return { type: 'cli', found };
    }
    if (existsSync(join(dir, 'src/root.zig'))) {
      found.push('src/root.zig');
      return { type: 'library', found };
    }
  }

  // Framework repo detection — private workspace monorepo that builds a framework
  const hasSvelte = frameworks.some(f => f.slug === 'svelte' || f.slug === 'sveltekit');
  const isPrivateWorkspace = pkg?.private === true && (
    existsSync(join(dir, 'pnpm-workspace.yaml')) ||
    pkg?.workspaces !== undefined
  );
  if (isPrivateWorkspace && hasSvelte) {
    found.push('private workspace', 'Svelte');
    return { type: 'framework', found };
  }

  // Svelte/SvelteKit app detection — fullstack by nature (server routes + frontend)
  if (hasSvelte) {
    found.push('Svelte/SvelteKit');
    return { type: 'svelte', found };
  }

  // Next.js and Nuxt are fullstack by nature (API routes built in)
  const hasNextOrNuxt = frameworks.some(f => f.slug === 'nextjs' || f.slug === 'nuxt');
  if (hasNextOrNuxt) {
    found.push(frameworks.find(f => f.slug === 'nextjs') ? 'Next.js' : 'Nuxt');
    return { type: 'fullstack', found };
  }

  // Full-stack detection
  const hasFrontend = frameworks.some(f => f.category === 'frontend');
  const hasBackend = frameworks.some(f => f.category === 'backend');
  if (hasFrontend && hasBackend) {
    found.push('frontend framework', 'backend framework');
    return { type: 'fullstack', found };
  }

  // Frontend-only
  if (hasFrontend) {
    found.push('frontend framework');
    return { type: 'frontend', found };
  }

  // Backend-only
  if (hasBackend) {
    found.push('backend framework');
    return { type: 'backend', found };
  }

  // Library detection (has main/exports but no bin)
  if (pkg?.main && !pkg?.bin) {
    found.push('package.json main (no bin)');
    return { type: 'library', found };
  }

  // Default
  found.push('no classifying signals — fallback');
  return { type: 'library', found };
}

/** Detect the project type for slot mapping. Backward-compatible wrapper —
 *  returns just the type string. New code should prefer
 *  `detectProjectTypeWithRationale` to access the `#found` rationale. */
export function detectProjectType(dir: string): string {
  return detectProjectTypeWithRationale(dir).type;
}

/** Detect the runtime */
export function detectRuntime(dir: string): string {
  if (existsSync(join(dir, 'bunfig.toml'))) return 'Bun';
  if (existsSync(join(dir, 'deno.json')) || existsSync(join(dir, 'deno.jsonc'))) return 'Deno';
  if (readPackageJson(dir)) return 'Node.js';
  if (existsSync(join(dir, 'Cargo.toml'))) return 'Rust';
  if (existsSync(join(dir, 'go.mod'))) return 'Go';
  return 'Unknown';
}

/** Detect package manager */
export function detectPackageManager(dir: string): string {
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm';
  return 'npm';
}

/** Detect CI/CD */
export function detectCicd(dir: string): string | null {
  if (existsSync(join(dir, '.github/workflows'))) return 'GitHub Actions';
  if (existsSync(join(dir, '.gitlab-ci.yml'))) return 'GitLab CI';
  if (existsSync(join(dir, '.circleci'))) return 'CircleCI';
  if (existsSync(join(dir, 'Jenkinsfile'))) return 'Jenkins';
  return null;
}

/** Detect hosting platform */
export function detectHosting(dir: string): string | null {
  if (existsSync(join(dir, 'vercel.json'))) return 'Vercel';
  if (existsSync(join(dir, 'netlify.toml'))) return 'Netlify';
  if (existsSync(join(dir, 'wrangler.toml'))) return 'Cloudflare';
  if (existsSync(join(dir, 'Dockerfile'))) return 'Docker';
  if (existsSync(join(dir, 'fly.toml'))) return 'Fly.io';
  if (existsSync(join(dir, 'render.yaml'))) return 'Render';
  return null;
}

/** Detect SvelteKit adapter from svelte.config.js */
export function detectSvelteAdapter(dir: string): string | null {
  const configPath = join(dir, 'svelte.config.js');
  if (!existsSync(configPath)) return null;
  try {
    const content = readFileSync(configPath, 'utf-8');
    // Match adapter imports: import adapter from '@sveltejs/adapter-vercel'
    // Or: import { adapter } from '@sveltejs/adapter-node'
    // Or: const adapter = require('@sveltejs/adapter-static')
    const adapterMatch = content.match(/@sveltejs\/adapter-(\w+)/);
    if (adapterMatch) {
      const adapter = adapterMatch[1];
      switch (adapter) {
        case 'vercel': return 'Vercel';
        case 'node': return 'Node';
        case 'static': return 'Static';
        case 'cloudflare': return 'Cloudflare';
        case 'netlify': return 'Netlify';
        case 'auto': return 'Auto';
        default: return adapter;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Detect build tool */
export function detectBuildTool(dir: string): string | null {
  const pkg = readPackageJson(dir);
  if (pkg?.devDependencies?.vite || pkg?.dependencies?.vite) return 'Vite';
  if (pkg?.devDependencies?.webpack || pkg?.dependencies?.webpack) return 'webpack';
  if (pkg?.devDependencies?.esbuild || pkg?.dependencies?.esbuild) return 'esbuild';
  if (existsSync(join(dir, 'tsconfig.json')) && pkg?.devDependencies?.typescript) return 'TypeScript (tsc)';
  return null;
}
