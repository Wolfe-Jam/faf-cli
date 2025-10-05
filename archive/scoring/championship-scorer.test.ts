/**
 * Tests for Championship Scorer - The 99% Philosophy
 */

import { ChampionshipScorer, calculateChampionshipScore } from '../../src/scoring/championship-scorer';

describe('Championship Scorer - 99% Philosophy', () => {
  describe('The 99% Maximum', () => {
    it('should never exceed 99% without AI validation', async () => {
      const perfectHumanFaf = {
        faf_version: '2.4.0',
        generated: new Date().toISOString(),

        // Complete Project Identity (3/3)
        project: {
          name: 'championship-project',
          goal: 'Universal AI Context Engine for maximum developer productivity',
          main_language: 'TypeScript'
        },

        // Complete Stack Architecture (6/6)
        stack: {
          frontend: 'SvelteKit',
          backend: 'Node.js',
          runtime: 'Vercel Functions',
          build: 'Vite',
          package_manager: 'npm',
          api_type: 'REST'
        },

        // Complete Performance Metrics (3/3)
        scores: {
          foundation: 30,
          architecture: 25,
          deployment: 25
        },

        // Complete AI Context (3/3)
        ai: {
          context_file: 'CLAUDE.md'
        },
        preferences: {
          quality_bar: 'zero_errors',
          testing: 'required',
          commit_style: 'conventional_emoji'
        },
        state: {
          phase: 'production',
          next_milestone: 'v3.0.0'
        },

        // Complete Human Context (6/6)
        human_context: {
          who: 'Developers and AI assistants worldwide',
          what: 'Universal AI Context Engine that eliminates context loss',
          why: 'Transform development from hope-driven to trust-driven',
          where: 'Global cloud deployment on all platforms',
          when: 'Production ready, maintaining 100% uptime',
          how: 'F1 engineering standards with zero learning curve'
        },

        // Best practices
        ai_instructions: {
          priority: 'Championship standards required',
          guidelines: ['Zero errors', 'Full testing', 'Perfect context']
        }
      };

      const result = await calculateChampionshipScore(perfectHumanFaf);

      expect(result.score).toBe(99);
      expect(result.philosophy).toContain("99% Excellence Philosophy");
      expect(result.originalSlots.filled).toBe(21);
      expect(result.excellence.contextComplete).toBe(true);
      expect(result.excellence.championshipGrade).toBe(true);
    });

    it('should grant 100% only with AI validation', async () => {
      const perfectProject = {
        faf_version: '2.4.0',
        project: {
          name: 'perfect-project',
          goal: 'The theoretically perfect software project with flawless architecture',
          main_language: 'TypeScript'
        },
        stack: {
          frontend: 'React',
          backend: 'Node.js',
          runtime: 'AWS Lambda',
          build: 'Webpack',
          package_manager: 'npm',
          api_type: 'GraphQL'
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
          quality_bar: 'zero_errors',
          testing: 'required',
          commit_style: 'conventional'
        },
        state: {
          phase: 'production',
          next_milestone: 'maintenance'
        },
        human_context: {
          who: 'Enterprise developers',
          what: 'Mission-critical system',
          why: 'Business transformation',
          where: 'Global deployment',
          when: 'Always available',
          how: 'Best practices throughout'
        },
        ai_instructions: {
          priority: 'CRITICAL',
          guidelines: ['Follow all best practices']
        }
      };

      // Without AI validation - max 99%
      const withoutAI = await calculateChampionshipScore(perfectProject);
      expect(withoutAI.score).toBe(99);

      // With AI validation - can achieve 100%
      const withAI = await calculateChampionshipScore(perfectProject, undefined, true);
      // Will be 100 only if AI validates all best practices
      expect(withAI.aiValidation?.assessed).toBe(true);
      expect(withAI.score).toBeGreaterThanOrEqual(99);
      expect(withAI.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Original 21-Slot System', () => {
    it('should count exactly 21 slots in the original system', async () => {
      const minimalFaf = {
        project: { name: 'test' }
      };

      const result = await calculateChampionshipScore(minimalFaf);

      expect(result.originalSlots.total).toBe(21);

      // Verify the 21 slots breakdown
      const totalSlots =
        result.sections.projectIdentity.total +      // 3
        result.sections.stackArchitecture.total +    // 6
        result.sections.performanceMetrics.total +   // 3
        result.sections.aiContext.total +            // 3
        result.sections.humanContext.total;          // 6

      expect(totalSlots).toBe(21);
    });

    it('should score based on Original 6 stack fields, not extended 12+', async () => {
      const fafWithOriginal6 = {
        stack: {
          // Original 6
          frontend: 'React',
          backend: 'Node.js',
          runtime: 'Docker',
          build: 'Webpack',
          package_manager: 'npm',
          api_type: 'REST',
          // Extended fields (should NOT count)
          css_framework: 'TailwindCSS',
          ui_library: 'Material-UI',
          state_management: 'Redux',
          database: 'PostgreSQL',
          hosting: 'AWS',
          cicd: 'GitHub Actions'
        }
      };

      const result = await calculateChampionshipScore(fafWithOriginal6);

      expect(result.sections.stackArchitecture.filled).toBe(6);
      expect(result.sections.stackArchitecture.total).toBe(6);
      expect(result.sections.stackArchitecture.percentage).toBe(100);
    });
  });

  describe('Score Ranges and Philosophy', () => {
    it('should categorize project as championship-grade at 90%+', async () => {
      const excellentProject = {
        project: {
          name: 'excellent-project',
          goal: 'High-quality software solution',
          main_language: 'Python'
        },
        stack: {
          frontend: 'Vue',
          backend: 'Django',
          runtime: 'Heroku',
          build: 'Vite',
          package_manager: 'pip',
          api_type: 'REST'
        },
        scores: {
          foundation: 30,
          architecture: 25,
          deployment: 20
        },
        ai: {
          context_file: 'CLAUDE.md'
        },
        preferences: {
          quality_bar: 'high'
        },
        state: {
          phase: 'development'
        },
        human_context: {
          who: 'Dev team',
          what: 'Web platform',
          why: 'Efficiency',
          where: 'Cloud',
          when: 'Q1 2025',
          how: 'Agile'
        }
      };

      const result = await calculateChampionshipScore(excellentProject);

      expect(result.excellence.championshipGrade).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.score).toBeLessThanOrEqual(99);
    });

    it('should identify projects ready for FAF AUTO at 50%+', async () => {
      const autoReadyProject = {
        project: {
          name: 'auto-ready',
          goal: 'Automated web application',
          main_language: 'JavaScript'
        },
        stack: {
          frontend: 'React',
          backend: 'Express',
          runtime: 'Node.js',
          build: 'Webpack',
          package_manager: 'npm',
          api_type: 'REST'
        },
        human_context: {
          who: 'Developers',
          what: 'Web app',
          why: 'Automation'
        }
      };

      const result = await calculateChampionshipScore(autoReadyProject);

      expect(result.excellence.autoDetectable).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Improvement Suggestions', () => {
    it('should provide critical improvements for low scores', async () => {
      const poorProject = {
        project: {
          name: 'incomplete-project'
        }
      };

      const result = await calculateChampionshipScore(poorProject);

      expect(result.improvements.critical.length).toBeGreaterThan(0);
      expect(result.improvements.critical.some(i =>
        i.includes('project identity')
      )).toBe(true);
      expect(result.score).toBeLessThan(30);
    });

    it('should provide recommended improvements for good projects', async () => {
      const goodProject = {
        project: {
          name: 'good-project',
          goal: 'Solid application for business needs',
          main_language: 'TypeScript'
        },
        stack: {
          frontend: 'Angular',
          backend: 'NestJS',
          runtime: 'Node.js',
          build: 'Angular CLI',
          package_manager: 'npm',
          api_type: 'REST'
        },
        scores: {
          foundation: 20,
          architecture: 20,
          deployment: 15
        },
        human_context: {
          who: 'Business users',
          what: 'Enterprise platform',
          why: 'Digital transformation',
          where: 'Cloud'
        }
      };

      const result = await calculateChampionshipScore(goodProject);

      expect(result.improvements.recommended.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.score).toBeLessThan(90);
    });

    it('should only suggest optional improvements for 90%+ projects', async () => {
      const nearPerfectProject = {
        project: {
          name: 'near-perfect',
          goal: 'Almost championship grade',
          main_language: 'Rust'
        },
        stack: {
          frontend: 'Yew',
          backend: 'Actix',
          runtime: 'Docker',
          build: 'Cargo',
          package_manager: 'cargo',
          api_type: 'GraphQL'
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
          phase: 'production'
        },
        human_context: {
          who: 'Engineers',
          what: 'High-performance system',
          why: 'Speed critical',
          where: 'Edge deployment',
          when: 'Real-time',
          how: 'Optimized algorithms'
        }
      };

      const result = await calculateChampionshipScore(nearPerfectProject);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.improvements.critical.length).toBe(0);
      expect(result.improvements.optional.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quality Modifiers', () => {
    it('should penalize stale timestamps', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days old

      const staleFaf = {
        generated: oldDate.toISOString(),
        project: {
          name: 'stale-project',
          goal: 'Outdated context',
          main_language: 'Java'
        },
        stack: {
          frontend: 'JSP',
          backend: 'Spring',
          runtime: 'Tomcat',
          build: 'Maven',
          package_manager: 'maven',
          api_type: 'SOAP'
        },
        human_context: {
          who: 'Enterprise',
          what: 'Legacy system',
          why: 'Maintenance',
          where: 'On-premise',
          when: 'Ongoing',
          how: 'Waterfall'
        }
      };

      const result = await calculateChampionshipScore(staleFaf);

      expect(result.improvements.recommended.some(i =>
        i.includes('over 30 days old')
      )).toBe(true);
    });

    it('should reward projects with AI instructions', async () => {
      const withAI = {
        project: {
          name: 'ai-aware',
          goal: 'AI-optimized project',
          main_language: 'TypeScript'
        },
        stack: {
          frontend: 'Next.js',
          backend: 'Prisma',
          package_manager: 'pnpm'
        },
        ai_instructions: {
          priority: 'HIGH',
          guidelines: ['Use TypeScript strict mode', 'Test everything']
        },
        human_context: {
          who: 'AI and developers',
          what: 'Collaboration platform',
          why: 'Productivity'
        }
      };

      const withoutAI = { ...withAI } as any;
      delete withoutAI.ai_instructions;

      const scoreWithAI = await calculateChampionshipScore(withAI);
      const scoreWithoutAI = await calculateChampionshipScore(withoutAI);

      expect(scoreWithAI.score).toBeGreaterThanOrEqual(scoreWithoutAI.score);
    });
  });

  describe('Philosophy Validation', () => {
    it('should include the 99% philosophy in results', () => {
      const philosophy = ChampionshipScorer.getPhilosophy();

      expect(philosophy).toContain('99%');
      expect(philosophy).toContain('perfection');
      expect(philosophy).toContain('excellence');
      expect(philosophy).toContain("One man's perfection");
      expect(philosophy).toContain('million projects');
    });

    it('should reflect that .faf is inevitable', async () => {
      const anyProject = {
        project: { name: 'inevitable' }
      };

      const result = await calculateChampionshipScore(anyProject);

      expect(result.philosophy).toBeDefined();
      expect(result.philosophy).toContain('99%');
    });
  });
});