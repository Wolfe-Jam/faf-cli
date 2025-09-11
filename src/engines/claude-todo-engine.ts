/**
 * 🤖 Claude-Inspired Todo Engine - Championship Gamification System
 * 
 * PORTABLE ARCHITECTURE:
 * - Pure TypeScript core (no CLI dependencies)
 * - Works in: Node.js CLI, Browser/Svelte, API endpoints
 * - Pluggable scoring algorithms
 * - Event-driven progress tracking
 * 
 * DESIGN PHILOSOPHY:
 * Turn low AI context scores into exciting improvement games
 * with Claude-inspired todo lists and celebration systems.
 */

// =====================================
// CORE TYPES - Platform Agnostic
// =====================================

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  impact: number; // Points this task adds
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'documentation' | 'structure' | 'context' | 'quality' | 'examples';
  completed: boolean;
  completedAt?: Date;
  estimatedMinutes: number;
  aiPersonality: 'claude' | 'chatgpt' | 'gemini' | 'universal';
}

export interface TodoList {
  id: string;
  projectId: string;
  currentScore: number;
  targetScore: number;
  items: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ScoreImprovement {
  before: number;
  after: number;
  improvement: number;
  taskCompleted: string;
  celebrationLevel: 'minor' | 'major' | 'championship';
}

export interface TodoGenerationContext {
  currentScore: number;
  projectType: string;
  missingSlots: string[];
  existingFiles: string[];
  techStack: Record<string, any>;
  aiPreference?: 'claude' | 'chatgpt' | 'gemini';
}

// =====================================
// SCORE-BASED TODO GENERATION ENGINE
// =====================================

export class ClaudeTodoEngine {
  private todoDatabase: Map<string, TodoItem[]> = new Map();
  private completionCallbacks: Array<(improvement: ScoreImprovement) => void> = [];

  constructor() {
    this.initializeTodoDatabase();
  }

