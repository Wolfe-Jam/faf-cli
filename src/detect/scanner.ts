import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { DetectedFramework, Signal } from '../core/types.js';
import { FRAMEWORKS } from './frameworks.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  type?: string;
  main?: string;
  types?: string;
  exports?: unknown;
  bin?: string | Record<string, string>;
  private?: boolean;
  workspaces?: string[] | { packages?: string[] };
  files?: string[];
}

/** Read [package].name field from Cargo.toml — naive but adequate. */
function readCargoName(dir: string): string | null {
  const path = join(dir, 'Cargo.toml');
  if (!existsSync(path)) return null;
  try {
    const content = readFileSync(path, 'utf-8');
    const m = content.match(/^\s*\[package\][\s\S]*?^\s*name\s*=\s*"([^"]+)"/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** True if Cargo.toml declares one or more `[[bin]]` sections — Rust cli marker. */
function hasCargoBin(dir: string): boolean {
  const path = join(dir, 'Cargo.toml');
  if (!existsSync(path)) return false;
  try {
    const content = readFileSync(path, 'utf-8');
    return /^\s*\[\[bin\]\]/m.test(content);
  } catch {
    return false;
  }
}

/** Detect SDK signals — keyword-based per the SDK-priority doctrine.
 *  Returns the matched evidence string, or null if no SDK signal. */
function detectSdkSignal(dir: string, pkg: PackageJson | null): string | null {
  // pkg.keywords contains 'sdk'
  if (pkg?.keywords?.some(k => /^sdk(?:\s|-|$)|\-sdk$/i.test(k))) {
    return 'package.json keywords contains "sdk"';
  }
  // pkg.name contains 'sdk' or '-sdk' suffix
  if (pkg?.name && /(?:^|[-_/])sdk(?:[-_/]|$)/i.test(pkg.name)) {
    return `package.json name "${pkg.name}" → sdk`;
  }
  // Cargo.toml [package].name contains 'sdk'
  const cargoName = readCargoName(dir);
  if (cargoName && /(?:^|[-_])sdk(?:[-_]|$)/i.test(cargoName)) {
    return `Cargo.toml name "${cargoName}" → sdk`;
  }
  return null;
}

/** Python data-science dependency detection (pyproject.toml + requirements.txt). */
function detectDataScienceSignal(dir: string): string | null {
  const dsPatterns = /(numpy|pandas|jupyter|scikit-learn|sklearn|pytorch|tensorflow|matplotlib|scipy)/i;
  const pyproject = join(dir, 'pyproject.toml');
  if (existsSync(pyproject)) {
    try {
      const content = readFileSync(pyproject, 'utf-8');
      const match = content.match(dsPatterns);
      if (match) return `pyproject.toml depends on ${match[1]}`;
    } catch { /* fall through */ }
  }
  const reqs = join(dir, 'requirements.txt');
  if (existsSync(reqs)) {
    try {
      const content = readFileSync(reqs, 'utf-8');
      const match = content.match(dsPatterns);
      if (match) return `requirements.txt contains ${match[1]}`;
    } catch { /* fall through */ }
  }
  return null;
}

/** Mobile platform signal (React Native / Expo / Capacitor / Ionic / Flutter / native dirs). */
function detectMobileSignal(dir: string, pkg: PackageJson | null): string | null {
  const mobileDeps = ['react-native', 'expo', '@capacitor/core', '@ionic/core'];
  if (pkg) {
    for (const dep of mobileDeps) {
      if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
        return `${dep} dependency`;
      }
    }
  }
  if (existsSync(join(dir, 'pubspec.yaml'))) return 'pubspec.yaml (Flutter)';
  if (existsSync(join(dir, 'ios')) && existsSync(join(dir, 'android'))) {
    return 'ios/ + android/ dirs';
  }
  return null;
}

