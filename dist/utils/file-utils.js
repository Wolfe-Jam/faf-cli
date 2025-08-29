"use strict";
/**
 * 📁 File Utilities
 * Helper functions for finding and working with .faf files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFafFile = findFafFile;
exports.fileExists = fileExists;
exports.getFileModTime = getFileModTime;
exports.findPackageJson = findPackageJson;
exports.findPyprojectToml = findPyprojectToml;
exports.findRequirementsTxt = findRequirementsTxt;
exports.findTsConfig = findTsConfig;
exports.analyzeTsConfig = analyzeTsConfig;
exports.detectProjectType = detectProjectType;
exports.daysSinceModified = daysSinceModified;
exports.detectPythonProjectType = detectPythonProjectType;
exports.detectPythonPatterns = detectPythonPatterns;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const fafignore_parser_1 = require("./fafignore-parser");
/**
 * Find .faf file in current directory or parent directories
 */
async function findFafFile(startDir = process.cwd()) {
    let currentDir = path_1.default.resolve(startDir);
    // Check up to 10 parent directories to avoid infinite loops
    for (let i = 0; i < 10; i++) {
        try {
            // First, try simple fs.readdir approach
            const files = await fs_1.promises.readdir(currentDir);
            const fafFiles = files.filter((file) => file.endsWith(".faf"));
            if (fafFiles.length > 0) {
                const fafPath = path_1.default.join(currentDir, fafFiles[0]);
                // Verify file is readable
                if (await fileExists(fafPath)) {
                    return fafPath;
                }
            }
            // Move to parent directory
            const parentDir = path_1.default.dirname(currentDir);
            if (parentDir === currentDir) {
                // Reached filesystem root
                break;
            }
            currentDir = parentDir;
        }
        catch (error) {
            // Skip this directory if we can't read it
            const parentDir = path_1.default.dirname(currentDir);
            if (parentDir === currentDir) {
                break;
            }
            currentDir = parentDir;
        }
    }
    return null;
}
/**
 * Check if file exists and is readable
 */
