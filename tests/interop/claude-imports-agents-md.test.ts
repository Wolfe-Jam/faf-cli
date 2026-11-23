import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { writeFaf } from '../../src/interop/faf.js';
import { renderClaudeMd, agentsMdBeside } from '../../src/interop/claude.js';
import { removeTemp, spawnLimit } from '../helpers/windows-timing.js';

/**
 * #266: Claude Code reads AGENTS.md only when there is no CLAUDE.md
 * (dokimi `repo reach`, Claude Code 2.1.330). faf writes both, so the
 * CLAUDE.md block imports AGENTS.md when one sits beside it.
 */
const DATA = { faf_version: '3.0', project: { name: 'imports-test', goal: 'Test the import', main_language: 'TypeScript' } };

describe('ENGINE: CLAUDE.md imports AGENTS.md (#266)', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `faf-266-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    removeTemp(dir);
  });

  test('the import is one line, @AGENTS.md, under its own heading', () => {
    const md = renderClaudeMd(DATA, 'project.faf', { importAgentsMd: true });
    expect(md).toContain('## Build, test and repo rules\n\n@AGENTS.md\n');
    expect(md.match(/^@AGENTS\.md$/gm)).toHaveLength(1);
    // before the sync footer, so it sits inside faf's block
    expect(md.indexOf('@AGENTS.md')).toBeLessThan(md.indexOf('STATUS: SYNC ACTIVE'));
  });

  test('no import without the option (the default)', () => {
    expect(renderClaudeMd(DATA)).not.toContain('@AGENTS.md');
    expect(renderClaudeMd(DATA, 'project.faf', { importAgentsMd: false })).not.toContain('@AGENTS.md');
  });

  test('agentsMdBeside: false with no AGENTS.md', () => {
    expect(agentsMdBeside(dir)).toBe(false);
    writeFileSync(join(dir, 'CLAUDE.md'), '# hand-written\n');
    expect(agentsMdBeside(dir)).toBe(false);
  });

  test('agentsMdBeside: true with an AGENTS.md, with or without a CLAUDE.md', () => {
    writeFileSync(join(dir, 'AGENTS.md'), '# AGENTS.md\n');
    expect(agentsMdBeside(dir)).toBe(true);
    writeFileSync(join(dir, 'CLAUDE.md'), '# CLAUDE.md\n');
    expect(agentsMdBeside(dir)).toBe(true);
  });

  // Windows needs a privilege to create symlinks.
  test.skipIf(process.platform === 'win32')('agentsMdBeside: false when CLAUDE.md is a link to AGENTS.md (it would import itself)', () => {
    writeFileSync(join(dir, 'AGENTS.md'), '# AGENTS.md\n');
    symlinkSync('AGENTS.md', join(dir, 'CLAUDE.md'));
    expect(agentsMdBeside(dir)).toBe(false);
  });

  test('faf sync writes the import when AGENTS.md exists, and not before', () => {
    const cli = join(__dirname, '../../src/cli.ts');
    const run = (cmd: string) => execSync(`bun ${cli} ${cmd}`, { cwd: dir, encoding: 'utf-8', timeout: spawnLimit(30000) });
    writeFaf(join(dir, 'project.faf'), DATA);

    run('sync');
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf-8')).not.toContain('@AGENTS.md');

    writeFileSync(join(dir, 'AGENTS.md'), '# AGENTS.md\n\nbun run test\n');
    run('sync');
    const md = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(md.match(/^@AGENTS\.md$/gm)).toHaveLength(1);

    // a second sync keeps exactly one import
    run('sync');
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf-8').match(/^@AGENTS\.md$/gm)).toHaveLength(1);
  });
});
