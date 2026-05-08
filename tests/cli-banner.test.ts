/**
 * WJTTC — Nelly banner regression guard
 *
 * BRAKE: the Nelly elephant banner is the welcome moment of the cli. It has
 * regressed silently TWICE (grass-between-feet introduced in 9694e8c, fixed in
 * fa74012, silently re-introduced in 1b2c20b's IIFE wrap). This test snapshots
 * the exact byte-sequence of Nelly's three art rows so any future contamination
 * — well-intentioned or accidental — must explicitly update this test.
 *
 * If you're hitting this test and you ACTUALLY want to change Nelly:
 *   1. Have wolfejam approve the new shape (he is the canonical authority).
 *   2. Update SHAPE_CANONICAL below to match the new rendering.
 *   3. Don't ship the change unless it's been visually verified.
 *
 * If you're hitting this test and you DIDN'T mean to change Nelly:
 *   You probably refactored something near `process.argv.length <= 2` in cli.ts.
 *   Revert the Nelly lines specifically.
 */

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const CLI_SRC = readFileSync(join(__dirname, '../src/cli.ts'), 'utf-8');

/** The canonical Nelly shape — three art rows in order, dark/gray/legs.
 *  Approved by wolfejam: original March 23 (commit 7eb1042) for body shape;
 *  trunk-tip lifted 2026-05-08.
 *
 *  Row 1 (back arc):     ` ▄███████▄`
 *  Row 2 (body):         ` █▀███████`   ← eye is the subtle cell-3 ▀ notch
 *  Row 3 (legs + trunk): `▀▀ ██  ██ `   ← cell 2 `▀` is the trunk-tip lifted off ground
 *  Row 4 (grass line):   `▔▔▔▔▔▔▔▔▔▔▔▔`
 *
 *  NB: An inserted ASCII eye char (`-`, `·`, etc.) was tried and rejected
 *  2026-05-08 — monospace fonts render `-` narrower than `█`, breaking
 *  the silhouette (wolfejam: "adding the eye has added an entire | < column").
 *  The eye must come from half-block tricks ON existing cells, not by
 *  inserting characters of different visual width.
 */
const NELLY_ROW1 = '${DB} ${G}▄${GB}███████${DB}${G}▄${RS}';
const NELLY_ROW2_BODY = '${DB} ${GB}${G}█${DB}${G}▀${GB}███████${RS}';
const NELLY_ROW3_LEGS = '${DB}${G}▀${GB}${DF}▀${DB} ${GB}${G}██${DB}  ${GB}${G}██${DB} ${RS}';
const NELLY_ROW4_GRASS = '${GR}▔▔▔▔▔▔▔▔▔▔▔▔${RS}';

describe('WJTTC BRAKE: Nelly banner shape (canonical 2026-05-08)', () => {
  test('Row 1 — back arc is unchanged', () => {
    expect(CLI_SRC).toContain(NELLY_ROW1);
  });

  test('Row 2 — body uses pure half-block (no inserted ASCII char that would break silhouette width)', () => {
    expect(CLI_SRC).toContain(NELLY_ROW2_BODY);
    // Explicit guard: do NOT re-insert `-` or `·` etc. as the "eye" — they
    // render narrower than `█` in most monospace fonts, adding a visible gap.
    expect(CLI_SRC).not.toMatch(/\$\{GB\}\$\{DF\}-\$\{G\}/);
    expect(CLI_SRC).not.toMatch(/\$\{GB\}\$\{DF\}·\$\{G\}/);
  });

  test('Row 3 — trunk-tip lifted off the ground (cell 2 ▀ not ▄)', () => {
    expect(CLI_SRC).toContain(NELLY_ROW3_LEGS);
    // Explicit guard: cell 2 must not regress to lower-half-block ▄ (puts dark
    // square on the ground, what wolfejam called out 2026-05-08).
    expect(CLI_SRC).not.toContain('${GB}${DF}▄${DB} ${GB}${G}██');
  });

  test('Row 4 — single sharp green grass line (the underscore)', () => {
    expect(CLI_SRC).toContain(NELLY_ROW4_GRASS);
  });

  test('NO grass-between-feet regression (ed_░ characters between leg pillars)', () => {
    // Historical regression class: 9694e8c added "grass between feet" which
    // hid the eye and was rejected; fa74012 reverted; 1b2c20b silently re-
    // introduced via the IIFE wrap. Lock it out.
    expect(CLI_SRC).not.toMatch(/\$\{GR\}░\$\{GB\}\$\{G\}██/);
    expect(CLI_SRC).not.toMatch(/\$\{GR\}░░\$\{GB\}\$\{G\}██/);
  });
});
