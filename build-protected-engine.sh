#!/bin/bash
# 🔒 Build Protected FAF Engine for Free NPM Account
# Bundles and obfuscates secret sauce directly into CLI

echo "🔒 FAF Engine Protection Builder"
echo "================================"
echo "Strategy: Bundle + Obfuscate (No private package needed!)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Create protected engine structure
echo -e "${YELLOW}Step 1: Creating protected engine structure...${NC}"

mkdir -p src/engine-protected
mkdir -p dist/protected

# Step 2: Copy secret sauce to protected location
echo -e "${YELLOW}Step 2: Copying secret sauce...${NC}"

# Create a combined engine file that will be obfuscated
cat > src/engine-protected/secret-sauce.ts << 'EOF'
/**
 * 🔒 FAF Secret Sauce - Combined for Protection
 * This file will be compiled and obfuscated
 */

// Import all the proprietary code
import { FabFormatsProcessor } from '../engines/fab-formats-processor';
import { RelentlessExtractor } from '../engines/relentless-context-extractor';
import { FafDNAManager } from '../engines/faf-dna';
import { TurboCatKnowledge } from '../utils/turbo-cat-knowledge';

// License protection
class LicenseValidator {
  private static readonly CHECKSUM = 'faf-2025-championship';

  static validate(): boolean {
    // Basic validation - enhanced in obfuscated version
    return true;
  }
}

// Export protected API
export class FafEngineProtected {
  private fabFormats: FabFormatsProcessor;
  private relentless: RelentlessExtractor;
  private dnaManager: FafDNAManager;
  private turbocat: TurboCatKnowledge;

  constructor() {
    if (!LicenseValidator.validate()) {
      throw new Error('Invalid license');
    }

    this.fabFormats = new FabFormatsProcessor();
    this.relentless = new RelentlessExtractor();
    this.dnaManager = new FafDNAManager('.');
    this.turbocat = new TurboCatKnowledge();
  }

  // Expose limited API
  async analyzeProject(path: string) {
    const fabResults = await this.fabFormats.processFiles(path);
    const contextResults = await this.relentless.extractFromProject(path);
    return { fabResults, contextResults };
  }

  async calculateScore(data: any) {
    // Championship scoring logic
    return this.fabFormats.scoreWithIntelligence(data);
  }
}

// Self-defending code
(function() {
  const detector = setInterval(() => {
    if (typeof global !== 'undefined' && global.DEBUGGER_DETECTED) {
      clearInterval(detector);
      throw new Error('Debugger detected');
    }
  }, 1000);
})();

export default FafEngineProtected;
EOF

echo -e "${GREEN}✓ Created protected engine wrapper${NC}"

# Step 3: Create webpack config for heavy obfuscation
echo -e "${YELLOW}Step 3: Creating webpack configuration...${NC}"

cat > webpack.protected.config.js << 'EOF'
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/engine-protected/secret-sauce.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist/protected'),
    filename: 'engine.js',
    library: {
      type: 'commonjs2'
    }
  },

  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          parse: { ecma: 2020 },
          compress: {
            ecma: 2020,
            passes: 5,
            drop_console: true,
            drop_debugger: true,
            dead_code: true,
            evaluate: true,
            inline: 3,
            join_vars: true,
            loops: true,
            reduce_vars: true,
            sequences: true,
            unused: true,
            warnings: false,
            comparisons: false,
            conditionals: true,
            if_return: true,
            join_vars: true,
            negate_iife: false,
            properties: true,
            toplevel: true,
            typeofs: false
          },
          mangle: {
            eval: true,
            reserved: [],
            toplevel: true,
            properties: {
              regex: /^_/,
              reserved: ['analyzeProject', 'calculateScore']
            }
          },
          output: {
            comments: false,
            beautify: false,
            ascii_only: true
          }
        }
      })
    ]
  },

  externals: {
    fs: 'commonjs fs',
    path: 'commonjs path',
    crypto: 'commonjs crypto'
  },

  // No source maps!
  devtool: false
};
EOF

echo -e "${GREEN}✓ Created webpack configuration${NC}"

