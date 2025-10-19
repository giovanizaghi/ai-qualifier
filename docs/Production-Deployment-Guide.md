# AI Qualifier Production Deployment Guide

This comprehensive guide walks you through deploying the AI Qualifier application to production with all Phase 7.1 components configured.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Environment Configuration](#environment-configuration)
4. [Domain and DNS Configuration](#domain-and-dns-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Security Configuration](#security-configuration)
7. [Application Deployment](#application-deployment)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Maintenance and Updates](#maintenance-and-updates)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores
- **Network**: Public IP address and domain name

### Required Software
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- SSL certificate (Let's Encrypt recommended)

### Required Accounts/Services
- Domain registrar account
- DNS provider (Cloudflare/Route53 recommended)
- Email service for notifications (optional)
- Cloud storage for backups (AWS S3 recommended)

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip ufw fail2ban

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for Docker group membership
```

### 2. Clone Repository

```bash
# Clone the AI Qualifier repository
git clone https://github.com/your-org/ai-qualifier.git
cd ai-qualifier

# Checkout the main branch
git checkout main
```

## Environment Configuration

### 1. Create Production Environment File

```bash
# Copy environment template
cp .env.example .env.prod

# Edit environment variables
nano .env.prod
```

### 2. Required Environment Variables

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# Database
DATABASE_URL=postgresql://postgres:your-db-password@database:5432/ai_qualifier
PGHOST=database
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your-db-password
PGDATABASE=ai_qualifier

# Redis
REDIS_URL=redis://redis:6379

# Email (optional)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Authentication
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
SESSION_SECRET=your-session-secret

# Cloud Storage (for backups)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BACKUP_BUCKET=your-backup-bucket

# Monitoring
ADMIN_EMAIL=admin@yourdomain.com
SLACK_WEBHOOK_URL=your-slack-webhook-url

# Domain
DOMAIN_NAME=yourdomain.com
```

### 3. Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate backup encryption key
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32
```

## Domain and DNS Configuration

### 1. Configure DNS

Run the domain setup script:

```bash
# Manual DNS configuration
sudo ./scripts/setup-domain.sh -d yourdomain.com

# With Cloudflare (if you have API token)
sudo ./scripts/setup-domain.sh -d yourdomain.com --dns-provider cloudflare --cloudflare-token YOUR_TOKEN

# With Route53 (if you have hosted zone)
sudo ./scripts/setup-domain.sh -d yourdomain.com --dns-provider route53 --route53-zone-id YOUR_ZONE_ID
```

### 2. Add DNS Records

If using manual DNS configuration, add these records to your DNS provider:

```
# A Records
yourdomain.com.         300  IN  A     YOUR_SERVER_IP
www.yourdomain.com.     300  IN  A     YOUR_SERVER_IP

# Optional: CAA Records for Let's Encrypt
yourdomain.com.         300  IN  CAA   0 issue "letsencrypt.org"
```

### 3. Wait for DNS Propagation

```bash
# Check DNS propagation
dig yourdomain.com A
nslookup yourdomain.com
```

## SSL Certificate Setup

### 1. Run SSL Setup Script

```bash
# Setup SSL certificates with Let's Encrypt
sudo ./scripts/setup-ssl.sh -d yourdomain.com -e admin@yourdomain.com
```

### 2. Verify SSL Configuration

```bash
# Test SSL certificate
curl -I https://yourdomain.com

# Check certificate details
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 -showcerts
```

## Security Configuration

### 1. Configure Firewall

```bash
# Run firewall configuration script
sudo ./scripts/configure-firewall.sh

# Custom configuration with admin IPs
sudo ADMIN_IP_WHITELIST="192.168.1.100,10.0.0.50" ./scripts/configure-firewall.sh
```

### 2. Verify Security Configuration

```bash
# Check firewall status
sudo ufw status verbose

# Check fail2ban status
sudo fail2ban-client status

# Verify security headers
curl -I https://yourdomain.com
```

## Application Deployment

### 1. Build and Start Services

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Start with monitoring and backup services
docker-compose -f docker-compose.prod.yml --profile monitoring --profile backup up -d
```

### 2. Initialize Database

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 3. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Test application health
curl https://yourdomain.com/api/health
```

## Monitoring and Logging

### 1. Access Monitoring Dashboards

- **Grafana**: http://your-server-ip:3001 (default: admin/admin)
- **Prometheus**: http://your-server-ip:9090

### 2. Configure Grafana

1. Log in to Grafana
2. Add Prometheus data source: `http://prometheus:9090`
3. Import provided dashboards from `/config/grafana/`

### 3. Set Up Log Aggregation

```bash
# View aggregated logs
docker-compose -f docker-compose.prod.yml logs -f

# Check Loki logs
curl http://your-server-ip:3100/ready
```

## Backup and Recovery

### 1. Test Backup System

```bash
# Run manual backup
docker-compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup-manager.sh daily

# List backups
docker-compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup-manager.sh list

# Test restore (to test database)
docker-compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup-manager.sh restore backup-file.sql test_db
```

### 2. Verify Backup Configuration

```bash
# Check backup service status
docker-compose -f docker-compose.prod.yml exec backup curl -f http://localhost:8080/health

# Check backup logs
docker-compose -f docker-compose.prod.yml logs backup
```

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Test main application
curl -f https://yourdomain.com

# Test API endpoints
curl -f https://yourdomain.com/api/health
curl -f https://yourdomain.com/api/auth/session

# Test redirects
curl -I http://yourdomain.com  # Should redirect to HTTPS
curl -I https://www.yourdomain.com  # Should redirect to main domain
```

### 2. Security Testing

```bash
# Test security headers
curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

# Test rate limiting
for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/health; done

# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 yourdomain.com
```

### 3. Performance Testing

```bash
# Run load tests
cd load-tests
node basic-load-test.js

# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
```

## Maintenance and Updates

### 1. Regular Maintenance Tasks

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Update system packages
sudo apt update && sudo apt upgrade -y

# Renew SSL certificates (automatic via cron)
sudo certbot renew --dry-run

# Clean up old Docker images
docker system prune -a
```

### 2. Monitoring Tasks

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error
```

### 3. Backup Verification

```bash
# Test backup integrity weekly
./scripts/test-backup-integrity.sh

# Verify backup uploads to cloud storage
aws s3 ls s3://your-backup-bucket/ai-qualifier/
```

## Troubleshooting

### Common Issues and Solutions

#### Application Won't Start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Check database connection
docker-compose -f docker-compose.prod.yml exec database pg_isready

# Reset services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Check Nginx configuration
sudo nginx -t
```

#### DNS Issues

```bash
# Check DNS resolution
dig yourdomain.com A
nslookup yourdomain.com 8.8.8.8

# Check DNS propagation
./scripts/check-dns-propagation.sh yourdomain.com
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Check database performance
docker-compose -f docker-compose.prod.yml exec database psql -U postgres -d ai_qualifier -c "SELECT * FROM pg_stat_activity;"

# Analyze slow queries
docker-compose -f docker-compose.prod.yml logs database | grep "slow query"
```

### Emergency Procedures

#### Service Recovery

```bash
# Emergency restart
docker-compose -f docker-compose.prod.yml restart

# Rollback to previous version
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Recovery

```bash
# Restore from latest backup
./scripts/backup-manager.sh restore latest ai_qualifier

# Check database integrity
docker-compose -f docker-compose.prod.yml exec database pg_dump --schema-only ai_qualifier
```

## Support and Documentation

### Log Locations

- Application logs: `docker-compose logs app`
- Nginx logs: `/var/log/nginx/`
- SSL logs: `/var/log/letsencrypt/`
- Backup logs: `/var/log/ai-qualifier-backup.log`
- Firewall logs: `/var/log/ufw.log`

### Configuration Files

- Environment: `.env.prod`
- Nginx: `config/nginx.conf`, `config/nginx-site.conf`
- SSL: `config/nginx-ssl.conf`
- Security: `config/security.conf`
- Backup: `config/backup.conf`

### Monitoring URLs

- Application: `https://yourdomain.com`
- Health check: `https://yourdomain.com/api/health`
- Grafana: `http://your-server-ip:3001`
- Prometheus: `http://your-server-ip:9090`

### Emergency Contacts

Update these with your actual contact information:

- **System Administrator**: [Name] - [Email] - [Phone]
- **DevOps Engineer**: [Name] - [Email] - [Phone]
- **Database Administrator**: [Name] - [Email] - [Phone]

---

**Last Updated**: [Date]
**Next Review**: [Date]

For additional support, refer to the individual component documentation in the `/docs` directory.