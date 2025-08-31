/**
 * Context-On-Demand Engine
 */

import type { PlatformAdapter, FafData } from '../types';
import type { FabFormatsAnalysis } from '../formats/FabFormatsEngine';

export interface ContextAssemblyInput {
  formatAnalysis: FabFormatsAnalysis;
  frameworkResult: any;
  files: any[];
  projectDir: string;
}

export class ContextOnDemand {
  constructor(_adapter: PlatformAdapter) {
    // Adapter may be used in future implementations
  }

  async assembleContext(input: ContextAssemblyInput): Promise<FafData> {
    const { formatAnalysis, frameworkResult, projectDir } = input;
    
    // Assemble context from all sources
    const context: FafData = {
      ai_scoring_system: '2025-08-30',
      instant_context: {
        what_building: 'Software application',
        tech_stack: 'TypeScript',
        main_language: 'TypeScript',
        deployment: 'Cloud',
        key_files: []
      },
      project: {
        name: projectDir.split('/').pop() || 'Project',
        goal: 'Software development',
        main_language: 'TypeScript',
        generated: new Date().toISOString()
      },
      stack: {
        frontend: frameworkResult?.framework || 'None',
        css_framework: 'None',
        ui_library: 'None', 
        state_management: 'None',
        backend: 'None',
        runtime: 'Node.js',
        database: 'None',
        build: 'None',
        package_manager: 'npm',
        api_type: 'REST',
        hosting: 'None',
        cicd: 'None'
      } as any
    };
    
    // Apply slot recommendations from fab-formats
    Object.entries(formatAnalysis.slotFillRecommendations).forEach(([slot, value]) => {
      const [section, field] = slot.split('.');
      if (section === 'stack' && context.stack) {
        (context.stack as any)[field] = value;
      }
    });
    
    return context;
  }
}