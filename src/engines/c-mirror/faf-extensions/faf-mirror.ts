/**
 * 🩵 FAF Mirror - Convenience Wrapper
 * Simple FAF-specific interface for C-Mirror
 *
 * This wrapper:
 * - Uses FAF defaults (.faf and CLAUDE.md)
 * - Includes FAF-specific validators
 * - Integrates with FAF DNA chain
 * - Provides championship communication
 *
 * Usage:
 *   const mirror = new FAFMirror();
 *   await mirror.sync();
 */

import * as path from 'path';
import { MirrorEngine } from '../core/mirror-engine';
import { IMirrorConfig, IMirrorResult } from '../core/interfaces';
import { startTerminalDisplay, stopTerminalDisplay } from '../broadcast/terminal-display';
import { findFafFile } from '../../../utils/file-utils';

export class FAFMirror {
  private engine: MirrorEngine | null = null;
  private projectPath: string;
  private displayStarted: boolean = false;
  private initPromise: Promise<void>;

  constructor(projectPath: string = process.cwd(), options: Partial<IMirrorConfig> = {}) {
    this.projectPath = projectPath;

    // Initialize async to find correct .faf file
    this.initPromise = this.initialize(options);
  }

  private async initialize(options: Partial<IMirrorConfig> = {}): Promise<void> {
    // Find actual .faf file (project.faf preferred over .faf)
    const fafPath = await findFafFile(this.projectPath);
    const structuredFile = fafPath || path.join(this.projectPath, 'project.faf');

    // FAF defaults
    const config: IMirrorConfig = {
      structuredFile,
      readableFile: path.join(this.projectPath, 'CLAUDE.md'),
      projectPath: this.projectPath,
      atomicWrites: true,        // Always use safe writes
      selfHealing: true,          // Always auto-recover
      dnaChain: {
        enabled: true,            // DNA logging
        path: path.join(this.projectPath, '.faf-dna.json'),
        logLevel: 'standard'
      },
      ...options
    };

    this.engine = new MirrorEngine(config);
  }

  /**
   * Sync .faf ↔ CLAUDE.md
   * With championship terminal display
   */
  async sync(): Promise<IMirrorResult> {
    // Wait for initialization to complete
    await this.initPromise;

    if (!this.engine) {
      throw new Error('FAFMirror failed to initialize');
    }

    // Start terminal display (listens to events)
    if (!this.displayStarted) {
      startTerminalDisplay();
      this.displayStarted = true;
    }

    // Run the sync
    const result = await this.engine.sync();

    return result;
  }

  /**
   * Stop display (cleanup)
   */
  stop(): void {
    if (this.displayStarted) {
      stopTerminalDisplay();
      this.displayStarted = false;
    }
  }
}
