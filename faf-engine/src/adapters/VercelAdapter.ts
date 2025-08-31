/**
 * Vercel Platform Adapter
 */

import type { PlatformAdapter, EngineOptions } from '../types';

export class VercelAdapter implements PlatformAdapter {
  name = 'vercel';
  private request?: any;
  
  constructor(options: EngineOptions & { request?: any } = {}) {
    this.request = options.request;
  }
  
  async initialize(): Promise<void> {
    // Vercel is ready immediately
  }
  
  async readFile(filePath: string): Promise<string> {
    // In Vercel, files come from request body
    if (this.request?.body?.files) {
      const file = this.request.body.files.find((f: any) => f.path === filePath);
      if (file) return file.content;
    }
    throw new Error(`File not found: ${filePath}`);
  }
  
  async writeFile(_filePath: string, _content: string): Promise<void> {
    // Vercel doesn't write to filesystem - return content in response
    throw new Error('Write not supported in Vercel environment');
  }
  
  async findFiles(pattern: string): Promise<string[]> {
    // Return files from request that match pattern
    if (this.request?.body?.files) {
      return this.request.body.files
        .filter((f: any) => this.matchPattern(f.path, pattern))
        .map((f: any) => f.path);
    }
    return [];
  }
  
  getProjectRoot(): string {
    return this.request?.body?.projectRoot || '/';
  }
  
  getEnvironment(): Record<string, string> {
    return process.env as Record<string, string>;
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    // Simple pattern matching
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    return new RegExp(regex).test(path);
  }
}