"use strict";
/**
 * 🔧 faf lint - Lint Command
 * Format compliance and style checking for .faf files
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
exports.lintFafFile = lintFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
const faf_schema_1 = require("../schema/faf-schema");
async function lintFafFile(file, options = {}) {
    try {
        const fafPath = file || await (0, file_utils_1.findFafFile)();
        if (!fafPath) {
            console.log(chalk_1.default.red('❌ No .faf file found'));
            console.log(chalk_1.default.yellow('💡 Run "faf init" to create one'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🔧 Linting: ${fafPath}`));
        // Read .faf file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        // Parse and analyze
        let fafData;
        const issues = [];
        try {
            fafData = YAML.parse(content);
        }
        catch (parseError) {
            issues.push({
                type: 'error',
                message: `YAML parsing error: ${parseError}`,
                fixable: false
            });
            console.log(chalk_1.default.red('❌ Failed to parse .faf file'));
            console.log(chalk_1.default.red(parseError instanceof Error ? parseError.message : String(parseError)));
            process.exit(1);
        }
        // Run schema validation first
        const validation = (0, faf_schema_1.validateSchema)(fafData, options.schemaVersion);
        // Convert validation results to lint issues
        validation.errors.forEach(error => {
            issues.push({
                type: 'error',
                message: error.message,
                fixable: false
            });
        });
        validation.warnings.forEach(warning => {
            issues.push({
                type: 'warning',
                message: warning.message,
                fixable: false
            });
        });
        // Additional lint checks
        performFormatLinting(fafData, content, issues);
        performStyleLinting(fafData, issues);
        performBestPracticeLinting(fafData, issues);
        // Display results
        const errors = issues.filter(i => i.type === 'error');
        const warnings = issues.filter(i => i.type === 'warning');
        const info = issues.filter(i => i.type === 'info');
        const fixableIssues = issues.filter(i => i.fixable);
        if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
            console.log(chalk_1.default.green('✅ No linting issues found'));
            return;
        }
        // Show issues by type
        if (errors.length > 0) {
            console.log(chalk_1.default.red(`\n❌ ${errors.length} Error(s):`));
            errors.forEach((error, index) => {
                console.log(chalk_1.default.red(`   ${index + 1}. ${error.message}`));
            });
        }
        if (warnings.length > 0) {
            console.log(chalk_1.default.yellow(`\n⚠️  ${warnings.length} Warning(s):`));
            warnings.forEach((warning, index) => {
                console.log(chalk_1.default.yellow(`   ${index + 1}. ${warning.message}`));
            });
        }
        if (info.length > 0) {
            console.log(chalk_1.default.blue(`\n💡 ${info.length} Suggestion(s):`));
            info.forEach((suggestion, index) => {
                console.log(chalk_1.default.blue(`   ${index + 1}. ${suggestion.message}`));
            });
        }
        // Auto-fix if requested
        if (options.fix && fixableIssues.length > 0) {
            console.log(chalk_1.default.blue(`\n🔧 Auto-fixing ${fixableIssues.length} issue(s)...`));
            fixableIssues.forEach(issue => {
                if (issue.fix) {
                    issue.fix();
                }
            });
            // Write fixed content
            const fixedContent = YAML.stringify(fafData, { lineWidth: 100 });
            await fs_1.promises.writeFile(fafPath, fixedContent, 'utf-8');
            console.log(chalk_1.default.green('✅ Auto-fixes applied'));
        }
        else if (fixableIssues.length > 0) {
            console.log(chalk_1.default.yellow(`\n💡 ${fixableIssues.length} issue(s) can be auto-fixed with --fix`));
        }
        // Exit with error code if there are errors
        if (errors.length > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('💥 Linting failed:'));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
function performFormatLinting(fafData, content, issues) {
    // Check YAML formatting
    try {
        const normalizedYaml = YAML.stringify(fafData, { lineWidth: 100 });
        const currentLines = content.split('\n').map(line => line.trimEnd());
        const normalizedLines = normalizedYaml.split('\n').map(line => line.trimEnd());
        if (currentLines.length !== normalizedLines.length) {
            issues.push({
                type: 'info',
                message: 'YAML formatting could be improved',
                fixable: true,
                fix: () => {
                    // Fix will be applied in the main function
                }
            });
        }
    }
    catch {
        // Skip formatting check if there are parsing issues
    }
    // Check for trailing whitespace
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.length > 0 && line !== line.trimEnd()) {
            issues.push({
                type: 'warning',
                message: `Trailing whitespace on line ${index + 1}`,
                line: index + 1,
                fixable: true
            });
        }
    });
}
function performStyleLinting(fafData, issues) {
    // Check for consistent naming
    if (fafData.project?.name && fafData.project.name.includes('_')) {
        issues.push({
            type: 'info',
            message: 'Project name contains underscores - consider kebab-case',
            fixable: false
        });
    }
    // Check score consistency
    if (fafData.scores) {
        const fafScore = fafData.scores.faf_score;
        const slotPercentage = fafData.scores.slot_based_percentage;
        if (typeof fafScore === 'number' && typeof slotPercentage === 'number') {
            const expectedSlots = Math.round((fafScore / 100) * 21);
            if (Math.abs(slotPercentage - expectedSlots) > 2) {
                issues.push({
                    type: 'warning',
                    message: 'Slot-based percentage may be inconsistent with faf_score',
                    fixable: false
                });
            }
        }
    }
}
function performBestPracticeLinting(fafData, issues) {
    // Check for AI instructions
    if (!fafData.ai_instructions || !fafData.ai_instructions.message) {
        issues.push({
            type: 'info',
            message: 'Consider adding ai_instructions section for better AI context',
            fixable: false
        });
    }
    // Check for human context
    if (!fafData.human_context) {
        issues.push({
            type: 'info',
            message: 'Consider adding human_context section (who/what/why/where/when/how)',
            fixable: false
        });
    }
    // Check timestamp freshness
    if (fafData.generated) {
        try {
            const generated = new Date(fafData.generated);
            const daysSince = (Date.now() - generated.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 30) {
                issues.push({
                    type: 'warning',
                    message: `Generated timestamp is ${Math.round(daysSince)} days old - consider updating`,
                    fixable: true,
                    fix: () => {
                        fafData.generated = new Date().toISOString();
                    }
                });
            }
        }
        catch {
            issues.push({
                type: 'warning',
                message: 'Invalid generated timestamp format',
                fixable: true,
                fix: () => {
                    fafData.generated = new Date().toISOString();
                }
            });
        }
    }
    // Check for empty sections
    Object.entries(fafData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
            issues.push({
                type: 'warning',
                message: `Empty section detected: ${key}`,
                fixable: false
            });
        }
    });
}
//# sourceMappingURL=lint.js.map