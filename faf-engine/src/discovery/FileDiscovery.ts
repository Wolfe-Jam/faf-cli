/**
 * File Discovery Engine
 */

import type { PlatformAdapter, FileIntelligence } from '../types';

export class FileDiscovery {
  constructor(private adapter: PlatformAdapter) {}
  
  async discoverFiles(_projectDir: string, frameworkResult: any): Promise<FileIntelligence[]> {
    const files: FileIntelligence[] = [];
    
    // Discover key files based on framework
    const patterns = this.getPatterns(frameworkResult?.framework);
    
    for (const pattern of patterns) {
      const foundFiles = await this.adapter.findFiles(pattern);
      for (const filePath of foundFiles.slice(0, 5)) { // Limit to 5 per pattern
        files.push({
          path: filePath,
          type: this.getFileType(filePath),
          purpose: this.getFilePurpose(filePath),
          intelligenceBonus: this.calculateIntelligence(filePath),
          framework: frameworkResult?.framework
        });
      }
    }
    
    return files;
  }
  
  private getPatterns(framework?: string): string[] {
    const patterns = ['**/*.ts', '**/*.js', '**/*.json'];
    
    if (framework?.includes('Svelte')) {
      patterns.push('**/*.svelte');
    } else if (framework?.includes('React')) {
      patterns.push('**/*.tsx', '**/*.jsx');
    } else if (framework?.includes('Vue')) {
      patterns.push('**/*.vue');
    }
    
    return patterns;
  }
  
  private getFileType(path: string): string {
    const ext = path.split('.').pop();
    return ext || 'unknown';
  }
  
  private getFilePurpose(path: string): string {
    if (path.includes('test')) return 'testing';
    if (path.includes('config')) return 'configuration';
    if (path.includes('component')) return 'component';
    if (path.includes('util')) return 'utility';
    return 'source';
  }
  
  private calculateIntelligence(path: string): number {
    if (path.includes('package.json')) return 35;
    if (path.includes('tsconfig.json')) return 25;
    if (path.includes('.config.')) return 30;
    return 10;
  }
}