/**
 * 🎸 Event Emitter - The Power Chord Player
 * Global singleton event emitter for all C-Mirror events
 *
 * Core emits events → Emitter broadcasts → Listeners react
 * Terminal, Slack, Dashboard, Analytics all listen to the same chords
 */

import { EventEmitter } from 'events';
import { MirrorEvent, MirrorEventType } from './mirror-events';

/**
 * Mirror Event Emitter
 * Extended EventEmitter with type-safe event handling
 */
export class MirrorEventEmitter extends EventEmitter {
  /**
   * Emit a mirror event
   * Broadcasts to both universal and specific listeners
   */
  emitMirrorEvent(event: MirrorEvent): void {
    // Emit to universal listener (anyone who wants ALL events)
    this.emit('mirror:event', event);

    // Emit to specific type listeners
    this.emit(event.type, event);

    // Emit to category listeners
    const category = this.getEventCategory(event.type);
    if (category) {
      this.emit(category, event);
    }
  }

  /**
   * Get event category for grouped listening
   */
  private getEventCategory(type: MirrorEventType): string | null {
    if (type.startsWith('mirror:sync:')) return 'mirror:sync';
    if (type.startsWith('mirror:validation:')) return 'mirror:validation';
    if (type.startsWith('mirror:integrity:')) return 'mirror:integrity';
    if (type.startsWith('mirror:score:')) return 'mirror:score';
    if (type.startsWith('mirror:dna:')) return 'mirror:dna';
    if (type.startsWith('mirror:file:')) return 'mirror:file';
    return null;
  }

  /**
   * Type-safe event listeners
   */
  onMirrorEvent(type: MirrorEventType | 'mirror:event', listener: (event: MirrorEvent) => void): this {
    return this.on(type, listener);
  }

  onceMirrorEvent(type: MirrorEventType | 'mirror:event', listener: (event: MirrorEvent) => void): this {
    return this.once(type, listener);
  }

  offMirrorEvent(type: MirrorEventType | 'mirror:event', listener: (event: MirrorEvent) => void): this {
    return this.off(type, listener);
  }
}

/**
 * Global singleton - ONE source of truth
 * All C-Mirror operations use this single emitter
 */
export const mirrorEvents = new MirrorEventEmitter();

// Increase max listeners for integrations (Slack, Dashboard, Analytics, etc.)
mirrorEvents.setMaxListeners(50);
