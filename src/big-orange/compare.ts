/**
 * BIG ORANGE 🍊 - Core Comparison Logic
 * Compares AI responses with different .faf context levels
 */

import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import type { ComparisonRequest, ComparisonResults, WindowResults } from './types';
import { generateFafInstance } from './faf-generator';
import { FafCompiler } from '../compiler/faf-compiler';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Compare AI responses at two different .faf scores
 * Calls Claude API twice in parallel with different context levels
 */
export async function compareContexts(
  request: ComparisonRequest
): Promise<ComparisonResults> {
  
  console.log(`\n🍊 Comparing ${request.leftScore}% vs ${request.rightScore}%`);
  console.log(`Prompt: "${request.prompt}"\n`);

  // 1. Generate .faf instances at specified scores
  const [leftFaf, rightFaf] = await Promise.all([
    generateFafInstance(request.leftScore, request.projectPath),
    generateFafInstance(request.rightScore, request.projectPath)
  ]);

  console.log(`Generated .faf instances:`);
  console.log(`  Left: ${request.leftScore}% (${leftFaf.content.length} chars)`);
  console.log(`  Right: ${request.rightScore}% (${rightFaf.content.length} chars)\n`);

  // 2. Call Claude API with both contexts
  console.log('Calling Claude API...');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const [leftResponse, rightResponse] = await Promise.all([
    callClaudeWithContext(client, request.prompt, leftFaf.content, request.leftScore),
    callClaudeWithContext(client, request.prompt, rightFaf.content, request.rightScore)
  ]);

  console.log('✓ Both responses received\n');

  // 3. Calculate delta metrics
  const delta = calculateDelta(leftResponse, rightResponse);

  const results: ComparisonResults = {
    sessionId: randomUUID(),
    timestamp: new Date(),
    leftWindow: leftResponse,
    rightWindow: rightResponse,
    delta
  };

  return results;
}


/**
 * Call Claude API with specific .faf context
 * Uses FafCompiler for real scoring, no fake metrics
 */
async function callClaudeWithContext(
  client: Anthropic,
  prompt: string,
  fafContent: string,
  score: number
): Promise<WindowResults> {

  const startTime = Date.now();

  // Build system prompt based on .faf score
  const systemPrompt = score > 0
    ? `You are a developer with this project context:\n\n${fafContent}\n\nUse this context to inform your response.`
    : 'You are a developer with no project context. Ask clarifying questions as needed.';

  try {
    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const timeToComplete = (Date.now() - startTime) / 1000;
    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Get real FAF score using FafCompiler
    const { emoji, metadata } = await scoreFafContent(fafContent, score);

    return {
      fafScore: score,
      aiResponse,
      timeToComplete,
      emoji,
      fafMetadata: metadata
    };

  } catch (error) {
    console.error(`Error calling Claude (score ${score}%):`, error);
    throw error;
  }
}

/**
 * Score .faf content using FafCompiler
 * Returns championship emoji and metadata
 */
async function scoreFafContent(
  fafContent: string,
  expectedScore: number
): Promise<{ emoji: string; metadata?: { filled: number; total: number; checksum: string } }> {

  // Write .faf to temp file
  const tempDir = join(tmpdir(), 'big-orange-scoring');
  mkdirSync(tempDir, { recursive: true });
  const tempFafPath = join(tempDir, `temp-${Date.now()}.faf`);

  try {
    writeFileSync(tempFafPath, fafContent);

    // Use FafCompiler to score
    const compiler = new FafCompiler();
    const result = await compiler.compile(tempFafPath);

    // Get championship emoji based on score
    const emoji = getChampionshipEmoji(result.score);

    return {
      emoji,
      metadata: {
        filled: result.filled,
        total: result.total,
        checksum: result.checksum
      }
    };
  } catch (error) {
    console.error('Error scoring .faf:', error);
    // Fallback to expected score
    return {
      emoji: getChampionshipEmoji(expectedScore)
    };
  }
}

/**
 * Get championship emoji based on score
 * Uses FAF CLI's standard scoring tiers
 */
function getChampionshipEmoji(score: number): string {
  if (score >= 100) { return '🏆'; } // Trophy (championship)
  if (score >= 99) { return '🥇'; }  // Gold
  if (score >= 95) { return '🥈'; }  // Silver (Target 2)
  if (score >= 85) { return '🥉'; }  // Bronze (Target 1)
  if (score >= 70) { return '🟢'; }  // Green (GO!)
  if (score >= 55) { return '🟡'; }  // Yellow (Caution)
  if (score > 0) { return '🔴'; }    // Red <55%
  return '🤍';                       // White 0%
}


/**
 * Calculate delta metrics between two responses
 * Simple comparison: time saved and score improvement
 */
function calculateDelta(
  left: WindowResults,
  right: WindowResults
): ComparisonResults['delta'] {

  const timeSaved = left.timeToComplete - right.timeToComplete;
  const scoreImprovement = right.fafScore - left.fafScore;

  // Generate verdict
  let verdict = '';
  if (scoreImprovement > 0) {
    if (timeSaved > 0) {
      verdict = `.faf-${right.fafScore}% completed ${timeSaved.toFixed(1)}s faster with ${scoreImprovement}% better context`;
    } else {
      verdict = `.faf-${right.fafScore}% had ${scoreImprovement}% better context`;
    }
  } else {
    verdict = 'Context levels comparison complete';
  }

  return {
    timeSaved,
    scoreImprovement,
    verdict
  };
}
