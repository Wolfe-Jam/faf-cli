#!/usr/bin/env node
// check-engines.mjs — the Node engine floor must match what CI actually runs.
//
// House rule (memory: feedback-node-engine-floor-and-terminal-release-test):
// `engines.node` == the LOWEST Node in the CI workflows, never aspirational. You
// can't raise the floor without dropping that Node from CI (a visible,
// deliberate act), and you can't claim support for a Node the gate never runs.
// faf-cli receipt: the floor said >=18 while commander 14, open 11 and friends
// required >=20 — every package composing faf-cli inherited a false floor — and
// ci.yml ran [18, 20, 22] while release.yml ran [20, 22, 24].
//
// Mirrors faf-mcp's scripts/check-engines.mjs, and reads EVERY Node version in
// EVERY workflow — not just the first matrix in two files. 7.13 receipt: a
// second job with `node-version: [20, 22]` appended to release.yml passed,
// because only the first match per file was read. Every `node:` /
// `node-version:` value in every .github/workflows/*.yml (and *.yaml) counts:
//   - a flow list          node: [22.x, 24.x]      node-version: ['22', '24']
//   - a block list         node-version:\n  - 22\n  - 24
//   - a single value       node-version: 22        node-version: '22.x'
//   - an env reference     node-version: ${{ env.NODE_VERSION }} — resolved from
//                          the file's own `env:` blocks (every value that name
//                          has in the file counts)
//   - `${{ matrix.* }}`    skipped: the matrix list itself is read where it is
//   - a version file       node-version-file: .nvmrc — the named file (from the
//                          repo root) is read and its first line is the version
// Anything else (`lts/*`, `latest`, an unknown `${{ … }}`, a version file that
// cannot be read) is refused: the floor can't be checked against a version the
// script cannot read.
//
// Fails when any version is below the floor, or when the lowest version is not
// the floor. Runs in CI (Code Quality) and in prepublishOnly.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const enginesRaw = JSON.parse(read('package.json')).engines?.node ?? '';
const floorMatch = enginesRaw.match(/(\d+)/);
if (!floorMatch) {
  console.error(`✗ package.json engines.node missing or unparseable: ${JSON.stringify(enginesRaw)}`);
  process.exit(1);
}
const floor = Number(floorMatch[1]);

const WORKFLOWS = '.github/workflows';
let files = [];
try {
  files = readdirSync(join(root, WORKFLOWS))
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort()
    .map((f) => `${WORKFLOWS}/${f}`);
} catch {
  /* no workflows folder: reported below */
}

