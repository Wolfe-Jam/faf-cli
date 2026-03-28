import type { SlotDef, SlotCategory } from './types.js';

/** All 33 Mk4 canonical slots */
export const SLOTS: SlotDef[] = [
  // Project Meta (3)
  { index: 1, path: 'project.name', description: 'Project name', category: 'project' },
  { index: 2, path: 'project.goal', description: 'What the project does', category: 'project' },
  { index: 3, path: 'project.main_language', description: 'Primary language', category: 'project' },

  // Human Context (6)
  { index: 4, path: 'human_context.who', description: 'Who is building this', category: 'human' },
  { index: 5, path: 'human_context.what', description: 'What are they building', category: 'human' },
  { index: 6, path: 'human_context.why', description: 'Why does it exist', category: 'human' },
  { index: 7, path: 'human_context.where', description: 'Where does it run', category: 'human' },
  { index: 8, path: 'human_context.when', description: 'When was it started / timeline', category: 'human' },
  { index: 9, path: 'human_context.how', description: 'How is it built', category: 'human' },

  // Frontend Stack (4)
  { index: 10, path: 'stack.frontend', description: 'Framework (React, Svelte, etc.)', category: 'frontend' },
  { index: 11, path: 'stack.css_framework', description: 'CSS framework', category: 'frontend' },
  { index: 12, path: 'stack.ui_library', description: 'UI component library', category: 'frontend' },
  { index: 13, path: 'stack.state_management', description: 'State management', category: 'frontend' },

  // Backend Stack (5)
  { index: 14, path: 'stack.backend', description: 'Backend framework', category: 'backend' },
  { index: 15, path: 'stack.api_type', description: 'API style (REST, GraphQL, etc.)', category: 'backend' },
  { index: 16, path: 'stack.runtime', description: 'Runtime (Node, Bun, Python, etc.)', category: 'backend' },
  { index: 17, path: 'stack.database', description: 'Database', category: 'backend' },
  { index: 18, path: 'stack.connection', description: 'Connection method (Prisma, etc.)', category: 'backend' },

  // Universal Stack (3)
  { index: 19, path: 'stack.hosting', description: 'Hosting platform', category: 'universal' },
  { index: 20, path: 'stack.build', description: 'Build tool', category: 'universal' },
  { index: 21, path: 'stack.cicd', description: 'CI/CD', category: 'universal' },

  // Enterprise Infra (5)
  { index: 22, path: 'stack.monorepo_tool', description: 'Monorepo tool', category: 'enterprise_infra' },
  { index: 23, path: 'stack.package_manager', description: 'Package manager', category: 'enterprise_infra' },
  { index: 24, path: 'stack.workspaces', description: 'Workspace configuration', category: 'enterprise_infra' },
  { index: 25, path: 'monorepo.packages_count', description: 'Number of packages', category: 'enterprise_infra' },
  { index: 26, path: 'monorepo.build_orchestrator', description: 'Build orchestration tool', category: 'enterprise_infra' },

  // Enterprise App (4)
  { index: 27, path: 'stack.admin', description: 'Admin panel', category: 'enterprise_app' },
  { index: 28, path: 'stack.cache', description: 'Caching layer', category: 'enterprise_app' },
  { index: 29, path: 'stack.search', description: 'Search engine', category: 'enterprise_app' },
  { index: 30, path: 'stack.storage', description: 'Object storage', category: 'enterprise_app' },

  // Enterprise Ops (3)
  { index: 31, path: 'monorepo.versioning_strategy', description: 'Version strategy', category: 'enterprise_ops' },
  { index: 32, path: 'monorepo.shared_configs', description: 'Shared configs', category: 'enterprise_ops' },
  { index: 33, path: 'monorepo.remote_cache', description: 'Remote build cache', category: 'enterprise_ops' },
];

/** Slot lookup by path */
export const SLOT_BY_PATH = new Map(SLOTS.map(s => [s.path, s]));

/** Slots grouped by category */
export function slotsByCategory(category: SlotCategory): SlotDef[] {
  return SLOTS.filter(s => s.category === category);
}

/** Base-tier slots (1-21) — used by score_faf */
export const BASE_SLOTS = SLOTS.filter(s => s.index <= 21);

/** Enterprise-tier slots (1-33) — used by score_faf_enterprise */
export const ENTERPRISE_SLOTS = SLOTS;

/** Placeholder values treated as Empty */
export const PLACEHOLDERS = new Set([
  'describe your project goal',
  'development teams',
  'cloud platform',
  'null',
  'none',
  'unknown',
  'n/a',
  'not applicable',
]);

/** Check if a value is a placeholder (empty) */
export function isPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {return true;}
  if (typeof value === 'string') {
    return PLACEHOLDERS.has(value.toLowerCase().trim());
  }
  if (Array.isArray(value) && value.length === 0) {return true;}
  if (typeof value === 'object' && Object.keys(value as object).length === 0) {return true;}
  return false;
}

/** App-type to active category mapping for faf init */
export const APP_TYPE_CATEGORIES: Record<string, SlotCategory[]> = {
  cli: ['project', 'human'],
  library: ['project', 'human'],
  mcp: ['project', 'backend', 'universal', 'human'],
  backend: ['project', 'backend', 'universal', 'human'],
  'data-science': ['project', 'backend', 'human'],
  frontend: ['project', 'frontend', 'human'],
  fullstack: ['project', 'frontend', 'backend', 'universal', 'human'],
  svelte: ['project', 'frontend', 'backend', 'universal', 'human'],
  framework: ['project', 'frontend', 'backend', 'universal', 'human'],
  enterprise: ['project', 'frontend', 'backend', 'universal', 'human', 'enterprise_infra', 'enterprise_app', 'enterprise_ops'],
};
