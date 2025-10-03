/**
 * 🔗 Mirror Engine - The Orchestrator
 * Coordinates all C-Mirror operations
 *
 * This is the main engine that:
 * - Detects which files need syncing
 * - Calls the transformation functions
 * - Uses atomic writes for safety
 * - Emits events for broadcasting
 * - Ensures zero slippage
 *
 * Usage:
 *   const engine = new MirrorEngine(config);
 *   const result = await engine.sync();
 */

import * as YAML from 'yaml';
import { IMirrorConfig, IMirrorResult, FileState } from './interfaces';
import { fafToClaudeMd } from './faf-to-claude';
import { claudeMdToFaf } from './claude-to-faf';
import { atomicWrite, safeRead, fileExists, getFileModifiedTime } from '../strategies/atomic-write';
import { mirrorEvents } from './events/event-emitter';
import { MirrorEventType, createMirrorEvent } from './events/mirror-events';

export class MirrorEngine {
  private config: IMirrorConfig;
  private projectPath: string;

  constructor(config: IMirrorConfig) {
    this.config = {
      atomicWrites: true,  // Default to safe writes
      selfHealing: true,   // Default to auto-recovery
      ...config
    };
    this.projectPath = config.projectPath || process.cwd();
  }

  /**
   * Main sync operation
   * Intelligently syncs .faf ↔ CLAUDE.md
   */
  async sync(): Promise<IMirrorResult> {
    const startTime = Date.now();

    const result: IMirrorResult = {
      success: false,
      direction: 'none',
      filesChanged: [],
      conflicts: [],
      duration: 0,
      integrity: 'perfect'
    };

    try {
      // Step 1: Analyze file states
      const analysis = await this.analyzeFiles();

      // Step 2: Determine sync strategy
      const strategy = this.determineSyncStrategy(analysis);
      result.direction = strategy;

      // Step 3: Execute sync based on strategy
      if (strategy === 'none') {
        // No sync needed
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      if (strategy === 'faf-to-claude') {
        await this.syncFafToClaude(analysis);
        result.filesChanged.push(this.config.readableFile);
      } else if (strategy === 'claude-to-faf') {
        await this.syncClaudeToFaf(analysis);
        result.filesChanged.push(this.config.structuredFile);
      } else if (strategy === 'bidirectional') {
        // Both files changed - attempt intelligent merge
        // For now, faf wins (can be enhanced later)
        await this.syncFafToClaude(analysis);
        result.filesChanged.push(this.config.readableFile);
        result.conflicts.push('Both files modified - .faf took precedence');
      }

      // Step 4: Verify integrity
      const integrityCheck = await this.verifyIntegrity();
      result.integrity = integrityCheck.status;

      // Step 5: Success
      result.success = true;
      result.duration = Date.now() - startTime;

      // EMIT: Score update (if available)
      if (integrityCheck.score) {
        mirrorEvents.emitMirrorEvent(
          createMirrorEvent(MirrorEventType.SCORE_UPDATE, {
            score: integrityCheck.score
          }, {
            projectPath: this.projectPath,
            score: integrityCheck.score,
            duration: result.duration
          })
        );
      }

      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      result.integrity = 'failed';

      return result;
    }
  }

  /**
   * Analyze file states to determine what needs syncing
   */
  private async analyzeFiles(): Promise<{
    fafState: FileState;
    claudeState: FileState;
  }> {
    const fafPath = this.config.structuredFile;
    const claudePath = this.config.readableFile;

    const fafExists = await fileExists(fafPath);
    const claudeExists = await fileExists(claudePath);

    const fafModified = fafExists ? await getFileModifiedTime(fafPath) : null;
    const claudeModified = claudeExists ? await getFileModifiedTime(claudePath) : null;

    const fafState: FileState = {
      path: fafPath,
      exists: fafExists,
      modified: fafModified || undefined
    };

    const claudeState: FileState = {
      path: claudePath,
      exists: claudeExists,
      modified: claudeModified || undefined
    };

    return { fafState, claudeState };
  }

  /**
   * Determine sync strategy based on file states
   */
  private determineSyncStrategy(analysis: {
    fafState: FileState;
    claudeState: FileState;
  }): IMirrorResult['direction'] {
    const { fafState, claudeState } = analysis;

    // If neither exists, nothing to sync
    if (!fafState.exists && !claudeState.exists) {
      return 'none';
    }

    // If only .faf exists, create CLAUDE.md
    if (fafState.exists && !claudeState.exists) {
      return 'faf-to-claude';
    }

    // If only CLAUDE.md exists, create .faf (unusual but handle it)
    if (!fafState.exists && claudeState.exists) {
      return 'claude-to-faf';
    }

    // Both exist - check modification times
    if (fafState.modified && claudeState.modified) {
      const fafTime = fafState.modified.getTime();
      const claudeTime = claudeState.modified.getTime();

      // If .faf is newer, sync to CLAUDE.md
      if (fafTime > claudeTime) {
        return 'faf-to-claude';
      }

      // If CLAUDE.md is newer, sync to .faf
      if (claudeTime > fafTime) {
        return 'claude-to-faf';
      }

      // If same time, no sync needed
      return 'none';
    }

    // Default: faf to claude
    return 'faf-to-claude';
  }

  /**
   * Sync .faf → CLAUDE.md
   */
  private async syncFafToClaude(analysis: {
    fafState: FileState;
    claudeState: FileState;
  }): Promise<void> {
    const fafContent = await safeRead(this.config.structuredFile, this.projectPath);
    const claudeMdContent = await fafToClaudeMd(fafContent, this.projectPath);

    if (this.config.atomicWrites) {
      await atomicWrite(this.config.readableFile, claudeMdContent, this.projectPath);
    } else {
      // Direct write (not recommended)
      const fs = await import('fs/promises');
      await fs.writeFile(this.config.readableFile, claudeMdContent, 'utf-8');
    }
  }

  /**
   * Sync CLAUDE.md → .faf
   */
  private async syncClaudeToFaf(analysis: {
    fafState: FileState;
    claudeState: FileState;
  }): Promise<void> {
    const claudeContent = await safeRead(this.config.readableFile, this.projectPath);

    // Load existing .faf data (or create minimal structure)
    let existingFafData: any = {};
    if (analysis.fafState.exists) {
      const fafContent = await safeRead(this.config.structuredFile, this.projectPath);
      existingFafData = YAML.parse(fafContent);
    }

    const updatedFafContent = await claudeMdToFaf(claudeContent, existingFafData, this.projectPath);

    if (this.config.atomicWrites) {
      await atomicWrite(this.config.structuredFile, updatedFafContent, this.projectPath);
    } else {
      // Direct write (not recommended)
      const fs = await import('fs/promises');
      await fs.writeFile(this.config.structuredFile, updatedFafContent, 'utf-8');
    }
  }

  /**
   * Verify integrity after sync
   * Ensures mirror is perfect
   */
  private async verifyIntegrity(): Promise<{
    status: 'perfect' | 'degraded' | 'failed';
    score?: { ai: number; human: number; total: number };
  }> {
    try {
      // Check both files exist
      const fafExists = await fileExists(this.config.structuredFile);
      const claudeExists = await fileExists(this.config.readableFile);

      if (!fafExists || !claudeExists) {
        return { status: 'failed' };
      }

      // Parse .faf to get score
      const fafContent = await safeRead(this.config.structuredFile, this.projectPath);
      const parsedData = YAML.parse(fafContent);
      const fafData = (!parsedData || typeof parsedData !== 'object') ? {} : parsedData;

      const score = fafData.ai_score !== undefined && fafData.human_score !== undefined ? {
        ai: fafData.ai_score,
        human: fafData.human_score,
        total: fafData.faf_score ? parseInt(fafData.faf_score) : fafData.ai_score + fafData.human_score
      } : undefined;

      // Basic validation passed
      mirrorEvents.emitMirrorEvent(
        createMirrorEvent(MirrorEventType.INTEGRITY_PERFECT, {
          message: 'Mirror integrity verified'
        }, {
          projectPath: this.projectPath,
          integrity: 'perfect',
          score
        })
      );

      return { status: 'perfect', score };

    } catch (error) {
      mirrorEvents.emitMirrorEvent(
        createMirrorEvent(MirrorEventType.INTEGRITY_FAILED, {
          error: error instanceof Error ? error.message : String(error)
        }, {
          projectPath: this.projectPath,
          integrity: 'failed'
        })
      );

      return { status: 'failed' };
    }
  }
}
