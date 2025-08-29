"use strict";
/**
 * 🏗️ .faf Generator
 * Auto-generate .faf files from project structure and package.json
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFafFromProject = generateFafFromProject;
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
async function generateFafFromProject(options) {
    const { projectType, projectRoot } = options;
    // Read package.json if available
    const packageJsonPath = await (0, file_utils_1.findPackageJson)(projectRoot);
    let packageData = {};
    if (packageJsonPath) {
        try {
            const content = await fs_1.promises.readFile(packageJsonPath, 'utf-8');
            packageData = JSON.parse(content);
        }
        catch {
            // Continue without package.json data
        }
    }
    // Generate .faf structure
    const fafData = generateFafStructure(packageData, projectType || 'generic', projectRoot);
    // Convert to YAML
    return YAML.stringify(fafData);
}
function generateFafStructure(packageData, projectType, projectRoot) {
    const now = new Date().toISOString();
    const projectName = packageData.name || 'untitled-project';
    const version = packageData.version || '1.0.0';
    // Detect stack from package.json
    const deps = { ...packageData.dependencies, ...packageData.devDependencies };
    const stack = analyzeStackFromDependencies(deps, projectType);
    // Calculate initial score (basic detection gives ~40-60%)
    const initialScore = calculateInitialScore(packageData, stack, projectType);
    return {
        faf_version: '2.4.0',
        generated: now,
        // 🎯 Project Core
        project: {
            name: projectName,
            goal: packageData.description || 'Project development and deployment',
            main_language: detectMainLanguage(deps, projectType),
            faf_score: initialScore,
            importance: 'MORE_IMPORTANT_THAN_PACKAGE_JSON'
        },
        // 📢 AI INSTRUCTION SECTION - CRITICAL
        ai_instructions: {
            priority: 'CRITICAL',
            usage: 'READ_THIS_FIRST',
            message: `🧠 ATTENTION AI: This .faf file contains the complete DNA of this project.
It provides instant context that would take 20+ minutes to gather manually.

PRIORITY ORDER:
1. Read THIS .faf file first (complete project intelligence)
2. Read CLAUDE.md if exists (detailed session context)
3. Then package.json, config files, etc. (implementation details)

This .faf tells you:
- What we're building (goal)
- How we like to work (preferences)  
- Our quality standards (scores)
- Current focus (state)
- Tech stack (stack)

VALUE: This single file replaces 20+ questions and provides
perfect context for immediate productivity.`
        },
        // 🏗️ Technical Stack
        stack,
        // 📊 Scoring System
        scores: {
            slot_based_percentage: Math.round((initialScore / 100) * 21), // Slots filled
            faf_score: initialScore,
            total_slots: 21,
            scoring_philosophy: 'Honest percentage based on filled context slots - no fake minimums'
        },
        // 🧠 AI Intelligence
        ai: {
            context_file: 'CLAUDE.md',
            handoff_ready: true,
            session_continuity: 'medium',
            onboarding_time: '60_seconds'
        },
        // 📚 Knowledge Sync
        docs: {
            claude_sync: false,
            sync_frequency: 'weekly',
            last_updated: now
        },
        // ⚙️ Working Preferences (defaults - should be customized)
        preferences: {
            quality_bar: 'production_ready',
            commit_style: 'conventional',
            communication: 'concise',
            verbosity: 'minimal'
        },
        // 🚀 Current State
        state: {
            phase: 'development',
            version: version,
            focus: 'initial_setup',
            status: 'active'
        },
        // 🏷️ Tags System
        tags: {
            auto_generated: generateAutoTags(packageData, projectType),
            smart_defaults: generateSmartDefaults(projectType),
            user_defined: []
        }
    };
}
function analyzeStackFromDependencies(deps, projectType) {
    const stack = {
        package_manager: 'npm'
    };
    // Frontend Detection
    if (deps.svelte || deps['@sveltejs/kit']) {
        stack.frontend = 'Svelte 5';
        stack.build = 'Vite';
    }
    else if (deps.react) {
        stack.frontend = 'React';
        stack.build = deps.vite ? 'Vite' : 'Webpack';
    }
    else if (deps.vue) {
        stack.frontend = 'Vue';
        stack.build = 'Vite';
    }
    else if (deps.angular) {
        stack.frontend = 'Angular';
        stack.build = 'Angular CLI';
    }
    // CSS Framework Detection
    if (deps.tailwindcss)
        stack.css_framework = 'Tailwind CSS';
    else if (deps.bootstrap)
        stack.css_framework = 'Bootstrap';
    else if (deps['@emotion/react'])
        stack.css_framework = 'Emotion';
    else if (deps['styled-components'])
        stack.css_framework = 'Styled Components';
    // Backend Detection
    if (deps.express)
        stack.backend = 'Express.js';
    else if (deps.fastify)
        stack.backend = 'Fastify';
    else if (deps['@nestjs/core'])
        stack.backend = 'NestJS';
    else if (projectType === 'node-api')
        stack.backend = 'Node.js';
    // Runtime Detection
    if (deps['@types/node'] || projectType.includes('node')) {
        stack.runtime = 'Node.js';
    }
    if (deps['@types/bun'])
        stack.runtime = 'Bun';
    if (deps.deno)
        stack.runtime = 'Deno';
    // Build Tool Detection
    if (deps.vite)
        stack.build = 'Vite';
    else if (deps.webpack)
        stack.build = 'Webpack';
    else if (deps.rollup)
        stack.build = 'Rollup';
    else if (deps.esbuild)
        stack.build = 'esbuild';
    return stack;
}
function detectMainLanguage(deps, projectType) {
    if (deps.typescript || deps['@types/node'])
        return 'TypeScript';
    if (projectType.includes('js') || Object.keys(deps).length > 0)
        return 'JavaScript';
    return 'Unknown';
}
function calculateInitialScore(packageData, stack, projectType) {
    let score = 30; // Base score for having a project
    // Package.json completeness
    if (packageData.description)
        score += 5;
    if (packageData.author)
        score += 3;
    if (packageData.license)
        score += 2;
    if (packageData.repository)
        score += 3;
    if (packageData.scripts)
        score += 5;
    // Stack completeness
    const stackKeys = Object.keys(stack);
    score += Math.min(stackKeys.length * 3, 18); // Max 18 points for stack
    // Project type bonus
    if (projectType !== 'generic')
        score += 5;
    return Math.min(score, 65); // Cap at 65% - human input needed for higher scores
}
function generateAutoTags(packageData, projectType) {
    const tags = new Set();
    // From project name
    if (packageData.name) {
        const cleanName = packageData.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);
        if (cleanName)
            tags.add(cleanName);
    }
    // From project type
    if (projectType !== 'generic') {
        tags.add(projectType.toLowerCase().replace(/\s+/g, '-'));
    }
    // From description keywords
    if (packageData.description) {
        const keywords = packageData.description.toLowerCase()
            .match(/\b(api|library|framework|component|dashboard|tool|app|cli|server|client|web|mobile)\b/gi);
        if (keywords) {
            keywords.slice(0, 3).forEach((keyword) => tags.add(keyword.toLowerCase()));
        }
    }
    return Array.from(tags).slice(0, 10);
}
function generateSmartDefaults(projectType) {
    const year = new Date().getFullYear().toString();
    const defaults = ['.faf', 'ai-ready', year];
    // Project type specific
    if (projectType.includes('web') || projectType === 'svelte' || projectType === 'react') {
        defaults.push('web-app');
    }
    else if (projectType.includes('api') || projectType.includes('node')) {
        defaults.push('backend-api');
    }
    else {
        defaults.push('software');
    }
    defaults.push('open-source'); // Default assumption
    return defaults;
}
//# sourceMappingURL=faf-generator.js.map