/**
 * ⚛️ Atomic File Writer
 * All-or-nothing file operations - Zero slippage guarantee
 *
 * Strategy:
 * 1. Write to .tmp file first
 * 2. Validate the write succeeded
 * 3. Atomic rename (OS-level guarantee)
 * 4. If ANY step fails, original file is untouched
 *
 * User NEVER sees partial state
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { mirrorEvents } from '../core/events/event-emitter';
import { MirrorEventType, createMirrorEvent } from '../core/events/mirror-events';

/**
 * Atomic file write
 * Guarantees all-or-nothing operation
 *
 * @param filePath - Target file path
 * @param content - Content to write
 * @param projectPath - Project root (for events)
 */
export async function atomicWrite(
  filePath: string,
  content: string,
  projectPath: string = process.cwd()
): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.backup`;

  try {
    // EMIT: Starting write
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.FILE_WRITE, {
        file: filePath,
        step: 'start'
      }, { projectPath })
    );

    // Step 1: Create backup of existing file (if exists)
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (fileExists) {
      await fs.copyFile(filePath, backupPath);

      mirrorEvents.emitMirrorEvent(
        createMirrorEvent(MirrorEventType.FILE_BACKUP, {
          original: filePath,
          backup: backupPath
        }, { projectPath })
      );
    }

    // Step 2: Write to temporary file
    await fs.writeFile(tmpPath, content, 'utf-8');

    // Step 3: Validate the temporary file
    const writtenContent = await fs.readFile(tmpPath, 'utf-8');
    if (writtenContent !== content) {
      throw new Error('File validation failed: written content does not match');
    }

    // Step 4: Atomic rename (OS-level guarantee)
    await fs.rename(tmpPath, filePath);

    // Step 5: Clean up backup
    if (fileExists) {
      await fs.unlink(backupPath).catch(() => {
        // Ignore backup cleanup errors
      });
    }

    // EMIT: Success
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.FILE_WRITE, {
        file: filePath,
        step: 'complete',
        success: true
      }, { projectPath })
    );

  } catch (error) {
    // Cleanup temporary file if it exists
    await fs.unlink(tmpPath).catch(() => {
      // Ignore cleanup errors
    });

    // Restore from backup if we have one
    const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
    if (backupExists) {
      await fs.rename(backupPath, filePath).catch(() => {
        // If restore fails, emit error but don't throw
        mirrorEvents.emitMirrorEvent(
          createMirrorEvent(MirrorEventType.ERROR, {
            message: 'Failed to restore backup',
            file: filePath
          }, { projectPath })
        );
      });
    }

    // EMIT: Error
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.ERROR, {
        message: error instanceof Error ? error.message : String(error),
        file: filePath,
        recoverable: backupExists
      }, { projectPath })
    );

    throw error;
  }
}

/**
 * Safe file read with error handling
 */
export async function safeRead(
  filePath: string,
  projectPath: string = process.cwd()
): Promise<string> {
  try {
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.FILE_READ, {
        file: filePath
      }, { projectPath })
    );

    const content = await fs.readFile(filePath, 'utf-8');
    return content;

  } catch (error) {
    mirrorEvents.emitMirrorEvent(
      createMirrorEvent(MirrorEventType.ERROR, {
        message: `Failed to read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        file: filePath
      }, { projectPath })
    );

    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}

/**
 * Get file modification time
 */
export async function getFileModifiedTime(filePath: string): Promise<Date | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}
