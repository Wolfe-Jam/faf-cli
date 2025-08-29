"use strict";
/**
 * 🚫 .fafignore Parser
 * Handles exclusion patterns for .faf file generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFafIgnore = parseFafIgnore;
exports.shouldIgnore = shouldIgnore;
exports.createDefaultFafIgnore = createDefaultFafIgnore;
exports.getFileSizeLimit = getFileSizeLimit;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const file_utils_1 = require("./file-utils");
/**
 * Default patterns to always exclude
 * These are common directories/files that shouldn't be in AI context
 */
const DEFAULT_IGNORE_PATTERNS = [
    // JavaScript/Node
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    ".next/",
    ".nuxt/",
    "out/",
    // Python
    "__pycache__/",
    "*.pyc",
    ".venv/",
    "venv/",
    ".pytest_cache/",
    ".mypy_cache/",
    // Version Control
    ".git/",
    ".svn/",
    ".hg/",
    // IDE/Editor
    ".vscode/",
    ".idea/",
    "*.swp",
    ".DS_Store",
    // Sensitive files
    ".env",
    ".env.*",
    "*.key",
    "*.pem",
    "*.cert",
    // Logs and temp
    "*.log",
    "logs/",
    "tmp/",
    "temp/",
    // Package files
    "*.tgz",
    "*.tar.gz",
    "*.zip",
    // Media files (usually not needed for code context)
    "*.jpg",
    "*.jpeg",
    "*.png",
    "*.gif",
    "*.mp4",
    "*.mov",
    "*.avi",
];
/**
 * Parse .fafignore file and return patterns
 */
async function parseFafIgnore(projectRoot) {
    const fafIgnorePath = path_1.default.join(projectRoot, ".fafignore");
    // Start with default patterns
    let patterns = [...DEFAULT_IGNORE_PATTERNS];
    // Check if .fafignore exists
    if (await (0, file_utils_1.fileExists)(fafIgnorePath)) {
        try {
            const content = await fs_1.promises.readFile(fafIgnorePath, "utf-8");
            const userPatterns = content
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith("#")); // Remove empty lines and comments
            // Add user patterns
            patterns = [...patterns, ...userPatterns];
        }
        catch (error) {
            console.warn("Warning: Could not read .fafignore file");
        }
    }
    // Remove duplicates
    return [...new Set(patterns)];
}
/**
 * Check if a file path should be ignored
 */
function shouldIgnore(filePath, patterns) {
    const normalizedPath = filePath.replace(/\\/g, "/");
    for (const pattern of patterns) {
        // Handle directory patterns (ending with /)
        if (pattern.endsWith("/")) {
            const dir = pattern.slice(0, -1);
            if (normalizedPath.includes(`/${dir}/`) ||
                normalizedPath.startsWith(`${dir}/`)) {
                return true;
            }
        }
        // Handle file extension patterns (*.ext)
        if (pattern.startsWith("*.")) {
            const ext = pattern.slice(1);
            if (normalizedPath.endsWith(ext)) {
                return true;
            }
        }
        // Handle exact matches
        if (normalizedPath.includes(pattern) || normalizedPath.endsWith(pattern)) {
            return true;
        }
    }
    return false;
}
/**
 * Create a default .fafignore file with helpful comments
 */
async function createDefaultFafIgnore(projectRoot) {
    const fafIgnorePath = path_1.default.join(projectRoot, ".fafignore");
    const content = `# .fafignore - Exclude files/directories from .faf context
# Similar to .gitignore syntax
# Lines starting with # are comments

# Dependencies and build outputs
node_modules/
dist/
build/
coverage/

# Python environments
__pycache__/
venv/
.venv/

# IDE and system files
.vscode/
.idea/
.DS_Store

# Sensitive files
.env
.env.*
*.key
*.pem

# Logs and temporary files
*.log
logs/
tmp/
temp/

# Large media files
*.jpg
*.png
*.mp4
*.pdf

# Custom exclusions (add your own below)
# example: my-large-data-folder/
# example: *.generated.ts
`;
    await fs_1.promises.writeFile(fafIgnorePath, content, "utf-8");
}
/**
 * Get file size limit for inclusion (default 1MB)
 */
function getFileSizeLimit() {
    return 1024 * 1024; // 1MB
}
//# sourceMappingURL=fafignore-parser.js.map