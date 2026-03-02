/**
 * MEMORY.md Parser — Claude Code Auto-Memory Interop
 *
 * Bidirectional interoperability between FAF and Claude Code's
 * auto-memory system (~/.claude/projects/<id>/memory/MEMORY.md).
 *
 * Key difference from other targets: MEMORY.md lives OUTSIDE the
 * project root, has a 200-line auto-load ceiling, and must MERGE
 * (not overwrite) to preserve Claude's own notes.
 *
 * Path convention:
 *   ~/.claude/projects/<project-id>/memory/MEMORY.md
 *   project-id = absolute path with / replaced by -
 *   e.g. /Users/wolfejam/FAF/cli → -Users-wolfejam-FAF-cli
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Types
// ============================================================================

export interface MemoryMdSection {
  title: string;
  content: string;
}

export interface MemoryMdFile {
  fafSection: string | null;     // Our managed section
  claudeNotes: string;           // Everything else (Claude's own notes)
  totalLines: number;
}

export interface MemoryImportResult {
  success: boolean;
  warnings: string[];
  harvested: {
    patterns: string[];
    conventions: string[];
    keyFiles: string[];
    notes: string[];
  };
}

export interface MemoryExportResult {
  success: boolean;
  filePath: string;
  linesWritten: number;
  warnings: string[];
  merged: boolean;
}

// ============================================================================
// Path Resolution
// ============================================================================

/**
 * Compute Claude Code project ID from an absolute path.
 * Convention: /Users/wolfejam/FAF/cli → -Users-wolfejam-FAF-cli
 */
