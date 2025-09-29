/**
 * 🏎️ FAF Type Definitions
 * Strict types for the FAF CLI
 */

// Project data structure for YAML generation
export interface FafProjectData {
  // Core Project Info
  projectName: string;
  projectGoal?: string;
  mainLanguage: string;
  framework: string;
  cssFramework?: string;
  uiLibrary?: string;
  stateManagement?: string;
  backend: string;
  apiType: string;
  server: string;
  database: string;
  connection: string;
  hosting: string;
  buildTool: string;
  packageManager?: string;
  cicd: string;
  fafScore: number;
  slotBasedPercentage: number;

  // Human Context
  targetUser?: string;
  coreProblem?: string;
  missionPurpose?: string;
  deploymentMarket?: string;
  timeline?: string;
  approach?: string;

  // Additional Context Arrays
  additionalWho?: string[];
  additionalWhat?: string[];
  additionalHow?: string[];

  // Discovery
  discoveredFormats?: string[];

  // Optional metadata
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // For additional properties
}

// FAF YAML structure
export interface FafYamlStructure {
  project: {
    name: string;
    stack: string;
    goal?: string;
    approach?: string;
    [key: string]: unknown;
  };
  stack: {
    frontend?: {
      framework?: string;
      language?: string;
      css?: string;
      ui?: string;
      state?: string;
    };
    backend?: {
      language?: string;
      framework?: string;
      api?: string;
      server?: string;
    };
    database?: {
      type?: string;
      connection?: string;
    };
    infrastructure?: {
      hosting?: string;
      cicd?: string;
      monitoring?: string;
    };
    [key: string]: unknown;
  };
  human?: {
    who?: string | string[];
    what?: string | string[];
    why?: string | string[];
    how?: string | string[];
    where?: string | string[];
    when?: string | string[];
  };
  context?: {
    purpose?: string;
    problem?: string;
    market?: string;
    timeline?: string;
    [key: string]: unknown;
  };
}

// Package.json structure
export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: {
    node?: string;
    npm?: string;
    [key: string]: string | undefined;
  };
  repository?: {
    type?: string;
    url?: string;
  } | string;
  keywords?: string[];
  author?: string | {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: string;
  bugs?: {
    url?: string;
    email?: string;
  } | string;
  homepage?: string;
  [key: string]: unknown;
}

// Config file types
export interface TsConfig {
  compilerOptions?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
  extends?: string;
  [key: string]: unknown;
}

export interface WebpackConfig {
  entry?: string | string[] | Record<string, string | string[]>;
  output?: Record<string, unknown>;
  module?: {
    rules?: Array<Record<string, unknown>>;
  };
  plugins?: unknown[];
  [key: string]: unknown;
}

export interface ViteConfig {
  build?: Record<string, unknown>;
  server?: Record<string, unknown>;
  plugins?: unknown[];
  [key: string]: unknown;
}

// Type guards
export function isFafProjectData(data: unknown): data is FafProjectData {
  return typeof data === 'object' &&
    data !== null &&
    'projectName' in data &&
    'mainLanguage' in data;
}

export function isPackageJson(data: unknown): data is PackageJson {
  return typeof data === 'object' &&
    data !== null &&
    ('name' in data || 'version' in data);
}