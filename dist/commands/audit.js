"use strict";
/**
 * 🔍 faf audit - Audit Command
 * Check .faf file freshness and completeness gaps
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
exports.auditFafFile = auditFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
const score_calculator_1 = require("../scoring/score-calculator");
async function auditFafFile(file, options = {}) {
    try {
        const fafPath = file || (await (0, file_utils_1.findFafFile)());
        if (!fafPath) {
            console.log(chalk_1.default.red("❌ No .faf file found"));
            console.log(chalk_1.default.yellow('💡 Run "faf init" to create one'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🔍 Auditing: ${fafPath}`));
        // Read and parse .faf file
        const content = await fs_1.promises.readFile(fafPath, "utf-8");
        const fafData = YAML.parse(content);
        const warnDays = parseInt(options.warnDays || "7");
        const errorDays = parseInt(options.errorDays || "30");
        let auditScore = 100;
        const issues = [];
        const warnings = [];
        // 1. File Age Audit
        const modTime = await (0, file_utils_1.getFileModTime)(fafPath);
        if (modTime) {
            const daysSincemod = (0, file_utils_1.daysSinceModified)(modTime);
            if (daysSincemod >= errorDays) {
                issues.push(`File is ${daysSincemod} days old (critical staleness)`);
                auditScore -= 30;
            }
            else if (daysSincemod >= warnDays) {
                warnings.push(`File is ${daysSincemod} days old (consider refresh)`);
                auditScore -= 10;
            }
        }
        // 2. Generated Timestamp Audit
        if (fafData.generated) {
            try {
                const generatedDate = new Date(fafData.generated);
                const daysSinceGenerated = (0, file_utils_1.daysSinceModified)(generatedDate);
                if (daysSinceGenerated >= errorDays) {
                    issues.push(`Generated timestamp is ${daysSinceGenerated} days old`);
                    auditScore -= 20;
                }
                else if (daysSinceGenerated >= warnDays) {
                    warnings.push(`Generated timestamp is ${daysSinceGenerated} days old`);
                    auditScore -= 5;
                }
            }
            catch {
                issues.push("Invalid generated timestamp format");
                auditScore -= 15;
            }
        }
        else {
            issues.push("Missing generated timestamp");
            auditScore -= 20;
        }
        // 3. Completeness Audit
        const scoreResult = (0, score_calculator_1.calculateFafScore)(fafData);
        const completenessScore = scoreResult.totalScore;
        if (completenessScore < 50) {
            issues.push(`Low completeness score: ${Math.round(completenessScore)}%`);
            auditScore -= 25;
        }
        else if (completenessScore < 70) {
            warnings.push(`Moderate completeness score: ${Math.round(completenessScore)}%`);
            auditScore -= 10;
        }
        // 4. Critical Sections Audit
        const criticalSections = ["project", "ai_instructions", "scores"];
        criticalSections.forEach((section) => {
            if (!fafData[section] || Object.keys(fafData[section]).length === 0) {
                issues.push(`Missing critical section: ${section}`);
                auditScore -= 15;
            }
        });
        // 5. Quality Indicators Audit
        if (!scoreResult.qualityIndicators.hasAiInstructions) {
            warnings.push("Missing AI instructions for context handoff");
            auditScore -= 5;
        }
        if (!scoreResult.qualityIndicators.hasHumanContext) {
            warnings.push("Missing human context (6 Ws) for deeper understanding");
            auditScore -= 10;
        }
        // Display Results
        auditScore = Math.max(0, Math.min(100, auditScore));
        if (auditScore >= 90) {
            console.log(chalk_1.default.green(`✅ Audit Score: ${auditScore}% - Excellent`));
        }
        else if (auditScore >= 70) {
            console.log(chalk_1.default.yellow(`⚠️  Audit Score: ${auditScore}% - Good`));
        }
        else {
            console.log(chalk_1.default.red(`🚨 Audit Score: ${auditScore}% - Needs Attention`));
        }
        // Show Issues
        if (issues.length > 0) {
            console.log(chalk_1.default.red("\n🚨 Critical Issues:"));
            issues.forEach((issue, index) => {
                console.log(chalk_1.default.red(`   ${index + 1}. ${issue}`));
            });
        }
        // Show Warnings
        if (warnings.length > 0) {
            console.log(chalk_1.default.yellow("\n⚠️  Warnings:"));
            warnings.forEach((warning, index) => {
                console.log(chalk_1.default.yellow(`   ${index + 1}. ${warning}`));
            });
        }
        // Recommendations
        if (auditScore < 100) {
            console.log(chalk_1.default.blue("\n💡 Recommendations:"));
            if (auditScore < 70) {
                console.log(chalk_1.default.blue('   • Run "faf sync" to update with latest project changes'));
                console.log(chalk_1.default.blue('   • Run "faf score --details" to identify missing context'));
            }
            if (issues.some((i) => i.includes("days old"))) {
                console.log(chalk_1.default.blue('   • Consider regenerating .faf file with "faf init --force"'));
            }
            if (completenessScore < 70) {
                console.log(chalk_1.default.blue("   • Add missing context sections to improve AI understanding"));
            }
        }
        // Exit with appropriate code
        if (issues.length > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        console.log(chalk_1.default.red("💥 Audit failed:"));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
//# sourceMappingURL=audit.js.map