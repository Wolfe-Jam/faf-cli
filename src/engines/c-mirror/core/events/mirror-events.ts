/**
 * 🔊 Mirror Events - The Power Chords
 * Lowest-level event system for C-Mirror
 * All mirror operations emit events that broadcast broadly
 *
 * Events flow: Core → Event Emitter → Listeners (Terminal, Slack, Dashboard, etc.)
 *
 * This is the foundation - everything else listens to these power chords
 */

/**
 * Event types - All possible mirror events
 */
export enum MirrorEventType {
  // Sync lifecycle
  SYNC_START = 'mirror:sync:start',
  SYNC_PROGRESS = 'mirror:sync:progress',
  SYNC_COMPLETE = 'mirror:sync:complete',
  SYNC_ERROR = 'mirror:sync:error',

  // Validation lifecycle
  VALIDATION_START = 'mirror:validation:start',
  VALIDATION_PROGRESS = 'mirror:validation:progress',
  VALIDATION_COMPLETE = 'mirror:validation:complete',
  VALIDATION_ERROR = 'mirror:validation:error',

  // Integrity checks
  INTEGRITY_CHECK = 'mirror:integrity:check',
  INTEGRITY_PERFECT = 'mirror:integrity:perfect',
  INTEGRITY_DEGRADED = 'mirror:integrity:degraded',
  INTEGRITY_FAILED = 'mirror:integrity:failed',

  // Score updates
  SCORE_UPDATE = 'mirror:score:update',
  SCORE_MILESTONE = 'mirror:score:milestone',
  SCORE_DROP = 'mirror:score:drop',

  // DNA chain
  DNA_LOG = 'mirror:dna:log',
  DNA_CHECKPOINT = 'mirror:dna:checkpoint',
  DNA_RESTORE = 'mirror:dna:restore',

  // File operations
  FILE_READ = 'mirror:file:read',
  FILE_WRITE = 'mirror:file:write',
  FILE_BACKUP = 'mirror:file:backup',

  // Errors
  ERROR = 'mirror:error',
  WARNING = 'mirror:warning',
}

/**
 * Sync direction
 */
export type SyncDirection = 'faf-to-claude' | 'claude-to-faf' | 'bidirectional' | 'none';

/**
 * Integrity status
 */
export type IntegrityStatus = 'perfect' | 'degraded' | 'failed';

/**
 * Score data
 */
export interface ScoreData {
  ai: number;
  human: number;
  total: number;
}

/**
 * Event metadata - Always included
 */
export interface EventMetadata {
  projectPath: string;
  timestamp: Date;
  score?: ScoreData;
  duration?: number;
  integrity?: IntegrityStatus;
  direction?: SyncDirection;
}

/**
 * Mirror Event - The universal event structure
 */
export interface MirrorEvent {
  type: MirrorEventType;
  timestamp: Date;
  data: any;
  metadata: EventMetadata;
}

/**
 * Sync progress data
 */
export interface SyncProgressData {
  step: string;
  progress: number; // 0-100
  message?: string;
}

/**
 * Validation result data
 */
export interface ValidationResultData {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Error data
 */
export interface ErrorData {
  message: string;
  code?: string;
  stack?: string;
  recoverable?: boolean;
}

/**
 * Create a mirror event (helper)
 */
export function createMirrorEvent(
  type: MirrorEventType,
  data: any,
  metadata: Partial<EventMetadata> = {}
): MirrorEvent {
  return {
    type,
    timestamp: new Date(),
    data,
    metadata: {
      projectPath: metadata.projectPath || process.cwd(),
      timestamp: new Date(),
      ...metadata
    }
  };
}
