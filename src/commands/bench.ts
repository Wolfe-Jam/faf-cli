/**
 * faf bench — the AI-grounding benchmark (P1, agent-native).
 *
 * Measures the thing FAF sells, falsifiably: AI works better and faster WITH
 * structured context. Two numbers, one harness — grounding ACCURACY (N
 * project questions, cold vs with-faf) and grounding COST (tokens to get
 * grounded, as reported by the runner).
 *
 * The unfair advantage: the .faf IS the answer key. Questions derive from the
 * populated active slots; grading is mechanical (normalize + versioned alias
 * map + significant-token containment — no judge, no rubric drift). The
 * question-set hash rides a ✪ receipt, parity-hash discipline.
 *
 * DOCTRINE (wolfejam 2026-06-11):
 *  - "A low score is an ALARM BELL — you are hemorrhaging tokens and the AI
 *    is pretty much clueless about what you are doing, even trying to do."
 *    Headline: "Trouble ahead, expensive trouble."
 *  - NEVER render a low score alone — always the pair (cold → with-faf), or
 *    the alarm framing with headroom. The delta is the product; the cold
 *    number belongs to the ABSENCE of context ("without context"), never to
 *    FAF. Output always ends in a prescription, never a verdict.
 *  - The 6Ws are UNDERIVABLE from code: cold exploration can dig out a stack
 *    (you pay for the dig); it can never find intent.
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { findFafFile, readFafRaw } from '../interop/faf.js';
import { scoreFafYaml } from '../core/scorer.js';
import { SLOTS, readSlotValue, PLACEHOLDERS } from '../core/slots.js';
import { parse as parseYAML } from 'yaml';
import { bold, dim, fafCyan, orange } from '../ui/colors.js';

/** Bump when phrasing, aliases, or grading rules change — part of the qset hash. */
export const BENCH_VERSION = 'faf-bench/1';

export interface BenchQuestion {
  n: number;
  path: string;
  question: string;
}

/** Stable question phrasing per slot path (fallback: templated from slot description). */
const PHRASINGS: Record<string, string> = {
  'project.name': "What is the project's name?",
  'project.goal': "What is the project's goal — what is it for?",
  'project.main_language': 'What is the primary programming language?',
  'human_context.who': 'Who is this project for?',
  'human_context.what': 'What are they building?',
  'human_context.why': 'Why does this project exist?',
  'human_context.where': 'Where does it run or get distributed?',
  'human_context.when': "When — what is the project's timeline or stage?",
  'human_context.how': 'How is it built or used?',
};

function questionFor(path: string, description: string): string {
  return PHRASINGS[path] ?? `What is the project's ${description.replace(/\s*\(.*\)$/, '').toLowerCase()}?`;
}

/**
 * Versioned alias groups — mechanical equivalences, no fuzzy scoring.
 * Members are compared post-normalization. Extend deliberately; every change
 * bumps the qset hash via BENCH_VERSION.
 */
export const ALIAS_GROUPS: string[][] = [
  ['typescript', 'ts'],
  ['javascript', 'js'],
  ['python', 'py', 'python3'],
  ['node', 'nodejs', 'node js', 'node.js'],
  ['github actions', 'gh actions', 'actions'],
  ['postgresql', 'postgres', 'pg'],
  ['kubernetes', 'k8s'],
  ['npm', 'npm registry'],
  ['cloudflare workers', 'cf workers', 'workers'],
  ['google cloud run', 'cloud run', 'gcp cloud run'],
];

const ALIAS_LOOKUP = new Map<string, number>();
ALIAS_GROUPS.forEach((group, i) => group.forEach((m) => ALIAS_LOOKUP.set(m, i)));

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'is',
  'it', 'its', 'their', 'your', 'via', 'by', 'using', 'use', 'used',
]);

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s.+#-]/g, ' ') // keep tech-name chars (c++, c#, node.js, faf-cli)
    .replace(/\.(?=\s|$)/g, ' ')      // trailing dots
    .replace(/\s+/g, ' ')
    .trim();
}

