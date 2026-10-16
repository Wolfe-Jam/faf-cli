/**
 * Windows timing for tests that start the CLI (or git) as a child process.
 *
 * On Windows CI runners a child process sometimes never exits: the test ends
 * exactly at its limit (#167). The PR job skips those tests; the Windows
 * nightly (about 4am Atlanta) runs them, and a release waits for it.
 *
 *   FAF_WINDOWS_PR=1            the PR job: skip the tests marked nightly-only
 *   FAF_TEST_SPAWN_LIMIT_MS=<n> the nightly: one limit for every child process,
 *                               long enough for a slow start, short enough
 *                               that a hang fails fast and the suite goes on
 */
import { rmSync } from 'fs';

/** True in the Windows PR job, where the nightly-only tests are skipped. */
export const windowsPr = process.platform === 'win32' && process.env.FAF_WINDOWS_PR === '1';

/** A child process's time limit: `ms`, or the nightly's longer limit when it's set. */
export function spawnLimit(ms: number): number {
  const night = Number(process.env.FAF_TEST_SPAWN_LIMIT_MS);
  return Number.isFinite(night) && night > ms ? night : ms;
}

/**
 * Run `fn`, which starts a child process; if the child hit its time limit,
 * throw an error that names the command, so a hang reads as a hang.
 */
export function namedHang<T>(command: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { error?: NodeJS.ErrnoException };
    if (err.code === 'ETIMEDOUT' || err.error?.code === 'ETIMEDOUT') {
      throw new Error(`hung child process (#167): "${command}" did not exit within its time limit`);
    }
    throw e;
  }
}

/**
 * Remove a test's temp folder. Windows can hold a folder a moment after its
 * process ends, so a locked folder is retried; if it is still locked, the
 * test's own result stands and the folder is left for the runner to clear.
 */
export function removeTemp(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (e) {
    if (process.platform !== 'win32') {throw e;}
    console.warn(`temp folder left (still locked): ${dir}`);
  }
}
