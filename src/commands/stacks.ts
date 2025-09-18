/**
 * 📊 STACKTISTICS - Stack Discovery & Collection
 * Powered by TURBO-CAT intelligence catalyst
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { TurboCat } from '../utils/turbo-cat';
import { colors } from '../utils/color-utils';

export interface StackSignature {
  id: string;
  name: string;
  signature: string;
  detectedAt: Date;
  projectPath: string;
  frameworks: string[];
  confidence: number;
}

export class StacktisticsEngine {
  private stacksDir: string;
  private discoveredPath: string;

  constructor() {
    this.stacksDir = path.join(os.homedir(), '.faf', 'stacktistics');
    this.discoveredPath = path.join(this.stacksDir, 'discovered.json');
  }

  /**
   * Ensure stacktistics directory exists
   */
  private async ensureStacksDir(): Promise<void> {
    try {
      await fs.mkdir(this.stacksDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  /**
   * Scan current project and discover stack
   */
  async scanProject(projectPath: string = process.cwd()): Promise<StackSignature | null> {
    const turboCat = new TurboCat();
    const analysis = await turboCat.discoverFormats(projectPath);

    if (!analysis.stackSignature || analysis.stackSignature === 'unknown-stack') {
      return null;
    }

    // Generate human-readable name from signature
    const name = this.generateStackName(analysis.stackSignature);
    
    const stackSig: StackSignature = {
      id: analysis.stackSignature,
      name,
      signature: analysis.stackSignature,
      detectedAt: new Date(),
      projectPath,
      frameworks: Object.keys(analysis.frameworkConfidence),
      confidence: Math.min(analysis.totalIntelligenceScore, 100)
    };

    return stackSig;
  }

  /**
   * Generate human-readable stack name
   */
  private generateStackName(signature: string): string {
    // Simple name generation - can be enhanced later
    const nameMap: Record<string, string> = {
      'next-tailwind-vercel': 'The Vercel Speedster',
      'svelte5-tailwind': 'Svelte 5 Reactive',
      'fastapi-postgres': 'Python API Master',
      'fastapi-sqlite': 'FastAPI Lightweight',
      'node-express-ts': 'Node.js TypeScript Classic'
    };

    return nameMap[signature] || signature.split('-').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join(' + ');
  }

  /**
   * Add stack to personal collection
   */
  async collectStack(stack: StackSignature): Promise<void> {
    await this.ensureStacksDir();
    
    let discovered: StackSignature[] = [];
    try {
      const data = await fs.readFile(this.discoveredPath, 'utf-8');
      discovered = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    // Check if already collected
    const existing = discovered.find(s => s.id === stack.id);
    if (!existing) {
      discovered.push(stack);
      await fs.writeFile(this.discoveredPath, JSON.stringify(discovered, null, 2));
    }
  }

  /**
   * Get discovered stacks
   */
  async getDiscoveredStacks(): Promise<StackSignature[]> {
    try {
      const data = await fs.readFile(this.discoveredPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}

/**
 * List discovered stacks
 */
export async function listStacks(): Promise<void> {
  const engine = new StacktisticsEngine();
  const stacks = await engine.getDiscoveredStacks();

  if (stacks.length === 0) {
    console.log(colors.info('📊 No stacks discovered yet!'));
    console.log(colors.dim('   Run: faf stacks --scan to discover your current project stack'));
    return;
  }

  console.log(colors.highlight(`📊 Discovered Stacks (${stacks.length})`));
  console.log('');

  stacks.forEach((stack, index) => {
    console.log(`${colors.highlight(`${index + 1}.`)} ${colors.success(stack.name)}`);
    console.log(`   ${colors.dim('Signature:')} ${stack.signature}`);
    console.log(`   ${colors.dim('Frameworks:')} ${stack.frameworks.join(', ')}`);
    console.log(`   ${colors.dim('Confidence:')} ${stack.confidence}%`);
    console.log('');
  });
}

/**
 * Scan and discover current project stack
 */
export async function scanCurrentProject(): Promise<void> {
  console.log(colors.info('🔍 Scanning project for stack signature...'));
  
  const engine = new StacktisticsEngine();
  const stack = await engine.scanProject();

  if (!stack) {
    console.log(colors.warning('⚠️  Could not determine stack signature'));
    console.log(colors.dim('   Project may be too simple or missing key configuration files'));
    return;
  }

  console.log('');
  console.log(colors.success('✨ Stack discovered!'));
  console.log(`   ${colors.highlight('Name:')} ${stack.name}`);
  console.log(`   ${colors.highlight('Signature:')} ${stack.signature}`);
  console.log(`   ${colors.highlight('Frameworks:')} ${stack.frameworks.join(', ')}`);
  console.log(`   ${colors.highlight('Confidence:')} ${stack.confidence}%`);
  console.log('');

  // Auto-collect the stack
  await engine.collectStack(stack);
  console.log(colors.success('🎉 Stack added to your collection!'));
  console.log(colors.dim('   View collection: faf stacks'));
}

/**
 * Export stacks for Gallery-Svelte
 */
export async function exportForGallery(): Promise<void> {
  const engine = new StacktisticsEngine();
  const stacks = await engine.getDiscoveredStacks();
  
  const exportDir = path.join(os.homedir(), '.faf', 'stacktistics', 'exports');
  await fs.mkdir(exportDir, { recursive: true });
  
  const exportPath = path.join(exportDir, 'gallery-stacks.json');
  
  // Transform for Gallery-Svelte format
  const galleryData = stacks.map(stack => ({
    signature: stack,
    cardArt: {
      gradient: ['#00bf63', '#00a856'], // FAF green theme
      pattern: 'modern',
      holographic: stack.confidence > 90
    },
    stats: {
      discovered: stack.detectedAt,
      timesEncountered: 1,
      projectsUsing: [path.basename(stack.projectPath)]
    }
  }));

  await fs.writeFile(exportPath, JSON.stringify(galleryData, null, 2));
  
  console.log(colors.success('📤 Exported stacks for Gallery-Svelte'));
  console.log(colors.dim(`   Location: ${exportPath}`));
  console.log(colors.dim(`   Stacks exported: ${stacks.length}`));
}