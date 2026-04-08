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
  if (!existsSync(pkgPath)) {return null;}
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Read project name and description from any manifest (package.json, pyproject.toml, Cargo.toml) */
export function readProjectManifest(dir: string): { name?: string; description?: string } | null {
  // package.json
  const pkg = readPackageJson(dir);
  if (pkg?.name) {return { name: pkg.name, description: pkg.description };}

  // pyproject.toml — [project] section
  const pyprojectPath = join(dir, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, 'utf-8');
      const nameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
      const descMatch = content.match(/^\s*description\s*=\s*"([^"]+)"/m);
      if (nameMatch) {return { name: nameMatch[1], description: descMatch?.[1] };}
    } catch { /* ignore */ }
  }

  // Cargo.toml — [package] section
  const cargoPath = join(dir, 'Cargo.toml');
  if (existsSync(cargoPath)) {
    try {
      const content = readFileSync(cargoPath, 'utf-8');
      const nameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
      const descMatch = content.match(/^\s*description\s*=\s*"([^"]+)"/m);
      if (nameMatch) {return { name: nameMatch[1], description: descMatch?.[1] };}
    } catch { /* ignore */ }
  }

  return null;
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

/** Read Python dependencies from pyproject.toml */
function readPythonDeps(dir: string): Record<string, string> {
  const pyprojectPath = join(dir, 'pyproject.toml');
  if (!existsSync(pyprojectPath)) {return {};}
  try {
    const content = readFileSync(pyprojectPath, 'utf-8');
    const deps: Record<string, string> = {};
    // Match dependencies = ["fastapi", "uvicorn>=0.20", "sqlalchemy[asyncio]"]
    // Use greedy match — lazy stops at first ] which could be inside extras like [asyncio]
    const depsMatch = content.match(/dependencies\s*=\s*\[([\s\S]*)\]/);
    if (depsMatch) {
      const items = depsMatch[1].match(/"([^"]+)"/g) || [];
      for (const item of items) {
        const name = item.replace(/"/g, '').replace(/\[.*/, '').split(/[>=<]/)[0].trim().toLowerCase();
        if (name) {deps[name] = '*';}
      }
    }
    return deps;
  } catch {
    return {};
  }
}

/** Read Rust dependencies from Cargo.toml */
function readCargoDeps(dir: string): Record<string, string> {
  const cargoPath = join(dir, 'Cargo.toml');
  if (!existsSync(cargoPath)) {return {};}
  try {
    const content = readFileSync(cargoPath, 'utf-8');
    const deps: Record<string, string> = {};
    // Match lines after [dependencies] until next section
    const depsSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
    if (depsSection) {
      const lines = depsSection[1].split('\n');
      for (const line of lines) {
        // Simple: rmcp = "0.1"  or  rmcp = { version = "0.1", features = [...] }
        const match = line.match(/^\s*([a-zA-Z_-]+)\s*=/);
        if (match) {deps[match[1].toLowerCase()] = '*';}
      }
    }
    return deps;
  } catch {
    return {};
  }
}

