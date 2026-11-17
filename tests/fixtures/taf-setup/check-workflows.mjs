#!/usr/bin/env node
// Checks every workflow `faf taf setup` writes, one per recipe:
//   node check-workflows.mjs <actionlint binary>
//
// 1. actionlint passes on it (syntax, expressions, job wiring).
// 2. The receipt job calls faf-taf-git's receipt.yml at the pinned version,
//    gives only inputs that version declares, and every input it requires.
//    The pinned receipt.yml is read from GitHub at that tag, so a release that
//    renames an input fails here, not in users' repos.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const actionlint = process.argv[2];
if (!actionlint) {
  console.error('usage: check-workflows.mjs <actionlint binary>');
  process.exit(2);
}
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const cli = join(repo, 'dist', 'cli.js');
const version = readFileSync(join(repo, 'src', 'commands', 'taf.ts'), 'utf-8').match(/FAF_TAF_GIT_VERSION = '(v[\d.]+)'/)?.[1];
if (!version) {
  console.error('::error::FAF_TAF_GIT_VERSION not found in src/commands/taf.ts');
  process.exit(1);
}

const res = await fetch(`https://raw.githubusercontent.com/Wolfe-Jam/faf-taf-git/${version}/.github/workflows/receipt.yml`);
if (!res.ok) {
  console.error(`::error::receipt.yml at ${version}: HTTP ${res.status}`);
  process.exit(1);
}
const declared = parse(await res.text()).on.workflow_call.inputs;
const required = Object.keys(declared).filter((k) => declared[k].required);

const RECIPES = {
  javascript: ['package.json', '{"name":"x","scripts":{"test":"jest"}}'],
  python: ['pyproject.toml', ''],
  go: ['go.mod', 'module x\n'],
  rust: ['Cargo.toml', '[package]\nname = "x"\n'],
  maven: ['pom.xml', '<project></project>'],
  gradle: ['build.gradle', ''],
  dotnet: ['App.sln', ''],
};

let failed = false;
let thisFailed = false;
const fail = (lang, msg) => { console.error(`::error::${lang}: ${msg}`); failed = true; thisFailed = true; };
for (const [lang, [file, body]] of Object.entries(RECIPES)) {
  thisFailed = false;
  const dir = mkdtempSync(join(tmpdir(), `taf-wf-${lang}-`));
  try {
    writeFileSync(join(dir, file), body);
    const setup = spawnSync(process.execPath, [cli, 'taf', 'setup', '--write'], { cwd: dir, encoding: 'utf-8' });
    if (setup.status !== 0) { fail(lang, `faf taf setup exited ${setup.status}: ${setup.stderr}`); continue; }
    const wfPath = join(dir, '.github', 'workflows', 'taf.yml');
    const lint = spawnSync(actionlint, [wfPath], { encoding: 'utf-8' });
    if (lint.status !== 0) { fail(lang, `actionlint:\n${lint.stdout}${lint.stderr}`); }
    const receipt = parse(readFileSync(wfPath, 'utf-8')).jobs.receipt;
    if (receipt.uses !== `Wolfe-Jam/faf-taf-git/.github/workflows/receipt.yml@${version}`) {
      fail(lang, `the receipt job uses ${receipt.uses}`);
    }
    const given = Object.keys(receipt.with ?? {});
    for (const k of given) { if (!(k in declared)) {fail(lang, `receipt.yml@${version} has no input "${k}"`);} }
    for (const k of required) { if (!given.includes(k)) {fail(lang, `receipt.yml@${version} requires "${k}"`);} }
    if (!thisFailed) {console.log(`✓ ${lang}: actionlint clean, receipt inputs match receipt.yml@${version} (${given.join(', ')})`);}
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