/** WASM target detection (Cargo cdylib + wasm32 OR build.zig wasm OR pkg WASM build scripts). */
function detectWasmSignal(dir: string, pkg: PackageJson | null): string | null {
  const cargoPath = join(dir, 'Cargo.toml');
  if (existsSync(cargoPath)) {
    try {
      const content = readFileSync(cargoPath, 'utf-8');
      // crate-type = ["cdylib"] is the canonical wasm-output marker
      if (/crate-type\s*=\s*\[[^\]]*"cdylib"/.test(content)) {
        return 'Cargo.toml crate-type = ["cdylib"]';
      }
      // wasm-bindgen / wasm-pack as deps
      if (/wasm-bindgen|wasm-pack/i.test(content)) {
        return 'Cargo.toml wasm-bindgen/wasm-pack';
      }
    } catch { /* fall through */ }
  }
  // Zig WASM target — build.zig with .wasm or wasm in script
  const buildZig = join(dir, 'build.zig');
  if (existsSync(buildZig)) {
    try {
      const content = readFileSync(buildZig, 'utf-8');
      if (/\.wasm\b|wasm32|setOutputFormat\(\.wasm/i.test(content)) {
        return 'build.zig wasm target';
      }
    } catch { /* fall through */ }
  }
  // pkg keywords contains 'wasm' AND no app frameworks
  if (pkg?.keywords?.some(k => /^wasm(?:-|$)|webassembly/i.test(k))) {
    return 'package.json keywords contains "wasm"';
  }
  return null;
}

/** Bare HTML / vanilla site detection. */
function detectHtmlSignal(dir: string, pkg: PackageJson | null): string | null {
  // Must have index.html at root
  if (!existsSync(join(dir, 'index.html'))) return null;
  // Must NOT have any frontend deps (those would classify as frontend/website/etc)
  if (pkg?.dependencies || pkg?.devDependencies) {
    const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const frontendDeps = ['react', 'vue', 'svelte', '@sveltejs/kit', 'next', 'nuxt', 'astro', 'gatsby', 'solid-js', 'qwik'];
    if (frontendDeps.some(d => allDeps[d])) return null;
  }
  return 'index.html (vanilla, no frontend framework)';
}

/** Documentation / spec-only repo signal. */
function detectDocumentationSignal(dir: string, pkg: PackageJson | null): string | null {
  // Strong signal: name or keywords contains 'specification'
  if (pkg?.name && /specification|^@.*\/spec/i.test(pkg.name)) {
    return `package name "${pkg.name}" → documentation`;
  }
  if (pkg?.keywords?.some(k => /^(specification|format-spec|standard)$/i.test(k))) {
    return 'package keywords contains "specification"';
  }
  // pkg.files contains only md / examples / assets (no dist/, no src/)
  if (pkg?.files && pkg.files.length > 0) {
    const sourcePatterns = /^(dist|src|lib|build|bin)\/|\.(js|ts|tsx|jsx|mjs|cjs|py|rs|go)$/;
    const hasSource = pkg.files.some(f => sourcePatterns.test(f));
    const hasDocs = pkg.files.some(f => /\.(md|MD)|examples?\//.test(f));
    if (!hasSource && hasDocs) {
      return 'package.json files = docs/examples only (no source)';
    }
  }
  return null;
}

/** Marketing / website signal — Astro/Gatsby static OR pkg keywords. */
function detectWebsiteSignal(dir: string, pkg: PackageJson | null, frameworks: DetectedFramework[]): string | null {
  // Astro/Gatsby are typically used for content/marketing sites
  const astroOrGatsby = frameworks.find(f => f.slug === 'astro' || f.slug === 'gatsby');
  if (astroOrGatsby) return `${astroOrGatsby.name} (static-site framework)`;
  // pkg.keywords explicitly marketing
  if (pkg?.keywords?.some(k => /^(website|marketing|landing|brochure|portfolio)$/i.test(k))) {
    return 'package keywords contains "website"/"marketing"/"landing"';
  }
  return null;
}

/** SAAS shape — auth + payments + database + dashboard. */
function detectSaasSignal(dir: string, pkg: PackageJson | null): string | null {
  if (!pkg) return null;
  const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const authDeps = ['@clerk/nextjs', '@clerk/clerk-react', 'next-auth', '@auth/core', 'auth0', '@auth0/nextjs-auth0'];
  const paymentDeps = ['stripe', '@stripe/stripe-js', 'lemonsqueezy'];
  const hasAuth = authDeps.some(d => allDeps[d]);
  const hasPayment = paymentDeps.some(d => allDeps[d]);
  if (hasAuth && hasPayment) {
    return 'auth + payment dependencies';
  }
  return null;
}

/** MCPaaS (post-MCP platform) shape — multiple MCP signals + hosting + DB. */
function detectMcpaasSignal(dir: string, pkg: PackageJson | null, frameworks: DetectedFramework[]): string | null {
  // pkg.keywords contains 'mcpaas' is the strongest signal
  if (pkg?.keywords?.some(k => /mcpaas/i.test(k))) {
    return 'package keywords contains "mcpaas"';
  }
  // pkg.name contains 'mcpaas'
  if (pkg?.name && /mcpaas/i.test(pkg.name)) {
    return `package name "${pkg.name}" → mcpaas`;
  }
  // Multi-signal: MCP framework + database + hosting (a platform, not a single server)
  const hasMcp = frameworks.some(f => f.slug === 'mcp');
  const hasDb = frameworks.some(f => f.category === 'database');
  if (hasMcp && hasDb && pkg?.dependencies && Object.keys(pkg.dependencies).length > 10) {
    return 'MCP + database + complex deps (platform shape)';
  }
  return null;
}

/** Monorepo-root — private workspace with multiple packages, no single dominant FW. */
function detectMonorepoRootSignal(dir: string, pkg: PackageJson | null): string | null {
  if (!pkg?.private) return null;
  const hasWorkspaces = !!pkg.workspaces || existsSync(join(dir, 'pnpm-workspace.yaml'));
  if (!hasWorkspaces) return null;
  return 'private workspace + multi-package';
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
 *  Priority order per v6.6.md doctrine (most-specific first). `about` is
 *  owner-declared, not auto-detected — never matches in this function.
 *  Rule: SDK keyword takes priority (sdk wins over library/cli/wasm). */
export function detectProjectTypeWithRationale(dir: string): ProjectTypeDetection {
  const pkg = readPackageJson(dir);
  const frameworks = detectFrameworks(dir);
  const found: string[] = [];

  // ─── 1. documentation — spec-only / docs-only repos ─────────────────────
  const docSignal = detectDocumentationSignal(dir, pkg);
  if (docSignal) {
    found.push(docSignal);
    return { type: 'documentation', found };
  }

  // ─── 2. sdk — SDK keyword/structure WINS over mcpaas/saas/wasm/cli/library ─
  // wolfejam doctrine: if a repo signals SDK (name contains "-sdk", keywords
  // contains "sdk"), it's an SDK regardless of what platform/wasm/cli signals
  // would also fire. Confirmed for mcpaas-sdk (SDK FOR the platform, not the
  // platform itself).
  const sdkSignal = detectSdkSignal(dir, pkg);
  if (sdkSignal) {
    found.push(sdkSignal);
    return { type: 'sdk', found };
  }

  // ─── 3. mcpaas — post-MCP platforms (multiple MCP signals + auth + DB) ──
  const mcpaasSignal = detectMcpaasSignal(dir, pkg, frameworks);
  if (mcpaasSignal) {
    found.push(mcpaasSignal);
    return { type: 'mcpaas', found };
  }

  // ─── 4. saas — subscription products (auth + payment) ───────────────────
  const saasSignal = detectSaasSignal(dir, pkg);
  if (saasSignal) {
    found.push(saasSignal);
    return { type: 'saas', found };
  }

  // ─── 5. wasm — WASM target in build config ──────────────────────────────
  const wasmSignal = detectWasmSignal(dir, pkg);
  if (wasmSignal) {
    found.push(wasmSignal);
    return { type: 'wasm', found };
  }

  // ─── 6. mobile — mobile platform deps / native dirs ─────────────────────
  const mobileSignal = detectMobileSignal(dir, pkg);
  if (mobileSignal) {
    found.push(mobileSignal);
    return { type: 'mobile', found };
  }

  // ─── 7. mcp — single MCP server ─────────────────────────────────────────
  const hasMcp = frameworks.some(f => f.slug === 'mcp');
  if (hasMcp) {
    found.push('MCP SDK signal');
    return { type: 'mcp', found };
  }

  // ─── 8. cli — Node bin / Cargo [[bin]] / Zig main.zig ───────────────────
  if (pkg?.bin) {
    found.push('package.json bin');
    return { type: 'cli', found };
  }
  if (hasCargoBin(dir)) {
    found.push('Cargo.toml [[bin]]');
    return { type: 'cli', found };
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

  // ─── 9. framework — private workspace + Svelte ──────────────────────────
  const hasSvelte = frameworks.some(f => f.slug === 'svelte' || f.slug === 'sveltekit');
  const isPrivateWorkspace = pkg?.private === true && (
    existsSync(join(dir, 'pnpm-workspace.yaml')) ||
    pkg?.workspaces !== undefined
  );
  if (isPrivateWorkspace && hasSvelte) {
    found.push('private workspace', 'Svelte');
    return { type: 'framework', found };
  }

  // ─── 10. svelte — Svelte/SvelteKit app (fullstack by nature) ────────────
  if (hasSvelte) {
    found.push('Svelte/SvelteKit');
    return { type: 'svelte', found };
  }

  // ─── 11. enterprise — private workspace + multi-FW (more specific than monorepo-root) ──
  // Must be checked BEFORE monorepo-root (which is private workspace fallback).
  const hasFrontendFw = frameworks.some(f => f.category === 'frontend');
  const hasBackendFw = frameworks.some(f => f.category === 'backend');
  if (
    pkg?.private &&
    (pkg.workspaces || existsSync(join(dir, 'pnpm-workspace.yaml'))) &&
    hasFrontendFw && hasBackendFw
  ) {
    found.push('private workspace + frontend + backend frameworks');
    return { type: 'enterprise', found };
  }

  // ─── 12. monorepo-root — private workspace, multi-package, no specific FW story ──
  const monoSignal = detectMonorepoRootSignal(dir, pkg);
  if (monoSignal) {
    found.push(monoSignal);
    return { type: 'monorepo-root', found };
  }

  // ─── 13. website — marketing-shape (Astro/Gatsby OR keywords) ───────────
  const websiteSignal = detectWebsiteSignal(dir, pkg, frameworks);
  if (websiteSignal) {
    found.push(websiteSignal);
    return { type: 'website', found };
  }

  // ─── 14. fullstack — Next/Nuxt OR (frontend + backend) ──────────────────
  const hasNextOrNuxt = frameworks.some(f => f.slug === 'nextjs' || f.slug === 'nuxt');
  if (hasNextOrNuxt) {
    found.push(frameworks.find(f => f.slug === 'nextjs') ? 'Next.js' : 'Nuxt');
    return { type: 'fullstack', found };
  }

  const hasFrontend = frameworks.some(f => f.category === 'frontend');
  const hasBackend = frameworks.some(f => f.category === 'backend');
  if (hasFrontend && hasBackend) {
    found.push('frontend framework', 'backend framework');
    return { type: 'fullstack', found };
  }

  // ─── 14. frontend — frontend framework only ─────────────────────────────
  if (hasFrontend) {
    found.push('frontend framework');
    return { type: 'frontend', found };
  }

  // ─── 15. backend — backend framework only ───────────────────────────────
  if (hasBackend) {
    found.push('backend framework');
    return { type: 'backend', found };
  }

  // ─── 16. data-science — Python DS deps (numpy/pandas/jupyter/sklearn) ───
  const dsSignal = detectDataScienceSignal(dir);
  if (dsSignal) {
    found.push(dsSignal);
    return { type: 'data-science', found };
  }

  // ─── 17. html — bare index.html, no framework ──────────────────────────
  const htmlSignal = detectHtmlSignal(dir, pkg);
  if (htmlSignal) {
    found.push(htmlSignal);
    return { type: 'html', found };
  }

  // ─── 18. library — fallback (has main/exports but no bin) ──────────────
  if (pkg?.main && !pkg?.bin) {
    found.push('package.json main (no bin)');
    return { type: 'library', found };
  }

  // Default — bare repo with no classifying signals
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

/* ─── FAFB section helpers (top-level YAML keys read by compile_fafb) ───────
 *
 * These detect content for the FAFB binary's TECH_STACK, KEY_FILES, and
 * COMMANDS sections. ARCHITECTURE and CONTEXT are deliberately left empty
 * for user fill (architecture overlaps with human_context.how; context is
 * deliberately free-form additional signal beyond the 6Ws).
 */

/** Detect a list of important file paths for the KEY_FILES FAFB section.
 *  Returns up to ~10 entries, ordered by canonical importance. */
export function detectKeyFiles(dir: string): string[] {
  const candidates = [
    // Manifests
    'package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod',
    'build.zig', 'build.zig.zon',
    // Entry points (TS/JS)
    'src/index.ts', 'src/index.js', 'src/main.ts', 'src/cli.ts',
    // Entry points (Rust)
    'src/main.rs', 'src/lib.rs',
    // Entry points (Zig)
    'src/main.zig', 'src/root.zig',
    // Entry points (Python)
    'src/__init__.py', 'main.py', '__main__.py',
    // Entry points (Go)
    'main.go', 'cmd/main.go',
    // Specs / docs
    'README.md', 'SPECIFICATION.md', 'BINARY-FORMAT.md',
    // Config
    'tsconfig.json', 'wrangler.toml', 'vercel.json',
  ];
  return candidates.filter(f => existsSync(join(dir, f)));
}

/** Detect build/test/lint commands for the COMMANDS FAFB section.
 *  Returns a Record<string, string> mapping command name → shell command. */
export function detectCommands(dir: string, pkg: PackageJson | null): Record<string, string> {
  const commands: Record<string, string> = {};

  // From package.json scripts (most reliable)
  if (pkg?.scripts) {
    for (const key of ['build', 'test', 'lint', 'dev', 'start']) {
      if (pkg.scripts[key]) {
        // Determine the runner — prefer bun if available, else npm
        const runner = existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))
          ? 'bun run'
          : 'npm run';
        commands[key] = `${runner} ${key}`;
      }
    }
  }

  // Cargo defaults (Rust)
  if (existsSync(join(dir, 'Cargo.toml'))) {
    if (!commands.build) commands.build = 'cargo build --release';
    if (!commands.test) commands.test = 'cargo test';
    if (!commands.lint) commands.lint = 'cargo clippy';
  }

  // Zig defaults
  if (existsSync(join(dir, 'build.zig'))) {
    if (!commands.build) commands.build = 'zig build';
    if (!commands.test) commands.test = 'zig build test';
  }

  // Go defaults
  if (existsSync(join(dir, 'go.mod'))) {
    if (!commands.build) commands.build = 'go build ./...';
    if (!commands.test) commands.test = 'go test ./...';
  }

  // Python defaults (if pytest is detectable)
  if (existsSync(join(dir, 'pyproject.toml')) || existsSync(join(dir, 'pytest.ini'))) {
    if (!commands.test) commands.test = 'pytest';
  }

  return commands;
}

/** Detect a tech-stack list for the TECH_STACK FAFB section.
 *  Combines language + frameworks + runtime into a flat list of strings
 *  (matching the canonical xai-faf-rust project.faf shape). */
export function detectTechStack(
  dir: string,
  pkg: PackageJson | null,
  frameworks: DetectedFramework[],
  language: string,
): string[] {
  const stack: string[] = [];

  // Language goes first
  if (language && language !== 'Unknown') stack.push(language);

  // Notable frameworks (frontend / backend / database / build)
  const notableCategories = new Set(['frontend', 'backend', 'database', 'build', 'css', 'state', 'monorepo']);
  for (const fw of frameworks) {
    if (notableCategories.has(fw.category)) {
      stack.push(fw.name);
    }
  }

  // Runtime if non-trivial (Node.js by default for JS — only call out Bun/Deno/etc.)
  if (existsSync(join(dir, 'bunfig.toml'))) stack.push('Bun');
  else if (existsSync(join(dir, 'deno.json')) || existsSync(join(dir, 'deno.jsonc'))) stack.push('Deno');

  // Top deps from package.json/Cargo.toml — only if stack is still sparse
  if (stack.length < 3 && pkg?.dependencies) {
    const topDeps = Object.keys(pkg.dependencies).slice(0, 5);
    for (const dep of topDeps) {
      if (!stack.some(s => s.toLowerCase().includes(dep.toLowerCase()))) {
        stack.push(dep);
      }
    }
  }

  return stack;
}
