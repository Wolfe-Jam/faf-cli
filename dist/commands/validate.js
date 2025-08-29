"use strict";
/**
 * 🔍 faf validate - Validation Command
 * Validates .faf files against schema with detailed feedback
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
exports.validateFafFile = validateFafFile;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const YAML = __importStar(require("yaml"));
const faf_schema_1 = require("../schema/faf-schema");
const file_utils_1 = require("../utils/file-utils");
async function validateFafFile(file, options = {}) {
    try {
        const fafPath = file || (await (0, file_utils_1.findFafFile)());
        if (!fafPath) {
            console.log(chalk_1.default.red("❌ No .faf file found"));
            console.log(chalk_1.default.yellow('💡 Run "faf init" to create one'));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`🔍 Validating: ${fafPath}`));
        // Read and parse .faf file
        const content = await fs_1.promises.readFile(fafPath, "utf-8");
        const fafData = YAML.parse(content);
        // Validate against schema
        const validation = (0, faf_schema_1.validateSchema)(fafData, options.schema || "latest");
        if (validation.valid) {
            console.log(chalk_1.default.green("✅ Valid .faf file"));
            if (options.verbose) {
                console.log(chalk_1.default.gray("📊 Validation Details:"));
                console.log(chalk_1.default.gray(`   Schema Version: ${validation.schemaVersion}`));
                console.log(chalk_1.default.gray(`   Format Version: ${fafData.faf_version || "unknown"}`));
                console.log(chalk_1.default.gray(`   Total Sections: ${validation.sectionsFound}`));
                console.log(chalk_1.default.gray(`   Required Fields: ${validation.requiredFieldsFound}/${validation.requiredFieldsTotal}`));
            }
        }
        else {
            console.log(chalk_1.default.red("❌ Invalid .faf file"));
            console.log(chalk_1.default.red("🚨 Errors found:"));
            validation.errors.forEach((error, index) => {
                console.log(chalk_1.default.red(`   ${index + 1}. ${error.message}`));
                if (error.path) {
                    console.log(chalk_1.default.gray(`      Path: ${error.path}`));
                }
            });
            if (validation.warnings.length > 0) {
                console.log(chalk_1.default.yellow("⚠️  Warnings:"));
                validation.warnings.forEach((warning, index) => {
                    console.log(chalk_1.default.yellow(`   ${index + 1}. ${warning.message}`));
                });
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.log(chalk_1.default.red("💥 Validation failed:"));
        console.log(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
//# sourceMappingURL=validate.js.map