/** A YAML scalar without its trailing comment and quotes. */
function scalar(raw) {
  let s = raw.trim();
  if (!s.startsWith('"') && !s.startsWith("'")) {s = s.replace(/\s+#.*$/, '');}
  return s.trim().replace(/^(['"])(.*)\1$/, '$2').trim();
}

/** Each `NAME: value` in the file's `env:` blocks (a name may have several). */
function envOf(lines) {
  const env = new Map();
  for (let i = 0; i < lines.length; i++) {
    const head = /^(\s*)env:\s*(?:#.*)?$/.exec(lines[i]);
    if (!head) {continue;}
    const indent = head[1].length;
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === '' || line.trim().startsWith('#')) {continue;}
      const lead = line.length - line.trimStart().length;
      if (lead <= indent) {break;}
      const kv = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line);
      if (kv) {env.set(kv[1], [...(env.get(kv[1]) ?? []), scalar(kv[2])]);}
    }
  }
  return env;
}

/** The raw version strings one `node:` / `node-version:` key holds. */
function valuesAt(lines, i, rest, indent) {
  const value = rest.replace(/\s+#.*$/, '').trim();
  if (value.startsWith('[')) {
    return value.replace(/^\[|\]$/g, '').split(',').map(scalar).filter((v) => v !== '');
  }
  if (value !== '') {return [scalar(value)];}
  const items = []; // a block list under the key
  for (let j = i + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.trim() === '' || line.trim().startsWith('#')) {continue;}
    const item = /^(\s*)-\s+(.*)$/.exec(line);
    if (!item || item[1].length < indent) {break;}
    items.push(scalar(item[2]));
  }
  return items;
}

/** The major version a raw value names, or a reason it cannot be read. */
function majorsOf(raw, env) {
  const ref = /^\$\{\{\s*([^}]*?)\s*\}\}$/.exec(raw);
  if (ref) {
    if (/^matrix\./.test(ref[1])) {return { majors: [] };}
    const name = /^env\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(ref[1]);
    if (!name) {return { error: `${raw} is not a version faf can read` };}
    const values = env.get(name[1]);
    if (!values) {return { error: `${raw} — no \`${name[1]}:\` in this file's env` }; }
    const out = [];
    for (const v of values) {
      const r = majorsOf(v, new Map());
      if (r.error) {return r;}
      out.push(...r.majors);
    }
    return { majors: out };
  }
  const m = /^[v>=^~ ]*(\d+)(?:\.[\dx*]+)*$/.exec(raw);
  return m ? { majors: [Number(m[1])] } : { error: `'${raw}' is not a Node version number — pin one (e.g. ${floor})` };
}

/** The major version the first line of a `node-version-file:` names, or why it cannot be read. */
function majorsOfFile(raw) {
  const name = scalar(raw);
  if (name === '' || name.includes('${{')) {return { error: `'${name}' is not a file the script can read` };}
  let first;
  try {
    first = readFileSync(join(root, name), 'utf8').split(/\r?\n/)[0].trim();
  } catch (e) {
    return { error: `${name} cannot be read (${e.code ?? e.message}) — the floor cannot be checked against it` };
  }
  const r = majorsOf(first, new Map());
  return r.error ? { error: `${name}: ${r.error}` } : r;
}

let failed = false;
const found = []; // { file, line, major }
// Every `node:` / `node-version:` key in the file, list item keys included.
const NODE_KEY = /^([ \t]*)(?:-[ \t]+)?(node|node-version):(.*)$/gm;
// Every `node-version-file:` key (setup-node reads the version from that file).
const NODE_FILE_KEY = /^[ \t]*(?:-[ \t]+)?node-version-file:(.*)$/gm;

for (const file of files) {
  const text = read(file);
  const lines = text.split(/\r?\n/);
  const env = envOf(lines);
  for (const m of text.matchAll(NODE_KEY)) {
    const i = text.slice(0, m.index).split('\n').length - 1;
    for (const raw of valuesAt(lines, i, m[3], m[1].length)) {
      const r = majorsOf(raw, env);
      if (r.error) {
        console.error(`✗ ${file}:${i + 1} ${m[2]}: ${r.error}`);
        failed = true;
        continue;
      }
      for (const major of r.majors) {found.push({ file, line: i + 1, major });}
    }
  }
  for (const m of text.matchAll(NODE_FILE_KEY)) {
    const i = text.slice(0, m.index).split('\n').length - 1;
    const r = majorsOfFile(m[1].replace(/\s+#.*$/, ''));
    if (r.error) {
      console.error(`✗ ${file}:${i + 1} node-version-file: ${r.error}`);
      failed = true;
      continue;
    }
    for (const major of r.majors) {found.push({ file, line: i + 1, major });}
  }
}

if (found.length === 0 && !failed) {
  console.error(`✗ no Node version found in ${WORKFLOWS}/*.yml — the floor (${floor}) cannot be checked`);
  process.exit(1);
}

for (const f of found.filter((x) => x.major < floor)) {
  console.error(
    `✗ ${f.file}:${f.line} runs Node ${f.major}, below the engine floor — package.json engines.node = "${enginesRaw}".\n` +
      `  Make them agree: lower the floor to ${f.major}, or drop Node ${f.major} from ${f.file} on purpose.`,
  );
  failed = true;
}

const lowest = Math.min(...found.map((x) => x.major));
if (found.length > 0 && lowest > floor) {
  console.error(
    `✗ engine floor drift — package.json engines.node = "${enginesRaw}", but the lowest Node any workflow runs is ${lowest}.\n` +
      `  Make them equal: raise the floor to ${lowest}, or run Node ${floor} in CI.`,
  );
  failed = true;
}

if (failed) {process.exit(1);}
for (const file of files) {
  const majors = [...new Set(found.filter((x) => x.file === file).map((x) => x.major))].sort((a, b) => a - b);
  if (majors.length > 0) {console.log(`✓ ${file} — Node ${majors.join(', ')}`);}
}
console.log(`✓ engine floor ${floor} == the lowest Node in CI (${lowest}); no workflow runs below it`);
