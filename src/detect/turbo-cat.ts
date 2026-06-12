/**
 * Turbo-Cat™ (= Format-finder) — fills .faf slots from file-format evidence
 * across ~200 formats (the KNOWLEDGE_BASE). Restores the multi-ecosystem
 * manifest interrogation the v6.0 rewrite narrowed to README+Cargo+package.json.
 *
 * v6-native sync port (the v5 engine was async; sync integrates cleanly with
 * `auto`). Two-layer: (1A) config files walking up to the monorepo .git
 * boundary, (1B) source extensions; priority-wins slot recommendations.
 *
 * Used as the LOWEST-precedence filler in `auto`: v6's specific detection wins;
 * Turbo-Cat fills only the slots still empty (esp. non-npm stacks).
 */

import { existsSync, readdirSync } from 'fs';
import { join, dirname, extname, resolve } from 'path';
import { KNOWLEDGE_BASE } from './turbo-cat-knowledge.js';

const IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', 'venv', '.venv', '__pycache__',
  'target', 'coverage', '.next', '.svelte-kit', 'vendor',
]);
const SCAN_EXTS = new Set([
  '.py', '.ts', '.tsx', '.js', '.jsx', '.svelte', '.vue',
  '.rb', '.go', '.rs', '.php', '.java', '.kt', '.swift',
]);

/** ContextSlots (camelCase + snake_case) → v6 .faf slot path. */
const SLOT_MAP: Record<string, [section: string, field: string]> = {
  mainLanguage: ['project', 'main_language'], main_language: ['project', 'main_language'],
  framework: ['stack', 'frontend'],
  cssFramework: ['stack', 'css_framework'], css: ['stack', 'css_framework'],
  uiLibrary: ['stack', 'ui_library'], ui_library: ['stack', 'ui_library'],
  stateManagement: ['stack', 'state_management'], state: ['stack', 'state_management'],
  backend: ['stack', 'backend'],
  apiType: ['stack', 'api_type'], api: ['stack', 'api_type'],
  runtime: ['stack', 'runtime'],
  database: ['stack', 'database'], db: ['stack', 'database'],
  connection: ['stack', 'connection'],
  hosting: ['stack', 'hosting'],
  buildTool: ['stack', 'build'], build_tool: ['stack', 'build'], build: ['stack', 'build'],
  packageManager: ['stack', 'package_manager'], pkg_manager: ['stack', 'package_manager'],
  cicd: ['stack', 'cicd'],
};

/** A format actually discovered on disk (config-file layer; real files only). */
export interface DiscoveredFormat {
  fileName: string;
  /** Derived from the entry's primary slot family (deterministic — real
   *  knowledge surfaced, not invented): package-manager, language, framework,
   *  backend, database, ci-cd, hosting, build, … */
  category: string;
  priority: number;
}

export interface TurboCatResult {
  slotFills: Record<string, string>; // ContextSlots key → value (priority-wins)
  frameworks: string[];
  confirmedCount: number;
  /** Option B (compose spec 2026-06-12): the per-format breakdown consumers
   *  display — surfaced so MCPs can DELETE their local format maps entirely. */
  discoveredFormats: DiscoveredFormat[];
  /** Deterministic lowercase signature, e.g. "typescript-react" ('unknown-stack' when bare). */
  stackSignature: string;
}

interface FoundFormat {
  slots: Record<string, string>;
  priority: number;
  frameworks: string[];
  fileName?: string; // set for the config-file layer (real files on disk)
}

/** slot-family → display category (first match wins; deterministic). */
const CATEGORY_BY_SLOT: Array<[slot: string, category: string]> = [
  ['packageManager', 'package-manager'],
  ['pkg_manager', 'package-manager'],
  ['mainLanguage', 'language'],
  ['main_language', 'language'],
  ['framework', 'framework'],
  ['backend', 'backend'],
  ['database', 'database'],
  ['db', 'database'],
  ['cicd', 'ci-cd'],
  ['hosting', 'hosting'],
  ['buildTool', 'build'],
  ['build_tool', 'build'],
  ['build', 'build'],
  ['runtime', 'runtime'],
  ['cssFramework', 'css'],
  ['css', 'css'],
  ['uiLibrary', 'ui-library'],
  ['stateManagement', 'state-management'],
  ['apiType', 'api'],
  ['api', 'api'],
];

function categoryFor(slots: Record<string, string>, frameworks: string[]): string {
  for (const [slot, category] of CATEGORY_BY_SLOT) {
    if (slot in slots) {return category;}
  }
  return frameworks.length > 0 ? 'framework' : 'config';
}

