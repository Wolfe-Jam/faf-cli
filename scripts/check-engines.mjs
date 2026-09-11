#!/usr/bin/env node
// check-engines.mjs — the Node engine floor must match what CI actually runs.
//
// House rule (memory: feedback-node-engine-floor-and-terminal-release-test):
// `engines.node` == the LOWEST Node in the CI matrix, never aspirational. You
// can't raise the floor without dropping that Node from CI (a visible,
// deliberate act), and you can't claim support for a Node the gate never runs.
// faf-cli receipt: the floor said >=18 while commander 14, open 11 and friends
// required >=20 — every package composing faf-cli inherited a false floor — and
// ci.yml ran [18, 20, 22] while release.yml ran [20, 22, 24].
//
// Mirrors faf-mcp's scripts/check-engines.mjs, and checks BOTH matrices here:
// ci.yml's Node smoke matrix and release.yml's test matrix.
//
// Runs in CI (Code Quality) and in prepublishOnly.

import { readFileSync } from 'node:fs';
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

// The Node matrices — ci.yml writes `node: [22.x, 24.x]`, release.yml writes
// `node-version: ['22', '24']`. Each file must have one, and its low must equal the floor.
const MATRICES = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];
let failed = false;
for (const file of MATRICES) {
  const yml = read(file);
  const matrixMatch = yml.match(/\bnode(?:-version)?:\s*\[([^\]]+)\]/);
  if (!matrixMatch) {
    console.error(`✗ ${file} — could not find a \`node: [ ... ]\` / \`node-version: [ ... ]\` matrix`);
    failed = true;
    continue;
  }
  const matrix = matrixMatch[1]
    .split(',')
    .map((s) => Number(s.replace(/['"\s]/g, '').replace(/\.x$/, '')))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (matrix.length === 0) {
    console.error(`✗ ${file} — Node matrix parsed empty`);
    failed = true;
    continue;
  }
  const ciMin = matrix[0];
  if (floor !== ciMin) {
    console.error(
      `✗ engine floor drift — package.json engines.node = ">=${floor}", ${file} Node matrix low = ${ciMin} (matrix: ${matrix.join(', ')}).\n` +
        `  Make them equal: lower the floor to ${ciMin}, or drop Node ${ciMin} from ${file} on purpose.`,
    );
    failed = true;
    continue;
  }
  console.log(`✓ engine floor ${floor} == ${file} Node matrix low ${ciMin} (matrix: ${matrix.join(', ')})`);
}
if (failed) {process.exit(1);}
