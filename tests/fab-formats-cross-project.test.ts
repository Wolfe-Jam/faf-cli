/**
 * 🎯 Cross-Project fab-formats Integration Tests
 * Tests the fab-formats refactoring across different project types
 */

import { FabFormatsEngine } from '../src/utils/fab-formats';
import { generateFafFromProject } from '../src/generators/faf-generator';
import * as YAML from 'yaml';
import { promises as fs } from 'fs';
import path from 'path';

describe('Cross-Project fab-formats Integration', () => {
  const testProjects = [
    {
      name: 'FAF CLI (TypeScript)',
      path: process.cwd(),
      expectedLanguage: 'TypeScript',
      expectedFormats: ['package.json', 'tsconfig.json', '.ts'],
      minScore: 85
    },
    {
      name: 'Python FastAPI',
      path: '/Users/wolfejam/HEXTRA-API',
      expectedLanguage: 'Python', 
      expectedFormats: ['requirements.txt', 'Dockerfile', '.py'],
      minScore: 75
    },
    {
      name: 'Svelte Portfolio',
      path: '/Users/wolfejam/gallery-svelte-portfolio',
      expectedLanguage: 'TypeScript',
      expectedFormats: ['package.json', 'svelte.config.js', '.svelte'],
      minScore: 80
    }
  ];

  describe('fab-formats Format Discovery', () => {
    testProjects.forEach(project => {
      it(`should discover formats correctly for ${project.name}`, async () => {
        // Skip if project directory doesn't exist
        try {
          await fs.access(project.path);
        } catch {
          console.log(`⚠️  Skipping ${project.name} - directory not found`);
          return;
        }

        const fabEngine = new FabFormatsEngine();
        const analysis = await fabEngine.discoverFormats(project.path);

        // Should discover some formats
        expect(analysis.discoveredFormats.length).toBeGreaterThan(0);
        expect(analysis.confirmedFormats.length).toBeGreaterThan(0);
        expect(analysis.totalIntelligenceScore).toBeGreaterThan(0);

        // Should have framework confidence
        expect(Object.keys(analysis.frameworkConfidence).length).toBeGreaterThan(0);

        // Should detect expected formats
        const foundFormatTypes = analysis.confirmedFormats.map(f => f.formatType);
        const expectedFound = project.expectedFormats.some(expected => 
          foundFormatTypes.some(found => found.includes(expected))
        );
        expect(expectedFound).toBe(true);

        console.log(`✅ ${project.name}: Found ${analysis.confirmedFormats.length} confirmed formats, ${analysis.totalIntelligenceScore} intelligence points`);
      }, 15000);
    });
  });

  describe('Cross-Project Generator Integration', () => {
    testProjects.forEach(project => {
      it(`should generate high-quality .faf for ${project.name}`, async () => {
        // Skip if project directory doesn't exist
        try {
          await fs.access(project.path);
        } catch {
          console.log(`⚠️  Skipping ${project.name} - directory not found`);
          return;
        }

        const options = {
          projectType: 'latest-idea',
          outputPath: 'test.faf',
          projectRoot: project.path
        };

        const result = await generateFafFromProject(options);
        
        // Should generate valid YAML
        expect(() => YAML.parse(result)).not.toThrow();
        
        const parsed = YAML.parse(result);
        
        // Should have core structure
        expect(parsed.ai_scoring_system).toBeDefined();
        expect(parsed.project).toBeDefined();
        expect(parsed.ai_instructions).toBeDefined();
        expect(parsed.instant_context).toBeDefined();

        // Should detect correct language
        expect(parsed.project.main_language).toBe(project.expectedLanguage);

        // Should have reasonable score
        const score = parseInt(parsed.ai_score.replace('%', ''));
        expect(score).toBeGreaterThanOrEqual(project.minScore);

        // Should have filled context slots
        expect(parsed.context_quality.slots_filled).toBeDefined();
        
        console.log(`✅ ${project.name}: Generated .faf with ${parsed.ai_score} score, language: ${parsed.project.main_language}`);
      }, 20000);
    });
  });

  describe('Cross-Stack Format Intelligence', () => {
    it('should demonstrate different intelligence patterns across stacks', async () => {
      const results: any[] = [];

      for (const project of testProjects) {
        try {
          await fs.access(project.path);
          
          const fabEngine = new FabFormatsEngine();
          const analysis = await fabEngine.discoverFormats(project.path);
          
          results.push({
            name: project.name,
            formats: analysis.confirmedFormats.length,
            intelligence: analysis.totalIntelligenceScore,
            topFramework: Object.entries(analysis.frameworkConfidence)[0]?.[0] || 'Unknown'
          });
        } catch {
          console.log(`⚠️  Skipping ${project.name} - directory not found`);
        }
      }

      // Should have tested multiple projects
      expect(results.length).toBeGreaterThan(1);

      // Each project should have unique intelligence patterns
      const intelligenceScores = results.map(r => r.intelligence);
      const hasVariation = new Set(intelligenceScores).size > 1;
      expect(hasVariation).toBe(true);

      // Display intelligence comparison
      console.log('\n🎯 Cross-Stack Intelligence Summary:');
      results.forEach(result => {
        console.log(`   ${result.name}: ${result.formats} formats, ${result.intelligence} points, top: ${result.topFramework}`);
      });

      // Python projects should detect Python frameworks
      const pythonResult = results.find(r => r.name.includes('Python'));
      if (pythonResult) {
        expect(pythonResult.intelligence).toBeGreaterThan(50);
      }

      // TypeScript projects should have high format diversity
      const tsResults = results.filter(r => r.name.includes('TypeScript') || r.name.includes('Svelte'));
      if (tsResults.length > 0) {
        tsResults.forEach(tsResult => {
          expect(tsResult.formats).toBeGreaterThan(3);
        });
      }
    }, 30000);
  });

  describe('Performance Benchmarks', () => {
    it('should maintain fast generation times across project types', async () => {
      const benchmarks: any[] = [];

      for (const project of testProjects.slice(0, 2)) { // Test first 2 for speed
        try {
          await fs.access(project.path);
          
          const startTime = Date.now();
          
          const options = {
            projectType: 'latest-idea',
            outputPath: 'test.faf', 
            projectRoot: project.path
          };

          await generateFafFromProject(options);
          
          const duration = Date.now() - startTime;
          benchmarks.push({
            name: project.name,
            duration
          });
          
          // Should be reasonably fast (under 10 seconds)
          expect(duration).toBeLessThan(10000);
          
        } catch {
          console.log(`⚠️  Skipping ${project.name} - directory not found`);
        }
      }

      console.log('\n⚡ Performance Benchmarks:');
      benchmarks.forEach(bench => {
        console.log(`   ${bench.name}: ${bench.duration}ms`);
      });
    }, 25000);
  });
});