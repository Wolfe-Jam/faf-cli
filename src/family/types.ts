/**
 * FAF Integration System - Type Definitions
 *
 * Defines the integration quality model for smart stack detection
 */

export interface FafFile {
  project?: {
    name?: string;
    goal?: string;
    main_language?: string;
    architecture?: string;
    typescript_config?: {
      strict?: boolean;
      target?: string;
      module_resolution?: string;
    };
    build_config?: {
      tool?: string;
      plugins?: string[];
      hmr?: string;
      optimization?: string;
    };
    automation?: {
      platform?: string;
      custom_nodes?: number;
      node_packages?: string[];
      has_config?: boolean;
    };
    [key: string]: any;
  };
  stack?: {
    // Mk4 canonical names
    framework?: string;
    css?: string;
    state?: string;
    db?: string;
    pkg_manager?: string;
    api?: string;
    // Unchanged names
    backend?: string;
    runtime?: string;
    build?: string;
    main_language?: string;
    ui_library?: string;
    hosting?: string;
    type_system?: string;
    automation_platform?: string;
    workflow_engine?: string;
    integration_layer?: string;
    api_orchestration?: string;
    // Old aliases (accepted on read)
    frontend?: string;
    css_framework?: string;
    state_management?: string;
    database?: string;
    package_manager?: string;
    api_type?: string;
    [key: string]: any;
  };
  integration?: {
    framework?: string;
    detected_frameworks?: string[];
    mcp_servers?: string[];
    recommended_tools?: string[];
    summary?: string;
    [key: string]: any;
  };
  scores?: {
    foundation?: number;
    architecture?: number;
    deployment?: number;
  };
  [key: string]: any;
}

export interface IntegrationDetector {
  /** Integration name (e.g., 'react', 'next', 'svelte') */
  name: string;

  /** Display name for user messaging */
  displayName: string;

  /** Quality tier (based on evaluation) */
  tier: 'trophy' | 'gold' | 'silver' | 'bronze';

  /** Quality score (0-100) */
  qualityScore: number;

  /** Weekly adoption (npm downloads) */
  weeklyAdoption: number;

  /** Available MCP servers for this integration */
  mcpServers: string[];

  /** Detect if this integration is used in a project */
  detect: (projectPath: string) => boolean | Promise<boolean>;

  /** Generate .faf context from detected integration */
  generateContext: (projectPath: string) => Partial<FafFile> | Promise<Partial<FafFile>>;

  /** Context slots filled by this integration */
  contextContribution: string[];
}

export interface IntegrationRegistry {
  /** All approved integrations */
  integrations: Map<string, IntegrationDetector>;

  /** Get integration by name */
  get(name: string): IntegrationDetector | undefined;

  /** Detect all integrations in a project */
  detectAll(projectPath: string): Promise<IntegrationDetector[]>;

  /** Generate combined .faf context from all detected integrations */
  generateContext(projectPath: string): Promise<Partial<FafFile>>;
}
