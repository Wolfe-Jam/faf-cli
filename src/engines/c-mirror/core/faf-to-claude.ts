/**
 * 🔗 FAF to CLAUDE.md Transformation
 * Core conversion: YAML (.faf) → Markdown (CLAUDE.md)
 *
 * This is THE transformation that makes Context-Mirroring work
 * Preserves structure AND readability - zero slippage
 *
 * Emits events at each step for broad broadcasting
 */

import * as YAML from 'yaml';
import { mirrorEvents } from './events/event-emitter';
import { MirrorEventType, createMirrorEvent, SyncProgressData } from './events/mirror-events';

/**
 * Convert .faf YAML content to CLAUDE.md Markdown format
 *
 * @param fafContent - Raw .faf file content (YAML)
 * @param projectPath - Project root path for event metadata
 * @returns Beautiful CLAUDE.md markdown content
 */
export async function fafToClaudeMd(fafContent: string, projectPath: string = process.cwd()): Promise<string> {
  const startTime = Date.now();

  // EMIT: Starting conversion
  mirrorEvents.emitMirrorEvent(
    createMirrorEvent(MirrorEventType.SYNC_START, {
      direction: 'faf-to-claude'
    }, { projectPath })
  );

  try {
    // Step 1: Parse YAML
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'parsing-yaml',
        progress: 10,
        message: 'Parsing .faf YAML structure...'
      } as SyncProgressData, { projectPath })
    );

    const fafData = YAML.parse(fafContent);

    // Step 2: Extract core data
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'extracting-data',
        progress: 30,
        message: 'Extracting project context...'
      } as SyncProgressData, { projectPath })
    );

    const projectName = fafData.project?.name || 'Project';
    const projectGoal = fafData.project?.goal;
    const stack = fafData.instant_context?.tech_stack || 'Unknown';
    const mainLanguage = fafData.instant_context?.main_language;
    const frameworks = fafData.instant_context?.frameworks;
    const whatBuilding = fafData.instant_context?.what_building;
    const contextQuality = fafData.context_quality?.overall_assessment || 'Good';
    const fafScore = fafData.faf_score;
    const aiScore = fafData.ai_score;
    const humanScore = fafData.human_score;

    // Step 3: Generate Markdown structure
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'generating-markdown',
        progress: 60,
        message: 'Generating human-readable markdown...'
      } as SyncProgressData, { projectPath })
    );

    let claudeMd = `# 🏎️ CLAUDE.md - ${projectName} Persistent Context & Intelligence\n\n`;

    // Project State Section
    claudeMd += `## PROJECT STATE: ${contextQuality.toUpperCase()} 🚀\n`;
    if (projectGoal) {
      claudeMd += `**Current Position:** ${projectGoal}\n`;
    }
    claudeMd += `**Tyre Compound:** ULTRASOFT C5 (Maximum Performance)\n\n`;
    claudeMd += `---\n\n`;

    // Core Context Section
    claudeMd += `## 🎨 CORE CONTEXT\n\n`;

    // Project Identity
    claudeMd += `### Project Identity\n`;
    claudeMd += `- **Name:** ${projectName}\n`;
    if (fafData.project?.description) {
      claudeMd += `- **Description:** ${fafData.project.description}\n`;
    }
    claudeMd += `- **Stack:** ${stack}\n`;
    claudeMd += `- **Quality:** F1-INSPIRED (Championship Performance)\n\n`;

    // Technical Architecture
    if (whatBuilding || mainLanguage || frameworks) {
      claudeMd += `### Technical Architecture\n`;
      if (whatBuilding) {
        claudeMd += `- **What Building:** ${whatBuilding}\n`;
      }
      if (mainLanguage) {
        claudeMd += `- **Main Language:** ${mainLanguage}\n`;
      }
      if (frameworks) {
        claudeMd += `- **Frameworks:** ${frameworks}\n`;
      }
      claudeMd += `\n`;
    }

    // Key Files (if present)
    if (fafData.key_files && Array.isArray(fafData.key_files) && fafData.key_files.length > 0) {
      claudeMd += `### 🔧 Key Files\n`;
      fafData.key_files.forEach((file: any, index: number) => {
        claudeMd += `${index + 1}. **${file.path}** - ${file.purpose || 'Core file'}\n`;
      });
      claudeMd += `\n`;
    }

    // AI Instructions (if present)
    if (fafData.ai?.instructions || fafData.ai?.priority_order) {
      claudeMd += `### 🤖 AI Instructions\n`;
      if (fafData.ai.instructions) {
        claudeMd += `${fafData.ai.instructions}\n\n`;
      }
      if (fafData.ai.priority_order && Array.isArray(fafData.ai.priority_order)) {
        claudeMd += `**Priority Order:**\n`;
        fafData.ai.priority_order.forEach((item: string) => {
          claudeMd += `- ${item}\n`;
        });
        claudeMd += `\n`;
      }
    }

    // Context Quality Status
    claudeMd += `### 📊 Context Quality Status\n`;
    claudeMd += `- **Overall Assessment:** ${contextQuality}\n`;
    if (fafScore) {
      claudeMd += `- **FAF Score:** ${fafScore}\n`;
    }
    if (aiScore !== undefined && humanScore !== undefined) {
      claudeMd += `- **AI|HUMAN Balance:** AI:${aiScore} | HUMAN:${humanScore}\n`;
    }
    claudeMd += `- **Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;

    // Step 4: Add Championship Footer
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_PROGRESS, {
        step: 'adding-footer',
        progress: 90,
        message: 'Adding championship footer...'
      } as SyncProgressData, { projectPath })
    );

    claudeMd += `---\n\n`;
    claudeMd += `**STATUS: BI-SYNC ACTIVE 🔗 - Synchronized with .faf context!**\n\n`;
    claudeMd += `*Last Sync: ${new Date().toISOString()}*\n`;
    claudeMd += `*Sync Engine: F1-Inspired Software Engineering*\n`;
    claudeMd += `*🏎️⚡️_championship_sync*\n`;

    // Step 5: Complete
    const duration = Date.now() - startTime;

    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_COMPLETE, {
        direction: 'faf-to-claude',
        success: true,
        filesChanged: ['CLAUDE.md']
      }, {
        projectPath,
        duration,
        score: aiScore !== undefined && humanScore !== undefined ? {
          ai: aiScore,
          human: humanScore,
          total: fafScore ? parseInt(fafScore) : aiScore + humanScore
        } : undefined
      })
    );

    return claudeMd;

  } catch (error) {
    // EMIT: Error
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.SYNC_ERROR, {
        direction: 'faf-to-claude',
        error: error instanceof Error ? error.message : String(error)
      }, { projectPath })
    );

    throw error;
  }
}
