import { createInterface, emitKeypressEvents } from 'readline';
import { dirname, join } from 'path';
import { aliasKeptNote, findFafFile, readFaf, readFafRaw, withKernel, writeFaf } from '../interop/faf.js';
import { SLOTS, SLOTIGNORED, isPlaceholder, isTypedWords } from '../core/slots.js';
import type { SlotDef } from '../core/types.js';
import { helpForSlot, questionForSlot } from '../core/interview.js';
import { suggestIntent, isIntentPath, type IntentPath, type IntentSuggestions } from '../core/suggest.js';
import { displayWidth } from '../ui/text-width.js';
import { startField, fieldKey, renderField, type FieldDone, type FieldKey } from '../ui/suggest-field.js';
import { getNestedValue, setNestedValue, blockingStep, blockedMessage } from '../core/dot-path.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { FafDNAManager } from '../core/faf-dna.js';
import { sayWhyDnaIsLeft } from './dna.js';
import { bold, dim, fafCyan } from '../ui/colors.js';
import { assertProjectCwd } from '../core/cwd-guard.js';
import { readBytesIfPresent, resolveInside, SafePathError, safeReplaceOwned, safeUnlink } from '../core/safe-write.js';

export interface GoOptions {
  resume?: boolean;
}

const SESSION_FILE = '.faf-session.json';

interface GoSession {
  slotIndex: number;
  fafPath: string;
}

/** The session faf wrote in `bytes` (exactly `JSON.stringify({ slotIndex,
 *  fafPath })`), or null when they are anything else. */
export function goSessionOf(bytes: Uint8Array | null): GoSession | null {
  if (bytes === null) {return null;}
  const text = new TextDecoder().decode(bytes);
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const keys = typeof j === 'object' && j !== null && !Array.isArray(j) ? Object.keys(j).sort().join(',') : '';
    if (keys !== 'fafPath,slotIndex' || typeof j.slotIndex !== 'number' || typeof j.fafPath !== 'string') {return null;}
    return JSON.stringify({ slotIndex: j.slotIndex, fafPath: j.fafPath }) === text ? { slotIndex: j.slotIndex, fafPath: j.fafPath } : null;
  } catch {
    return null;
  }
}

/** The bytes at the session path — through the project's link rules — or
 *  null when there is none, or it is refused (said in one line). */
function readSessionBytes(dir: string): Buffer | null {
  try {
    return readBytesIfPresent(resolveInside(dir, SESSION_FILE));
  } catch (e) {
    if (!(e instanceof SafePathError)) {throw e;}
    console.error(dim(`  ${SESSION_FILE}: ${e.message}`));
    return null;
  }
}

/** Save the session for `faf go --resume` — over nothing, or over a session
 *  faf wrote; any other file is left as it is. Never throws: the answers
 *  are written whatever happens to the session. */
function saveSession(dir: string, session: GoSession): boolean {
  try {
    safeReplaceOwned(join(dir, SESSION_FILE), JSON.stringify(session), {
      root: dir,
      owns: b => goSessionOf(b) !== null,
      mark: 'faf go session',
    });
    return true;
  } catch (e) {
    console.error(dim(`  session not saved: ${e instanceof Error ? e.message : String(e)}`));
    return false;
  }
}

/** Remove the session once the interview is done — only a session faf wrote. */
function clearSession(dir: string): void {
  const bytes = readSessionBytes(dir);
  if (goSessionOf(bytes) === null || bytes === null) {return;}
  try {
    safeUnlink(join(dir, SESSION_FILE), { root: dir, expect: bytes });
  } catch (e) {
    if (!(e instanceof SafePathError)) {throw e;}
  }
}

/**
 * An answer can only land under a mapping. If a slot's section holds a scalar
 * or a list (older writers stored `project: <name>`), refuse BEFORE asking
 * anything: faf never replaces that value with {}, and no typed answer is lost.
 */
function refuseBlockedSections(data: Record<string, unknown>, paths: string[]): void {
  const blocked = new Map<string, string>(); // step → message, one per section
  for (const path of paths) {
    const block = blockingStep(data, path);
    if (block && !blocked.has(block.at)) {blocked.set(block.at, blockedMessage(path, block));}
  }
  if (blocked.size === 0) {return;}
  console.error(`${bold('×')} go  project.faf has a section faf cannot write under — nothing was changed:`);
  for (const msg of blocked.values()) {console.error(`  ${msg}`);}
  const project = data.project;
  if (project !== null && project !== undefined && typeof project !== 'object') {
    console.error(dim("  'faf auto' moves a bare `project: <name>` to `project.name` for you."));
  }
  process.exit(1);
}

/** The question for `slot`, in the interview voice of the single-source
 *  registry (core/interview.ts) — the same question CFM's faf_go and every
 *  other consumer asks. Typed words (None, N/A, unknown) are shown as they
 *  are, so the person can keep them (Enter) or answer. */
