"use strict";
/**
 * 🔄 faf sync - Sync Command
 * Sync .faf file with project changes (package.json, git, etc.)
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncFafFile = syncFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
async function syncFafFile(file, options = {}) {
    try {
        const fafPath = file || await (0, file_utils_1.findFafFile)();
        if (!fafPath) {
            console.log(chalk_1.default.red('❌ No .faf file found'));
            console.log(chalk_1.default.yellow('💡 Run "faf init" to create one'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🔄 Syncing: ${fafPath}`));
        // Read current .faf file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = YAML.parse(content);
        // Detect changes
        const changes = await detectProjectChanges(fafData);
        if (changes.length === 0) {
            console.log(chalk_1.default.green('✅ .faf file is up to date'));
            return;
        }
        // Show detected changes
        console.log(chalk_1.default.yellow(`⚡ Found ${changes.length} potential updates:`));
        changes.forEach((change, index) => {
            console.log(chalk_1.default.yellow(`   ${index + 1}. ${change.description}`));
            if (change.oldValue !== change.newValue) {
                console.log(chalk_1.default.gray(`      ${change.oldValue} → ${change.newValue}`));
            }
        });
        if (options.dryRun) {
            console.log(chalk_1.default.blue('\n🔍 Dry run complete - no changes applied'));
            return;
        }
        // Apply changes
        if (options.auto) {
            console.log(chalk_1.default.blue('\n🤖 Auto-applying changes...'));
            applyChanges(fafData, changes);
        }
        else {
            // Interactive mode (simplified for now)
            console.log(chalk_1.default.yellow('\n💡 Run with --auto to apply changes automatically'));
            console.log(chalk_1.default.yellow('   Or edit .faf file manually'));
            return;
        }
        // Update generated timestamp
        fafData.generated = new Date().toISOString();
        // Write updated .faf file
        const updatedContent = YAML.stringify(fafData);
        await fs_1.promises.writeFile(fafPath, updatedContent, 'utf-8');
        console.log(chalk_1.default.green('✅ .faf file synced successfully'));
        console.log(chalk_1.default.gray(`   Applied ${changes.length} changes`));
    }
    catch (error) {
        console.log(chalk_1.default.red('💥 Sync failed:'));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
async function detectProjectChanges(fafData) {
    const changes = [];
    try {
        // Check package.json changes
        const packageJsonPath = await (0, file_utils_1.findPackageJson)();
        if (packageJsonPath) {
            const packageContent = await fs_1.promises.readFile(packageJsonPath, 'utf-8');
            const packageData = JSON.parse(packageContent);
            // Project name change
            if (packageData.name && packageData.name !== fafData.project?.name) {
                changes.push({
                    path: 'project.name',
                    description: 'Project name changed in package.json',
                    oldValue: fafData.project?.name || 'undefined',
                    newValue: packageData.name,
                    confidence: 'high'
                });
            }
            // Description/goal change
            if (packageData.description && packageData.description !== fafData.project?.goal) {
                changes.push({
                    path: 'project.goal',
                    description: 'Project description changed in package.json',
                    oldValue: fafData.project?.goal || 'undefined',
                    newValue: packageData.description,
                    confidence: 'medium'
                });
            }
            // Version change
            if (packageData.version && packageData.version !== fafData.state?.version) {
                changes.push({
                    path: 'state.version',
                    description: 'Project version updated',
                    oldValue: fafData.state?.version || 'undefined',
                    newValue: packageData.version,
                    confidence: 'high'
                });
            }
            // Dependencies changes (simplified detection)
            const deps = { ...packageData.dependencies, ...packageData.devDependencies };
            // Check for major framework changes
            const currentFrontend = fafData.stack?.frontend?.toLowerCase() || '';
            if (deps.svelte && !currentFrontend.includes('svelte')) {
                changes.push({
                    path: 'stack.frontend',
                    description: 'Svelte dependency detected',
                    oldValue: fafData.stack?.frontend || 'None',
                    newValue: 'Svelte',
                    confidence: 'high'
                });
            }
            if (deps.react && !currentFrontend.includes('react')) {
                changes.push({
                    path: 'stack.frontend',
                    description: 'React dependency detected',
                    oldValue: fafData.stack?.frontend || 'None',
                    newValue: 'React',
                    confidence: 'high'
                });
            }
        }
        // Check if generated timestamp is very old (30+ days)
        if (fafData.generated) {
            const generatedDate = new Date(fafData.generated);
            const daysSince = Math.abs(Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 30) {
                changes.push({
                    path: 'generated',
                    description: `Generated timestamp is ${Math.round(daysSince)} days old`,
                    oldValue: fafData.generated,
                    newValue: new Date().toISOString(),
                    confidence: 'high'
                });
            }
        }
    }
    catch (error) {
        // Continue with what we have
    }
    return changes;
}
function applyChanges(fafData, changes) {
    changes.forEach(change => {
        if (change.confidence === 'high' || change.confidence === 'medium') {
            setNestedValue(fafData, change.path, change.newValue);
        }
    });
}
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    for (const key of keys) {
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[lastKey] = value;
}
//# sourceMappingURL=sync.js.map