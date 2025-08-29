/**
 * 📁 File Utilities
 * Helper functions for finding and working with .faf files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Find .faf file in current directory or parent directories
 */
export async function findFafFile(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = startDir;
  
  while (currentDir !== path.dirname(currentDir)) {
    const fafFiles = await glob('*.faf', { cwd: currentDir });
    
    if (fafFiles.length > 0) {
      return path.join(currentDir, fafFiles[0]);
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Check if file exists and is readable
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file modification time
 */
export async function getFileModTime(filePath: string): Promise<Date | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

/**
 * Find package.json in project
 */
export async function findPackageJson(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = startDir;
  
  while (currentDir !== path.dirname(currentDir)) {
    const packagePath = path.join(currentDir, 'package.json');
    
    if (await fileExists(packagePath)) {
      return packagePath;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Detect project type from files and structure
 */
export async function detectProjectType(projectDir: string = process.cwd()): Promise<string> {
  const packageJsonPath = await findPackageJson(projectDir);
  
  if (packageJsonPath) {
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageData = JSON.parse(packageContent);
      
      // Check dependencies for framework indicators
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      if (deps.svelte || deps['@sveltejs/kit']) return 'svelte';
      if (deps.react || deps['react-dom']) return 'react';
      if (deps.vue || deps['@vue/core']) return 'vue';
      if (deps.angular || deps['@angular/core']) return 'angular';
      if (deps.express || deps.fastify) return 'node-api';
      if (deps.next || deps.nuxt) return 'fullstack';
    } catch {
      // Continue with file-based detection
    }
  }
  
  // File-based detection
  const files = await glob('**/*.{svelte,jsx,tsx,vue,ts,js}', { 
    cwd: projectDir, 
    ignore: ['node_modules/**', 'dist/**', 'build/**'] 
  });
  
  if (files.some(f => f.endsWith('.svelte'))) return 'svelte';
  if (files.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'))) return 'react';
  if (files.some(f => f.endsWith('.vue'))) return 'vue';
  
  return 'generic';
}

/**
 * Calculate days since file was modified
 */
export function daysSinceModified(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}