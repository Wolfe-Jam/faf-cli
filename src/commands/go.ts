import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { findFafFile, readFaf, readFafRaw, writeFaf } from '../interop/faf.js';
import { SLOTS } from '../core/slots.js';
import { isPlaceholder } from '../core/slots.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

export interface GoOptions {
  resume?: boolean;
}

const SESSION_FILE = '.faf-session.json';

interface GoSession {
  slotIndex: number;
  fafPath: string;
}

/** Get a nested value from an object by dot-path */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {return undefined;}
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Set a nested value in an object by dot-path */
function setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/** Guided interview to gold code */
export async function goCommand(options: GoOptions = {}): Promise<void> {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const dir = process.cwd();
  const sessionPath = join(dir, SESSION_FILE);

  // Resume session if requested
  let startIndex = 0;
  if (options.resume && existsSync(sessionPath)) {
    try {
      const session: GoSession = JSON.parse(readFileSync(sessionPath, 'utf-8'));
      startIndex = session.slotIndex;
      console.log(dim(`  resuming from slot #${startIndex + 1}`));
    } catch { /* ignore corrupted session */ }
  }

  const data = readFaf(fafPath);

  // Find empty slots — goal handled separately as opener question
  const allEmpty = SLOTS.filter(s => {
    const val = getNestedValue(data as Record<string, unknown>, s.path);
    return isPlaceholder(val) && val !== 'slotignored' && s.path !== 'project.goal';
  });

  // 6Ws first, then remaining slots
  const humanSlots = allEmpty.filter(s => s.category === 'human');
  const otherSlots = allEmpty.filter(s => s.category !== 'human');
  const emptySlots = [...humanSlots, ...otherSlots];

  const goalVal = getNestedValue(data as Record<string, unknown>, 'project.goal');
  const goalIsEmpty = isPlaceholder(goalVal);

  if (emptySlots.length === 0 && !goalIsEmpty) {
    console.log(`${fafCyan('◆')} go  all slots populated`);
    const result = enrichScore(kernel.score(readFafRaw(fafPath)));
    displayScore(result, fafPath);
    return;
  }

  const totalQuestions = emptySlots.length + (goalIsEmpty ? 1 : 0);
  console.log(`${fafCyan('go')} ${dim('— guided interview')}`);
  console.log(dim(`  ${totalQuestions} empty slots. Enter a value, "skip" to skip, or "quit" to stop.\n`));

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  let filled = 0;
  let goalAnswer = '';

  // Goal is the opener — one sentence unlocks everything
  if (goalIsEmpty && startIndex === 0) {
    const answer = await ask(`  ${bold('★')} In one sentence, what is this project designed to do? `);
    if (answer.toLowerCase() === 'quit') {
      const session: GoSession = { slotIndex: 0, fafPath };
      writeFileSync(sessionPath, JSON.stringify(session), 'utf-8');
      console.log(dim(`\n  session saved. Resume with: faf go --resume`));
      rl.close();
      return;
    }
    if (answer.toLowerCase() !== 'skip' && answer.trim() !== '') {
      goalAnswer = answer.trim();
      setNestedValue(data as Record<string, unknown>, 'project.goal', goalAnswer);
      filled++;
      console.log();
    }
  }

  const slotsToProcess = emptySlots.slice(startIndex);

  for (let i = 0; i < slotsToProcess.length; i++) {
    const slot = slotsToProcess[i];
    const answer = await ask(`  ${bold(`#${slot.index}`)} ${slot.description} ${dim(`(${slot.path})`)}: `);

    if (answer.toLowerCase() === 'quit') {
      // Save session for resume
      const session: GoSession = { slotIndex: startIndex + i, fafPath };
      writeFileSync(sessionPath, JSON.stringify(session), 'utf-8');
      console.log(dim(`\n  session saved. Resume with: faf go --resume`));
      break;
    }

    if (answer.toLowerCase() === 'skip' || answer.trim() === '') {
      continue;
    }

    setNestedValue(data as Record<string, unknown>, slot.path, answer.trim());
    filled++;
  }

  rl.close();

  // If what/why still empty but goal was answered, derive them from the goal answer
  if (goalAnswer) {
    const what = getNestedValue(data as Record<string, unknown>, 'human_context.what');
    const why = getNestedValue(data as Record<string, unknown>, 'human_context.why');
    if (isPlaceholder(what)) {
      setNestedValue(data as Record<string, unknown>, 'human_context.what', goalAnswer);
      filled++;
    }
    if (isPlaceholder(why)) {
      setNestedValue(data as Record<string, unknown>, 'human_context.why', goalAnswer);
      filled++;
    }
  }

  if (filled > 0) {
    writeFaf(fafPath, data);
    console.log(`\n${fafCyan('◆')} go  filled ${filled} slot${filled === 1 ? '' : 's'}`);
  }

  // Show updated score
  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  displayScore(result, fafPath);

  // Clean up session file if we finished all slots
  if (existsSync(sessionPath)) {
    try { unlinkSync(sessionPath); } catch { /* ignore */ }
  }
}
