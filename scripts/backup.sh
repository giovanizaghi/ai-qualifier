#!/bin/bash

# Database Backup Script for AI Qualifier
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ai_qualifier_backup_${DATE}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Database connection info
DB_HOST=${PGHOST:-database}
DB_PORT=${PGPORT:-5432}
DB_NAME=${PGDATABASE:-ai_qualifier}
DB_USER=${PGUSER:-postgres}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
create_backup() {
    log_info "Starting database backup for $DB_NAME..."
    
    # Create the backup
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-acl --no-owner \
        --format=custom --compress=9 \
        --file="$BACKUP_DIR/$BACKUP_FILE.backup"; then
        
        log_info "Database backup completed successfully: $BACKUP_FILE.backup"
        
        # Also create a plain SQL backup for easier inspection
        if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --verbose --clean --no-acl --no-owner \
            --file="$BACKUP_DIR/$BACKUP_FILE"; then
            
            log_info "Plain SQL backup completed: $BACKUP_FILE"
        else
            log_warning "Plain SQL backup failed, but custom format backup succeeded"
        fi
        
    else
        log_error "Database backup failed!"
        exit 1
    fi
}

# Function to compress and encrypt backup (optional)
secure_backup() {
    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log_info "Encrypting backup..."
        
        # Encrypt the backup file
        openssl enc -aes-256-cbc -salt -in "$BACKUP_DIR/$BACKUP_FILE" \
            -out "$BACKUP_DIR/$BACKUP_FILE.enc" \
            -k "$BACKUP_ENCRYPTION_KEY"
        
        if [ $? -eq 0 ]; then
            rm "$BACKUP_DIR/$BACKUP_FILE"
            log_info "Backup encrypted successfully"
        else
            log_error "Backup encryption failed"
        fi
    fi
}

# Function to upload backup to cloud storage (optional)
upload_backup() {
    if [ -n "$AWS_S3_BACKUP_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log_info "Uploading backup to S3..."
        
        # Upload to S3 (requires AWS CLI)
        if command -v aws >/dev/null 2>&1; then
            aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.backup" \
                "s3://$AWS_S3_BACKUP_BUCKET/database-backups/$BACKUP_FILE.backup"
            
            if [ $? -eq 0 ]; then
                log_info "Backup uploaded to S3 successfully"
            else
                log_error "S3 upload failed"
            fi
        else
            log_warning "AWS CLI not available, skipping S3 upload"
        fi
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "ai_qualifier_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "ai_qualifier_backup_*.backup*" -type f -mtime +$RETENTION_DAYS -delete
    
    log_info "Old backup cleanup completed"
}

# Function to test database connectivity
test_connection() {
    log_info "Testing database connection..."
    
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log_info "Database connection successful"
    else
        log_error "Cannot connect to database"
        exit 1
    fi
}

# Function to validate backup
validate_backup() {
    log_info "Validating backup file..."
    
    if [ -f "$BACKUP_DIR/$BACKUP_FILE.backup" ]; then
        # Check if the backup file is valid
        if pg_restore --list "$BACKUP_DIR/$BACKUP_FILE.backup" >/dev/null 2>&1; then
            log_info "Backup file validation successful"
        else
            log_error "Backup file validation failed"
            exit 1
        fi
    else
        log_error "Backup file not found"
        exit 1
    fi
}

# Function to send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "Database Backup $status" "$NOTIFICATION_EMAIL" || true
    fi
}

# Function to create backup metadata
create_metadata() {
    local metadata_file="$BACKUP_DIR/${BACKUP_FILE}.meta"
    
    cat > "$metadata_file" << EOF
{
    "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "database_name": "$DB_NAME",
    "database_host": "$DB_HOST",
    "backup_file": "$BACKUP_FILE.backup",
    "backup_size": "$(stat -f%z "$BACKUP_DIR/$BACKUP_FILE.backup" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILE.backup" 2>/dev/null || echo 'unknown')",
    "retention_days": $RETENTION_DAYS,
    "backup_type": "full",
    "compression": "gzip",
    "format": "custom"
}
EOF
    
    log_info "Backup metadata created: ${BACKUP_FILE}.meta"
}

# Main backup process
main() {
    log_info "=== AI Qualifier Database Backup Started ==="
    log_info "Backup timestamp: $(date)"
    
    # Test database connection
    test_connection
    
    # Create backup
    create_backup
    
    # Validate backup
    validate_backup
    
    # Create metadata
    create_metadata
    
    # Secure backup (optional)
    secure_backup
    
    # Upload to cloud (optional)
    upload_backup
    
    # Clean old backups
    cleanup_old_backups
    
    # Send success notification
    send_notification "SUCCESS" "Database backup completed successfully: $BACKUP_FILE"
    
    log_info "=== AI Qualifier Database Backup Completed ==="
}

# Error handling
trap 'log_error "Backup failed due to an error"; send_notification "FAILED" "Database backup failed"; exit 1' ERR

# Run main function
main

exit 0