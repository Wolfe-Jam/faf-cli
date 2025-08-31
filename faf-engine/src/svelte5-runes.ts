/**
 * 🎯 Svelte 5 Runes Integration for faf-engine
 * Modern reactive state management with Svelte 5 Runes
 */

import { WebFafEngine, type WebFile, type WebEngineOptions } from './web-bridge';
import type { FafData, ContextOnDemandResult } from './types';

/**
 * Svelte 5 Runes Class for faf-engine
 * Uses the new runes system for reactive state management
 */
export class FafEngineRunes {
  // Svelte 5 Runes - reactive state
  engine = $state<WebFafEngine | null>(null);
  files = $state<WebFile[]>([]);
  result = $state<ContextOnDemandResult | null>(null);
  loading = $state<boolean>(false);
  error = $state<Error | null>(null);
  options = $state<Partial<WebEngineOptions>>({});
  
  constructor(initialFiles: WebFile[] = [], initialOptions: Partial<WebEngineOptions> = {}) {
    this.files = initialFiles;
    this.options = initialOptions;
    
    // Auto-update engine when files or options change
    $effect(() => {
      if (this.files.length > 0) {
        this.engine = new WebFafEngine({ 
          files: this.files, 
          ...this.options 
        });
      } else {
        this.engine = null;
      }
    });
  }
  
  /**
   * Update files reactively
   */
  setFiles(newFiles: WebFile[]): void {
    this.files = newFiles;
  }
  
  /**
   * Update options reactively
   */
  setOptions(newOptions: Partial<WebEngineOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
  
  /**
   * Generate context with reactive state updates
   */
  async generateContext(): Promise<ContextOnDemandResult | null> {
    if (!this.engine) {
      this.error = new Error('Engine not initialized - no files provided');
      return null;
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      const contextResult = await this.engine.generateContext();
      this.result = contextResult;
      return contextResult;
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Unknown error');
      return null;
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Score data with error handling
   */
  scoreData(fafData: FafData) {
    if (!this.engine) {
      this.error = new Error('Engine not initialized');
      return null;
    }
    
    try {
      return this.engine.score(fafData);
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Scoring failed');
      return null;
    }
  }
  
  /**
   * Validate data with error handling
   */
  validate(fafData: FafData) {
    if (!this.engine) {
      this.error = new Error('Engine not initialized');
      return null;
    }
    
    try {
      return this.engine.validate(fafData);
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Validation failed');
      return null;
    }
  }
  
  /**
   * Generate YAML with reactive updates
   */
  async generateYaml(): Promise<string | null> {
    if (!this.engine) {
      this.error = new Error('Engine not initialized');
      return null;
    }
    
    try {
      return await this.engine.generateYaml();
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('YAML generation failed');
      return null;
    }
  }
  
  /**
   * Clear all state
   */
  reset(): void {
    this.files = [];
    this.result = null;
    this.error = null;
    this.loading = false;
    this.engine = null;
  }
  
  /**
   * Derived state - computed values
   */
  get isReady(): boolean {
    return this.engine !== null && !this.loading;
  }
  
  get hasFiles(): boolean {
    return this.files.length > 0;
  }
  
  get hasResult(): boolean {
    return this.result !== null;
  }
  
  get hasError(): boolean {
    return this.error !== null;
  }
  
  get statusMessage(): string {
    if (this.loading) return 'Processing...';
    if (this.error) return `Error: ${this.error.message}`;
    if (this.result) return `Analysis complete (${this.result.score.totalScore}% score)`;
    if (this.hasFiles) return 'Ready to analyze';
    return 'Upload files to begin';
  }
}

/**
 * Svelte 5 Runes Factory Function
 * Creates a reactive faf-engine instance
 */
export function createFafEngine(
  files: WebFile[] = [], 
  options: Partial<WebEngineOptions> = {}
): FafEngineRunes {
  return new FafEngineRunes(files, options);
}

/**
 * Svelte 5 File Upload Handler with Runes
 */
export class FileUploadRunes {
  files = $state<WebFile[]>([]);
  uploading = $state<boolean>(false);
  uploadError = $state<Error | null>(null);
  
  /**
   * Handle file input change
   */
  async handleFiles(fileList: FileList): Promise<void> {
    this.uploading = true;
    this.uploadError = null;
    
    try {
      const newFiles: WebFile[] = [];
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const content = await file.text();
        newFiles.push({
          path: file.name,
          content,
          type: file.type
        });
      }
      
      this.files = newFiles;
    } catch (err) {
      this.uploadError = err instanceof Error ? err : new Error('File upload failed');
    } finally {
      this.uploading = false;
    }
  }
  
  /**
   * Add individual file
   */
  addFile(file: WebFile): void {
    this.files = [...this.files, file];
  }
  
  /**
   * Remove file by path
   */
  removeFile(path: string): void {
    this.files = this.files.filter(f => f.path !== path);
  }
  
  /**
   * Clear all files
   */
  clear(): void {
    this.files = [];
    this.uploadError = null;
  }
  
  // Derived state
  get fileCount(): number {
    return this.files.length;
  }
  
  get totalSize(): number {
    return this.files.reduce((sum, file) => sum + file.content.length, 0);
  }
  
  get supportedFiles(): WebFile[] {
    const supportedExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.svelte', '.vue', '.json'];
    return this.files.filter(file => 
      supportedExtensions.some(ext => file.path.endsWith(ext))
    );
  }
}

/**
 * Usage Examples for Svelte 5 Components
 */

// Example 1: Basic usage in Svelte 5 component
/*
<script lang="ts">
  import { createFafEngine, FileUploadRunes } from '$lib/faf-engine/svelte5-runes';
  
  const fileHandler = new FileUploadRunes();
  const engine = createFafEngine();
  
  // React to file changes
  $effect(() => {
    engine.setFiles(fileHandler.supportedFiles);
  });
  
  async function analyze() {
    await engine.generateContext();
  }
</script>

<div>
  <input 
    type="file" 
    multiple 
    onchange={(e) => fileHandler.handleFiles(e.target.files)}
  />
  
  <p>Files: {fileHandler.fileCount}</p>
  <p>Status: {engine.statusMessage}</p>
  
  {#if engine.hasFiles && engine.isReady}
    <button onclick={analyze}>Analyze Project</button>
  {/if}
  
  {#if engine.hasResult}
    <div>Score: {engine.result.score.totalScore}%</div>
  {/if}
  
  {#if engine.hasError}
    <div class="error">{engine.error.message}</div>
  {/if}
</div>
*/

// Example 2: Advanced usage with reactive updates
/*
<script lang="ts">
  import { createFafEngine } from '$lib/faf-engine/svelte5-runes';
  
  let files = $state<WebFile[]>([]);
  const engine = createFafEngine();
  
  // Automatically analyze when files change
  $effect(() => {
    if (files.length > 0) {
      engine.setFiles(files);
      engine.generateContext();
    }
  });
  
  // Watch for results and update UI
  $effect(() => {
    if (engine.result) {
      console.log('Analysis complete:', engine.result.score.totalScore);
    }
  });
</script>
*/

export default FafEngineRunes;