function significantTokens(s: string): string[] {
  return normalizeAnswer(s).split(' ').filter((t) => t && !STOPWORDS.has(t));
}

/**
 * Mechanical match: exact normalized equality, alias-group equality, or
 * every significant token of the EXPECTED value present in the answer
 * (deterministic set containment — handles sentence-shaped 6W answers
 * without a judge). A miss is a miss.
 */
export function answersMatch(expected: string, given: string): boolean {
  const e = normalizeAnswer(expected);
  const g = normalizeAnswer(given);
  if (!e || !g) return false;
  if (e === g) return true;
  const ea = ALIAS_LOOKUP.get(e);
  if (ea !== undefined && ALIAS_LOOKUP.get(g) === ea) return true;
  const need = significantTokens(expected);
  if (need.length === 0) return false;
  const have = new Set(significantTokens(given));
  return need.every((t) => {
    if (have.has(t)) return true;
    const ta = ALIAS_LOOKUP.get(t);
    return ta !== undefined && [...have].some((h) => ALIAS_LOOKUP.get(h) === ta);
  });
}

export interface QuestionSet {
  version: string;
  qsetHash: string;
  questions: BenchQuestion[];
  /** Internal answer key — NEVER printed by `questions`; used by `grade`. */
  answers: Record<number, string>;
}

/** Derive the question set + answer key from a project.faf (active populated slots only). */
export function deriveQuestionSet(yaml: string): QuestionSet {
  const result = scoreFafYaml(yaml);
  const data = parseYAML(yaml) as Record<string, unknown>;

  const questions: BenchQuestion[] = [];
  const answers: Record<number, string> = {};
  let n = 0;

  for (const slot of SLOTS) {
    // Active + populated only — slotignored is the What-Not, never a quiz topic.
    if (result.slots[slot.path] !== 'populated') continue;
    const value = readSlotValue(data, slot);
    if (typeof value !== 'string') continue;
    const v = value.trim();
    if (!v || PLACEHOLDERS.has(v.toLowerCase())) continue;
    n += 1;
    questions.push({ n, path: slot.path, question: questionFor(slot.path, slot.description) });
    answers[n] = v;
  }

  // Hash covers version + paths + phrasings (NOT answers — the key isn't the set).
  const projection = JSON.stringify({
    v: BENCH_VERSION,
    q: questions.map((q) => [q.path, q.question]),
  });
  const qsetHash = createHash('sha256').update(projection).digest('hex').slice(0, 12);

  return { version: BENCH_VERSION, qsetHash, questions, answers };
}

/**
 * The answer-key-safe projection of a QuestionSet — version + qsetHash +
 * questions, NEVER `answers`. Any "give me the questions" surface (MCP tools,
 * UIs) MUST hand out THIS, not the raw QuestionSet: a tool that prints the
 * answer key makes the benchmark a lie. The CLI's `bench questions` follows
 * the same rule.
 */
export function publicQuestions(qset: QuestionSet): {
  version: string;
  qsetHash: string;
  questions: BenchQuestion[];
} {
  return { version: qset.version, qsetHash: qset.qsetHash, questions: qset.questions };
}

export interface GradeResult {
  correct: number;
  total: number;
  misses: BenchQuestion[];
  perQuestion: { n: number; path: string; ok: boolean }[];
}

export function gradeAnswers(qset: QuestionSet, given: Record<string, string>): GradeResult {
  const perQuestion = qset.questions.map((q) => {
    const ans = given[String(q.n)] ?? given[q.path] ?? '';
    return { n: q.n, path: q.path, ok: typeof ans === 'string' && ans.trim() !== '' && answersMatch(qset.answers[q.n], ans) };
  });
  const misses = qset.questions.filter((q) => !perQuestion[q.n - 1].ok);
  return { correct: perQuestion.filter((r) => r.ok).length, total: qset.questions.length, misses, perQuestion };
}

export interface RunRecord {
  score: number;
  total: number;
  tokens?: number;
  model?: string;
}

