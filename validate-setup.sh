#!/bin/bash

# QA360 Framework - Quick Validation Script
# This script validates that all components are properly installed and configured

echo "=========================================="
echo "QA360 Framework - System Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
PASSED=0
FAILED=0
WARNED=0

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $1 is installed"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $1 is NOT installed"
        ((FAILED++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $1 NOT found"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 directory exists"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $1 directory NOT found"
        ((WARNED++))
        return 1
    fi
}

echo "📋 CHECKING PREREQUISITES"
echo "----------------------------------------"
check_command "node"
check_command "npm"
check_command "git"
echo ""

echo "📦 CHECKING DEPENDENCIES"
echo "----------------------------------------"
if grep -q "@playwright/test" package.json; then
    echo -e "${GREEN}✅${NC} @playwright/test in package.json"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} @playwright/test NOT in package.json"
    ((FAILED++))
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules directory exists"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} node_modules NOT installed - run 'npm install'"
    ((FAILED++))
fi

if [ -d "node_modules/playwright" ]; then
    echo -e "${GREEN}✅${NC} Playwright installed"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Playwright NOT installed - run 'npm install'"
    ((FAILED++))
fi

if [ -d "node_modules/husky" ]; then
    echo -e "${GREEN}✅${NC} Husky installed"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} Husky NOT installed (optional)"
    ((WARNED++))
fi
echo ""

echo "🔧 CHECKING CONFIGURATION FILES"
echo "----------------------------------------"
check_file "playwright.config.ts"
check_file "package.json"
check_file "tsconfig.json"
check_file ".env.example"
check_file "Dockerfile"
echo ""

echo "📁 CHECKING DIRECTORY STRUCTURE"
echo "----------------------------------------"
check_directory "tests"
check_directory ".github"
check_directory ".github/workflows"
check_directory ".husky"
check_directory "mcp"
check_directory "mcp/prompts"
check_directory "lib"
check_directory "config"
echo ""

echo "🪝 CHECKING GIT HOOKS"
echo "----------------------------------------"
check_file ".husky/pre-commit"
check_file ".husky/commit-msg"
check_file ".husky/pre-push"
echo ""

echo "📊 CHECKING TEST FILES"
echo "----------------------------------------"
check_file "tests/test.spec.js"
check_file "tests/dynamic.spec.js"
check_file "tests/google.spec.js"
check_file "tests/Sample.spec.js"
echo ""

echo "📚 CHECKING DOCUMENTATION"
echo "----------------------------------------"
check_file "README_AUTOMATION_FRAMEWORK.md"
check_file "PROJECT_DOCUMENTATION.md"
check_file "SETUP_VALIDATION_CHECKLIST.md"
echo ""

echo "🐳 CHECKING DOCKER FILES"
echo "----------------------------------------"
check_file "Dockerfile"
check_file "docker-compose.yml"
check_file ".dockerignore"
echo ""

echo "🔔 CHECKING NOTIFICATION SETUP"
echo "----------------------------------------"
check_file "lib/notification-config.ts"
check_file "lib/jenkins-pipelines.ts"
echo ""

echo "🤖 CHECKING MCP PROMPTS"
echo "----------------------------------------"
check_file "mcp/prompts/generate-test.prompt.md"
check_file "mcp/prompts/analyze-failure.prompt.md"
check_file "mcp/prompts/refactor-framework.prompt.md"
check_file "mcp/prompts/ci-cd-review.prompt.md"
check_file "mcp/prompts/ai-failure-analysis.prompt.md"
check_file "mcp/prompts/github-mcp-workflow.prompt.md"
echo ""

echo "🚀 CHECKING CI/CD WORKFLOWS"
echo "----------------------------------------"
check_file ".github/workflows/smoke-tests.yml"
check_file ".github/workflows/regression-tests.yml"
check_file ".github/workflows/api-tests.yml"
check_file ".github/workflows/docker-build.yml"
echo ""

# Summary
echo "=========================================="
echo "📊 VALIDATION SUMMARY"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run tests: npm test"
    echo "2. View reports: npm run test:report"
    echo "3. Build Docker: docker build -t qa360-framework ."
    echo "4. Start Compose: docker-compose up"
    exit 0
else
    echo -e "${RED}❌ Some checks failed${NC}"
    echo ""
    echo "Please fix the above issues before proceeding."
    echo "See SETUP_VALIDATION_CHECKLIST.md for detailed instructions."
    exit 1
fi
