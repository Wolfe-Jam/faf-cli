"use strict";
/**
 * 🚀 faf init - Initialization Command
 * Generate .faf file from project structure with auto-detection
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
exports.initFafFile = initFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
const faf_generator_1 = require("../generators/faf-generator");
async function initFafFile(options = {}) {
    try {
        const outputPath = options.output || '.faf';
        // Check if .faf file already exists
        if (await (0, file_utils_1.fileExists)(outputPath) && !options.force) {
            console.log(chalk_1.default.yellow(`⚠️  .faf file already exists: ${outputPath}`));
            console.log(chalk_1.default.yellow('Use --force to overwrite'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue('🚀 Initializing .faf file...'));
        // Detect project structure
        const projectType = options.template === 'auto'
            ? await (0, file_utils_1.detectProjectType)()
            : options.template;
        console.log(chalk_1.default.gray(`   Detected project type: ${projectType}`));
        // Generate .faf content
        const fafContent = await (0, faf_generator_1.generateFafFromProject)({
            projectType,
            outputPath,
            projectRoot: process.cwd()
        });
        // Write .faf file
        await fs_1.promises.writeFile(outputPath, fafContent, 'utf-8');
        console.log(chalk_1.default.green(`✅ Created ${outputPath}`));
        // Show initial score
        const fafData = YAML.parse(fafContent);
        const initialScore = fafData.scores?.faf_score || 0;
        console.log(chalk_1.default.blue(`📊 Initial score: ${initialScore}%`));
        // Next steps
        console.log(chalk_1.default.yellow('\n💡 Next steps:'));
        console.log(chalk_1.default.yellow('   1. Run "faf score --details" to see improvement opportunities'));
        console.log(chalk_1.default.yellow('   2. Edit .faf file to add missing context'));
        console.log(chalk_1.default.yellow('   3. Run "faf validate" to check format compliance'));
        if (initialScore < 70) {
            console.log(chalk_1.default.yellow('   4. Aim for 70%+ score for good AI context'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('💥 Initialization failed:'));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map