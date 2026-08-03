import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import spec from './swift-detection.json';

/**
 * Swift detection — CONTENT-AWARE Package.swift / Xcode classification.
 *
 * Kill line: Package.swift alone ≠ app.
 * SPM backs libraries, executables (CLI), server apps (Vapor / Hummingbird),
 * MCP servers (official swift-sdk product MCP), and Xcode client apps.
 * Static token scan only — never execute Package.swift / swift build.
 *
 * Same composition as go.ts / ruby.ts: knowledge in swift-detection.json.
 */

export type SwiftAppType = 'mcp' | 'backend' | 'cli' | 'app' | 'library';

export interface SwiftProject {
  appType: SwiftAppType;
  /** Primary framework label (Vapor / Hummingbird / MCP / ArgumentParser / …) or ''. */
  framework: string;
  /** spm when Package.swift; xcode when only xcodeproj; both when combined. */
  packageManager: 'spm' | 'xcode' | 'spm+xcode';
  /** Glass Hood rationale for .faf `# found:`. */
  found: string;
}

const MCP_URLS = (spec.mcpPackageUrls as string[]).map(u => u.toLowerCase());
const MCP_PRODUCTS = (spec.mcpProducts as string[]).map(p => p.toLowerCase());
const SERVER_URLS = (spec.serverPackageUrls as Array<[string, string]>).map(
  ([u, label]) => [u.toLowerCase(), label] as [string, string],
);
const SERVER_PRODUCTS = (spec.serverProducts as Array<[string, string]>).map(
  ([p, label]) => [p.toLowerCase(), label] as [string, string],
);
const CLI_URLS = (spec.cliPackageUrls as Array<[string, string]>).map(
  ([u, label]) => [u.toLowerCase(), label] as [string, string],
);
const CLI_PRODUCTS = (spec.cliProducts as Array<[string, string]>).map(
  ([p, label]) => [p.toLowerCase(), label] as [string, string],
);
const APP_PRODUCT_TYPES = spec.appProductTypes as string[];
const CLI_PRODUCT_TYPES = spec.cliProductTypes as string[];
const VAPOR_LAYOUT = spec.vaporLayoutFiles as string[];

export interface PackageSwiftSignals {
  packageUrls: string[];
  productNames: string[]; // .product(name: "X")
  hasLibraryProduct: boolean;
  hasExecutableProduct: boolean;
  hasPluginProduct: boolean;
  hasExecutableTarget: boolean;
  hasLibraryTarget: boolean;
}

/** True if directory looks like a Swift project root. */
export function isSwiftRoot(dir: string): boolean {
  return existsSync(join(dir, 'Package.swift')) || listXcodeprojs(dir).length > 0;
}

