import { findFafFile, readFafRaw } from '../interop/faf.js';
import { bold, dim, fafCyan } from '../ui/colors.js';

/** The one line `faf ai enhance` prints since 7.13, when it was retired.
 *  project.faf is not enhanced: a slot holds a repo fact (`faf auto`) or the
 *  person's own words (`faf go`), and an AI suggestion is neither. */
const AI_ENHANCE_RETIRED =
  "faf ai enhance was retired in 7.13 — project.faf isn't enhanced: faf auto fills tech slots from repo facts, and you write the 6Ws (faf go).";

/** `faf ai` — ask Claude for suggestions about project.faf. Read-only:
 *  nothing is written. */
export async function aiCommand(subcommand?: string): Promise<void> {
  if (subcommand === 'analyze') {
    await analyzeCommand();
  } else if (subcommand === 'enhance') {
    // Retired: say so in one line, write nothing, exit 1.
    console.error(AI_ENHANCE_RETIRED);
    process.exit(1);
  } else {
    console.log(`${fafCyan('ai')} ${dim('— ask Claude for suggestions about project.faf')}\n`);
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
