/**
 * WJTTC — FAF spec conformance (P1: close the standard's test gap).
 *
 * The `@faf/specification` repo is specification-only (no tests/deps/code by
 * its own doctrine). So it owns the conformance CORPUS (data); this is the
 * RUNNER. Standards pattern (CommonMark/JSON-Schema-Test-Suite/WASM): the spec
 * ships fixtures + expected results; every implementation runs them.
 *
 * BRAKE: every corpus fixture validates/conforms exactly as expected.json says.
 * ENGINE: the schema compiles + every live format doc still states which
 * version of itself it is, and the retired binary pointer still says where the
 * live one went.
 *
 * Corpus resolves from the published @faf/specification, else the sibling faf
 * repo (local dev). Missing corpus = LOUD failure, never a silent skip.
 */

import { describe, test, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import * as kernel from '../../src/wasm/kernel.js';

function resolveSpecRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '../../node_modules/@faf/specification'), // installed devDep (CI + local)
    join(here, '../../../faf'), // sibling repo (local monorepo: ~/FAF/cli + ~/FAF/faf)
  ];
  try {
    candidates.unshift(dirname(require.resolve('@faf/specification/package.json')));
  } catch {
    /* require.resolve unavailable in this context — the path candidates cover it */
  }
  for (const root of candidates) {
    if (existsSync(join(root, 'conformance/expected.json'))) return root;
  }
  throw new Error(
    'FAF conformance corpus not found — ensure the @faf/specification devDep is installed (or the faf repo is a sibling). No silent skip.',
  );
}

const SPEC = resolveSpecRoot();
const CORPUS = join(SPEC, 'conformance');
const expected = JSON.parse(readFileSync(join(CORPUS, 'expected.json'), 'utf-8')) as {
  faf: Record<string, { validates: boolean }>;
  fafm: Record<string, { conforms: boolean }>;
};
const fafmSchema = JSON.parse(readFileSync(join(SPEC, 'schemas/fafm.schema.json'), 'utf-8'));

const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
const validateFafm = ajv.compile(fafmSchema);

describe('WJTTC BRAKE: .faf conformance (scoring kernel)', () => {
  for (const [rel, exp] of Object.entries(expected.faf)) {
    test(`${rel} → validates=${exp.validates}`, () => {
      const yaml = readFileSync(join(CORPUS, 'faf', rel), 'utf-8');
      let ok: boolean;
      try {
        ok = kernel.validate(yaml);
      } catch {
        ok = false;
      }
      expect(ok).toBe(exp.validates);
    });
  }
});

describe('WJTTC BRAKE: .fafm conformance (fafm.schema.json)', () => {
  for (const [rel, exp] of Object.entries(expected.fafm)) {
    test(`${rel} → conforms=${exp.conforms}`, () => {
      const raw = readFileSync(join(CORPUS, 'fafm', rel), 'utf-8');
      let conforms: boolean;
      try {
        conforms = validateFafm(parseYaml(raw)) as boolean;
      } catch {
        conforms = false;
      }
      expect(conforms).toBe(exp.conforms);
    });
  }
});

/** A doc says which version of itself it is. Two headings do that: the
 *  long-standing `**Version:** 1.1`, and the `**Specification:** 3.3.0` that
 *  SPECIFICATION.md moved to (spec repo `68185e5`, which also added the media
 *  type and its IANA date). What the spec calls the heading is the spec's to
 *  choose; that a number is stated at all is what faf-cli depends on. Matching
 *  one literal label made this test fail on a rename that stated MORE, not
 *  less — the tripwire tripped on the spec improving. */
const STATES_A_VERSION = /^\*\*(?:Version|Specification):\*\* *\d+(?:\.\d+)*/m;

/** BINARY-FORMAT.md in this repo is a retired pointer since `68185e5`: FAFb
 *  wire v2 lives in faf-rust, and the file says so in its first line. A
 *  pointer has no version of its own — what it must not lose is the forwarding
 *  address. */
const POINTS_AT_THE_LIVE_SPEC = /faf-rust[^\n]*BINARY-FORMAT\.md/;

describe('WJTTC ENGINE: spec integrity', () => {
  test('fafm.schema.json compiles as a JSON Schema', () => {
    expect(typeof validateFafm).toBe('function');
  });

  for (const doc of ['SPECIFICATION.md', 'MEMORY-FORMAT.md', 'AGENT-FORMAT.md']) {
    test(`${doc} states a version`, () => {
      expect(readFileSync(join(SPEC, doc), 'utf-8')).toMatch(STATES_A_VERSION);
    });
  }

  test('BINARY-FORMAT.md states a version, or points at the live FAFb spec', () => {
    const txt = readFileSync(join(SPEC, 'BINARY-FORMAT.md'), 'utf-8');
    expect(STATES_A_VERSION.test(txt) || POINTS_AT_THE_LIVE_SPEC.test(txt)).toBe(true);
  });
});
