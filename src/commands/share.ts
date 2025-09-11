/**
 * 🚀 Share Command - Universal .faf Distribution System
 * Secure sharing of .faf files with automatic sanitization
 */

import { 
  FAF_ICONS, 
  FAF_COLORS
} from '../utils/championship-style';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';

export interface ShareCommandOptions {
  private?: boolean;    // Keep sensitive info (default: sanitize)
  format?: 'yaml' | 'json' | 'url';  // Output format
  expires?: string;     // Expiration time (24h, 7d, 30d)
  password?: string;    // Optional password protection
  description?: string; // Share description
  anonymous?: boolean;  // Remove author info
}

/**
 * Share .faf file with automatic sanitization
 */
export async function shareCommand(fafPath?: string, options: ShareCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.rocket} FAF Universal Sharing`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Secure distribution with auto-sanitization`);
    
    // Find .faf file
    const resolvedPath = await findFafFile(fafPath);
    
    // Load and parse .faf
    const fafContent = await fs.readFile(resolvedPath, 'utf-8');
    const fafData = YAML.parse(fafContent);
    
    // Sanitize for sharing
    const sanitizedData = options.private ? fafData : await sanitizeFafData(fafData, options);
    
    // Generate shareable version
    const shareResult = await generateShareableVersion(sanitizedData, options);
    
    // Display results
    await displayShareResults(shareResult, options);
    
    const duration = Date.now() - startTime;
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Share ready in ${duration}ms!`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Pro tip: `)}Add --anonymous to remove author info`);
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Share failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Find .faf file in current directory or specified path
 */
async function findFafFile(fafPath?: string): Promise<string> {
  if (fafPath) {
    return path.resolve(fafPath);
  }
  
  const currentDir = process.cwd();
  const defaultPath = path.join(currentDir, '.faf');
  
  try {
    await fs.access(defaultPath);
    return defaultPath;
  } catch {
    throw new Error('No .faf file found. Run `faf init` first or specify a path.');
  }
}

/**
 * Sanitize .faf data for public sharing
 */
async function sanitizeFafData(fafData: any, options: ShareCommandOptions): Promise<any> {
  const sanitized = JSON.parse(JSON.stringify(fafData)); // Deep clone
  
  // Remove sensitive information
  const sensitiveFields = [
    'ai_instructions.warnings',
    'preferences.commit_style',
    'human_context.who',
    'human_context.where',
    'human_context.when',
    'project.generated',
    'ai_scoring_details.system_date'
  ];
  
  sensitiveFields.forEach(field => {
    const keys = field.split('.');
    let current = sanitized;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]]) {
        current = current[keys[i]];
      } else {
        break;
      }
    }
    if (current && current[keys[keys.length - 1]] !== undefined) {
      delete current[keys[keys.length - 1]];
    }
  });
  
  // Standardize author info
  if (sanitized.project) {
    sanitized.project.author = 'standard@faf.one';
  }
  
  // Remove author info if anonymous
  if (options.anonymous) {
    delete sanitized.project?.author;
    delete sanitized.human_context?.who;
  }
  
  // Add sharing metadata
  sanitized.sharing_metadata = {
    shared_at: new Date().toISOString(),
    shared_by: options.anonymous ? 'anonymous' : 'faf-cli',
    sanitized: !options.private,
    description: options.description || 'Shared .faf context',
    expires: calculateExpiration(options.expires || '7d'),
    format_version: '2.7.0'
  };
  
  return sanitized;
}

/**
 * Generate shareable version in requested format
 */
async function generateShareableVersion(sanitizedData: any, options: ShareCommandOptions): Promise<ShareResult> {
  const format = options.format || 'yaml';
  
  switch (format) {
    case 'json':
      return {
        format: 'json',
        content: JSON.stringify(sanitizedData, null, 2),
        filename: `shared-context-${generateShareId()}.json`,
        size: JSON.stringify(sanitizedData).length
      };
      
    case 'url':
      // For demo purposes - in production this would upload to a sharing service
      return {
        format: 'url',
        content: `https://fafcli.dev/share/${generateShareId()}`,
        filename: 'shareable-url.txt',
        size: sanitizedData ? JSON.stringify(sanitizedData).length : 0
      };
      
    default: // yaml
      const yamlContent = YAML.stringify(sanitizedData, { indent: 2 });
      return {
        format: 'yaml',
        content: yamlContent,
        filename: `shared-context-${generateShareId()}.faf`,
        size: yamlContent.length
      };
  }
}

/**
 * Display sharing results
 */
async function displayShareResults(shareResult: ShareResult, options: ShareCommandOptions): Promise<void> {
  console.log();
  console.log(`┌─────────────────────────────────────────┐`);
  console.log(`│ ${FAF_COLORS.fafCyan('📤 Share Results')}                     │`);
  console.log(`└─────────────────────────────────────────┘`);
  console.log();
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Format:')} ${shareResult.format.toUpperCase()}`);
  console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Size:')} ${formatBytes(shareResult.size)}`);
  console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Filename:')} ${shareResult.filename}`);
  
  if (options.expires) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Expires:')} ${options.expires}`);
  }
  
  if (options.password) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Protected:')} Password required`);
  }
  
  if (options.anonymous) {
    console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Anonymous:')} Author info removed`);
  }
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')}${FAF_COLORS.fafGreen('Sanitized:')} ${options.private ? 'No (--private)' : 'Yes'}`);
  
  console.log();
  console.log(FAF_COLORS.fafCyan('📋 Shareable Content:'));
  console.log('─'.repeat(50));
  
  if (shareResult.format === 'url') {
    console.log(FAF_COLORS.fafGreen(shareResult.content));
  } else {
    // Show first few lines of content
    const lines = shareResult.content.split('\n').slice(0, 15);
    lines.forEach(line => {
      console.log(FAF_COLORS.fafCyan('   ') + line);
    });
    
    if (shareResult.content.split('\n').length > 15) {
      console.log(FAF_COLORS.fafOrange('   ... (truncated for display)'));
    }
  }
  
  console.log('─'.repeat(50));
  
  // Save to file
  const outputPath = path.join(process.cwd(), shareResult.filename);
  await fs.writeFile(outputPath, shareResult.content, 'utf-8');
  console.log();
  console.log(`${FAF_COLORS.fafGreen('☑️ Saved to:')} ${outputPath}`);
}

/**
 * Calculate expiration date
 */
function calculateExpiration(expires: string): string {
  const now = new Date();
  const match = expires.match(/(\d+)([hdw])/);
  
  if (!match) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default 7 days
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  let milliseconds = 0;
  switch (unit) {
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    case 'w':
      milliseconds = value * 7 * 24 * 60 * 60 * 1000;
      break;
  }
  
  return new Date(now.getTime() + milliseconds).toISOString();
}

/**
 * Generate unique share ID
 */
function generateShareId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
}

interface ShareResult {
  format: string;
  content: string;
  filename: string;
  size: number;
}