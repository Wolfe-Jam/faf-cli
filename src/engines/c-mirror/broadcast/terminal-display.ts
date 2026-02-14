/**
 * 🖥️ Terminal Display - Event Listener
 * Listens to mirror events and displays championship output
 *
 * This is ONE listener - Terminal is not special, just first
 * Other listeners: Slack, Dashboard, Analytics all get the same events
 *
 * Principles:
 * - Championship communication (never "might", always "synchronized")
 * - Build confidence ("It's always right, it's got it")
 * - Show score first (top line)
 * - Progress indicators
 * - Success messages with next steps
 */

import { mirrorEvents } from '../core/events/event-emitter';
import { MirrorEvent, MirrorEventType } from '../core/events/mirror-events';
import { FAF_COLORS, FAF_ICONS } from '../../../utils/championship-style';

/**
 * Start listening to mirror events and display in terminal
 */
export function startTerminalDisplay(): void {
  // Listen to all events
  mirrorEvents.onMirrorEvent('mirror:event', handleMirrorEvent);
}

/**
 * Stop listening (cleanup)
 */
export function stopTerminalDisplay(): void {
  mirrorEvents.removeAllListeners('mirror:event');
}

/**
 * Handle a mirror event and display appropriately
 */
function handleMirrorEvent(event: MirrorEvent): void {
  switch (event.type) {
    case MirrorEventType.SYNC_START:
      handleSyncStart(event);
      break;

    case MirrorEventType.SYNC_PROGRESS:
      handleSyncProgress(event);
      break;

    case MirrorEventType.SYNC_COMPLETE:
      handleSyncComplete(event);
      break;

    case MirrorEventType.SYNC_ERROR:
      handleSyncError(event);
      break;

    case MirrorEventType.INTEGRITY_PERFECT:
      handleIntegrityPerfect(event);
      break;

    case MirrorEventType.INTEGRITY_FAILED:
      handleIntegrityFailed(event);
      break;

    case MirrorEventType.SCORE_UPDATE:
      handleScoreUpdate(event);
      break;

    case MirrorEventType.ERROR:
      handleError(event);
      break;

    case MirrorEventType.WARNING:
      handleWarning(event);
      break;

    // Add more handlers as needed
  }
}

/**
 * Sync start
 */
function handleSyncStart(event: MirrorEvent): void {
  const direction = event.data.direction || 'unknown';
  const arrow = direction === 'faf-to-claude' ? '→' : direction === 'claude-to-faf' ? '←' : '↔';

  console.log('');
  console.log(FAF_COLORS.fafCyan('🔗 C-MIRROR LIVE'));
  console.log(FAF_COLORS.fafCyan('━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  // Show score first if available
  if (event.metadata.score) {
    const { ai, human, total } = event.metadata.score;
    console.log(FAF_COLORS.fafOrange(`🏎️ Score: ${total}% | AI:${ai} HUMAN:${human}`));
  }

  console.log(`${FAF_COLORS.fafCyan('├─')} Syncing ${arrow} ${direction}...`);
}

/**
 * Sync progress
 */
function handleSyncProgress(event: MirrorEvent): void {
  const { step, progress, message } = event.data;

  // Progress bar
  const barWidth = 24;
  const filled = Math.floor((progress / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  console.log(`${FAF_COLORS.fafCyan('├─')} ${bar} ${progress}% - ${message || step}`);
}

/**
 * Sync complete
 */
function handleSyncComplete(event: MirrorEvent): void {
  const { success, filesChanged } = event.data;
  const duration = event.metadata.duration || 0;

  const speedIcon = duration < 40 ? '🏎️' : duration < 100 ? '🚗' : '🐌';

  console.log(`${FAF_COLORS.fafGreen('└─')} ${FAF_ICONS.party} Synchronized in ${duration}ms ${speedIcon}`);

  if (filesChanged && filesChanged.length > 0) {
    console.log(`   Files: ${filesChanged.join(', ')}`);
  }

  // Show score if available
  if (event.metadata.score) {
    const { ai, human, total } = event.metadata.score;
    console.log('');
    console.log(FAF_COLORS.fafOrange(`⚖️ Balance: AI:${ai}% | HUMAN:${human}%`));

    // Championship status
    if (total >= 100) {
      console.log(FAF_COLORS.fafGreen('🏆 CHAMPIONSHIP! Perfect 100% + 50|50 balance'));
    } else if (total >= 99) {
      console.log(FAF_COLORS.fafGreen('🥇 GOLD! 99% achieved'));
    } else if (ai === 50 && human === 50) {
      console.log(FAF_COLORS.fafGreen('⚖️ Perfect 50|50 balance!'));
    } else {
      const diff = Math.abs(ai - human);
      if (diff > 10) {
        const higher = ai > human ? 'AI' : 'HUMAN';
        const lower = ai > human ? 'HUMAN' : 'AI';
        console.log(FAF_COLORS.fafCyan(`💡 Tip: Add ${lower} context to balance with ${higher}`));
      }
    }
  }

  console.log('');
}

/**
 * Sync error
 */
function handleSyncError(event: MirrorEvent): void {
  const { error, direction } = event.data;

  console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Sync failed: ${error}`));
  console.log(`   Direction: ${direction}`);

  if (event.data.recoverable) {
    console.log(FAF_COLORS.fafCyan('   Restored from backup - original files untouched'));
  }

  console.log('');
}

/**
 * Integrity perfect
 */
function handleIntegrityPerfect(event: MirrorEvent): void {
  console.log(FAF_COLORS.fafGreen('✅ Integrity: PERFECT'));
  console.log(FAF_COLORS.fafCyan('   Mirror verified - zero slippage'));
}

/**
 * Integrity failed
 */
function handleIntegrityFailed(event: MirrorEvent): void {
  const { error } = event.data;
  console.log(FAF_COLORS.fafOrange('⚠️ Integrity: FAILED'));
  console.log(`   Error: ${error}`);
  console.log(FAF_COLORS.fafCyan('   Run `faf trust` to diagnose'));
}

/**
 * Score update
 */
function handleScoreUpdate(event: MirrorEvent): void {
  if (!event.metadata.score) {return;}

  const { ai, human, total } = event.metadata.score;

  console.log('');
  console.log(FAF_COLORS.fafOrange('📊 SCORE UPDATE'));
  console.log(FAF_COLORS.fafCyan(`   Total: ${total}%`));
  console.log(FAF_COLORS.fafCyan(`   AI: ${ai} | HUMAN: ${human}`));
  console.log('');
}

/**
 * Error
 */
function handleError(event: MirrorEvent): void {
  const { message, recoverable } = event.data;

  console.log(FAF_COLORS.fafOrange(`❌ Error: ${message}`));

  if (recoverable) {
    console.log(FAF_COLORS.fafCyan('   Recoverable - no data lost'));
  }
}

/**
 * Warning
 */
function handleWarning(event: MirrorEvent): void {
  const { message } = event.data;
  console.log(FAF_COLORS.fafCyan(`⚠️ Warning: ${message}`));
}