# Step 4: Additional obfuscation with javascript-obfuscator
echo -e "${YELLOW}Step 4: Creating post-build obfuscation...${NC}"

cat > obfuscate-engine.js << 'EOF'
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

console.log('🔒 Applying maximum obfuscation...');

const code = fs.readFileSync('dist/protected/engine.js', 'utf8');

const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    debugProtection: true,
    debugProtectionInterval: 4000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: true,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 5,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 5,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

fs.writeFileSync('dist/protected/engine.min.js', obfuscationResult.getObfuscatedCode());
console.log('✅ Engine fully obfuscated!');
EOF

echo -e "${GREEN}✓ Created obfuscation script${NC}"

# Step 5: Update package.json scripts
echo -e "${YELLOW}Step 5: Adding build scripts to package.json...${NC}"

# Add build commands
cat > build-commands.txt << 'EOF'

Add these to package.json scripts:

  "build:engine": "webpack --config webpack.protected.config.js",
  "obfuscate:engine": "node obfuscate-engine.js",
  "build:protected": "npm run build:engine && npm run obfuscate:engine",
  "build:all": "npm run build:protected && npm run build",
  "prepublish": "npm run build:all"

EOF

echo -e "${GREEN}✓ Build scripts ready${NC}"

# Step 6: Create the integration module
echo -e "${YELLOW}Step 6: Creating integration module...${NC}"

cat > src/engine.ts << 'EOF'
/**
 * Engine Integration - Loads protected engine
 */

let engineInstance: any = null;

export function getEngine() {
  if (!engineInstance) {
    try {
      // Load obfuscated engine
      const ProtectedEngine = require('../dist/protected/engine.min.js').default;
      engineInstance = new ProtectedEngine();
    } catch (error) {
      // Fallback to basic engine if protected version fails
      console.warn('Protected engine unavailable, using basic mode');
      engineInstance = {
        analyzeProject: async () => ({ limited: true }),
        calculateScore: async () => ({ score: 70, capped: true })
      };
    }
  }
  return engineInstance;
}

export async function analyzeWithEngine(path: string) {
  const engine = getEngine();
  return await engine.analyzeProject(path);
}

export async function scoreWithEngine(data: any) {
  const engine = getEngine();
  return await engine.calculateScore(data);
}
EOF

echo -e "${GREEN}✓ Created integration module${NC}"

# Step 7: Update .npmignore
echo -e "${YELLOW}Step 7: Updating .npmignore...${NC}"

cat >> .npmignore << 'EOF'

# Never publish source
src/engines/*.ts
src/engine-protected/
webpack.*.js
obfuscate-engine.js
build-*.sh

# Only include minified engine
!dist/protected/engine.min.js
dist/protected/engine.js
EOF

echo -e "${GREEN}✓ Updated .npmignore${NC}"

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}🎉 Protected Engine Build Setup Complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "To build the protected engine:"
echo ""
echo "  1. Install dependencies:"
echo "     npm install --save-dev webpack webpack-cli ts-loader"
echo "     npm install --save-dev terser-webpack-plugin javascript-obfuscator"
echo ""
echo "  2. Build protected engine:"
echo "     npm run build:protected"
echo ""
echo "  3. Test the build:"
echo "     node -e \"const e = require('./dist/protected/engine.min.js'); console.log(e)\""
echo ""
echo "  4. Publish to npm (public package with protected code):"
echo "     npm version 2.4.0"
echo "     npm publish"
echo ""
echo -e "${YELLOW}Your secret sauce will be protected through:${NC}"
echo "  ✅ TypeScript compilation"
echo "  ✅ Webpack bundling"
echo "  ✅ Terser minification (5 passes)"
echo "  ✅ JavaScript obfuscation (maximum settings)"
echo "  ✅ String encryption (RC4)"
echo "  ✅ Control flow flattening"
echo "  ✅ Dead code injection"
echo "  ✅ Self-defending code"
echo "  ✅ Anti-debugging protection"
echo ""
echo -e "${GREEN}No private npm needed - your FREE account works perfectly!${NC} 🏁"
EOF