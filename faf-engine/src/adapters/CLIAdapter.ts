/**
 * CLI Platform Adapter
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import type { PlatformAdapter, EngineOptions } from '../types';

export class CLIAdapter implements PlatformAdapter {
  name = 'cli';
  private projectDir: string;
  
  constructor(options: EngineOptions = {}) {
    this.projectDir = options.projectDir || process.cwd();
  }
  
  async initialize(): Promise<void> {
    // CLI is ready immediately
  }
  
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }
  
  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  async findFiles(pattern: string): Promise<string[]> {
    return glob(pattern, {
      cwd: this.projectDir,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      absolute: true
    });
  }
  
  getProjectRoot(): string {
    return this.projectDir;
  }
  
  getEnvironment(): Record<string, string> {
    return process.env as Record<string, string>;
  }
}