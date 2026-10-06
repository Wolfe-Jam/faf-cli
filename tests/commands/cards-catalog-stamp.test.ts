/**
 * WJTTC — a catalog row's updatedAt moves when the row changes (8.2.0 review, finding 5).
 *
 * faf keeps the stamp a run would otherwise move, so a run that changes nothing
 * writes nothing. But a row whose url or type really changes must say so:
 * anything that refreshes on updatedAt would otherwise miss the change.
 */
import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const made: string[] = [];
const mk = (): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'faf-catstamp-')));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});
const run = (cwd: string, args: string[]): { status: number | null; err: string } => {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000,
    env: { ...process.env, HOME: mk(), NO_COLOR: '1', CI: '1' },
  });
  return { status: r.status, err: r.stderr ?? '' };
};

const FAFA =
  'agent:\n  name: demo-agent\n  displayName: Demo\n  vendor: Example\n  version: "0.1.0"\n  description: A demo agent.\n  homepage: https://example.com/agent\n' +
  'capabilities:\n  - name: ask\n    description: Answer a question.\nendpoints:\n  - protocol: a2a\n    location: https://example.com/a2a\n    version: "1.0"\n';
type Row = { identifier: string; url: string; updatedAt: string };
const a2aRow = (d: string): Row =>
  (JSON.parse(readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8')).entries as Row[]).find(r => r.identifier.includes(':a2a:'))!;

describe('ENGINE: a catalog row that changes gets a new updatedAt; one that does not keeps it', () => {
  test('--a2a-url moves the A2A row: its updatedAt moves; the same run again writes nothing', () => {
    const d = mk();
    writeFileSync(join(d, 'agent.fafa'), FAFA);
    expect(run(d, ['cards', '--target', 'catalog']).status).toBe(0);
    const first = a2aRow(d);

    Bun.sleepSync(20); // a later run is a later time
    expect(run(d, ['cards', '--target', 'catalog', '--a2a-url', 'https://cdn.example.com/card.json']).status).toBe(0);
    const moved = a2aRow(d);
    expect(moved.url).toBe('https://cdn.example.com/card.json');
    expect(moved.updatedAt).not.toBe(first.updatedAt);

    const text = readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8');
    Bun.sleepSync(20);
    const again = run(d, ['cards', '--target', 'catalog', '--a2a-url', 'https://cdn.example.com/card.json']);
    expect(again.status).toBe(0);
    expect(again.err).toContain('(unchanged)');
    expect(readFileSync(join(d, '.well-known', 'ai-catalog.json'), 'utf-8')).toBe(text);
  });
});
