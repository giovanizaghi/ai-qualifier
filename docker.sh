#!/bin/bash

# Docker Management Script for AI Qualifier
# This script provides common Docker operations for development and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="ai-qualifier"
DEV_COMPOSE_FILE="docker-compose.dev.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

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

show_help() {
    echo "AI Qualifier Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev:start                Start development environment"
    echo "  dev:stop                 Stop development environment"
    echo "  dev:restart              Restart development environment"
    echo "  dev:logs                 Show development logs"
    echo "  dev:shell                Access development container shell"
    echo "  dev:db                   Access development database"
    echo ""
    echo "  prod:start               Start production environment"
    echo "  prod:stop                Stop production environment"
    echo "  prod:restart             Restart production environment"
    echo "  prod:logs                Show production logs"
    echo "  prod:shell               Access production container shell"
    echo "  prod:db                  Access production database"
    echo "  prod:deploy              Deploy to production"
    echo ""
    echo "  build                    Build all images"
    echo "  build:dev                Build development images"
    echo "  build:prod               Build production images"
    echo ""
    echo "  backup                   Create database backup"
    echo "  restore [BACKUP_FILE]    Restore database from backup"
    echo ""
    echo "  cleanup                  Remove unused containers and images"
    echo "  status                   Show container status"
    echo "  health                   Check application health"
    echo ""
    echo "  monitoring:start         Start monitoring stack"
    echo "  monitoring:stop          Stop monitoring stack"
    echo ""
    echo "Options:"
    echo "  --service [SERVICE]      Target specific service"
    echo "  --follow                 Follow logs output"
    echo "  --rebuild                Force rebuild images"
    echo "  --no-cache               Build without cache"
    echo ""
}

