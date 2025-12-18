/**
 * 🔍 Search Command - Search within .faf content  
 * Claude Code consistency: Similar to /search command
 */

import { 
  FAF_ICONS, 
  FAF_COLORS
} from '../utils/championship-style';
import { findFafFile } from '../utils/file-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYAML } from '../fix-once/yaml';

export interface SearchCommandOptions {
  section?: string;     // Search in specific section only
  case?: boolean;       // Case sensitive search (default: false)
  keys?: boolean;       // Search keys only (default: false)  
  values?: boolean;     // Search values only (default: false)
  count?: boolean;      // Show match count only
}

/**
 * Search within .faf file content with intelligent highlighting
 */
export async function searchCommand(query: string, options: SearchCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    if (!query) {
      console.log(FAF_COLORS.fafOrange(`${FAF_ICONS.magnifying_glass} Search requires a query`));
      console.log(`${FAF_COLORS.fafCyan('Usage: ')}faf search <query> [options]`);
      return;
    }
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.magnifying_glass} Searching .faf Content`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Query: "${query}"`);
    
    const fafPath = await findFafFile();
    if (!fafPath) {
      console.log(`${FAF_COLORS.fafOrange('└─ ')}No .faf file found. Run ${FAF_COLORS.fafCyan('faf init')} first.`);
      return;
    }
    
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Searching: ${path.relative(process.cwd(), fafPath)}`);
    
    const content = await fs.readFile(fafPath, 'utf-8');
    const fafData = parseYAML(content) || {};
    
    const matches = await searchFafData(fafData, query, options);
    
    const duration = Date.now() - startTime;
    
    if (options.count) {
      console.log(`${FAF_COLORS.fafGreen('└─ ')}Found ${matches.length} matches`);
    } else if (matches.length === 0) {
      console.log(`${FAF_COLORS.fafOrange('└─ ')}No matches found for "${query}"`);
    } else {
      console.log(`${FAF_COLORS.fafCyan('├─ ')}Found ${matches.length} matches:`);
      console.log();
      
      matches.forEach((match, index) => {
        const connector = index === matches.length - 1 ? '└─' : '├─';
        const highlightedValue = highlightQuery(match.value, query, options.case);
        
        console.log(`${FAF_COLORS.fafCyan(`${connector} `)}${FAF_COLORS.fafGreen(match.path)}`);
        console.log(`${FAF_COLORS.fafCyan('   ')}${highlightedValue}`);
      });
    }
    
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Search complete in ${duration}ms!`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf edit --section <section>${FAF_COLORS.fafCyan(' - Edit matching section')}`);
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Search failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

interface SearchMatch {
  path: string;
  key: string;
  value: string;
  section: string;
}

/**
 * Recursively search through .faf data structure
 */
async function searchFafData(data: any, query: string, options: SearchCommandOptions): Promise<SearchMatch[]> {
  const matches: SearchMatch[] = [];
  const caseSensitive = options.case || false;
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  function searchRecursive(obj: any, currentPath: string = '', section: string = 'root'): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const _newSection = currentPath === '' ? key : section;

        // Search in keys (if not disabled)
        if (!options.values) {
          const searchKey = caseSensitive ? key : key.toLowerCase();
          if (searchKey.includes(searchQuery)) {
            matches.push({
              path: newPath,
              key,
              value: String(value),
              section: _newSection
            });
          }
        }
        
        // Search in values (if not disabled)
        if (!options.keys && typeof value === 'string') {
          const searchValue = caseSensitive ? value : value.toLowerCase();
          if (searchValue.includes(searchQuery)) {
            matches.push({
              path: newPath,
              key,
              value,
              section: _newSection
            });
          }
        }

        // Recurse into objects/arrays
        if (typeof value === 'object' && value !== null) {
          searchRecursive(value, newPath, _newSection);
        }
      }
    }
  }
  
  // If searching specific section, start there
  if (options.section) {
    if (data[options.section]) {
      searchRecursive(data[options.section], options.section, options.section);
    } else {
      console.log(`${FAF_COLORS.fafOrange('├─ ')}Section "${options.section}" not found`);
    }
  } else {
    searchRecursive(data);
  }
  
  return matches;
}

/**
 * Highlight query matches in text
 */
function highlightQuery(text: string, query: string, caseSensitive: boolean = false): string {
  if (!text || !query) {return text;}
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  let result = text;
  let index = searchText.indexOf(searchQuery);
  
  while (index !== -1) {
    const before = result.substring(0, index);
    const match = result.substring(index, index + query.length);
    const after = result.substring(index + query.length);
    
    result = before + FAF_COLORS.fafOrange(match) + after;
    
    // Find next occurrence (adjust index for added color codes)
    const colorCodeLength = FAF_COLORS.fafOrange('').length * 2; // Start + end codes
    const newSearchText = result.toLowerCase();
    index = newSearchText.indexOf(searchQuery, index + query.length + colorCodeLength);
  }
  
  return result;
}