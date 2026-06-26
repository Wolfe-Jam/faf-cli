/**
 * 🏎️ WJTTC — Wolfejam Test To Championship
 * Championship-Grade Test Suite: Dart/Flutter Content-Aware Context Engine
 *
 * F1 Philosophy: When brakes must work flawlessly, so must our code.
 *
 * Test Tiers:
 * - BRAKE:  Critical path — a pubspec is NEVER blindly labeled "Flutter";
 *           pure Dart (CLI/package/server/MCP) must never read as a mobile app.
 * - ENGINE: Core Dart intelligence — Flutter vs Dart, app-type, frameworks,
 *           state management, the MCP special case.
 * - AERO:   Edge cases — Flutter package vs app, framework priority, malformed
 *           input, mixed signals, adversarial pubspecs.
 *
 * Catalyst: Randal Schwartz (Dart/Flutter GDE) read the source and concluded FAF
 * "knows nothing about Dart and Flutter." It does now — and it's certified.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectDartProject } from '../../src/detect/dart.js';
import {
  detectProjectType,
  detectProjectTypeWithRationale,
  detectLanguage,
  detectPackageManager,
  detectRuntime,
} from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import dartSpec from '../../src/detect/dart-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-dart-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Write pubspec.yaml. */
const pubspec = (body: string) => writeFileSync(join(dir, 'pubspec.yaml'), body);
/** Write an arbitrary file (creating parent dirs). */
function file(rel: string, content = ''): void {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

// Canonical fixtures
const FLUTTER_APP = `name: app
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0
  go_router: ^14.0.0
flutter:
  uses-material-design: true
`;
const FLUTTER_PACKAGE = `name: my_widgets
description: A reusable Flutter widget package.
dependencies:
  flutter:
    sdk: flutter
`;
const DART_MCP = `name: srv
dependencies:
  dart_mcp: ^0.2.0
`;
const DART_SERVER = `name: api
dependencies:
  dart_frog: ^1.1.0
`;
const DART_CLI = `name: tool
dependencies:
  args: ^2.5.0
executables:
  tool:
`;
const DART_PACKAGE = `name: pkg
dependencies:
  collection: ^1.18.0
`;

// ============================================================
// BRAKE — never misclassify
// ============================================================
describe('WJTTC BRAKE: a pubspec is never blindly "Flutter"', () => {
  test('pure Dart package → not Flutter, classified library', () => {
    pubspec(DART_PACKAGE);
    const dp = detectDartProject(dir);
    expect(dp?.isFlutter).toBe(false);
    expect(dp?.framework).not.toBe('Flutter');
    expect(dp?.appType).toBe('library');
  });

  test('pure Dart CLI → never mobile', () => {
    pubspec(DART_CLI);
    expect(detectDartProject(dir)?.appType).not.toBe('mobile');
    expect(detectProjectType(dir)).not.toBe('mobile');
  });

  test('Dart MCP server → never mobile', () => {
    pubspec(DART_MCP);
    expect(detectDartProject(dir)?.appType).toBe('mcp');
    expect(detectProjectType(dir)).not.toBe('mobile');
  });

  test('Flutter PACKAGE (no app entry) → never mobile (library)', () => {
    pubspec(FLUTTER_PACKAGE);
    const dp = detectDartProject(dir);
    expect(dp?.isFlutter).toBe(true);
    expect(dp?.appType).toBe('library');
  });

  test('non-Dart project → detectDartProject returns null (no hijack)', () => {
    writeFileSync(join(dir, 'package.json'), '{"name":"x","dependencies":{"react":"^18"}}');
    expect(detectDartProject(dir)).toBeNull();
  });

  test('turbo-cat: pure Dart never fills frontend=Flutter (the root-bug brake)', () => {
    pubspec(DART_PACKAGE);
    const tc = turboCatSlots(dir);
    expect(tc.stack?.frontend).toBeUndefined();
    expect(tc.project?.main_language).toBe('Dart');
  });

  test('malformed pubspec → no crash, degrades to library', () => {
    pubspec('::: not valid yaml :::\n  - [}');
    const dp = detectDartProject(dir);
    expect(dp).not.toBeNull();
    expect(dp?.appType).toBe('library');
  });
});

// ============================================================
// ENGINE — correct classification
// ============================================================
describe('WJTTC ENGINE: Dart/Flutter classification', () => {
  test('Flutter app (lib/main.dart) → mobile + Flutter + Riverpod + go_router', () => {
    pubspec(FLUTTER_APP);
    file('lib/main.dart', 'void main() {}');
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('mobile');
    expect(dp?.framework).toBe('Flutter');
    expect(dp?.stateManagement).toBe('Riverpod');
    expect(dp?.routing).toBe('go_router');
    expect(detectProjectType(dir)).toBe('mobile');
  });

  test('Flutter app (publish_to: none, no main.dart) → mobile', () => {
    pubspec(`name: app
publish_to: 'none'
dependencies:
  flutter:
    sdk: flutter
`);
    expect(detectDartProject(dir)?.appType).toBe('mobile');
  });

  test('Flutter state mgmt: Bloc', () => {
    pubspec(`name: app
dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.0
`);
    file('lib/main.dart', 'void main() {}');
    expect(detectDartProject(dir)?.stateManagement).toBe('Bloc');
  });

  test('Flutter state mgmt: Provider and GetX', () => {
    pubspec(`name: app
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.0
`);
    file('lib/main.dart', 'void main() {}');
    expect(detectDartProject(dir)?.stateManagement).toBe('Provider');
  });

  test('Dart MCP server (dart_mcp) → mcp + found cites MCP + turbo-cat api_type MCP', () => {
    pubspec(DART_MCP);
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('mcp');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mcp');
    expect(r.found.join(' ')).toContain('MCP');
    expect(turboCatSlots(dir).stack?.api_type).toBe('MCP');
  });

  test('Dart MCP server (mcp_server) → mcp', () => {
    pubspec(`name: srv
dependencies:
  mcp_server: ^0.1.0
`);
    expect(detectDartProject(dir)?.appType).toBe('mcp');
  });

  test('Dart server: dart_frog → backend + Dart Frog', () => {
    pubspec(DART_SERVER);
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('backend');
    expect(dp?.framework).toBe('Dart Frog');
    expect(detectProjectType(dir)).toBe('backend');
    expect(turboCatSlots(dir).stack?.backend).toBe('Dart Frog');
  });

  test('Dart server: shelf → backend + Shelf', () => {
    pubspec(`name: api
dependencies:
  shelf: ^1.4.0
`);
    expect(detectDartProject(dir)?.framework).toBe('Shelf');
  });

  test('Dart server: serverpod → backend + Serverpod', () => {
    pubspec(`name: api
dependencies:
  serverpod: ^2.0.0
`);
    expect(detectDartProject(dir)?.framework).toBe('Serverpod');
  });

  test('Dart CLI (executables:) → cli', () => {
    pubspec(DART_CLI);
    expect(detectDartProject(dir)?.appType).toBe('cli');
    expect(detectProjectType(dir)).toBe('cli');
  });

  test('Dart CLI (bin/*.dart) → cli', () => {
    pubspec(DART_PACKAGE);
    file('bin/tool.dart', 'void main() {}');
    expect(detectDartProject(dir)?.appType).toBe('cli');
  });

  test('pure Dart package → library', () => {
    pubspec(DART_PACKAGE);
    expect(detectProjectType(dir)).toBe('library');
  });

  test('language=Dart, package_manager=pub, runtime=Dart', () => {
    pubspec(DART_PACKAGE);
    expect(detectLanguage(dir)).toBe('Dart');
    expect(detectPackageManager(dir)).toBe('pub');
    expect(detectRuntime(dir)).toBe('Dart');
  });

  test('testing: flutter_test (Flutter) and test (Dart)', () => {
    pubspec(`name: app
dependencies:
  flutter:
    sdk: flutter
dev_dependencies:
  flutter_test:
    sdk: flutter
`);
    file('lib/main.dart', 'void main() {}');
    expect(detectDartProject(dir)?.testing).toBe('flutter_test');
  });

  test('full pipeline: detectStack().project.type correct per shape', () => {
    const cases: Array<[string, string, () => void]> = [
      [FLUTTER_APP, 'mobile', () => file('lib/main.dart', 'void main(){}')],
      [DART_MCP, 'mcp', () => {}],
      [DART_SERVER, 'backend', () => {}],
      [DART_CLI, 'cli', () => {}],
      [DART_PACKAGE, 'library', () => {}],
    ];
    for (const [body, expected, extra] of cases) {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      pubspec(body);
      extra();
      const st = detectStack(dir);
      expect(st.project.type).toBe(expected);
      expect(st.project.main_language).toBe('Dart');
    }
  });
});

// ============================================================
// AERO — edge cases & adversarial input
// ============================================================
describe('WJTTC AERO: Dart edge cases', () => {
  test('Flutter app with a server dep → Flutter still wins (mobile)', () => {
    pubspec(`name: app
dependencies:
  flutter:
    sdk: flutter
  shelf: ^1.4.0
`);
    file('lib/main.dart', 'void main() {}');
    expect(detectDartProject(dir)?.appType).toBe('mobile');
  });

  test('serverpod + dart_frog both present → serverpod wins (priority)', () => {
    pubspec(`name: api
dependencies:
  dart_frog: ^1.1.0
  serverpod: ^2.0.0
`);
    expect(detectDartProject(dir)?.framework).toBe('Serverpod');
  });

  test('Flutter app with bin/ tooling → mobile (Flutter beats CLI)', () => {
    pubspec(FLUTTER_APP);
    file('lib/main.dart', 'void main() {}');
    file('bin/gen.dart', 'void main() {}');
    expect(detectDartProject(dir)?.appType).toBe('mobile');
  });

  test('top-level flutter: section (no explicit flutter dep) → isFlutter', () => {
    pubspec(`name: app
dependencies:
  http: ^1.2.0
flutter:
  uses-material-design: true
`);
    expect(detectDartProject(dir)?.isFlutter).toBe(true);
  });

  test('Dart MCP server with a test dep → still mcp', () => {
    pubspec(`name: srv
dependencies:
  dart_mcp: ^0.2.0
dev_dependencies:
  test: ^1.25.0
`);
    expect(detectDartProject(dir)?.appType).toBe('mcp');
  });

  test('no pubspec.yaml → null', () => {
    expect(detectDartProject(dir)).toBeNull();
  });

  test('dependency_overrides do not change classification', () => {
    pubspec(`name: pkg
dependencies:
  collection: ^1.18.0
dependency_overrides:
  meta: ^1.0.0
`);
    expect(detectDartProject(dir)?.appType).toBe('library');
  });
});

// ============================================================
// SPEC — dart-detection.json is the single source (A+B hybrid)
// ============================================================
describe('PIT: WJTTC SPEC: dart-detection.json single source', () => {
  test('exposes the knowledge keys, non-empty', () => {
    expect(Array.isArray(dartSpec.flutterDeps) && dartSpec.flutterDeps.length > 0).toBe(true);
    expect(dartSpec.mcpDeps).toContain('dart_mcp');
    expect(dartSpec.serverFrameworks.some((e) => e[0] === 'dart_frog')).toBe(true);
    expect(dartSpec.stateManagement.some((e) => e[1] === 'Riverpod')).toBe(true);
    expect(dartSpec.routing.some((e) => e[0] === 'go_router')).toBe(true);
  });

  test('detection is spec-driven (a spec entry classifies)', () => {
    // serverpod lives in the spec → must classify as backend/Serverpod
    pubspec('name: api\ndependencies:\n  serverpod: ^2.0.0\n');
    expect(detectDartProject(dir)?.framework).toBe('Serverpod');
    expect(dartSpec.serverFrameworks.some((e) => e[1] === 'Serverpod')).toBe(true);
  });
});
