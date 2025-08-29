"use strict";
/**
 * 🚀 .faf CLI - Main Export
 * Universal AI Context Format Tooling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFafFromProject = exports.calculateFafScore = exports.validateSchema = exports.detectProjectType = exports.findFafFile = exports.lintFafFile = exports.auditFafFile = exports.syncFafFile = exports.scoreFafFile = exports.initFafFile = exports.validateFafFile = exports.program = void 0;
// Export main CLI function
var cli_1 = require("./cli");
Object.defineProperty(exports, "program", { enumerable: true, get: function () { return cli_1.program; } });
// Export core functionality for programmatic use
var validate_1 = require("./commands/validate");
Object.defineProperty(exports, "validateFafFile", { enumerable: true, get: function () { return validate_1.validateFafFile; } });
var init_1 = require("./commands/init");
Object.defineProperty(exports, "initFafFile", { enumerable: true, get: function () { return init_1.initFafFile; } });
var score_1 = require("./commands/score");
Object.defineProperty(exports, "scoreFafFile", { enumerable: true, get: function () { return score_1.scoreFafFile; } });
var sync_1 = require("./commands/sync");
Object.defineProperty(exports, "syncFafFile", { enumerable: true, get: function () { return sync_1.syncFafFile; } });
var audit_1 = require("./commands/audit");
Object.defineProperty(exports, "auditFafFile", { enumerable: true, get: function () { return audit_1.auditFafFile; } });
var lint_1 = require("./commands/lint");
Object.defineProperty(exports, "lintFafFile", { enumerable: true, get: function () { return lint_1.lintFafFile; } });
// Export utilities
var file_utils_1 = require("./utils/file-utils");
Object.defineProperty(exports, "findFafFile", { enumerable: true, get: function () { return file_utils_1.findFafFile; } });
Object.defineProperty(exports, "detectProjectType", { enumerable: true, get: function () { return file_utils_1.detectProjectType; } });
var faf_schema_1 = require("./schema/faf-schema");
Object.defineProperty(exports, "validateSchema", { enumerable: true, get: function () { return faf_schema_1.validateSchema; } });
var score_calculator_1 = require("./scoring/score-calculator");
Object.defineProperty(exports, "calculateFafScore", { enumerable: true, get: function () { return score_calculator_1.calculateFafScore; } });
var faf_generator_1 = require("./generators/faf-generator");
Object.defineProperty(exports, "generateFafFromProject", { enumerable: true, get: function () { return faf_generator_1.generateFafFromProject; } });
//# sourceMappingURL=index.js.map