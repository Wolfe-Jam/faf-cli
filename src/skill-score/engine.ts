// WJTTC skill-scorer engine — ported from faf-skill-scorer/engine.mjs.
//
// loadSkill(dir) builds the scoring context from <dir>/SKILL.md; runSuite(ctx) runs
// the static RULES and returns the gate-model output: static IS the full 0-100 GRADE
// (durable, readable); behavioral (ENGINE/TYRE) is the ACTIVATION gate (pass/fail).
//
// CLI PORT NOTE: a CLI command cannot spawn agents, so the ACTIVATION gate cannot be
// run here — it is always 'pending'. (The standalone scorer reads a wired
// out/activation-*.json receipt; that path is intentionally NOT ported.)

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import inventoryJson from './inventory.json';
import { RULES, WEIGHTS, STATIC_MODULES, BEHAVIORAL, SCORER_VERSION } from './rules.js';
import { getTier, getNextTier } from '../core/tiers.js';
import type {
  Inventory, SkillContext, ScorerOutput, ModuleScore, Row, Gates, GateState, TierMark, ModuleName,
} from './types.js';

const inventory = inventoryJson as Inventory;

// Work-surface tier symbols (doctrine): ✪ on code/skills/CLI surfaces — NEVER 🏆 (social-only).
// faf-cli's tiers.ts renders 🏆 for TROPHY; we map the canonical tier NAME → the work-surface mark.
const WORK_SYMBOLS: Record<string, string> = {
  TROPHY: '✪', GOLD: '★', SILVER: '◆', BRONZE: '◇', GREEN: '●', YELLOW: '●', RED: '○', WHITE: '♡',
};

function mark(name: string): TierMark {
  return { name, symbol: WORK_SYMBOLS[name] ?? '?' };
}

export function parseFrontmatter(raw: string): { fm: Record<string, string>; fmKeys: string[]; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, fmKeys: [], body: raw };
  const fm: Record<string, string> = {};
  const keys: string[] = [];
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (mm) { fm[mm[1]] = mm[2].trim(); keys.push(mm[1]); }
  }
  return { fm, fmKeys: keys, body: raw.slice(m[0].length) };
}

function extractCode(body: string): string {
  // Join segments with a NON-whitespace sentinel so a command regex can't match
  // across a span boundary (e.g. `.faf` + `application/...` → false "faf application").
  let code = '';
  for (const m of body.matchAll(/```[\s\S]*?```/g)) code += ' ;; ' + m[0];
  for (const m of body.matchAll(/`([^`\n]+)`/g)) code += ' ;; ' + m[1];
  return code;
}

export function loadSkill(dir: string): SkillContext {
  const raw = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  const { fm, fmKeys, body } = parseFrontmatter(raw);
  return {
    dir, name: basename(dir), raw, fm, fmKeys, body,
    code: extractCode(body),
    lines: raw.split(/\r?\n/).length,
    tokens: Math.ceil(raw.length / 4),
    refs: [...new Set([...body.matchAll(/\b(references|scripts|assets)\/[\w./-]+/g)].map((m) => m[0]))],
    fileExists: (rel: string) => existsSync(join(dir, rel)),
    inv: inventory,
  };
}

export function runSuite(ctx: SkillContext): ScorerOutput {
  type Bucket = { rows: Row[]; applicable: number; passed: number; fatalFail: boolean };
  const byModule: Record<string, Bucket> = {};
  for (const mod of STATIC_MODULES) byModule[mod] = { rows: [], applicable: 0, passed: 0, fatalFail: false };

  for (const rule of RULES) {
    const r = rule.run(ctx);
    const row: Row = {
      id: rule.id, module: rule.module, title: rule.title, verdict: r.verdict,
      detail: r.detail, fix: r.fix, fatal: !!rule.fatal, signoff: !!rule.signoff,
    };
    const mb = byModule[rule.module];
    mb.rows.push(row);
    if (r.verdict !== 'na') { mb.applicable++; if (r.verdict === 'pass' || r.verdict === 'beat') mb.passed++; }
    if (rule.fatal && r.verdict === 'fail') mb.fatalFail = true;
  }

  const modScores: Record<string, ModuleScore> = {};
  let staticSubtotal = 0;
  let fatal = false;
  for (const mod of STATIC_MODULES) {
    const mb = byModule[mod];
    const frac = mb.applicable ? mb.passed / mb.applicable : 1;
    const score = Math.round(frac * WEIGHTS[mod]);
    modScores[mod] = { score, max: WEIGHTS[mod], frac, rows: mb.rows, applicable: mb.applicable, passed: mb.passed, fatalFail: mb.fatalFail };
    staticSubtotal += score;
    if (mb.fatalFail) fatal = true;
  }

  // GATE MODEL: static IS the full 0-100 GRADE; behavioral = a pass/fail GATE (not graded).
  const GRADE_MAX = STATIC_MODULES.reduce((a: number, m: ModuleName) => a + WEIGHTS[m], 0); // = 100
  const grade = staticSubtotal;                                                              // 0-100, the durable readable grade

  // ACTIVATION gate: a CLI command cannot spawn agents to run the skill, so it is always pending.
  const activation: GateState = 'pending';
  const gates: Gates = { safety: fatal ? 'fail' : 'pass', activation, activationRuns: null };
  const flies = grade === GRADE_MAX && gates.safety === 'pass' && gates.activation === 'pass';
  const signoffs = STATIC_MODULES.flatMap((m) => modScores[m].rows).filter((r) => r.signoff && r.verdict === 'fail');

  const next = getNextTier(grade);

  return {
    scorerVersion: SCORER_VERSION, invVersion: ctx.inv.version, skill: ctx.fm.name || ctx.name,
    modScores, grade, gradeMax: GRADE_MAX, staticSubtotal, staticMax: GRADE_MAX,
    gates, flies, behavioral: BEHAVIORAL,
    tier: mark(getTier(grade).name),
    nextTier: next ? mark(next.name) : null,
    fatal, signoffs,
    provisional: grade, // back-compat alias
  };
}
