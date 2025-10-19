#!/bin/bash

# Advanced Database Backup and Restore System for AI Qualifier
# This script provides comprehensive backup and disaster recovery capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_CONFIG_FILE="$PROJECT_ROOT/config/backup.conf"

# Default configuration
DEFAULT_BACKUP_DIR="/backups"
DEFAULT_RETENTION_DAYS=30
DEFAULT_BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
DEFAULT_ENCRYPTION=true
DEFAULT_COMPRESSION=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Load configuration
load_config() {
    if [ -f "$BACKUP_CONFIG_FILE" ]; then
        source "$BACKUP_CONFIG_FILE"
        log_info "Loaded configuration from $BACKUP_CONFIG_FILE"
    else
        log_warning "Configuration file not found, using defaults"
    fi

    # Set defaults if not configured
    BACKUP_DIR=${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}
    RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}
    BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-$DEFAULT_BACKUP_SCHEDULE}
    ENABLE_ENCRYPTION=${ENABLE_ENCRYPTION:-$DEFAULT_ENCRYPTION}
    ENABLE_COMPRESSION=${ENABLE_COMPRESSION:-$DEFAULT_COMPRESSION}

    # Database configuration
    DB_HOST=${DB_HOST:-${PGHOST:-database}}
    DB_PORT=${DB_PORT:-${PGPORT:-5432}}
    DB_NAME=${DB_NAME:-${PGDATABASE:-ai_qualifier}}
    DB_USER=${DB_USER:-${PGUSER:-postgres}}
    DB_PASSWORD=${DB_PASSWORD:-$PGPASSWORD}

    # Cloud storage configuration
    AWS_S3_BUCKET=${AWS_S3_BUCKET:-$AWS_S3_BACKUP_BUCKET}
    AWS_REGION=${AWS_REGION:-$AWS_S3_REGION}

    # Validation
    if [ -z "$DB_PASSWORD" ]; then
        log_error "Database password not configured"
        exit 1
    fi
}

# Create backup directory structure
setup_backup_directory() {
    local dirs=(
        "$BACKUP_DIR"
        "$BACKUP_DIR/database"
        "$BACKUP_DIR/database/daily"
        "$BACKUP_DIR/database/weekly"
        "$BACKUP_DIR/database/monthly"
        "$BACKUP_DIR/files"
        "$BACKUP_DIR/logs"
        "$BACKUP_DIR/metadata"
        "$BACKUP_DIR/temp"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        log_info "Created backup directory: $dir"
    done
}

# Generate backup filename
generate_backup_filename() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="ai_qualifier_${backup_type}_${timestamp}"
    echo "$filename"
}

