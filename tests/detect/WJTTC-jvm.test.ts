/**
 * 🏎️ WJTTC — JVM Content-Aware Context Engine
 *
 * BRAKE:  pom/gradle is NEVER blindly labeled "backend" / Spring / Android
 * ENGINE: plugins · parents · catalogs · MCP · Android · KMP
 * AERO:   multi-module priority + scanner + turbo-cat compose
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { detectJvmProject, parseVersionCatalog, parseSettingsIncludes } from '../../src/detect/jvm.js';
import {
  detectProjectType,
  detectProjectTypeWithRationale,
  detectPackageManager,
} from '../../src/detect/scanner.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import jvmSpec from '../../src/detect/jvm-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-jvm-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

// ============================================================
// BRAKE — never misclassify
// ============================================================
describe('WJTTC BRAKE: pom/gradle is never blindly backend', () => {
  test('bare pom → library, not backend', () => {
    file(
      'pom.xml',
      '<project><modelVersion>4.0.0</modelVersion><groupId>x</groupId><artifactId>y</artifactId><version>1</version></project>',
    );
    expect(detectJvmProject(dir)?.appType).toBe('library');
    expect(detectProjectType(dir)).toBe('library');
  });

  test('java-library gradle → library, not Android', () => {
    file('build.gradle.kts', 'plugins { `java-library` }\n');
    const j = detectJvmProject(dir)!;
    expect(j.appType).toBe('library');
    expect(j.facets).not.toContain('android');
    expect(detectProjectType(dir)).toBe('library');
  });

  test('no jvm markers → null', () => {
    file('README.md', '# hi');
    expect(detectJvmProject(dir)).toBeNull();
  });

  test('knowledge has MCP + web plugins (single source)', () => {
    expect(jvmSpec.mcpArtifacts.length).toBeGreaterThan(0);
    expect(jvmSpec.webPlugins.length).toBeGreaterThan(0);
    expect(jvmSpec.androidPlugins).toContain('com.android.application');
  });
});

// ============================================================
// ENGINE — core intelligence
// ============================================================
describe('WJTTC ENGINE: JVM classification', () => {
  test('Spring Boot plugin → backend', () => {
    file(
      'build.gradle.kts',
      'plugins { id("org.springframework.boot") version "3.3.0"; java }\n',
    );
    expect(detectJvmProject(dir)?.appType).toBe('backend');
    expect(detectJvmProject(dir)?.framework).toBe('Spring Boot');
    expect(detectProjectType(dir)).toBe('backend');
  });

  test('Android application without kotlin-android → mobile (AGP 9 shape)', () => {
    file('build.gradle.kts', 'plugins { id("com.android.application") }\n');
    const j = detectJvmProject(dir)!;
    expect(j.appType).toBe('mobile');
    expect(j.facets).toContain('android');
    expect(detectProjectType(dir)).toBe('mobile');
  });

  test('MCP artifact → mcp', () => {
    file(
      'pom.xml',
      `<project><modelVersion>4.0.0</modelVersion><groupId>a</groupId><artifactId>b</artifactId><version>1</version>
      <dependencies><dependency>
        <groupId>io.modelcontextprotocol.sdk</groupId><artifactId>mcp</artifactId><version>0.1</version>
      </dependency></dependencies></project>`,
    );
    expect(detectJvmProject(dir)?.appType).toBe('mcp');
    expect(detectProjectType(dir)).toBe('mcp');
  });

  test('version catalog resolves Spring Boot', () => {
    file('settings.gradle.kts', 'rootProject.name = "x"\n');
    file(
      'gradle/libs.versions.toml',
      `[plugins]\nspring-boot = { id = "org.springframework.boot", version = "3.3.0" }\n`,
    );
    file(
      'build.gradle.kts',
      'plugins { alias(libs.plugins.spring.boot); java }\n',
    );
    expect(detectJvmProject(dir)?.appType).toBe('backend');
  });

  test('package manager + Glass Hood found', () => {
    file(
      'pom.xml',
      `<project><modelVersion>4.0.0</modelVersion>
      <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.0</version></parent>
      <artifactId>api</artifactId></project>`,
    );
    expect(detectPackageManager(dir)).toBe('maven');
    const r = detectProjectTypeWithRationale(dir);
    expect(r.type).toBe('backend');
    expect(r.found.some(f => /spring|boot/i.test(f))).toBe(true);
  });

  test('parseVersionCatalog plugins + libraries', () => {
    const cat = parseVersionCatalog(`
[plugins]
spring-boot = { id = "org.springframework.boot", version = "3.3.0" }
[libraries]
foo = { module = "com.acme:foo", version = "1.0" }
`);
    expect(cat.plugins.get('spring-boot')).toBe('org.springframework.boot');
    expect(cat.libraries.get('foo')).toBe('com.acme:foo');
  });

  test('parseSettingsIncludes', () => {
    expect(parseSettingsIncludes('include("app", "lib")\n')).toEqual(['app', 'lib']);
    expect(parseSettingsIncludes("include ':api'\n")).toContain('api');
  });
});

// ============================================================
// AERO — compose + priority
// ============================================================
describe('WJTTC AERO: multi-module + Turbo-Cat', () => {
  test('child Spring Boot wins over root java-library', () => {
    file('settings.gradle.kts', 'include("lib", "api")\n');
    file('lib/build.gradle.kts', 'plugins { `java-library` }\n');
    file(
      'api/build.gradle.kts',
      'plugins { id("org.springframework.boot") version "3.3.0"; java }\n',
    );
    expect(detectJvmProject(dir)?.appType).toBe('backend');
  });

  test('MCP wins over Spring Boot when both present', () => {
    file(
      'build.gradle.kts',
      `plugins { id("org.springframework.boot") version "3.3.0"; java }
dependencies { implementation("io.modelcontextprotocol.sdk:mcp:0.10.0") }
`,
    );
    expect(detectJvmProject(dir)?.appType).toBe('mcp');
  });

  test('Turbo-Cat does not assert Spring from bare pom', () => {
    file(
      'pom.xml',
      '<project><modelVersion>4.0.0</modelVersion><groupId>x</groupId><artifactId>y</artifactId><version>1</version></project>',
    );
    const tc = turboCatSlots(dir);
    // Should not invent Spring as backend for bare pom
    expect(tc.stack?.backend).toBeUndefined();
    expect(tc.project?.main_language).toBe('Java');
  });

  test('Turbo-Cat Spring from Boot parent', () => {
    file(
      'pom.xml',
      `<project><modelVersion>4.0.0</modelVersion>
      <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.0</version></parent>
      <artifactId>api</artifactId></project>`,
    );
    const tc = turboCatSlots(dir);
    expect(tc.stack?.backend).toBe('Spring Boot');
    expect(tc.project?.main_language).toBe('Java');
  });

  test('KMP facet without Android app stays library', () => {
    file('build.gradle.kts', 'plugins { kotlin("multiplatform") }\n');
    const j = detectJvmProject(dir)!;
    expect(j.appType).toBe('library');
    expect(j.facets).toContain('multiplatform');
  });
});
