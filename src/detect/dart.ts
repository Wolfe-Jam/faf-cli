import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import spec from './dart-detection.json';

/**
 * Dart/Flutter detection — CONTENT-AWARE pubspec classification.
 *
 * A pubspec.yaml alone does NOT mean Flutter. The same manifest backs Flutter
 * apps, pure-Dart CLIs, packages, servers (Dart Frog / Shelf / Serverpod), and
 * MCP servers (dart_mcp / mcp_server). We read the dependencies and branch —
 * collapsing everything to "Flutter" is the bug this module fixes.
 *
 * Single source of truth for Dart: imported by both the v6 scanner (app-type +
 * language) and Turbo-Cat (stack fills), so the two engines agree by construction.
 */

export type DartAppType = 'mobile' | 'mcp' | 'backend' | 'cli' | 'library';

export interface DartProject {
  /** faf app_type — Flutter→mobile, Dart MCP→mcp, Dart server→backend, CLI→cli, else library. */
  appType: DartAppType;
  isFlutter: boolean;
  /** Primary framework for the stack (Flutter / Dart Frog / Serverpod / Shelf / …) or ''. */
  framework: string;
  /** Flutter state management (Riverpod / Bloc / Provider / GetX / MobX / Signals) or ''. */
  stateManagement: string;
  /** Routing (go_router / auto_route) or ''. */
  routing: string;
  /** Test framework (flutter_test / test) or ''. */
  testing: string;
  /** Human-readable rationale for the .faf `# found:` comment (Glass Hood). */
  found: string;
}

// Detection KNOWLEDGE is sourced from dart-detection.json — the single,
// language-neutral spec faf-cli imports and faf-python-sdk vendors (A+B hybrid).
// Bolster Dart/Flutter by editing that JSON; every engine inherits it.
const FLUTTER_DEPS = spec.flutterDeps as string[];
const MCP_DEPS = spec.mcpDeps as string[];
const SERVER_FRAMEWORKS = spec.serverFrameworks as Array<[string, string]>;
const STATE_MGMT = spec.stateManagement as Array<[string, string]>;
const ROUTING = spec.routing as Array<[string, string]>;

/** Collect dependency names from a pubspec's dependencies / dev_dependencies sections. */
function pubspecDeps(content: string): Set<string> {
  const deps = new Set<string>();
  let inDeps = false;
  for (const line of content.split('\n')) {
    if (/^(dependencies|dev_dependencies|dependency_overrides):\s*$/.test(line)) {
      inDeps = true;
      continue;
    }
    // A new top-level key (no leading whitespace) ends the dependency section.
    if (/^\S/.test(line)) {inDeps = false;}
    if (inDeps) {
      const m = line.match(/^\s{2}([a-zA-Z0-9_]+):/);
      if (m) {deps.add(m[1].toLowerCase());}
    }
  }
  return deps;
}

/** Classify a Dart/Flutter project from its pubspec.yaml. Returns null if not Dart. */
export function detectDartProject(dir: string): DartProject | null {
  const path = join(dir, 'pubspec.yaml');
  if (!existsSync(path)) {return null;}
  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    return null;
  }

  const deps = pubspecDeps(content);
  const has = (d: string) => deps.has(d.toLowerCase());

  // Flutter: the `flutter` SDK dep, a top-level `flutter:` section, or `sdk: flutter`.
  const isFlutter = FLUTTER_DEPS.some(has) || /^flutter:\s*$/m.test(content) || /\bsdk:\s*flutter\b/.test(content);

  const mcpDep = MCP_DEPS.find(has);
  const server = SERVER_FRAMEWORKS.find(([d]) => has(d));
  const stateEntry = STATE_MGMT.find(([d]) => has(d));
  const stateManagement = stateEntry ? stateEntry[1] : '';
  const routeEntry = ROUTING.find(([d]) => has(d));
  const routing = routeEntry ? routeEntry[1] : '';
  const testing = has('flutter_test') ? 'flutter_test' : has('test') ? 'test' : '';

  // CLI: a top-level `executables:` section, or bin/*.dart entry points.
  const hasExecutables = /^executables:\s*$/m.test(content);
  let hasBinDart = false;
  try {
    hasBinDart = readdirSync(join(dir, 'bin')).some(f => f.endsWith('.dart'));
  } catch { /* no bin/ */ }
  const isCli = hasExecutables || hasBinDart;

  let appType: DartAppType;
  let framework = '';
  let found: string;

  if (isFlutter) {
    framework = 'Flutter';
    // App vs package: an app has lib/main.dart (the entry) or `publish_to: none`;
    // a reusable Flutter package has neither — it's publishable, lib/ exports only.
    const isApp = existsSync(join(dir, 'lib', 'main.dart')) || /^publish_to:\s*['"]?none\b/m.test(content);
    if (isApp) {
      appType = 'mobile';
      found = 'pubspec.yaml (Flutter app)';
    } else {
      appType = 'library';
      found = 'pubspec.yaml (Flutter package)';
    }
  } else if (mcpDep) {
    appType = 'mcp';
    found = `pubspec.yaml + ${mcpDep} (Dart MCP server)`;
  } else if (server) {
    appType = 'backend';
    framework = server[1];
    found = `pubspec.yaml + ${server[0]} (Dart backend)`;
  } else if (isCli) {
    appType = 'cli';
    found = hasExecutables ? 'pubspec.yaml executables: (Dart CLI)' : 'pubspec.yaml + bin/*.dart (Dart CLI)';
  } else {
    appType = 'library';
    found = 'pubspec.yaml (Dart package)';
  }

  return { appType, isFlutter, framework, stateManagement, routing, testing, found };
}
