/**
 * WJTTC — FAFb v2 round-trip parity (faf-cli WASM ↔ faf-fafb)
 *
 * BRAKE TIER. This is THE conformance gate.
 *
 * Same .faf input compiled by faf-cli (via faf-scoring-kernel WASM) MUST
 * produce byte-identical .fafb output to the faf-fafb reference golden
 * (crates/faf-fafb/tests/parity/golden.fafb).
 *
 * If this test fails, the cli has drifted from FAFb v2:
 *   (a) the WASM kernel was rebuilt from a different faf-fafb — rebuild it
 *       from ~/FAF/faf-rust/crates/faf-wasm-sdk.
 *   (b) the fixture was regenerated from a different compiler — copy the
 *       faf-fafb golden again, never invent bytes.
 *
 * Fixture provenance: copied from faf-fafb tests/parity (use_timestamp:false).
 */

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as kernel from '../src/wasm/kernel.js';

const FIXTURES = join(__dirname, 'fixtures/parity');

describe('WJTTC BRAKE: FAFb v2 round-trip parity gate (cli ↔ faf-fafb)', () => {
  test('cli compile is byte-identical to the faf-fafb golden', () => {
    const inputYaml = readFileSync(join(FIXTURES, 'parity-input.faf'), 'utf-8');
    const expectedBytes = readFileSync(join(FIXTURES, 'parity-expected.fafb'));

    const actualBytes = Buffer.from(kernel.compile(inputYaml));

    if (!actualBytes.equals(expectedBytes)) {
      const diffs: string[] = [];
      const maxLen = Math.max(actualBytes.length, expectedBytes.length);
      for (let i = 0; i < maxLen; i++) {
        const a = actualBytes[i];
        const e = expectedBytes[i];
        if (a !== e) {
          diffs.push(
            `offset ${i}: cli=${a !== undefined ? `0x${a.toString(16).padStart(2, '0')}` : 'EOF'} ref=${e !== undefined ? `0x${e.toString(16).padStart(2, '0')}` : 'EOF'}`,
          );
        }
      }
      throw new Error(
        `FAFb v2 byte-parity violated. cli=${actualBytes.length}b ref=${expectedBytes.length}b.\n` +
          `First ${Math.min(diffs.length, 16)} byte diff(s):\n  ${diffs.slice(0, 16).join('\n  ')}\n` +
          `\nRegenerate from faf-fafb:\n` +
          `  cp ~/FAF/faf-rust/crates/faf-fafb/tests/parity/golden.fafb tests/fixtures/parity/parity-expected.fafb\n`,
      );
    }

    expect(actualBytes.equals(expectedBytes)).toBe(true);
  });

  test('fixture has the canonical FAFb v2 header layout', () => {
    const bytes = readFileSync(join(FIXTURES, 'parity-expected.fafb'));
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('FAFB');
    expect(bytes[4]).toBe(2);
    expect(bytes[5]).toBe(0);
    // STRING_TABLE flag (bit 6)
    expect(bytes.readUInt16LE(6) & 0x0040).toBe(0x0040);
    for (let i = 12; i < 20; i++) {
      expect(bytes[i]).toBe(0);
    }
  });

  test('cli compile produces a non-zero CRC32 over the YAML source', () => {
    const inputYaml = readFileSync(join(FIXTURES, 'parity-input.faf'), 'utf-8');
    const bytes = Buffer.from(kernel.compile(inputYaml));
    const crc = bytes.readUInt32LE(8);
    expect(crc).toBeGreaterThan(0);
  });

  test('cli compile is itself deterministic — same input, same output across calls', () => {
    const inputYaml = readFileSync(join(FIXTURES, 'parity-input.faf'), 'utf-8');
    const bytes1 = Buffer.from(kernel.compile(inputYaml));
    const bytes2 = Buffer.from(kernel.compile(inputYaml));
    const bytes3 = Buffer.from(kernel.compile(inputYaml));
    expect(bytes1.equals(bytes2)).toBe(true);
    expect(bytes2.equals(bytes3)).toBe(true);
  });
});
