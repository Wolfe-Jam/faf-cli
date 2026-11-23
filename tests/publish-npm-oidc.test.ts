/**
 * WJTTC BRAKE — npm publishes through OIDC Trusted Publishing, both names.
 *
 * From 8.11.1, a published GitHub release runs publish-npm.yml: no npm token in
 * the repo, id-token write, environment npm (the Trusted Publisher setting on
 * npmjs.com names this file and that environment). One bumps, both ship: the
 * same build goes out as faf-cli and as faf (8.10.1 reached faf-cli only).
 * A name already on npm (a hand publish) is skipped, never re-published.
 */

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const ROOT = join(import.meta.dir, '..');
const text = readFileSync(join(ROOT, '.github/workflows/publish-npm.yml'), 'utf-8');
const wf = parse(text);
const job = wf.jobs.publish;
const steps: Array<Record<string, any>> = job.steps;
const run = (name: string) => String(steps.find(s => String(s.name ?? '').startsWith(name))?.run ?? '');

describe('WJTTC BRAKE: publish-npm.yml (OIDC Trusted Publishing)', () => {
  test('runs on a published release, in environment npm, with id-token write and no token', () => {
    expect(wf.on.release.types).toEqual(['published']);
    expect(job.environment).toBe('npm');
    expect(job.permissions['id-token']).toBe('write');
    expect(text).not.toMatch(/NPM_TOKEN|_authToken|secrets\./);
    const node = steps.find(s => String(s.uses ?? '').startsWith('actions/setup-node'));
    expect(node?.with['node-version']).toBe('24.x'); // npm 11.5.1+ for Trusted Publishing
  });

  test('publishes faf-cli, then the same build as faf, and puts the name back', () => {
    const cli = run('npm publish faf-cli');
    expect(cli).toContain('unset NODE_AUTH_TOKEN');
    expect(cli).toContain('npm publish');
    const faf = run('npm publish faf ');
    expect(faf).toContain('unset NODE_AUTH_TOKEN');
    expect(faf).toContain('npm pkg set name=faf\n');
    expect(faf).toContain('--ignore-scripts'); // the build faf-cli shipped, not a second one
    expect(faf.trim().endsWith('npm pkg set name=faf-cli')).toBe(true);
    const order = steps.map(s => String(s.name ?? ''));
    expect(order.findIndex(n => n.startsWith('npm publish faf-cli'))).toBeLessThan(order.findIndex(n => n.startsWith('npm publish faf ')));
  });

  test('a name already on npm is skipped, each name on its own', () => {
    const exists = run('Already on npm?');
    expect(exists).toContain('for NAME in faf-cli faf');
    expect(exists).toContain('registry.npmjs.org/${NAME}/${VER}');
    expect(steps.find(s => String(s.name ?? '').startsWith('npm publish faf-cli'))?.if).toContain('skip_faf_cli');
    expect(steps.find(s => String(s.name ?? '').startsWith('npm publish faf '))?.if).toMatch(/skip_faf != /);
  });

  test('the release tag must equal package.json, and both names are confirmed on npm', () => {
    expect(run('package.json version == release tag')).toContain('GITHUB_REF_NAME#v');
    expect(run('Confirm both names')).toContain('for NAME in faf-cli faf');
  });
});
