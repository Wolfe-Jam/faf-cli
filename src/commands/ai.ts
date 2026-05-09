import { findFafFile, readFaf, readFafRaw, writeFaf } from '../interop/faf.js';
import { SLOTS } from '../core/slots.js';
import { isPlaceholder } from '../core/slots.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/** Per faf-auto-no-guess-no-slop: client-side guard against AI returning
 *  generic slop / placeholder text / fabrications. Even if Claude slips
 *  and returns "for users" or "TBD", we reject it before writing to disk.
 *
 *  Rules:
 *  - Length 4-280 chars (too short = unhelpful; too long = essay, not a slot)
 *  - Not a generic-slop pattern (see SLOP_PATTERNS)
 *  - Must be a string (null/undefined are the honest "leave empty" signal)
 *
 *  Exported for testability (avoids mocking Anthropic SDK in tests).
 */
export const AI_SLOP_PATTERNS: readonly RegExp[] = [
  /^(tbd|see\s+readme|todo|fixme|coming\s+soon|n\/a|unknown|none|null|not\s+specified)\b/i,
  /^(software|application|app|project|tool|library|framework)\.?$/i,
  /^(for\s+(users|developers|teams|engineers))\.?$/i,
  /^(general\s+purpose|various|multiple|description|goal|name|title)\.?$/i,
];

export function isValidAiExtraction(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const trimmed = v.trim();
  if (trimmed.length < 4 || trimmed.length > 280) return false;
  return !AI_SLOP_PATTERNS.some(re => re.test(trimmed));
}

/** Get a nested value from an object by dot-path */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
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

/** AI-powered features */
export async function aiCommand(subcommand?: string): Promise<void> {
  if (subcommand === 'analyze') {
    await analyzeCommand();
  } else if (subcommand === 'enhance') {
    await enhanceCommand();
  } else {
    console.log(`${fafCyan('ai')} ${dim('— AI-powered features')}\n`);
    console.log(`  ${bold('faf ai enhance')} ${dim('— fill empty slots via Claude')}`);
    console.log(`  ${bold('faf ai analyze')} ${dim('— get improvement suggestions')}`);
    console.log('');
    console.log(dim('  Requires ANTHROPIC_API_KEY environment variable.'));
  }
}

async function getClient(): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set.\n\n  export ANTHROPIC_API_KEY=sk-...');
    process.exit(2);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    return new Anthropic({ apiKey });
  } catch {
    console.error('Error: @anthropic-ai/sdk not installed.\n\n  npm install @anthropic-ai/sdk');
    process.exit(2);
  }
}

async function enhanceCommand(): Promise<void> {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const data = readFaf(fafPath);
  const yaml = readFafRaw(fafPath);

  // Find empty slots
  const emptySlots = SLOTS.filter(s => {
    const val = getNestedValue(data as Record<string, unknown>, s.path);
    return isPlaceholder(val) && val !== 'slotignored';
  });

  if (emptySlots.length === 0) {
    console.log(`${fafCyan('◆')} ai enhance  all slots populated`);
    return;
  }

  console.log(`${fafCyan('ai')} enhance  ${dim(`extracting from ${emptySlots.length} empty slots...`)}`);

  const client = await getClient();

  const slotList = emptySlots.map(s => `- ${s.path}: ${s.description}`).join('\n');
  // Per faf-auto-no-guess-no-slop doctrine — extract-or-null per slot.
  // Empty is honest; wrong is a lie. Forbidden: generic slop, fabricated
  // values, content not present in the source. JSON null = leave the slot
  // empty for `faf go` interview.
  const prompt = `You are extracting concrete content from a project's .faf file to fill empty slots. STRICT RULES:

1. Return JSON mapping dot-paths to values OR null.
2. Use null when the source doesn't contain CONCRETE evidence for that slot — DO NOT GUESS.
3. NEVER use generic placeholders. Forbidden values include: "TBD", "see README", "software application", "for users", "for developers", "general purpose", "various", "multiple", "n/a", "unknown".
4. NEVER fabricate. If the .faf doesn't say it explicitly, return null for that slot.
5. Extracted values must be SHORT (under 200 characters) and DIRECTLY supported by the source.

The .faf source:

${yaml}

Empty slots to fill (return null if no concrete evidence):
${slotList}

Respond with ONLY valid JSON, no markdown fences. Each value is either a short string (with concrete evidence) or null (leave empty).`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].text;
    const suggestions = JSON.parse(text);
    let filled = 0;
    let rejected = 0;

    for (const slot of emptySlots) {
      const value = suggestions[slot.path];
      if (value === null || value === undefined) continue; // honest empty
      if (isValidAiExtraction(value)) {
        setNestedValue(data as Record<string, unknown>, slot.path, value);
        console.log(`  ${fafCyan('●')} ${slot.path} ${dim('←')} ${value}`);
        filled++;
      } else {
        // Defensive rejection — Claude returned slop or out-of-bounds value
        console.log(`  ${dim('○')} ${slot.path} ${dim('— rejected as slop, left empty')}`);
        rejected++;
      }
    }

    if (filled > 0) {
      writeFaf(fafPath, data);
      console.log(`\n${fafCyan('◆')} ai enhance  filled ${filled} slot${filled === 1 ? '' : 's'}${rejected > 0 ? ` (${rejected} rejected)` : ''}`);
      const result = enrichScore(kernel.score(readFafRaw(fafPath)));
      displayScore(result, fafPath);
    } else if (rejected > 0) {
      console.log(`\n${dim('all extractions rejected as slop. Run')} ${bold("'faf go'")} ${dim('for interview-fill.')}`);
    } else {
      console.log(`\n${dim('no concrete evidence for empty slots. Run')} ${bold("'faf go'")} ${dim('for interview-fill.')}`);
    }
  } catch {
    console.error('Error: Could not parse AI response.');
  }
}

async function analyzeCommand(): Promise<void> {
  const fafPath = findFafFile();
  if (!fafPath) {
    console.error("Error: project.faf not found\n\n  Run 'faf init' to create one.");
    process.exit(2);
  }

  const yaml = readFafRaw(fafPath);

  console.log(`${fafCyan('ai')} analyze  ${dim('getting suggestions...')}`);

  const client = await getClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze this .faf project context file and provide 3-5 specific suggestions for improvement. Focus on completeness, accuracy, and best practices.\n\n${yaml}\n\nBe concise. One line per suggestion.`,
    }],
  });

  console.log('');
  console.log(response.content[0].text);
}