# Development environment functions
dev_start() {
    log_info "Starting development environment..."
    
    if [ "$REBUILD" = "true" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" up --build -d
    else
        docker-compose -f "$DEV_COMPOSE_FILE" up -d
    fi
    
    log_success "Development environment started"
    log_info "Application: http://localhost:3000"
    log_info "Database Admin: http://localhost:8080"
    log_info "MailHog: http://localhost:8025"
}

dev_stop() {
    log_info "Stopping development environment..."
    docker-compose -f "$DEV_COMPOSE_FILE" down
    log_success "Development environment stopped"
}

dev_restart() {
    dev_stop
    dev_start
}

dev_logs() {
    if [ -n "$SERVICE" ]; then
        if [ "$FOLLOW" = "true" ]; then
            docker-compose -f "$DEV_COMPOSE_FILE" logs -f "$SERVICE"
        else
            docker-compose -f "$DEV_COMPOSE_FILE" logs "$SERVICE"
        fi
    else
        if [ "$FOLLOW" = "true" ]; then
            docker-compose -f "$DEV_COMPOSE_FILE" logs -f
        else
            docker-compose -f "$DEV_COMPOSE_FILE" logs
        fi
    fi
}

dev_shell() {
    log_info "Accessing development container shell..."
    docker-compose -f "$DEV_COMPOSE_FILE" exec app sh
}

dev_db() {
    log_info "Accessing development database..."
    docker-compose -f "$DEV_COMPOSE_FILE" exec database psql -U postgres -d ai_qualifier_dev
}

# Production environment functions
prod_start() {
    log_info "Starting production environment..."
    
    # Check if production environment file exists
    if [ ! -f ".env.production.local" ]; then
        log_error "Production environment file (.env.production.local) not found!"
        log_info "Copy .env.production.example and configure your production settings"
        exit 1
    fi
    
    if [ "$REBUILD" = "true" ]; then
        docker-compose -f "$PROD_COMPOSE_FILE" up --build -d
    else
        docker-compose -f "$PROD_COMPOSE_FILE" up -d
    fi
    
    log_success "Production environment started"
}

prod_stop() {
    log_info "Stopping production environment..."
    docker-compose -f "$PROD_COMPOSE_FILE" down
    log_success "Production environment stopped"
}

prod_restart() {
    prod_stop
    prod_start
}

prod_logs() {
    if [ -n "$SERVICE" ]; then
        if [ "$FOLLOW" = "true" ]; then
            docker-compose -f "$PROD_COMPOSE_FILE" logs -f "$SERVICE"
        else
            docker-compose -f "$PROD_COMPOSE_FILE" logs "$SERVICE"
        fi
    else
        if [ "$FOLLOW" = "true" ]; then
            docker-compose -f "$PROD_COMPOSE_FILE" logs -f
        else
            docker-compose -f "$PROD_COMPOSE_FILE" logs
        fi
    fi
}

prod_shell() {
    log_info "Accessing production container shell..."
    docker-compose -f "$PROD_COMPOSE_FILE" exec app sh
}

prod_db() {
    log_info "Accessing production database..."
    docker-compose -f "$PROD_COMPOSE_FILE" exec database psql -U postgres -d ai_qualifier
}

prod_deploy() {
    log_info "Deploying to production..."
    
    # Run backup before deployment
    backup_database
    
    # Build and deploy
    docker-compose -f "$PROD_COMPOSE_FILE" build --no-cache
    docker-compose -f "$PROD_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run health check
    check_health
    
    log_success "Production deployment completed"
}

# Build functions
build_all() {
    log_info "Building all images..."
    
    if [ "$NO_CACHE" = "true" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" build --no-cache
        docker-compose -f "$PROD_COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$DEV_COMPOSE_FILE" build
        docker-compose -f "$PROD_COMPOSE_FILE" build
    fi
    
    log_success "All images built"
}

build_dev() {
    log_info "Building development images..."
    
    if [ "$NO_CACHE" = "true" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$DEV_COMPOSE_FILE" build
    fi
    
    log_success "Development images built"
}

build_prod() {
    log_info "Building production images..."
    
    if [ "$NO_CACHE" = "true" ]; then
        docker-compose -f "$PROD_COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$PROD_COMPOSE_FILE" build
    fi
    
    log_success "Production images built"
}

# Backup and restore functions
backup_database() {
    log_info "Creating database backup..."
    docker-compose -f "$PROD_COMPOSE_FILE" run --rm db-backup
    log_success "Database backup completed"
}

restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file to restore"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will restore the database from backup. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database from backup: $backup_file"
    
    # Copy backup file to container and restore
    docker-compose -f "$PROD_COMPOSE_FILE" exec -T database \
        pg_restore -U postgres -d ai_qualifier --clean --if-exists < "$backup_file"
    
    log_success "Database restored from backup"
}

# Utility functions
cleanup() {
    log_info "Cleaning up unused containers and images..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    log_warning "Remove unused volumes? This may delete data! (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

show_status() {
    log_info "Container status:"
    echo ""
    
    echo "Development Environment:"
    docker-compose -f "$DEV_COMPOSE_FILE" ps
    
    echo ""
    echo "Production Environment:"
    docker-compose -f "$PROD_COMPOSE_FILE" ps
}

check_health() {
    log_info "Checking application health..."
    
    # Check if containers are running
    if docker-compose -f "$PROD_COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Containers are running"
        
        # Try to access health endpoint
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log_success "Application health check passed"
        else
            log_warning "Application health check failed"
        fi
    else
        log_error "Containers are not running"
    fi
}

# Monitoring functions
monitoring_start() {
    log_info "Starting monitoring stack..."
    docker-compose -f "$PROD_COMPOSE_FILE" --profile monitoring up -d
    log_success "Monitoring stack started"
    log_info "Grafana: http://localhost:3001"
    log_info "Prometheus: http://localhost:9090"
}

monitoring_stop() {
    log_info "Stopping monitoring stack..."
    docker-compose -f "$PROD_COMPOSE_FILE" --profile monitoring down
    log_success "Monitoring stack stopped"
}

# Parse command line arguments
REBUILD=false
NO_CACHE=false
FOLLOW=false
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --follow)
            FOLLOW=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            COMMAND="$1"
            BACKUP_FILE="$2"
            break
            ;;
    esac
done

# Execute command
case $COMMAND in
    dev:start)
        dev_start
        ;;
    dev:stop)
        dev_stop
        ;;
    dev:restart)
        dev_restart
        ;;
    dev:logs)
        dev_logs
        ;;
    dev:shell)
        dev_shell
        ;;
    dev:db)
        dev_db
        ;;
    prod:start)
        prod_start
        ;;
    prod:stop)
        prod_stop
        ;;
    prod:restart)
        prod_restart
        ;;
    prod:logs)
        prod_logs
        ;;
    prod:shell)
        prod_shell
        ;;
    prod:db)
        prod_db
        ;;
    prod:deploy)
        prod_deploy
        ;;
    build)
        build_all
        ;;
    build:dev)
        build_dev
        ;;
    build:prod)
        build_prod
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$BACKUP_FILE"
        ;;
    cleanup)
        cleanup
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    monitoring:start)
        monitoring_start
        ;;
    monitoring:stop)
        monitoring_stop
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac