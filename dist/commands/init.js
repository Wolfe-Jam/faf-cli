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
const path_1 = __importDefault(require("path"));
const YAML = __importStar(require("yaml"));
const file_utils_1 = require("../utils/file-utils");
const faf_generator_1 = require("../generators/faf-generator");
const fafignore_parser_1 = require("../utils/fafignore-parser");
async function initFafFile(projectPath, options = {}) {
    const startTime = Date.now();
    try {
        const projectRoot = projectPath || process.cwd();
        const outputPath = options.output ? options.output : `${projectRoot}/.faf`;
        // Check if .faf file already exists
        if ((await (0, file_utils_1.fileExists)(outputPath)) && !options.force) {
            console.log(chalk_1.default.yellow(`⚠️  .faf file already exists: ${outputPath}`));
            console.log(chalk_1.default.yellow("Use --force to overwrite"));
            process.exit(1);
        }
        console.log(chalk_1.default.blue("🚀 Initializing .faf file..."));
        // Check for .fafignore
        const fafIgnorePath = path_1.default.join(projectRoot, ".fafignore");
        if (!(await (0, file_utils_1.fileExists)(fafIgnorePath))) {
            console.log(chalk_1.default.gray("   Creating .fafignore with default patterns..."));
            await (0, fafignore_parser_1.createDefaultFafIgnore)(projectRoot);
            console.log(chalk_1.default.green("   ✅ Created .fafignore (customize to exclude files)"));
        }
        else {
            console.log(chalk_1.default.gray("   Using existing .fafignore file"));
        }
        // Detect project structure
        const projectType = options.template === "auto"
            ? await (0, file_utils_1.detectProjectType)(projectRoot)
            : options.template || (await (0, file_utils_1.detectProjectType)(projectRoot));
        console.log(chalk_1.default.gray(`   Detected project type: ${projectType}`));
        // Generate .faf content
        const fafContent = await (0, faf_generator_1.generateFafFromProject)({
            projectType,
            outputPath,
            projectRoot: projectRoot,
        });
        // Write .faf file
        await fs_1.promises.writeFile(outputPath, fafContent, "utf-8");
        const elapsedTime = Date.now() - startTime;
        console.log(chalk_1.default.green(`✅ Created ${outputPath}`));
        console.log(chalk_1.default.gray(`   Generated in ${elapsedTime}ms ⚡`));
        // Show initial score
        const fafData = YAML.parse(fafContent);
        const initialScore = fafData.scores?.faf_score || 0;
        console.log(chalk_1.default.blue(`📊 Initial score: ${initialScore}%`));
        // Next steps
        console.log(chalk_1.default.yellow("\n💡 Next steps:"));
        console.log(chalk_1.default.yellow('   1. Run "faf score --details" to see improvement opportunities'));
        console.log(chalk_1.default.yellow("   2. Edit .faf file to add missing context"));
        console.log(chalk_1.default.yellow('   3. Run "faf validate" to check format compliance'));
        if (initialScore < 70) {
            console.log(chalk_1.default.yellow("   4. Aim for 70%+ score for good AI context"));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red("💥 Initialization failed:"));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map