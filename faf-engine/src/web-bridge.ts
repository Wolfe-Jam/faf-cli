/**
 * 🌐 faf-engine Web/App Integration Bridge
 * Connects web applications to the independent faf-engine Mk-1
 */

import { FafEngine } from './core/FafEngine';
import { WebAdapter } from './adapters/WebAdapter';
import type { FafData, FafScore, ContextOnDemandResult, EngineOptions } from './types';

export interface WebFile {
  path: string;
  content: string;
  type?: string;
}

export interface WebEngineOptions extends Omit<EngineOptions, 'adapter'> {
  files: WebFile[];
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * Web-optimized engine for browser/app usage
 */
export class WebFafEngine {
  private engine: FafEngine;
  private options: WebEngineOptions;
  
  constructor(options: WebEngineOptions) {
    this.options = options;
    this.engine = new FafEngine({
      ...options,
      platform: 'web',
      adapter: new WebAdapter({ files: options.files })
    });
  }
  
  /**
   * Generate Context-On-Demand from uploaded files
   */
  async generateContext(): Promise<ContextOnDemandResult> {
    return this.engine.generateContext();
  }
  
  /**
   * Score uploaded .faf content
   */
  score(fafData: FafData): FafScore {
    return this.engine.score(fafData);
  }
  
  /**
   * Validate .faf data structure
   */
  validate(fafData: FafData) {
    return this.engine.validate(fafData);
  }
  
  /**
   * Generate .faf YAML from context
   */
  async generateYaml(): Promise<string> {
    const result = await this.generateContext();
    // Import YAML generator
    const { YamlGenerator } = await import('./generators/YamlGenerator');
    const generator = new YamlGenerator();
    return generator.generate(result.context);
  }
  
  /**
   * Enhanced generation with AI (requires API key)
   */
  async enhanceWithAI(fafData: FafData): Promise<FafData> {
    if (!this.options.apiKey) {
      throw new Error('API key required for AI enhancement');
    }
    
    // This would integrate with AI enhancement service
    const validation = this.validate(fafData);
    
    if (!validation.valid) {
      throw new Error(`Invalid .faf data: ${validation.errors.join(', ')}`);
    }
    
    // Stub for AI enhancement
    return {
      ...fafData,
      ai_enhanced: true,
      enhancement_timestamp: new Date().toISOString(),
      ai_suggestions: validation.suggestions
    };
  }
  
  /**
   * Get engine capabilities
   */
  getCapabilities(): string[] {
    return [
      'context-generation',
      'scoring',
      'validation',
      'yaml-generation',
      'format-detection',
      'framework-analysis'
    ];
  }
  
  /**
   * Get supported file types
   */
  getSupportedFileTypes(): string[] {
    return [
      '.js', '.ts', '.tsx', '.jsx',
      '.py', '.python',
      '.svelte', '.vue',
      '.json', '.yaml', '.yml',
      '.md', '.txt',
      'package.json', 'requirements.txt',
      'tsconfig.json', 'svelte.config.js',
      'next.config.js', 'vite.config.ts'
    ];
  }
}

/**
 * React Hook for using faf-engine in React apps
 */
export function useFafEngine(files: WebFile[], options?: Partial<WebEngineOptions>) {
  const [engine, setEngine] = React.useState<WebFafEngine | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ContextOnDemandResult | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (files.length > 0) {
      const engineInstance = new WebFafEngine({ files, ...options });
      setEngine(engineInstance);
    }
  }, [files, options]);
  
  const generateContext = React.useCallback(async () => {
    if (!engine) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contextResult = await engine.generateContext();
      setResult(contextResult);
      return contextResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [engine]);
  
  const scoreData = React.useCallback((fafData: FafData) => {
    if (!engine) throw new Error('Engine not initialized');
    return engine.score(fafData);
  }, [engine]);
  
  return {
    engine,
    loading,
    result,
    error,
    generateContext,
    scoreData,
    validate: engine?.validate.bind(engine),
    generateYaml: engine?.generateYaml.bind(engine)
  };
}

/**
 * Svelte Store for using faf-engine in Svelte apps
 */
export function createFafEngineStore(files: WebFile[], options?: Partial<WebEngineOptions>) {
  const { writable, derived } = require('svelte/store');
  
  const filesStore = writable(files);
  const optionsStore = writable(options);
  const resultStore = writable<ContextOnDemandResult | null>(null);
  const loadingStore = writable(false);
  const errorStore = writable<Error | null>(null);
  
  const engineStore = derived(
    [filesStore, optionsStore],
    ([files, options]) => {
      if (files.length === 0) return null;
      return new WebFafEngine({ files, ...options });
    }
  );
  
  return {
    files: filesStore,
    options: optionsStore,
    engine: engineStore,
    result: resultStore,
    loading: loadingStore,
    error: errorStore,
    
    async generateContext() {
      const engine = get(engineStore);
      if (!engine) throw new Error('Engine not initialized');
      
      loadingStore.set(true);
      errorStore.set(null);
      
      try {
        const result = await engine.generateContext();
        resultStore.set(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        errorStore.set(error);
        throw error;
      } finally {
        loadingStore.set(false);
      }
    }
  };
}

/**
 * Vue Composable for using faf-engine in Vue apps
 */
export function useFafEngineVue(files: Ref<WebFile[]>, options?: Partial<WebEngineOptions>) {
  const { ref, computed, watch } = require('vue');
  
  const result = ref<ContextOnDemandResult | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  const engine = computed(() => {
    if (files.value.length === 0) return null;
    return new WebFafEngine({ files: files.value, ...options });
  });
  
  const generateContext = async () => {
    if (!engine.value) throw new Error('Engine not initialized');
    
    loading.value = true;
    error.value = null;
    
    try {
      const contextResult = await engine.value.generateContext();
      result.value = contextResult;
      return contextResult;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      error.value = errorObj;
      throw errorObj;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    engine: readonly(engine),
    result: readonly(result),
    loading: readonly(loading),
    error: readonly(error),
    generateContext,
    scoreData: (fafData: FafData) => engine.value?.score(fafData),
    validate: (fafData: FafData) => engine.value?.validate(fafData)
  };
}

/**
 * Simple JavaScript API for vanilla web apps
 */
export const FafEngineWeb = {
  /**
   * Create engine instance
   */
  create(files: WebFile[], options?: Partial<WebEngineOptions>): WebFafEngine {
    return new WebFafEngine({ files, ...options });
  },
  
  /**
   * Quick context generation
   */
  async generateContext(files: WebFile[]): Promise<ContextOnDemandResult> {
    const engine = new WebFafEngine({ files });
    return engine.generateContext();
  },
  
  /**
   * Quick scoring
   */
  score(fafData: FafData, files?: WebFile[]): FafScore {
    const engine = new WebFafEngine({ files: files || [] });
    return engine.score(fafData);
  },
  
  /**
   * File upload handler
   */
  async handleFileUpload(fileList: FileList): Promise<WebFile[]> {
    const files: WebFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const content = await file.text();
      files.push({
        path: file.name,
        content,
        type: file.type
      });
    }
    
    return files;
  }
};

// Type declarations for framework integrations
declare global {
  namespace React {
    function useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  }
}

interface Ref<T> {
  value: T;
}

function readonly<T>(ref: any): Readonly<T> {
  return ref;
}

function get(store: any): any {
  // Svelte store get function
  return store;
}