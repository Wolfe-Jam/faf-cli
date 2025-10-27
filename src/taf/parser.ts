/**
 * TAF Parser - MCP-portable YAML parsing
 *
 * Pure functions for reading/writing .taf files
 * No CLI dependencies - ready for MCP extraction
 */

import * as yaml from 'yaml';
import { TAFFile } from './types';

/**
 * Parse .taf file content from YAML string
 * MCP-portable: takes string, returns object
 */
export function parseTAF(content: string): TAFFile {
  try {
    // Split on document separator and take only first document
    const lines = content.split('\n');
    const yamlLines: string[] = [];

    for (const line of lines) {
      // Stop at document separator (but skip initial one if present)
      if (line.trim() === '---' && yamlLines.length > 0) {
        break;
      }
      // Skip initial document separator
      if (line.trim() === '---' && yamlLines.length === 0) {
        continue;
      }
      yamlLines.push(line);
    }

    const parsed = yaml.parse(yamlLines.join('\n'));

    // Validate required fields
    if (!parsed.format_version) {
      throw new Error('Missing required field: format_version');
    }
    if (!parsed.project) {
      throw new Error('Missing required field: project');
    }
    if (!parsed.created) {
      throw new Error('Missing required field: created');
    }
    if (!parsed.test_history || !Array.isArray(parsed.test_history)) {
      throw new Error('Missing or invalid field: test_history');
    }

    return parsed as TAFFile;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse .taf file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Serialize TAF object to YAML string
 * MCP-portable: takes object, returns string
 */
export function serializeTAF(taf: TAFFile): string {
  return yaml.stringify(taf, {
    lineWidth: 0, // No line wrapping
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  });
}

/**
 * Create a new TAF file structure
 * MCP-portable: pure function
 */
export function createTAF(project: string, options?: {
  faf_associated?: boolean;
  faf_location?: string;
  faf_score?: number;
}): TAFFile {
  const now = new Date().toISOString();

  return {
    format_version: '1.0.0',
    project,
    created: now,
    last_updated: now,
    ...(options?.faf_associated !== undefined && {
      faf_associated: options.faf_associated,
      faf_location: options.faf_location || '.faf',
      faf_score: options.faf_score,
    }),
    test_history: [],
  };
}

/**
 * Format TAF file with proper comments and structure
 * MCP-portable: string transformation
 */
export function formatTAF(content: string): string {
  const lines = content.split('\n');
  const formatted: string[] = [];

  // Add header comment
  formatted.push('# .taf - Testing Activity Feed');

  // Process lines
  let inTestHistory = false;
  for (const line of lines) {
    if (line.startsWith('format_version:')) {
      formatted.push(line);
      continue;
    }

    if (line.startsWith('project:') || line.startsWith('created:') || line.startsWith('last_updated:')) {
      formatted.push(line);
      continue;
    }

    if (line.startsWith('faf_associated:')) {
      if (!formatted.some(l => l.includes('# FAF Integration'))) {
        formatted.push('');
        formatted.push('# FAF Integration (Optional - Native Reference)');
      }
      formatted.push(line);
      continue;
    }

    if (line.startsWith('test_history:')) {
      if (!inTestHistory) {
        formatted.push('');
        formatted.push('# Test execution history (append-only)');
        inTestHistory = true;
      }
      formatted.push(line);
      continue;
    }

    formatted.push(line);
  }

  return formatted.join('\n');
}
