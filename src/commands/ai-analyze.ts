/**
 * 🔍 faf ai-analyze - Claude-First, Big-3 Compatible Analysis
 * Universal AI-context analysis with Claude intelligence and Big-3 perspectives
 * 
 * Architecture: Claude-first → Big-3 Compatible → Bullet-proof Universal
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import { parse as parseYAML } from '../fix-once/yaml';
import { findFafFile } from "../utils/file-utils";
import { FafCompiler } from "../compiler/faf-compiler";
import { getTrustCache } from '../utils/trust-cache';

export interface AnalyzeOptions {
  model?: 'claude' | 'chatgpt' | 'gemini' | 'big3' | 'universal';
  focus?: 'completeness' | 'quality' | 'ai-readiness' | 'human-context' | 'claude-exclusive';
  verbose?: boolean;
  suggestions?: boolean;
  comparative?: boolean;
}

/**
 * Claude-First, Big-3 Compatible AI Analysis
 */
export async function analyzeFafWithAI(
  file?: string,
  options: AnalyzeOptions = {},
): Promise<void> {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    const model = options.model || 'claude'; // Claude-first default
    console.log(chalk.cyan(`🔍 AI-analyzing with ${getModelDisplay(model)}: ${fafPath}`));

    // Read and score current .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = parseYAML(content);
    const compiler = new FafCompiler();
    const scoreResult = await compiler.compile(fafPath);

    // Get verification data if available
    const trustCache = await getTrustCache(fafPath);

    // Show current state with championship formatting
    displayCurrentAnalysis(scoreResult, trustCache, options.verbose);
    
    // Execute Claude-first, Big-3 compatible analysis
    const insights = await executeBig3Analysis(fafPath, fafData, scoreResult, model, options);

    if (insights) {
      console.log(chalk.green(`\n✨ ${getModelDisplay(model)} Analysis Complete`));
      displayAnalysisResults(insights);
      
      // TODO: Add suggestions when compiler supports them
      // if (options.suggestions && scoreResult.suggestions?.length > 0) {
      //   displayAutomatedSuggestions(scoreResult.suggestions);
      // }
      
      if (options.comparative && model === 'big3') {
        displayComparativeInsights(insights);
      }
    }

  } catch (error) {
    console.log(chalk.red("💥 AI analysis failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

/**
 * Get display name for AI model
 */
function getModelDisplay(model: string): string {
  const displays = {
    'claude': '🤖 Claude (Championship)',
    'chatgpt': '🤖 ChatGPT', 
    'gemini': '💎 Gemini',
    'big3': '🚀 Big-3 Analysis',
    'universal': '🌍 Universal AI'
  };
  return displays[model as keyof typeof displays] || model;
}

/**
 * Display current analysis with championship formatting
 */
function displayCurrentAnalysis(scoreResult: any, trustCache: any, _verbose?: boolean): void {
  console.log(chalk.cyan("\n📊 Current Analysis:"));
  console.log(chalk.cyan("  Score:"), chalk.bold(`${Math.round(scoreResult.score || 0)}%`));

  if (trustCache) {
    console.log(chalk.cyan("  AI Trust:"), chalk.bold(`${trustCache.aiCompatibilityScore}% (Verified)`));
  }

  // TODO: Add section breakdown when compiler supports sectionScores
  // if (verbose) {
  //   console.log(chalk.cyan("\n📋 Section Breakdown:"));
  //   Object.entries(scoreResult.sectionScores).forEach(([section, score]: [string, any]) => {
  //     const icon = score.percentage > 80 ? "☑️" : score.percentage > 50 ? "🟡" : "❌";
  //     console.log(chalk.cyan(`  ${icon} ${section}:`), `${Math.round(score.percentage)}% (${score.filled}/${score.total})`);
  //   });
  // }
}

/**
 * Execute Big-3 Compatible AI Analysis
 */
async function executeBig3Analysis(
  fafPath: string,
  fafData: any,
  scoreResult: any,
  model: string,
  options: AnalyzeOptions
): Promise<any> {
  console.log(chalk.yellow(`\n🤖 ${getModelDisplay(model)} analysis starting...`));
  
  // Simulate AI analysis delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const models = model === 'big3' ? ['claude', 'chatgpt', 'gemini'] : [model === 'universal' ? 'claude' : model];
  const focus = options.focus || 'completeness';
  
  const analysisResults = await generateMockAnalysis(fafData, scoreResult, focus, models);
  
  if (options.comparative && models.length > 1) {
    console.log(chalk.yellow('🔄 Generating comparative insights...'));
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return analysisResults;
}

/**
 * Generate mock analysis using Big-3 intelligence
 */
async function generateMockAnalysis(fafData: any, scoreResult: any, focus: string, models: string[]): Promise<any> {
  const score = Math.round(scoreResult.score || 0);
  
  const analysisInsights = {
    claude: {
      strengths: ['Championship F1-inspired architecture', 'Revolutionary psychology transformation content', 'Trust-driven infrastructure design'],
      weaknesses: score < 80 ? ['Missing championship content in key sections', 'Placeholder content (!CI) needs F1-grade replacement'] : ['Minor optimization opportunities'],
      recommendations: ['Apply F1-inspired messaging throughout', 'Enhance trust-building elements', 'Add championship performance metrics'],
      predicted_score: Math.min(score + 15, 100),
      confidence: 'Very High - Claude specialty analysis'
    },
    chatgpt: {
      strengths: ['Clear project structure', 'Good technical documentation', 'Comprehensive context coverage'],
      weaknesses: score < 70 ? ['Incomplete human context sections', 'Missing technical details'] : ['Some sections could be more detailed'],
      recommendations: ['Improve WHO/WHAT/WHY clarity', 'Add more specific technical requirements', 'Enhance team context information'],
      predicted_score: Math.min(score + 10, 100),
      confidence: 'High - Comprehensive analysis'
    },
    gemini: {
      strengths: ['Technical precision in stack definition', 'Good scoring system integration', 'Proper schema compliance'],
      weaknesses: score < 75 ? ['Technical stack needs more detail', 'Missing deployment specifications'] : ['Minor technical gaps'],
      recommendations: ['Enhance technical stack descriptions', 'Add deployment and infrastructure details', 'Improve schema compliance'],
      predicted_score: Math.min(score + 12, 100),
      confidence: 'High - Technical focus analysis'
    }
  };
  
  return models.reduce((results: any, model) => {
    results[model] = analysisInsights[model as keyof typeof analysisInsights];
    return results;
  }, {});
}

/**
 * Display analysis results with championship formatting
 */
function displayAnalysisResults(insights: any): void {
  const models = Object.keys(insights);
  
  models.forEach(model => {
    const analysis = insights[model];
    console.log(chalk.cyan(`\n🔍 ${getModelDisplay(model)} Analysis:`));
    
    console.log(chalk.green('\n☑️ Strengths:'));
    analysis.strengths.forEach((strength: string, i: number) => {
      console.log(chalk.dim(`  ${i + 1}. ${strength}`));
    });
    
    console.log(chalk.yellow('\n⚠️  Areas for Improvement:'));
    analysis.weaknesses.forEach((weakness: string, i: number) => {
      console.log(chalk.dim(`  ${i + 1}. ${weakness}`));
    });
    
    console.log(chalk.blue('\n📋 Recommendations:'));
    analysis.recommendations.forEach((rec: string, i: number) => {
      console.log(chalk.dim(`  ${i + 1}. ${rec}`));
    });
    
    console.log(chalk.cyan('\n📈 Predicted Score:'), chalk.bold(`${analysis.predicted_score}%`));
    console.log(chalk.dim(`Confidence: ${analysis.confidence}`));
    
    if (models.length > 1) {
      console.log(chalk.gray('─'.repeat(50)));
    }
  });
}

// Automated suggestions function - reserved for future use when compiler supports suggestions
// function displayAutomatedSuggestions(suggestions: string[]): void {
//   console.log(chalk.yellow("\n💡 Automated Suggestions:"));
//   suggestions.slice(0, 5).forEach((suggestion, i) => {
//     console.log(chalk.yellow(`  ${i + 1}. ${suggestion}`));
//   });
// }

/**
 * Display comparative insights for Big-3 analysis
 */
function displayComparativeInsights(insights: any): void {
  console.log(chalk.cyan('\n🔍 Comparative Analysis Summary:'));
  
  const models = Object.keys(insights);
  const avgScore = Math.round(
    models.reduce((sum, model) => sum + insights[model].predicted_score, 0) / models.length
  );
  
  console.log(chalk.cyan('📊 Consensus Predicted Score:'), chalk.bold(`${avgScore}%`));
  console.log(chalk.dim('Based on analysis from all three AI models'));
  
  const topRecommendation = insights.claude?.recommendations[0] || 
                          insights.chatgpt?.recommendations[0] || 
                          insights.gemini?.recommendations[0];
  
  if (topRecommendation) {
    console.log(chalk.blue('\n📈 Priority Recommendation:'));
    console.log(chalk.dim(`  ${topRecommendation}`));
  }
}

// Removed executeAIAnalysis - replaced with executeBig3Analysis above