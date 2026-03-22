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
  readPackageJson,
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

  // Build stack with slotignored for inactive categories
  const stack: Record<string, string> = {};
  const stackSlots = SLOTS.filter(s => s.path.startsWith('stack.'));

  for (const slot of stackSlots) {
    const field = slot.path.replace('stack.', '');
    if (!activeCategories.includes(slot.category)) {
      stack[field] = 'slotignored';
      continue;
    }

    // Auto-fill detected values
    switch (field) {
      case 'frontend': stack[field] = frontendFw?.name ?? (projectType === 'cli' ? 'CLI' : ''); break;
      case 'css_framework': stack[field] = cssFw?.name ?? ''; break;
      case 'ui_library': stack[field] = uiFw?.name ?? ''; break;
      case 'state_management': stack[field] = stateFw?.name ?? ''; break;
      case 'backend': stack[field] = backendFw?.name ?? ''; break;
      case 'api_type': stack[field] = ''; break;
      case 'runtime': stack[field] = runtime !== 'Unknown' ? runtime : ''; break;
      case 'database': stack[field] = dbFw?.name ?? ''; break;
      case 'connection': stack[field] = dbFw?.name ?? ''; break;
      case 'hosting': stack[field] = hosting ?? ''; break;
      case 'build': stack[field] = buildTool ?? ''; break;
      case 'cicd': stack[field] = cicd ?? ''; break;
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

  return {
    faf_version: '2.5.0',
    project: {
      name: pkg?.name ?? dir.split('/').pop() ?? 'project',
      goal: pkg?.description ?? '',
      main_language: language,
      type: projectType,
    },
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
