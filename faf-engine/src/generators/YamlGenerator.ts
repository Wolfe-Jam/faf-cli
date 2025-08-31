/**
 * YAML Generator for .faf files
 */

import type { FafData } from '../types';

export class YamlGenerator {
  generate(data: FafData): string {
    // Convert FafData to YAML string
    return this.objectToYaml(data);
  }
  
  private objectToYaml(obj: Record<string, any>, indent = 0): string {
    let yaml = '';
    const spacing = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spacing}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spacing}${key}:\n`;
        for (const item of value) {
          yaml += `${spacing}  - ${item}\n`;
        }
      } else {
        yaml += `${spacing}${key}: ${this.escapeValue(value)}\n`;
      }
    }
    
    return yaml;
  }
  
  private escapeValue(value: any): string {
    if (typeof value === 'string') {
      if (value.includes(':') || value.includes('#') || value.startsWith('@')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
    }
    return String(value);
  }
}