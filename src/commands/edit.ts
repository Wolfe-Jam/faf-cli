/**
 * ✏️ Edit Command - Interactive .faf editor
 * Claude Code consistency: Similar to /edit command
 */

import {
  FAF_ICONS,
  FAF_COLORS
} from '../utils/championship-style';
import { findFafFile } from '../utils/file-utils';
import { validateSchema } from '../schema/faf-schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';

export interface EditCommandOptions {
  editor?: string;    // Specific editor to use (code, vim, nano, etc.)
  section?: string;   // Edit specific section (project, stack, etc.)
  validate?: boolean; // Validate after editing (default: true)
}

/**
 * Interactive .faf file editor with validation
 */
export async function editCommand(options: EditCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();

    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.pencil} Interactive .faf Editor`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Championship .faf Editor`);
    
    const fafPath = await findFafFile();
    if (!fafPath) {
      console.log(`${FAF_COLORS.fafOrange('└─ ')}No .faf file found. Run ${FAF_COLORS.fafCyan('faf init')} first.`);
      return;
    }
    
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Found: ${path.relative(process.cwd(), fafPath)}`);
    
    // Create backup before editing
    const backupPath = `${fafPath  }.edit-backup`;
    const originalContent = await fs.readFile(fafPath, 'utf-8');
    await fs.writeFile(backupPath, originalContent);
    console.log(`${FAF_COLORS.fafCyan('├─ ')}Backup created: ${path.basename(backupPath)}`);
    
    if (options.section) {
      await editSection(fafPath, options.section);
    } else {
      await openInEditor(fafPath, options.editor);
    }
    
    // Validate after editing (unless explicitly disabled)
    if (options.validate !== false) {
      console.log(`${FAF_COLORS.fafCyan('├─ ')}Validating changes...`);
      
      const newContent = await fs.readFile(fafPath, 'utf-8');
      const hasChanges = newContent !== originalContent;
      
      if (hasChanges) {
        try {
          const fafData = parseYAML(newContent);
          const validation = validateSchema(fafData);
          
          if (validation.valid) {
            console.log(`${FAF_COLORS.fafGreen('├─ ')}☑️ Validation passed!`);
            
            // Clean up backup on successful edit
            await fs.unlink(backupPath);
          } else {
            console.log(`${FAF_COLORS.fafOrange('├─ ')}⚠️ Validation warnings found`);
            validation.errors.forEach(error => {
              console.log(`${FAF_COLORS.fafCyan('│   ')}• ${error.message}`);
            });
          }
        } catch {
          console.log(`${FAF_COLORS.fafOrange('├─ ')}❌ YAML parse error - restoring backup`);
          await fs.writeFile(fafPath, originalContent);
          await fs.unlink(backupPath);
          console.log(`${FAF_COLORS.fafCyan('└─ ')}Original content restored`);
          return;
        }
      } else {
        console.log(`${FAF_COLORS.fafCyan('├─ ')}No changes made`);
        await fs.unlink(backupPath);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Edit session complete in ${duration}ms!`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf score${FAF_COLORS.fafCyan(' - Check your updated score')}`);
    
  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Edit failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Open .faf file in user's preferred editor
 */
async function openInEditor(fafPath: string, editorPreference?: string): Promise<void> {
  const editor = editorPreference || getPreferredEditor();
  
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Opening in ${editor}...`);
  
  return new Promise((resolve, reject) => {
    const editorProcess = spawn(editor, [fafPath], {
      stdio: 'inherit'
    });
    
    editorProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
    
    editorProcess.on('error', (error) => {
      reject(new Error(`Failed to open editor: ${error.message}`));
    });
  });
}

/**
 * Edit a specific section interactively
 */
async function editSection(fafPath: string, sectionName: string): Promise<void> {
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Editing section: ${sectionName}`);
  
  const content = await fs.readFile(fafPath, 'utf-8');
  const fafData = parseYAML(content) || {};
  
  const availableSections = ['project', 'stack', 'scores', 'ai_instructions', 'preferences', 'state', 'human_context'];
  
  if (!availableSections.includes(sectionName)) {
    console.log(`${FAF_COLORS.fafOrange('├─ ')}Unknown section: ${sectionName}`);
    console.log(`${FAF_COLORS.fafCyan('└─ ')}Available: ${availableSections.join(', ')}`);
    return;
  }
  
  // Create temporary file with just the section
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `faf-section-${sectionName}-${Date.now()}.yaml`);
  
  const sectionData = fafData[sectionName] || {};
  const sectionYaml = stringifyYAML({ [sectionName]: sectionData }, { indent: 2 });
  
  await fs.writeFile(tempFile, sectionYaml);
  
  try {
    // Open section in editor
    await openInEditor(tempFile);
    
    // Read back the edited section
    const editedContent = await fs.readFile(tempFile, 'utf-8');
    const editedData = parseYAML(editedContent);
    
    // Merge back into main .faf
    fafData[sectionName] = editedData[sectionName];
    
    const newFafContent = stringifyYAML(fafData, { indent: 2 });
    await fs.writeFile(fafPath, newFafContent);
    
    console.log(`${FAF_COLORS.fafGreen('├─ ')}Section ${sectionName} updated successfully`);
    
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Detect user's preferred editor
 */
function getPreferredEditor(): string {
  // Check environment variables in order of preference
  const editorEnv = process.env.VISUAL || process.env.EDITOR;
  if (editorEnv) {
    return editorEnv;
  }
  
  // For now, return VS Code as default (most common for .faf files)
  // In a full implementation, we'd check which editors are available
  // Common editors would be: ['code', 'subl', 'atom', 'vim', 'nano', 'emacs']
  return 'code';
}