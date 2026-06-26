import type { SlotDef, SlotCategory } from './types.js';

/** All 33 Mk4 canonical slots */
export const SLOTS: SlotDef[] = [
  // Project Meta (3)
  { index: 1, path: 'project.name', label: 'Name', description: 'Project name', category: 'project' },
  { index: 2, path: 'project.goal', label: 'Goal', description: 'Goal (use case)', category: 'project' },
  { index: 3, path: 'project.main_language', label: 'Language', description: 'Primary language', category: 'project' },

  // Human Context (6)
  { index: 4, path: 'human_context.who', label: 'Who', description: 'Who is this for?', category: 'human' },
  { index: 5, path: 'human_context.what', label: 'What', description: 'What are they building', category: 'human' },
  { index: 6, path: 'human_context.why', label: 'Why', description: 'Why does it exist', category: 'human' },
  { index: 7, path: 'human_context.where', label: 'Where', description: 'Where does it run', category: 'human' },
  { index: 8, path: 'human_context.when', label: 'When', description: 'When was it started / timeline', category: 'human' },
  { index: 9, path: 'human_context.how', label: 'How', description: 'How is it built', category: 'human' },

  // Frontend Stack (4)
  { index: 10, path: 'stack.frontend',         canonical: 'stack.framework', label: 'Framework',  description: 'Framework (React, Svelte, etc.)', category: 'frontend' },
  { index: 11, path: 'stack.css_framework',    canonical: 'stack.css',       label: 'CSS',        description: 'CSS framework',                   category: 'frontend' },
  { index: 12, path: 'stack.ui_library',                                     label: 'UI Library', description: 'UI component library',            category: 'frontend' },
  { index: 13, path: 'stack.state_management', canonical: 'stack.state',     label: 'State',      description: 'State management',                category: 'frontend' },

  // Backend Stack (5)
  { index: 14, path: 'stack.backend',                                        label: 'Backend',    description: 'Backend framework',                 category: 'backend' },
  { index: 15, path: 'stack.api_type',         canonical: 'stack.api',       label: 'API',        description: 'API style (REST, GraphQL, etc.)',   category: 'backend' },
  { index: 16, path: 'stack.runtime',                                        label: 'Runtime',    description: 'Runtime (Node, Bun, Python, etc.)', category: 'backend' },
  { index: 17, path: 'stack.database',         canonical: 'stack.db',        label: 'Database',   description: 'Database',                          category: 'backend' },
  { index: 18, path: 'stack.connection',                                     label: 'Connection', description: 'Connection method (Prisma, etc.)',  category: 'backend' },

  // Universal Stack (3)
  { index: 19, path: 'stack.hosting', label: 'Hosting', description: 'Hosting platform', category: 'universal' },
  { index: 20, path: 'stack.build', label: 'Build', description: 'Build tool', category: 'universal' },
  { index: 21, path: 'stack.cicd', label: 'CI/CD', description: 'CI/CD', category: 'universal' },

  // Enterprise Infra (5)
  { index: 22, path: 'stack.monorepo_tool',                                  label: 'Monorepo',        description: 'Monorepo tool',     category: 'enterprise_infra' },
  { index: 23, path: 'stack.package_manager',  canonical: 'stack.pkg_manager', label: 'Package Manager', description: 'Package manager', category: 'enterprise_infra' },
  { index: 24, path: 'stack.workspaces', label: 'Workspaces', description: 'Workspace configuration', category: 'enterprise_infra' },
  { index: 25, path: 'monorepo.packages_count', label: 'Packages', description: 'Number of packages', category: 'enterprise_infra' },
  { index: 26, path: 'monorepo.build_orchestrator', label: 'Build Orchestrator', description: 'Build orchestration tool', category: 'enterprise_infra' },

  // Enterprise App (4)
  { index: 27, path: 'stack.admin', label: 'Admin', description: 'Admin panel', category: 'enterprise_app' },
  { index: 28, path: 'stack.cache', label: 'Cache', description: 'Caching layer', category: 'enterprise_app' },
  { index: 29, path: 'stack.search', label: 'Search', description: 'Search engine', category: 'enterprise_app' },
  { index: 30, path: 'stack.storage', label: 'Storage', description: 'Object storage', category: 'enterprise_app' },

  // Enterprise Ops (3)
  { index: 31, path: 'monorepo.versioning_strategy', label: 'Versioning', description: 'Version strategy', category: 'enterprise_ops' },
  { index: 32, path: 'monorepo.shared_configs', label: 'Shared Configs', description: 'Shared configs', category: 'enterprise_ops' },
  { index: 33, path: 'monorepo.remote_cache', label: 'Remote Cache', description: 'Remote build cache', category: 'enterprise_ops' },
];

/** Slot lookup by path — dual-keyed (current on-wire `path` AND Mk4 `canonical`
 *  where defined) so callers can look up by either name. See issue #66. */
export const SLOT_BY_PATH = new Map<string, SlotDef>(
  SLOTS.flatMap(s => s.canonical ? [[s.path, s], [s.canonical, s]] : [[s.path, s]])
);

/** Mk4 canonical → current on-wire path. Used by read helpers to resolve
 *  a canonical name back to the path that read/write/kernel actually uses
 *  today. Empty for slots whose path is already canonical. */
export const CANONICAL_TO_CURRENT: ReadonlyMap<string, string> = new Map(
  SLOTS.filter(s => s.canonical).map(s => [s.canonical as string, s.path])
);

/** Current on-wire path → Mk4 canonical. Used by display helpers when the
 *  UI wants to surface the forward-spec name. */
export const CURRENT_TO_CANONICAL: ReadonlyMap<string, string> = new Map(
  SLOTS.filter(s => s.canonical).map(s => [s.path, s.canonical as string])
);

