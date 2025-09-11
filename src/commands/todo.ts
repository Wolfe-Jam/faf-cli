/**
 * 📝 Todo Command - Claude-Inspired Task Management
 * Transform low scores into exciting gamified todo lists
 */

import { calculateFafScore } from '../scoring/score-calculator';
import { findFafFile, fileExists } from '../utils/file-utils';
import { createClaudeTodoEngine, TodoEngineUtils, type TodoList, type TodoItem } from '../engines/claude-todo-engine';
import { 
  FAF_ICONS, 
  FAF_COLORS, 
  BRAND_MESSAGES 
} from '../utils/championship-style';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';

export interface TodoCommandOptions {
  show?: boolean;    // Show current todo list
  complete?: string; // Mark task as completed
  reset?: boolean;   // Reset todo list
}

/**
 * Main improve command - generates Claude-inspired todo lists
 */
export async function todoCommand(options: TodoCommandOptions = {}): Promise<void> {
  try {
    const startTime = Date.now();
    
    console.log(FAF_COLORS.fafCyan(`${FAF_ICONS.clipboard} Claude-Inspired Todo System`));
    console.log(`${FAF_COLORS.fafCyan('├─ ')}${BRAND_MESSAGES.optimization}`);
    
    const fafPath = await findFafFile();
    if (!fafPath) {
      console.log(`${FAF_COLORS.fafOrange('└─ ')}No .faf file found. Run ${FAF_COLORS.fafCyan('faf init')} first.`);
      return;
    }

    if (options.complete) {
      await completeTask(options.complete, fafPath);
      return;
    }

    if (options.reset) {
      await resetTodoList(fafPath);
      return;
    }

    if (options.show) {
      await showCurrentTodoList(fafPath);
      return;
    }

    // Generate new improvement plan
    await generateImprovementPlan(fafPath);
    
    const duration = Date.now() - startTime;
    console.log();
    console.log(FAF_COLORS.fafGreen(`${FAF_ICONS.trophy} Improvement plan ready in ${duration}ms!`));
    console.log(`${FAF_COLORS.fafCyan(`${FAF_ICONS.magic_wand} Try: `)}faf improve --show${FAF_COLORS.fafCyan(' - View your todo list')}`);

  } catch (error) {
    console.error(FAF_COLORS.fafOrange(`${FAF_ICONS.shield} Improvement failed: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Generate new improvement plan based on current score
 */
async function generateImprovementPlan(fafPath: string): Promise<void> {
  // Calculate current score and context
  const scoreResult = await calculateFafScore(undefined, path.dirname(fafPath));
  const projectDir = path.dirname(fafPath);
  
  // Get existing files for context
  const existingFiles = await getProjectFiles(projectDir);
  
  // Read .faf for missing context analysis
  const fafContent = await fs.readFile(fafPath, 'utf-8');
  const fafData = YAML.parse(fafContent) || {};
  
  const missingSlots = identifyMissingSlots(fafData, existingFiles);
  
  // Create todo engine and generate plan
  const engine = createClaudeTodoEngine();
  const todoList = engine.generateTodoList({
    currentScore: scoreResult.totalScore,
    projectType: fafData.project?.name || 'unknown',
    missingSlots,
    existingFiles,
    techStack: fafData.stack || {},
    aiPreference: 'claude' // Default to Claude-style tasks
  });

  // Save todo list
  await saveTodoList(todoList, fafPath);
  
  // Display the plan
  displayTodoList(todoList);
}

/**
 * Display todo list in championship style
 */
function displayTodoList(todoList: TodoList): void {
  const engine = createClaudeTodoEngine();
  const progress = engine.getProgress(todoList);
  
  console.log();
  console.log(`┌─────────────────────────────────────────┐`);
  console.log(`│ ${FAF_COLORS.fafCyan('🤖 Claude-Inspired Improvement Plan')}     │`);
  console.log(`│ ${FAF_COLORS.fafOrange(`Current: ${todoList.currentScore}%`)} → ${FAF_COLORS.fafGreen(`Target: ${todoList.targetScore}%`)}        │`);
  console.log(`└─────────────────────────────────────────┘`);
  console.log();

  console.log(FAF_COLORS.fafCyan('📝 Your Championship Todo List:'));
  
  todoList.items.forEach((item, index) => {
    const connector = index === todoList.items.length - 1 ? '└─' : '├─';
    const checkbox = item.completed ? '☑️' : '[ ]';
    const impactColor = item.impact >= 15 ? FAF_COLORS.fafGreen : 
                       item.impact >= 10 ? FAF_COLORS.fafOrange : FAF_COLORS.fafCyan;
    const highImpact = item.impact >= 15 ? ' 💯 HIGH IMPACT' : '';
    
    console.log(
      `${FAF_COLORS.fafCyan(`${connector} `)}${checkbox} ${item.title} ${impactColor(`(+${item.impact} points)`)}${highImpact}`
    );
    console.log(
      `${FAF_COLORS.fafCyan('   ')}${FAF_COLORS.fafCyan(`~ ${item.estimatedMinutes}min · ${item.description}`)}`
    );
  });

  console.log();
  console.log(
    `🏆 Complete all tasks → ${FAF_COLORS.fafGreen(`${todoList.targetScore}% score!`)} Championship ready!`
  );
  console.log();
  console.log(FAF_COLORS.fafCyan('💡 Complete tasks with: ') + FAF_COLORS.fafOrange('faf improve --complete <task-number>'));
}

/**
 * Show current todo list if it exists
 */
async function showCurrentTodoList(fafPath: string): Promise<void> {
  const todoList = await loadTodoList(fafPath);
  
  if (!todoList) {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}No active improvement plan. Run ${FAF_COLORS.fafCyan('faf improve')} to create one.`);
    return;
  }

  const engine = createClaudeTodoEngine();
  const progress = engine.getProgress(todoList);

  console.log(`${FAF_COLORS.fafCyan('├─ ')}Current Progress: ${TodoEngineUtils.formatProgressCLI(progress)}`);
  console.log();
  
  displayTodoList(todoList);
}

/**
 * Complete a specific task
 */
async function completeTask(taskIdentifier: string, fafPath: string): Promise<void> {
  const todoList = await loadTodoList(fafPath);
  
  if (!todoList) {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}No active todo list. Run ${FAF_COLORS.fafCyan('faf improve')} first.`);
    return;
  }

  // Parse task identifier (could be number or partial title)
  const taskIndex = parseInt(taskIdentifier) - 1; // 1-based indexing for users
  let task: TodoItem | undefined;

  if (!isNaN(taskIndex) && taskIndex >= 0 && taskIndex < todoList.items.length) {
    task = todoList.items[taskIndex];
  } else {
    // Try to find by partial title match
    task = todoList.items.find(item => 
      item.title.toLowerCase().includes(taskIdentifier.toLowerCase())
    );
  }

  if (!task) {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}Task "${taskIdentifier}" not found. Use ${FAF_COLORS.fafCyan('faf improve --show')} to see available tasks.`);
    return;
  }

  if (task.completed) {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}Task "${task.title}" is already completed! 🎉`);
    return;
  }

  // Recalculate score to get new project score
  const scoreResult = await calculateFafScore(undefined, path.dirname(fafPath));
  
  // Complete the task
  const engine = createClaudeTodoEngine();
  const improvement = engine.completeTask(todoList, task.id, scoreResult.totalScore);
  
  // Save updated todo list
  await saveTodoList(todoList, fafPath);
  
  // Celebrate!
  console.log();
  console.log(TodoEngineUtils.generateCelebration(improvement));
  console.log(`${FAF_COLORS.fafCyan('├─ ')}Task completed: ${task.title}`);
  console.log(`${FAF_COLORS.fafCyan('└─ ')}Score improvement: ${improvement.before}% → ${improvement.after}%`);

  // Check for championship completion
  if (improvement.celebrationLevel === 'championship') {
    console.log();
    console.log(FAF_COLORS.fafGreen('🎊 CHAMPIONSHIP ACHIEVED! 🏁'));
    console.log(FAF_COLORS.fafGreen('🏆 Your AI context is now maximally optimized!'));
    console.log(FAF_COLORS.fafCyan('💎 Technical Credit: +25 points (Perfect Score Bonus)'));
  }
}

/**
 * Reset todo list
 */
async function resetTodoList(fafPath: string): Promise<void> {
  const todoPath = getTodoListPath(fafPath);
  
  if (await fileExists(todoPath)) {
    await fs.unlink(todoPath);
    console.log(`${FAF_COLORS.fafGreen('└─ ')}Todo list reset! Run ${FAF_COLORS.fafCyan('faf improve')} to create a new one.`);
  } else {
    console.log(`${FAF_COLORS.fafOrange('└─ ')}No todo list to reset.`);
  }
}

// =====================================
// HELPER FUNCTIONS
// =====================================

function getTodoListPath(fafPath: string): string {
  const projectDir = path.dirname(fafPath);
  return path.join(projectDir, '.faf-todos.json');
}

async function saveTodoList(todoList: TodoList, fafPath: string): Promise<void> {
  const todoPath = getTodoListPath(fafPath);
  await fs.writeFile(todoPath, JSON.stringify(todoList, null, 2));
}

async function loadTodoList(fafPath: string): Promise<TodoList | null> {
  const todoPath = getTodoListPath(fafPath);
  
  if (!(await fileExists(todoPath))) {
    return null;
  }

  try {
    const content = await fs.readFile(todoPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Convert date strings back to Date objects
    data.createdAt = new Date(data.createdAt);
    data.updatedAt = new Date(data.updatedAt);
    if (data.completedAt) {
      data.completedAt = new Date(data.completedAt);
    }
    
    data.items.forEach((item: any) => {
      if (item.completedAt) {
        item.completedAt = new Date(item.completedAt);
      }
    });
    
    return data;
  } catch {
    return null;
  }
}

async function getProjectFiles(projectDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(projectDir);
    return files.filter(file => !file.startsWith('.') || file === '.gitignore');
  } catch {
    return [];
  }
}

function identifyMissingSlots(fafData: any, existingFiles: string[]): string[] {
  const missing: string[] = [];
  
  if (!fafData.project?.goal) {missing.push('project_goals');}
  if (!fafData.project?.description) {missing.push('project_description');}
  if (!existingFiles.includes('README.md')) {missing.push('readme');}
  if (!fafData.stack || Object.keys(fafData.stack).length === 0) {missing.push('tech_stack');}
  if (!fafData.human_context) {missing.push('human_context');}
  
  return missing;
}