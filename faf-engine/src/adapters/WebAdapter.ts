/**
 * Web Platform Adapter
 */

import type { PlatformAdapter, EngineOptions } from '../types';

export class WebAdapter implements PlatformAdapter {
  name = 'web';
  private files: Map<string, string> = new Map();
  
  constructor(options: EngineOptions & { files?: any[] } = {}) {
    if (options.files) {
      options.files.forEach((file: any) => {
        this.files.set(file.path, file.content);
      });
    }
  }
  
  async initialize(): Promise<void> {
    // Web is ready immediately
  }
  
  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (!content) throw new Error(`File not found: ${filePath}`);
    return content;
  }
  
  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }
  
  async findFiles(pattern: string): Promise<string[]> {
    const paths = Array.from(this.files.keys());
    return paths.filter(path => this.matchPattern(path, pattern));
  }
  
  getProjectRoot(): string {
    return '/';
  }
  
  getEnvironment(): Record<string, string> {
    return {};
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    return new RegExp(regex).test(path);
  }
}