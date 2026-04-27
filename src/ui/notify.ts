import { spawnSync } from 'child_process';

let cachedTerminalNotifier: string | null | undefined;

/** Resolve `terminal-notifier` path on macOS (cached). Returns null on other platforms or if not installed. */
function getTerminalNotifierPath(): string | null {
  if (cachedTerminalNotifier !== undefined) {return cachedTerminalNotifier;}
  if (process.platform !== 'darwin') {
    cachedTerminalNotifier = null;
    return null;
  }
  try {
    const result = spawnSync('which', ['terminal-notifier'], { encoding: 'utf-8' });
    cachedTerminalNotifier = result.status === 0 ? result.stdout.trim() : null;
  } catch {
    cachedTerminalNotifier = null;
  }
  return cachedTerminalNotifier;
}

/**
 * Desktop notifications.
 *
 * macOS with `terminal-notifier` installed: routes through it for click-to-dismiss
 * persistence. Set terminal-notifier to "Alerts" in System Settings → Notifications
 * for sticky notifications. Install with `brew install terminal-notifier`.
 *
 * Otherwise: OSC 9 (BEL terminator) — supported by Ghostty, iTerm2, Wezterm, Kitty;
 * silently ignored elsewhere.
 *
 * Opt out: FAF_NO_NOTIFY=1
 * Force OSC 9 path (skip terminal-notifier): FAF_NOTIFY_OSC9=1
 */
export function notify(message: string): void {
  if (process.env.FAF_NO_NOTIFY === '1') {return;}
  if (!process.stdout.isTTY) {return;}

  // eslint-disable-next-line no-control-regex -- intentional: stripping ASCII control chars before OSC 9 emit
  const safe = message.replace(/[\x00-\x1f]/g, ' ').slice(0, 200);

  if (process.env.FAF_NOTIFY_OSC9 !== '1') {
    const tnPath = getTerminalNotifierPath();
    if (tnPath) {
      try {
        spawnSync(tnPath, [
          '-title', 'FAF',
          '-message', safe,
          '-timeout', '0',
        ], { stdio: 'ignore' });
      } catch { /* notifications are best-effort — silent failure */ }
      return;
    }
  }

  process.stdout.write(`\x1b]9;${safe}\x07`);
}
