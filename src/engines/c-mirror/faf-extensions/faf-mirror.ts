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

export class FAFMirror {
  private engine: MirrorEngine;
  private projectPath: string;
  private displayStarted: boolean = false;

  constructor(projectPath: string = process.cwd(), options: Partial<IMirrorConfig> = {}) {
    this.projectPath = projectPath;

    // FAF defaults
    const config: IMirrorConfig = {
      structuredFile: path.join(projectPath, '.faf'),
      readableFile: path.join(projectPath, 'CLAUDE.md'),
      projectPath,
      atomicWrites: true,        // Always use safe writes
      selfHealing: true,          // Always auto-recover
      dnaChain: {
        enabled: true,            // DNA logging
        path: path.join(projectPath, '.faf-dna.json'),
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
