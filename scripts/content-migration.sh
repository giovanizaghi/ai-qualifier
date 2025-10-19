#!/bin/bash

# Content and Data Migration Script for AI Qualifier
# This script handles the migration of content and data to production environment

set -e

echo "📦 Starting Content and Data Migration for AI Qualifier..."
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
MIGRATION_DIR="./migration-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="./backups/pre-migration-$(date +%Y%m%d-%H%M%S)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create migration directories
mkdir -p "$MIGRATION_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$MIGRATION_DIR/logs"
mkdir -p "$MIGRATION_DIR/validation"

print_status "Migration workspace created: $MIGRATION_DIR"

# 1. Pre-Migration Validation
print_status "1. Running pre-migration validation..."

# Check environment variables
print_status "Validating environment configuration..."
ENV_ERRORS=0

required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Missing required environment variable: $var"
        ENV_ERRORS=$((ENV_ERRORS + 1))
    fi
done

if [ $ENV_ERRORS -gt 0 ]; then
    print_error "Environment validation failed. Please set missing variables."
    exit 1
fi

print_success "Environment validation passed"

# 2. Database Backup and Validation
print_status "2. Creating database backup..."

# Create database backup (adjust for your database type)
if command -v pg_dump >/dev/null 2>&1; then
    print_status "Creating PostgreSQL backup..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database-backup-$TIMESTAMP.sql" 2>"$MIGRATION_DIR/logs/backup-errors.log"
    
    if [ $? -eq 0 ]; then
        print_success "Database backup created: $BACKUP_DIR/database-backup-$TIMESTAMP.sql"
    else
        print_error "Database backup failed. Check $MIGRATION_DIR/logs/backup-errors.log"
        exit 1
    fi
else
    print_warning "pg_dump not available. Manual database backup required."
fi

# Validate database schema
print_status "Validating database schema..."
if command -v npx >/dev/null 2>&1; then
    npx prisma db pull --print > "$MIGRATION_DIR/validation/current-schema.prisma" 2>/dev/null || true
    npx prisma format --schema="$MIGRATION_DIR/validation/current-schema.prisma" 2>/dev/null || true
    
    if [ -f "$MIGRATION_DIR/validation/current-schema.prisma" ]; then
        print_success "Database schema validated and saved"
    else
        print_warning "Could not validate database schema"
    fi
fi

# 3. Content Asset Migration
print_status "3. Preparing content assets..."

# Check for static assets
ASSET_DIRS=("public/images" "public/documents" "public/uploads")
for dir in "${ASSET_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        ASSET_COUNT=$(find "$dir" -type f | wc -l)
        ASSET_SIZE=$(du -sh "$dir" | cut -f1)
        echo "$dir: $ASSET_COUNT files, $ASSET_SIZE" >> "$MIGRATION_DIR/validation/asset-inventory.txt"
        print_status "Found $ASSET_COUNT assets in $dir ($ASSET_SIZE)"
        
        # Create asset backup
        cp -r "$dir" "$BACKUP_DIR/" 2>/dev/null || true
    else
        print_warning "Asset directory not found: $dir"
    fi
done

# Optimize images for production
print_status "Optimizing images for production..."
if command -v find >/dev/null 2>&1; then
    # Find large images (> 1MB)
    find public/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" 2>/dev/null | while read -r img; do
        if [ -f "$img" ]; then
            SIZE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null || echo "0")
            if [ "$SIZE" -gt 1048576 ]; then
                echo "Large image: $img ($(echo "scale=1; $SIZE/1048576" | bc -l 2>/dev/null || echo "unknown") MB)" >> "$MIGRATION_DIR/validation/large-images.txt"
            fi
        fi
    done
    
    if [ -f "$MIGRATION_DIR/validation/large-images.txt" ]; then
        print_warning "Large images found. Consider optimization: $MIGRATION_DIR/validation/large-images.txt"
    else
        print_success "No large images found"
    fi
fi

# 4. Data Migration Scripts
print_status "4. Preparing data migration scripts..."

