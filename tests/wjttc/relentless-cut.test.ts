/**
 * BRAKE: the Relentless cut. A suggestion must mean the slot it sits in.
 *   - package.json scripts are commands, not how a project is built → no `how`
 *   - package.json repository / homepage is where the code is kept, not where
 *     it runs → no `where`
 *   - a "for developers" / "our mission is" sentence pattern is a guess, not a
 *     named section → no `who` / `why`
 * Named README sections and the manifest description still suggest.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { relentlessContextDetailed } from '../../src/detect/relentless.js';
import { suggestIntent } from '../../src/core/suggest.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'faf-rel-cut-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const pkg = (o: object): void => writeFileSync(join(dir, 'package.json'), JSON.stringify(o));
const readme = (s: string): void => writeFileSync(join(dir, 'README.md'), s);

describe('BRAKE: Relentless suggests only what means the slot', () => {
  test('package.json scripts never suggest `how`', () => {
    pkg({ name: 'x', scripts: { start: 'node x', dev: 'vite', build: 'tsc' } });
    expect(relentlessContextDetailed(dir).how).toBeUndefined();
    expect(suggestIntent(dir)['human_context.how']).toBeUndefined();
  });

  test('package.json repository never suggests `where`', () => {
    pkg({ name: 'x', repository: { url: 'git+https://github.com/example/x.git' } });
    expect(relentlessContextDetailed(dir).where).toBeUndefined();
    expect(suggestIntent(dir)['human_context.where']).toBeUndefined();
  });

  test('package.json homepage never suggests `where`', () => {
    pkg({ name: 'x', homepage: 'https://x.example.com' });
    expect(relentlessContextDetailed(dir).where).toBeUndefined();
  });

  test('a "built for <role>" sentence never suggests `who`', () => {
    readme('# X\n\nX is a tool. Built for backend teams who ship APIs every week.\n');
    expect(relentlessContextDetailed(dir).who).toBeUndefined();
    expect(suggestIntent(dir)['human_context.who']).toBeUndefined();
  });

  test('an "our mission is" sentence never suggests `why`', () => {
    readme('# X\n\nX is a tool.\n\nOur mission is to remove integration friction for every team.\n');
    expect(relentlessContextDetailed(dir).why).toBeUndefined();
  });

  test('licence text never suggests `why` (seen: MIT "hereby granted")', () => {
    readme('# X\n\nX is a tool for widgets and gadgets alike.\n\n## License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy.\n');
    expect(relentlessContextDetailed(dir).why).toBeUndefined();
  });
});

describe('BRAKE: no sentence-pattern guesses at all (zero slop)', () => {
  test('a "solves the problem of" sentence never suggests `what`', () => {
    // Only a heading line carries it, so the first-paragraph rule can't take it:
    // the pattern guess is the only thing that could.
    readme('# X solves the problem of context re-discovery on every new chat session\n');
    expect(relentlessContextDetailed(dir).what).toBeUndefined();
  });

  test('a "published on" sentence never suggests `where` (seen: "https://kitchen-table-mcp")', () => {
    readme('# X\n\n## Notes\n\n- Deployed at https://kitchen-table-mcp for the demo.\n');
    expect(relentlessContextDetailed(dir).where).toBeUndefined();
  });

  test('a "production since" sentence never suggests `when`', () => {
    readme('# X\n\n## Notes\n\n- In production since September 2025, battle-tested across teams.\n');
    expect(relentlessContextDetailed(dir).when).toBeUndefined();
  });

  test('no Relentless source is a heuristic', () => {
    readme('# X\n\nIt solves the problem of context re-discovery on every new chat session.\n\nPublished on npm and Homebrew for everyone.\n\nIn production since September 2025, across teams.\n');
    for (const v of Object.values(relentlessContextDetailed(dir))) {
      expect(v!.source).not.toContain('heuristic');
    }
  });
});

describe('ENGINE: what still suggests', () => {
  test('a named README section still suggests who / why / how', () => {
    readme('# X\n\n## Who is this for\n\nBackend teams who ship APIs every week.\n\n## Why\n\nIntegrations drift and nobody notices until production.\n\n## How it works\n\nA compiler reads the schema and emits typed clients.\n');
    const d = relentlessContextDetailed(dir);
    expect(d.who?.source).toBe('README:## Who is this for');
    expect(d.why?.source).toBe('README:## Why');
    expect(d.how?.source).toBe('README:## How it works');
  });

  test('package.json description still suggests `what`', () => {
    pkg({ name: 'x', description: 'Typed API clients from one schema file' });
    expect(relentlessContextDetailed(dir).what?.source).toBe('package.json:description');
  });
});
