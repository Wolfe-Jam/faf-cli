/**
 * 🏎️ FAFb Ecosystem Detector
 * Detects FAFb binary format projects and Radio Protocol implementations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileExists } from './file-utils';

export interface FAFbProjectInfo {
  isFAFbProject: boolean;
  projectType: string;
  subtype?: string;
  ecosystem: string;
  confidence: number;
  features: string[];
  language?: string;
}

/**
 * Detect if project is part of FAFb ecosystem
 */
export async function detectFAFbProject(projectRoot: string): Promise<FAFbProjectInfo> {
  const result: FAFbProjectInfo = {
    isFAFbProject: false,
    projectType: 'unknown',
    ecosystem: 'unknown',
    confidence: 0,
    features: []
  };

  try {
    // Check for FAFb compiler projects (xai-faf-rust, xai-faf-zig)
    const binaryFormatMd = await fileExists(path.join(projectRoot, 'BINARY-FORMAT.md'));
    const cargoToml = await fileExists(path.join(projectRoot, 'Cargo.toml'));
    const buildZig = await fileExists(path.join(projectRoot, 'build.zig'));

    if (binaryFormatMd) {
      result.isFAFbProject = true;
      result.ecosystem = 'fafb-compiler';
      result.confidence = 95;
      result.features.push('binary-format-spec');

      // Read BINARY-FORMAT.md to determine project type
      const content = await fs.readFile(path.join(projectRoot, 'BINARY-FORMAT.md'), 'utf-8');

      if (content.includes('FAFb') || content.includes('FAFB') || content.includes('.fafb')) {
        result.confidence = 100;
        result.features.push('fafb-binary-support');
      }

      if (cargoToml) {
        const cargoContent = await fs.readFile(path.join(projectRoot, 'Cargo.toml'), 'utf-8');
        if (cargoContent.includes('xai-faf') || cargoContent.includes('faf-rust')) {
          result.projectType = 'fafb_compiler';
          result.language = 'Rust';
          result.features.push('rust-compiler');
        }
      }

      if (buildZig) {
        result.projectType = 'fafb_compiler';
        result.language = 'Zig';
        result.features.push('zig-compiler');
      }
    }

    // Check for Radio Protocol projects (faf-radio-bun, faf-radio-rust, faf-radio-zig)
    const packageJson = path.join(projectRoot, 'package.json');
    if (await fileExists(packageJson)) {
      const pkg = JSON.parse(await fs.readFile(packageJson, 'utf-8'));

      if (pkg.name?.includes('radio') || pkg.description?.includes('Radio Protocol')) {
        result.isFAFbProject = true;
        result.projectType = 'fafb_radio_client';
        result.ecosystem = 'fafb-broadcasting';
        result.confidence = 100;
        result.features.push('radio-protocol', 'websocket-client');

        if (pkg.name?.includes('bun')) {
          result.subtype = 'bun_websocket_client';
          result.language = 'TypeScript/Bun';
        }
      }
    }

    if (cargoToml && !binaryFormatMd) {
      const cargoContent = await fs.readFile(path.join(projectRoot, 'Cargo.toml'), 'utf-8');

      if (cargoContent.includes('faf-radio') || cargoContent.includes('Radio Protocol')) {
        result.isFAFbProject = true;
        result.projectType = 'fafb_radio_client';
        result.subtype = 'rust_websocket_client';
        result.ecosystem = 'fafb-broadcasting';
        result.language = 'Rust';
        result.confidence = 100;
        result.features.push('radio-protocol', 'websocket-client', 'tokio');
      }
    }

    if (buildZig && !binaryFormatMd) {
      const zigContent = await fs.readFile(path.join(projectRoot, 'build.zig'), 'utf-8');

      if (zigContent.includes('radio') || zigContent.includes('faf_radio')) {
        result.isFAFbProject = true;
        result.projectType = 'fafb_radio_client';
        result.subtype = 'zig_wasm_client';
        result.ecosystem = 'fafb-broadcasting';
        result.language = 'Zig';
        result.confidence = 100;
        result.features.push('radio-protocol', 'wasm', 'ghost-binary');
      }
    }

    // Check for WASM SDK projects (faf-wasm-sdk)
    if (cargoToml) {
      const cargoContent = await fs.readFile(path.join(projectRoot, 'Cargo.toml'), 'utf-8');

      if (cargoContent.includes('wasm') && cargoContent.includes('faf')) {
        result.isFAFbProject = true;
        result.projectType = 'fafb_wasm_sdk';
        result.subtype = 'rust_wasm';
        result.ecosystem = 'fafb-runtime';
        result.language = 'Rust→WASM';
        result.confidence = 100;
        result.features.push('wasm-target', 'browser-runtime', 'edge-runtime');
      }
    }

    // Check for .fafb files in project (any project using binary format)
    const files = await fs.readdir(projectRoot);
    const hasFafbFiles = files.some(f => f.endsWith('.fafb'));

    if (hasFafbFiles) {
      if (!result.isFAFbProject) {
        result.isFAFbProject = true;
        result.projectType = 'fafb_consumer';
        result.ecosystem = 'fafb-consumer';
        result.confidence = 80;
      }
      result.features.push('fafb-files-present');
    }

  } catch (error) {
    // Silently handle errors
  }

  return result;
}

/**
 * Get FAFb-specific project metadata for .faf generation
 */
export async function getFAFbMetadata(projectRoot: string): Promise<Record<string, any>> {
  const detection = await detectFAFbProject(projectRoot);

  if (!detection.isFAFbProject) {
    return {};
  }

  const metadata: Record<string, any> = {
    fafb_support: true,
    ecosystem: detection.ecosystem,
    project_type: detection.projectType,
  };

  if (detection.subtype) {
    metadata.subtype = detection.subtype;
  }

  if (detection.language) {
    metadata.language = detection.language;
  }

  if (detection.features.length > 0) {
    metadata.features = detection.features;
  }

  // Add specific metadata based on project type
  if (detection.projectType === 'fafb_compiler') {
    metadata.compiler_type = 'fafb';
    metadata.output_format = '.fafb binary';
    metadata.purpose = 'Compiles .faf (YAML) to .fafb (binary) for O(1) lookup';
  }

  if (detection.projectType === 'fafb_radio_client') {
    metadata.protocol = 'Radio Protocol v1.0';
    metadata.transport = 'WebSocket';
    metadata.broadcasts = 'binary_and_yaml';
    metadata.purpose = '99% cost reduction via broadcast-once context distribution';
  }

  if (detection.projectType === 'fafb_wasm_sdk') {
    metadata.target = 'wasm32-unknown-unknown';
    metadata.runtime = 'Browser/Edge/Cloudflare Workers';
    metadata.purpose = 'FAFb runtime for web and edge environments';
  }

  return metadata;
}

/**
 * Check if project should use FAFb-aware scoring
 */
export function shouldUseFAFbScoring(projectType: string): boolean {
  return [
    'fafb_compiler',
    'fafb_radio_client',
    'fafb_wasm_sdk',
    'fafb_consumer'
  ].includes(projectType);
}
