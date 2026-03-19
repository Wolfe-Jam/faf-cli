/**
 * Memory Topic Writer — Claude Code Auto-Memory Topic File Generator
 *
 * Creates individual memory topic files with proper frontmatter
 * that Claude Code's auto-memory system can read and recall.
 *
 * Convention:
 *   Files prefixed with `faf_` to avoid collisions with Claude's own memories.
 *   Each file has YAML frontmatter: name, description, type.
 *   MEMORY.md index updated with pointers to these files.
 *
 * Memory types (per Claude Code spec):
 *   - project: goals, decisions, status, team
 *   - feedback: guidance on approach (quality bar, coding rules)
 *   - reference: tech stack, key files, external pointers
 *   - user: who the developer is, their role
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface MemoryTopicFile {
  fileName: string;
  name: string;
  description: string;
  type: 'project' | 'feedback' | 'reference' | 'user';
  content: string;
  keywords: string;
}

export interface TopicWriteResult {
  success: boolean;
  filesWritten: string[];
  indexUpdated: boolean;
  warnings: string[];
}

// ============================================================================
// .faf → Memory Topic Mapper
// ============================================================================

/**
 * Map .faf data to Claude Code memory topic files.
 * Only creates files for sections that have meaningful data.
 */
export function mapFafToTopics(fafData: any): MemoryTopicFile[] {
  const topics: MemoryTopicFile[] = [];

  // 1. Project identity
  const project = fafData.project || {};
  if (project.name || project.goal) {
    const lines: string[] = [];
    if (project.name) {lines.push(`**${project.name}**`);}
    if (project.goal) {lines.push(`${project.goal}`);}
    if (project.type) {lines.push(`App type: ${project.type}`);}
    if (project.main_language) {lines.push(`Main language: ${project.main_language}`);}

    const version = fafData.state?.version || project.version;
    if (version) {lines.push(`Version: ${version}`);}

    lines.push('');
    lines.push('**Why:** Seeded from project.faf by tri-sync');
    lines.push('**How to apply:** Core project identity — use when scoping work or generating context');

    topics.push({
      fileName: 'faf_project.md',
      name: `${project.name || 'Project'} — Identity`,
      description: `Project name, goal, type, language from .faf${project.type ? ` (${project.type})` : ''}`,
      type: 'project',
      content: lines.join('\n'),
      keywords: [project.name, project.type, project.main_language, 'identity', 'goal'].filter(Boolean).join(', '),
    });
  }

  // 2. Tech stack
  const stack = fafData.stack || {};
  const stackEntries = Object.entries(stack).filter(
    ([_, v]) => v && v !== 'None' && v !== 'Unknown' && v !== 'N/A' && v !== 'slotignored'
  );
  if (stackEntries.length > 0) {
    // Canonical display names for slot fields
    const DISPLAY_NAMES: Record<string, string> = {
      framework: 'Frontend', frontend: 'Frontend',
      css: 'CSS Framework', css_framework: 'CSS Framework',
      ui_library: 'UI Library',
      state: 'State Management', state_management: 'State Management',
      backend: 'Backend',
      runtime: 'Runtime',
      db: 'Database', database: 'Database',
      build: 'Build Tool',
      pkg_manager: 'Package Manager', package_manager: 'Package Manager',
      api: 'API Type', api_type: 'API Type',
      hosting: 'Hosting',
      cicd: 'CI/CD',
      connection: 'Connection',
    };

    // Deduplicate: prefer Mk4 name over old alias
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const [key, value] of stackEntries) {
      const display = DISPLAY_NAMES[key] || key;
      if (seen.has(display)) {continue;}
      seen.add(display);
      lines.push(`- **${display}:** ${value}`);
    }

    lines.push('');
    lines.push('**Why:** Seeded from project.faf stack section');
    lines.push('**How to apply:** Reference when writing code, choosing dependencies, or configuring builds');

    const stackKeywords = stackEntries
      .map(([_, v]) => String(v))
      .filter(v => v.length < 30)
      .join(', ');

    topics.push({
      fileName: 'faf_stack.md',
      name: `${project.name || 'Project'} — Tech Stack`,
      description: `Technical stack from .faf — ${stackEntries.length} components`,
      type: 'reference',
      content: lines.join('\n'),
      keywords: stackKeywords,
    });
  }

  // 3. Human context (6 W's)
  const human = fafData.human_context || fafData.context || {};
  const humanEntries = Object.entries(human).filter(
    ([_, v]) => v && v !== 'Not specified' && v !== 'None'
  );
  if (humanEntries.length > 0) {
    const W_LABELS: Record<string, string> = {
      who: 'Who', what: 'What', why: 'Why',
      where: 'Where', when: 'When', how: 'How',
    };

    const lines: string[] = [];
    for (const [key, value] of humanEntries) {
      const label = W_LABELS[key] || key;
      lines.push(`- **${label}:** ${value}`);
    }

    lines.push('');
    lines.push('**Why:** Human context from .faf — the story behind the code');
    lines.push('**How to apply:** Understand intent and audience when making design decisions');

    topics.push({
      fileName: 'faf_context.md',
      name: `${project.name || 'Project'} — Human Context`,
      description: `Who/what/why/where/when/how from .faf (${humanEntries.length} of 6 filled)`,
      type: 'project',
      content: lines.join('\n'),
      keywords: humanEntries.map(([k]) => k).join(', '),
    });
  }

  // 4. Preferences & AI instructions → feedback memory
  const prefs = fafData.preferences || {};
  const instructions = fafData.ai_instructions || {};
  const warnings = instructions.warnings || [];
  const prefEntries = Object.entries(prefs).filter(([_, v]) => v);

  if (prefEntries.length > 0 || warnings.length > 0) {
    const lines: string[] = [];

    if (prefEntries.length > 0) {
      for (const [key, value] of prefEntries) {
        lines.push(`- **${key.replace(/_/g, ' ')}:** ${value}`);
      }
    }

    if (warnings.length > 0) {
      if (lines.length > 0) {lines.push('');}
      lines.push('Rules:');
      for (const w of warnings) {
        lines.push(`- ${w}`);
      }
    }

    if (instructions.priority) {
      lines.push('');
      lines.push(`Priority: ${instructions.priority}`);
    }

    lines.push('');
    lines.push('**Why:** Coding preferences from .faf — how the team wants to work');
    lines.push('**How to apply:** Follow these rules when writing or reviewing code');

    topics.push({
      fileName: 'faf_preferences.md',
      name: `${project.name || 'Project'} — Preferences`,
      description: 'Quality bar, coding rules, and AI instructions from .faf',
      type: 'feedback',
      content: lines.join('\n'),
      keywords: 'quality, testing, style, rules, preferences',
    });
  }

  // 5. Key files
  const keyFiles = fafData.instant_context?.key_files || fafData.key_files || fafData.files || [];
  if (keyFiles.length > 0) {
    const lines: string[] = [];
    for (const file of keyFiles) {
      if (typeof file === 'string') {
        lines.push(`- \`${file}\``);
      } else if (file.path) {
        lines.push(`- \`${file.path}\`${file.purpose ? ` — ${file.purpose}` : ''}`);
      }
    }

    lines.push('');
    lines.push('**Why:** Key files from .faf — starting points for navigation');
    lines.push('**How to apply:** Check these files first when exploring or debugging');

    topics.push({
      fileName: 'faf_key_files.md',
      name: `${project.name || 'Project'} — Key Files`,
      description: `${keyFiles.length} key files from .faf for navigation`,
      type: 'reference',
      content: lines.join('\n'),
      keywords: 'files, paths, entry points',
    });
  }

  // 6. State / phase (if present)
  const state = fafData.state || {};
  if (state.phase || state.focus || state.status) {
    const lines: string[] = [];
    if (state.phase) {lines.push(`- **Phase:** ${state.phase}`);}
    if (state.focus) {lines.push(`- **Focus:** ${state.focus}`);}
    if (state.status) {lines.push(`- **Status:** ${state.status}`);}
    if (state.version) {lines.push(`- **Version:** ${state.version}`);}

    lines.push('');
    lines.push('**Why:** Current project state from .faf');
    lines.push('**How to apply:** Understand where the project is in its lifecycle before suggesting changes');

    topics.push({
      fileName: 'faf_state.md',
      name: `${project.name || 'Project'} — Current State`,
      description: 'Project phase, focus, and status from .faf',
      type: 'project',
      content: lines.join('\n'),
      keywords: 'phase, status, focus, roadmap',
    });
  }

  return topics;
}

