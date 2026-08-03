/**
 * 🏎️ WJTTC — Swift Content-Aware Context Engine
 *
 * BRAKE:  Package.swift is NEVER blindly app / iOS / Vapor
 * ENGINE: products · package URLs · MCP · CLI · library · light Xcode
 * AERO:   turbo-cat + tech_stack compose
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import {
  detectSwiftProject,
  parsePackageSwift,
  stripSwiftComments,
} from '../../src/detect/swift.js';
import {
  detectProjectTypeWithRationale,
} from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import swiftSpec from '../../src/detect/swift-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-swift-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

const LIB = `import PackageDescription
let package = Package(
    name: "MyLib",
    products: [.library(name: "MyLib", targets: ["MyLib"])],
    targets: [.target(name: "MyLib")]
)
`;

const VAPOR = `import PackageDescription
let package = Package(
    name: "MyAPI",
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "4.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [.product(name: "Vapor", package: "vapor")]
        ),
    ]
)
`;

const EXE = `import PackageDescription
let package = Package(
    name: "MyCLI",
    products: [.executable(name: "mycli", targets: ["MyCLI"])],
    targets: [.executableTarget(name: "MyCLI")]
)
`;

describe('WJTTC BRAKE: Package.swift alone ≠ app', () => {
  test('bare library Package.swift → library, not app', () => {
    file('Package.swift', LIB);
    const r = detectSwiftProject(dir);
    expect(r?.appType).toBe('library');
    expect(r?.framework).toBe('');
    expect(detectProjectTypeWithRationale(dir).type).toBe('library');
    expect(detectProjectTypeWithRationale(dir).found.join(' ')).not.toMatch(/no classifying signals/);
  });

  test('no swift markers → null', () => {
    file('README.md', 'hello');
    expect(detectSwiftProject(dir)).toBeNull();
  });

  test('knowledge has MCP + server entries (single source)', () => {
    expect((swiftSpec.mcpPackageUrls as string[]).length).toBeGreaterThan(0);
    expect((swiftSpec.serverPackageUrls as unknown[]).length).toBeGreaterThan(0);
    expect((swiftSpec.mcpProducts as string[]).length).toBeGreaterThan(0);
  });

  test('commented vapor URL does not classify backend', () => {
    file(
      'Package.swift',
      `import PackageDescription
let package = Package(
    name: "Clean",
    // .package(url: "https://github.com/vapor/vapor.git", from: "4.0.0"),
    products: [.library(name: "Clean", targets: ["Clean"])],
    targets: [.target(name: "Clean")]
)
`,
    );
    expect(detectSwiftProject(dir)?.appType).toBe('library');
  });
});

describe('WJTTC ENGINE: Swift classification', () => {
  test('Vapor dep → backend (7.6.0 regression: was library fallback)', () => {
    file('Package.swift', VAPOR);
    const r = detectSwiftProject(dir);
    expect(r?.appType).toBe('backend');
    expect(r?.framework).toBe('Vapor');
    expect(detectProjectTypeWithRationale(dir).type).toBe('backend');
  });

  test('executable product → cli (7.6.0 regression: was library fallback)', () => {
    file('Package.swift', EXE);
    expect(detectSwiftProject(dir)?.appType).toBe('cli');
    expect(detectProjectTypeWithRationale(dir).type).toBe('cli');
  });

  test('MCP product wins over Vapor', () => {
    file(
      'Package.swift',
      `import PackageDescription
let package = Package(
    name: "Both",
    dependencies: [
        .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git", from: "0.11.0"),
        .package(url: "https://github.com/vapor/vapor.git", from: "4.0.0"),
    ],
    targets: [
        .executableTarget(name: "App", dependencies: [
            .product(name: "MCP", package: "swift-sdk"),
            .product(name: "Vapor", package: "vapor"),
        ]),
    ]
)
`,
    );
    expect(detectSwiftProject(dir)?.appType).toBe('mcp');
  });

  test('xcodeproj application → app', () => {
    file('Demo.xcodeproj/project.pbxproj', 'productType = "com.apple.product-type.application";\n');
    const r = detectSwiftProject(dir);
    expect(r?.appType).toBe('app');
    expect(r?.packageManager).toBe('xcode');
  });

  test('parsePackageSwift extracts urls and products', () => {
    const s = parsePackageSwift(VAPOR);
    expect(s.packageUrls.some(u => u.includes('vapor/vapor'))).toBe(true);
    expect(s.productNames).toContain('Vapor');
    expect(s.hasExecutableTarget).toBe(true);
  });

  test('stripSwiftComments removes line comments', () => {
    const s = stripSwiftComments('// .package(url: "https://github.com/vapor/vapor.git")\nlet x = 1\n');
    expect(s).not.toContain('vapor');
    expect(s).toContain('let x');
  });
});

describe('WJTTC AERO: multi-surface compose', () => {
  test('Turbo-Cat bare library does not stamp Vapor backend', () => {
    file('Package.swift', LIB);
    const tc = turboCatSlots(dir);
    expect(tc.stack?.backend).not.toBe('Vapor');
    expect(tc.project?.main_language).toBe('Swift');
  });

  test('Turbo-Cat Vapor from Package.swift deps', () => {
    file('Package.swift', VAPOR);
    const tc = turboCatSlots(dir);
    expect(tc.stack?.backend).toBe('Vapor');
  });

  test('tech_stack bare library has Swift not Vapor', () => {
    file('Package.swift', LIB);
    const data = detectStack(dir);
    expect(data.project?.type).toMatch(/library/);
    expect(data.tech_stack ?? []).toContain('Swift');
    expect(data.tech_stack ?? []).not.toContain('Vapor');
  });

  test('tech_stack Vapor when vapor in Package.swift', () => {
    file('Package.swift', VAPOR);
    const data = detectStack(dir);
    expect(data.project?.type).toBe('backend');
    expect(data.tech_stack ?? []).toContain('Vapor');
  });
});