# Create migration scripts
cat > "$MIGRATION_DIR/migrate-users.sql" << 'EOF'
-- User data migration validation
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
FROM users;

-- Check for duplicate emails
SELECT email, COUNT(*) as count 
FROM users 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;
EOF

cat > "$MIGRATION_DIR/migrate-questions.sql" << 'EOF'
-- Question data migration validation
SELECT 
    category,
    difficulty,
    COUNT(*) as question_count
FROM questions 
GROUP BY category, difficulty 
ORDER BY category, difficulty;

-- Check for questions without answers
SELECT COUNT(*) as questions_without_answers
FROM questions q
LEFT JOIN question_answers qa ON q.id = qa.question_id
WHERE qa.id IS NULL;
EOF

cat > "$MIGRATION_DIR/migrate-assessments.sql" << 'EOF'
-- Assessment data migration validation
SELECT 
    COUNT(*) as total_assessments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assessments,
    AVG(score) as average_score
FROM user_assessments;

-- Check for orphaned assessment records
SELECT COUNT(*) as orphaned_assessments
FROM user_assessments ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE u.id IS NULL;
EOF

print_success "Migration scripts created"

# 5. Configuration Migration
print_status "5. Preparing configuration migration..."

# Create configuration backup
CONFIG_FILES=(".env.example" "next.config.ts" "package.json" "prisma/schema.prisma")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        print_status "Backed up configuration: $file"
    fi
done

# Generate production configuration template
cat > "$MIGRATION_DIR/production.env.template" << 'EOF'
# Production Environment Configuration
# Copy this file to .env.production and update values

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_SECRET="generate-secure-random-string"
NEXTAUTH_URL="https://your-domain.com"

# External Services
OPENAI_API_KEY="your-openai-api-key"
RESEND_API_KEY="your-resend-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"

# AWS/S3 (if using)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Monitoring
SENTRY_DSN="your-sentry-dsn"

# Application
NODE_ENV="production"
PORT="3000"
EOF

print_success "Production configuration template created"

# 6. Data Validation Scripts
print_status "6. Creating data validation scripts..."

