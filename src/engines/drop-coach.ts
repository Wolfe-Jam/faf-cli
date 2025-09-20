/**
 * 🏎️ DropCoach - Intelligent File Drop Coaching System
 * Guides users through optimal file uploads with personalized encouragement
 * Part of the RACE STRATEGY package
 */

export interface CoachingMessage {
  text: string;
  type: 'ai' | 'human' | 'system' | 'trust';
  priority: number; // 1-10, higher = more urgent
}

export interface FileTypePriority {
  pattern: string;
  name: string;
  value: number;
  reason: string;
  category: 'foundation' | 'framework' | 'quality' | 'deployment';
}

export interface ProcessedFile {
  fileName: string;
  fileType: string;
  intelligenceBonus: number;
}

export class DropCoach {
  private droppedFiles = new Set<string>();
  private sessionScore = 0;

  // Base TOP-6 files (JavaScript/TypeScript projects)
  private readonly baseTopSix: FileTypePriority[] = [
    { pattern: 'readme.md', name: 'README.md', value: 35, reason: 'project story', category: 'foundation' },
    { pattern: 'package.json', name: 'package.json', value: 35, reason: 'dependencies', category: 'foundation' },
    { pattern: 'tsconfig.json', name: 'tsconfig.json', value: 30, reason: 'language config', category: 'framework' },
    { pattern: 'docker-compose.yml', name: 'docker-compose.yml', value: 30, reason: 'infrastructure', category: 'deployment' },
    { pattern: 'vercel.json', name: 'vercel.json', value: 35, reason: 'deployment', category: 'deployment' },
    { pattern: '.env.example', name: '.env.example', value: 25, reason: 'environment', category: 'deployment' }
  ];

  // Python project TOP-6 adaptation
  private readonly pythonTopSix: FileTypePriority[] = [
    { pattern: 'readme.md', name: 'README.md', value: 35, reason: 'project story', category: 'foundation' },
    { pattern: 'requirements.txt', name: 'requirements.txt', value: 35, reason: 'python dependencies', category: 'foundation' },
    { pattern: 'pyproject.toml', name: 'pyproject.toml', value: 30, reason: 'python project config', category: 'framework' },
    { pattern: 'docker-compose.yml', name: 'docker-compose.yml', value: 30, reason: 'infrastructure', category: 'deployment' },
    { pattern: 'dockerfile', name: 'Dockerfile', value: 35, reason: 'python deployment', category: 'deployment' },
    { pattern: '.env.example', name: '.env.example', value: 25, reason: 'environment', category: 'deployment' }
  ];

  // Go project TOP-6 adaptation
  private readonly goTopSix: FileTypePriority[] = [
    { pattern: 'readme.md', name: 'README.md', value: 35, reason: 'project story', category: 'foundation' },
    { pattern: 'go.mod', name: 'go.mod', value: 35, reason: 'go dependencies', category: 'foundation' },
    { pattern: 'go.sum', name: 'go.sum', value: 25, reason: 'dependency checksums', category: 'framework' },
    { pattern: 'docker-compose.yml', name: 'docker-compose.yml', value: 30, reason: 'infrastructure', category: 'deployment' },
    { pattern: 'dockerfile', name: 'Dockerfile', value: 35, reason: 'go deployment', category: 'deployment' },
    { pattern: '.env.example', name: '.env.example', value: 25, reason: 'environment', category: 'deployment' }
  ];

  // Rust project TOP-6 adaptation
  private readonly rustTopSix: FileTypePriority[] = [
    { pattern: 'readme.md', name: 'README.md', value: 35, reason: 'project story', category: 'foundation' },
    { pattern: 'cargo.toml', name: 'Cargo.toml', value: 35, reason: 'rust dependencies', category: 'foundation' },
    { pattern: 'cargo.lock', name: 'Cargo.lock', value: 25, reason: 'dependency lock', category: 'framework' },
    { pattern: 'docker-compose.yml', name: 'docker-compose.yml', value: 30, reason: 'infrastructure', category: 'deployment' },
    { pattern: 'dockerfile', name: 'Dockerfile', value: 35, reason: 'rust deployment', category: 'deployment' },
    { pattern: '.env.example', name: '.env.example', value: 25, reason: 'environment', category: 'deployment' }
  ];

  // Java project TOP-6 adaptation
  private readonly javaTopSix: FileTypePriority[] = [
    { pattern: 'readme.md', name: 'README.md', value: 35, reason: 'project story', category: 'foundation' },
    { pattern: 'pom.xml', name: 'pom.xml', value: 35, reason: 'maven dependencies', category: 'foundation' },
    { pattern: 'build.gradle', name: 'build.gradle', value: 35, reason: 'gradle build', category: 'framework' },
    { pattern: 'docker-compose.yml', name: 'docker-compose.yml', value: 30, reason: 'infrastructure', category: 'deployment' },
    { pattern: 'dockerfile', name: 'Dockerfile', value: 35, reason: 'java deployment', category: 'deployment' },
    { pattern: 'application.properties', name: 'application.properties', value: 25, reason: 'spring config', category: 'framework' }
  ];