// ============================================================================
// Topic File Writer
// ============================================================================

/**
 * Format a topic file with proper frontmatter.
 */
export function formatTopicFile(topic: MemoryTopicFile): string {
  return [
    '---',
    `name: ${topic.name}`,
    `description: ${topic.description}`,
    `type: ${topic.type}`,
    '---',
    '',
    topic.content,
    '',
  ].join('\n');
}

/**
 * Write topic files to the memory directory and update MEMORY.md index.
 */
export async function writeTopicFiles(
  topics: MemoryTopicFile[],
  memoryDir: string,
  options?: { preserveExisting?: boolean }
): Promise<TopicWriteResult> {
  const warnings: string[] = [];
  const filesWritten: string[] = [];

  // Ensure directory exists
  await fs.mkdir(memoryDir, { recursive: true });

  // Write each topic file
  for (const topic of topics) {
    const filePath = path.join(memoryDir, topic.fileName);

    if (options?.preserveExisting) {
      try {
        await fs.access(filePath);
        // File exists — skip
        warnings.push(`Skipped existing: ${topic.fileName}`);
        continue;
      } catch {
        // File doesn't exist — write it
      }
    }

    const content = formatTopicFile(topic);
    await fs.writeFile(filePath, content);
    filesWritten.push(topic.fileName);
  }

  // Update MEMORY.md index
  const indexPath = path.join(memoryDir, 'MEMORY.md');
  const indexUpdated = await updateMemoryIndex(indexPath, topics);

  return {
    success: true,
    filesWritten,
    indexUpdated,
    warnings,
  };
}

