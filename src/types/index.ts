/**
 * Central type exports for @faf/core extraction
 * All types available from one location
 */

export interface FafData {
  version: string;
  project: ProjectInfo;
  instant_context?: InstantContext;
  key_files?: KeyFileInfo[];
  faf_score?: number;
}

export interface ProjectInfo {
  name: string;
  description?: string;
  type?: string;
  goal?: string;
  main_language?: string;
}

export interface InstantContext {
  what_building?: string;
  main_language?: string;
  key_files?: string[];
}

export interface KeyFileInfo {
  path: string;
  purpose?: string;
}

export interface ScoreInput {
  fafData: any;
  projectStats?: {
    fileCount?: number;
    hasTests?: boolean;
    hasCI?: boolean;
  };
}
