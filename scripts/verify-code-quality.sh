#!/bin/bash
# ==============================================================================
# AffiliateX Pre-Commit Code Quality & Verification Hook
# Powered by: AI-Scripto Automations
# ==============================================================================

set -e

# Terminal colors for easy reading
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}${BOLD}======================================================${NC}"
echo -e "${BLUE}${BOLD}   🛡️  AffiliateX Code Quality & Pre-Commit Verifier    ${NC}"
echo -e "${BLUE}${BOLD}   Powered by: AI-Scripto Automations                  ${NC}"
echo -e "${BLUE}${BOLD}======================================================${NC}"
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Step 1: Check for leftover Git conflict markers
echo -e "${YELLOW}Step 1/4: Checking for unresolved git merge conflicts...${NC}"
CONFLICT_FILES=$(git diff --cached --name-only | grep -v 'verify-code-quality.sh' | xargs grep -lE '^[<]{7} ' 2>/dev/null || true)
if [ -n "$CONFLICT_FILES" ]; then
    echo -e "${RED}❌ ERROR: Found git merge conflict markers in:${NC}"
    echo "$CONFLICT_FILES"
    echo -e "${RED}Please resolve all merge conflicts before committing.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ No merge conflict markers found.${NC}"
echo ""

# Step 2: Frontend TypeScript Validation
echo -e "${YELLOW}Step 2/4: Checking Frontend TypeScript code for errors...${NC}"
cd "$ROOT_DIR/frontend"
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ Frontend TypeScript check passed cleanly (0 errors).${NC}"
else
    echo -e "${RED}❌ ERROR: Frontend TypeScript compilation failed. Fix errors above before committing.${NC}"
    exit 1
fi
echo ""

# Step 3: Backend TypeScript Validation
echo -e "${YELLOW}Step 3/4: Checking Backend TypeScript code for errors...${NC}"
cd "$ROOT_DIR/backend"
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ Backend TypeScript check passed cleanly (0 errors).${NC}"
else
    echo -e "${RED}❌ ERROR: Backend TypeScript compilation failed. Fix errors above before committing.${NC}"
    exit 1
fi
echo ""

# Step 4: Verify Definition of Done (DOD) Documents
echo -e "${YELLOW}Step 4/4: Verifying Definition of Done (DOD) compliance files...${NC}"
if [ -f "$ROOT_DIR/DOD.md" ] && [ -f "$ROOT_DIR/AGENTS.md" ]; then
    echo -e "${GREEN}✓ Definition of Done (DOD.md) and Workspace Rules (AGENTS.md) are present.${NC}"
else
    echo -e "${RED}❌ ERROR: Missing required DOD.md or AGENTS.md documentation.${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD}  ✨ ALL QUALITY CHECKS PASSED! READY TO COMMIT & PUSH ✨  ${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo ""
exit 0
