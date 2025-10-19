#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print step
print_step() {
    echo -e "${GREEN}==> $1${NC}"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# 停止執行錯誤指令時繼續執行其後命令
set -e

print_step "Starting clean installation process..."

# Clean previous installation more thoroughly
print_step "Cleaning previous installation..."
rm -rf .next/
rm -rf node_modules
rm -f yarn.lock
rm -f package-lock.json

# Clean pnpm cache
pnpm store prune

print_step "Removed .next/, node_modules directories and cleaned pnpm cache."

# Install dependencies
print_step "Installing dependencies..."
pnpm install --force || handle_error "Failed to install dependencies"

# Generate Prisma models
print_step "Generating Prisma models..."
npx prisma generate || handle_error "Failed to generate Prisma models"

# Install shadcn-ui and related tooling locally
print_step "Installing and initializing shadcn-ui..."
pnpm add -D @shadcn/ui || handle_error "Failed to install shadcn-ui"
pnpm add -D @tailwindcss/postcss
pnpm add -D @eslint/js typescript-eslint eslint-plugin-next
pnpm add -D globals @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier

# Check and remove existing components.json
print_step "Checking for existing components.json..."
if [ -f "./components.json" ]; then
    print_step "Removing existing components.json..."
    rm ./components.json
fi

# Initialize shadcn
SHADCN_VERSION=$(node -p "const pkg=require('./package.json'); (pkg.devDependencies?.['@shadcn/ui'] ?? pkg.dependencies?.['@shadcn/ui'] ?? 'latest').replace(/^[^\\d]*/, '')")
if [ -z "$SHADCN_VERSION" ]; then
  SHADCN_VERSION="latest"
fi
print_step "Initializing shadcn-ui (version $SHADCN_VERSION)..."
pnpm dlx "shadcn@${SHADCN_VERSION}" init || handle_error "Failed to initialize shadcn-ui"

# Install shadcn-ui components
print_step "Installing shadcn-ui components..."

# Define the components to install
components=(
    "button"
    "dropdown-menu"
    "input"
    "label"
    "popover"
    "select"
    "separator"
    "sheet"
    "tabs"
    "textarea"
    "sonner"  # Replace toast with sonner
    "toggle"
    "card"
    "form"
    "avatar"
    "badge"
    "dialog"
    "switch"
    "table"
    "progress"
    "navigation-menu"
    "dropdown-menu"
)

for component in "${components[@]}"; do
    print_step "Installing component: $component"
    pnpm dlx "shadcn@${SHADCN_VERSION}" add "$component" -y --overwrite || handle_error "Failed to install $component"
done

# Build the project
print_step "Building the project..."
pnpm run build || handle_error "Failed to build the project"

print_step "Installation completed successfully! 🎉"