/** Layer 1A — config files, walking up to the monorepo .git boundary. */
function scanConfigFiles(projectDir: string): FoundFormat[] {
  const found: FoundFormat[] = [];
  let cur = resolve(projectDir);
  const ownGit = existsSync(join(projectDir, '.git'));
  for (let i = 0; i < 10; i++) {
    let files: string[];
    try {
      files = readdirSync(cur);
    } catch {
      break;
    }
    for (const f of files) {
      const k = KNOWLEDGE_BASE[f];
      if (k) {found.push({ slots: (k.slots as Record<string, string>) || {}, priority: k.priority, frameworks: k.frameworks, fileName: f });}
    }
    if (ownGit && i === 0) {break;}
    const parent = dirname(cur);
    if (parent === cur) {break;}
    cur = parent;
  }
  return found;
}

/** Layer 1B — source extensions present. Extensions assert LANGUAGE only: a .py
 *  reliably means Python, but a stray .tsx must not assert "React" (frameworks
 *  come from config files, Layer 1A). */
function scanExtensions(projectDir: string): FoundFormat[] {
  const found: FoundFormat[] = [];
  for (const ext of collectExtensions(projectDir, 2, { count: 0 })) {
    const k = KNOWLEDGE_BASE[`*${ext}`];
    const lang = (k?.slots as Record<string, string> | undefined)?.mainLanguage;
    if (lang) {found.push({ slots: { mainLanguage: lang }, priority: k.priority, frameworks: k.frameworks });}
  }
  return found;
}

/** Scan formats → priority-wins slot recommendations. */
export function turboCatScan(projectDir: string): TurboCatResult {
  const found = [...scanConfigFiles(projectDir), ...scanExtensions(projectDir)];

  // Analyze — highest priority wins each slot (deterministic, order-independent).
  // Skip ambiguous multi-option hints (e.g. "npm/yarn/pnpm") — only confident
  // single values fill; v6's specific detection handles the rest.
  const slotFills: Record<string, string> = {};
  const slotPrio: Record<string, number> = {};
  const fw = new Set<string>();
  for (const item of found) {
    item.frameworks.forEach((f) => fw.add(f));
    for (const [slot, val] of Object.entries(item.slots)) {
      if (val && !val.includes('/') && (!(slot in slotFills) || item.priority > slotPrio[slot])) {
        slotFills[slot] = val;
        slotPrio[slot] = item.priority;
      }
    }
  }
  // Per-format breakdown — real files only, deduped, deterministic order
  // (priority desc, then name) regardless of filesystem enumeration order.
  const seen = new Map<string, DiscoveredFormat>();
  for (const item of found) {
    if (!item.fileName) {continue;}
    if (!seen.has(item.fileName)) {
      seen.set(item.fileName, {
        fileName: item.fileName,
        category: categoryFor(item.slots, item.frameworks),
        priority: item.priority,
      });
    }
  }
  const discoveredFormats = [...seen.values()].sort(
    (a, b) => b.priority - a.priority || a.fileName.localeCompare(b.fileName),
  );

  // Deterministic stack signature: language + framework, lowercased, dash-joined.
  const sigParts: string[] = [];
  if (slotFills.mainLanguage) {sigParts.push(slotFills.mainLanguage.toLowerCase());}
  if (slotFills.framework) {sigParts.push(slotFills.framework.toLowerCase());}
  const stackSignature = sigParts.length > 0 ? sigParts.join('-') : 'unknown-stack';

  return { slotFills, frameworks: [...fw], confirmedCount: found.length, discoveredFormats, stackSignature };
}

/** Turbo-Cat slot fills shaped as a v6 .faf partial ({ project, stack }) for fillEmpties. */
export function turboCatSlots(projectDir: string): { project?: Record<string, string>; stack?: Record<string, string> } {
  const { slotFills } = turboCatScan(projectDir);
  const out: { project?: Record<string, string>; stack?: Record<string, string> } = {};
  for (const [key, value] of Object.entries(slotFills)) {
    const target = SLOT_MAP[key];
    if (!target || !value) {continue;}
    const [section, field] = target;
    if (section === 'project') {(out.project ??= {})[field] = value;}
    else {(out.stack ??= {})[field] = value;}
  }
  return out;
}

function collectExtensions(dir: string, depth: number, budget: { count: number }): Set<string> {
  const exts = new Set<string>();
  if (depth < 0 || budget.count > 400) {return exts;}
  let entries: import('fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return exts;
  }
  for (const e of entries) {
    if (budget.count++ > 400) {break;}
    if (!e.isDirectory()) {
      const ext = extname(e.name);
      if (SCAN_EXTS.has(ext)) {exts.add(ext);}
      continue;
    }
    if (IGNORE.has(e.name) || e.name.startsWith('.')) {continue;}
    for (const x of collectExtensions(join(dir, e.name), depth - 1, budget)) {exts.add(x);}
  }
  return exts;
}
