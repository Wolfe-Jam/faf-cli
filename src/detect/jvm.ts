import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import spec from './jvm-detection.json';

/**
 * JVM (Java / Kotlin) detection — CONTENT-AWARE pom / gradle classification.
 *
 * Kill line: pom / gradle alone ≠ type.
 * One brand: JVM. Android + KMP are facets, not a second "Kotlin Edition".
 *
 * Signal graph: settings → modules → plugins/parents/packaging →
 * version catalogs (libs.versions.toml) → deps/starters.
 *
 * Same composition as go.ts / csharp.ts: knowledge in jvm-detection.json.
 */

export type JvmAppType = 'mcp' | 'backend' | 'cli' | 'library' | 'mobile';

export interface JvmProject {
  appType: JvmAppType;
  /** Primary framework label (Spring Boot / Quarkus / …) or ''. */
  framework: string;
  buildTool: 'maven' | 'gradle';
  /** Best-effort language signal for slots. */
  mainLanguage: 'Java' | 'Kotlin' | 'Java/Kotlin';
  /** Facets: android · multiplatform (not product brands). */
  facets: string[];
  /** Glass Hood rationale for .faf `# found:`. */
  found: string;
}

interface Catalog {
  plugins: Map<string, string>; // alias → plugin id
  libraries: Map<string, string>; // alias → group:artifact
}

interface ModuleSignals {
  path: string;
  plugins: Set<string>;
  artifacts: Set<string>; // group:artifact lowercase
  packaging: string;
  parents: Set<string>; // group:artifact
  hasMainClass: boolean;
  hasApplicationPlugin: boolean;
  sourceHints: Set<string>; // androidMain, commonMain, jvmMain, …
  kotlinSources: boolean;
  javaSources: boolean;
  buildTool: 'maven' | 'gradle';
}

const MCP_ARTIFACTS = (spec.mcpArtifacts as string[]).map(a => a.toLowerCase());
const WEB_PLUGINS = (spec.webPlugins as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const WEB_PARENTS = (spec.webParents as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const WEB_ARTIFACTS = (spec.webArtifacts as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const ANDROID_PLUGINS = (spec.androidPlugins as string[]).map(p => p.toLowerCase());
const KMP_PLUGINS = (spec.kmpPlugins as string[]).map(p => p.toLowerCase());
const JVM_KOTLIN_PLUGINS = (spec.jvmKotlinPlugins as string[]).map(p => p.toLowerCase());
const CLI_PLUGINS = (spec.cliPlugins as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const CLI_ARTIFACTS = (spec.cliArtifacts as Array<[string, string]>).map(
  ([id, label]) => [id.toLowerCase(), label] as [string, string],
);
const LIBRARY_PLUGINS = (spec.libraryPlugins as string[]).map(p => p.toLowerCase());

const JVM_ROOT_MARKERS = [
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'settings.gradle',
  'settings.gradle.kts',
];

/** True if directory looks like a JVM project root (or multi-module root). */
export function isJvmRoot(dir: string): boolean {
  return JVM_ROOT_MARKERS.some(f => existsSync(join(dir, f)));
}

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

/** Minimal TOML-ish parse for gradle/libs.versions.toml plugins + libraries. */
export function parseVersionCatalog(content: string): Catalog {
  const plugins = new Map<string, string>();
  const libraries = new Map<string, string>();
  let section = '';

  for (const raw of content.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) {continue;}
    const sec = line.match(/^\[([^\]]+)\]$/);
    if (sec) {
      section = sec[1].trim().toLowerCase();
      continue;
    }

    // alias = { id = "org.springframework.boot", ... }
    const objId = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{[^}]*\bid\s*=\s*"([^"]+)"/);
    if (objId && (section === 'plugins' || section.endsWith('.plugins'))) {
      plugins.set(objId[1].replace(/-/g, '.').toLowerCase(), objId[2].toLowerCase());
      plugins.set(objId[1].toLowerCase(), objId[2].toLowerCase());
      continue;
    }
    // alias = { module = "g:a", ... } or group + name
    const objMod = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{[^}]*\bmodule\s*=\s*"([^"]+)"/);
    if (objMod && (section === 'libraries' || section.endsWith('.libraries'))) {
      const key = objMod[1].toLowerCase();
      libraries.set(key, objMod[2].toLowerCase());
      libraries.set(key.replace(/-/g, '.'), objMod[2].toLowerCase());
      continue;
    }
    const objGroup = line.match(
      /^([A-Za-z0-9_.-]+)\s*=\s*\{[^}]*\bgroup\s*=\s*"([^"]+)"[^}]*\bname\s*=\s*"([^"]+)"/,
    );
    if (objGroup && (section === 'libraries' || section.endsWith('.libraries'))) {
      const ga = `${objGroup[2]}:${objGroup[3]}`.toLowerCase();
      const key = objGroup[1].toLowerCase();
      libraries.set(key, ga);
      libraries.set(key.replace(/-/g, '.'), ga);
      continue;
    }
    // alias = "g:a:v" or "plugin.id:version"
    const plain = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*"([^"]+)"/);
    if (plain) {
      const key = plain[1].toLowerCase();
      const val = plain[2];
      if (section === 'plugins' || section.endsWith('.plugins')) {
        const id = val.split(':')[0].toLowerCase();
        plugins.set(key, id);
        plugins.set(key.replace(/-/g, '.'), id);
      } else if (section === 'libraries' || section.endsWith('.libraries')) {
        const parts = val.split(':');
        if (parts.length >= 2) {
          const ga = `${parts[0]}:${parts[1]}`.toLowerCase();
          libraries.set(key, ga);
          libraries.set(key.replace(/-/g, '.'), ga);
        }
      }
    }
  }
  return { plugins, libraries };
}

