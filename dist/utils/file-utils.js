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
exports.detectProjectType = detectProjectType;
exports.daysSinceModified = daysSinceModified;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
/**
 * Find .faf file in current directory or parent directories
 */
async function findFafFile(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const fafFiles = await (0, glob_1.glob)('*.faf', { cwd: currentDir });
        if (fafFiles.length > 0) {
            return path_1.default.join(currentDir, fafFiles[0]);
        }
        currentDir = path_1.default.dirname(currentDir);
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
        const packagePath = path_1.default.join(currentDir, 'package.json');
        if (await fileExists(packagePath)) {
            return packagePath;
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    return null;
}
/**
 * Detect project type from files and structure
 */
async function detectProjectType(projectDir = process.cwd()) {
    const packageJsonPath = await findPackageJson(projectDir);
    if (packageJsonPath) {
        try {
            const packageContent = await fs_1.promises.readFile(packageJsonPath, 'utf-8');
            const packageData = JSON.parse(packageContent);
            // Check dependencies for framework indicators
            const deps = { ...packageData.dependencies, ...packageData.devDependencies };
            if (deps.svelte || deps['@sveltejs/kit'])
                return 'svelte';
            if (deps.react || deps['react-dom'])
                return 'react';
            if (deps.vue || deps['@vue/core'])
                return 'vue';
            if (deps.angular || deps['@angular/core'])
                return 'angular';
            if (deps.express || deps.fastify)
                return 'node-api';
            if (deps.next || deps.nuxt)
                return 'fullstack';
        }
        catch {
            // Continue with file-based detection
        }
    }
    // File-based detection
    const files = await (0, glob_1.glob)('**/*.{svelte,jsx,tsx,vue,ts,js}', {
        cwd: projectDir,
        ignore: ['node_modules/**', 'dist/**', 'build/**']
    });
    if (files.some(f => f.endsWith('.svelte')))
        return 'svelte';
    if (files.some(f => f.endsWith('.jsx') || f.endsWith('.tsx')))
        return 'react';
    if (files.some(f => f.endsWith('.vue')))
        return 'vue';
    return 'generic';
}
/**
 * Calculate days since file was modified
 */
function daysSinceModified(date) {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
//# sourceMappingURL=file-utils.js.map