# Create database backup
create_database_backup() {
    local backup_type=${1:-daily}
    local backup_dir="$BACKUP_DIR/database/$backup_type"
    local filename=$(generate_backup_filename "db_$backup_type")
    local backup_path="$backup_dir/$filename"

    log_info "Starting database backup ($backup_type)..."

    # Test database connection
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log_error "Cannot connect to database"
        return 1
    fi

    # Create backup with custom format (for parallel restore)
    log_info "Creating custom format backup..."
    if ! PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --no-acl \
        --no-owner \
        --format=custom \
        --compress=9 \
        --jobs=4 \
        --file="$backup_path.custom"; then
        log_error "Custom format backup failed"
        return 1
    fi

    # Create SQL format backup (for easier inspection)
    log_info "Creating SQL format backup..."
    if ! PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --no-acl \
        --no-owner \
        --file="$backup_path.sql"; then
        log_error "SQL format backup failed"
        return 1
    fi

    # Compress SQL backup if enabled
    if [ "$ENABLE_COMPRESSION" = true ]; then
        log_info "Compressing SQL backup..."
        gzip "$backup_path.sql"
        backup_sql_file="$backup_path.sql.gz"
    else
        backup_sql_file="$backup_path.sql"
    fi

    # Encrypt backups if enabled
    if [ "$ENABLE_ENCRYPTION" = true ] && [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log_info "Encrypting backups..."
        
        # Encrypt custom format backup
        openssl enc -aes-256-cbc -salt \
            -in "$backup_path.custom" \
            -out "$backup_path.custom.enc" \
            -k "$BACKUP_ENCRYPTION_KEY"
        rm "$backup_path.custom"
        
        # Encrypt SQL backup
        openssl enc -aes-256-cbc -salt \
            -in "$backup_sql_file" \
            -out "$backup_sql_file.enc" \
            -k "$BACKUP_ENCRYPTION_KEY"
        rm "$backup_sql_file"
        
        backup_custom_file="$backup_path.custom.enc"
        backup_sql_file="$backup_sql_file.enc"
    else
        backup_custom_file="$backup_path.custom"
    fi

    # Create backup metadata
    create_backup_metadata "$filename" "$backup_type" "$backup_custom_file" "$backup_sql_file"

    # Verify backup integrity
    verify_backup_integrity "$backup_custom_file"

    log_success "Database backup completed: $filename"
    echo "$filename"
}

# Create backup metadata
create_backup_metadata() {
    local filename=$1
    local backup_type=$2
    local custom_file=$3
    local sql_file=$4
    local metadata_file="$BACKUP_DIR/metadata/${filename}.json"

    local custom_size=$(stat -f%z "$custom_file" 2>/dev/null || stat -c%s "$custom_file" 2>/dev/null || echo 0)
    local sql_size=$(stat -f%z "$sql_file" 2>/dev/null || stat -c%s "$sql_file" 2>/dev/null || echo 0)

    cat > "$metadata_file" << EOF
{
    "backup_id": "$filename",
    "backup_type": "$backup_type",
    "database_name": "$DB_NAME",
    "database_host": "$DB_HOST",
    "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "files": {
        "custom_format": {
            "path": "$custom_file",
            "size": $custom_size,
            "compressed": true,
            "encrypted": $([ "$ENABLE_ENCRYPTION" = true ] && echo true || echo false)
        },
        "sql_format": {
            "path": "$sql_file",
            "size": $sql_size,
            "compressed": $([ "$ENABLE_COMPRESSION" = true ] && echo true || echo false),
            "encrypted": $([ "$ENABLE_ENCRYPTION" = true ] && echo true || echo false)
        }
    },
    "retention_until": "$(date -d "+$RETENTION_DAYS days" -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "verification": {
        "verified": false,
        "verification_date": null,
        "checksum": null
    },
    "cloud_storage": {
        "uploaded": false,
        "upload_date": null,
        "cloud_path": null
    }
}
EOF

    log_info "Created backup metadata: $metadata_file"
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file=$1
    log_info "Verifying backup integrity..."

    if [[ "$backup_file" == *.enc ]]; then
        # For encrypted files, we can only verify the encryption worked
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            log_success "Encrypted backup file exists and is not empty"
            return 0
        else
            log_error "Encrypted backup file is missing or empty"
            return 1
        fi
    elif [[ "$backup_file" == *.custom ]]; then
        # Verify custom format backup
        if PGPASSWORD="$DB_PASSWORD" pg_restore --list "$backup_file" >/dev/null 2>&1; then
            log_success "Backup integrity verification passed"
            return 0
        else
            log_error "Backup integrity verification failed"
            return 1
        fi
    else
        log_warning "Cannot verify backup integrity for this format"
        return 0
    fi
}

# Upload backup to cloud storage
upload_to_cloud() {
    local backup_file=$1
    local cloud_path="database-backups/$(basename "$backup_file")"

    if [ -z "$AWS_S3_BUCKET" ]; then
        log_warning "AWS S3 bucket not configured, skipping cloud upload"
        return 0
    fi

    log_info "Uploading backup to S3: s3://$AWS_S3_BUCKET/$cloud_path"

    if command -v aws >/dev/null 2>&1; then
        if aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/$cloud_path" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log_success "Backup uploaded to S3 successfully"
            
            # Update metadata
            local metadata_file="$BACKUP_DIR/metadata/$(basename "$backup_file" | cut -d. -f1).json"
            if [ -f "$metadata_file" ]; then
                jq --arg path "$cloud_path" --arg date "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" \
                    '.cloud_storage.uploaded = true | .cloud_storage.upload_date = $date | .cloud_storage.cloud_path = $path' \
                    "$metadata_file" > "$metadata_file.tmp" && mv "$metadata_file.tmp" "$metadata_file"
            fi
            
            return 0
        else
            log_error "Failed to upload backup to S3"
            return 1
        fi
    else
        log_error "AWS CLI not available"
        return 1
    fi
}