function loadCatalog(root: string): Catalog {
  const path = join(root, 'gradle', 'libs.versions.toml');
  if (!existsSync(path)) {return { plugins: new Map(), libraries: new Map() };}
  const body = readText(path);
  if (!body) {return { plugins: new Map(), libraries: new Map() };}
  return parseVersionCatalog(body);
}

/** Parse settings.gradle(.kts) include lines → relative module paths. */
export function parseSettingsIncludes(content: string): string[] {
  const mods: string[] = [];
  // include("app", "lib") or include 'app', 'lib' or include(":app")
  for (const m of content.matchAll(/include\s*\(\s*([^)]+)\)/g)) {
    for (const part of m[1].split(',')) {
      const name = part.replace(/['":\s]/g, '').replace(/^:/, '');
      if (name) {mods.push(name.replace(/:/g, '/'));}
    }
  }
  for (const m of content.matchAll(/include\s+((?:['"][^'"]+['"]\s*,?\s*)+)/g)) {
    for (const part of m[1].split(',')) {
      const name = part.replace(/['":\s]/g, '').replace(/^:/, '');
      if (name) {mods.push(name.replace(/:/g, '/'));}
    }
  }
  // project(":app").projectDir = file("applications/app")
  for (const m of content.matchAll(
    /project\s*\(\s*["']:([^"']+)["']\s*\)\s*\.projectDir\s*=\s*file\s*\(\s*["']([^"']+)["']\s*\)/g,
  )) {
    mods.push(m[2].replace(/^\.\//, ''));
  }
  return [...new Set(mods)];
}

function extractGradlePlugins(content: string, catalog: Catalog): Set<string> {
  const plugins = new Set<string>();
  // id("org.springframework.boot") version "…"
  for (const m of content.matchAll(/\bid\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    plugins.add(m[1].toLowerCase());
  }
  // id 'org.springframework.boot'
  for (const m of content.matchAll(/\bid\s+['"]([^'"]+)['"]/g)) {
    plugins.add(m[1].toLowerCase());
  }
  // plugins { application · java · `java-library` } bare / backtick ids
  for (const block of content.matchAll(/plugins\s*\{([\s\S]*?)\}/g)) {
    for (const raw of block[1].split(/[\n;]/)) {
      const line = raw.replace(/\/\/.*$/, '').trim();
      if (!line || line.startsWith('id') || line.startsWith('kotlin') || line.startsWith('alias')) {
        continue;
      }
      const bare = line.match(/^`([a-zA-Z0-9.-]+)`$/) || line.match(/^([a-zA-Z][a-zA-Z0-9.-]*)$/);
      if (bare) {plugins.add(bare[1].toLowerCase());}
    }
  }
  // kotlin("jvm") / kotlin("multiplatform")
  for (const m of content.matchAll(/\bkotlin\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    const k = m[1].toLowerCase();
    if (k === 'jvm') {plugins.add('org.jetbrains.kotlin.jvm');}
    else if (k === 'multiplatform') {plugins.add('org.jetbrains.kotlin.multiplatform');}
    else if (k === 'android') {plugins.add('org.jetbrains.kotlin.android');}
    else {plugins.add(`org.jetbrains.kotlin.${k}`);}
  }
  // alias(libs.plugins.spring.boot) or libs.plugins.spring.boot
  for (const m of content.matchAll(/libs\.plugins\.([A-Za-z0-9_.]+)/g)) {
    const alias = m[1].toLowerCase();
    const resolved =
      catalog.plugins.get(alias) ||
      catalog.plugins.get(alias.replace(/\./g, '-')) ||
      catalog.plugins.get(alias.replace(/-/g, '.'));
    if (resolved) {plugins.add(resolved);}
    else {
      // Heuristic: spring.boot → often org.springframework.boot
      if (alias.includes('spring') && alias.includes('boot')) {
        plugins.add('org.springframework.boot');
      }
    }
  }
  // apply plugin: 'java'
  for (const m of content.matchAll(/apply\s+plugin\s*:\s*['"]([^'"]+)['"]/g)) {
    plugins.add(m[1].toLowerCase());
  }
  return plugins;
}

function extractGradleArtifacts(content: string, catalog: Catalog): Set<string> {
  const arts = new Set<string>();
  // "g:a:v" or 'g:a:v'
  for (const m of content.matchAll(/["']([A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+)(?::[^"']+)?["']/g)) {
    arts.add(m[1].toLowerCase());
  }
  // libs.spring.boot.starter.web → alias spring-boot-starter-web / spring.boot.starter.web
  for (const m of content.matchAll(/libs\.([A-Za-z0-9_.]+)/g)) {
    const alias = m[1].toLowerCase();
    if (alias.startsWith('plugins.')) {continue;}
    const keys = [
      alias,
      alias.replace(/\./g, '-'),
      alias.replace(/-/g, '.'),
    ];
    for (const k of keys) {
      const ga = catalog.libraries.get(k);
      if (ga) {
        arts.add(ga.includes(':') ? ga.split(':').slice(0, 2).join(':') : ga);
        break;
      }
    }
  }
  return arts;
}

function extractMavenSignals(content: string): {
  packaging: string;
  parents: Set<string>;
  artifacts: Set<string>;
  modules: string[];
} {
  const packaging =
    (content.match(/<packaging>\s*([^<]+?)\s*<\/packaging>/i)?.[1] || 'jar').trim().toLowerCase();
  const parents = new Set<string>();
  const parentBlock = content.match(/<parent>([\s\S]*?)<\/parent>/i);
  if (parentBlock) {
    const g = parentBlock[1].match(/<groupId>\s*([^<]+?)\s*<\/groupId>/i)?.[1]?.trim();
    const a = parentBlock[1].match(/<artifactId>\s*([^<]+?)\s*<\/artifactId>/i)?.[1]?.trim();
    if (g && a) {parents.add(`${g}:${a}`.toLowerCase());}
  }
  const artifacts = new Set<string>();
  for (const m of content.matchAll(/<dependency>([\s\S]*?)<\/dependency>/gi)) {
    const g = m[1].match(/<groupId>\s*([^<]+?)\s*<\/groupId>/i)?.[1]?.trim();
    const a = m[1].match(/<artifactId>\s*([^<]+?)\s*<\/artifactId>/i)?.[1]?.trim();
    if (g && a) {artifacts.add(`${g}:${a}`.toLowerCase());}
  }
  const modules: string[] = [];
  for (const m of content.matchAll(/<module>\s*([^<]+?)\s*<\/module>/gi)) {
    modules.push(m[1].trim());
  }
  return { packaging, parents, artifacts, modules };
}

function hasPlugin(plugins: Set<string>, id: string): boolean {
  const n = id.toLowerCase();
  if (plugins.has(n)) {return true;}
  for (const p of plugins) {
    if (p === n || p.endsWith(`.${n}`) || p === n.replace(/^org\.gradle\./, '')) {return true;}
  }
  return false;
}

function findLabeled(
  set: Set<string>,
  entries: Array<[string, string]>,
  mode: 'plugin' | 'artifact' | 'parent',
): [string, string] | undefined {
  let best: [string, string] | undefined;
  for (const [id, label] of entries) {
    let hit = false;
    if (mode === 'plugin') {hit = hasPlugin(set, id);}
    else {
      hit = set.has(id) || [...set].some(a => a === id || a.startsWith(`${id}:`) || a.startsWith(`${id}.`));
      // artifact prefix match group:artifact
      if (!hit && mode === 'artifact') {
        hit = [...set].some(a => a === id || a.startsWith(`${id}`));
      }
    }
    if (!hit) {continue;}
    if (!best || id.length > best[0].length) {best = [id, label];}
  }
  return best;
}

function hasMcp(artifacts: Set<string>): string | undefined {
  let best: string | undefined;
  for (const id of MCP_ARTIFACTS) {
    for (const a of artifacts) {
      if (a === id || a.startsWith(`${id}:`) || a.startsWith(id.replace(/:mcp$/, ':'))) {
        if (!best || id.length > best.length) {best = id;}
      }
      // any io.modelcontextprotocol
      if (a.startsWith('io.modelcontextprotocol') || a.includes('spring-ai-starter-mcp') || a.includes('spring-ai-mcp')) {
        if (!best || a.length > best.length) {best = a;}
      }
    }
  }
  return best;
}

function probeSources(dir: string): { kotlin: boolean; java: boolean; hints: Set<string> } {
  const hints = new Set<string>();
  let kotlin = false;
  let java = false;
  const roots = [
    join(dir, 'src'),
    join(dir, 'src', 'main'),
  ];
  const walk = (p: string, depth: number): void => {
    if (depth > 4 || !existsSync(p)) {return;}
    let entries: string[];
    try {
      entries = readdirSync(p);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === 'androidMain' || name === 'commonMain' || name === 'jvmMain' || name === 'iosMain') {
        hints.add(name);
      }
      const full = join(p, name);
      try {
        const st = statSync(full);
        if (st.isDirectory()) {walk(full, depth + 1);}
        else if (name.endsWith('.kt') || name.endsWith('.kts')) {kotlin = true;}
        else if (name.endsWith('.java')) {java = true;}
      } catch { /* skip */ }
    }
  };
  for (const r of roots) {walk(r, 0);}
  // also check kotlin dsl only at module root as language signal is weak — skip
  return { kotlin, java, hints };
}

function classifyModule(sig: ModuleSignals): Omit<JvmProject, 'buildTool' | 'mainLanguage'> & {
  buildTool: 'maven' | 'gradle';
  mainLanguage: 'Java' | 'Kotlin' | 'Java/Kotlin';
} {
  const facets: string[] = [];
  const plugins = sig.plugins;
  const arts = sig.artifacts;

  const isKmp = KMP_PLUGINS.some(p => hasPlugin(plugins, p)) || sig.sourceHints.has('commonMain');
  const isAndroidApp = hasPlugin(plugins, 'com.android.application');
  const isAndroidLib =
    hasPlugin(plugins, 'com.android.library') ||
    hasPlugin(plugins, 'com.android.kotlin.multiplatform.library');
  if (isAndroidApp || isAndroidLib) {facets.push('android');}
  if (isKmp) {facets.push('multiplatform');}

  const mcp = hasMcp(arts);
  const webPlug = findLabeled(plugins, WEB_PLUGINS, 'plugin');
  const webParent = findLabeled(sig.parents, WEB_PARENTS, 'parent');
  const webArt = findLabeled(arts, WEB_ARTIFACTS, 'artifact');
  const cliPlug = findLabeled(plugins, CLI_PLUGINS, 'plugin');
  const cliArt = findLabeled(arts, CLI_ARTIFACTS, 'artifact');
  const isLibPlugin = LIBRARY_PLUGINS.some(p => hasPlugin(plugins, p));
  const isAggregator = sig.packaging === 'pom';

  let appType: JvmAppType;
  let framework = '';
  let found: string;

  // Priority: KMP facet noted always; Android app → mobile; MCP → mcp; web → backend; CLI → cli; else library
  if (isAndroidApp) {
    appType = 'mobile';
    framework = isKmp ? 'Android+KMP' : 'Android';
    found = `${sig.path || 'root'} + com.android.application (${framework})`;
  } else if (mcp) {
    appType = 'mcp';
    framework = 'MCP';
    facets.push('mcp');
    found = `${sig.path || 'root'} + ${mcp} (JVM MCP server)`;
  } else if (webPlug || webParent || webArt) {
    appType = 'backend';
    framework = webPlug?.[1] || webParent?.[1] || webArt?.[1] || 'JVM';
    const via = webPlug?.[0] || webParent?.[0] || webArt?.[0] || 'web';
    found = `${sig.path || 'root'} + ${via} (JVM backend)`;
  } else if (isKmp && !isAndroidLib) {
    // Shared KMP without android application — library with multiplatform facet
    appType = 'library';
    framework = 'Kotlin Multiplatform';
    found = `${sig.path || 'root'} + kotlin multiplatform (KMP library)`;
  } else if (isAndroidLib) {
    appType = 'library';
    framework = isKmp ? 'Android+KMP' : 'Android';
    found = `${sig.path || 'root'} + android library (${framework})`;
  } else if (cliArt || (sig.hasApplicationPlugin && (sig.hasMainClass || cliPlug)) || (cliPlug && sig.hasMainClass)) {
    appType = 'cli';
    framework = cliArt?.[1] || 'application';
    found = cliArt
      ? `${sig.path || 'root'} + ${cliArt[0]} (JVM CLI)`
      : `${sig.path || 'root'} + application plugin (JVM CLI)`;
  } else if (sig.hasApplicationPlugin && !isLibPlugin) {
    appType = 'cli';
    framework = 'application';
    found = `${sig.path || 'root'} + application plugin (JVM CLI)`;
  } else if (isAggregator) {
    appType = 'library';
    found = `${sig.path || 'root'} + packaging=pom (Maven aggregator/BOM)`;
  } else {
    appType = 'library';
    const lang = sig.kotlinSources && !sig.javaSources ? 'Kotlin' : 'JVM';
    found = `${sig.path || 'root'} (${lang} library)`;
    if (isLibPlugin) {found = `${sig.path || 'root'} + java-library (JVM library)`;}
  }

  let mainLanguage: 'Java' | 'Kotlin' | 'Java/Kotlin' = 'Java';
  if (sig.kotlinSources && sig.javaSources) {mainLanguage = 'Java/Kotlin';}
  else if (sig.kotlinSources || JVM_KOTLIN_PLUGINS.some(p => hasPlugin(plugins, p)) || isKmp) {
    mainLanguage = 'Kotlin';
  }

  // Dedupe facets
  const uniqFacets = [...new Set(facets)];

  return {
    appType,
    framework,
    facets: uniqFacets,
    found,
    buildTool: sig.buildTool,
    mainLanguage,
  };
}

function rank(appType: JvmAppType, facets: string[]): number {
  if (appType === 'mcp') {return 0;}
  if (appType === 'mobile') {return 1;}
  if (facets.includes('multiplatform') && appType === 'backend') {return 2;}
  if (appType === 'backend') {return 3;}
  if (appType === 'cli') {return 4;}
  if (facets.includes('multiplatform')) {return 5;}
  if (facets.includes('android')) {return 6;}
  return 7;
}

function collectGradleModule(root: string, rel: string, catalog: Catalog): ModuleSignals | null {
  const dir = rel ? join(root, rel) : root;
  const kts = join(dir, 'build.gradle.kts');
  const groovy = join(dir, 'build.gradle');
  const path = existsSync(kts) ? kts : existsSync(groovy) ? groovy : null;
  if (!path) {return null;}
  const content = readText(path);
  if (!content) {return null;}
  const plugins = extractGradlePlugins(content, catalog);
  const artifacts = extractGradleArtifacts(content, catalog);
  const sources = probeSources(dir);
  const hasMainClass =
    /mainClass\s*[.=]/.test(content) ||
    /mainClassName\s*=/.test(content) ||
    /Main-Class/.test(content);
  const hasApplicationPlugin =
    hasPlugin(plugins, 'application') ||
    hasPlugin(plugins, 'org.gradle.application');

  return {
    path: rel || 'build.gradle',
    plugins,
    artifacts,
    packaging: 'jar',
    parents: new Set(),
    hasMainClass,
    hasApplicationPlugin,
    sourceHints: sources.hints,
    kotlinSources: sources.kotlin || path.endsWith('.kts'),
    javaSources: sources.java,
    buildTool: 'gradle',
  };
}

function collectMavenModule(root: string, rel: string): ModuleSignals | null {
  const dir = rel ? join(root, rel) : root;
  const pomPath = join(dir, 'pom.xml');
  if (!existsSync(pomPath)) {return null;}
  const content = readText(pomPath);
  if (!content) {return null;}
  const { packaging, parents, artifacts } = extractMavenSignals(content);
  const sources = probeSources(dir);
  return {
    path: rel ? `${rel}/pom.xml` : 'pom.xml',
    plugins: new Set(),
    artifacts,
    packaging,
    parents,
    hasMainClass: /<mainClass>/.test(content),
    hasApplicationPlugin: false,
    sourceHints: sources.hints,
    kotlinSources: sources.kotlin,
    javaSources: sources.java,
    buildTool: 'maven',
  };
}

/**
 * Classify a JVM project directory (Maven and/or Gradle, multi-module aware).
 * Returns null if no JVM markers at this directory.
 */
export function detectJvmProject(dir: string): JvmProject | null {
  if (!isJvmRoot(dir)) {return null;}

  const catalog = loadCatalog(dir);
  const modules: ModuleSignals[] = [];

  // Gradle settings → includes
  let settingsBody: string | null = null;
  for (const s of ['settings.gradle.kts', 'settings.gradle']) {
    const p = join(dir, s);
    if (existsSync(p)) {
      settingsBody = readText(p);
      break;
    }
  }
  const includes = settingsBody ? parseSettingsIncludes(settingsBody) : [];

  // Root gradle module
  const rootGradle = collectGradleModule(dir, '', catalog);
  if (rootGradle) {modules.push(rootGradle);}

  for (const inc of includes) {
    const m = collectGradleModule(dir, inc, catalog);
    if (m) {modules.push(m);}
  }

  // Maven root + modules
  const rootPom = collectMavenModule(dir, '');
  if (rootPom) {
    modules.push(rootPom);
    const pomContent = readText(join(dir, 'pom.xml'));
    if (pomContent) {
      const { modules: mavMods } = extractMavenSignals(pomContent);
      for (const mm of mavMods) {
        const m = collectMavenModule(dir, mm);
        if (m) {modules.push(m);}
      }
    }
  }

  // Settings-only / empty root: still JVM if settings exist
  if (modules.length === 0 && settingsBody) {
    return {
      appType: 'library',
      framework: '',
      buildTool: 'gradle',
      mainLanguage: 'Java/Kotlin',
      facets: [],
      found: 'settings.gradle (Gradle multi-project root)',
    };
  }

  if (modules.length === 0) {return null;}

  let best: JvmProject | null = null;
  let bestRank = 999;
  for (const mod of modules) {
    const c = classifyModule(mod);
    const r = rank(c.appType, c.facets);
    if (!best || r < bestRank) {
      best = {
        appType: c.appType,
        framework: c.framework,
        buildTool: c.buildTool,
        mainLanguage: c.mainLanguage,
        facets: c.facets,
        found: c.found,
      };
      bestRank = r;
    }
  }

  // Multi-module: if root is aggregator library but a child is better, we already picked child.
  // Enrich found with multi-module note when includes > 0 and best is not root-only
  if (best && includes.length > 0 && !best.found.includes('multi-project')) {
    // leave found as module-specific signal — Glass Hood prefers the decisive signal
  }

  return best;
}