export interface BenchState {
  version: string;
  qsetHash: string;
  protocol: 'in-session';
  cold?: RunRecord;
  faf?: RunRecord;
}

const STATE_FILE = '.faf-bench.json';

function loadState(dir: string): BenchState | null {
  const p = join(dir, STATE_FILE);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as BenchState;
  } catch {
    return null;
  }
}

function saveState(dir: string, state: BenchState): void {
  writeFileSync(join(dir, STATE_FILE), JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

/** ✪ receipt — sha256 over the canonical projection; third-party verifiable. */
export function buildReceipt(state: BenchState): { projection: string; hash: string } {
  const projection = JSON.stringify({
    v: state.version,
    qset: state.qsetHash,
    protocol: state.protocol,
    cold: state.cold ?? null,
    faf: state.faf ?? null,
  });
  return { projection, hash: createHash('sha256').update(projection).digest('hex') };
}

const tok = (t?: number) => (t === undefined ? '—' : `~${t.toLocaleString()}`);

function printPair(state: BenchState, project: string): void {
  const c = state.cold!;
  const f = state.faf!;
  console.log(`\n${bold(`faf bench — ${project}`)}\n`);
  console.log(`           ${dim('without context')}    ${fafCyan('with .faf')}`);
  console.log(`answers    ${c.score}/${c.total}               ${bold(`${f.score}/${f.total}`)}`);
  console.log(`tokens     ${tok(c.tokens)}            ${tok(f.tokens)}`);
  const gap = c.total - c.score;
  if (gap > 0) {
    console.log(`\n${dim(`The ${gap} missing answer${gap === 1 ? '' : 's'} were already in your repo — unstructured.`)}`);
    console.log(dim('Structured context closes the gap.'));
  }
  const r = buildReceipt(state);
  console.log(`\n${orange('✪ BENCH RECEIPT')}`);
  console.log(dim(`  qset: ${state.qsetHash}   protocol: ${state.protocol}   model: ${f.model ?? c.model ?? 'unreported'}`));
  console.log(dim(`  cold ${c.score}/${c.total} · faf ${f.score}/${f.total} · sha256: ${r.hash.slice(0, 16)}…`));
}

function printColdAlarm(state: BenchState, project: string): void {
  const c = state.cold!;
  const gap = c.total - c.score;
  console.log(`\n${bold(`faf bench — ${project}`)}                ${orange('Trouble ahead, expensive trouble.')}\n`);
  console.log(`           ${dim('without context')}`);
  console.log(`answers    ${c.score}/${c.total}      ${dim('— the AI is guessing at what you are building')}`);
  if (c.tokens !== undefined) {
    console.log(`tokens     ${tok(c.tokens)}   ${dim('— re-derivation burn, paid again EVERY session')}`);
  }
  if (gap > 0) {
    console.log(`\n${gap} answer${gap === 1 ? '' : 's'} missing: the stack it can dig out (you pay for the dig);`);
    console.log('what you are trying to DO, it cannot derive at any price.');
    console.log('Both are already in your repo — unstructured.');
  }
  console.log(`\n${fafCyan('→ faf init && faf bench')}    ${dim('(close the gap, get the receipt)')}`);
}

export interface BenchOptions {
  json?: boolean;
  cold?: boolean;
  faf?: boolean;
  tokens?: string;
  model?: string;
  file?: string;
}

export function benchCommand(action?: string, answersFile?: string, options: BenchOptions = {}): void {
  const fafPath = options.file ?? findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one — bench needs the answer key.");
    process.exit(2);
  }
  const yaml = readFafRaw(fafPath);
  const qset = deriveQuestionSet(yaml);
  const dir = dirname(fafPath);
  const project = (parseYAML(yaml) as Record<string, any>)?.project?.name ?? dir.split('/').pop();

  if (qset.questions.length === 0) {
    console.error('Error: no populated slots to derive questions from.\n\n  Run `faf go` to fill the .faf first.');
    process.exit(2);
  }

  // ── faf bench questions ─────────────────────────────────────────────
  if (action === 'questions') {
    if (options.json) {
      console.log(JSON.stringify({ version: qset.version, qsetHash: qset.qsetHash, questions: qset.questions.map(({ n, question }) => ({ n, question })) }, null, 2));
      return;
    }
    console.log(`\n${bold(`faf bench — ${qset.questions.length} questions`)}  ${dim(`qset ${qset.qsetHash}`)}\n`);
    for (const q of qset.questions) console.log(`  ${String(q.n).padStart(2)}. ${q.question}`);
    console.log(`\n${dim('Answer terse — the value, not a sentence. Save as JSON: {"1": "...", "2": "..."}')}`);
    return;
  }

  // ── faf bench grade <answers.json> --cold | --faf ───────────────────
  if (action === 'grade') {
    if (!answersFile || !existsSync(answersFile)) {
      console.error('Error: faf bench grade <answers.json> — file not found.');
      process.exit(2);
    }
    const raw = JSON.parse(readFileSync(answersFile, 'utf-8'));
    const given: Record<string, string> = raw.answers ?? raw;
    const graded = gradeAnswers(qset, given);
    const run: RunRecord = {
      score: graded.correct,
      total: graded.total,
      ...(options.tokens ? { tokens: parseInt(options.tokens, 10) } : {}),
      ...(options.model ? { model: options.model } : {}),
    };

    const prior = loadState(dir);
    const state: BenchState =
      prior && prior.qsetHash === qset.qsetHash
        ? prior
        : { version: qset.version, qsetHash: qset.qsetHash, protocol: 'in-session' };

    if (options.cold) state.cold = run;
    else if (options.faf) state.faf = run;
    else {
      console.error('Error: specify the run mode — --cold (no context) or --faf (after reading project.faf).');
      process.exit(2);
    }
    saveState(dir, state);

    if (options.json) {
      const receipt = buildReceipt(state);
      console.log(JSON.stringify({ ...state, receipt: receipt.hash, perQuestion: graded.perQuestion }, null, 2));
      return;
    }

    // NEVER a lone low score: pair when both runs exist, alarm framing when cold-only.
    if (state.cold && state.faf) printPair(state, project);
    else if (state.cold) printColdAlarm(state, project);
    else {
      // faf-run-only: fine to show alone (it's the with-context number).
      console.log(`\n${bold(`faf bench — ${project}`)}   ${fafCyan('with .faf')}: ${bold(`${run.score}/${run.total}`)}  ${dim(`tokens ${tok(run.tokens)}`)}`);
      console.log(dim('Run the cold phase too for the full pair: faf bench (protocol).'));
    }
    return;
  }

  // ── faf bench (no action): the agent-native protocol ────────────────
  console.log(`\n${bold('faf bench — agent-native protocol')}  ${dim(`qset ${qset.qsetHash} · ${qset.questions.length} questions`)}\n`);
  console.log(`${bold('COLD phase')} ${dim('(fresh AI session, repo access)')}`);
  console.log(`  1. Instruct: "Answer these questions from the repository.`);
  console.log(`     Do NOT read project.faf, CLAUDE.md, AGENTS.md, or any *.faf file."`);
  console.log(`  2. ${fafCyan('faf bench questions')} — hand them over; answers terse, saved as cold.json`);
  console.log(`  3. ${fafCyan('faf bench grade cold.json --cold --tokens <used> --model <name>')}\n`);
  console.log(`${bold('FAF phase')} ${dim('(same questions, context first)')}`);
  console.log(`  4. Instruct: "Read project.faf, then answer the same questions." → faf.json`);
  console.log(`  5. ${fafCyan('faf bench grade faf.json --faf --tokens <used> --model <name>')}\n`);
  console.log(dim('Grading is mechanical against your own project.faf — the .faf IS the answer key.'));
  console.log(dim(`Receipts carry protocol: in-session (honor-system cold). qset ${qset.qsetHash}.`));
}
