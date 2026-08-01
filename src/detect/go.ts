import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import spec from './go-detection.json';

/**
 * Go detection — CONTENT-AWARE go.mod classification.
 *
 * A go.mod alone does NOT mean "backend" or "CLI". The same module file backs
 * libraries, HTTP servers (Gin / Echo / Fiber / Chi), CLIs (Cobra), and MCP
 * servers (mcp-go). We read require paths and light layout signals, then branch.
 *
 * Same composition pattern as dart.ts: knowledge in go-detection.json, logic here.
 * Turbo-Cat + scanner both call detectGoProject so they agree by construction.
 */

export type GoAppType = 'mcp' | 'backend' | 'cli' | 'library';

export interface GoProject {
  /** faf app_type — MCP→mcp, server→backend, CLI→cli, else library. */
  appType: GoAppType;
  /** Module path from `module` line, or ''. */
  modulePath: string;
  /** Primary framework (Gin / Cobra / …) or ''. */
  framework: string;
  /** Human-readable rationale for the .faf `# found:` comment (Glass Hood). */
  found: string;
}

const MCP_MODULES = spec.mcpModules as string[];
const SERVER_FRAMEWORKS = spec.serverFrameworks as Array<[string, string]>;
const CLI_FRAMEWORKS = spec.cliFrameworks as Array<[string, string]>;

/** Collect require module paths from go.mod (require X and require ( … ) blocks). */
export function goModRequires(content: string): Set<string> {
  const reqs = new Set<string>();
  let inBlock = false;
  for (const raw of content.split('\n')) {
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) {continue;}
    if (/^require\s*\(\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (line === ')') {
        inBlock = false;
        continue;
      }
      const m = line.match(/^(\S+)/);
      if (m) {reqs.add(m[1].toLowerCase());}
      continue;
    }
    // Single-line: require github.com/foo/bar v1.2.3
    const single = line.match(/^require\s+(\S+)/);
    if (single && single[1] !== '(') {reqs.add(single[1].toLowerCase());}
  }
  return reqs;
}

/** True if any require equals or is a subpath of the module path. */
function hasModule(reqs: Set<string>, mod: string): boolean {
  const m = mod.toLowerCase();
  for (const r of reqs) {
    if (r === m || r.startsWith(`${m}/`)) {return true;}
  }
  return false;
}

/**
 * Longest knowledge-path match wins (echo/v4 over echo), so found strings cite
 * the most specific module entry and versioned paths don't collapse to the base.
 */
function findLongest(
  reqs: Set<string>,
  entries: Array<[string, string]>,
): [string, string] | undefined {
  let best: [string, string] | undefined;
  for (const e of entries) {
    if (!hasModule(reqs, e[0])) {continue;}
    if (!best || e[0].length > best[0].length) {best = e;}
  }
  return best;
}

function findLongestPath(reqs: Set<string>, paths: string[]): string | undefined {
  let best: string | undefined;
  for (const p of paths) {
    if (!hasModule(reqs, p)) {continue;}
    if (!best || p.length > best.length) {best = p;}
  }
  return best;
}

function extractModulePath(content: string): string {
  const m = content.match(/^module\s+(\S+)/m);
  return m ? m[1] : '';
}

/** Layout signal: cmd/ with Go files → common CLI / multi-main layout. */
function hasCmdDir(dir: string): boolean {
  const cmd = join(dir, 'cmd');
  if (!existsSync(cmd)) {return false;}
  try {
    for (const name of readdirSync(cmd)) {
      const p = join(cmd, name);
      try {
        if (statSync(p).isDirectory()) {
          const files = readdirSync(p);
          if (files.some(f => f.endsWith('.go'))) {return true;}
        } else if (name.endsWith('.go')) {
          return true;
        }
      } catch { /* skip */ }
    }
  } catch { /* no cmd */ }
  return false;
}

/** Root main.go that declares package main. */
function hasRootMainPackage(dir: string): boolean {
  const p = join(dir, 'main.go');
  if (!existsSync(p)) {return false;}
  try {
    const body = readFileSync(p, 'utf-8');
    return /^package\s+main\b/m.test(body);
  } catch {
    return false;
  }
}

/** Classify a Go project from go.mod (+ light layout). Returns null if not Go. */
export function detectGoProject(dir: string): GoProject | null {
  const path = join(dir, 'go.mod');
  if (!existsSync(path)) {return null;}
  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    return null;
  }

  const modulePath = extractModulePath(content);
  const reqs = goModRequires(content);

  const mcpMod = findLongestPath(reqs, MCP_MODULES);
  const server = findLongest(reqs, SERVER_FRAMEWORKS);
  const cliFw = findLongest(reqs, CLI_FRAMEWORKS);
  const cmdLayout = hasCmdDir(dir);
  const rootMain = hasRootMainPackage(dir);

  let appType: GoAppType;
  let framework = '';
  let found: string;

  // Priority: MCP → server → CLI (deps or layout) → library.
  // go.mod alone is never "backend" — pure library modules stay library.
  if (mcpMod) {
    appType = 'mcp';
    found = `go.mod + ${mcpMod} (Go MCP server)`;
  } else if (server) {
    appType = 'backend';
    framework = server[1];
    found = `go.mod + ${server[0]} (Go backend)`;
  } else if (cliFw) {
    appType = 'cli';
    framework = cliFw[1];
    found = `go.mod + ${cliFw[0]} (Go CLI)`;
  } else if (cmdLayout) {
    appType = 'cli';
    found = 'go.mod + cmd/ (Go CLI layout)';
  } else if (rootMain && !server) {
    // package main at root without a known server framework → treat as CLI/tool.
    // (Servers almost always pull gin/echo/fiber; bare main is often a tool.)
    appType = 'cli';
    found = 'go.mod + main.go package main (Go CLI)';
  } else {
    appType = 'library';
    found = 'go.mod (Go module)';
  }

  return { appType, modulePath, framework, found };
}
