/**
 * 🔗 CLAUDE.md to FAF Transformation
 * Reverse conversion: Markdown (CLAUDE.md) → YAML (.faf)
 *
 * This is THE reverse transformation for true bidirectional mirroring
 * Intelligently merges human edits back into .faf structure
 *
 * Key principle: CLAUDE.md edits to human context flow back into .faf
 * .faf technical fields are preserved (never overwritten)
 *
 * Emits events at each step for broad broadcasting
 */

import * as YAML from 'yaml';
import { mirrorEvents } from './events/event-emitter';
import { MirrorEventType, createMirrorEvent, SyncProgressData } from './events/mirror-events';

/**
 * Convert CLAUDE.md Markdown content back to .faf YAML format
 *
 * Strategy:
 * - Parse CLAUDE.md for human-edited context
 * - Merge into existing .faf structure
 * - Preserve .faf technical fields (scoring, DNA, etc.)
 * - Update human_context section with CLAUDE.md changes
 *
 * @param claudeContent - Raw CLAUDE.md content (Markdown)
 * @param existingFafData - Existing .faf parsed data (to merge into)
 * @param projectPath - Project root path for event metadata
 * @returns Updated .faf YAML content
 */
export async function claudeMdToFaf(
  claudeContent: string,
  existingFafData: any,
  projectPath: string = process.cwd()
): Promise<string> {
  const startTime = Date.now();

  // EMIT: Starting conversion
  mirrorEvents.emitMirrorEvent(
    createMirrorEvent(MirrorEventType.SYNC_START, {
      direction: 'claude-to-faf'
    }, { projectPath })
  );

  try {
    // Step 1: Parse Markdown
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'parsing-markdown',
        progress: 10,
        message: 'Parsing CLAUDE.md content...'
      } as SyncProgressData, { projectPath })
    );

    const extracted = extractFromClaudeMd(claudeContent);

    // Step 2: Merge into existing .faf
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'merging-data',
        progress: 40,
        message: 'Merging human context updates...'
      } as SyncProgressData, { projectPath })
    );

    // Create updated .faf data (preserve existing, merge new)
    const updatedFaf = { ...existingFafData };

    // Update project section (if changed in CLAUDE.md)
    if (extracted.projectName && extracted.projectName !== existingFafData.project?.name) {
      if (!updatedFaf.project) updatedFaf.project = {};
      updatedFaf.project.name = extracted.projectName;
    }

    if (extracted.projectGoal) {
      if (!updatedFaf.project) updatedFaf.project = {};
      updatedFaf.project.goal = extracted.projectGoal;
    }

    if (extracted.projectDescription) {
      if (!updatedFaf.project) updatedFaf.project = {};
      updatedFaf.project.description = extracted.projectDescription;
    }

    // Update instant_context (if changed)
    if (extracted.techStack) {
      if (!updatedFaf.instant_context) updatedFaf.instant_context = {};
      updatedFaf.instant_context.tech_stack = extracted.techStack;
    }

    if (extracted.mainLanguage) {
      if (!updatedFaf.instant_context) updatedFaf.instant_context = {};
      updatedFaf.instant_context.main_language = extracted.mainLanguage;
    }

    if (extracted.whatBuilding) {
      if (!updatedFaf.instant_context) updatedFaf.instant_context = {};
      updatedFaf.instant_context.what_building = extracted.whatBuilding;
    }

    // Update key_files (if present)
    if (extracted.keyFiles && extracted.keyFiles.length > 0) {
      updatedFaf.key_files = extracted.keyFiles;
    }

    // Step 3: Update metadata
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'updating-metadata',
        progress: 70,
        message: 'Updating sync metadata...'
      } as SyncProgressData, { projectPath })
    );

    // Add/update metadata section
    if (!updatedFaf.metadata) {
      updatedFaf.metadata = {};
    }

    updatedFaf.metadata.last_claude_sync = new Date().toISOString();
    updatedFaf.metadata.bi_sync = 'active';

    // Step 4: Generate YAML
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'generating-yaml',
        progress: 90,
        message: 'Generating .faf YAML...'
      } as SyncProgressData, { projectPath })
    );

    const yamlContent = YAML.stringify(updatedFaf, {
      indent: 2,
      lineWidth: 0, // No line wrapping
      minContentWidth: 0
    });

    // Step 5: Complete
    const duration = Date.now() - startTime;

    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_COMPLETE, {
        direction: 'claude-to-faf',
        success: true,
        filesChanged: ['.faf']
      }, {
        projectPath,
        duration,
        score: updatedFaf.ai_score !== undefined && updatedFaf.human_score !== undefined ? {
          ai: updatedFaf.ai_score,
          human: updatedFaf.human_score,
          total: updatedFaf.faf_score ? parseInt(updatedFaf.faf_score) : updatedFaf.ai_score + updatedFaf.human_score
        } : undefined
      })
    );

    return yamlContent;

  } catch (error) {
    // EMIT: Error
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_ERROR, {
        direction: 'claude-to-faf',
        error: error instanceof Error ? error.message : String(error)
      }, { projectPath })
    );

    throw error;
  }
}

/**
 * Extract structured data from CLAUDE.md markdown
 *
 * This is a simple parser - can be enhanced later for more sophisticated parsing
 */
function extractFromClaudeMd(content: string): {
  projectName?: string;
  projectGoal?: string;
  projectDescription?: string;
  techStack?: string;
  mainLanguage?: string;
  whatBuilding?: string;
  keyFiles?: Array<{ path: string; purpose: string }>;
} {
  const extracted: any = {};

  // Extract project name from title
  const titleMatch = content.match(/# 🏎️ CLAUDE\.md - (.+?) Persistent Context/);
  if (titleMatch) {
    extracted.projectName = titleMatch[1].trim();
  }

  // Extract project goal
  const goalMatch = content.match(/\*\*Current Position:\*\* (.+)/);
  if (goalMatch) {
    extracted.projectGoal = goalMatch[1].trim();
  }

  // Extract description
  const descMatch = content.match(/- \*\*Description:\*\* (.+)/);
  if (descMatch) {
    extracted.projectDescription = descMatch[1].trim();
  }

  // Extract stack
  const stackMatch = content.match(/- \*\*Stack:\*\* (.+)/);
  if (stackMatch) {
    extracted.techStack = stackMatch[1].trim();
  }

  // Extract main language
  const langMatch = content.match(/- \*\*Main Language:\*\* (.+)/);
  if (langMatch) {
    extracted.mainLanguage = langMatch[1].trim();
  }

  // Extract what building
  const buildingMatch = content.match(/- \*\*What Building:\*\* (.+)/);
  if (buildingMatch) {
    extracted.whatBuilding = buildingMatch[1].trim();
  }

  // Extract key files (simple pattern - can be enhanced)
  const keyFilesMatch = content.match(/### 🔧 Key Files\n((?:.+\n?)+?)(?:\n###|\n\n|$)/);
  if (keyFilesMatch) {
    const filesText = keyFilesMatch[1];
    const fileMatches = filesText.matchAll(/\d+\. \*\*(.+?)\*\* - (.+)/g);
    extracted.keyFiles = Array.from(fileMatches).map(match => ({
      path: match[1].trim(),
      purpose: match[2].trim()
    }));
  }

  return extracted;
}