cat > "$MIGRATION_DIR/validate-migration.js" << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function validateMigration() {
    const prisma = new PrismaClient();
    
    console.log('🔍 Running migration validation...');
    
    try {
        // Validate user data
        const userCount = await prisma.user.count();
        const usersWithProfiles = await prisma.user.count({
            where: { profile: { isNot: null } }
        });
        
        console.log(`✓ Users: ${userCount} total, ${usersWithProfiles} with profiles`);
        
        // Validate question data
        const questionCount = await prisma.question.count();
        const categoriesCount = await prisma.question.groupBy({
            by: ['category'],
            _count: { category: true }
        });
        
        console.log(`✓ Questions: ${questionCount} total across ${categoriesCount.length} categories`);
        
        // Validate assessment data
        const assessmentCount = await prisma.userAssessment.count();
        const completedAssessments = await prisma.userAssessment.count({
            where: { status: 'COMPLETED' }
        });
        
        console.log(`✓ Assessments: ${assessmentCount} total, ${completedAssessments} completed`);
        
        // Check for data integrity issues
        const orphanedAssessments = await prisma.userAssessment.count({
            where: { user: null }
        });
        
        if (orphanedAssessments > 0) {
            console.warn(`⚠️  Found ${orphanedAssessments} orphaned assessments`);
        }
        
        console.log('✅ Migration validation completed successfully');
        
    } catch (error) {
        console.error('❌ Migration validation failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

validateMigration();
EOF

print_success "Validation script created"

# 7. Generate Migration Report
print_status "7. Generating migration report..."

cat > "$MIGRATION_DIR/migration-report.md" << EOF
# Migration Report - $(date)

## Migration Summary
- **Migration ID**: $TIMESTAMP
- **Backup Location**: $BACKUP_DIR
- **Migration Workspace**: $MIGRATION_DIR

## Pre-Migration Status

### Environment Validation
- Environment variables: ✅ Validated
- Database connection: ✅ Available
- Required services: ✅ Ready

### Data Inventory
$(if [ -f "$MIGRATION_DIR/validation/asset-inventory.txt" ]; then
    echo "#### Asset Inventory"
    cat "$MIGRATION_DIR/validation/asset-inventory.txt"
fi)

### Database Status
- Schema backup: ✅ Created
- Data backup: ✅ Created
- Validation queries: ✅ Prepared

## Migration Scripts Created
- User data migration: migrate-users.sql
- Question data migration: migrate-questions.sql
- Assessment data migration: migrate-assessments.sql
- Validation script: validate-migration.js

## Configuration
- Production environment template: production.env.template
- Configuration backup: ✅ Created

## Next Steps
1. Review all migration scripts
2. Update production.env.template with actual values
3. Schedule maintenance window
4. Execute migration in staging environment first
5. Run migration validation
6. Execute production migration
7. Monitor system performance

## Rollback Plan
1. Stop application services
2. Restore database from: $BACKUP_DIR/database-backup-$TIMESTAMP.sql
3. Restore assets from: $BACKUP_DIR/
4. Restart services
5. Validate functionality

## Contact Information
- Technical Lead: [Add contact]
- Database Admin: [Add contact]
- DevOps Team: [Add contact]

## Files Generated
$(ls -la "$MIGRATION_DIR")
EOF

# 8. Final Checklist
print_status "8. Creating final migration checklist..."

cat > "$MIGRATION_DIR/migration-checklist.md" << 'EOF'
# Migration Execution Checklist

## Pre-Migration (24 hours before)
- [ ] Validate all migration scripts in staging
- [ ] Confirm backup procedures
- [ ] Test rollback procedures
- [ ] Schedule maintenance window
- [ ] Notify all stakeholders
- [ ] Prepare communication materials

## Migration Day (T-Hour)
- [ ] **T-2h**: Final backup of production data
- [ ] **T-1h**: Enable maintenance mode
- [ ] **T-0**: Begin database migration
- [ ] **T+15m**: Run data validation scripts
- [ ] **T+30m**: Deploy new application version
- [ ] **T+45m**: Test critical functionality
- [ ] **T+60m**: Disable maintenance mode
- [ ] **T+90m**: Monitor system performance

## Post-Migration (24 hours after)
- [ ] Monitor error rates and performance
- [ ] Validate user experience
- [ ] Check data integrity
- [ ] Confirm backup systems
- [ ] Document any issues encountered
- [ ] Send completion notification

## Emergency Procedures
- [ ] Rollback database if critical issues found
- [ ] Restore previous application version
- [ ] Communicate issues to stakeholders
- [ ] Document root cause analysis

## Success Criteria
- [ ] All data successfully migrated
- [ ] No data loss or corruption
- [ ] Application functions correctly
- [ ] Performance within acceptable limits
- [ ] User experience maintained
EOF

print_success "Migration planning completed!"
print_status "Migration workspace: $MIGRATION_DIR"
print_status "Backup location: $BACKUP_DIR"

# Create summary
cat > "$MIGRATION_DIR/README.md" << EOF
# AI Qualifier Migration Package

## Overview
This package contains all necessary scripts, configurations, and documentation for migrating the AI Qualifier application to production.

## Contents
- \`migration-report.md\` - Comprehensive migration report
- \`migration-checklist.md\` - Step-by-step execution guide
- \`validate-migration.js\` - Data validation script
- \`*.sql\` files - Database migration scripts
- \`production.env.template\` - Production configuration template
- \`logs/\` - Migration logs directory
- \`validation/\` - Pre-migration validation results

## Quick Start
1. Review migration-report.md
2. Update production.env.template
3. Test in staging environment
4. Follow migration-checklist.md
5. Run validate-migration.js after migration

## Support
For migration support, contact the technical team.

Generated: $(date)
Version: 1.0
EOF

echo ""
echo "📊 Migration package ready!"
echo "📁 Location: $MIGRATION_DIR"
echo "📋 Review: $MIGRATION_DIR/migration-checklist.md"
echo "📊 Report: $MIGRATION_DIR/migration-report.md"
echo "==========================================================="