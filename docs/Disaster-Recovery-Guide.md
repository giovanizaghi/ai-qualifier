# AI Qualifier Disaster Recovery Guide

This guide provides step-by-step instructions for restoring the AI Qualifier application from backups in case of a disaster.

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Prerequisites](#prerequisites)
3. [Quick Recovery Steps](#quick-recovery-steps)
4. [Detailed Recovery Procedures](#detailed-recovery-procedures)
5. [Testing Recovery](#testing-recovery)
6. [Post-Recovery Checklist](#post-recovery-checklist)
7. [Troubleshooting](#troubleshooting)

## Emergency Contacts

| Role | Contact | Phone | Email |
|------|---------|-------|--------|
| System Administrator | [Name] | [Phone] | [Email] |
| Database Administrator | [Name] | [Phone] | [Email] |
| DevOps Engineer | [Name] | [Phone] | [Email] |
| Emergency Contact | [Name] | [Phone] | [Email] |

## Prerequisites

Before starting the recovery process, ensure you have:

- [ ] Access to backup storage (AWS S3 or local storage)
- [ ] Database restoration environment ready
- [ ] Backup encryption key
- [ ] AWS credentials (if using S3)
- [ ] Docker and Docker Compose installed
- [ ] Network access to required services

## Quick Recovery Steps

For immediate emergency recovery:

### 1. Stop Current Services
```bash
cd /path/to/ai-qualifier
docker-compose -f docker-compose.prod.yml down
```

### 2. Restore Database
```bash
# Find latest backup
./scripts/backup-manager.sh list

# Restore from latest backup
./scripts/backup-manager.sh restore [backup-file] ai_qualifier
```

### 3. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Verify Recovery
```bash
# Check application health
curl -f http://localhost:3000/api/health

# Check database connectivity
docker exec ai-qualifier-db pg_isready
```

## Detailed Recovery Procedures

### Database Recovery

#### From Local Backup
```bash
# 1. List available backups
./scripts/backup-manager.sh list

# 2. Download from S3 (if needed)
./scripts/backup-manager.sh download [backup-name]

# 3. Decrypt backup (if encrypted)
./scripts/backup-manager.sh decrypt [encrypted-backup] [output-file]

# 4. Restore database
./scripts/backup-manager.sh restore [backup-file] [target-database]

# 5. Verify restoration
./scripts/backup-manager.sh verify [target-database]
```

#### From Cloud Storage (S3)
```bash
# 1. Configure AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# 2. List available backups in S3
aws s3 ls s3://your-backup-bucket/ai-qualifier/

# 3. Download backup
aws s3 cp s3://your-backup-bucket/ai-qualifier/backup-file.sql.gz.enc ./

# 4. Follow local backup restoration steps
```

### Full System Recovery

#### Option 1: Docker Compose Recovery
```bash
# 1. Clone or restore application code
git clone https://github.com/your-org/ai-qualifier.git
cd ai-qualifier

# 2. Configure environment variables
cp .env.example .env.prod
# Edit .env.prod with production values

# 3. Restore database (see above)

# 4. Start all services
docker-compose -f docker-compose.prod.yml up -d

# 5. Wait for services to be ready
./scripts/wait-for-services.sh

# 6. Run post-recovery verification
./scripts/verify-recovery.sh
```

#### Option 2: Kubernetes Recovery (if applicable)
```bash
# 1. Apply namespace and configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/

# 2. Deploy database
kubectl apply -f k8s/database/

# 3. Restore database
kubectl exec -it postgres-pod -- psql -U postgres -c "CREATE DATABASE ai_qualifier;"
kubectl cp backup-file.sql postgres-pod:/tmp/
kubectl exec -it postgres-pod -- psql -U postgres ai_qualifier < /tmp/backup-file.sql

# 4. Deploy application
kubectl apply -f k8s/app/

# 5. Verify deployment
kubectl get pods -n ai-qualifier
kubectl logs -f deployment/ai-qualifier-app
```

### Recovery Time Objectives (RTO)

| Component | Target RTO | Estimated Time |
|-----------|------------|----------------|
| Database Recovery | 1 hour | 30-60 minutes |
| Application Restart | 15 minutes | 5-15 minutes |
| Full System Recovery | 2 hours | 1-3 hours |
| SSL/DNS Updates | 4 hours | 2-6 hours |

### Recovery Point Objectives (RPO)

| Backup Type | Frequency | Max Data Loss |
|-------------|-----------|---------------|
| Daily Backups | Every day at 2 AM | 24 hours |
| Weekly Backups | Every Sunday at 3 AM | 7 days |
| Monthly Backups | First day of month at 4 AM | 30 days |

## Testing Recovery

### Automated Recovery Testing
```bash
# Run automated recovery test
./scripts/test-recovery.sh

# Test specific backup
./scripts/test-recovery.sh --backup-file backup-20240115-daily.sql.gz.enc

# Test full disaster recovery simulation
./scripts/test-recovery.sh --full-simulation
```

### Manual Recovery Testing Steps

1. **Prepare Test Environment**
   ```bash
   # Create isolated test environment
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Perform Test Restoration**
   ```bash
   # Restore to test database
   ./scripts/backup-manager.sh restore backup-file.sql test_db
   ```

3. **Validate Data Integrity**
   ```bash
   # Run data validation queries
   ./scripts/validate-data.sh test_db
   ```

4. **Test Application Functionality**
   ```bash
   # Run integration tests
   npm run test:integration
   
   # Run E2E tests
   npm run test:e2e
   ```

5. **Performance Validation**
   ```bash
   # Run performance tests
   npm run test:performance
   ```

## Post-Recovery Checklist

### Immediate Tasks (0-2 hours)

- [ ] Verify database connectivity and data integrity
- [ ] Check application health endpoints
- [ ] Validate user authentication and authorization
- [ ] Test critical application features
- [ ] Monitor system logs for errors
- [ ] Notify stakeholders of recovery status

### Short-term Tasks (2-24 hours)

- [ ] Update DNS records (if needed)
- [ ] Renew SSL certificates (if needed)
- [ ] Verify backup system is working
- [ ] Monitor application performance
- [ ] Review and analyze incident cause
- [ ] Update runbooks based on lessons learned

### Long-term Tasks (1-7 days)

- [ ] Conduct post-incident review
- [ ] Update disaster recovery procedures
- [ ] Test backup and recovery processes
- [ ] Review and update monitoring alerts
- [ ] Train team on recovery procedures
- [ ] Document lessons learned

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Problem: Cannot connect to database
# Solution: Check database status and logs
docker logs ai-qualifier-db
docker exec ai-qualifier-db pg_isready

# Reset database connections
docker restart ai-qualifier-db
```

#### Backup Corruption
```bash
# Problem: Backup file is corrupted
# Solution: Try alternative backup or repair
./scripts/backup-manager.sh verify backup-file.sql
./scripts/backup-manager.sh repair backup-file.sql
```

#### SSL Certificate Issues
```bash
# Problem: SSL certificate expired or invalid
# Solution: Renew certificate or use Let's Encrypt
certbot renew --nginx
docker restart ai-qualifier-nginx
```

#### Performance Issues After Recovery
```bash
# Problem: Application running slowly
# Solution: Analyze and optimize database
docker exec ai-qualifier-db psql -U postgres -d ai_qualifier -c "ANALYZE;"
docker exec ai-qualifier-db psql -U postgres -d ai_qualifier -c "REINDEX DATABASE ai_qualifier;"
```

### Emergency Escalation

If recovery is not successful within the expected timeframe:

1. **Escalate to Senior Team Members**
   - Contact emergency contacts
   - Engage additional technical resources
   - Consider alternative recovery strategies

2. **Communication Protocol**
   - Update incident status page
   - Notify affected users and stakeholders
   - Prepare communication templates

3. **Alternative Recovery Options**
   - Restore to alternative infrastructure
   - Use older backup if recent ones are corrupted
   - Consider partial service restoration

### Log Files and Diagnostics

Important log files for troubleshooting:

```bash
# Application logs
docker logs ai-qualifier-app

# Database logs
docker logs ai-qualifier-db

# Nginx logs
docker logs ai-qualifier-nginx

# Backup logs
tail -f /var/log/ai-qualifier-backup.log

# System logs
journalctl -u docker
```

### Monitoring and Alerts

Key metrics to monitor during recovery:

- Database connection pool status
- Application response times
- Error rates
- Memory and CPU utilization
- Disk space availability
- Network connectivity

### Contact Information

For additional support:

- **Internal Support**: [Internal Contact]
- **Cloud Provider Support**: [AWS/Azure/GCP Support]
- **Database Support**: [PostgreSQL Support]
- **Application Framework Support**: [Next.js Support]

---

**Important**: This guide should be reviewed and updated regularly. Test the recovery procedures periodically to ensure they work as expected.

**Last Updated**: [Date]
**Next Review Date**: [Date]