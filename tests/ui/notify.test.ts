import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { notify } from '../../src/ui/notify.js';

/**
 * Unit tests for OSC 9 desktop notification helper.
 *
 * Strategy: stub process.stdout.write to capture the bytes the helper emits,
 * then assert the OSC 9 envelope is exactly what supported terminals expect.
 *
 * NOTE: We can't verify the round-trip into macOS Notification Center from a
 * unit test — that requires a real terminal (Ghostty/iTerm2). Manual matrix
 * lives in the PR description.
 */

interface StubState {
  written: string[];
  isTTY: boolean | undefined;
  envNoNotify: string | undefined;
  envOsc9: string | undefined;
  originalWrite: typeof process.stdout.write;
  originalIsTTY: typeof process.stdout.isTTY;
}

function setup(opts: { isTTY: boolean; envOptOut?: boolean }): StubState {
  const state: StubState = {
    written: [],
    isTTY: process.stdout.isTTY,
    envNoNotify: process.env.FAF_NO_NOTIFY,
    envOsc9: process.env.FAF_NOTIFY_OSC9,
    originalWrite: process.stdout.write.bind(process.stdout),
    originalIsTTY: process.stdout.isTTY,
  };

  Object.defineProperty(process.stdout, 'isTTY', { value: opts.isTTY, configurable: true });

  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    state.written.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
    return true;
  }) as typeof process.stdout.write;

  if (opts.envOptOut) {
    process.env.FAF_NO_NOTIFY = '1';
  } else {
    delete process.env.FAF_NO_NOTIFY;
  }

  // Force OSC 9 path so tests are deterministic regardless of whether
  // terminal-notifier is installed on the dev machine.
  process.env.FAF_NOTIFY_OSC9 = '1';

  return state;
}

function teardown(state: StubState): void {
  process.stdout.write = state.originalWrite;
  Object.defineProperty(process.stdout, 'isTTY', { value: state.originalIsTTY, configurable: true });
  if (state.envNoNotify === undefined) {
    delete process.env.FAF_NO_NOTIFY;
  } else {
    process.env.FAF_NO_NOTIFY = state.envNoNotify;
  }
  if (state.envOsc9 === undefined) {
    delete process.env.FAF_NOTIFY_OSC9;
  } else {
    process.env.FAF_NOTIFY_OSC9 = state.envOsc9;
  }
}

describe('notify (OSC 9)', () => {
  let state: StubState;

  afterEach(() => {
    if (state) teardown(state);
  });

  test('emits OSC 9 envelope on a TTY', () => {
    state = setup({ isTTY: true });
    notify('hello');
    expect(state.written).toEqual(['\x1b]9;hello\x07']);
  });

  test('emits nothing when stdout is not a TTY (piped output, CI)', () => {
    state = setup({ isTTY: false });
    notify('hello');
    expect(state.written).toEqual([]);
  });

  test('emits nothing when FAF_NO_NOTIFY=1', () => {
    state = setup({ isTTY: true, envOptOut: true });
    notify('hello');
    expect(state.written).toEqual([]);
  });

  test('strips ASCII control characters from message', () => {
    state = setup({ isTTY: true });
    notify('hi\x07\x1b\x00there');
    expect(state.written).toEqual(['\x1b]9;hi   there\x07']);
  });

  test('truncates messages longer than 200 chars', () => {
    state = setup({ isTTY: true });
    const longMessage = 'a'.repeat(500);
    notify(longMessage);
    const expectedPayload = 'a'.repeat(200);
    expect(state.written).toEqual([`\x1b]9;${expectedPayload}\x07`]);
  });

  test('handles empty message gracefully', () => {
    state = setup({ isTTY: true });
    notify('');
    expect(state.written).toEqual(['\x1b]9;\x07']);
  });

  test('preserves printable ASCII and UTF-8', () => {
    state = setup({ isTTY: true });
    notify('FAF: 100% 🏆 Trophy unlocked');
    expect(state.written).toEqual(['\x1b]9;FAF: 100% 🏆 Trophy unlocked\x07']);
  });
});
