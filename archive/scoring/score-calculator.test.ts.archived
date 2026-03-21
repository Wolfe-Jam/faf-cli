/**
 * Tests for score calculator
 */

import { calculateFafScore } from '../../src/scoring/score-calculator';
import * as YAML from 'yaml';

describe('Score Calculator', () => {
  it('should calculate perfect score for comprehensive .faf file', async () => {
    const comprehensiveFaf = {
      faf_version: '2.4.0',
      generated: '2025-09-19T02:30:00.000Z',

      // TECH COMPONENTS (15 slots)
      project: {
        name: 'comprehensive-project',
        goal: 'Universal AI Context Engine for enterprise teams',
        main_language: 'TypeScript'
      },
      stack: {
        frontend: 'SvelteKit',
        css_framework: 'TailwindCSS',
        ui_library: 'ShadowUI',
        state_management: 'Svelte Stores',
        backend: 'Node.js',
        runtime: 'Vercel Functions',
        database: 'PostgreSQL',
        connection: 'Prisma',
        build: 'Vite',
        package_manager: 'npm',
        api_type: 'REST API',
        hosting: 'Vercel',
        cicd: 'GitHub Actions'
      },
      scores: {
        foundation: 30,
        architecture: 25,
        deployment: 25
      },
      ai: {
        context_file: 'CLAUDE.md'
      },
      preferences: {
        quality_bar: 'zero_errors'
      },
      state: {
        phase: 'development'
      },
      // AI Instructions (bonus scoring)
      ai_instructions: {
        priority: 'CRITICAL',
        message: 'This is a championship-grade project requiring F1 standards',
        guidelines: [
          'Follow TypeScript best practices',
          'Maintain high code quality',
          'Write comprehensive tests'
        ],
        priority_order: [
          'Follow TypeScript best practices',
          'Maintain high code quality',
          'Write comprehensive tests'
        ],
        working_style: {
          code_first: true,
          explanations: 'minimal',
          testing: 'required'
        }
      },
      // HUMAN CONTEXT (6 slots)
      human_context: {
        who: 'Developers and AI assistants working on enterprise projects',
        what: 'Universal AI Context Engine with CLI tooling',
        why: 'Make AI handoffs instant - 30 seconds instead of 20 minutes',
        where: 'Global - Cloud deployment on Vercel',
        when: 'Production Ready Q1 2025',
        how: 'F1 Quality standards with zero learning curve'
      }
    };

    const result = await calculateFafScore(comprehensiveFaf);

    expect(result.totalScore).toBeGreaterThan(85);
    expect(result.sectionScores.project?.percentage).toBeGreaterThan(80);
    expect(result.sectionScores.human_context?.percentage).toBeGreaterThan(80);
    expect(result.sectionScores.ai_instructions?.percentage).toBeGreaterThan(80);
  });

  it('should calculate low score for minimal .faf file', async () => {
    const minimalFaf = {
      faf_version: '2.4.0',
      project: {
        name: 'minimal-project',
        faf_score: 0
      }
    };

    const result = await calculateFafScore(minimalFaf);
    
    expect(result.totalScore).toBeLessThan(30);
    expect(result.sectionScores.project?.percentage || 0).toBeLessThan(50);
    expect(result.sectionScores.human_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.ai_instructions?.percentage || 0).toBe(0);
  });

  it('should score human context section accurately', async () => {
    const fafWithGoodHumanContext = {
      faf_version: '2.4.0',
      project: {
        name: 'human-context-test',
        description: 'Testing human context scoring',
        version: '1.0.0',
        main_language: 'TypeScript'
      },
      human_context: {
        who: 'Software developers and DevOps engineers',
        what: 'Automate deployment pipeline management',
        why: 'Reduce deployment time by 80%',
        where: 'Cloud infrastructure',
        when: 'Q1 2025',
        how: 'GitOps and automation'
      }
    };

    const result = await calculateFafScore(fafWithGoodHumanContext);

    expect(result.sectionScores.human_context?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(30);
  });

  it('should score technical context section accurately', async () => {
    const fafWithGoodTechContext = {
      faf_version: '2.4.0',
      project: {
        name: 'tech-context-test',
        description: 'Testing technical context scoring',
        version: '1.0.0',
        main_language: 'TypeScript'
      },
      stack: {
        frontend: 'React',
        backend: 'Express',
        database: 'MongoDB',
        build: 'Webpack',
        package_manager: 'npm'
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

    const result = await calculateFafScore(fafWithGoodTechContext);

    expect(result.sectionScores.technical_context?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(20);
  });

  it('should score AI instructions section accurately', async () => {
    const fafWithGoodAIInstructions = {
      faf_version: '2.4.0',
      project: {
        name: 'ai-instructions-test',
        description: 'Testing AI instructions scoring',
        version: '1.0.0',
        main_language: 'TypeScript'
      },
      stack: {
        frontend: 'React',
        backend: 'Node.js',
        build: 'Vite',
        package_manager: 'npm'
      },
      ai_instructions: {
        priority: 'CRITICAL',
        message: 'ATTENTION AI: This is a mission-critical financial system that requires extreme attention to security and data integrity',
        guidelines: [
          'Always validate input data thoroughly',
          'Use prepared statements for database queries',
          'Log all financial transactions',
          'Implement proper error handling'
        ],
        priority_order: [
          'Security first',
          'Data integrity second',
          'Performance third'
        ],
        working_style: {
          code_first: true,
          testing: 'required',
          documentation: 'comprehensive'
        }
      }
    };

    const result = await calculateFafScore(fafWithGoodAIInstructions);

    expect(result.sectionScores.ai_instructions?.percentage || 0).toBeGreaterThan(70);
    expect(result.totalScore).toBeGreaterThan(20);
  });

  it('should handle missing sections gracefully', async () => {
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

    const result = await calculateFafScore(incompleteFaf);
    
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.sectionScores.project?.percentage || 0).toBeGreaterThan(0);
    expect(result.sectionScores.human_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.technical_context?.percentage || 0).toBe(0);
    expect(result.sectionScores.ai_instructions?.percentage || 0).toBe(0);
  });

  it('should weight sections according to importance', async () => {
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

    const basicResult = await calculateFafScore(fafWithOnlyBasicInfo);
    const humanResult = await calculateFafScore(fafWithOnlyHumanContext);

    // Human context should be weighted more heavily than basic info
    expect(humanResult.totalScore).toBeGreaterThan(basicResult.totalScore);
  });
});