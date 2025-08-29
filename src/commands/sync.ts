/**
 * 🔄 faf sync - Sync Command
 * Sync .faf file with project changes (package.json, git, etc.)
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import * as YAML from 'yaml';
import { findFafFile, findPackageJson } from '../utils/file-utils';

interface SyncOptions {
  auto?: boolean;
  dryRun?: boolean;
}

export async function syncFafFile(file?: string, options: SyncOptions = {}) {
  try {
    const fafPath = file || await findFafFile();
    
    if (!fafPath) {
      console.log(chalk.red('❌ No .faf file found'));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(chalk.blue(`🔄 Syncing: ${fafPath}`));
    
    // Read current .faf file
    const content = await fs.readFile(fafPath, 'utf-8');
    const fafData = YAML.parse(content);
    
    // Detect changes
    const changes = await detectProjectChanges(fafData);
    
    if (changes.length === 0) {
      console.log(chalk.green('✅ .faf file is up to date'));
      return;
    }
    
    // Show detected changes
    console.log(chalk.yellow(`⚡ Found ${changes.length} potential updates:`));
    changes.forEach((change, index) => {
      console.log(chalk.yellow(`   ${index + 1}. ${change.description}`));
      if (change.oldValue !== change.newValue) {
        console.log(chalk.gray(`      ${change.oldValue} → ${change.newValue}`));
      }
    });
    
    if (options.dryRun) {
      console.log(chalk.blue('\n🔍 Dry run complete - no changes applied'));
      return;
    }
    
    // Apply changes
    if (options.auto) {
      console.log(chalk.blue('\n🤖 Auto-applying changes...'));
      applyChanges(fafData, changes);
    } else {
      // Interactive mode (simplified for now)
      console.log(chalk.yellow('\n💡 Run with --auto to apply changes automatically'));
      console.log(chalk.yellow('   Or edit .faf file manually'));
      return;
    }
    
    // Update generated timestamp
    fafData.generated = new Date().toISOString();
    
    // Write updated .faf file
    const updatedContent = YAML.stringify(fafData);
    await fs.writeFile(fafPath, updatedContent, 'utf-8');
    
    console.log(chalk.green('✅ .faf file synced successfully'));
    console.log(chalk.gray(`   Applied ${changes.length} changes`));
    
  } catch (error) {
    console.log(chalk.red('💥 Sync failed:'));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

interface ProjectChange {
  path: string;
  description: string;
  oldValue: any;
  newValue: any;
  confidence: 'high' | 'medium' | 'low';
}

async function detectProjectChanges(fafData: any): Promise<ProjectChange[]> {
  const changes: ProjectChange[] = [];
  
  try {
    // Check package.json changes
    const packageJsonPath = await findPackageJson();
    if (packageJsonPath) {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageData = JSON.parse(packageContent);
      
      // Project name change
      if (packageData.name && packageData.name !== fafData.project?.name) {
        changes.push({
          path: 'project.name',
          description: 'Project name changed in package.json',
          oldValue: fafData.project?.name || 'undefined',
          newValue: packageData.name,
          confidence: 'high'
        });
      }
      
      // Description/goal change
      if (packageData.description && packageData.description !== fafData.project?.goal) {
        changes.push({
          path: 'project.goal',
          description: 'Project description changed in package.json',
          oldValue: fafData.project?.goal || 'undefined',
          newValue: packageData.description,
          confidence: 'medium'
        });
      }
      
      // Version change
      if (packageData.version && packageData.version !== fafData.state?.version) {
        changes.push({
          path: 'state.version',
          description: 'Project version updated',
          oldValue: fafData.state?.version || 'undefined',
          newValue: packageData.version,
          confidence: 'high'
        });
      }
      
      // Dependencies changes (simplified detection)
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      // Check for major framework changes
      const currentFrontend = fafData.stack?.frontend?.toLowerCase() || '';
      if (deps.svelte && !currentFrontend.includes('svelte')) {
        changes.push({
          path: 'stack.frontend',
          description: 'Svelte dependency detected',
          oldValue: fafData.stack?.frontend || 'None',
          newValue: 'Svelte',
          confidence: 'high'
        });
      }
      
      if (deps.react && !currentFrontend.includes('react')) {
        changes.push({
          path: 'stack.frontend',
          description: 'React dependency detected',
          oldValue: fafData.stack?.frontend || 'None',
          newValue: 'React',
          confidence: 'high'
        });
      }
    }
    
    // Check if generated timestamp is very old (30+ days)
    if (fafData.generated) {
      const generatedDate = new Date(fafData.generated);
      const daysSince = Math.abs(Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince > 30) {
        changes.push({
          path: 'generated',
          description: `Generated timestamp is ${Math.round(daysSince)} days old`,
          oldValue: fafData.generated,
          newValue: new Date().toISOString(),
          confidence: 'high'
        });
      }
    }
    
  } catch (error) {
    // Continue with what we have
  }
  
  return changes;
}

function applyChanges(fafData: any, changes: ProjectChange[]): void {
  changes.forEach(change => {
    if (change.confidence === 'high' || change.confidence === 'medium') {
      setNestedValue(fafData, change.path, change.newValue);
    }
  });
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  let current = obj;
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}