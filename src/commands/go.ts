import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { findFafFile, readFaf, readFafRaw, writeFaf } from '../interop/faf.js';
import { SLOTS } from '../core/slots.js';
import { isPlaceholder } from '../core/slots.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { notify } from '../ui/notify.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/** Use Claude to interpret the opener and extract meaningful 6Ws */
async function interpret6Ws(opener: string, context: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {return null;}

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const prompt = `A developer described their project in one sentence: "${opener}"

Here is the project's detected stack context:
${context}

Based on this, extract the 6Ws as SHORT, specific values (one line each):
- who: who are the primary users of this project?
- what: what does it do? (rephrase the opener as a crisp description)
- why: why does it exist? what problem does it solve?
- where: where does it run/deploy? (use stack context)
- when: when was it started or what is the timeline?
- how: how does it work technically? (use stack context)

Respond ONLY with valid JSON mapping these 6 keys to string values. No markdown.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { text: string }).text;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

/** Infer where/when/how from existing stack slots and project files */
function inferSecondary(data: Record<string, unknown>, dir: string): { where: string; when: string; how: string } {
  const stack = (data.stack ?? {}) as Record<string, unknown>;

  // where — from hosting slot
  const where = (typeof stack.hosting === 'string' && !isPlaceholder(stack.hosting))
    ? stack.hosting
    : '';

  // when — from package.json version
  let when = '';
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.version) {when = `v${pkg.version}`;}
    } catch { /* ignore */ }
  }

  // how — from build + api_type
  const parts: string[] = [];
  if (typeof stack.build === 'string' && !isPlaceholder(stack.build)) {parts.push(stack.build);}
  if (typeof stack.api_type === 'string' && !isPlaceholder(stack.api_type)) {parts.push(stack.api_type);}
  const how = parts.join(', ');

  return { where, when, how };
}

/** Display the 6Ws summary for sign-off */
function display6Ws(data: Record<string, unknown>, inferred: { where: string; when: string; how: string }): void {
  const hc = (data.human_context ?? {}) as Record<string, unknown>;
  const val = (v: unknown, fallback: string) =>
    (typeof v === 'string' && !isPlaceholder(v) && v) ? v : (fallback || dim('—'));

  console.log(`\n  ${bold('6Ws')} ${dim('— confirm or type a slot name to correct:')}\n`);
  console.log(`  ${bold('who')}   ${val(hc.who, '')}`);
  console.log(`  ${bold('what')}  ${val(hc.what, '')}`);
  console.log(`  ${bold('why')}   ${val(hc.why, '')}`);
  console.log(`  ${bold('where')} ${val(hc.where, inferred.where)}`);
  console.log(`  ${bold('when')}  ${val(hc.when, inferred.when)}`);
  console.log(`  ${bold('how')}   ${val(hc.how, inferred.how)}`);
  console.log();
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

  // Non-human slots (stack etc.) — still asked slot-by-slot
  const allEmpty = SLOTS.filter(s => {
    const val = getNestedValue(data as Record<string, unknown>, s.path);
    return isPlaceholder(val) && val !== 'slotignored' && s.path !== 'project.goal';
  });
  const otherSlots = allEmpty.filter(s => s.category !== 'human');

  // Check if any 6Ws are empty
  const sixWsPaths = ['human_context.who', 'human_context.what', 'human_context.why',
                      'human_context.where', 'human_context.when', 'human_context.how'];
  const any6WsEmpty = sixWsPaths.some(p => isPlaceholder(getNestedValue(data as Record<string, unknown>, p)));
  const goalIsEmpty = isPlaceholder(getNestedValue(data as Record<string, unknown>, 'project.goal'));

  if (!any6WsEmpty && !goalIsEmpty && otherSlots.length === 0) {
    console.log(`${fafCyan('◆')} go  all slots populated`);
    const result = enrichScore(kernel.score(readFafRaw(fafPath)));
    displayScore(result, fafPath);
    if (result.score === 100) {notify('FAF: Trophy unlocked at 100%');}
    return;
  }

  console.log(`${fafCyan('go')} ${dim('— guided interview')}`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  let filled = 0;

  // === 3Ws OPENER ===
  if (any6WsEmpty && startIndex === 0) {
    console.log();
    const answer = await ask(`  ${bold('★')} In one sentence, what is this project designed to do? `);

    if (answer.toLowerCase() === 'quit') {
      const session: GoSession = { slotIndex: 0, fafPath };
      writeFileSync(sessionPath, JSON.stringify(session), 'utf-8');
      console.log(dim(`\n  session saved. Resume with: faf go --resume`));
      rl.close();
      return;
    }

    if (answer.toLowerCase() !== 'skip' && answer.trim() !== '') {
      const opener = answer.trim();

      // Try AI interpretation first — extracts meaningful who/what/why/where/when/how
      console.log(dim('  thinking...'));
      const interpreted = await interpret6Ws(opener, readFafRaw(fafPath));

      const sixWsKeys = ['who', 'what', 'why', 'where', 'when', 'how'] as const;
      if (interpreted) {
        for (const key of sixWsKeys) {
          const path = `human_context.${key}`;
          if (interpreted[key] && isPlaceholder(getNestedValue(data as Record<string, unknown>, path))) {
            setNestedValue(data as Record<string, unknown>, path, interpreted[key]);
            filled++;
          }
        }
        // Goal from what + why
        const what = interpreted.what || opener;
        const why = interpreted.why;
        if (isPlaceholder(getNestedValue(data as Record<string, unknown>, 'project.goal'))) {
          setNestedValue(data as Record<string, unknown>, 'project.goal', why ? `${what} — ${why}` : what);
          filled++;
        }
      } else {
        // No API key — store opener as what + goal, extract who from keywords
        if (isPlaceholder(getNestedValue(data as Record<string, unknown>, 'human_context.what'))) {
          setNestedValue(data as Record<string, unknown>, 'human_context.what', opener);
          filled++;
        }
        if (isPlaceholder(getNestedValue(data as Record<string, unknown>, 'project.goal'))) {
          setNestedValue(data as Record<string, unknown>, 'project.goal', opener);
          filled++;
        }
        // Best-effort who extraction from opener
        const lc = opener.toLowerCase();
        const whoMap: [RegExp, string][] = [
          [/\bdevs?\b|\bdevelopers?\b/, 'developers'],
          [/\bengineers?\b/, 'engineers'],
          [/\bteams?\b/, 'engineering teams'],
          [/\busers?\b/, 'end users'],
          [/\bdata scientists?\b/, 'data scientists'],
          [/\bdesigners?\b/, 'designers'],
        ];
        for (const [pattern, who] of whoMap) {
          if (pattern.test(lc) && isPlaceholder(getNestedValue(data as Record<string, unknown>, 'human_context.who'))) {
            setNestedValue(data as Record<string, unknown>, 'human_context.who', who);
            filled++;
            break;
          }
        }
      }
    }

    // Infer where/when/how from stack
    const inferred = inferSecondary(data as Record<string, unknown>, dir);
    if (inferred.where && isPlaceholder(getNestedValue(data as Record<string, unknown>, 'human_context.where'))) {
      setNestedValue(data as Record<string, unknown>, 'human_context.where', inferred.where);
      filled++;
    }
    if (inferred.when && isPlaceholder(getNestedValue(data as Record<string, unknown>, 'human_context.when'))) {
      setNestedValue(data as Record<string, unknown>, 'human_context.when', inferred.when);
      filled++;
    }
    if (inferred.how && isPlaceholder(getNestedValue(data as Record<string, unknown>, 'human_context.how'))) {
      setNestedValue(data as Record<string, unknown>, 'human_context.how', inferred.how);
      filled++;
    }

    // === 6Ws SIGN-OFF LOOP ===
    display6Ws(data as Record<string, unknown>, inferred);

     
    while (true) {
      const correction = await ask(`  ${dim('[Enter to confirm, or type: who / what / why / where / when / how]')} `);
      if (correction.trim() === '' || correction.toLowerCase() === 'confirm') {break;}
      if (correction.toLowerCase() === 'quit') {
        rl.close();
        return;
      }

      const slot = correction.trim().toLowerCase();
      const validSlots = ['who', 'what', 'why', 'where', 'when', 'how'];
      if (validSlots.includes(slot)) {
        const newVal = await ask(`  ${bold(slot)} → `);
        if (newVal.trim()) {
          setNestedValue(data as Record<string, unknown>, `human_context.${slot}`, newVal.trim());
          if (slot === 'what' || slot === 'why') {
            // Re-synthesize goal from corrected what/why
            const what = getNestedValue(data as Record<string, unknown>, 'human_context.what');
            const why = getNestedValue(data as Record<string, unknown>, 'human_context.why');
            if (what && why) {
              setNestedValue(data as Record<string, unknown>, 'project.goal', `${what} — ${why}`);
            }
          }
          filled++;
          display6Ws(data as Record<string, unknown>, inferred);
        }
      }
    }
    console.log();
  }

  // === REMAINING STACK SLOTS (slot-by-slot as before) ===
  const slotsToProcess = otherSlots.slice(startIndex);

  if (slotsToProcess.length > 0) {
    console.log(dim(`  ${slotsToProcess.length} stack slot${slotsToProcess.length === 1 ? '' : 's'} remaining.\n`));
  }

  for (let i = 0; i < slotsToProcess.length; i++) {
    const slot = slotsToProcess[i];
    const answer = await ask(`  ${bold(`#${slot.index}`)} ${slot.description} ${dim(`(${slot.path})`)}: `);

    if (answer.toLowerCase() === 'quit') {
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

  if (filled > 0) {
    writeFaf(fafPath, data);
    console.log(`\n${fafCyan('◆')} go  filled ${filled} slot${filled === 1 ? '' : 's'}`);
  }

  // Show updated score
  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  displayScore(result, fafPath);

  // Desktop notification (always — interactive command, user likely walked away during input)
  if (result.score === 100) {
    notify('FAF: Trophy unlocked at 100%');
  } else {
    notify(`FAF: ${result.score}% ${result.tier.name} - go complete`);
  }

  // Clean up session file if we finished all slots
  if (existsSync(sessionPath)) {
    try { unlinkSync(sessionPath); } catch { /* ignore */ }
  }
}