export function computeProjectId(projectPath: string): string {
  // Normalize: resolve to absolute, remove trailing slash
  const normalized = path.resolve(projectPath).replace(/\/+$/, '');
  // Replace all / with -
  return normalized.replace(/\//g, '-');
}

/**
 * Get the git repository root for a directory.
 * Returns null if not in a git repo.
 */
export function getGitRoot(cwd?: string): string | null {
  try {
    const root = execSync('git rev-parse --show-toplevel', {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return root;
  } catch {
    return null;
  }
}

/**
 * Resolve the memory directory for a project.
 * → ~/.claude/projects/-Users-wolfejam-FAF-cli/memory/
 */
export function resolveMemoryDir(projectPath: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
  const projectId = computeProjectId(projectPath);
  return path.join(configDir, 'projects', projectId, 'memory');
}

/**
 * Resolve the full MEMORY.md path for a project.
 * → ~/.claude/projects/-Users-wolfejam-FAF-cli/memory/MEMORY.md
 */
export function resolveMemoryPath(projectPath: string): string {
  return path.join(resolveMemoryDir(projectPath), 'MEMORY.md');
}

// ============================================================================
// Section Markers
// ============================================================================

const FAF_SECTION_START = '# Project Context (from project.faf)';
const FAF_SECTION_END = '*This section is managed by tri-sync.';

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse MEMORY.md into our section and Claude's notes.
 */
export function parseMemoryMd(content: string): MemoryMdFile {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  const startIdx = normalized.indexOf(FAF_SECTION_START);
  const endIdx = normalized.indexOf(FAF_SECTION_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Find the end of our section (after the end marker line)
    const endLineIdx = normalized.indexOf('\n', endIdx);
    const endOfSection = endLineIdx !== -1 ? endLineIdx + 1 : normalized.length;

    const fafSection = normalized.substring(startIdx, endOfSection);
    const before = normalized.substring(0, startIdx);
    const after = normalized.substring(endOfSection);
    const claudeNotes = (before + after).trim();

    return {
      fafSection,
      claudeNotes,
      totalLines: lines.length,
    };
  }

  return {
    fafSection: null,
    claudeNotes: normalized.trim(),
    totalLines: lines.length,
  };
}

// ============================================================================
// Export: FAF → MEMORY.md
// ============================================================================

/**
 * Generate the FAF section content from parsed .faf data.
 * Kept deliberately concise — aims for 30-60 lines to leave room for Claude's notes.
 */
function generateFafSection(fafData: any): string {
  const lines: string[] = [];

  lines.push(FAF_SECTION_START);
  lines.push('');

  // Quick Reference
  const projectName = fafData.project?.name || fafData.name || 'Unknown';
  const projectGoal = fafData.project?.goal || fafData.project?.description || fafData.ai_tldr?.project || '';
  const projectType = fafData.project?.type || '';
  const techStack = fafData.instant_context?.tech_stack || fafData.ai_tldr?.stack || '';
  const mainLang = fafData.instant_context?.main_language || fafData.project?.main_language || '';

  lines.push('## Quick Reference');
  lines.push(`- **Name:** ${projectName}`);
  if (projectGoal) { lines.push(`- **Goal:** ${projectGoal}`); }
  if (projectType) { lines.push(`- **App Type:** ${projectType}`); }
  if (techStack) { lines.push(`- **Stack:** ${techStack}`); }
  if (mainLang) { lines.push(`- **Main Language:** ${mainLang}`); }
  lines.push('');

  // Tech Stack details
  const stack = fafData.stack || {};
  const hasStack = stack.frontend || stack.backend || stack.build || stack.runtime;
  if (hasStack) {
    lines.push('## Tech Stack');
    if (stack.frontend) { lines.push(`- Frontend: ${stack.frontend}`); }
    if (stack.backend) { lines.push(`- Backend: ${stack.backend}`); }
    if (stack.build) { lines.push(`- Build: ${stack.build}`); }
    if (stack.runtime) { lines.push(`- Runtime: ${stack.runtime}`); }
    if (stack.package_manager) { lines.push(`- Package Manager: ${stack.package_manager}`); }
    if (stack.database && stack.database !== 'None') { lines.push(`- Database: ${stack.database}`); }
    lines.push('');
  }

  // Architecture / what building
  const whatBuilding = fafData.instant_context?.what_building || fafData.human_context?.what || '';
  const architecture = fafData.project?.architecture || [];
  if (whatBuilding || architecture.length > 0) {
    lines.push('## Key Architecture');
    if (whatBuilding) { lines.push(`- ${whatBuilding}`); }
    for (const item of architecture) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Conventions (from warnings + preferences)
  const warnings = fafData.ai_instructions?.warnings || [];
  const codingStyle = fafData.project?.codingStyle || [];
  const preferences = fafData.preferences || {};
  const conventionItems: string[] = [...warnings, ...codingStyle];
  if (preferences.quality_bar) { conventionItems.push(`Quality bar: ${preferences.quality_bar}`); }
  if (preferences.testing) { conventionItems.push(`Testing: ${preferences.testing}`); }
  if (preferences.commit_style) { conventionItems.push(`Commit style: ${preferences.commit_style}`); }

  if (conventionItems.length > 0) {
    lines.push('## Conventions');
    for (const item of conventionItems) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Build Commands
  const howContext = fafData.human_context?.how || '';
  const buildCommands = fafData.project?.buildCommands || [];
  if (howContext || buildCommands.length > 0) {
    lines.push('## Build Commands');
    if (howContext) { lines.push(`- ${howContext}`); }
    for (const cmd of buildCommands) {
      lines.push(`- ${cmd}`);
    }
    lines.push('');
  }

  // Key Files
  const keyFiles = fafData.instant_context?.key_files || fafData.key_files || [];
  if (keyFiles.length > 0) {
    lines.push('## Key Files');
    for (const file of keyFiles) {
      if (typeof file === 'string') {
        lines.push(`- ${file}`);
      } else if (file.path) {
        lines.push(`- ${file.path}${file.purpose ? ` — ${file.purpose}` : ''}`);
      }
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Seeded from project.faf by faf-cli tri-sync — ${new Date().toISOString().split('T')[0]}*`);
  lines.push(`${FAF_SECTION_END} Claude's own notes below are preserved.*`);

  return lines.join('\n');
}

/**
 * Export .faf data to MEMORY.md.
 * Merge mode (default): replace only our section, preserve Claude's notes.
 * Force mode: overwrite entire file.
 */
export async function memoryExport(
  fafContent: any,
  outputPath: string,
  options?: { merge?: boolean }
): Promise<MemoryExportResult> {
  const warnings: string[] = [];
  const fafSection = generateFafSection(fafContent);
  const fafLines = fafSection.split('\n').length;

  if (fafLines > 80) {
    warnings.push(`FAF section is ${fafLines} lines — consider trimming to leave room for Claude's notes (200 line ceiling)`);
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  if (options?.merge !== false) {
    // Merge mode (default)
    try {
      const raw = await fs.readFile(outputPath, 'utf-8');
      // Normalize CRLF/CR to LF before string surgery (matches parseMemoryMd behavior)
      const existing = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const parsed = parseMemoryMd(existing);

      let merged: string;
      if (parsed.fafSection !== null) {
        // Replace our section, preserve Claude's notes
        const startIdx = existing.indexOf(FAF_SECTION_START);
        const endIdx = existing.indexOf(FAF_SECTION_END);
        const endLineIdx = existing.indexOf('\n', endIdx);
        const endOfSection = endLineIdx !== -1 ? endLineIdx + 1 : existing.length;

        const before = existing.substring(0, startIdx);
        const after = existing.substring(endOfSection);
        merged = `${before}${fafSection}\n${after}`;
      } else {
        // Our section doesn't exist yet — prepend it
        merged = `${fafSection}\n\n${existing}`;
      }

      const totalLines = merged.split('\n').length;
      if (totalLines > 200) {
        warnings.push(`Total MEMORY.md is ${totalLines} lines — exceeds 200-line auto-load ceiling. Lines 201+ will be silently truncated by Claude Code.`);
      }

      await fs.writeFile(outputPath, merged);
      return { success: true, filePath: outputPath, linesWritten: totalLines, warnings, merged: true };
    } catch {
      // File doesn't exist — write fresh
      await fs.writeFile(outputPath, `${fafSection}\n`);
      return { success: true, filePath: outputPath, linesWritten: fafLines, warnings, merged: false };
    }
  } else {
    // Force mode — overwrite entirely
    await fs.writeFile(outputPath, `${fafSection}\n`);
    return { success: true, filePath: outputPath, linesWritten: fafLines, warnings, merged: false };
  }
}

// ============================================================================
// Import: MEMORY.md → FAF (harvest)
// ============================================================================

/**
 * Import/harvest Claude's notes from MEMORY.md into structured data.
 * Conservative: only extracts clearly structured entries.
 */
export async function memoryImport(memoryPath: string): Promise<MemoryImportResult> {
  const warnings: string[] = [];
  const harvested = {
    patterns: [] as string[],
    conventions: [] as string[],
    keyFiles: [] as string[],
    notes: [] as string[],
  };

  try {
    await fs.access(memoryPath);
  } catch {
    return {
      success: false,
      warnings: [`MEMORY.md not found: ${memoryPath}`],
      harvested,
    };
  }

  const content = await fs.readFile(memoryPath, 'utf-8');
  const parsed = parseMemoryMd(content);

  if (!parsed.claudeNotes || parsed.claudeNotes.trim().length === 0) {
    warnings.push('No Claude notes found to harvest');
    return { success: true, warnings, harvested };
  }

  // Parse Claude's notes section by section
  const lines = parsed.claudeNotes.split('\n');
  let currentSection = '';

  for (const line of lines) {
    // Track H2 sections
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      currentSection = h2Match[1].trim().toLowerCase();
      continue;
    }

    // Extract bullet points
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();

      if (currentSection.includes('pattern') || currentSection.includes('convention')) {
        harvested.patterns.push(item);
      } else if (currentSection.includes('file') || currentSection.includes('path')) {
        harvested.keyFiles.push(item);
      } else if (currentSection.includes('style') || currentSection.includes('rule')) {
        harvested.conventions.push(item);
      } else {
        harvested.notes.push(item);
      }
    }
  }

  const totalHarvested =
    harvested.patterns.length +
    harvested.conventions.length +
    harvested.keyFiles.length +
    harvested.notes.length;

  if (totalHarvested === 0) {
    warnings.push('No structured entries found to harvest (Claude notes may be free-form prose)');
  }

  return { success: true, warnings, harvested };
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Detect MEMORY.md at Claude's expected path for this project.
 * Returns the path if found, null otherwise.
 */
export async function detectMemoryMd(projectPath: string): Promise<string | null> {
  const memoryPath = resolveMemoryPath(projectPath);
  try {
    await fs.access(memoryPath);
    return memoryPath;
  } catch {
    return null;
  }
}

/**
 * Get memory status for display.
 */
export async function getMemoryStatus(projectPath: string): Promise<{
  exists: boolean;
  path: string;
  totalLines: number;
  fafSectionLines: number;
  claudeNotesLines: number;
  hasFafSection: boolean;
}> {
  const memoryPath = resolveMemoryPath(projectPath);
  const status = {
    exists: false,
    path: memoryPath,
    totalLines: 0,
    fafSectionLines: 0,
    claudeNotesLines: 0,
    hasFafSection: false,
  };

  try {
    const content = await fs.readFile(memoryPath, 'utf-8');
    const parsed = parseMemoryMd(content);
    status.exists = true;
    status.totalLines = parsed.totalLines;
    status.hasFafSection = parsed.fafSection !== null;
    status.fafSectionLines = parsed.fafSection ? parsed.fafSection.split('\n').length : 0;
    status.claudeNotesLines = parsed.claudeNotes ? parsed.claudeNotes.split('\n').filter((l: string) => l.trim()).length : 0;
  } catch {
    // File doesn't exist
  }

  return status;
}
