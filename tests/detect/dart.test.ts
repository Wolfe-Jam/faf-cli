/**
 * WJTTC — Dart/Flutter content-aware detection.
 *
 * ENGINE: a pubspec.yaml is classified by its CONTENT, not its filename.
 *         Flutter → mobile · Dart MCP server → mcp · Dart server → backend ·
 *         Dart CLI → cli · pure Dart package → library.
 * BRAKE:  a pure-Dart CLI / package / server is NEVER mislabeled "Flutter"
 *         (the filename-only flattening this module fixes).
 *
 * Catalyst: Randal Schwartz (Dart/Flutter GDE) read the source and concluded
 * FAF "knows nothing about Dart and Flutter." It does now — properly.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectDartProject } from '../../src/detect/dart.js';
import {
  detectProjectTypeWithRationale,
  detectLanguage,
  detectPackageManager,
} from '../../src/detect/scanner.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-test-dart-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const pubspec = (body: string) => writeFileSync(join(dir, 'pubspec.yaml'), body);

describe('WJTTC ENGINE: Dart/Flutter content-aware classification', () => {
  test('Flutter app → mobile, Flutter, Riverpod', () => {
    pubspec(`name: app
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.0
  go_router: ^14.0.0
flutter:
  uses-material-design: true
`);
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('mobile');
    expect(dp?.isFlutter).toBe(true);
    expect(dp?.framework).toBe('Flutter');
    expect(dp?.stateManagement).toBe('Riverpod');
    expect(dp?.routing).toBe('go_router');
    expect(detectProjectTypeWithRationale(dir).type).toBe('mobile');
  });

  test('Dart MCP server → mcp (not mobile) — the on-brand special case', () => {
    pubspec(`name: srv
dependencies:
  dart_mcp: ^0.2.0
`);
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('mcp');
    expect(dp?.isFlutter).toBe(false);
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mcp');
    expect(r.found.join(' ')).toContain('MCP');
  });

  test('Dart server (dart_frog) → backend', () => {
    pubspec(`name: api
dependencies:
  dart_frog: ^1.1.0
`);
    const dp = detectDartProject(dir);
    expect(dp?.appType).toBe('backend');
    expect(dp?.framework).toBe('Dart Frog');
    expect(detectProjectTypeWithRationale(dir).type).toBe('backend');
  });

  test('Dart CLI (executables:) → cli', () => {
    pubspec(`name: tool
dependencies:
  args: ^2.5.0
executables:
  tool:
`);
    expect(detectDartProject(dir)?.appType).toBe('cli');
    expect(detectProjectTypeWithRationale(dir).type).toBe('cli');
  });

  test('Dart CLI (bin/*.dart) → cli', () => {
    pubspec(`name: tool
dependencies:
  args: ^2.5.0
`);
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin/tool.dart'), 'void main() {}');
    expect(detectDartProject(dir)?.appType).toBe('cli');
  });

  test('pure Dart package → library', () => {
    pubspec(`name: pkg
dependencies:
  collection: ^1.18.0
`);
    expect(detectDartProject(dir)?.appType).toBe('library');
    expect(detectProjectTypeWithRationale(dir).type).toBe('library');
  });

  test('main_language = Dart, package_manager = pub', () => {
    pubspec(`name: pkg
dependencies:
  collection: ^1.18.0
`);
    expect(detectLanguage(dir)).toBe('Dart');
    expect(detectPackageManager(dir)).toBe('pub');
  });

  test('non-Dart project → detectDartProject returns null', () => {
    writeFileSync(join(dir, 'package.json'), '{"name":"x"}');
    expect(detectDartProject(dir)).toBeNull();
  });
});

describe('WJTTC BRAKE: pure Dart is NEVER mislabeled Flutter', () => {
  test('Dart package: isFlutter=false, framework not Flutter', () => {
    pubspec(`name: pkg
dependencies:
  collection: ^1.18.0
`);
    const dp = detectDartProject(dir);
    expect(dp?.isFlutter).toBe(false);
    expect(dp?.framework).not.toBe('Flutter');
  });

  test('Dart CLI: not Flutter, not mobile', () => {
    pubspec(`name: tool
dependencies:
  args: ^2.5.0
executables:
  tool:
`);
    const dp = detectDartProject(dir);
    expect(dp?.isFlutter).toBe(false);
    expect(dp?.appType).not.toBe('mobile');
  });
});
