#!/bin/bash

# FAF Engine MK3 Build Script
# Compiles and protects the scoring engine

set -e

echo "🔒 Building FAF Engine MK3 - Protected Binary"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean previous build
echo -e "${YELLOW}[1/5]${NC} Cleaning previous build..."
rm -rf dist
rm -rf types
mkdir -p dist
mkdir -p types

# Step 2: Compile TypeScript
echo -e "${YELLOW}[2/5]${NC} Compiling TypeScript..."
npx tsc

# Step 3: Bundle with Webpack
echo -e "${YELLOW}[3/5]${NC} Bundling with Webpack..."
npx webpack --config webpack.config.js --mode production

# Step 4: Verify output
echo -e "${YELLOW}[4/5]${NC} Verifying output..."
if [ -f "dist/engine.min.js" ]; then
    SIZE=$(du -h dist/engine.min.js | cut -f1)
    echo -e "${GREEN}✓${NC} Binary created: dist/engine.min.js (${SIZE})"
else
    echo -e "${RED}✗${NC} Build failed - no output file"
    exit 1
fi

# Step 5: Create public types
echo -e "${YELLOW}[5/5]${NC} Creating public type definitions..."
cat > types/index.d.ts << 'EOF'
/**
 * FAF Engine MK3 - Public API Types
 * Protected implementation, public interface
 */

export interface ScoreResult {
  score: number;
  checksum: string;
  timestamp: number;
  performance: number;
  grade?: string;
}

export interface AnalysisResult {
  formats: any[];
  intelligence: any;
  quality: any;
  performanceMs: number;
}

export interface CompileResult {
  score: ScoreResult;
  analysis: AnalysisResult;
  verification: any;
}

export interface EngineOptions {
  projectDir?: string;
  verbose?: boolean;
  includeAnalysis?: boolean;
}

export declare class FAFEngineMK3 {
  score(projectDir: string, options?: EngineOptions): Promise<ScoreResult>;
  analyze(projectDir: string): Promise<AnalysisResult>;
  compile(projectDir: string): Promise<CompileResult>;
}

export declare const engine: FAFEngineMK3;
export declare const VERSION: string;
export declare const ENGINE_NAME: string;

export default engine;
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🏆 FAF Engine MK3 Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Output files:"
echo "  • dist/engine.min.js - Protected binary"
echo "  • types/index.d.ts   - Public types"
echo ""
echo "The scoring logic is now protected!"