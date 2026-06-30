/**
 * `faf skill-score <path>` — score a SKILL.md against the WJTTC skill standard.
 *
 * Static grade (0-100, the durable readable score) + a SAFETY gate (fatal rules).
 * The ACTIVATION gate is always PENDING: a CLI command cannot spawn agents to run
 * the skill, so the behavioral half (the receipt) is out of scope here — by design.
 *
 * Ported from faf-skill-scorer (rules.mjs / engine.mjs, static-v6). Additive, non-breaking.
 */

import { existsSync, statSync } from 'fs';
import { basename, dirname, join } from 'path';
import { loadSkill, runSuite } from '../skill-score/index.js';
import type { ScorerOutput } from '../skill-score/index.js';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

export interface SkillScoreOptions { json?: boolean; }

/** Resolve <path> to the skill DIR that holds SKILL.md (accept the dir OR the SKILL.md path). */
function resolveSkillDir(path: string): string {
  if (basename(path).toLowerCase() === 'skill.md') return dirname(path);
  try { if (statSync(path).isFile()) return dirname(path); } catch { /* not stat-able → treat as a dir */ }
  return path;
}

function verdictIcon(verdict: string): string {
  switch (verdict) {
    case 'beat': return '⭐';
    case 'fail': return '⚠️ ';
    case 'na':   return dim('· ');
    default:     return '✅';
  }
}

function printReport(res: ScorerOutput): void {
  const safety = res.gates.safety === 'pass' ? fafCyan('✓') : orange('✗');
  const activation = res.gates.activation === 'pass' ? fafCyan('✓')
    : res.gates.activation === 'fail' ? orange('✗')
    : dim('⧖ PENDING');
  const flag = res.flies ? orange('🏁 FLIES') : dim('🏁 locked');

  console.log('');
  console.log(`  ${fafCyan(bold('skill-score'))} ${dim(`— ${res.skill} · ${res.scorerVersion} · inv ${res.invVersion}`)}`);
  console.log('');
  console.log(`  🛑 SAFETY ${safety}    ⚙️  ACTIVATION ${activation}    ${flag}`);
  console.log('');
  console.log(`  grade ${bold(`${res.grade}/100`)}  ${res.tier.symbol} ${bold(res.tier.name)}`);
  console.log('');

  for (const mod of ['BRAKE', 'AERO', 'PIT']) {
    const ms = res.modScores[mod];
    if (!ms) continue;
    console.log(`  ${dim(mod.padEnd(6))} ${bold(`${ms.score}`.padStart(3))}/${ms.max}`);
    for (const row of ms.rows) {
      const detail = row.detail ? dim(` — ${row.detail}`) : '';
      console.log(`    ${verdictIcon(row.verdict)} ${row.title}${detail}`);
      if (row.verdict === 'fail' && row.fix) console.log(`       ${dim(`fix: ${row.fix}`)}`);
    }
    console.log('');
  }

  if (res.signoffs.length) {
    console.log(`  ${orange('sign-off review:')} ${res.signoffs.map((s) => s.id).join(', ')}`);
    console.log('');
  }
}

export function skillScoreCommand(path: string, options: SkillScoreOptions = {}): void {
  const dir = resolveSkillDir(path);
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) {
    console.error(`No SKILL.md found at ${dir} (pass a skill directory or a path to its SKILL.md)`);
    process.exit(1);
  }

  const ctx = loadSkill(dir);
  const res = runSuite(ctx);

  if (options.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    printReport(res);
  }

  process.exit(res.fatal ? 1 : 0);
}
