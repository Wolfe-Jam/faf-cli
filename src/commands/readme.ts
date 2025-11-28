/**
 * 📖 faf readme - Extract 6 Ws from README intelligently
 * Reads README.md and fills human_context slots smartly
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import path from "path";
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import {
  FAF_ICONS,
  FAF_COLORS,
} from "../utils/championship-style";
import { findFafFile, fileExists } from "../utils/file-utils";
import { isFieldProtected } from "./check";

interface ReadmeOptions {
  apply?: boolean;
  force?: boolean;
  file?: string;
  quiet?: boolean;
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
function extractSixWs(content: string, projectName?: string): ExtractedContext {
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
    if (content.includes('Grok') || content.includes('xAI')) techTargets.push('xAI/Grok users');
    if (content.includes('Claude')) techTargets.push('Claude users');
    if (content.includes('MCP') || content.includes('Model Context Protocol')) techTargets.push('MCP developers');
    if (content.includes('WASM') || content.includes('WebAssembly')) techTargets.push('WASM/Edge developers');
    if (content.includes('browser') || content.includes('Browser')) techTargets.push('browser apps');

    if (techTargets.length > 0) {
      result.who = techTargets.slice(0, 3).join(', ');
      result.sources.who = 'Inferred from technology mentions';
      confidencePoints += 10;
    }
  }

  // === WHERE: Platform, environment ===
  const platforms: string[] = [];

  // Explicit platform patterns
  if (content.includes('Rust') || content.includes('cargo')) platforms.push('Rust/Cargo');
  if (content.includes('WASM') || content.includes('WebAssembly') || content.match(/\.wasm/)) platforms.push('WASM');
  if (content.includes('browser') || content.includes('Browser')) platforms.push('Browser');
  if (content.includes('npm install') || content.includes('package.json')) platforms.push('npm');
  if (content.includes('Homebrew') || content.includes('brew install')) platforms.push('Homebrew');
  if (content.includes('Zig')) platforms.push('Zig');
  if (content.includes('edge function') || content.includes('Edge')) platforms.push('Edge');
  if (content.includes('MCP')) platforms.push('MCP');

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
 * Main readme command
 */
export async function readmeCommand(
  projectPath?: string,
  options: ReadmeOptions = {}
) {
  const startTime = Date.now();
  const projectRoot = projectPath || process.cwd();

  try {
    console.log();
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.turbo_cat} faf readme - Smart 6 Ws Extraction`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    // Find README
    const readmePath = options.file
      ? path.resolve(projectRoot, options.file)
      : await findReadme(projectRoot);

    if (!readmePath || !(await fileExists(readmePath))) {
      console.log(chalk.red(`\n❌ No README found in ${projectRoot}`));
      console.log(chalk.yellow('  Create a README.md first, or specify with --file'));
      return;
    }

    console.log(chalk.gray(`\n   Reading: ${path.basename(readmePath)}`));

    // Read README content
    const readmeContent = await fs.readFile(readmePath, 'utf-8');

    // Get project name from package.json if available
    let projectName: string | undefined;
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      try {
        const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        projectName = pkg.name;
      } catch { /* ignore */ }
    }

    // Extract 6 Ws
    const extracted = extractSixWs(readmeContent, projectName);
    const elapsedTime = Date.now() - startTime;

    // Display results
    console.log();
    console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.precision} Extracted Human Context (6 Ws):`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    const displayField = (name: string, value: string | null, source?: string) => {
      const label = chalk.cyan(`   ${name.padEnd(6)}:`);
      if (value) {
        console.log(`${label} ${chalk.white(value)}`);
        if (source && !options.quiet) {
          console.log(chalk.gray(`           └─ ${source}`));
        }
      } else {
        console.log(`${label} ${chalk.gray('(not found)')}`);
      }
    };

    displayField('WHO', extracted.who, extracted.sources.who);
    displayField('WHAT', extracted.what, extracted.sources.what);
    displayField('WHY', extracted.why, extracted.sources.why);
    displayField('WHERE', extracted.where, extracted.sources.where);
    displayField('WHEN', extracted.when, extracted.sources.when);
    displayField('HOW', extracted.how, extracted.sources.how);

    // Show confidence
    const filledCount = [extracted.who, extracted.what, extracted.why, extracted.where, extracted.when, extracted.how]
      .filter(v => v !== null).length;

    console.log();
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(FAF_COLORS.fafCyan(`   Filled: ${filledCount}/6 slots`));
    console.log(FAF_COLORS.fafCyan(`   Confidence: ${extracted.confidence}%`));
    console.log(chalk.gray(`   Time: ${elapsedTime}ms`));

    // Apply to .faf if requested
    if (options.apply) {
      const fafPath = await findFafFile(projectRoot);

      if (!fafPath) {
        console.log();
        console.log(chalk.yellow(`⚠️ No .faf file found. Run 'faf init' first.`));
        console.log(chalk.gray('   Then run: faf readme --apply'));
        return;
      }

      console.log();
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.rocket} Applying to ${path.basename(fafPath)}...`));

      // Read existing .faf
      const fafContent = await fs.readFile(fafPath, 'utf-8');
      const fafData = parseYAML(fafContent) || {};

      // Merge human_context (only fill empty slots)
      if (!fafData.human_context) {
        fafData.human_context = {};
      }

      let appliedCount = 0;
      let skippedProtected = 0;
      const fields: (keyof ExtractedContext)[] = ['who', 'what', 'why', 'where', 'when', 'how'];

      for (const field of fields) {
        const value = extracted[field];
        const existingValue = fafData.human_context[field];
        const isEmpty = !existingValue || existingValue === null || existingValue === '';

        // Check if field is protected
        if (isFieldProtected(fafData, field)) {
          skippedProtected++;
          console.log(chalk.gray(`   🔒 Skipped ${field} (protected)`));
          continue;
        }

        if (value && (isEmpty || options.force)) {
          fafData.human_context[field] = value;
          appliedCount++;
          if (options.force && !isEmpty) {
            console.log(chalk.yellow(`   ↻ Replaced ${field}`));
          } else {
            console.log(chalk.green(`   ☑️ Filled ${field}`));
          }
        }
      }

      if (appliedCount > 0) {
        // Write updated .faf
        await fs.writeFile(fafPath, stringifyYAML(fafData), 'utf-8');
        console.log();
        console.log(FAF_COLORS.fafGreen(`☑️ Applied ${appliedCount} fields to ${path.basename(fafPath)}`));
        if (skippedProtected > 0) {
          console.log(chalk.gray(`   (${skippedProtected} protected fields unchanged)`));
        }
        console.log(chalk.gray('   Run: faf score --details to see your new score'));
      } else {
        console.log();
        if (skippedProtected > 0) {
          console.log(chalk.gray(`   ${skippedProtected} protected fields unchanged`));
          console.log(chalk.gray('   Use: faf check --unlock to remove protection'));
        } else {
          console.log(chalk.gray('   All slots already filled or no new data extracted'));
        }
      }
    } else if (filledCount > 0) {
      // Show hint to apply
      console.log();
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.magic_wand} To apply these to your .faf:`));
      console.log(chalk.white('   faf readme --apply'));
    }

    console.log();

  } catch (error) {
    console.log(chalk.red(`\n❌ README extraction failed:`));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
