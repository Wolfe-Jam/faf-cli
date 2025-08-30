/**
 * Tests for score calculator
 */

import { calculateFafScore } from '../../src/scoring/score-calculator';
import * as YAML from 'yaml';

describe('Score Calculator', () => {
  it('should calculate perfect score for comprehensive .faf file', () => {
    const comprehensiveFaf = {
      faf_version: '2.4.0',
      project: {
        name: 'comprehensive-project',
        description: 'A fully documented project with all sections',
        version: '1.0.0',
        type: 'typescript',
        repository: 'https://github.com/user/repo',
        homepage: 'https://project.com',
        faf_score: 0 // Will be calculated
      },
      ai_instructions: {
        priority: 'CRITICAL',
        message: 'ATTENTION AI: This is a comprehensive project with full context',
        guidelines: [
          'Follow TypeScript best practices',
          'Maintain high code quality',
          'Write comprehensive tests'
        ]
      },
      human_context: {
        who: {
          target_audience: 'Enterprise developers and teams',
          stakeholders: ['Product team', 'Engineering team', 'QA team', 'DevOps team']
        },
        what: {
          purpose: 'Build reliable, scalable CLI tooling for AI context generation',
          scope: 'Complete command-line interface with full feature set',
          requirements: ['Performance', 'Reliability', 'Usability', 'Scalability']
        },
        why: {
          business_value: 'Streamline AI context generation for enterprise development teams',
          success_metrics: [
            '90%+ test coverage',
            'Sub-second execution time',
            'Zero critical bugs in production',
            '95%+ user satisfaction'
          ]
        }
      },
      technical_context: {
        architecture: {
          style: 'Modular CLI architecture with plugin system',
          patterns: ['Command pattern', 'Strategy pattern', 'Factory pattern', 'Observer pattern']
        },
        tech_stack: {
          primary: ['TypeScript', 'Node.js', 'Commander.js'],
          testing: ['Jest', 'Supertest', 'TypeScript'],
          tools: ['ESLint', 'Prettier', 'Husky', 'GitHub Actions']
        },
        key_files: [
          {
            path: 'src/cli.ts',
            purpose: 'Main CLI entry point and command definitions'
          },
          {
            path: 'src/commands/',
            purpose: 'Individual command implementations'
          },
          {
            path: 'src/utils/',
            purpose: 'Shared utility functions and helpers'
          }
        ]
      },
      dependencies: {
        production: {
          'commander': '^12.0.0',
          'chalk': '^4.1.2',
          'yaml': '^2.3.4',
          'glob': '^10.3.10'
        },
        development: {
          'jest': '^29.7.0',
          'typescript': '^5.3.3',
          '@types/node': '^20.0.0',
          'eslint': '^8.56.0'
        }
      }
    };

    const result = calculateFafScore(comprehensiveFaf);
    
    expect(result.totalScore).toBeGreaterThan(85);
    expect(result.sectionScores.project?.percentage).toBeGreaterThan(80);
    expect(result.sectionScores.human_context?.percentage).toBeGreaterThan(80);
    expect(result.sectionScores.ai_instructions?.percentage).toBeGreaterThan(80);
  });

  it('should calculate low score for minimal .faf file', () => {
    const minimalFaf = {
      faf_version: '2.4.0',
      project: {
        name: 'minimal-project',
        faf_score: 0
      }
    };

    const result = calculateFafScore(minimalFaf);
    
    expect(result.totalScore).toBeLessThan(30);
    expect(result.sectionScores.project?.percentage || 0).toBeLessThan(50);
    expect(result.sectionScores.human_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.ai_instructions?.percentage || 0).toBe(0);
  });

  it('should score human context section accurately', () => {
    const fafWithGoodHumanContext = {
      faf_version: '2.4.0',
      project: {
        name: 'human-context-test',
        description: 'Testing human context scoring',
        version: '1.0.0',
        faf_score: 0
      },
      human_context: {
        who: {
          target_audience: 'Software developers and DevOps engineers',
          stakeholders: ['Development team', 'Operations team']
        },
        what: {
          purpose: 'Automate deployment pipeline management',
          scope: 'CI/CD tooling for multiple environments',
          requirements: ['Reliability', 'Performance']
        },
        why: {
          business_value: 'Reduce deployment time by 80%',
          success_metrics: ['Zero failed deployments', 'Sub-5-minute deployments']
        }
      }
    };

    const result = calculateFafScore(fafWithGoodHumanContext);
    
    expect(result.sectionScores.human_context?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(30);
  });

  it('should score technical context section accurately', () => {
    const fafWithGoodTechContext = {
      faf_version: '2.4.0',
      project: {
        name: 'tech-context-test',
        description: 'Testing technical context scoring',
        version: '1.0.0',
        faf_score: 0
      },
      technical_context: {
        architecture: {
          style: 'Microservices architecture',
          patterns: ['API Gateway', 'Circuit Breaker', 'Event Sourcing']
        },
        tech_stack: {
          primary: ['Node.js', 'Express', 'MongoDB'],
          testing: ['Jest', 'Supertest'],
          tools: ['Docker', 'Kubernetes', 'GitHub Actions']
        },
        key_files: [
          {
            path: 'src/app.js',
            purpose: 'Main application entry point'
          },
          {
            path: 'src/routes/',
            purpose: 'API route definitions'
          }
        ]
      }
    };

    const result = calculateFafScore(fafWithGoodTechContext);
    
    expect(result.sectionScores.technical_context?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(30);
  });

  it('should score AI instructions section accurately', () => {
    const fafWithGoodAIInstructions = {
      faf_version: '2.4.0',
      project: {
        name: 'ai-instructions-test',
        description: 'Testing AI instructions scoring',
        version: '1.0.0',
        faf_score: 0
      },
      ai_instructions: {
        priority: 'CRITICAL',
        message: 'ATTENTION AI: This is a mission-critical financial system that requires extreme attention to security and data integrity',
        guidelines: [
          'Always validate input data thoroughly',
          'Use prepared statements for database queries',
          'Log all financial transactions',
          'Implement proper error handling'
        ]
      }
    };

    const result = calculateFafScore(fafWithGoodAIInstructions);
    
    expect(result.sectionScores.ai_instructions?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(25);
  });

  it('should handle missing sections gracefully', () => {
    const incompleteFaf = {
      faf_version: '2.4.0',
      project: {
        name: 'incomplete-project',
        description: 'Project missing several sections',
        version: '1.0.0',
        faf_score: 0
      },
      // Missing human_context, technical_context, ai_instructions
    };

    const result = calculateFafScore(incompleteFaf);
    
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.sectionScores.project?.percentage || 0).toBeGreaterThan(0);
    expect(result.sectionScores.human_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.technical_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.ai_instructions?.percentage || 0).toBe(0);
  });

  it('should weight sections according to importance', () => {
    // Create two FAF files with same content but in different sections
    const fafWithOnlyBasicInfo = {
      faf_version: '2.4.0',
      project: {
        name: 'basic-only',
        description: 'Comprehensive description',
        version: '1.0.0',
        type: 'typescript',
        repository: 'https://github.com/test/repo',
        faf_score: 0
      }
    };

    const fafWithOnlyHumanContext = {
      faf_version: '2.4.0',
      project: {
        name: 'human-context-only',
        faf_score: 0
      },
      human_context: {
        who: { target_audience: 'Developers' },
        what: { purpose: 'Testing' },
        why: { business_value: 'Learning' }
      }
    };

    const basicResult = calculateFafScore(fafWithOnlyBasicInfo);
    const humanResult = calculateFafScore(fafWithOnlyHumanContext);
    
    // Human context should be weighted more heavily than basic info
    expect(humanResult.totalScore).toBeGreaterThan(basicResult.totalScore);
  });
});