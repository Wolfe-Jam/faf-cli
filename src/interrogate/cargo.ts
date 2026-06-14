/**
 * Cargo.toml interrogation — extract Rust project metadata.
 *
 * The [package].description field is the Rust ecosystem's equivalent of
 * package.json's `description` — a one-line elevator pitch. It maps to
 * `project.goal` (overarching/use-case framing).
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type ExtractedContext, isValidExtraction } from './types.js';

/** Parse a single TOML field from `[package]` table. Naive but adequate for
 *  description / authors / repository / license — fields that don't span
 *  multiple lines or use complex nested structures. */
function readPackageField(content: string, field: string): string | null {
  const lines = content.split('\n');
  let inPackageSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    // Section header
    if (/^\[/.test(trimmed)) {
      inPackageSection = trimmed === '[package]';
      continue;
    }
    if (!inPackageSection) continue;
    // Match `field = "value"` or `field="value"`
    const m = trimmed.match(new RegExp(`^${field}\\s*=\\s*(.+)$`));
    if (m) {
      let value = m[1].trim();
      // Strip trailing comment
      value = value.replace(/\s*#.*$/, '').trim();
      // Strip surrounding quotes (double or single)
      const quoted = value.match(/^"((?:[^"\\]|\\.)*)"$/) || value.match(/^'((?:[^'\\]|\\.)*)'$/);
      if (quoted) return quoted[1];
      return value;
    }
  }
  return null;
}

/** Read Cargo.toml and extract per-slot content. Returns {} if no Cargo.toml. */
export function interrogateCargo(dir: string): ExtractedContext {
  const path = join(dir, 'Cargo.toml');
  if (!existsSync(path)) return {};

  let content: string;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    return {};
  }

  const description = readPackageField(content, 'description');
  if (description && isValidExtraction(description)) {
    return { project: { goal: description } };
  }

  return {};
}