/** Resolve any path (legacy or canonical) to the slot definition. */
export function getSlotByAnyPath(path: string): SlotDef | undefined {
  return SLOT_BY_PATH.get(path);
}

/** Read a value from a .faf data object, checking both the slot's current
 *  `path` and its Mk4 `canonical` (if defined). Returns the first non-undefined
 *  value. Lets the cli read .faf files that contain either legacy or canonical
 *  keys without forcing a migration. */
export function readSlotValue(
  data: Record<string, unknown>,
  slot: SlotDef
): unknown {
  const tryPath = (p: string): unknown => {
    const parts = p.split('.');
    let cur: unknown = data;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return cur;
  };
  const primary = tryPath(slot.path);
  if (primary !== undefined) return primary;
  if (slot.canonical) return tryPath(slot.canonical);
  return undefined;
}

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
  if (value === null || value === undefined || value === '') return true;
  if (typeof value === 'string') {
    return PLACEHOLDERS.has(value.toLowerCase().trim());
  }
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true;
  return false;
}

/** App-type to active category mapping. The canonical 24-type ladder —
 *  21 detectable apps + `about` (non-app, 0 slots, owner-attested)
 *  + `encyclopedia` (curated knowledge surface, FAFipedia and similar)
 *  + `intent` (human-intent seed from builder.faf.one, not auto-detected).
 *  (See v6.6.md doctrine memory + fafipedia-vs-grokipedia-architecture.)
 *  Sorted ascending by active slot count for readability.
 *
 *  v6.5.0 changes vs prior:
 *  - Added `universal` to cli / library / mcp / frontend / data-science.
 *    These types ship/build/CI somewhere — slotignoring those slots was
 *    losing real signal. (cli/library: 9→12; mcp/data-science: 14→17;
 *    frontend: 13→16.)
 *  - Order is by ascending slot count, not insertion order.
 */
export const APP_TYPE_CATEGORIES: Record<string, SlotCategory[]> = {
  // 0 slots — non-app representation surface. Score is INHERITED, not calculated.
  // About Repos are public faces of private codebases (private source / public
  // about pattern, same shape as Anthropic's claude-code repo). They display
  // the source's Trophy badge; they don't earn one. Required: about.represents
  // (Wolfe-Jam/<source>). Optional: about.source_score (number). Scorer
  // short-circuits when app_type === 'about' — see scorer.ts.
  // Doctrine: memory/private-source-public-about-pattern.md.
  about: [],

  // 9 slots — minimal (project meta + human only)
  documentation: ['project', 'human'],
  // intent: the human-intent SEED type, produced by builder.faf.one — a human
  // captures name/goal + the 6 Ws (no stack yet). Same 9 active slots as
  // documentation, but named honestly: it is intent awaiting a stack. An AI that
  // fills the stack re-types it to the real app_type (cli/mcp/frontend/…). Reads
  // honestly even if abandoned ("intent captured, never built").
  intent: ['project', 'human'],
  // encyclopedia: same shape as documentation — content repo with project
  // metadata + human context. Used by FAFipedia and similar curated-knowledge
  // surfaces. Per fafipedia-vs-grokipedia-architecture doctrine, this is the
  // structured, git-versioned, agent-consumable knowledge layer. Each .fafi
  // file under an encyclopedia repo is itself a valid .faf (inclusion marker).
  encyclopedia: ['project', 'human'],

  // 12 slots — project + human + universal (build/ci/hosting matters)
  cli: ['project', 'human', 'universal'],
  library: ['project', 'human', 'universal'],
  sdk: ['project', 'human', 'universal'],
  wasm: ['project', 'human', 'universal'],
  html: ['project', 'human', 'universal'],
  // server-card: a published MCP Server Card (discovery manifest) — artifact-class
  // like sdk/wasm/html. Identity + human context + build/ship matter; frontend,
  // backend and DB are N/A. By design it carries the FAF context-block in the
  // card's `_meta["one.faf/context"]` by default — so anyone generating a Server
  // Card through FAF gets FAF context for free. See faf-server-card-ref.
  'server-card': ['project', 'human', 'universal'],

  // 16 slots — project + frontend + human + universal
  frontend: ['project', 'frontend', 'human', 'universal'],
  website: ['project', 'frontend', 'human', 'universal'],
  mobile: ['project', 'frontend', 'human', 'universal'],
  // browser/chrome extension — popup/content-script UI + build/CI/store
  // (manifest_version), NO backend. Detected via manifest_version in scanner.ts.
  extension: ['project', 'frontend', 'human', 'universal'],

  // 17 slots — project + backend + universal + human
  mcp: ['project', 'backend', 'human', 'universal'],
  backend: ['project', 'backend', 'universal', 'human'],
  'data-science': ['project', 'backend', 'human', 'universal'],

  // 21 slots — full base ladder
  fullstack: ['project', 'frontend', 'backend', 'universal', 'human'],
  svelte: ['project', 'frontend', 'backend', 'universal', 'human'],
  framework: ['project', 'frontend', 'backend', 'universal', 'human'],
  'monorepo-root': ['project', 'human', 'enterprise_infra', 'enterprise_app', 'enterprise_ops'],

  // 24-25 slots — platform / SaaS shapes (base + selected enterprise)
  mcpaas: ['project', 'backend', 'universal', 'human', 'enterprise_app', 'enterprise_ops'],
  saas: ['project', 'frontend', 'backend', 'universal', 'human', 'enterprise_app'],

  // 33 slots — full enterprise
  enterprise: ['project', 'frontend', 'backend', 'universal', 'human', 'enterprise_infra', 'enterprise_app', 'enterprise_ops'],
};