/** Detect frameworks in a directory */
export function detectFrameworks(dir: string): DetectedFramework[] {
  const pkg = readPackageJson(dir);

  // Merge Python + Cargo deps into virtual package for framework detection
  const pythonDeps = readPythonDeps(dir);
  const cargoDeps = readCargoDeps(dir);
  const extraDeps = { ...pythonDeps, ...cargoDeps };
  const mergedPkg = pkg ? { ...pkg, dependencies: { ...pkg.dependencies, ...extraDeps } }
    : Object.keys(extraDeps).length > 0 ? { dependencies: extraDeps } as PackageJson
    : null;

  const detected = FRAMEWORKS
    .map(fw => {
      const matched = fw.signals.filter(s => matchSignal(s, mergedPkg, dir));
      const confidence = matched.length / fw.signals.length;
      return { name: fw.name, slug: fw.slug, category: fw.category, confidence };
    })
    .filter(fw => fw.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  // Meta-frameworks supersede their base — Next.js beats React, Nuxt beats Vue, SvelteKit beats Svelte
  const slugs = new Set(detected.map(d => d.slug));
  const superseded = new Set<string>();
  if (slugs.has('nextjs')) {superseded.add('react');}
  if (slugs.has('nuxt')) {superseded.add('vue');}
  if (slugs.has('sveltekit')) {superseded.add('svelte');}

  return detected.filter(d => !superseded.has(d.slug));
}

/** Detect the primary language of a project */
export function detectLanguage(dir: string): string {
  const pkg = readPackageJson(dir);

  // Check for TypeScript
  if (pkg?.devDependencies?.typescript || pkg?.dependencies?.typescript) {return 'TypeScript';}
  if (existsSync(join(dir, 'tsconfig.json'))) {return 'TypeScript';}

  // Check for HTML first (static sites)
  if (existsSync(join(dir, 'index.html')) || existsSync(join(dir, 'index.htm'))) {return 'HTML';}

  // Check for common language indicators
  if (existsSync(join(dir, 'Cargo.toml'))) {return 'Rust';}
  if (existsSync(join(dir, 'go.mod'))) {return 'Go';}
  if (existsSync(join(dir, 'pyproject.toml')) || existsSync(join(dir, 'setup.py'))) {return 'Python';}
  if (existsSync(join(dir, 'Gemfile'))) {return 'Ruby';}
  if (existsSync(join(dir, 'pom.xml')) || existsSync(join(dir, 'build.gradle'))) {return 'Java';}
  if (existsSync(join(dir, 'Package.swift'))) {return 'Swift';}
  if (existsSync(join(dir, 'build.zig'))) {return 'Zig';}

  // Fallback to JS if package.json exists
  if (pkg) {return 'JavaScript';}

  return 'Unknown';
}

/** Detect the project type for slot mapping */
export function detectProjectType(dir: string): string {
  const pkg = readPackageJson(dir);
  const frameworks = detectFrameworks(dir);

  // MCP detection — takes priority (MCP servers often have bin entries too)
  const hasMcp = frameworks.some(f => f.category === 'mcp');
  if (hasMcp) {return 'mcp';}

  // CLI detection
  if (pkg?.bin) {return 'cli';}

  // Framework repo detection — private workspace monorepo that builds a framework
  const hasSvelte = frameworks.some(f => f.slug === 'svelte' || f.slug === 'sveltekit');
  const isPrivateWorkspace = pkg?.private === true && (
    existsSync(join(dir, 'pnpm-workspace.yaml')) ||
    pkg?.workspaces !== undefined
  );
  if (isPrivateWorkspace && hasSvelte) {return 'framework';}

  // Svelte/SvelteKit app detection — fullstack by nature (server routes + frontend)
  if (hasSvelte) {return 'svelte';}

  // Next.js and Nuxt are fullstack by nature (API routes built in)
  const hasNextOrNuxt = frameworks.some(f => f.slug === 'nextjs' || f.slug === 'nuxt');
  if (hasNextOrNuxt) {return 'fullstack';}

  // Static site detection — check for index.html before other detection
  const hasIndexHtml = existsSync(join(dir, 'index.html')) || existsSync(join(dir, 'index.htm'));
  const hasStaticSiteMarkers = existsSync(join(dir, '404.html')) || 
                                existsSync(join(dir, 'about.html')) ||
                                existsSync(join(dir, 'contact.html'));

  // Full-stack detection
  const hasFrontend = frameworks.some(f => f.category === 'frontend');
  const hasBackend = frameworks.some(f => f.category === 'backend');
  if (hasFrontend && hasBackend) {return 'fullstack';}

  // Static site detection — if has HTML files but no backend framework
  if ((hasIndexHtml || hasStaticSiteMarkers) && !hasBackend) {return 'static-site';}

  // Frontend-only
  if (hasFrontend) {return 'frontend';}

  // Backend-only
  if (hasBackend) {return 'backend';}

  // Library detection (has main/exports but no bin)
  if (pkg?.main && !pkg?.bin) {return 'library';}

  // Default
  return 'library';
}

/** Detect the runtime */
export function detectRuntime(dir: string): string {
  if (existsSync(join(dir, 'bunfig.toml'))) {return 'Bun';}
  if (existsSync(join(dir, 'deno.json')) || existsSync(join(dir, 'deno.jsonc'))) {return 'Deno';}
  if (readPackageJson(dir)) {return 'Node.js';}
  if (existsSync(join(dir, 'Cargo.toml'))) {return 'Rust';}
  if (existsSync(join(dir, 'go.mod'))) {return 'Go';}
  return 'Unknown';
}

/** Detect package manager */
export function detectPackageManager(dir: string): string {
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) {return 'bun';}
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) {return 'pnpm';}
  if (existsSync(join(dir, 'yarn.lock'))) {return 'yarn';}
  if (existsSync(join(dir, 'package-lock.json'))) {return 'npm';}
  return 'npm';
}

/** Detect CI/CD */
export function detectCicd(dir: string): string | null {
  if (existsSync(join(dir, '.github/workflows'))) {return 'GitHub Actions';}
  if (existsSync(join(dir, '.gitlab-ci.yml'))) {return 'GitLab CI';}
  if (existsSync(join(dir, '.circleci'))) {return 'CircleCI';}
  if (existsSync(join(dir, 'Jenkinsfile'))) {return 'Jenkins';}
  return null;
}

/** Detect hosting platform */
export function detectHosting(dir: string): string | null {
  if (existsSync(join(dir, 'vercel.json'))) {return 'Vercel';}
  if (existsSync(join(dir, 'netlify.toml'))) {return 'Netlify';}
  if (existsSync(join(dir, 'wrangler.toml'))) {return 'Cloudflare';}
  if (existsSync(join(dir, 'Dockerfile'))) {return 'Docker';}
  if (existsSync(join(dir, 'fly.toml'))) {return 'Fly.io';}
  if (existsSync(join(dir, 'render.yaml'))) {return 'Render';}
  return null;
}

/** Detect SvelteKit adapter from svelte.config.js */
export function detectSvelteAdapter(dir: string): string | null {
  const configPath = join(dir, 'svelte.config.js');
  if (!existsSync(configPath)) {return null;}
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
  if (pkg?.devDependencies?.vite || pkg?.dependencies?.vite) {return 'Vite';}
  if (pkg?.devDependencies?.webpack || pkg?.dependencies?.webpack) {return 'webpack';}
  if (pkg?.devDependencies?.esbuild || pkg?.dependencies?.esbuild) {return 'esbuild';}
  if (existsSync(join(dir, 'tsconfig.json')) && pkg?.devDependencies?.typescript) {return 'TypeScript (tsc)';}
  return null;
}
