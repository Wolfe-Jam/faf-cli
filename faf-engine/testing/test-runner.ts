/**
 * 🧪 faf-engine Test Runner
 * Comprehensive testing toolkit for trusted partners
 */

import { FafEngine } from '../src/core/FafEngine';
import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';

export interface TestProject {
  name: string;
  path: string;
  expectedFramework: string;
  expectedScore: number;
  type: 'react' | 'svelte' | 'python' | 'node' | 'unknown';
}

export interface TestResult {
  project: string;
  success: boolean;
  actualScore: number;
  expectedScore: number;
  accuracy: number;
  duration: number;
  memoryUsage: number;
  errors: string[];
  detectedFramework: string;
  confidence: number;
}

export interface TestSuite {
  name: string;
  projects: TestProject[];
}

export class EngineTestRunner {
  private engine: FafEngine;
  private results: TestResult[] = [];
  
  constructor() {
    this.engine = new FafEngine({ platform: 'cli' });
  }
  
  /**
   * Run comprehensive test suite
   */
  async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`🧪 Running test suite: ${suite.name}`);
    console.log(`📊 Testing ${suite.projects.length} projects`);
    
    this.results = [];
    
    for (const project of suite.projects) {
      const result = await this.testProject(project);
      this.results.push(result);
      
      console.log(`${result.success ? '✅' : '❌'} ${project.name}: ${result.actualScore}% (expected ${result.expectedScore}%)`);
    }
    
    return this.results;
  }
  
  /**
   * Test individual project
   */
  async testProject(project: TestProject): Promise<TestResult> {
    const startTime = performance.now();
    const memBefore = process.memoryUsage().heapUsed;
    
    try {
      // Generate context for project
      const result = await this.engine.generateContext(project.path);
      
      const endTime = performance.now();
      const memAfter = process.memoryUsage().heapUsed;
      
      const actualScore = result.score.totalScore;
      const accuracy = this.calculateAccuracy(actualScore, project.expectedScore);
      const success = accuracy >= 0.8; // 80% accuracy threshold
      
      return {
        project: project.name,
        success,
        actualScore,
        expectedScore: project.expectedScore,
        accuracy,
        duration: endTime - startTime,
        memoryUsage: (memAfter - memBefore) / 1024 / 1024, // MB
        errors: [],
        detectedFramework: result.context.stack?.frontend || 'Unknown',
        confidence: result.confidence
      };
      
    } catch (error) {
      const endTime = performance.now();
      
      return {
        project: project.name,
        success: false,
        actualScore: 0,
        expectedScore: project.expectedScore,
        accuracy: 0,
        duration: endTime - startTime,
        memoryUsage: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        detectedFramework: 'Unknown',
        confidence: 0
      };
    }
  }
  
  /**
   * Calculate accuracy between actual and expected scores
   */
  private calculateAccuracy(actual: number, expected: number): number {
    if (expected === 0) return actual === 0 ? 1 : 0;
    const diff = Math.abs(actual - expected);
    return Math.max(0, 1 - (diff / expected));
  }
  
  /**
   * Generate test report
   */
  generateReport(): {
    summary: any;
    details: TestResult[];
    recommendations: string[];
  } {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const avgAccuracy = this.results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const avgMemory = this.results.reduce((sum, r) => sum + r.memoryUsage, 0) / totalTests;
    const maxMemory = Math.max(...this.results.map(r => r.memoryUsage));
    
    const summary = {
      totalTests,
      successfulTests,
      successRate: (successfulTests / totalTests) * 100,
      avgAccuracy: avgAccuracy * 100,
      avgDuration: Math.round(avgDuration),
      avgMemoryUsage: Math.round(avgMemory * 100) / 100,
      maxMemoryUsage: Math.round(maxMemory * 100) / 100,
      errors: this.results.filter(r => r.errors.length > 0).length
    };
    
    const recommendations = this.generateRecommendations(summary);
    
    return {
      summary,
      details: this.results,
      recommendations
    };
  }
  
  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = [];
    
    if (summary.successRate < 90) {
      recommendations.push('🔍 Success rate below 90% - investigate failing test cases');
    }
    
    if (summary.avgAccuracy < 80) {
      recommendations.push('🎯 Average accuracy below 80% - improve scoring algorithm');
    }
    
    if (summary.avgDuration > 1000) {
      recommendations.push('⚡ Average duration over 1s - optimize performance');
    }
    
    if (summary.maxMemoryUsage > 100) {
      recommendations.push('🧠 Peak memory usage over 100MB - investigate memory leaks');
    }
    
    if (summary.errors > 0) {
      recommendations.push('🐛 Error handling needed for edge cases');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 All metrics within acceptable ranges - engine ready for production');
    }
    
    return recommendations;
  }
  
  /**
   * Export results to JSON
   */
  async exportResults(filePath: string): Promise<void> {
    const report = this.generateReport();
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    console.log(`📊 Test results exported to: ${filePath}`);
  }
}

/**
 * Predefined test suites for different scenarios
 */
export const TEST_SUITES = {
  QUICK_SMOKE: {
    name: 'Quick Smoke Test',
    projects: [
      {
        name: 'React App',
        path: './test-projects/react-app',
        expectedFramework: 'React',
        expectedScore: 75,
        type: 'react' as const
      },
      {
        name: 'Python API',
        path: './test-projects/python-api',
        expectedFramework: 'Python',
        expectedScore: 70,
        type: 'python' as const
      }
    ]
  },
  
  COMPREHENSIVE: {
    name: 'Comprehensive Test Suite',
    projects: [
      // Add more test projects here
    ]
  }
};

/**
 * CLI interface for testing
 */
export async function runCLITests(suiteName: keyof typeof TEST_SUITES = 'QUICK_SMOKE') {
  const runner = new EngineTestRunner();
  const suite = TEST_SUITES[suiteName];
  
  console.log('🚀 faf-engine Test Runner');
  console.log('=' .repeat(50));
  
  const results = await runner.runTestSuite(suite);
  const report = runner.generateReport();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Success Rate: ${report.summary.successRate.toFixed(1)}%`);
  console.log(`🎯 Avg Accuracy: ${report.summary.avgAccuracy.toFixed(1)}%`);
  console.log(`⚡ Avg Duration: ${report.summary.avgDuration}ms`);
  console.log(`🧠 Avg Memory: ${report.summary.avgMemoryUsage}MB`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(50));
    report.recommendations.forEach(rec => console.log(rec));
  }
  
  // Export detailed results
  await runner.exportResults(`./test-results-${Date.now()}.json`);
  
  return report;
}