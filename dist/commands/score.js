"use strict";
/**
 * 🎯 faf score - Scoring Command
 * Calculates .faf completeness score with detailed breakdown
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
exports.scoreFafFile = scoreFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const score_calculator_1 = require("../scoring/score-calculator");
const file_utils_1 = require("../utils/file-utils");
async function scoreFafFile(file, options = {}) {
    try {
        const fafPath = file || await (0, file_utils_1.findFafFile)();
        if (!fafPath) {
            console.log(chalk_1.default.red('❌ No .faf file found'));
            console.log(chalk_1.default.yellow('💡 Run "faf init" to create one'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🎯 Scoring: ${fafPath}`));
        // Read and parse .faf file
        const content = await fs_1.promises.readFile(fafPath, 'utf-8');
        const fafData = YAML.parse(content);
        // Calculate score
        const scoreResult = (0, score_calculator_1.calculateFafScore)(fafData);
        const percentage = Math.round(scoreResult.totalScore);
        // Color-coded score display
        let scoreColor = chalk_1.default.red;
        let scoreEmoji = '🔴';
        if (percentage >= 90) {
            scoreColor = chalk_1.default.green;
            scoreEmoji = '🟢';
        }
        else if (percentage >= 70) {
            scoreColor = chalk_1.default.yellow;
            scoreEmoji = '🟡';
        }
        console.log(scoreColor.bold(`${scoreEmoji} Score: ${percentage}%`));
        console.log(chalk_1.default.gray(`   (${scoreResult.filledSlots}/${scoreResult.totalSlots} context slots filled)`));
        // Detailed breakdown
        if (options.details) {
            console.log(chalk_1.default.blue('\n📊 Detailed Breakdown:'));
            Object.entries(scoreResult.sectionScores).forEach(([section, score]) => {
                const sectionPercentage = Math.round(score.percentage);
                const sectionColor = sectionPercentage >= 70 ? chalk_1.default.green :
                    sectionPercentage >= 40 ? chalk_1.default.yellow : chalk_1.default.red;
                console.log(`   ${sectionColor(section)}: ${sectionPercentage}% (${score.filled}/${score.total})`);
                if (score.missing.length > 0) {
                    console.log(chalk_1.default.gray(`      Missing: ${score.missing.join(', ')}`));
                }
            });
            // Improvement suggestions
            if (percentage < 100) {
                console.log(chalk_1.default.blue('\n💡 Quick Wins:'));
                const suggestions = scoreResult.suggestions.slice(0, 3);
                suggestions.forEach((suggestion, index) => {
                    console.log(chalk_1.default.yellow(`   ${index + 1}. ${suggestion}`));
                });
            }
        }
        // Check minimum threshold
        const minimumScore = parseInt(options.minimum || '50');
        if (percentage < minimumScore) {
            console.log(chalk_1.default.red(`\n🚨 Score below minimum threshold (${minimumScore}%)`));
            process.exit(1);
        }
        // Success message
        if (percentage === 100) {
            console.log(chalk_1.default.green.bold('\n🎉 Perfect .faf file! Ready for AI collaboration!'));
        }
        else if (percentage >= 80) {
            console.log(chalk_1.default.green('\n✨ Excellent .faf file! Minor improvements possible.'));
        }
        else if (percentage >= 60) {
            console.log(chalk_1.default.yellow('\n👍 Good .faf file! Some gaps to fill.'));
        }
        else {
            console.log(chalk_1.default.red('\n⚠️  .faf file needs improvement for optimal AI context.'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('💥 Scoring failed:'));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
//# sourceMappingURL=score.js.map