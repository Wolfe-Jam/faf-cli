import { describe, it, expect } from 'bun:test';
import { splitCommandNote, commandOnly, NOTE_SEPARATOR } from '../../src/interop/command-note.js';

describe('splitCommandNote', () => {
  it('returns the command and no note when the value carries none', () => {
    expect(splitCommandNote('bun run build')).toEqual({ cmd: 'bun run build', note: null });
  });

  it('splits a value that carries a note', () => {
    expect(splitCommandNote('bun run build — clean, bundle, then tsc')).toEqual({
      cmd: 'bun run build',
      note: 'clean, bundle, then tsc',
    });
  });

  it('leaves hyphens alone — shell flags are not notes', () => {
    expect(splitCommandNote('rm -rf dist')).toEqual({ cmd: 'rm -rf dist', note: null });
    expect(splitCommandNote('bun test --timeout=120000')).toEqual({
      cmd: 'bun test --timeout=120000',
      note: null,
    });
  });

  it('treats a separator with an empty side as no note', () => {
    expect(splitCommandNote('bun run build — ').note).toBeNull();
    expect(splitCommandNote(' — a note with no command').note).toBeNull();
  });

  it('splits on the first separator only, so a note may contain one', () => {
    const { cmd, note } = splitCommandNote('bun run ship — build — then publish');
    expect(cmd).toBe('bun run ship');
    expect(note).toBe('build — then publish');
  });

  it('handles nullish and non-string values', () => {
    expect(splitCommandNote(undefined)).toEqual({ cmd: '', note: null });
    expect(splitCommandNote(null)).toEqual({ cmd: '', note: null });
  });

  it('trims surrounding whitespace on both parts', () => {
    expect(splitCommandNote('  bun run dev   —   watch mode  ')).toEqual({
      cmd: 'bun run dev',
      note: 'watch mode',
    });
  });

  it('exports the separator it splits on', () => {
    expect(NOTE_SEPARATOR).toBe(' — ');
  });
});

describe('commandOnly', () => {
  it('drops a note so prose never shows one', () => {
    expect(commandOnly('bun run test — must pass before a change is done')).toBe('bun run test');
  });

  it('is a no-op on a bare command', () => {
    expect(commandOnly('bun run test')).toBe('bun run test');
  });
});