/** Root-level *.xcodeproj directory names. */
export function listXcodeprojs(dir: string): string[] {
  try {
    return readdirSync(dir).filter(f => {
      if (!f.endsWith('.xcodeproj')) {return false;}
      try {
        return statSync(join(dir, f)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Static scan of Package.swift — does NOT compile or evaluate Swift.
 * Strips line and block comments best-effort before token extraction.
 */
export function parsePackageSwift(content: string): PackageSwiftSignals {
  const stripped = stripSwiftComments(content);
  const lower = stripped.toLowerCase();

  const packageUrls: string[] = [];
  // .package(url: "…") or .package(url: "…", from: …)
  const urlRe = /\.package\s*\(\s*url\s*:\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(stripped)) !== null) {
    packageUrls.push(m[1]);
  }
  // Alternate: .package(url: "…") with single quotes (rare)
  const urlRe2 = /\.package\s*\(\s*url\s*:\s*'([^']+)'/gi;
  while ((m = urlRe2.exec(stripped)) !== null) {
    packageUrls.push(m[1]);
  }

  const productNames: string[] = [];
  // .product(name: "Vapor", package: "vapor")
  const prodRe = /\.product\s*\(\s*name\s*:\s*"([^"]+)"/gi;
  while ((m = prodRe.exec(stripped)) !== null) {
    productNames.push(m[1]);
  }
  const prodRe2 = /\.product\s*\(\s*name\s*:\s*'([^']+)'/gi;
  while ((m = prodRe2.exec(stripped)) !== null) {
    productNames.push(m[1]);
  }

  // Product kinds in products: [ … ]
  // .library(name: …)  .executable(name: …)  .plugin(
  const hasLibraryProduct = /\.library\s*\(/.test(lower);
  const hasExecutableProduct = /\.executable\s*\(/.test(lower);
  // Avoid matching .plugin( on targets if we can — products use Product.plugin / .plugin(
  // Both product and target use .plugin( — still a useful signal when no library/exe.
  const hasPluginProduct = /\.plugin\s*\(/.test(lower) && !hasLibraryProduct && !hasExecutableProduct
    ? true
    : /\bproducts\s*:\s*\[[\s\S]*?\.plugin\s*\(/.test(lower);

  const hasExecutableTarget = /\.executabletarget\s*\(/.test(lower);
  // Plain .target( — executableTarget/testTarget use different selectors
  const hasLibraryTarget = /\.target\s*\(/.test(lower) && !hasExecutableTarget
    ? true
    : (lower.match(/\.target\s*\(/g) || []).length >
      (lower.match(/\.executabletarget\s*\(/g) || []).length +
        (lower.match(/\.testtarget\s*\(/g) || []).length;
  return {
    packageUrls,
    productNames,
    hasLibraryProduct,
    hasExecutableProduct,
    hasPluginProduct: !!hasPluginProduct,
    hasExecutableTarget,
    hasLibraryTarget,
  };
}

/** Best-effort strip of line (//) and block comments for static scan. */
export function stripSwiftComments(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    // string literal — preserve contents so URLs inside stay intact
    if (src[i] === '"' || src[i] === "'") {
      const q = src[i];
      out += q;
      i++;
      while (i < src.length) {
        if (src[i] === '\\' && i + 1 < src.length) {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < src.length && src[i] !== '\n') {i++;}
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {i++;}
      i += 2;
      continue;
    }
    out += src[i];
    i++;
  }
  return out;
}

function urlHits(urls: string[], needles: string[]): string | undefined {
  const lowerUrls = urls.map(u => u.toLowerCase());
  let best: string | undefined;
  for (const n of needles) {
    for (const u of lowerUrls) {
      if (u.includes(n) && (!best || n.length > best.length)) {best = n;}
    }
  }
  return best;
}

function urlHitsLabeled(
  urls: string[],
  entries: Array<[string, string]>,
): [string, string] | undefined {
  const lowerUrls = urls.map(u => u.toLowerCase());
  let best: [string, string] | undefined;
  for (const [needle, label] of entries) {
    for (const u of lowerUrls) {
      if (u.includes(needle) && (!best || needle.length > best[0].length)) {
        best = [needle, label];
      }
    }
  }
  return best;
}

function productHitsLabeled(
  products: string[],
  entries: Array<[string, string]>,
): [string, string] | undefined {
  const lower = products.map(p => p.toLowerCase());
  let best: [string, string] | undefined;
  for (const [name, label] of entries) {
    if (lower.includes(name) && (!best || name.length > best[0].length)) {
      best = [name, label];
    }
  }
  return best;
}

function mcpProductHit(products: string[]): boolean {
  const lower = products.map(p => p.toLowerCase());
  return MCP_PRODUCTS.some(p => lower.includes(p));
}

/**
 * Light pbxproj grep — no AST. Reads project.pbxproj under each .xcodeproj.
 */
export function scanXcodeProductTypes(dir: string): {
  hasApplication: boolean;
  hasTool: boolean;
  hit?: string;
} {
  let hasApplication = false;
  let hasTool = false;
  let hit: string | undefined;
  for (const xp of listXcodeprojs(dir)) {
    const pbx = join(dir, xp, 'project.pbxproj');
    const body = readText(pbx);
    if (!body) {continue;}
    for (const t of APP_PRODUCT_TYPES) {
      if (body.includes(t)) {
        hasApplication = true;
        hit = t;
      }
    }
    for (const t of CLI_PRODUCT_TYPES) {
      if (body.includes(t)) {
        hasTool = true;
        if (!hit) {hit = t;}
      }
    }
  }
  return { hasApplication, hasTool, hit };
}

function vaporLayoutHit(dir: string): string | undefined {
  for (const rel of VAPOR_LAYOUT) {
    if (existsSync(join(dir, rel))) {return rel;}
  }
  return undefined;
}

/**
 * Classify a Swift project from Package.swift (+ light Xcode).
 * Returns null if not a Swift root.
 */
export function detectSwiftProject(dir: string): SwiftProject | null {
  if (!isSwiftRoot(dir)) {return null;}

  const pkgPath = join(dir, 'Package.swift');
  const hasPkg = existsSync(pkgPath);
  const xcodeprojs = listXcodeprojs(dir);
  const hasXcode = xcodeprojs.length > 0;

  let signals: PackageSwiftSignals | null = null;
  if (hasPkg) {
    const body = readText(pkgPath);
    if (body) {signals = parsePackageSwift(body);}
  }

  const xcode = hasXcode ? scanXcodeProductTypes(dir) : { hasApplication: false, hasTool: false };
  const layout = vaporLayoutHit(dir);

  const urls = signals?.packageUrls ?? [];
  const products = signals?.productNames ?? [];

  const mcpUrl = urlHits(urls, MCP_URLS);
  const mcpProd = mcpProductHit(products);
  const serverUrl = urlHitsLabeled(urls, SERVER_URLS);
  const serverProd = productHitsLabeled(products, SERVER_PRODUCTS);
  const cliUrl = urlHitsLabeled(urls, CLI_URLS);
  const cliProd = productHitsLabeled(products, CLI_PRODUCTS);

  const isMcp = !!(mcpUrl || mcpProd);
  const isServer = !!(serverUrl || serverProd || layout);
  const isExecutable =
    !!(signals?.hasExecutableProduct || signals?.hasExecutableTarget);
  const isCliStack = !!(cliUrl || cliProd);
  const isApp = xcode.hasApplication;

  const packageManager: SwiftProject['packageManager'] =
    hasPkg && hasXcode ? 'spm+xcode' : hasPkg ? 'spm' : 'xcode';

  let appType: SwiftAppType;
  let framework = '';
  let found: string;

  // Priority: mcp > backend > app > cli > library
  if (isMcp) {
    appType = 'mcp';
    framework = 'MCP';
    if (mcpProd) {
      found = 'Package.swift + product MCP (Swift MCP)';
    } else {
      found = `Package.swift + ${mcpUrl} (Swift MCP)`;
    }
  } else if (isServer) {
    appType = 'backend';
    framework = serverProd?.[1] || serverUrl?.[1] || (layout ? 'Vapor' : '');
    if (serverProd) {
      found = `Package.swift + product ${serverProd[1]} (Swift backend)`;
    } else if (serverUrl) {
      found = `Package.swift + ${serverUrl[1]} (Swift backend)`;
    } else {
      found = `${layout} (Swift backend layout)`;
    }
  } else if (isApp) {
    appType = 'app';
    framework = '';
    found = `${xcodeprojs[0]} + ${xcode.hit || 'application'} (Swift app)`;
  } else if (isCliStack || (isExecutable && !isServer && !isMcp)) {
    appType = 'cli';
    framework = cliProd?.[1] || cliUrl?.[1] || '';
    if (cliProd) {
      found = `Package.swift + product ${cliProd[1]} (Swift CLI)`;
    } else if (cliUrl) {
      found = `Package.swift + ${cliUrl[1]} (Swift CLI)`;
    } else if (signals?.hasExecutableProduct) {
      found = 'Package.swift + .executable product (Swift CLI)';
    } else {
      found = 'Package.swift + .executableTarget (Swift CLI)';
    }
  } else if (xcode.hasTool && !hasPkg) {
    appType = 'cli';
    found = `${xcodeprojs[0]} + tool productType (Swift CLI)`;
  } else if (hasPkg) {
    appType = 'library';
    if (signals?.hasLibraryProduct) {
      found = 'Package.swift + .library product (Swift library)';
    } else {
      found = 'Package.swift (Swift library)';
    }
  } else {
    // xcodeproj without application/tool productType — weak library/app unknown
    appType = 'library';
    found = `${xcodeprojs[0] || 'xcodeproj'} (Swift — no classifying productType)`;
  }

  return { appType, framework, packageManager, found };
}
