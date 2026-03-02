/**
 * 🏎️ FAF v2.5.2 Hybrid Extraction Engine
 * Author: Gemini (Dev Team) + Claude (Integration)
 * Date: 2026-01-30
 *
 * Dual-Core System:
 * - Core A: Gemini Smart-Sync (high-fidelity, requires API key)
 * - Core B: Regex Fallback (zero-key portability)
 *
 * "In a meritocracy, the engine is the only thing that doesn't lie."
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface SixWs {
  who: string;
  what: string;
  why: string;
  where: string;
  when: string;
  how: string;
}

export interface HybridExtractionResult {
  dna: SixWs;
  core: 'A' | 'B';  // Which core was used
  confidence: number;  // 0-100 confidence in extraction
  sources: string[];   // Files that contributed to extraction
}

/**
 * v2.5.2 Multi-Stack Pattern Library
 * Supports: Node.js, Python, Go, Docker, Monorepos
 */
const PATTERN_LIBRARY = {
  // WHO patterns - Context Guardian / maintainer
  who: [
    /author["']:\s*["']([^"']+)["']/i,
    /authors\s*=\s*\[["']([^"']+)["']/i,
    /##\s*Author\s*\n+([^\n]+)/i,
    /maintainer["']:\s*["']([^"']+)["']/i,
    /contributors?\s*:\s*([^\n]+)/i,
    /"author"\s*:\s*"([^"]+)"/i,
    /author\s*=\s*"([^"]+)"/i,
  ],

  // WHAT patterns - Project description/purpose
  what: [
    /"description"\s*:\s*["']([^"']+)["']/i,
    /description\s*=\s*["']([^"']+)["']/i,
    /^#\s+(.+)/m,  // First H1 in README
    /##\s*(?:About|Overview|Summary)\s*\n+([^\n]+)/i,
    /"name"\s*:\s*["']([^"']+)["']/i,
    /name\s*=\s*["']([^"']+)["']/i,
  ],

  // WHERE patterns - Repository/homepage
  where: [
    /homepage["']:\s*["']([^"']+)["']/i,
    /repository["']:\s*["']([^"']+)["']/i,
    /git\+https:\/\/(.*)\.git/i,
    /url["']:\s*["']([^"']+)["']/i,
    /homepage\s*=\s*["']([^"']+)["']/i,
  ],

  // HOW patterns - Tech stack/dependencies
  how: [
    /dependencies["']:\s*\{([^}]+)\}/i,            // Node package.json
    /devDependencies["']:\s*\{([^}]+)\}/i,
    /dependencies\s*=\s*\[([^\]]+)\]/i,            // Python pyproject.toml
    /FROM\s+([^\s]+)/i,                            // Docker base image
    /plugins:\s*\[([^\]]+)\]/i,                    // Vite/Tailwind config
    /requires\s*=\s*\[([^\]]+)\]/i,                // Python setup.py
  ],

  // WHY patterns - Mission/purpose statement
  why: [
    /##\s*(?:Why|Mission|Purpose|Goal)\s*\n+([^\n]+)/i,
    /mission\s*:\s*["']?([^"'\n]+)["']?/i,
    /purpose\s*:\s*["']?([^"'\n]+)["']?/i,
    /goal\s*:\s*["']?([^"'\n]+)["']?/i,
    /this\s+(?:project|repo|package)\s+(?:is|was)\s+(?:designed|built|created)\s+(?:to|for)\s+([^.,\n]+)/i,
  ],
};

/**
 * Files to scan for context extraction
 */
const TARGET_FILES = [
  'package.json',
  'README.md',
  'CLAUDE.md',
  'GEMINI.md',
  'pyproject.toml',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  'Dockerfile',
  'docker-compose.yml',
  'pnpm-workspace.yaml',
  'turbo.json',
  'nx.json',
  'vite.config.ts',
  'tailwind.config.js',
];

/**
 * Core B: Regex Fallback Engine
 * Zero-dependency local extraction using pattern matching
 */