  /**
   * Generate contextual todo list based on current score and missing context
   */
  generateTodoList(context: TodoGenerationContext): TodoList {
    const targetScore = this.calculateTargetScore(context.currentScore);
    const availableTasks = this.getRelevantTasks(context);
    const optimizedTasks = this.optimizeTaskSelection(availableTasks, context, targetScore);

    return {
      id: this.generateId(),
      projectId: context.projectType || 'unknown',
      currentScore: context.currentScore,
      targetScore,
      items: optimizedTasks,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Complete a todo item and calculate score improvement
   */
  completeTask(todoList: TodoList, taskId: string, newProjectScore: number): ScoreImprovement {
    const task = todoList.items.find(item => item.id === taskId);
    if (!task || task.completed) {
      throw new Error(`Task ${taskId} not found or already completed`);
    }

    const oldScore = todoList.currentScore;
    task.completed = true;
    task.completedAt = new Date();
    
    todoList.currentScore = newProjectScore;
    todoList.updatedAt = new Date();

    const improvement: ScoreImprovement = {
      before: oldScore,
      after: newProjectScore,
      improvement: newProjectScore - oldScore,
      taskCompleted: task.title,
      celebrationLevel: this.calculateCelebrationLevel(oldScore, newProjectScore, todoList.targetScore)
    };

    // Check for championship completion
    if (newProjectScore >= todoList.targetScore && !todoList.completedAt) {
      todoList.completedAt = new Date();
      improvement.celebrationLevel = 'championship';
    }

    // Trigger callbacks
    this.completionCallbacks.forEach(callback => callback(improvement));

    return improvement;
  }

  /**
   * Subscribe to completion events (for UI updates, celebrations, etc.)
   */
  onTaskCompletion(callback: (improvement: ScoreImprovement) => void): void {
    this.completionCallbacks.push(callback);
  }

  /**
   * Get progress statistics
   */
  getProgress(todoList: TodoList): {
    completed: number;
    total: number;
    percentage: number;
    remainingPoints: number;
    estimatedMinutes: number;
  } {
    const completed = todoList.items.filter(item => item.completed).length;
    const total = todoList.items.length;
    const remainingTasks = todoList.items.filter(item => !item.completed);
    const remainingPoints = remainingTasks.reduce((sum, task) => sum + task.impact, 0);
    const estimatedMinutes = remainingTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      remainingPoints,
      estimatedMinutes
    };
  }

  // =====================================
  // PRIVATE IMPLEMENTATION
  // =====================================

  private initializeTodoDatabase(): void {
    // High-impact documentation tasks (Claude's favorites)
    this.addTaskTemplate({
      id: 'readme-creation',
      title: 'Create comprehensive README.md',
      description: 'Add project overview, installation, and usage instructions',
      impact: 15,
      difficulty: 'medium',
      category: 'documentation',
      completed: false,
      estimatedMinutes: 20,
      aiPersonality: 'claude'
    });

    this.addTaskTemplate({
      id: 'project-goals',
      title: 'Define clear project goals',
      description: 'Add specific, measurable project objectives to .faf',
      impact: 12,
      difficulty: 'easy',
      category: 'context',
      completed: false,
      estimatedMinutes: 10,
      aiPersonality: 'universal'
    });

    this.addTaskTemplate({
      id: 'tech-stack-documentation',
      title: 'Document complete tech stack',
      description: 'List all frameworks, libraries, and tools used',
      impact: 10,
      difficulty: 'easy',
      category: 'structure',
      completed: false,
      estimatedMinutes: 8,
      aiPersonality: 'chatgpt'
    });

    this.addTaskTemplate({
      id: 'api-documentation',
      title: 'Add API documentation',
      description: 'Document all public APIs and endpoints',
      impact: 18,
      difficulty: 'hard',
      category: 'documentation',
      completed: false,
      estimatedMinutes: 45,
      aiPersonality: 'claude'
    });

    this.addTaskTemplate({
      id: 'examples-creation',
      title: 'Add usage examples',
      description: 'Create practical examples showing how to use the project',
      impact: 14,
      difficulty: 'medium',
      category: 'examples',
      completed: false,
      estimatedMinutes: 30,
      aiPersonality: 'chatgpt'
    });

    this.addTaskTemplate({
      id: 'architecture-overview',
      title: 'Add architecture overview',
      description: 'Explain system design and component relationships',
      impact: 16,
      difficulty: 'medium',
      category: 'documentation',
      completed: false,
      estimatedMinutes: 25,
      aiPersonality: 'gemini'
    });

    this.addTaskTemplate({
      id: 'package-description',
      title: 'Improve package.json description',
      description: 'Write clear, compelling project description',
      impact: 8,
      difficulty: 'easy',
      category: 'structure',
      completed: false,
      estimatedMinutes: 5,
      aiPersonality: 'universal'
    });

    this.addTaskTemplate({
      id: 'contributing-guide',
      title: 'Create CONTRIBUTING.md',
      description: 'Guide contributors on how to participate',
      impact: 11,
      difficulty: 'medium',
      category: 'documentation',
      completed: false,
      estimatedMinutes: 15,
      aiPersonality: 'claude'
    });

    this.addTaskTemplate({
      id: 'error-handling-docs',
      title: 'Document error handling',
      description: 'Explain how errors are handled and what users should expect',
      impact: 9,
      difficulty: 'easy',
      category: 'quality',
      completed: false,
      estimatedMinutes: 12,
      aiPersonality: 'gemini'
    });

    this.addTaskTemplate({
      id: 'deployment-instructions',
      title: 'Add deployment instructions',
      description: 'Step-by-step guide for deploying the project',
      impact: 13,
      difficulty: 'medium',
      category: 'documentation',
      completed: false,
      estimatedMinutes: 20,
      aiPersonality: 'chatgpt'
    });
  }

  private addTaskTemplate(template: TodoItem): void {
    const category = template.category;
    if (!this.todoDatabase.has(category)) {
      this.todoDatabase.set(category, []);
    }
    this.todoDatabase.get(category)!.push(template);
  }

  private getRelevantTasks(context: TodoGenerationContext): TodoItem[] {
    const allTasks: TodoItem[] = [];
    
    // Get tasks from all categories
    this.todoDatabase.forEach((categoryTasks) => {
      allTasks.push(...categoryTasks);
    });

    // Filter based on missing context and existing files
    return allTasks.filter(task => this.isTaskRelevant(task, context));
  }

  private isTaskRelevant(task: TodoItem, context: TodoGenerationContext): boolean {
    // Don't suggest README if it already exists
    if (task.id === 'readme-creation' && context.existingFiles.includes('README.md')) {
      return false;
    }

    // Don't suggest package.json improvements if it doesn't exist
    if (task.id === 'package-description' && !context.existingFiles.includes('package.json')) {
      return false;
    }

    // Prefer tasks matching AI personality
    if (context.aiPreference && task.aiPersonality !== 'universal' && 
        task.aiPersonality !== context.aiPreference) {
      return Math.random() > 0.7; // 30% chance to include non-preferred
    }

    return true;
  }

  private optimizeTaskSelection(
    availableTasks: TodoItem[], 
    context: TodoGenerationContext, 
    targetScore: number
  ): TodoItem[] {
    const pointsNeeded = Math.max(0, targetScore - context.currentScore);
    const selectedTasks: TodoItem[] = [];
    let currentPoints = 0;

    // Sort by impact/effort ratio (efficiency)
    const sortedTasks = availableTasks
      .map(task => ({
        ...task,
        efficiency: task.impact / task.estimatedMinutes
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    // Select tasks greedily until we hit target or reasonable limit
    for (const task of sortedTasks) {
      if (selectedTasks.length >= 8) {break;} // Max 8 tasks to avoid overwhelm
      if (currentPoints >= pointsNeeded * 1.2) {break;} // 20% buffer

      selectedTasks.push({
        ...task,
        id: this.generateId() // Give unique ID for this todo list
      });
      currentPoints += task.impact;
    }

    return selectedTasks;
  }

  private calculateTargetScore(currentScore: number): number {
    if (currentScore < 50) {return 75;}
    if (currentScore < 70) {return 85;}
    if (currentScore < 85) {return 95;}
    return 100;
  }

  private calculateCelebrationLevel(
    oldScore: number, 
    newScore: number, 
    targetScore: number
  ): 'minor' | 'major' | 'championship' {
    const improvement = newScore - oldScore;
    
    if (newScore >= targetScore) {return 'championship';}
    if (improvement >= 15 || newScore >= 85) {return 'major';}
    return 'minor';
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// =====================================
// EXPORT FOR DIFFERENT PLATFORMS
// =====================================

/**
 * Factory function for creating Claude Todo Engine instances
 * Works in both Node.js and browser environments
 */
export function createClaudeTodoEngine(): ClaudeTodoEngine {
  return new ClaudeTodoEngine();
}

/**
 * Utility functions for platform-specific integrations
 */
export const TodoEngineUtils = {
  /**
   * Format progress for CLI output
   */
  formatProgressCLI(progress: ReturnType<ClaudeTodoEngine['getProgress']>): string {
    const percentage = Math.round(progress.percentage);
    return `${progress.completed}/${progress.total} tasks (${percentage}%) - ${progress.remainingPoints} points remaining`;
  },

  /**
   * Format progress for Svelte reactive stores
   */
  formatProgressSvelte(progress: ReturnType<ClaudeTodoEngine['getProgress']>) {
    return {
      completed: progress.completed,
      total: progress.total,
      percentage: Math.round(progress.percentage),
      remainingPoints: progress.remainingPoints,
      estimatedMinutes: progress.estimatedMinutes,
      isComplete: progress.percentage === 100
    };
  },

  /**
   * Generate celebration message based on improvement
   */
  generateCelebration(improvement: ScoreImprovement): string {
    switch (improvement.celebrationLevel) {
      case 'championship':
        return `🏆 CHAMPIONSHIP ACHIEVED! Perfect score: ${improvement.after}%!`;
      case 'major':
        return `🎉 Major breakthrough! +${improvement.improvement} points (${improvement.after}%)`;
      case 'minor':
        return `☑️ Great progress! +${improvement.improvement} points (${improvement.after}%)`;
    }
  }
};