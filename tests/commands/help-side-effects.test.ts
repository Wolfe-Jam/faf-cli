import { describe, test, expect, afterAll } from 'bun:test';
import { realpathSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { tempDirs } from '../helpers/temp-dirs.js';

const tempFolders = tempDirs();
afterAll(() => tempFolders.removeAll());

const CLI = join(import.meta.dir, '../../src/cli.ts');
const plain = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, '');

function run(args: string[], cwd: string) {
  const home = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-help-home-')));
  const env = { ...process.env, HOME: home, NO_COLOR: '1' };
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf-8', env });
  return { status: r.status, out: plain(`${r.stdout}${r.stderr}`) };
}

describe('AERO: faf --help says what each command touches', () => {
  const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-help-')));
  const help = run(['--help'], dir).out;

  test('the footer names the read-only commands, what sends data, and the docs page', () => {
    expect(help).toContain('What touches what:');
    expect(help).toContain('ai analyze (Anthropic API) · bench --submit (mcpaas.live)');
    expect(help).toContain('https://docs.faf.one/side-effects');
  });

  test('every command the footer calls read-only is a real command', () => {
    const line = help.split('\n').find(l => l.trimStart().startsWith('read-only')) ?? '';
    const names = line.replace(/^\s*read-only\s+/, '').replace(/,.*$/, '').split(/\s+/).filter(Boolean);
    expect(names.length).toBeGreaterThan(5);
    for (const name of names) {
      expect(help).toMatch(new RegExp(`^  ${name} `, 'm'));
    }
  });

  test('descriptions state the side effect people need before running', () => {
    expect(help).toContain('nothing is sent');               // share
    expect(help).toContain('Print .faf as YAML or JSON (writes nothing)'); // convert
    expect(help).toContain('sends it to the Anthropic API'); // ai
    expect(help).toContain('--write creates it');             // taf setup
  });
});

describe('BRAKE: hidden `faf validate` alias', () => {
  test('validates the discovered project.faf instead of crashing', () => {
    const dir = realpathSync(tempFolders.mkdtemp(join(tmpdir(), 'faf-validate-')));
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","version":"1.0.0"}');
    expect(run(['init'], dir).status).toBe(0);

    const bare = run(['validate'], dir);
    expect(bare.out).not.toContain('ERR_INVALID_ARG_TYPE');
    expect(bare.status).toBe(0);

    const named = run(['validate', 'project.faf'], dir);
    expect(named.out).not.toContain('too many arguments');
    expect(named.status).toBe(0);
  });
});