# List available backups
list_backups() {
    local backup_type=${1:-all}
    
    log_info "Available backups:"
    echo ""
    
    if [ "$backup_type" = "all" ]; then
        find "$BACKUP_DIR/database" -name "*.json" -type f | sort
    else
        find "$BACKUP_DIR/database/$backup_type" -name "*.json" -type f | sort
    fi | while read -r metadata_file; do
        if [ -f "$metadata_file" ]; then
            local backup_id=$(jq -r '.backup_id' "$metadata_file")
            local backup_date=$(jq -r '.backup_date' "$metadata_file")
            local backup_type=$(jq -r '.backup_type' "$metadata_file")
            local custom_size=$(jq -r '.files.custom_format.size' "$metadata_file")
            local cloud_uploaded=$(jq -r '.cloud_storage.uploaded' "$metadata_file")
            
            printf "%-30s %-10s %-20s %-10s %-10s\n" \
                "$backup_id" \
                "$backup_type" \
                "$backup_date" \
                "$(numfmt --to=iec $custom_size)" \
                "$([ "$cloud_uploaded" = "true" ] && echo "☁️  Yes" || echo "No")"
        fi
    done
}

# Restore database from backup
restore_database() {
    local backup_id=$1
    local target_db=${2:-$DB_NAME}
    
    if [ -z "$backup_id" ]; then
        log_error "Backup ID is required"
        return 1
    fi

    local metadata_file="$BACKUP_DIR/metadata/${backup_id}.json"
    
    if [ ! -f "$metadata_file" ]; then
        log_error "Backup metadata not found: $metadata_file"
        return 1
    fi

    local custom_file=$(jq -r '.files.custom_format.path' "$metadata_file")
    local is_encrypted=$(jq -r '.files.custom_format.encrypted' "$metadata_file")
    
    log_warning "This will restore database '$target_db' from backup '$backup_id'"
    log_warning "ALL EXISTING DATA WILL BE LOST!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Restore cancelled"
        return 0
    fi

    # Decrypt if necessary
    local restore_file="$custom_file"
    if [ "$is_encrypted" = "true" ]; then
        log_info "Decrypting backup..."
        restore_file="$BACKUP_DIR/temp/$(basename "$custom_file" .enc)"
        
        if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
            log_error "Encryption key not provided"
            return 1
        fi
        
        openssl enc -aes-256-cbc -d \
            -in "$custom_file" \
            -out "$restore_file" \
            -k "$BACKUP_ENCRYPTION_KEY"
    fi

    log_info "Restoring database from backup..."
    
    # Drop existing database connections
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "postgres" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$target_db' AND pid <> pg_backend_pid();" \
        >/dev/null 2>&1 || true

    # Restore database
    if PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$target_db" \
        --clean \
        --if-exists \
        --jobs=4 \
        --verbose \
        "$restore_file"; then
        
        log_success "Database restored successfully"
        
        # Clean up temporary files
        if [ "$is_encrypted" = "true" ] && [ -f "$restore_file" ]; then
            rm "$restore_file"
        fi
        
        return 0
    else
        log_error "Database restore failed"
        
        # Clean up temporary files
        if [ "$is_encrypted" = "true" ] && [ -f "$restore_file" ]; then
            rm "$restore_file"
        fi
        
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local cleanup_count=0
    
    find "$BACKUP_DIR/database" -name "*.custom*" -o -name "*.sql*" | while read -r backup_file; do
        local file_date=$(stat -f%m "$backup_file" 2>/dev/null || stat -c%Y "$backup_file" 2>/dev/null)
        local current_date=$(date +%s)
        local age_days=$(( (current_date - file_date) / 86400 ))
        
        if [ "$age_days" -gt "$RETENTION_DAYS" ]; then
            log_info "Removing old backup: $(basename "$backup_file") (${age_days} days old)"
            rm "$backup_file"
            cleanup_count=$((cleanup_count + 1))
        fi
    done
    
    # Clean up metadata files for removed backups
    find "$BACKUP_DIR/metadata" -name "*.json" | while read -r metadata_file; do
        local backup_id=$(basename "$metadata_file" .json)
        local custom_file="$BACKUP_DIR/database"/*/"${backup_id}.custom"*
        local sql_file="$BACKUP_DIR/database"/*/"${backup_id}.sql"*
        
        if [ ! -f $custom_file ] && [ ! -f $sql_file ]; then
            log_info "Removing orphaned metadata: $(basename "$metadata_file")"
            rm "$metadata_file"
        fi
    done
    
    log_success "Cleanup completed. Removed $cleanup_count old backups"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="✅"
        local color="good"
        
        if [ "$status" = "ERROR" ]; then
            emoji="❌"
            color="danger"
        elif [ "$status" = "WARNING" ]; then
            emoji="⚠️"
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji Backup $status: $message\", \"color\":\"$color\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
    
    # Email notification
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "AI Qualifier Backup $status" "$NOTIFICATION_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Create backup schedule
create_backup_schedule() {
    local cron_file="/etc/cron.d/ai-qualifier-backup"
    local script_path="$SCRIPT_DIR/backup-manager.sh"
    
    log_info "Creating backup schedule..."
    
    cat > "$cron_file" << EOF
# AI Qualifier automated backup schedule
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Daily backup at 2 AM
$BACKUP_SCHEDULE root $script_path daily >/dev/null 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 root $script_path weekly >/dev/null 2>&1

# Monthly backup on 1st day at 4 AM
0 4 1 * * root $script_path monthly >/dev/null 2>&1

# Cleanup old backups daily at 5 AM
0 5 * * * root $script_path cleanup >/dev/null 2>&1
EOF

    log_success "Backup schedule created: $cron_file"
}

# Show help
show_help() {
    cat << EOF
AI Qualifier Backup and Restore Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    backup [daily|weekly|monthly]    Create database backup
    restore <backup_id> [target_db]  Restore database from backup
    list [daily|weekly|monthly|all]  List available backups
    cleanup                          Remove old backups
    schedule                         Set up automated backup schedule
    verify <backup_id>               Verify backup integrity
    upload <backup_file>             Upload backup to cloud storage

Options:
    --config <file>                  Use custom configuration file
    --backup-dir <path>              Override backup directory
    --retention <days>               Override retention period
    --no-encryption                  Disable backup encryption
    --no-compression                 Disable backup compression
    --help                           Show this help message

Examples:
    $0 backup daily                  Create daily backup
    $0 restore ai_qualifier_db_daily_20241019_140000  Restore from backup
    $0 list weekly                   List weekly backups
    $0 cleanup                       Remove old backups

Environment Variables:
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
    AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    BACKUP_ENCRYPTION_KEY, SLACK_WEBHOOK_URL, NOTIFICATION_EMAIL

EOF
}

# Main function
main() {
    local command=$1
    shift

    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config)
                BACKUP_CONFIG_FILE="$2"
                shift 2
                ;;
            --backup-dir)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --no-encryption)
                ENABLE_ENCRYPTION=false
                shift
                ;;
            --no-compression)
                ENABLE_COMPRESSION=false
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done

    # Load configuration
    load_config

    # Setup backup directory
    setup_backup_directory

    # Execute command
    case $command in
        backup)
            local backup_type=${1:-daily}
            if backup_id=$(create_database_backup "$backup_type"); then
                # Upload to cloud if configured
                if [ -n "$AWS_S3_BUCKET" ]; then
                    local backup_file="$BACKUP_DIR/database/$backup_type/${backup_id}.custom"
                    [ "$ENABLE_ENCRYPTION" = true ] && backup_file="${backup_file}.enc"
                    upload_to_cloud "$backup_file"
                fi
                send_notification "SUCCESS" "Database backup completed: $backup_id"
            else
                send_notification "ERROR" "Database backup failed"
                exit 1
            fi
            ;;
        restore)
            local backup_id=$1
            local target_db=$2
            restore_database "$backup_id" "$target_db"
            ;;
        list)
            local backup_type=${1:-all}
            list_backups "$backup_type"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        schedule)
            create_backup_schedule
            ;;
        verify)
            local backup_id=$1
            local metadata_file="$BACKUP_DIR/metadata/${backup_id}.json"
            if [ -f "$metadata_file" ]; then
                local custom_file=$(jq -r '.files.custom_format.path' "$metadata_file")
                verify_backup_integrity "$custom_file"
            else
                log_error "Backup not found: $backup_id"
                exit 1
            fi
            ;;
        upload)
            local backup_file=$1
            upload_to_cloud "$backup_file"
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Error handling
trap 'log_error "Script failed on line $LINENO"; exit 1' ERR

# Run main function
main "$@"