function questionLine(slot: SlotDef, current: unknown): string {
  const keep = isTypedWords(current) ? ` ${dim(`now '${String(current).trim()}' — Enter keeps it`)}` : '';
  return `  ${bold(`#${slot.index}`)} ${questionForSlot(slot.path)} ${dim(`(${slot.path})`)}${keep}: `;
}

/** Guided interview to Trophy ✪: the goal and six W's suggested, the user confirms */
export async function goCommand(options: GoOptions = {}): Promise<void> {
  assertProjectCwd(process.cwd(), 'faf go');
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = process.cwd();

  // Resume session if requested
  let startIndex = 0;
  if (options.resume) {
    const session = goSessionOf(readSessionBytes(dir));
    if (session) {
      startIndex = session.slotIndex;
      console.log(dim(`  resuming from slot #${startIndex + 1}`));
    }
  }

  const data = readFaf(fafPath);
  // A project.faf the scoring kernel cannot read is refused in one line now,
  // before the interview and before anything is written.
  const current = withKernel(fafPath, () => enrichScore(kernel.score(readFafRaw(fafPath))));

  // Find empty slots. Typed words — None / N/A / not applicable, unknown —
  // are an empty slot, so they are asked about like any other; the question
  // shows the words, and Enter keeps them. `slotignored` (the app-type leaves the slot out) is never asked.
  const emptySlots = SLOTS.filter(s => {
    const val = getNestedValue(data as Record<string, unknown>, s.path);
    return isPlaceholder(val) && val !== SLOTIGNORED;
  });

  refuseBlockedSections(data as Record<string, unknown>, emptySlots.map(s => s.path));

  if (emptySlots.length === 0) {
    console.log(`${fafCyan('◆')} go  all slots populated — ✪ Trophy`);
    displayScore(current, fafPath);
    return;
  }

  console.log(`${fafCyan('go')} ${dim('— guided interview to ✪ Trophy')}`);
  const noun = emptySlots.length === 1 ? 'slot' : 'slots';
  console.log(dim(`  ${emptySlots.length} ${noun} from Trophy. Enter a value, "skip" to skip, or "quit" to stop.\n`));

  // A person at a terminal sees the repo's suggestions for the goal and the
  // six W's in gray, and confirms them. With no TTY (CI, a pipe) there are no
  // suggestions: nothing is written that a human didn't confirm.
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const suggestions: IntentSuggestions = tty ? suggestIntent(dir, data as Record<string, unknown>) : {};
  const answerer = tty ? ttyAnswerer() : pipeAnswerer();

  let filled = 0;
  let quit = false;
  const slotsToProcess = emptySlots.slice(startIndex);

  for (let i = 0; i < slotsToProcess.length; i++) {
    const slot = slotsToProcess[i];
    const cur = getNestedValue(data as Record<string, unknown>, slot.path);
    const plan = fieldPlan(slot.path, cur, suggestions);
    const source = suggestions[slot.path as IntentPath]?.source;
    if (plan?.suggestion && source) {console.log(dim(`  suggested from ${source}`));}
    const done = await answerer.ask(questionLine(slot, cur), plan);

    if (done.kind === 'quit') {
      // Save session for resume
      quit = true;
      if (saveSession(dir, { slotIndex: startIndex + i, fafPath })) {
        console.log(dim(`\n  session saved. Resume with: faf go --resume`));
      }
      break;
    }

    if (done.kind === 'skip') {
      continue;
    }

    setNestedValue(data as Record<string, unknown>, slot.path, done.value);
    filled++;
  }

  answerer.close();

  if (filled > 0) {
    writeFaf(fafPath, data, { onAliasKept: k => console.log(dim(`  ${aliasKeptNote(k)}`)) });
    console.log(`\n${fafCyan('◆')} go  filled ${filled} slot${filled === 1 ? '' : 's'}`);
  }

  // Show updated score
  const result = withKernel(fafPath, () => enrichScore(kernel.score(readFafRaw(fafPath))));
  displayScore(result, fafPath);

  if (filled > 0) {recordGoGrowth(fafPath, result.score, filled);}

  // Clean up the session file if we finished all slots (a quit keeps it for
  // --resume); only a session faf wrote is removed.
  if (!quit) {clearSession(dir);}
}

/** The interview is the biggest climb on the journey: record it on the DNA,
 *  next to the project.faf it filled. A .faf-dna faf did not write is left
 *  as it is — say so in one line. */
function recordGoGrowth(fafPath: string, score: number, filled: number): void {
  const dna = new FafDNAManager(dirname(fafPath));
  if (!dna.exists()) {return;}
  dna.recordGrowth(score, [`faf go — filled ${filled} slot${filled === 1 ? '' : 's'}`]);
  sayWhyDnaIsLeft(dna);
}

/** How a slot is asked on a terminal: the suggestion field (`{ suggestion,
 *  help }`, each '' when there is none) for an empty goal or W, or null for
 *  plain readline —
 *  every other slot, and a W holding typed words (None, N/A: Enter keeps them,
 *  so nothing competes with them). Readline keeps cursor keys, Ctrl-U/W and
 *  history where the field has nothing to offer. */