async function fileExists(filePath) {
    try {
        await fs_1.promises.access(filePath, fs_1.promises.constants.F_OK | fs_1.promises.constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get file modification time
 */
async function getFileModTime(filePath) {
    try {
        const stats = await fs_1.promises.stat(filePath);
        return stats.mtime;
    }
    catch {
        return null;
    }
}
/**
 * Find package.json in project
 */
async function findPackageJson(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const packagePath = path_1.default.join(currentDir, "package.json");
        if (await fileExists(packagePath)) {
            return packagePath;
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    return null;
}
/**
 * Find pyproject.toml in project (Python Poetry/PEP 518)
 */
async function findPyprojectToml(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const pyprojectPath = path_1.default.join(currentDir, "pyproject.toml");
        if (await fileExists(pyprojectPath)) {
            return pyprojectPath;
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    return null;
}
/**
 * Find requirements.txt in project (Python pip)
 */
async function findRequirementsTxt(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const requirementsPath = path_1.default.join(currentDir, "requirements.txt");
        if (await fileExists(requirementsPath)) {
            return requirementsPath;
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    return null;
}
/**
 * Find tsconfig.json in project (TypeScript)
 */
async function findTsConfig(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const tsconfigPath = path_1.default.join(currentDir, "tsconfig.json");
        if (await fileExists(tsconfigPath)) {
            return tsconfigPath;
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    return null;
}
/**
 * Analyze tsconfig.json for F1-Inspired TypeScript intelligence
 */
async function analyzeTsConfig(filePath) {
    try {
        const content = await fs_1.promises.readFile(filePath, "utf-8");
        // Strip comments from JSON (tsconfig.json often has comments)
        const cleanedContent = content
            .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
            .replace(/\/\/.*$/gm, ""); // Remove // comments
        const config = JSON.parse(cleanedContent);
        const compilerOptions = config.compilerOptions || {};
        // Detect F1-Inspired engineering quality
        const strictnessLevel = calculateStrictnessLevel(compilerOptions);
        const frameworkIntegration = detectFrameworkIntegration(compilerOptions, config);
        const performanceOptimizations = detectPerformanceConfig(compilerOptions);
        return {
            target: compilerOptions.target || "ES5",
            module: compilerOptions.module || "CommonJS",
            moduleResolution: compilerOptions.moduleResolution || "node",
            strict: compilerOptions.strict || false,
            strictnessLevel,
            frameworkIntegration,
            performanceOptimizations,
            includes: config.include || [],
            excludes: config.exclude || [],
            engineeringQuality: assessEngineeringQuality(compilerOptions),
        };
    }
    catch {
        return null;
    }
}
/**
 * Detect project type from files and structure
 */
async function detectProjectType(projectDir = process.cwd()) {
    // Python detection first (Option A: Dependency-based)
    const pythonType = await detectPythonProjectType(projectDir);
    if (pythonType !== "latest-idea")
        return pythonType;
    // TypeScript detection - only check current directory for tsconfig.json
    const tsconfigPath = path_1.default.join(projectDir, "tsconfig.json");
    let hasTypeScript = false;
    if (await fileExists(tsconfigPath)) {
        hasTypeScript = true;
    }
    // JavaScript/TypeScript detection (existing logic)
    const packageJsonPath = path_1.default.join(projectDir, "package.json");
    if (await fileExists(packageJsonPath)) {
        try {
            const packageContent = await fs_1.promises.readFile(packageJsonPath, "utf-8");
            const packageData = JSON.parse(packageContent);
            // Check dependencies for framework indicators
            const deps = {
                ...packageData.dependencies,
                ...packageData.devDependencies,
            };
            // Detect TypeScript in dependencies
            if (deps.typescript ||
                deps["@types/node"] ||
                Object.keys(deps).some((dep) => dep.startsWith("@types/"))) {
                hasTypeScript = true;
            }
            // Framework detection with TypeScript awareness
            if (deps.svelte || deps["@sveltejs/kit"]) {
                return hasTypeScript ? "svelte-ts" : "svelte";
            }
            if (deps.react || deps["react-dom"]) {
                return hasTypeScript ? "react-ts" : "react";
            }
            if (deps.vue || deps["@vue/core"]) {
                return hasTypeScript ? "vue-ts" : "vue";
            }
            if (deps.angular || deps["@angular/core"])
                return "angular"; // Angular is TS by default
            if (deps.express || deps.fastify) {
                return hasTypeScript ? "node-api-ts" : "node-api";
            }
            if (deps.next || deps.nuxt) {
                return hasTypeScript ? "fullstack-ts" : "fullstack";
            }
        }
        catch {
            // Continue with file-based detection
        }
    }
    // Get ignore patterns from .fafignore
    const ignorePatterns = await (0, fafignore_parser_1.parseFafIgnore)(projectDir);
    // File-based detection
    const files = await (0, glob_1.glob)("**/*.{svelte,jsx,tsx,vue,ts,js,py}", {
        cwd: projectDir,
        ignore: ignorePatterns.filter((p) => !p.startsWith("*.")), // glob doesn't like *.ext patterns
    });
    // Python pattern detection (Option B)
    if (files.some((f) => f.endsWith(".py"))) {
        const pythonPatternType = await detectPythonPatterns(projectDir, files.filter((f) => f.endsWith(".py")));
        if (pythonPatternType !== "python-generic")
            return pythonPatternType;
        return "python-generic";
    }
    // TypeScript file detection
    if (files.some((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))) {
        hasTypeScript = true;
    }
    if (files.some((f) => f.endsWith(".svelte")))
        return hasTypeScript ? "svelte-ts" : "svelte";
    if (files.some((f) => f.endsWith(".jsx") || f.endsWith(".tsx")))
        return hasTypeScript ? "react-ts" : "react";
    if (files.some((f) => f.endsWith(".vue")))
        return hasTypeScript ? "vue-ts" : "vue";
    // Pure TypeScript project detection
    if (hasTypeScript)
        return "typescript";
    return "latest-idea";
}
/**
 * Calculate days since file was modified
 */
function daysSinceModified(date) {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Detect Python project type using dependency files (Option A)
 */
async function detectPythonProjectType(projectDir) {
    // Priority order: pyproject.toml > requirements.txt
    const pyprojectPath = await findPyprojectToml(projectDir);
    if (pyprojectPath) {
        const framework = await analyzePyprojectToml(pyprojectPath);
        if (framework)
            return framework;
    }
    const requirementsPath = await findRequirementsTxt(projectDir);
    if (requirementsPath) {
        const framework = await analyzeRequirementsTxt(requirementsPath);
        if (framework)
            return framework;
    }
    return "latest-idea";
}
/**
 * Analyze pyproject.toml for Python frameworks
 */
async function analyzePyprojectToml(filePath) {
    try {
        const content = await fs_1.promises.readFile(filePath, "utf-8");
        // Simple string-based detection for now (could use TOML parser later)
        if (content.includes("fastapi"))
            return "python-fastapi";
        if (content.includes("django"))
            return "python-django";
        if (content.includes("flask"))
            return "python-flask";
        if (content.includes("starlette"))
            return "python-starlette";
        // If it has Python dependencies but no specific framework
        if (content.includes("python = "))
            return "python-generic";
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Analyze requirements.txt for Python frameworks
 */
async function analyzeRequirementsTxt(filePath) {
    try {
        const content = await fs_1.promises.readFile(filePath, "utf-8");
        if (content.includes("fastapi"))
            return "python-fastapi";
        if (content.includes("django"))
            return "python-django";
        if (content.includes("flask"))
            return "python-flask";
        if (content.includes("starlette"))
            return "python-starlette";
        // Any Python packages detected
        if (content.trim().length > 0)
            return "python-generic";
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Detect Python frameworks using code patterns (Option B)
 */
async function detectPythonPatterns(projectDir, pythonFiles) {
    try {
        // Check main Python files first (main.py, app.py, api.py)
        const mainFiles = pythonFiles.filter((f) => f.includes("main.py") || f.includes("app.py") || f.includes("api.py"));
        const filesToCheck = mainFiles.length > 0 ? mainFiles : pythonFiles.slice(0, 5);
        for (const file of filesToCheck) {
            const filePath = path_1.default.join(projectDir, file);
            try {
                const content = await fs_1.promises.readFile(filePath, "utf-8");
                // FastAPI patterns
                if (content.includes("from fastapi import") ||
                    content.includes("FastAPI()")) {
                    return "python-fastapi";
                }
                // Django patterns
                if (content.includes("from django.") ||
                    content.includes("django.http")) {
                    return "python-django";
                }
                // Flask patterns
                if (content.includes("from flask import") ||
                    content.includes("Flask(")) {
                    return "python-flask";
                }
                // Starlette patterns
                if (content.includes("from starlette.") ||
                    content.includes("Starlette(")) {
                    return "python-starlette";
                }
            }
            catch {
                continue;
            }
        }
        return "python-generic";
    }
    catch {
        return "python-generic";
    }
}
/**
 * Calculate TypeScript strictness level for F1-Inspired quality assessment
 */
function calculateStrictnessLevel(compilerOptions) {
    let strictnessScore = 0;
    // Basic strictness
    if (compilerOptions.strict)
        strictnessScore += 2;
    if (compilerOptions.noImplicitAny)
        strictnessScore += 1;
    if (compilerOptions.strictNullChecks)
        strictnessScore += 1;
    // Advanced strictness
    if (compilerOptions.exactOptionalPropertyTypes)
        strictnessScore += 2;
    if (compilerOptions.noUncheckedIndexedAccess)
        strictnessScore += 2;
    if (compilerOptions.noImplicitReturns)
        strictnessScore += 1;
    if (compilerOptions.noFallthroughCasesInSwitch)
        strictnessScore += 1;
    if (compilerOptions.noUnusedLocals)
        strictnessScore += 1;
    if (compilerOptions.noUnusedParameters)
        strictnessScore += 1;
    // F1-Inspired ultra-strict
    if (compilerOptions.allowUnreachableCode === false)
        strictnessScore += 1;
    if (compilerOptions.allowUnusedLabels === false)
        strictnessScore += 1;
    if (compilerOptions.noPropertyAccessFromIndexSignature)
        strictnessScore += 1;
    if (compilerOptions.verbatimModuleSyntax)
        strictnessScore += 1;
    if (strictnessScore >= 12)
        return "f1_inspired";
    if (strictnessScore >= 8)
        return "ultra_strict";
    if (strictnessScore >= 4)
        return "strict";
    return "basic";
}
/**
 * Detect framework integration patterns
 */
function detectFrameworkIntegration(compilerOptions, config) {
    const includes = config.include || [];
    const includesStr = includes.join(" ");
    // Svelte detection
    if (includesStr.includes("svelte") || config.extends?.includes("svelte")) {
        if (compilerOptions.verbatimModuleSyntax)
            return "svelte_5_runes_native";
        return "svelte_native";
    }
    // React detection
    if (compilerOptions.jsx) {
        if (compilerOptions.jsx === "react-jsx")
            return "react_17_native";
        return "react_native";
    }
    // Next.js detection
    if (config.extends?.includes("next"))
        return "nextjs_native";
    // Vue detection
    if (includesStr.includes("vue"))
        return "vue_native";
    // Node.js detection
    if (compilerOptions.moduleResolution === "NodeNext")
        return "nodejs_native";
    if (compilerOptions.module === "NodeNext")
        return "nodejs_esm_native";
    // Pure TypeScript project detection
    if (compilerOptions.target &&
        compilerOptions.module &&
        !compilerOptions.jsx) {
        return "pure_typescript";
    }
    return "standard";
}
/**
 * Detect performance optimizations
 */
function detectPerformanceConfig(compilerOptions) {
    const optimizations = [];
    if (compilerOptions.target && compilerOptions.target.includes("2022")) {
        optimizations.push("modern_target_es2022");
    }
    if (compilerOptions.moduleResolution === "NodeNext") {
        optimizations.push("nodejs_native_modules");
    }
    if (compilerOptions.verbatimModuleSyntax) {
        optimizations.push("verbatim_module_syntax");
    }
    if (compilerOptions.isolatedModules) {
        optimizations.push("isolated_modules");
    }
    if (compilerOptions.skipLibCheck) {
        optimizations.push("skip_lib_check");
    }
    if (compilerOptions.allowImportingTsExtensions) {
        optimizations.push("ts_extension_imports");
    }
    return optimizations;
}
/**
 * Assess overall engineering quality based on configuration
 */
function assessEngineeringQuality(compilerOptions) {
    let qualityScore = 0;
    // Quality indicators
    if (compilerOptions.declaration)
        qualityScore += 1;
    if (compilerOptions.declarationMap)
        qualityScore += 1;
    if (compilerOptions.sourceMap)
        qualityScore += 1;
    if (compilerOptions.forceConsistentCasingInFileNames)
        qualityScore += 1;
    if (compilerOptions.removeComments === false)
        qualityScore += 1; // Keeping docs
    // F1-Inspired indicators
    if (compilerOptions.exactOptionalPropertyTypes)
        qualityScore += 2;
    if (compilerOptions.noUncheckedIndexedAccess)
        qualityScore += 2;
    if (compilerOptions.verbatimModuleSyntax)
        qualityScore += 2;
    if (qualityScore >= 8)
        return "f1_inspired";
    if (qualityScore >= 5)
        return "professional";
    return "standard";
}
//# sourceMappingURL=file-utils.js.map