  /**
   * Detect project type from files
   */
  detectProjectType(fileNames: string[]): 'python' | 'go' | 'rust' | 'java' | 'javascript' {
    const lowerNames = fileNames.map(f => f.toLowerCase());

    // Python indicators
    if (lowerNames.some(name =>
      name.includes('requirements.txt') ||
      name.includes('pyproject.toml') ||
      name.endsWith('.py')
    )) {
      return 'python';
    }

    // Go indicators
    if (lowerNames.some(name =>
      name.includes('go.mod') ||
      name.includes('go.sum') ||
      name.endsWith('.go')
    )) {
      return 'go';
    }

    // Rust indicators
    if (lowerNames.some(name =>
      name.includes('cargo.toml') ||
      name.includes('cargo.lock') ||
      name.endsWith('.rs')
    )) {
      return 'rust';
    }

    // Java indicators
    if (lowerNames.some(name =>
      name.includes('pom.xml') ||
      name.includes('build.gradle') ||
      name.endsWith('.java')
    )) {
      return 'java';
    }

    // Default to JavaScript/TypeScript
    return 'javascript';
  }

  /**
   * Get appropriate TOP-6 files based on detected project type
   */
  getTopSixForProject(fileNames: string[]): FileTypePriority[] {
    const projectType = this.detectProjectType(fileNames);

    switch (projectType) {
      case 'python':
        return this.pythonTopSix;
      case 'go':
        return this.goTopSix;
      case 'rust':
        return this.rustTopSix;
      case 'java':
        return this.javaTopSix;
      case 'javascript':
      default:
        return this.baseTopSix;
    }
  }

  /**
   * Get next coaching message based on current state
   */
  getCoachingMessage(processedFiles: ProcessedFile[]): CoachingMessage | null {
    const fileNames = processedFiles.map(f => f.fileName);

    // Get the next file in the priority sequence that hasn't been dropped
    const nextPath = this.getNextPriorityPath(fileNames);

    // First visit - start with Path 1 (README)
    if (processedFiles.length === 0 && nextPath) {
      return {
        text: `🎯 Start with ${nextPath.name} - ${nextPath.reason}`,
        type: 'human',
        priority: 10
      };
    }

    // Continue guiding through the 6-path sequence
    if (nextPath) {
      return {
        text: `📁 Next: ${nextPath.name} - ${nextPath.reason}`,
        type: 'human',
        priority: Math.floor(nextPath.value / 5)
      };
    }

    // All priority files complete
    if (processedFiles.length >= 6) {
      return {
        text: '🏆 Championship context achieved! All key files processed.',
        type: 'system',
        priority: 9
      };
    }

    return null;
  }

  /**
   * Get next priority path that hasn't been dropped yet
   */
  private getNextPriorityPath(fileNames: string[]): FileTypePriority | null {
    const droppedPatterns = fileNames.map(f => f.toLowerCase());
    const priorityFiles = this.getTopSixForProject(fileNames);

    // Find first priority file not yet dropped
    for (const priority of priorityFiles) {
      const alreadyHave = droppedPatterns.some(name =>
        name.includes(priority.pattern) ||
        name.endsWith(priority.pattern)
      );
      if (!alreadyHave) {
        return priority;
      }
    }

    return null;
  }

  /**
   * Generate recommendations for missing files
   */
  generateRecommendations(existingFiles: string[]): string[] {
    const recommendations: string[] = [];
    const topSix = this.getTopSixForProject(existingFiles);
    const existing = existingFiles.map(f => f.toLowerCase());

    for (const priority of topSix) {
      const hasFile = existing.some(name =>
        name.includes(priority.pattern) ||
        name.endsWith(priority.pattern)
      );

      if (!hasFile) {
        recommendations.push(`Add ${priority.name} for ${priority.reason} (+${priority.value} points)`);
      }
    }

    return recommendations;
  }

  /**
   * Calculate score boost from files
   */
  calculateScoreBoost(fileNames: string[]): number {
    let boost = 0;
    const topSix = this.getTopSixForProject(fileNames);
    const existing = fileNames.map(f => f.toLowerCase());

    for (const priority of topSix) {
      const hasFile = existing.some(name =>
        name.includes(priority.pattern) ||
        name.endsWith(priority.pattern)
      );

      if (hasFile) {
        boost += priority.value;
      }
    }

    return Math.min(boost, 100); // Cap at 100 points
  }

  /**
   * Get milestone message for achievements
   */
  getMilestoneMessage(filesCount: number): CoachingMessage | null {
    if (filesCount === 3) {
      return {
        text: '🎯 50% complete! Core files loaded.',
        type: 'system',
        priority: 7
      };
    }

    if (filesCount === 6) {
      return {
        text: '🏆 TOP-6 Complete! Championship context achieved!',
        type: 'trust',
        priority: 10
      };
    }

    if (filesCount === 10) {
      return {
        text: '🚀 Expert level! Your AI has deep understanding.',
        type: 'trust',
        priority: 9
      };
    }

    return null;
  }
}

/**
 * Export singleton instance
 */
export const dropCoach = new DropCoach();