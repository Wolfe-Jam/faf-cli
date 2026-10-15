/**
 * Windows timing for tests that start the CLI (or git) as a child process.
 *
 * On Windows CI runners a child process sometimes never exits: the test ends
 * exactly at its limit. The PR job doesn't wait for that; the Windows nightly
 * (about 4am Atlanta) takes as long as it needs, and a release waits for it.
 *
 *   FAF_WINDOWS_PR=1            the PR job: skip the tests marked nightly-only
 *   FAF_TEST_SPAWN_LIMIT_MS=<n> the nightly: one long limit for every child process
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
