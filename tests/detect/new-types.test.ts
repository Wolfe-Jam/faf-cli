/**
 * WJTTC — new app-type detection branches (Phase 3 + 4 of v6.5.0 app-types session)
 *
 * ENGINE: each new type's detection branch must (a) classify correctly on
 *         a fixture matching its signals, (b) report observable evidence in
 *         found[], (c) NOT classify on signals it shouldn't claim.
 * BRAKE:  the SDK-priority rule — sdk wins over library/cli/wasm when
 *         keyword/name signals fire.
 *
 * Per v6.6.md + glass-hood-found-detection doctrines.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectProjectTypeWithRationale } from '../../src/detect/scanner.js';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `faf-newtypes-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function pkg(content: object): void {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'test', version: '1.0.0', ...content,
  }));
}

function cargo(content: string): void {
  writeFileSync(join(dir, 'Cargo.toml'), content);
}

describe('WJTTC ENGINE: documentation type', () => {
  test('package name "*-specification" → documentation', () => {
    pkg({ name: '@faf/specification', files: ['SPECIFICATION.md', 'README.md', 'examples/'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('documentation');
    expect(r.found.join(' ')).toMatch(/specification/i);
  });

  test('keywords contains "specification" → documentation', () => {
    pkg({ keywords: ['format-spec', 'specification'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('documentation');
  });

  test('files = docs/examples only (no source) → documentation', () => {
    pkg({ files: ['README.md', 'examples/'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('documentation');
  });

  test('does NOT classify regular libraries as documentation', () => {
    pkg({ main: 'dist/index.js', files: ['dist/'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('documentation');
  });
});

describe('WJTTC ENGINE: sdk type (PRIORITY rule — wins over library/cli/wasm)', () => {
  test('package name with "-sdk" suffix → sdk', () => {
    pkg({ name: 'faf-sdk', main: 'dist/index.js' });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('sdk');
    expect(r.found.join(' ')).toMatch(/sdk/i);
  });

  test('keywords contains "sdk" → sdk (overrides library detection)', () => {
    pkg({ name: 'somelib', main: 'dist/index.js', keywords: ['sdk', 'api'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('sdk');
  });

  test('Cargo.toml name with "-sdk" → sdk', () => {
    cargo('[package]\nname = "faf-rust-sdk"\nversion = "1.0.0"\n[lib]\ncrate-type = ["rlib"]\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('sdk');
    expect(r.found.join(' ')).toMatch(/sdk/i);
  });

  test('SDK keyword wins over pkg.bin (cli would normally fire)', () => {
    pkg({ name: 'my-sdk', bin: { 'my-sdk': 'dist/cli.js' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('sdk');
  });
});

describe('WJTTC ENGINE: wasm type', () => {
  test('Cargo crate-type cdylib → wasm', () => {
    cargo('[package]\nname = "x"\nversion = "0.1.0"\n[lib]\ncrate-type = ["cdylib"]\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('wasm');
    expect(r.found.join(' ')).toMatch(/cdylib/);
  });

  test('build.zig with wasm target → wasm', () => {
    writeFileSync(join(dir, 'build.zig'),
      'pub fn build(b: *std.Build) void { exe.setOutputFormat(.wasm); }');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('wasm');
  });

  test('package keywords contains "wasm" → wasm', () => {
    pkg({ keywords: ['wasm', 'webassembly'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('wasm');
  });
});

describe('WJTTC ENGINE: mobile type', () => {
  test('react-native dependency → mobile', () => {
    pkg({ dependencies: { 'react-native': '^0.74.0', 'react': '^18.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mobile');
    expect(r.found.join(' ')).toMatch(/react-native/);
  });

  test('expo dependency → mobile', () => {
    pkg({ dependencies: { 'expo': '^50.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mobile');
  });

  test('Flutter app (pubspec + lib/main.dart) → mobile', () => {
    writeFileSync(join(dir, 'pubspec.yaml'), 'name: test_app\nflutter:\n  uses-material-design: true\n');
    mkdirSync(join(dir, 'lib'), { recursive: true });
    writeFileSync(join(dir, 'lib', 'main.dart'), 'void main() {}');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mobile');
  });

  test('Flutter package (pubspec, no app entry) → library', () => {
    writeFileSync(join(dir, 'pubspec.yaml'), 'name: my_widgets\ndependencies:\n  flutter:\n    sdk: flutter\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('library');
  });

  test('ios/ + android/ dirs → mobile', () => {
    mkdirSync(join(dir, 'ios'));
    mkdirSync(join(dir, 'android'));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mobile');
  });
});

describe('WJTTC ENGINE: extension type (browser/chrome extension)', () => {
  test('manifest.json with manifest_version → extension', () => {
    writeFileSync(join(dir, 'manifest.json'),
      JSON.stringify({ manifest_version: 3, name: 'X', version: '1.0.0' }));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('extension');
    expect(r.found.join(' ')).toMatch(/manifest_version/);
  });

  test('public/manifest.json (common build layout) → extension', () => {
    mkdirSync(join(dir, 'public'));
    writeFileSync(join(dir, 'public/manifest.json'),
      JSON.stringify({ manifest_version: 3, name: 'X' }));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('extension');
  });

  test('manifest_version WINS over a Svelte build (the Stack⚡️Grabber regression)', () => {
    // A framework-built extension must classify as extension — NOT svelte/
    // fullstack. This is the exact misclassification that motivated the type.
    writeFileSync(join(dir, 'manifest.json'),
      JSON.stringify({ manifest_version: 3, name: 'Grabber' }));
    pkg({ dependencies: { svelte: '^4.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('extension');
  });

  test('PWA web-app manifest (no manifest_version) does NOT classify as extension', () => {
    writeFileSync(join(dir, 'manifest.json'),
      JSON.stringify({ name: 'My PWA', start_url: '/', display: 'standalone' }));
    pkg({ dependencies: { react: '^18.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('extension');
  });
});

describe('WJTTC ENGINE: data-science type', () => {
  test('pyproject.toml with numpy → data-science', () => {
    writeFileSync(join(dir, 'pyproject.toml'),
      '[project]\nname = "x"\ndependencies = ["numpy", "pandas"]\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('data-science');
    expect(r.found.join(' ')).toMatch(/numpy/);
  });

  test('requirements.txt with sklearn → data-science', () => {
    writeFileSync(join(dir, 'requirements.txt'), 'scikit-learn==1.3.0\nnumpy>=1.24\n');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('data-science');
  });
});

describe('WJTTC ENGINE: enterprise type', () => {
  test('private workspace + frontend + backend frameworks → enterprise', () => {
    pkg({
      private: true,
      workspaces: ['packages/*'],
      dependencies: { react: '^18.0.0', express: '^4.0.0' },
    });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('enterprise');
  });

  test('public workspace does NOT classify as enterprise', () => {
    pkg({
      workspaces: ['packages/*'],
      dependencies: { react: '^18.0.0', express: '^4.0.0' },
    });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('enterprise');
  });
});

describe('WJTTC ENGINE: monorepo-root type', () => {
  test('private workspace + no Svelte → monorepo-root (NOT framework)', () => {
    pkg({ private: true, workspaces: ['packages/*'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('monorepo-root');
  });

  test('private workspace + Svelte → framework (NOT monorepo-root)', () => {
    pkg({
      private: true,
      workspaces: ['packages/*'],
      dependencies: { svelte: '^4.0.0' },
    });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('framework');
  });
});

describe('WJTTC ENGINE: website type', () => {
  test('Astro static-site → website', () => {
    pkg({ dependencies: { astro: '^4.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('website');
    expect(r.found.join(' ')).toMatch(/Astro/i);
  });

  test('Gatsby → website', () => {
    pkg({ dependencies: { gatsby: '^5.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('website');
  });

  test('keywords contains "marketing" → website', () => {
    pkg({ keywords: ['marketing', 'landing'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('website');
  });
});

describe('WJTTC ENGINE: saas type', () => {
  test('Clerk + Stripe + DB → saas', () => {
    pkg({
      dependencies: {
        '@clerk/nextjs': '^4.0.0',
        'stripe': '^14.0.0',
        'next': '^14.0.0',
      },
    });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('saas');
  });

  test('next-auth + Stripe → saas', () => {
    pkg({
      dependencies: {
        'next-auth': '^4.0.0',
        '@stripe/stripe-js': '^2.0.0',
      },
    });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('saas');
  });

  test('auth without payment does NOT classify as saas', () => {
    pkg({ dependencies: { '@clerk/nextjs': '^4.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('saas');
  });
});

describe('WJTTC ENGINE: mcpaas type', () => {
  test('package name contains "mcpaas" → mcpaas', () => {
    pkg({ name: 'mcpaas-live' });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mcpaas');
  });

  test('keywords contains "mcpaas" → mcpaas', () => {
    pkg({ keywords: ['mcpaas', 'mcp', 'platform'] });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('mcpaas');
  });
});

describe('WJTTC ENGINE: html type', () => {
  test('bare index.html, no package.json → html', () => {
    writeFileSync(join(dir, 'index.html'), '<!doctype html><html></html>');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('html');
  });

  test('index.html + frontend deps does NOT classify as html (frontend wins)', () => {
    writeFileSync(join(dir, 'index.html'), '<!doctype html><html></html>');
    pkg({ dependencies: { react: '^18.0.0' } });
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('html');
  });
});

describe('WJTTC BRAKE: priority order — most-specific wins', () => {
  test('SDK + cli signals → sdk wins (NOT cli)', () => {
    pkg({ name: 'my-sdk', bin: { x: 'cli.js' } });
    expect(detectProjectTypeWithRationale(dir).type).toBe('sdk');
  });

  test('SDK keyword + mcpaas keyword → sdk wins (NOT mcpaas)', () => {
    // wolfejam doctrine 2026-05-08: SDK takes priority. mcpaas-sdk-style repos
    // (consumer SDKs FOR a platform) classify as sdk, not the platform itself.
    pkg({ name: 'platform-sdk', keywords: ['sdk', 'mcpaas', 'platform'] });
    expect(detectProjectTypeWithRationale(dir).type).toBe('sdk');
  });

  test('mcpaas signals + mcp signals → mcpaas wins (NOT mcp)', () => {
    pkg({ name: 'mcpaas-platform', dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' } });
    expect(detectProjectTypeWithRationale(dir).type).toBe('mcpaas');
  });

  test('saas signals + fullstack signals → saas wins (NOT fullstack)', () => {
    pkg({
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        '@clerk/nextjs': '^4.0.0',
        'stripe': '^14.0.0',
      },
    });
    expect(detectProjectTypeWithRationale(dir).type).toBe('saas');
  });
});

describe('WJTTC ENGINE: Cargo [[bin]] cli detection (xai-faf-rust shape)', () => {
  test('Cargo.toml with [[bin]] section → cli', () => {
    cargo([
      '[package]',
      'name = "my-rust-cli"',
      'version = "1.0.0"',
      '',
      '[[bin]]',
      'name = "my-rust-cli"',
      'path = "src/main.rs"',
    ].join('\n'));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('cli');
    expect(r.found).toContain('Cargo.toml [[bin]]');
  });

  test('Cargo with [lib] only (no [[bin]]) does NOT classify as cli', () => {
    cargo([
      '[package]',
      'name = "my-lib"',
      'version = "1.0.0"',
      '',
      '[lib]',
      'crate-type = ["rlib"]',
    ].join('\n'));
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).not.toBe('cli');
  });
});