// ============================================================================
// MEMORY.md Index Management
// ============================================================================

const FAF_INDEX_START = '## FAF Context (tri-sync)';
const FAF_INDEX_END = '<!-- end faf tri-sync -->';

/**
 * Update the MEMORY.md index with pointers to FAF topic files.
 * Preserves all non-FAF entries in the index.
 */
async function updateMemoryIndex(indexPath: string, topics: MemoryTopicFile[]): Promise<boolean> {
  let existing = '';
  try {
    existing = await fs.readFile(indexPath, 'utf-8');
    existing = existing.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  } catch {
    // File doesn't exist — will create
  }

  // Build FAF section for the index
  const fafLines: string[] = [];
  fafLines.push('');
  fafLines.push(FAF_INDEX_START);
  fafLines.push('');
  fafLines.push('| File | Keywords |');
  fafLines.push('|------|----------|');
  for (const topic of topics) {
    fafLines.push(`| \`${topic.fileName}\` | ${topic.keywords} |`);
  }
  fafLines.push('');
  fafLines.push(FAF_INDEX_END);

  const fafSection = fafLines.join('\n');

  if (existing) {
    // Check if FAF section already exists
    const startIdx = existing.indexOf(FAF_INDEX_START);
    const endIdx = existing.indexOf(FAF_INDEX_END);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing FAF section
      const endOfSection = existing.indexOf('\n', endIdx);
      const endPos = endOfSection !== -1 ? endOfSection + 1 : existing.length;

      // Find the blank line before FAF_INDEX_START
      let sectionStart = startIdx;
      if (sectionStart > 0 && existing[sectionStart - 1] === '\n') {
        sectionStart--;
      }

      const before = existing.substring(0, sectionStart);
      const after = existing.substring(endPos);
      const updated = before + fafSection + after;
      await fs.writeFile(indexPath, updated);
    } else {
      // Append FAF section to end
      const updated = `${existing.trimEnd()  }\n${  fafSection  }\n`;
      await fs.writeFile(indexPath, updated);
    }
  } else {
    // Create new index
    const newIndex = [
      '# Claude Code Memory — Index',
      '',
      '> Topic files in this directory have full details. This index has keywords + pointers.',
      fafSection,
      '',
    ].join('\n');
    await fs.writeFile(indexPath, newIndex);
  }

  return true;
}

// ============================================================================
// Topic File Reader (for import/reverse sync)
// ============================================================================

/**
 * Read all faf_ topic files from a memory directory.
 * Returns parsed topic data for reverse sync into .faf.
 */
export async function readTopicFiles(memoryDir: string): Promise<MemoryTopicFile[]> {
  const topics: MemoryTopicFile[] = [];

  try {
    const files = await fs.readdir(memoryDir);
    const fafFiles = files.filter(f => f.startsWith('faf_') && f.endsWith('.md'));

    for (const fileName of fafFiles) {
      const filePath = path.join(memoryDir, fileName);
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = parseTopicFrontmatter(raw);

      if (parsed) {
        topics.push({
          fileName,
          name: parsed.name,
          description: parsed.description,
          type: parsed.type as 'project' | 'feedback' | 'reference' | 'user',
          content: parsed.content,
          keywords: parsed.description,
        });
      }
    }
  } catch {
    // Directory doesn't exist or is empty
  }

  return topics;
}

/**
 * Parse frontmatter from a topic file.
 */
function parseTopicFrontmatter(raw: string): {
  name: string;
  description: string;
  type: string;
  content: string;
} | null {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {return null;}

  const endIdx = normalized.indexOf('\n---\n', 4);
  if (endIdx === -1) {return null;}

  const frontmatter = normalized.substring(4, endIdx);
  const content = normalized.substring(endIdx + 5).trim();

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const typeMatch = frontmatter.match(/^type:\s*(.+)$/m);

  if (!nameMatch || !typeMatch) {return null;}

  return {
    name: nameMatch[1].trim(),
    description: descMatch ? descMatch[1].trim() : '',
    type: typeMatch[1].trim(),
    content,
  };
}
