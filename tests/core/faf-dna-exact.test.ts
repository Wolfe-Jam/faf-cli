/**
 * BRAKE: faf rewrites a .faf-dna only when it can prove it wrote every byte —
 * adversarial #3.
 *
 * recordGrowth parsed the file and wrote `JSON.stringify(dna, null, 2)` back
 * whenever it was in faf's shape. A user's text in it did not survive that
 * round trip: a 20-digit id was rounded (t-dna N02), integer-like keys were
 * reordered (N04), the first of two repeated keys was dropped (N05), `é`
 * escapes were decoded (N17) — and a note on the peak milestone went with the
 * milestone it sat on.
 *
 * Now faf adds to a faf-shaped .faf-dna only when its text is exactly faf's
 * own serialisation of what it holds (`JSON.stringify(JSON.parse(t), null, 2)`
 * plus the final newline equals t), and no key of the user's sits in an entry
 * recordGrowth replaces. Any other file is read, left byte for byte, gets no
 * growth, and readOnlyReason() says why in one line — the same path a file in
 * another tool's shape takes.
 */
import { afterAll, describe, test, expect } from 'bun:test';
import { readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const NOW = '2026-01-01T00:00:00.000Z';
/** A .faf-dna in faf's own shape (t-dna's fixture). */
const own = (extra: Record<string, unknown> = {}, peakExtra: Record<string, unknown> = {}): Record<string, unknown> => ({
  birthCertificate: { born: NOW, birthDNA: 20, birthDNASource: 'init', projectDNA: 'abc', certificate: 'FAF-2026-X-1' },
  versions: [{ version: 'v1.0.0', timestamp: NOW, score: 20, changes: ['Birth'], growth: 0 }],
  current: { version: 'v1.0.0', score: 20, lastSync: NOW },
  growth: {
    totalGrowth: 0,
    daysActive: 0,
    milestones: [
      { type: 'birth', score: 20, date: NOW, version: 'v1.0.0', label: 'Birth', emoji: '🐣' },
      { type: 'peak', score: 30, date: NOW, version: 'v1.0.0', label: 'Peak', emoji: '🏔️', ...peakExtra },
    ],
  },
  lastModified: NOW,
  format: 'faf-dna-v1',
  ...extra,
});
/** faf's own text for `v`. */
const exact = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`;

function project(dna: string): { dir: string; file: string } {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-dna-exact-')));
  const file = join(dir, '.faf-dna');
  writeFileSync(file, dna);
  return { dir, file };
}

/** The file is left exactly as it was: read, never grown, the reason given. */
function leftAsItIs(text: string, reason: RegExp): void {
  const { dir, file } = project(text);
  const before = statSync(file);
  const m = new FafDNAManager(dir);
  expect(m.load()).not.toBeNull(); // still read: the journey shows
  expect(m.getJourney()).toBe('20% → 30% ← 20%');
  expect(m.isFafShape()).toBe(false);
  expect(m.readOnlyReason()).toMatch(reason);
  expect(m.readOnlyReason()).not.toContain('\n');
  expect(m.recordGrowth(55, ['faf auto'])).toBeNull();
  expect(readFileSync(file, 'utf-8')).toBe(text);
  expect(statSync(file).ino).toBe(before.ino);
}

const NOT_EXACT = /^\.faf-dna is not exactly as faf wrote it .*: faf reads it and leaves it as it is\.$/;

describe('BRAKE: a faf-shaped .faf-dna faf cannot prove it wrote is left byte for byte', () => {
  test('t-dna N02: a 20-digit integer in a user key — compact, and in faf\'s own layout', () => {
    leftAsItIs(JSON.stringify(own()).replace('"format"', '"ticketId":12345678901234567890,"format"'), NOT_EXACT);
    leftAsItIs(exact(own({ ticketId: 1 })).replace('"ticketId": 1', '"ticketId": 12345678901234567890'), NOT_EXACT);
  });

  test('t-dna N04: integer-like user keys JSON would reorder', () => {
    const body = JSON.stringify(own()).replace('"format"', '"notes":{"b":"HAND-B","10":"HAND-TEN","2":"HAND-TWO"},"format"');
    leftAsItIs(body, NOT_EXACT);
    leftAsItIs(exact(own({ notes: { b: 'HAND-B', x: 'HAND-TEN' } })).replace('"x": "HAND-TEN"', '"10": "HAND-TEN"'), NOT_EXACT);
  });

  test('t-dna N05: a repeated user key', () => {
    leftAsItIs(JSON.stringify(own()).replace('"format"', '"owner":"FIRST-OWNER","owner":"SECOND-OWNER","format"'), NOT_EXACT);
    leftAsItIs(exact(own({ owner: 'SECOND-OWNER' })).replace('"owner": "SECOND-OWNER"', '"owner": "FIRST-OWNER",\n  "owner": "SECOND-OWNER"'), NOT_EXACT);
  });

  test('t-dna N17: a \\u-escaped user string', () => {
    leftAsItIs(JSON.stringify(own()).replace('"format"', '"sig":"\\u00e9\\u2014HAND-ESCAPED","format"'), NOT_EXACT);
    leftAsItIs(exact(own({ sig: 'é—HAND-ESCAPED' })).replace('é—HAND', '\\u00e9\\u2014HAND'), NOT_EXACT);
  });

  test('hand formatting: CRLF, no final newline, 4-space indent', () => {
    leftAsItIs(exact(own()).replace(/\n/g, '\r\n'), NOT_EXACT);
    leftAsItIs(JSON.stringify(own(), null, 2), NOT_EXACT);
    leftAsItIs(`${JSON.stringify(own(), null, 4)}\n`, NOT_EXACT);
  });

  test('a key of the user\'s in the peak milestone or in current (t-dna N03, in faf\'s own layout)', () => {
    const USER_NOTE = /^\.faf-dna has a key of yours in an entry faf would replace .*: faf reads it and leaves it as it is\.$/;
    leftAsItIs(exact(own({}, { note: 'HAND-PEAK-NOTE' })), USER_NOTE);
    const withCurrentNote = own();
    (withCurrentNote.current as Record<string, unknown>).note = 'HAND-CURRENT-NOTE';
    leftAsItIs(exact(withCurrentNote), USER_NOTE);
  });

  test('faf\'s own text still grows, and a top-level key of the user\'s is kept (t-dna N01)', () => {
    const { dir, file } = project(exact(own({ teamNote: 'HAND-TOP-NOTE' })));
    const m = new FafDNAManager(dir);
    expect(m.isFafShape()).toBe(true);
    expect(m.readOnlyReason()).toBeNull();
    expect(m.recordGrowth(55, ['faf auto'])?.current.score).toBe(55);
    const after = readFileSync(file, 'utf-8');
    expect(JSON.parse(after).teamNote).toBe('HAND-TOP-NOTE');
    expect(after).toBe(exact(JSON.parse(after)));
    // …and the file it wrote is faf's own again: the next run grows it too.
    expect(new FafDNAManager(dir).recordGrowth(70, ['faf auto'])?.current.score).toBe(70);
  });
});

describe('BRAKE: the CLI says why in one line and leaves the file', () => {
  const run = (cwd: string, args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, HOME: realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-dna-exact-home-'))), NO_COLOR: '1' },
    });

  test('faf auto: exit 0, one warning line, the .faf-dna byte for byte', () => {
    const text = JSON.stringify(own()).replace('"format"', '"ticketId":12345678901234567890,"format"');
    const { dir, file } = project(text);
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'demo', description: 'A demo service' }));
    const r = run(dir, ['auto']);
    expect(r.status).toBe(0);
    expect(r.stderr.trim().split('\n').filter(l => l.includes('.faf-dna'))).toEqual([
      'faf: .faf-dna is not exactly as faf wrote it (hand formatting, key order, a repeated key or a number JSON cannot hold exactly): faf reads it and leaves it as it is.',
    ]);
    expect(readFileSync(file, 'utf-8')).toBe(text);
  });

  test('faf dna: shows the journey and says why the file is left as it is', () => {
    const text = exact(own({}, { note: 'HAND-PEAK-NOTE' }));
    const { dir, file } = project(text);
    const r = run(dir, ['dna']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('20% → 30% ← 20%');
    expect(r.stdout).toContain('.faf-dna has a key of yours in an entry faf would replace');
    expect(readFileSync(file, 'utf-8')).toBe(text);
  });
});
