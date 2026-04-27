/**
 * Desktop notifications via OSC 9 (BEL terminator).
 * Supported by Ghostty, iTerm2, Wezterm, Kitty — silently ignored elsewhere.
 *
 * Opt out with FAF_NO_NOTIFY=1.
 */
export function notify(message: string): void {
  if (process.env.FAF_NO_NOTIFY === '1') return;
  if (!process.stdout.isTTY) return;
  const safe = message.replace(/[\x00-\x1f]/g, ' ').slice(0, 200);
  process.stdout.write(`\x1b]9;${safe}\x07`);
}
