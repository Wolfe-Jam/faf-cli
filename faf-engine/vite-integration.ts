/**
 * 🚀 Vite Plugin for faf-engine Integration
 * Seamless integration with Vite-powered applications
 */

import type { Plugin, ResolvedConfig } from 'vite';
import { FafEngine } from './src/core/FafEngine';
import { WebAdapter } from './src/adapters/WebAdapter';
import path from 'path';
import { promises as fs } from 'fs';

export interface ViteFafEngineOptions {
  /**
   * Auto-generate .faf file during build
   * @default true
   */
  autoGenerate?: boolean;
  
  /**
   * Output path for generated .faf file
   * @default '.faf'
   */
  outputPath?: string;
  
  /**
   * Include faf-engine in client bundle for runtime analysis
   * @default false (build-time only)
   */
  includeInBundle?: boolean;
  
  /**
   * Patterns to include in analysis
   * @default ['src/**/*.{ts,js,tsx,jsx,svelte,vue}']
   */
  include?: string[];
  
  /**
   * Patterns to exclude from analysis
   * @default ['node_modules/**', 'dist/**', '.git/**']
   */
  exclude?: string[];
  
  /**
   * Enable development mode features
   * @default true in dev, false in build
   */
  devMode?: boolean;
  
  /**
   * Deployment target optimization
   * @default 'auto-detect'
   */
  target?: 'vercel' | 'netlify' | 'cloudflare' | 'auto-detect';
}

/**
 * Vite Plugin for faf-engine
 */
export function viteFafEngine(options: ViteFafEngineOptions = {}): Plugin {
  const {
    autoGenerate = true,
    outputPath = '.faf',
    includeInBundle = false,
    include = ['src/**/*.{ts,js,tsx,jsx,svelte,vue}'],
    exclude = ['node_modules/**', 'dist/**', '.git/**'],
    target = 'auto-detect'
  } = options;
  
  let config: ResolvedConfig;
  let projectRoot: string;
  
  return {
    name: 'faf-engine',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      projectRoot = resolvedConfig.root;
      options.devMode = options.devMode ?? resolvedConfig.command === 'serve';
    },
    
    async buildStart() {
      if (!autoGenerate) return;
      
      console.log('🎯 faf-engine: Analyzing project structure...');
      
      try {
        // Create engine instance for build-time analysis
        const engine = new FafEngine({
          platform: 'cli',
          projectDir: projectRoot
        });
        
        // Generate context
        const result = await engine.generateContext(projectRoot);
        
        // Optimize based on deployment target
        const optimizedContext = await this.optimizeForTarget(result.context, target);
        
        // Generate .faf file
        const fafContent = await engine.saveFaf(
          optimizedContext, 
          path.join(projectRoot, outputPath)
        );
        
        console.log(`✅ faf-engine: Generated ${outputPath} (${result.score.totalScore}% context)`);
        
        // Add to build assets if needed
        if (includeInBundle) {
          this.emitFile({
            type: 'asset',
            fileName: outputPath,
            source: fafContent
          });
        }
        
      } catch (error) {
        console.warn(`⚠️  faf-engine: Analysis failed -`, error);
      }
    },
    
    async generateBundle(opts, bundle) {
      // Add deployment-specific optimizations
      if (target !== 'auto-detect') {
        await this.addDeploymentAssets(bundle, target);
      }
    },
    
    configureServer(server) {
      if (!options.devMode) return;
      
      // Add dev-time endpoint for live analysis
      server.middlewares.use('/api/__faf-engine', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const engine = new FafEngine({ 
              platform: 'cli',
              projectDir: projectRoot 
            });
            
            const result = await engine.generateContext(projectRoot);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              context: result.context,
              score: result.score,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        } else {
          next();
        }
      });
      
      console.log('🔄 faf-engine: Dev server endpoint available at /api/__faf-engine');
    },
    
    // Helper methods
    async optimizeForTarget(context: any, target: string) {
      const optimizations = {
        vercel: {
          'stack.hosting': 'Vercel',
          'stack.cicd': 'Vercel',
          'deployment_optimized': true,
          'vercel_config': {
            functions: { 'api/**': { runtime: 'nodejs18.x' } }
          }
        },
        netlify: {
          'stack.hosting': 'Netlify',
          'stack.cicd': 'Netlify',
          'deployment_optimized': true,
          'netlify_config': {
            build: { functions: 'netlify/functions' }
          }
        },
        cloudflare: {
          'stack.hosting': 'Cloudflare',
          'stack.cicd': 'Cloudflare',
          'deployment_optimized': true,
          'cloudflare_config': {
            compatibility_date: '2025-01-01'
          }
        }
      };
      
      const targetOptimizations = optimizations[target] || {};
      return { ...context, ...targetOptimizations };
    },
    
    async addDeploymentAssets(bundle: any, target: string) {
      // Add target-specific configuration files
      const configs = {
        vercel: {
          'vercel.json': {
            functions: {
              'api/**': { runtime: 'nodejs18.x' }
            },
            rewrites: [
              { source: '/api/faf-engine', destination: '/api/faf-engine.js' }
            ]
          }
        },
        netlify: {
          'netlify.toml': `
[build]
  functions = "netlify/functions"
  
[functions]
  node_bundler = "esbuild"
  
[[redirects]]
  from = "/api/faf-engine"
  to = "/.netlify/functions/faf-engine"
  status = 200
          `
        },
        cloudflare: {
          'wrangler.toml': `
name = "faf-engine-worker"
compatibility_date = "2025-01-01"

[vars]
FAF_ENGINE_VERSION = "1.0.0"
          `
        }
      };
      
      const config = configs[target];
      if (config) {
        Object.entries(config).forEach(([filename, content]) => {
          this.emitFile({
            type: 'asset',
            fileName: filename,
            source: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
          });
        });
      }
    }
  };
}

/**
 * Vite Configuration Helpers
 */
export const ViteFafEnginePresets = {
  /**
   * Svelte + faf-engine preset
   */
  svelte(options: ViteFafEngineOptions = {}) {
    return {
      plugins: [
        viteFafEngine({
          include: ['src/**/*.{svelte,ts,js}'],
          target: 'vercel',
          ...options
        })
      ],
      build: {
        lib: {
          entry: 'src/lib/index.ts',
          formats: ['es', 'cjs']
        }
      }
    };
  },
  
  /**
   * React + faf-engine preset  
   */
  react(options: ViteFafEngineOptions = {}) {
    return {
      plugins: [
        viteFafEngine({
          include: ['src/**/*.{tsx,ts,jsx,js}'],
          target: 'vercel',
          ...options
        })
      ]
    };
  },
  
  /**
   * Vue + faf-engine preset
   */
  vue(options: ViteFafEngineOptions = {}) {
    return {
      plugins: [
        viteFafEngine({
          include: ['src/**/*.{vue,ts,js}'],
          target: 'netlify',
          ...options
        })
      ]
    };
  }
};

/**
 * CLI Integration with Vite
 */
export async function viteBuild(projectDir: string, target: 'vercel' | 'netlify' | 'cloudflare') {
  const { build } = await import('vite');
  
  const config = {
    root: projectDir,
    plugins: [
      viteFafEngine({
        target,
        autoGenerate: true,
        includeInBundle: true
      })
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
  
  await build(config);
  console.log(`✅ Built for ${target} with faf-engine optimization`);
}

export default viteFafEngine;