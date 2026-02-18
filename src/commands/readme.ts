/**
 * 📋 faf readme - 6Ws README Builder (v4.4.0)
 *
 * One command that does everything:
 * 1. Auto-extracts from README.md (if exists)
 * 2. Interactive questionnaire (with smart defaults)
 * 3. Updates project.faf (100% quality)
 * 4. Generates README section
 *
 * No flags. No modes. Just works.
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import path from "path";
import prompts from 'prompts';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  FAF_ICONS,
  FAF_COLORS,
} from "../utils/championship-style";
import { findFafFile, fileExists } from "../utils/file-utils";

interface ReadmeOptions {
  quiet?: boolean;
  output?: string;
}

interface ExtractedContext {
  who: string | null;
  what: string | null;
  why: string | null;
  where: string | null;
  when: string | null;
  how: string | null;
  confidence: number;
  sources: Record<string, string>;
}

/**
 * Extract the 6 Ws from README content using intelligent pattern matching
 */
function extractSixWs(content: string, _projectName?: string): ExtractedContext {
  const result: ExtractedContext = {
    who: null,
    what: null,
    why: null,
    where: null,
    when: null,
    how: null,
    confidence: 0,
    sources: {}
  };

  let confidencePoints = 0;

  // === WHAT: Project description, purpose (most important - do first) ===

  // Pattern 1: Bold subtitle after H1 (common: **The Crown: Description**)
  const boldSubtitleMatch = content.match(/^#\s+[^\n]+\n+\*\*([^*]+)\*\*/m);
  if (boldSubtitleMatch && boldSubtitleMatch[1]) {
    const extracted = cleanExtract(boldSubtitleMatch[1]);
    if (extracted.length > 10 && extracted.length < 150) {
      result.what = extracted;
      result.sources.what = 'README subtitle';
      confidencePoints += 25;
    }
  }

  // Pattern 2: Blockquote tagline
  if (!result.what) {
    const blockquoteMatch = content.match(/(?:^|\n)>\s*([^\n]{30,})/m);
    if (blockquoteMatch && blockquoteMatch[1]) {
      const extracted = cleanExtract(blockquoteMatch[1]);
      if (extracted.length > 20 && !extracted.startsWith('[') && !extracted.startsWith('!')) {
        result.what = extracted;
        result.sources.what = 'README tagline';
        confidencePoints += 25;
      }
    }
  }

  // Pattern 3: First descriptive paragraph after title (skip code blocks, lists)
  if (!result.what) {
    const firstParaMatch = content.match(/^#\s+[^\n]+\n+(?:\*\*[^*]+\*\*\n+)?(?:\*[^\n]+\*\n+)?([A-Z][^#\n`*|]{30,})/m);
    if (firstParaMatch && firstParaMatch[1]) {
      const extracted = cleanExtract(firstParaMatch[1]);
      if (extracted.length > 30 && extracted.length < 250) {
        result.what = extracted;
        result.sources.what = 'README first paragraph';
        confidencePoints += 20;
      }
    }
  }

  // Pattern 4: TL;DR Solution
  if (!result.what) {
    const tldrMatch = content.match(/##\s*TL;?DR\s*\n+([\s\S]*?)(?=\n##|\n---|\*\*Install|$)/i);
    if (tldrMatch && tldrMatch[1]) {
      const solutionMatch = tldrMatch[1].match(/\*\*Solution:\*\*\s*([^\n]+)/i);
      if (solutionMatch) {
        result.what = cleanExtract(solutionMatch[1]);
        result.sources.what = 'TL;DR Solution';
        confidencePoints += 25;
      }
    }
  }

  // Pattern 5: "This is..." statement
  if (!result.what) {
    const thisIsMatch = content.match(/This\s+is\s+(?:the\s+)?(?:a\s+)?([^.\n]{20,100})/i);
    if (thisIsMatch && thisIsMatch[1]) {
      result.what = cleanExtract(thisIsMatch[1]);
      result.sources.what = 'README "This is" statement';
      confidencePoints += 18;
    }
  }

  // Pattern 6: "A single X that..." description
  if (!result.what) {
    const singleThatMatch = content.match(/A\s+single\s+([^.]+that[^.]+)/i);
    if (singleThatMatch && singleThatMatch[1]) {
      result.what = cleanExtract(singleThatMatch[1]);
      result.sources.what = 'README functional description';
      confidencePoints += 18;
    }
  }

  // === WHY: Problem/motivation ===

  // Pattern 1: **Problem:** statement
  const problemMatch = content.match(/\*\*Problem:\*\*\s*([^\n]+)/i);
  if (problemMatch && problemMatch[1]) {
    result.why = cleanExtract(problemMatch[1]);
    result.sources.why = 'README problem statement';
    confidencePoints += 20;
  }

  // Pattern 2: ## Why section
  if (!result.why) {
    const whySectionMatch = content.match(/##\s*Why[^#\n]*\n+([\s\S]*?)(?=\n##|$)/i);
    if (whySectionMatch && whySectionMatch[1]) {
      // Get first meaningful line
      const firstLine = whySectionMatch[1].split('\n').find(l => l.trim() && !l.startsWith('|') && !l.startsWith('-'));
      if (firstLine) {
        result.why = cleanExtract(firstLine);
        result.sources.why = 'README Why section';
        confidencePoints += 18;
      }
    }
  }

  // Pattern 3: Tagline with time savings ("30 seconds replaces 20 minutes")
  if (!result.why) {
    const timeSavingsMatch = content.match(/(\d+\s*(?:seconds?|minutes?|hours?)\s+(?:replaces?|vs|instead of)[^.\n]+)/i);
    if (timeSavingsMatch) {
      result.why = cleanExtract(timeSavingsMatch[1]);
      result.sources.why = 'README value proposition';
      confidencePoints += 15;
    }
  }

  // Pattern 4: Performance metrics as why (common in tech READMEs)
  if (!result.why) {
    // Look for "Xx smaller/faster" pattern with clean extraction
    const perfMatch = content.match(/(\d+x\s+(?:smaller|faster|more|better))/i);
    if (perfMatch) {
      result.why = perfMatch[1];
      result.sources.why = 'README performance benefit';
      confidencePoints += 12;
    }
  }

  // === WHO: Target audience ===

  // Pattern 1: "for X" in description
  const forMatch = content.match(/(?:for|optimized for|designed for)\s+([^.\n]+(?:Grok|xAI|AI|developers?|teams?|users?)[^.\n]*)/i);
  if (forMatch && forMatch[1]) {
    const extracted = cleanExtract(forMatch[1]);
    if (extracted.length >= 5 && extracted.length <= 100) {
      result.who = extracted;
      result.sources.who = 'README target';
      confidencePoints += 15;
    }
  }

  // Pattern 2: Infer from technology mentions
  if (!result.who) {
    const techTargets: string[] = [];
    if (content.includes('Grok') || content.includes('xAI')) {techTargets.push('xAI/Grok users');}
    if (content.includes('Claude')) {techTargets.push('Claude users');}
    if (content.includes('MCP') || content.includes('Model Context Protocol')) {techTargets.push('MCP developers');}
    if (content.includes('WASM') || content.includes('WebAssembly')) {techTargets.push('WASM/Edge developers');}
    if (content.includes('browser') || content.includes('Browser')) {techTargets.push('browser apps');}

    if (techTargets.length > 0) {
      result.who = techTargets.slice(0, 3).join(', ');
      result.sources.who = 'Inferred from technology mentions';
      confidencePoints += 10;
    }
  }

  // === WHERE: Platform, environment ===
  const platforms: string[] = [];

  // Explicit platform patterns
  if (content.includes('Rust') || content.includes('cargo')) {platforms.push('Rust/Cargo');}
  if (content.includes('WASM') || content.includes('WebAssembly') || content.match(/\.wasm/)) {platforms.push('WASM');}
  if (content.includes('browser') || content.includes('Browser')) {platforms.push('Browser');}
  if (content.includes('npm install') || content.includes('package.json')) {platforms.push('npm');}
  if (content.includes('Homebrew') || content.includes('brew install')) {platforms.push('Homebrew');}
  if (content.includes('Zig')) {platforms.push('Zig');}
  if (content.includes('edge function') || content.includes('Edge')) {platforms.push('Edge');}
  if (content.includes('MCP')) {platforms.push('MCP');}

  if (platforms.length > 0) {
    result.where = platforms.slice(0, 4).join(', ');
    result.sources.where = 'README platform mentions';
    confidencePoints += 10;
  }

  // === WHEN: Version, date, or status ===

  // Pattern 1: Explicit date in header
  const dateMatch = content.match(/\*([A-Z][a-z]+\s+(?:Day,?\s+)?[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\*/);
  if (dateMatch) {
    result.when = dateMatch[1];
    result.sources.when = 'README date';
    confidencePoints += 15;
  }

  // Pattern 2: Status badges/mentions
  if (!result.when) {
    if (content.includes('xAI Exclusive') || content.includes('xAI-exclusive')) {
      result.when = 'xAI Exclusive release';
      result.sources.when = 'README exclusivity';
      confidencePoints += 12;
    } else if (content.includes('IANA') || content.includes('registered')) {
      result.when = 'IANA-registered standard';
      result.sources.when = 'README official status';
      confidencePoints += 15;
    }
  }

  // Pattern 3: Test suite status
  if (!result.when) {
    const testMatch = content.match(/(\d+)\/\1\s*(?:tests?|passing)/i);
    if (testMatch) {
      result.when = `${testMatch[1]} tests passing (production ready)`;
      result.sources.when = 'README test status';
      confidencePoints += 10;
    }
  }

  // === HOW: Installation/getting started ===

  // Pattern 1: Quick Start section code block - skip comments, get actual command
  const quickStartSection = content.match(/##\s*Quick\s*Start\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (quickStartSection) {
    const codeBlock = quickStartSection[1].match(/```(?:bash|sh)?\n([\s\S]*?)```/);
    if (codeBlock) {
      // Find first non-comment line
      const lines = codeBlock[1].split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      if (lines.length > 0) {
        result.how = cleanExtract(lines[0]);
        result.sources.how = 'README Quick Start';
        confidencePoints += 15;
      }
    }
  }

  // Pattern 2: One-click or simple commands
  if (!result.how) {
    const oneClickMatch = content.match(/(?:one-click|one click)[^\n]*\n+```[^\n]*\n([^\n]+)/i);
    if (oneClickMatch) {
      result.how = cleanExtract(oneClickMatch[1]);
      result.sources.how = 'README one-click demo';
      confidencePoints += 15;
    }
  }

  // Pattern 3: Build command
  if (!result.how) {
    const buildMatch = content.match(/```(?:bash|sh)?\n((?:zig|cargo|npm|yarn)\s+(?:build|install)[^\n]*)/);
    if (buildMatch) {
      result.how = cleanExtract(buildMatch[1]);
      result.sources.how = 'README build command';
      confidencePoints += 12;
    }
  }

  // Pattern 4: npm/brew install
  if (!result.how) {
    const npmMatch = content.match(/npm\s+install\s+(?:-g\s+)?([^\s\n`]+)/);
    if (npmMatch) {
      result.how = `npm install -g ${npmMatch[1]}`;
      result.sources.how = 'README npm install';
      confidencePoints += 15;
    }
  }

  // Calculate overall confidence
  const filledCount = [result.who, result.what, result.why, result.where, result.when, result.how]
    .filter(v => v !== null).length;

  // Scale based on filled slots
  result.confidence = Math.min(100, Math.round((confidencePoints / 100) * 100 * (filledCount / 6) * 1.2));

  return result;
}

/**
 * Clean extracted text
 */
function cleanExtract(text: string): string {
  return text
    .replace(/^\s*[-*•]\s*/, '')  // Remove list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert links to text
    .replace(/`([^`]+)`/g, '$1')  // Remove code backticks
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold markers
    .replace(/\*\*$/g, '')  // Remove trailing **
    .replace(/^\*\*/g, '')  // Remove leading **
    .replace(/\*([^*]+)\*/g, '$1')  // Remove italic markers
    .replace(/\*$/g, '')  // Remove trailing *
    .replace(/^\*/g, '')  // Remove leading *
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim()
    .slice(0, 200);  // Limit length
}

/**
 * Make extracted text suitable for interactive prompts
 * - Max 70 chars (readable in terminal)
 * - Skip if contains confusing patterns
 * - Empty string if not useful
 */
function makeInteractiveFriendly(text: string | null): string {
  if (!text) {return '';}

  // Skip long or confusing defaults
  if (text.length > 70) {return '';}
  if (text.includes('**')) {return '';}  // Still has markdown
  if (text.includes('Read the detailed')) {return '';}  // Verbose meta text
  if (text.includes('See below')) {return '';}  // Pointer text
  if (text.startsWith('AI:')) {return '';}  // Meta commentary

  return text;
}

/**
 * Find README file in project
 */
async function findReadme(projectRoot: string): Promise<string | null> {
  const readmeNames = [
    'README.md',
    'readme.md',
    'Readme.md',
    'README.MD',
    'README',
    'readme',
    'README.txt',
    'readme.txt'
  ];

  for (const name of readmeNames) {
    const readmePath = path.join(projectRoot, name);
    if (await fileExists(readmePath)) {
      return readmePath;
    }
  }

  return null;
}

/**
 * Generate README markdown section from 6Ws
 */
function generateReadmeSection(answers: Record<string, string>): string {
  return `## 📋 Project Context

**1W (WHO):** ${answers.who}

**2W (WHAT):** ${answers.what}

**3W (WHERE):** ${answers.where}

**4W (WHY):** ${answers.why}

**5W (WHEN):** ${answers.when}

**6W (HOW):** ${answers.how}

---
*Generated with [FAF](https://faf.one) - AI-ready project context*`;
}

/**
 * Main readme command - v4.4.0 simplified
 */
export async function readmeCommand(
  projectPath?: string,
  options: ReadmeOptions = {}
) {
  const projectRoot = projectPath || process.cwd();

  try {
    console.log();
    console.log(FAF_COLORS.fafCyan(`📋 6Ws README Builder`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();

    // Step 1: Try auto-extraction from README
    let extracted: ExtractedContext | null = null;
    const readmePath = await findReadme(projectRoot);

    if (readmePath && await fileExists(readmePath)) {
      console.log(chalk.gray(`   Found README.md: Extracting context...`));
      const readmeContent = await fs.readFile(readmePath, 'utf-8');

      // Get project name
      let projectName: string | undefined;
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileExists(packageJsonPath)) {
        try {
          const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
          projectName = pkg.name;
        } catch { /* ignore */ }
      }

      extracted = extractSixWs(readmeContent, projectName);

      const detectedCount = [extracted.who, extracted.what, extracted.why, extracted.where, extracted.when, extracted.how]
        .filter(v => v !== null).length;

      if (detectedCount > 0) {
        console.log(chalk.green(`   ✓ Detected: ${detectedCount}/6 fields\n`));
      } else {
        console.log(chalk.gray(`   ⚠️ Low confidence extraction\n`));
      }
    } else {
      console.log(chalk.gray(`   No README.md found - starting fresh\n`));
    }

    // Step 2: Interactive questionnaire (with smart defaults)
    console.log(FAF_COLORS.fafOrange(`   Let's fill the 6 Ws (press Enter to keep detected value):\n`));

    const answers = await prompts([
      {
        type: 'text',
        name: 'who',
        message: chalk.cyan('1W (WHO): Who is this for?'),
        initial: makeInteractiveFriendly(extracted?.who || null)
      },
      {
        type: 'text',
        name: 'what',
        message: chalk.cyan('2W (WHAT): What does it do?'),
        initial: makeInteractiveFriendly(extracted?.what || null)
      },
      {
        type: 'text',
        name: 'where',
        message: chalk.cyan('3W (WHERE): Where does it run?'),
        initial: makeInteractiveFriendly(extracted?.where || null)
      },
      {
        type: 'text',
        name: 'why',
        message: chalk.cyan('4W (WHY): Why does it exist?'),
        initial: makeInteractiveFriendly(extracted?.why || null)
      },
      {
        type: 'text',
        name: 'when',
        message: chalk.cyan('5W (WHEN): When to use it?'),
        initial: makeInteractiveFriendly(extracted?.when || null)
      },
      {
        type: 'text',
        name: 'how',
        message: chalk.cyan('6W (HOW): How to get started?'),
        initial: makeInteractiveFriendly(extracted?.how || null)
      }
    ]);

    // Check if user cancelled
    if (!answers.who && !answers.what && !answers.where && !answers.why && !answers.when && !answers.how) {
      console.log(chalk.yellow('\n⚠️  Cancelled'));
      process.exit(0);
    }

    // Step 3: Update project.faf (always use standard filename)
    const foundFafPath = await findFafFile(projectRoot);
    const projectFafPath = path.join(projectRoot, 'project.faf');

    let fafData: any = {};

    if (foundFafPath) {
      // Read existing .faf file
      const fafContent = await fs.readFile(foundFafPath, 'utf-8');
      fafData = parseYAML(fafContent) || {};

      // If we found .faf (legacy), migrate to project.faf
      if (path.basename(foundFafPath) === '.faf' && foundFafPath !== projectFafPath) {
        console.log();
        console.log(chalk.yellow(`   🔄 Migrating .faf → project.faf`));
      }
    } else {
      console.log();
      console.log(chalk.yellow(`   ⚠️  No .faf file found - creating project.faf`));
    }

    if (!fafData.human_context) {
      fafData.human_context = {};
    }

    // Update with user-provided answers
    fafData.human_context.who = answers.who;
    fafData.human_context.what = answers.what;
    fafData.human_context.where = answers.where;
    fafData.human_context.why = answers.why;
    fafData.human_context.when = answers.when;
    fafData.human_context.how = answers.how;
    fafData.human_context.context_score = 100; // User-provided = 100%
    fafData.human_context.success_rate = '100%';

    // Always write to project.faf (standard filename)
    await fs.writeFile(projectFafPath, stringifyYAML(fafData), 'utf-8');

    console.log();
    console.log(FAF_COLORS.fafGreen(`☑️ Updated project.faf`));
    console.log(chalk.cyan(`   Context Quality: 100% (user-provided)`));

    // Step 4: Generate README section
    const readmeSection = generateReadmeSection(answers);
    const outputPath = options.output || path.join(projectRoot, 'README-6ws.md');

    await fs.writeFile(outputPath, readmeSection);

    console.log(FAF_COLORS.fafGreen(`☑️ Generated README section`));
    console.log(chalk.gray(`   Saved to: ${path.basename(outputPath)}\n`));

    // Show preview
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(readmeSection);
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    console.log();
    console.log(FAF_COLORS.fafOrange(`💡 Copy this section to your README.md`));
    console.log();

  } catch (error) {
    console.log(chalk.red('💥 README builder failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