export function fieldPlan(path: string, cur: unknown, suggestions: IntentSuggestions): FieldPlan | null {
  if (!isIntentPath(path) || isTypedWords(cur)) {return null;}
  return { suggestion: suggestions[path]?.value ?? '', help: helpForSlot(path) };
}

/** What the field shows: the suggestion, else the help (never written). */
export interface FieldPlan { suggestion: string; help: string }

interface Answerer {
  ask(prompt: string, plan: FieldPlan | null): Promise<FieldDone>;
  close(): void;
}

/** A typed line as an answer: "quit" stops, empty or "skip" skips. */
function lineAnswer(answer: string): FieldDone {
  const a = answer.trim();
  if (a.toLowerCase() === 'quit') {return { kind: 'quit' };}
  if (a === '' || a.toLowerCase() === 'skip') {return { kind: 'skip' };}
  return { kind: 'value', value: a };
}

/** No TTY: each piped line answers the next question, in order. Lines are
 *  queued, so a pipe that sends them all at once loses none. Suggestions are
 *  never shown or applied. When the input ends, every question left is
 *  skipped (no session is saved for a closed pipe). */
function pipeAnswerer(): Answerer {
  const rl = createInterface({ input: process.stdin, terminal: false });
  const lines: string[] = [];
  const waiting: ((line: string | null) => void)[] = [];
  let ended = false;
  rl.on('line', (line) => {
    const next = waiting.shift();
    if (next) {next(line);} else {lines.push(line);}
  });
  rl.on('close', () => {
    ended = true;
    for (const next of waiting.splice(0)) {next(null);}
  });
  return {
    ask: (prompt) => new Promise<FieldDone>(resolve => {
      process.stdout.write(prompt);
      const take = (line: string | null): void => {
        process.stdout.write('\n');
        resolve(line === null ? { kind: 'skip' } : lineAnswer(line));
      };
      if (lines.length > 0) {take(lines.shift()!);}
      else if (ended) {take(null);}
      else {waiting.push(take);}
    }),
    close: () => rl.close(),
  };
}

/** A terminal, a slot with no field: one readline question, with cursor keys,
 *  Ctrl-U/W and history. Ctrl-C or Ctrl-D stops the interview. */
function askReadline(prompt: string, answered: string[]): Promise<FieldDone> {
  return new Promise<FieldDone>(resolve => {
    // A new interface per question, so earlier answers are passed in: Up
    // recalls them.
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true, history: [...answered], historySize: 100 });
    let done = false;
    const finish = (d: FieldDone): void => {
      if (done) {return;}
      done = true;
      rl.close();
      process.stdin.pause();
      resolve(d);
    };
    rl.on('SIGINT', () => { process.stdout.write('\n'); finish({ kind: 'quit' }); });
    rl.on('close', () => finish({ kind: 'quit' }));
    rl.question(prompt, (answer) => {
      if (answer.trim()) {answered.unshift(answer);}
      finish(lineAnswer(answer));
    });
  });
}


/** Terminal rows `text` takes at `cols` columns — by column, not UTF-16 unit. */
export function rowsFor(text: string, cols: number): number {
  return Math.max(1, Math.ceil(displayWidth(text) / cols));
}

/** A TTY: the goal and six W's go through the suggestion field
 *  (ui/suggest-field.ts), redrawn in place by terminal column — the suggestion
 *  in gray until the person types or Tabs. Every other slot is a readline
 *  question (askReadline). */
function ttyAnswerer(): Answerer {
  emitKeypressEvents(process.stdin);
  const out = process.stdout;
  let rows = 1;
  // This run's readline answers, newest first: the history Up walks. One per
  // `faf go`, so a second run in the same process starts clean.
  const answered: string[] = [];
  const draw = (prompt: string, line: string): void => {
    // Back to the start of what was drawn last time, clear it, draw again.
    if (rows > 1) {out.write(`\u001b[${rows - 1}A`);}
    out.write(`\r\u001b[J${prompt}${line}`);
    rows = rowsFor(prompt + line, out.columns || 80);
  };
  return {
    ask: (prompt, plan) => plan === null ? askReadline(prompt, answered) : new Promise<FieldDone>(resolve => {
      let state = startField(plan.suggestion, plan.help);
      rows = 1;
      draw(prompt, renderField(state, { gray: dim }));
      process.stdin.setRawMode(true);
      process.stdin.resume();
      const onKey = (_s: string | undefined, key: FieldKey | undefined): void => {
        const r = fieldKey(state, key ?? { sequence: _s });
        state = r.state;
        if (r.done) {
          process.stdin.off('keypress', onKey);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          // Leave the answer on screen as it was decided.
          const shown = r.done.kind === 'value' ? r.done.value : dim(r.done.kind);
          draw(prompt, shown);
          out.write('\n');
          resolve(r.done);
          return;
        }
        draw(prompt, renderField(state, { gray: dim }));
      };
      process.stdin.on('keypress', onKey);
    }),
    close: () => { /* raw mode is released after every answer */ },
  };
}