export function runRegexFallback(context: string, sources: string[]): HybridExtractionResult {
  const dna: SixWs = {
    who: 'Context Guardian',
    what: 'New .faf Project',
    where: 'Local Environment',
    when: new Date().toISOString(),
    why: 'To build high-integrity systems. YNWA.',
    how: 'Manual Stack Detection',
  };

  let matchCount = 0;
  const totalFields = 5; // Excluding 'when' which is always set

  // Attempt to match patterns from collected context
  // Note: 'when' is not in PATTERN_LIBRARY, always use timestamp
  const fieldsToMatch: (keyof typeof PATTERN_LIBRARY)[] = ['who', 'what', 'why', 'where', 'how'];

  fieldsToMatch.forEach(key => {
    for (const regex of PATTERN_LIBRARY[key]) {
      const match = context.match(regex);
      if (match && match[1]) {
        const extracted = match[1].trim().replace(/\n/g, ' ').substring(0, 200);
        if (extracted.length > 3) {
          dna[key as keyof SixWs] = extracted;
          matchCount++;
          break;
        }
      }
    }
  });

  const confidence = Math.round((matchCount / totalFields) * 100);

  return {
    dna,
    core: 'B',
    confidence,
    sources,
  };
}

/**
 * Core A: Gemini Smart-Sync Engine
 * AI-powered extraction using Gemini 2.0 Flash
 */
export async function runGeminiExtraction(
  context: string,
  sources: string[]
): Promise<HybridExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }

  // Dynamic import to avoid bundling Google AI SDK when not needed
   
  let GoogleGenerativeAI: any;
  try {
    const genaiModule = await import('@google/generative-ai' as string);
    GoogleGenerativeAI = genaiModule.GoogleGenerativeAI;
  } catch {
    throw new Error('@google/generative-ai not installed. Run: npm install @google/generative-ai');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are the .faf v2.5.2 Context Architect.
Parse these project files and distill them into the 6 W's (Who, What, Where, When, Why, How).

${context}

Return ONLY a valid JSON object with these exact keys:
{
  "who": "target audience or maintainer",
  "what": "project description or problem solved",
  "where": "repository URL or deployment location",
  "when": "${new Date().toISOString()}",
  "why": "mission or purpose (the Glory Goal)",
  "how": "primary tech stack"
}

Important:
- Set 'when' to the current ISO timestamp provided above
- Ensure 'why' captures the mission's "Glory" or purpose
- Keep values concise (under 200 characters each)
- Return ONLY the JSON, no markdown code blocks
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up response (remove markdown code blocks if present)
    const cleanJson = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson) as SixWs;

    // Ensure 'when' is always set to current time
    parsed.when = new Date().toISOString();

    return {
      dna: parsed,
      core: 'A',
      confidence: 85, // Gemini extraction assumed high confidence
      sources,
    };
  } catch (error) {
    throw new Error(`Gemini extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gather context from all available project files
 */
export async function gatherProjectContext(projectRoot: string): Promise<{ context: string; sources: string[] }> {
  let localContext = '';
  const sources: string[] = [];

  for (const file of TARGET_FILES) {
    const filePath = path.join(projectRoot, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      localContext += `\n--- FILE: ${file} ---\n${content}\n`;
      sources.push(file);
    } catch {
      // File doesn't exist, continue
    }
  }

  return { context: localContext, sources };
}

/**
 * Main Hybrid Engine Entry Point
 * Attempts Core A (Gemini), falls back to Core B (Regex)
 */
export async function runHybridEngine(projectRoot: string): Promise<HybridExtractionResult> {
  const { context, sources } = await gatherProjectContext(projectRoot);

  // Core A vs Core B Toggle
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('✨ Gemini Smart-Sync Active.');
      return await runGeminiExtraction(context, sources);
    } catch (err) {
      console.log('⚠️ Gemini extraction failed, falling back to Regex...');
      console.log(`   Error: ${err instanceof Error ? err.message : String(err)}`);
      return runRegexFallback(context, sources);
    }
  } else {
    console.log('⚠️ No API Key found. Engaging local Regex Fallback...');
    return runRegexFallback(context, sources);
  }
}

/**
 * Quick test runner for development
 */
export async function testHybridEngine(): Promise<void> {
  console.log('🚀 v2.5.2 Hybrid Engine: Test Mode');
  console.log('================================');

  const result = await runHybridEngine(process.cwd());

  console.log(`\nCore Used: ${result.core === 'A' ? 'Gemini Smart-Sync' : 'Regex Fallback'}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Sources: ${result.sources.join(', ')}`);
  console.log('\nExtracted DNA:');
  console.log(JSON.stringify(result.dna, null, 2));
}

// Export for CLI integration
export default {
  runHybridEngine,
  runRegexFallback,
  runGeminiExtraction,
  gatherProjectContext,
  testHybridEngine,
};
