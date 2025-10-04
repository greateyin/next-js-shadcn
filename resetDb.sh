#!/bin/bash

# =============================================================================
# Database Reset Script
# =============================================================================
# Description: Completely resets the database and runs seed data
# Usage: ./resetDb.sh [options]
# Options:
#   --force, -f    Skip confirmation prompt
#   --help, -h     Show this help message
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
DATABASE_URL="${DATABASE_URL:-postgresql://dennis:gssw9w48p90@localhost:5433/postgres?schema=public}"
FORCE_MODE=false

# Functions
print_banner() {
    echo -e "${BLUE}"
    echo "======================================================="
    echo "           DATABASE RESET SCRIPT"
    echo "======================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_help() {
    echo "Database Reset Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --force, -f    Skip confirmation prompt"
    echo "  --help, -h     Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL   Database connection string"
    echo "                 Default: postgresql://dennis:gssw9w48p90@localhost:5433/postgres?schema=public"
    echo ""
    echo "Examples:"
    echo "  $0              # Interactive mode with confirmation"
    echo "  $0 --force      # Force reset without confirmation"
    echo ""
}

check_dependencies() {
    print_step "Checking dependencies..."
    
    # Check if npm/pnpm is available
    if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
        print_error "Neither pnpm nor npm found. Please install Node.js and a package manager."
        exit 1
    fi
    
    # Check if Prisma schema exists
    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found. Make sure you're in the project root directory."
        exit 1
    fi
    
    # Check if seed file exists
    if [ ! -f "prisma/seed.ts" ]; then
        print_error "Seed file (prisma/seed.ts) not found."
        exit 1
    fi
    
    print_success "All dependencies found"
}

confirm_reset() {
    if [ "$FORCE_MODE" = true ]; then
        return 0
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This will completely reset your database!${NC}"
    echo -e "${YELLOW}   All existing data will be PERMANENTLY DELETED.${NC}"
    echo ""
    echo -e "Database: ${BLUE}$DATABASE_URL${NC}"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Database reset cancelled."
        exit 0
    fi
}

stop_prisma_studio() {
    print_step "Stopping any running Prisma Studio instances..."
    
    # Find and kill Prisma Studio processes
    pids=$(pgrep -f "prisma studio" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        print_success "Stopped Prisma Studio"
    else
        print_info "No Prisma Studio instances running"
    fi
}

reset_database() {
    print_step "Resetting database..."
    
    # Export DATABASE_URL for this session
    export DATABASE_URL="$DATABASE_URL"
    
    # Force reset the database
    if npx prisma db push --force-reset; then
        print_success "Database reset completed"
    else
        print_error "Failed to reset database"
        exit 1
    fi
}

run_seed() {
    print_step "Running seed data..."
    
    # Export DATABASE_URL for this session
    export DATABASE_URL="$DATABASE_URL"
    
    # Run the seed script
    if npx prisma db seed; then
        print_success "Seed data inserted successfully"
    else
        print_error "Failed to insert seed data"
        exit 1
    fi
}

generate_client() {
    print_step "Generating Prisma client..."
    
    # Export DATABASE_URL for this session
    export DATABASE_URL="$DATABASE_URL"
    
    # Generate Prisma client
    if npx prisma generate; then
        print_success "Prisma client generated"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

show_summary() {
    echo ""
    echo -e "${GREEN}======================================================="
    echo "           DATABASE RESET COMPLETED"
    echo "=======================================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Database has been successfully reset and seeded${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Start your application: ${YELLOW}pnpm dev${NC}"
    echo "2. Open Prisma Studio: ${YELLOW}npx prisma studio${NC}"
    echo "3. Visit your app: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}Default accounts created:${NC}"
    echo "• Admin user (check prisma/seed.ts for credentials)"
    echo "• Regular user (check prisma/seed.ts for credentials)"
    echo ""
}

cleanup() {
    # This function runs on script exit
    print_info "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Trap cleanup function on script exit
trap cleanup EXIT

# Main execution
main() {
    print_banner
    
    print_info "Database URL: $DATABASE_URL"
    print_info "Force mode: $FORCE_MODE"
    echo ""
    
    check_dependencies
    confirm_reset
    stop_prisma_studio
    
    echo ""
    print_step "Starting database reset process..."
    echo ""
    
    reset_database
    generate_client
    run_seed
    
    show_summary
}

# Run main function
main "$@"