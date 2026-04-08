import type { FafData } from '../core/types.js';
import { APP_TYPE_CATEGORIES, SLOTS } from '../core/slots.js';
import {
  detectFrameworks,
  detectLanguage,
  detectProjectType,
  detectRuntime,
  detectPackageManager,
  detectCicd,
  detectHosting,
  detectBuildTool,
  detectSvelteAdapter,
  readPackageJson,
  readProjectManifest,
} from './scanner.js';

/** Auto-detect project stack and generate .faf data */
export function detectStack(dir: string): FafData {
  const pkg = readPackageJson(dir);
  const frameworks = detectFrameworks(dir);
  const language = detectLanguage(dir);
  const projectType = detectProjectType(dir);
  const runtime = detectRuntime(dir);
  const pkgManager = detectPackageManager(dir);
  const cicd = detectCicd(dir);
  const hosting = detectHosting(dir);
  const buildTool = detectBuildTool(dir);

  // Find specific frameworks by category
  const frontendFw = frameworks.find(f => f.category === 'frontend');
  const cssFw = frameworks.find(f => f.category === 'css');
  const uiFw = frameworks.find(f => f.category === 'ui');
  const stateFw = frameworks.find(f => f.category === 'state');
  const backendFw = frameworks.find(f => f.category === 'backend');
  const dbFw = frameworks.find(f => f.category === 'database');

  // Determine which categories are active
  const activeCategories = APP_TYPE_CATEGORIES[projectType] || APP_TYPE_CATEGORIES.library;

  // Framework sub-type detection (framework → svelte, mcp → fastmcp, etc.)
  const isFramework = projectType === 'framework';
  const hasSvelteSignal = frameworks.some(f => f.slug === 'svelte' || f.slug === 'sveltekit');
  const frameworkSubType = isFramework && hasSvelteSignal ? 'svelte' : (isFramework ? null : null);

  // MCP sub-type detection — which MCP SDK is this project using?
  const isMcp = projectType === 'mcp';
  const mcpFramework = isMcp ? frameworks.find(f => f.category === 'mcp') : null;
  const mcpSubType = mcpFramework?.slug ?? null;

  // Svelte-aware: fires for svelte apps AND framework→svelte repos
  const isSvelte = projectType === 'svelte' || frameworkSubType === 'svelte';
  const svelteAdapter = isSvelte ? detectSvelteAdapter(dir) : null;
  const hasSvelteKit = isSvelte && frameworks.some(f => f.slug === 'sveltekit');

  // Framework repos: slots that never apply to framework source code
  const frameworkIgnoredSlots = new Set(['css_framework', 'ui_library', 'database', 'connection', 'hosting']);

  // Build stack with slotignored for inactive categories
  const stack: Record<string, string> = {};
  const stackSlots = SLOTS.filter(s => s.path.startsWith('stack.'));

  for (const slot of stackSlots) {
    const field = slot.path.replace('stack.', '');
    if (!activeCategories.includes(slot.category)) {
      stack[field] = 'slotignored';
      continue;
    }

    // Framework repos: slotignore slots that never apply to framework source code
    if (isFramework && frameworkIgnoredSlots.has(field)) {
      stack[field] = 'slotignored';
      continue;
    }

    // Auto-fill detected values (Svelte-aware overrides applied inline)
    switch (field) {
      case 'frontend': 
        if (projectType === 'static-site') {
          stack[field] = 'Vanilla HTML';
        } else {
          stack[field] = frontendFw?.name ?? (projectType === 'cli' ? 'CLI' : '');
        }
        break;
      case 'css_framework': 
        if (projectType === 'static-site') {
          stack[field] = 'Vanilla CSS';
        } else {
          stack[field] = cssFw?.name ?? '';
        }
        break;
      case 'ui_library': 
        if (projectType === 'static-site') {
          stack[field] = 'Vanilla JS';
        } else {
          stack[field] = uiFw?.name ?? '';
        }
        break;
      case 'state_management':
        // Svelte 5 uses Runes — no external state library needed
        stack[field] = isSvelte ? (stateFw?.name ?? 'Runes') : (stateFw?.name ?? '');
        break;
      case 'backend':
        // MCP servers: use the MCP framework name
        if (isMcp && mcpFramework) {
          stack[field] = mcpFramework.name;
        } else if (projectType === 'static-site') {
          stack[field] = 'Static';
        } else if (isSvelte) {
          stack[field] = hasSvelteKit ? 'SvelteKit' : (backendFw?.name ?? '');
        } else {
          stack[field] = backendFw?.name ?? '';
        }
        break;
      case 'api_type':
        // MCP servers use MCP protocol
        if (isMcp) {
          stack[field] = 'MCP (stdio/SSE)';
        } else if (hasSvelteKit) {
          stack[field] = 'Server Routes';
        } else {
          stack[field] = '';
        }
        break;
      case 'runtime': 
        if (projectType === 'static-site') {
          stack[field] = 'Browser';
        } else {
          stack[field] = runtime !== 'Unknown' ? runtime : '';
        }
        break;
      case 'database':
        // Only populate if ORM actually detected
        stack[field] = dbFw?.name ?? '';
        break;
      case 'connection':
        stack[field] = dbFw?.name ?? '';
        break;
      case 'hosting':
        // Svelte adapter → hosting platform (adapter-vercel = Vercel, etc.)
        if (isSvelte && svelteAdapter) {
          stack[field] = svelteAdapter;
        } else if (projectType === 'static-site' && hosting) {
          // Static sites: inform about detected hosting even if not in universal category
          stack[field] = `${hosting} (detected)`;
        } else {
          stack[field] = hosting ?? '';
        }
        break;
      case 'build':
        // SvelteKit always uses Vite
        stack[field] = isSvelte ? 'Vite' : (buildTool ?? '');
        break;
      case 'cicd': 
        if (projectType === 'static-site' && cicd) {
          // Static sites: inform about detected CI/CD even if not in universal category
          stack[field] = `${cicd} (detected)`;
        } else {
          stack[field] = cicd ?? '';
        }
        break;
      case 'package_manager': stack[field] = pkgManager; break;
      default: stack[field] = ''; break;
    }
  }

  // Build monorepo section
  const monorepo: Record<string, string> = {};
  const monorepoSlots = SLOTS.filter(s => s.path.startsWith('monorepo.'));
  for (const slot of monorepoSlots) {
    const field = slot.path.replace('monorepo.', '');
    if (!activeCategories.includes(slot.category)) {
      monorepo[field] = 'slotignored';
    } else {
      monorepo[field] = '';
    }
  }

  // Build project section — read name/description from any manifest
  const manifest = readProjectManifest(dir);
  const project: Record<string, string> = {
    name: manifest?.name ?? dir.split('/').pop() ?? 'project',
    goal: manifest?.description ?? '',
    main_language: language,
    type: projectType,
  };
  if (isFramework && frameworkSubType) {
    project.framework = frameworkSubType;
  }
  if (isMcp && mcpSubType) {
    project.framework = mcpSubType;
  }

  return {
    faf_version: '3.0',
    project,
    stack,
    human_context: {
      who: '',
      what: pkg?.description ?? '',
      why: '',
      where: '',
      when: '',
      how: '',
    },
    monorepo,
  };
}
