/**
 * WJTTC — faf cards keeps a published server.json name (8.2.0 review, finding 1).
 *
 * In 8.2.0 the registry identity comes from the .fafa. An existing server.json
 * already carries the name it was published under; renaming it moves the next
 * registry publish to a different namespace. faf keeps that name unless the
 * user asks for the rename with --force.
 */
import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CLI = join(import.meta.dir, '../../src/cli.ts');
const made: string[] = [];
const mk = (): string => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'faf-regname-')));
  made.push(d);
  return d;
};
afterAll(() => {
  for (const d of made) {rmSync(d, { recursive: true, force: true });}
});

const run = (cwd: string, args: string[]): { status: number | null; err: string } => {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, HOME: mk(), NO_COLOR: '1', CI: '1' },
  });
  return { status: r.status, err: (r.stderr ?? '').replace(/\x1b\[[0-9;]*m/g, '') };
};

const PUBLISHED = 'dev.weather/weather-mcp-server';
const SERVER_JSON =
  '{\n  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",\n' +
  `  "name": "${PUBLISHED}",\n  "description": "Weather tools",\n  "version": "1.0.0"\n}\n`;
const FAFA =
  'agent:\n  name: weather\n  displayName: Weather\n  vendor: Example\n  version: "1.0.0"\n  description: Weather tools.\n  homepage: https://example.com\n' +
  'capabilities:\n  - name: forecast\n    description: A forecast.\nendpoints:\n  - protocol: mcp\n    location: https://example.com/mcp\n';

const seed = (): string => {
  const d = mk();
  writeFileSync(join(d, 'server.json'), SERVER_JSON);
  writeFileSync(join(d, 'agent.fafa'), FAFA);
  return d;
};
const nameOf = (d: string): string => JSON.parse(readFileSync(join(d, 'server.json'), 'utf-8')).name;

describe('BRAKE: faf cards keeps the name server.json was published under', () => {
  test('a .fafa that gives a different name: refused, server.json byte for byte, the line names both and --force', () => {
    const d = seed();
    const r = run(d, ['cards', '--target', 'registry']);
    expect(r.status).not.toBe(0);
    expect(readFileSync(join(d, 'server.json'), 'utf-8')).toBe(SERVER_JSON);
    expect(r.err).toContain(PUBLISHED);
    expect(r.err).toContain('--force');
  });

  test('--force renames it to the identity the .fafa gives', () => {
    const d = seed();
    const r = run(d, ['cards', '--target', 'registry', '--force']);
    expect(r.status).toBe(0);
    expect(nameOf(d)).not.toBe(PUBLISHED);
  });

  test('a server.json already under the .fafa name: nothing to refuse', () => {
    const d = seed();
    expect(run(d, ['cards', '--target', 'registry', '--force']).status).toBe(0);
    const renamed = readFileSync(join(d, 'server.json'), 'utf-8');
    const again = run(d, ['cards', '--target', 'registry']);
    expect(again.status).toBe(0);
    expect(readFileSync(join(d, 'server.json'), 'utf-8')).toBe(renamed);
  });
});
