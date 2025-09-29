#!/bin/bash
# 🔒 Migrate Secret Sauce to Private Engine
# This script moves proprietary code to the private @wolfejam/faf-engine package

echo "🔒 FAF Engine Migration - Moving Secret Sauce to Private Package"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
ENGINE_DIR="./faf-engine/src"
CLI_DIR="./src"

echo -e "${YELLOW}⚠️  CRITICAL: This will move proprietary code to private engine${NC}"
echo "Files to migrate:"
echo "  - fab-formats-processor.ts (150+ handlers)"
echo "  - relentless-context-extractor.ts"
echo "  - faf-dna.ts"
echo "  - turbo-cat knowledge base"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Migration cancelled${NC}"
    exit 1
fi

# Create engine directories if needed
mkdir -p "$ENGINE_DIR/processors"
mkdir -p "$ENGINE_DIR/extractors"
mkdir -p "$ENGINE_DIR/dna"
mkdir -p "$ENGINE_DIR/knowledge"

echo -e "${GREEN}✓${NC} Created engine directory structure"

# Move proprietary files
echo -e "${YELLOW}Moving secret sauce files...${NC}"

# 1. FAB-FORMATS Processor (THE CROWN JEWEL)
if [ -f "$CLI_DIR/engines/fab-formats-processor.ts" ]; then
    cp "$CLI_DIR/engines/fab-formats-processor.ts" "$ENGINE_DIR/processors/fab-formats-processor.ts"
    echo -e "${GREEN}✓${NC} Moved FAB-FORMATS processor (150+ handlers)"
fi

# 2. Relentless Context Extractor
if [ -f "$CLI_DIR/engines/relentless-context-extractor.ts" ]; then
    cp "$CLI_DIR/engines/relentless-context-extractor.ts" "$ENGINE_DIR/extractors/relentless-context-extractor.ts"
    echo -e "${GREEN}✓${NC} Moved Relentless Context Extractor"
fi

# 3. FAF DNA System
if [ -f "$CLI_DIR/engines/faf-dna.ts" ]; then
    cp "$CLI_DIR/engines/faf-dna.ts" "$ENGINE_DIR/dna/faf-dna.ts"
    echo -e "${GREEN}✓${NC} Moved FAF DNA system"
fi

# 4. Turbo Cat Knowledge Base
if [ -f "$CLI_DIR/utils/turbo-cat-knowledge.ts" ]; then
    cp "$CLI_DIR/utils/turbo-cat-knowledge.ts" "$ENGINE_DIR/knowledge/turbo-cat-knowledge.ts"
    echo -e "${GREEN}✓${NC} Moved TURBO-CAT knowledge base"
fi

# Create stub files in CLI to maintain compatibility
echo -e "${YELLOW}Creating stub files in CLI...${NC}"

# Create minimal stubs that import from private engine
cat > "$CLI_DIR/engines/fab-formats-processor.ts" << 'EOF'
/**
 * FAB-FORMATS Processor - Stub
 * Real implementation in @wolfejam/faf-engine (private)
 */
export { FabFormatsProcessor, FabFormatsAnalysis } from '@wolfejam/faf-engine';
export const fabFormatsProcessor = new (require('@wolfejam/faf-engine').FabFormatsProcessor)();
EOF

echo -e "${GREEN}✓${NC} Created stub files"

# Update engine index.ts
cat > "$ENGINE_DIR/index.ts" << 'EOF'
/**
 * 🔒 FAF Engine - Private Package
 * Contains proprietary algorithms worth $129,900/year
 */

// Core Processors (SECRET SAUCE)
export { FabFormatsProcessor } from './processors/fab-formats-processor';
export { RelentlessExtractor } from './extractors/relentless-context-extractor';
export { FafDNAManager } from './dna/faf-dna';
export { TurboCatKnowledge } from './knowledge/turbo-cat-knowledge';

// Public interfaces
export * from './core/FafEngine';
export * from './types';

// License validation
export { LicenseManager } from './license/LicenseManager';
EOF

echo -e "${GREEN}✓${NC} Updated engine exports"

# Create .npmignore to exclude source from npm package
cat > "./faf-engine/.npmignore" << 'EOF'
# Source code - NEVER publish!
src/
*.ts
!*.d.ts

# Development files
*.test.js
*.spec.js
__tests__/
coverage/
.vscode/
.idea/

# Config files
tsconfig.json
jest.config.js
webpack.*.js
.eslintrc*
.prettierrc*

# Docs
*.md
!README.md

# Misc
.DS_Store
*.log
EOF

echo -e "${GREEN}✓${NC} Created .npmignore for engine"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. cd faf-engine && npm run build"
echo "  2. npm publish --access=restricted"
echo "  3. Update CLI imports to use @wolfejam/faf-engine"
echo "  4. Test with: npm link ../faf-engine"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Delete source files from CLI after confirming migration!${NC}"
echo -e "${RED}🔒 NEVER commit engine source to public repo!${NC}"