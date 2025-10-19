#!/bin/bash

# Production Deployment Script for AI Qualifier
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting AI Qualifier Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${DEPLOYMENT_ENV:-production}
NODE_ENV=production
BUILD_DIR=".next"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required files exist
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    if [ ! -f ".env.production.local" ]; then
        log_warning ".env.production.local not found. Make sure production environment variables are set."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check npm/yarn
    if command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
        log_info "Using Yarn as package manager"
    else
        PACKAGE_MANAGER="npm"
        log_info "Using npm as package manager"
    fi
    
    log_success "Prerequisites check completed"
}

validate_environment() {
    log_info "Validating production environment..."
    
    # Source production environment variables
    if [ -f ".env.production.local" ]; then
        export $(cat .env.production.local | grep -v '^#' | xargs)
    fi
    
    # Check required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "OPENAI_API_KEY"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Validate URL format
    if [[ ! $NEXTAUTH_URL =~ ^https:// ]]; then
        log_error "NEXTAUTH_URL must use HTTPS in production"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

run_tests() {
    log_info "Running test suite..."
    
    # Type checking
    log_info "Running TypeScript type checking..."
    $PACKAGE_MANAGER run type-check
    
    # Linting
    log_info "Running linting..."
    $PACKAGE_MANAGER run lint:check
    
    # Unit tests
    log_info "Running unit tests..."
    $PACKAGE_MANAGER run test -- --run
    
    # E2E tests (if enabled)
    if [ "$SKIP_E2E_TESTS" != "true" ]; then
        log_info "Running E2E tests..."
        $PACKAGE_MANAGER run test:e2e
    else
        log_warning "Skipping E2E tests (SKIP_E2E_TESTS=true)"
    fi
    
    log_success "All tests passed"
}

backup_database() {
    if [ "$SKIP_BACKUP" != "true" ]; then
        log_info "Creating database backup..."
        
        # Create backup directory
        mkdir -p "$BACKUP_DIR"
        
        # Database backup (adjust based on your database)
        if command -v pg_dump &> /dev/null && [[ $DATABASE_URL =~ postgres ]]; then
            pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_backup.sql"
            log_success "Database backup created: $BACKUP_DIR/database_backup.sql"
        else
            log_warning "Database backup skipped (pg_dump not available or not PostgreSQL)"
        fi
    else
        log_warning "Skipping database backup (SKIP_BACKUP=true)"
    fi
}

install_dependencies() {
    log_info "Installing production dependencies..."
    
    # Clear node_modules and package-lock.json for clean install
    if [ "$CLEAN_INSTALL" = "true" ]; then
        log_info "Performing clean installation..."
        rm -rf node_modules
        if [ "$PACKAGE_MANAGER" = "npm" ]; then
            rm -f package-lock.json
        else
            rm -f yarn.lock
        fi
    fi
    
    # Install dependencies
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --frozen-lockfile --production=false
    else
        npm ci
    fi
    
    log_success "Dependencies installed"
}

build_application() {
    log_info "Building application for production..."
    
    # Clean previous build
    rm -rf "$BUILD_DIR"
    
    # Set production environment
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build application
    $PACKAGE_MANAGER run build
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build failed - output directory not found"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_info "Build size: $BUILD_SIZE"
    
    log_success "Application built successfully"
}

run_security_checks() {
    log_info "Running security checks..."
    
    # Check for security vulnerabilities
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn audit --level high
    else
        npm audit --audit-level high
    fi
    
    # Check for sensitive data in environment
    if grep -r "password\|secret\|key" .env* --exclude-dir=node_modules 2>/dev/null | grep -v "# " | grep -v "_URL"; then
        log_warning "Potential sensitive data found in environment files"
    fi
    
    log_success "Security checks completed"
}

deploy_to_vercel() {
    if command -v vercel &> /dev/null; then
        log_info "Deploying to Vercel..."
        
        # Deploy to production
        vercel --prod --confirm
        
        log_success "Deployed to Vercel"
    else
        log_warning "Vercel CLI not found. Install with: npm i -g vercel"
        log_info "Manual deployment required"
    fi
}

run_post_deployment_checks() {
    log_info "Running post-deployment checks..."
    
    if [ -n "$NEXTAUTH_URL" ]; then
        # Health check
        log_info "Checking application health..."
        HEALTH_URL="$NEXTAUTH_URL/api/health"
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_success "Health check passed"
        else
            log_error "Health check failed - application may not be responding"
            exit 1
        fi
        
        # Basic functionality check
        log_info "Checking homepage..."
        if curl -f -s "$NEXTAUTH_URL" > /dev/null; then
            log_success "Homepage accessible"
        else
            log_warning "Homepage check failed"
        fi
    else
        log_warning "NEXTAUTH_URL not set - skipping post-deployment checks"
    fi
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -rf .next/cache/webpack
    
    # Keep only essential files for production
    if [ "$PRODUCTION_CLEANUP" = "true" ]; then
        rm -rf coverage/
        rm -rf test-results/
        rm -rf playwright-report/
    fi
    
    log_success "Cleanup completed"
}

print_deployment_summary() {
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "Environment: $DEPLOYMENT_ENV"
    echo "Node.js Version: $(node --version)"
    echo "Build Size: $(du -sh $BUILD_DIR | cut -f1)"
    echo "Deployment Time: $(date)"
    
    if [ -n "$NEXTAUTH_URL" ]; then
        echo "Application URL: $NEXTAUTH_URL"
        echo "Health Check: $NEXTAUTH_URL/api/health"
    fi
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "Backup Location: $BACKUP_DIR"
    fi
    
    echo ""
    log_success "🚀 Production deployment completed successfully!"
}

# Main deployment process
main() {
    echo "Starting deployment at $(date)"
    
    check_prerequisites
    validate_environment
    backup_database
    install_dependencies
    run_tests
    run_security_checks
    build_application
    
    # Deploy (customize based on your hosting platform)
    if [ "$HOSTING_PLATFORM" = "vercel" ]; then
        deploy_to_vercel
    else
        log_info "Manual deployment required for platform: ${HOSTING_PLATFORM:-unknown}"
    fi
    
    run_post_deployment_checks
    cleanup
    print_deployment_summary
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-e2e)
            SKIP_E2E_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --clean-install)
            CLEAN_INSTALL=true
            shift
            ;;
        --production-cleanup)
            PRODUCTION_CLEANUP=true
            shift
            ;;
        --platform)
            HOSTING_PLATFORM="$2"
            shift 2
            ;;
        --help)
            echo "AI Qualifier Production Deployment Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-tests          Skip test execution"
            echo "  --skip-e2e           Skip E2E tests"
            echo "  --skip-backup        Skip database backup"
            echo "  --clean-install      Perform clean dependency installation"
            echo "  --production-cleanup Remove development files after deployment"
            echo "  --platform PLATFORM  Specify hosting platform (vercel, custom)"
            echo "  --help               Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DEPLOYMENT_ENV       Deployment environment (default: production)"
            echo "  SKIP_E2E_TESTS      Skip E2E tests (true/false)"
            echo "  SKIP_BACKUP         Skip database backup (true/false)"
            echo "  CLEAN_INSTALL       Perform clean install (true/false)"
            echo "  PRODUCTION_CLEANUP  Clean up after deployment (true/false)"
            echo "  HOSTING_PLATFORM    Hosting platform (vercel/custom)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
if [ "$SKIP_TESTS" = "true" ]; then
    log_warning "Skipping tests (--skip-tests flag provided)"
    main() {
        echo "Starting deployment at $(date)"
        
        check_prerequisites
        validate_environment
        backup_database
        install_dependencies
        run_security_checks
        build_application
        
        if [ "$HOSTING_PLATFORM" = "vercel" ]; then
            deploy_to_vercel
        else
            log_info "Manual deployment required for platform: ${HOSTING_PLATFORM:-unknown}"
        fi
        
        run_post_deployment_checks
        cleanup
        print_deployment_summary
    }
fi

main