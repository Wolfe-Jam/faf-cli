/**
 * 🏎️ WJTTC: FAFb Ecosystem Detector Tests
 * Tests for detecting FAFb compiler, Radio Protocol, and WASM SDK projects
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  detectFAFbProject,
  getFAFbMetadata,
  shouldUseFAFbScoring,
  type FAFbProjectInfo
} from '../../src/utils/fafb-detector';

const TEMP_DIR = path.join(os.tmpdir(), 'wjttc-fafb-detector-tests');

async function setupTempDir(): Promise<string> {
  const testDir = path.join(TEMP_DIR, `test-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe('🏎️ WJTTC: FAFb Ecosystem Detector', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await setupTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(testDir);
  });

  describe('FAFb Compiler Detection (Rust)', () => {
    it('detects xai-faf-rust compiler project', async () => {
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), '# FAFb Binary Format Spec\nVersion 1.0\n.fafb format');
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "xai-faf"\nversion = "1.0.0"');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_compiler');
      expect(result.ecosystem).toBe('fafb-compiler');
      expect(result.language).toBe('Rust');
      expect(result.confidence).toBe(100);
      expect(result.features).toContain('binary-format-spec');
      expect(result.features).toContain('fafb-binary-support');
      expect(result.features).toContain('rust-compiler');
    });

    it('detects Rust compiler without xai-faf in name', async () => {
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), 'FAFb spec');
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "faf-rust-sdk"');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.ecosystem).toBe('fafb-compiler');
    });
  });

  describe('FAFb Compiler Detection (Zig)', () => {
    it('detects xai-faf-zig compiler project', async () => {
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), '# FAFB Format\nZig implementation');
      await fs.writeFile(path.join(testDir, 'build.zig'), 'const std = @import("std");\n// Zig build');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_compiler');
      expect(result.language).toBe('Zig');
      expect(result.confidence).toBe(100);
      expect(result.features).toContain('zig-compiler');
    });
  });

  describe('Radio Protocol Client Detection', () => {
    it('detects Bun Radio Protocol client', async () => {
      const packageJson = {
        name: 'faf-radio-bun',
        description: 'Radio Protocol WebSocket client',
        version: '1.0.0'
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_radio_client');
      expect(result.subtype).toBe('bun_websocket_client');
      expect(result.ecosystem).toBe('fafb-broadcasting');
      expect(result.language).toBe('TypeScript/Bun');
      expect(result.confidence).toBe(100);
      expect(result.features).toContain('radio-protocol');
      expect(result.features).toContain('websocket-client');
    });

    it('detects Rust Radio Protocol client', async () => {
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "faf-radio-rust"\ndescription = "Radio Protocol client"');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_radio_client');
      expect(result.subtype).toBe('rust_websocket_client');
      expect(result.language).toBe('Rust');
      expect(result.features).toContain('tokio');
    });

    it('detects Zig Radio Protocol client', async () => {
      await fs.writeFile(path.join(testDir, 'build.zig'), 'const faf_radio = @import("radio");\n// Radio client');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_radio_client');
      expect(result.subtype).toBe('zig_wasm_client');
      expect(result.language).toBe('Zig');
      expect(result.features).toContain('wasm');
      expect(result.features).toContain('ghost-binary');
    });
  });

  describe('WASM SDK Detection', () => {
    it('detects faf-wasm-sdk project', async () => {
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "faf-wasm-sdk"\n[lib]\ncrate-type = ["cdylib"]\n[target.wasm32-unknown-unknown]');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_wasm_sdk');
      expect(result.subtype).toBe('rust_wasm');
      expect(result.ecosystem).toBe('fafb-runtime');
      expect(result.language).toBe('Rust→WASM');
      expect(result.confidence).toBe(100);
      expect(result.features).toContain('wasm-target');
      expect(result.features).toContain('browser-runtime');
      expect(result.features).toContain('edge-runtime');
    });
  });

  describe('FAFb Consumer Detection', () => {
    it('detects projects with .fafb files', async () => {
      await fs.writeFile(path.join(testDir, 'project.fafb'), Buffer.from([0x46, 0x41, 0x46, 0x42]));
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name":"test"}');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_consumer');
      expect(result.ecosystem).toBe('fafb-consumer');
      expect(result.confidence).toBe(80);
      expect(result.features).toContain('fafb-files-present');
    });

    it('upgrades consumer to compiler if BINARY-FORMAT.md exists', async () => {
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), 'FAFb spec');
      await fs.writeFile(path.join(testDir, 'project.fafb'), Buffer.from([0x46, 0x41, 0x46, 0x42]));
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "xai-faf"');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(true);
      expect(result.projectType).toBe('fafb_compiler'); // Should be compiler, not consumer
      expect(result.ecosystem).toBe('fafb-compiler');
      expect(result.confidence).toBe(100);
    });
  });

  describe('Non-FAFb Projects', () => {
    it('returns not FAFb for regular projects', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name":"regular-project"}');
      await fs.writeFile(path.join(testDir, 'README.md'), '# Regular Project');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(false);
      expect(result.projectType).toBe('unknown');
      expect(result.ecosystem).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('handles empty directories gracefully', async () => {
      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('handles missing directories gracefully', async () => {
      const result = await detectFAFbProject('/nonexistent/directory');

      expect(result.isFAFbProject).toBe(false);
    });
  });

  describe('getFAFbMetadata', () => {
    it('returns metadata for compiler projects', async () => {
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), 'FAFb');
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "xai-faf"');

      const metadata = await getFAFbMetadata(testDir);

      expect(metadata.fafb_support).toBe(true);
      expect(metadata.ecosystem).toBe('fafb-compiler');
      expect(metadata.project_type).toBe('fafb_compiler');
      expect(metadata.language).toBe('Rust');
      expect(metadata.compiler_type).toBe('fafb');
      expect(metadata.output_format).toBe('.fafb binary');
      expect(metadata.purpose).toContain('O(1) lookup');
    });

    it('returns metadata for Radio Protocol clients', async () => {
      const pkg = { name: 'faf-radio-bun', description: 'Radio Protocol client' };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkg));

      const metadata = await getFAFbMetadata(testDir);

      expect(metadata.protocol).toBe('Radio Protocol v1.0');
      expect(metadata.transport).toBe('WebSocket');
      expect(metadata.broadcasts).toBe('binary_and_yaml');
      expect(metadata.purpose).toContain('99% cost reduction');
    });

    it('returns metadata for WASM SDK projects', async () => {
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "faf-wasm-sdk"\n[lib]\ncrate-type = ["cdylib"]\n[target.wasm32-unknown-unknown]');

      const metadata = await getFAFbMetadata(testDir);

      expect(metadata.target).toBe('wasm32-unknown-unknown');
      expect(metadata.runtime).toContain('Browser');
      expect(metadata.purpose).toContain('edge environments');
    });

    it('returns empty object for non-FAFb projects', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name":"regular"}');

      const metadata = await getFAFbMetadata(testDir);

      expect(metadata).toEqual({});
    });
  });

  describe('shouldUseFAFbScoring', () => {
    it('returns true for FAFb project types', () => {
      expect(shouldUseFAFbScoring('fafb_compiler')).toBe(true);
      expect(shouldUseFAFbScoring('fafb_radio_client')).toBe(true);
      expect(shouldUseFAFbScoring('fafb_wasm_sdk')).toBe(true);
      expect(shouldUseFAFbScoring('fafb_consumer')).toBe(true);
    });

    it('returns false for non-FAFb project types', () => {
      expect(shouldUseFAFbScoring('unknown')).toBe(false);
      expect(shouldUseFAFbScoring('web-app')).toBe(false);
      expect(shouldUseFAFbScoring('library')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles projects with multiple indicators', async () => {
      // Project with both BINARY-FORMAT.md AND .fafb files
      await fs.writeFile(path.join(testDir, 'BINARY-FORMAT.md'), 'FAFB spec');
      await fs.writeFile(path.join(testDir, 'project.fafb'), Buffer.from([0x46, 0x41, 0x46, 0x42]));
      await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "xai-faf"');

      const result = await detectFAFbProject(testDir);

      // Should prioritize compiler over consumer
      expect(result.projectType).toBe('fafb_compiler');
      expect(result.features).toContain('fafb-files-present');
    });

    it('handles invalid JSON in package.json gracefully', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), '{invalid json}');

      const result = await detectFAFbProject(testDir);

      expect(result.isFAFbProject).toBe(false);
    });

    it('handles permission errors gracefully', async () => {
      if (process.platform !== 'win32') {
        await fs.writeFile(path.join(testDir, 'Cargo.toml'), '[package]\nname = "test"');
        await fs.chmod(path.join(testDir, 'Cargo.toml'), 0o000);

        const result = await detectFAFbProject(testDir);

        // Should not throw, just return unknown
        expect(result).toBeDefined();

        // Restore permissions for cleanup
        await fs.chmod(path.join(testDir, 'Cargo.toml'), 0o644);
      }
    });
  });
});
