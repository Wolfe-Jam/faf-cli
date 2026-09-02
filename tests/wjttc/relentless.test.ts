/**
 * WJTTC — Relentless 6-W human-context extractor (rewrite of the v5
 * RelentlessContextExtractor, realigned to no-guess). Guard so it can't
 * silently vanish again.
 *
 * ENGINE: reads every source (manifest + README, tiered), fills ONLY from
 * sourced evidence. The v5 INFERRED tiers (guess from name/tech) are DROPPED —
 * sourced-or-empty. WHO = target AUDIENCE (not package author).
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { relentlessContext, relentlessContextDetailed } from '../../src/detect/relentless.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'faf-rel-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const pkg = (o: object): void => writeFileSync(join(dir, 'package.json'), JSON.stringify(o));
const readme = (s: string): void => writeFileSync(join(dir, 'README.md'), s);

describe('WJTTC ENGINE: Relentless 6-W extractor', () => {
  test('what ← package.json description (authoritative)', () => {
    pkg({ description: 'A tool that transforms project files into AI context for assistants' });
    expect(relentlessContext(dir).what).toContain('transforms project files');
  });

  test('what ← README Purpose section when no description', () => {
    readme('# X\n\n## Purpose\nGives AI assistants permanent project memory across sessions.\n');
    expect(relentlessContext(dir).what).toContain('permanent project memory');
  });

  test('what ← problem-statement pattern (relentless tier)', () => {
    readme('# X\n\nIt solves the problem of context re-discovery every new chat session.\n');
    expect(relentlessContext(dir).what).toContain('context re-discovery');
  });

  test('who ← target AUDIENCE pattern, NOT package author', () => {
    pkg({ author: 'James Wolfe' });
    readme('# X\n\nBuilt for developers who pair with AI coding assistants daily.\n');
    const who = relentlessContext(dir).who ?? '';
    expect(who).toContain('developers who pair');
    expect(who).not.toContain('James Wolfe');
  });

  test('why ← mission pattern (relentless tier)', () => {
    readme('# X\n\nOur mission is to eliminate the context tax that wastes hours every week.\n');
    expect(relentlessContext(dir).why).toContain('eliminate the context tax');
  });

  test('why ← declarative only: bare "goal" in a parenthetical does NOT match (regression)', () => {
    // The provenance dogfood caught this: "(name + goal + the six Ws)" made the
    // old heuristic grab the rest of the line as a junk WHY. Declarative-only fixes it.
    readme('# X\n\nThe table shows the 8 questions (name + goal + the six Ws) plus the stack interview.\n');
    expect(relentlessContext(dir).why).toBeUndefined();
  });

  test('why ← "the goal is …" declarative still matches', () => {
    readme('# X\n\nThe goal is to make every project legible to any AI in one shared format.\n');
    expect(relentlessContext(dir).why).toContain('make every project legible');
  });

  test('where ← repository.url (strips git+ and .git)', () => {
    pkg({ repository: { url: 'git+https://github.com/Wolfe-Jam/x.git' } });
    expect(relentlessContext(dir).where).toBe('https://github.com/Wolfe-Jam/x');
  });

  test('where ← README deployment mention (relentless tier)', () => {
    readme('# X\n\nPublished on npm and available via Homebrew for macOS users.\n');
    expect(relentlessContext(dir).where).toContain('npm');
  });

  test('where ← short platform name alone ("Published on npm.") — regression', () => {
    // The 4-char floor used to drop "npm" (3 chars). Showcase-dogfood caught it.
    readme('# X\n\nPublished on npm. Run with npm start.\n');
    expect(relentlessContext(dir).where).toContain('npm');
  });

  test('who ← "for <qualifier> teams" matches, not just a bare role — regression', () => {
    // "for backend teams" used to slip past (role not adjacent to "for").
    readme('# X\n\nBuilt for backend teams maintaining many internal services.\n');
    const who = relentlessContext(dir).who ?? '';
    expect(who).toContain('backend teams');
  });

  test('when ← "production since" pattern (the 6th W v6 was missing)', () => {
    readme('# X\n\nIn production since September 2025, battle-tested across teams.\n');
    expect(relentlessContext(dir).when).toContain('since September 2025');
  });

  test('how ← package.json scripts', () => {
    pkg({ scripts: { build: 'tsc', start: 'node x' } });
    const how = relentlessContext(dir).how ?? '';
    expect(how).toContain('npm run start');
    expect(how).toContain('npm run build');
  });
});

describe('WJTTC BRAKE: Relentless no-guess invariants', () => {
  test('project name alone never infers "what" (v5 INFERRED tier dropped)', () => {
    pkg({ name: 'super-payment-router' });
    expect(relentlessContext(dir).what).toBeUndefined();
  });

  test('sourced-or-empty: no evidence → empty (never guesses)', () => {
    expect(relentlessContext(dir)).toEqual({});
  });

  test('skips badges/HTML — no shields.io noise leaks into what', () => {
    readme('# X\n\n[![badge](https://shields.io/x)](https://y)\n\nThe real one-line description of this project lives here.\n');
    const what = relentlessContext(dir).what ?? '';
    expect(what).not.toContain('shields.io');
    expect(what).toContain('real one-line description');
  });
});

describe('WJTTC ENGINE: Relentless provenance (the auditable form)', () => {
  test('detailed carries {value, source, confidence} per slot', () => {
    pkg({ description: 'A tool that transforms project files into AI context for assistants' });
    const what = relentlessContextDetailed(dir).what;
    expect(what?.value).toContain('transforms project files');
    expect(what?.source).toBe('package.json:description');
    expect(typeof what?.confidence).toBe('number');
    expect(what!.confidence).toBeGreaterThan(0);
    expect(what!.confidence).toBeLessThanOrEqual(1);
  });

  test('source names the artifact + locus (package.json field vs README heading)', () => {
    pkg({ scripts: { build: 'tsc', start: 'node x' }, repository: { url: 'git+https://github.com/Wolfe-Jam/x.git' } });
    readme('# X\n\n## Why\nOur mission is to eliminate the context tax that wastes hours every week.\n');
    const d = relentlessContextDetailed(dir);
    expect(d.how?.source).toBe('package.json:scripts');
    expect(d.where?.source).toBe('package.json:repository');
    expect(d.why?.source).toBe('README:## Why');     // the matched heading rides the label
  });

  test('confidence ranks by source quality: structured field > named section > heuristic', () => {
    // structured field
    pkg({ description: 'A tool that transforms project files into AI context for assistants' });
    const structured = relentlessContextDetailed(dir).what!.confidence;
    rmSync(join(dir, 'package.json'), { force: true });
    // named section
    readme('# X\n\n## Purpose\nGives AI assistants permanent project memory across every session.\n');
    const section = relentlessContextDetailed(dir).what!.confidence;
    rmSync(join(dir, 'README.md'), { force: true });
    // heuristic match
    readme('# X\n\nIt solves the problem of context re-discovery on every new chat session.\n');
    const heuristic = relentlessContextDetailed(dir).what!.confidence;
    expect(structured).toBeGreaterThan(section);
    expect(section).toBeGreaterThan(heuristic);
  });

  test('bare relentlessContext is EXACTLY the value-projection of detailed (no drift)', () => {
    pkg({ description: 'A tool that transforms project files into AI context for assistants', scripts: { build: 'tsc' } });
    readme('# X\n\n## Why\nOur mission is to eliminate the context tax across teams everywhere.\n');
    const bare = relentlessContext(dir);
    const detailed = relentlessContextDetailed(dir);
    const projected = Object.fromEntries(Object.entries(detailed).map(([k, v]) => [k, (v as any).value]));
    expect(bare).toEqual(projected);
  });

  test('sourced-or-empty holds in the detailed form too (no evidence → {})', () => {
    expect(relentlessContextDetailed(dir)).toEqual({});
  });
});

describe('WJTTC BRAKE: README noise is not prose (Facts Edition)', () => {
  test('HTML comment blocks never seed a slot', () => {
    readme([
      '<!--',
      '  MARKETING NOTES: asset budget < 12 MB. Ship light + dark variants.',
      '  All images live under .github/assets/.',
      '-->',
      '# My Project',
      '',
      '## About',
      '',
      'A real description of what the project actually does for its users.',
    ].join('\n'));
    const ctx = relentlessContext(dir);
    expect(ctx.what ?? '').not.toMatch(/asset budget|MARKETING NOTES/);
  });

  test('link-list section body (roadmap link row) is rejected for `when`', () => {
    readme([
      '# P', '',
      '## Roadmap', '',
      '[Vote on the roadmap](https://x.com/roadmap) · [Discussions](https://x.com/d) · [Releases](https://x.com/r) · [Changelog](https://x.com/c)',
    ].join('\n'));
    const ctx = relentlessContext(dir);
    expect(ctx.when ?? '').not.toMatch(/https?:\/\//);
  });

  test('pre-release blockquote banner never seeds `what` — real prose wins', () => {
    readme([
      '> ⚠️ **Nightly release for early testing.** Expect rough edges. Stable version coming soon — please open an issue if you hit anything.',
      '',
      '<a href="x"><img src="logo.png"></a>',
      '',
      '# Fix agents faster',
      '',
      '**The open-source platform for shipping self-improving AI agents.** Evaluations, tracing, guardrails — one platform, one feedback loop.',
    ].join('\n'));
    const what = relentlessContext(dir, { toolingRoot: true }).what ?? '';
    expect(what).not.toMatch(/nightly|rough edges|early testing/i);
    expect(what).toMatch(/open-source platform for shipping self-improving/);
  });

  test('nav / link row is not a description', () => {
    readme([
      '# P', '',
      'Try Cloud (Free) · Self-Host · Docs · Blog · Discord', '',
      '**A platform for evaluating and guardrailing production AI agents at scale.**',
    ].join('\n'));
    const what = relentlessContext(dir, { toolingRoot: true }).what ?? '';
    expect(what).not.toMatch(/Try Cloud|Self-Host|Discord/);
    expect(what).toMatch(/evaluating and guardrailing/);
  });

  test('toolingRoot skips package.json-sourced context (polyglot repo)', () => {
    pkg({ description: 'Repo-level tooling (husky + lint-staged). App code lives in frontend/ and backend/.' });
    readme('# P\n\n## Why\n\nBecause production agents need a shared definition of done.\n');
    const withPkg = relentlessContext(dir);
    const noPkg = relentlessContext(dir, { toolingRoot: true });
    expect(withPkg.what ?? '').toMatch(/husky/);
    expect(noPkg.what ?? '').not.toMatch(/husky/);
    expect(noPkg.why ?? '').toMatch(/shared definition/); // README still flows
  });
});
