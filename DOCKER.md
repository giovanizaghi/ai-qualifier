# Docker Setup for AI Qualifier

This document provides instructions for running the AI Qualifier application using Docker in both development and production environments.

## Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project directory**
   ```bash
   git clone <repository-url>
   cd ai-qualifier
   ```

2. **Copy environment files**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your development settings
   ```

3. **Start development environment**
   ```bash
   ./docker.sh dev:start
   # OR
   npm run docker:dev
   ```

4. **Access the application**
   - Application: http://localhost:3000
   - Database Admin (Adminer): http://localhost:8080
   - MailHog (Email testing): http://localhost:8025
   - Redis: localhost:6380

### Production Environment

1. **Prepare production environment**
   ```bash
   cp .env.production.example .env.production.local
   # Edit .env.production.local with your production settings
   ```

2. **Deploy to production**
   ```bash
   ./docker.sh prod:deploy
   # OR
   npm run docker:prod:deploy
   ```

## Docker Commands

### Development Commands

```bash
# Start development environment
./docker.sh dev:start

# Stop development environment
./docker.sh dev:stop

# Restart development environment
./docker.sh dev:restart

# View logs
./docker.sh dev:logs --follow

# Access application container shell
./docker.sh dev:shell

# Access development database
./docker.sh dev:db
```

### Production Commands

```bash
# Start production environment
./docker.sh prod:start

# Stop production environment
./docker.sh prod:stop

# Deploy with backup and health checks
./docker.sh prod:deploy

# View production logs
./docker.sh prod:logs --follow

# Access production container shell
./docker.sh prod:shell

# Access production database
./docker.sh prod:db
```

### Build Commands

```bash
# Build all images
./docker.sh build

# Build development images only
./docker.sh build:dev

# Build production images only
./docker.sh build:prod

# Build with no cache
./docker.sh build:prod --no-cache
```

### Backup and Maintenance

```bash
# Create database backup
./docker.sh backup

# Restore from backup
./docker.sh restore /path/to/backup.sql

# Check application health
./docker.sh health

# View container status
./docker.sh status

# Clean up unused resources
./docker.sh cleanup
```

### Monitoring

```bash
# Start monitoring stack (Grafana, Prometheus, Loki)
./docker.sh monitoring:start

# Stop monitoring stack
./docker.sh monitoring:stop
```

## Environment Configuration

### Required Environment Variables

Create `.env.production.local` for production with these required variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@database:5432/ai_qualifier
DATABASE_PASSWORD=your_secure_password

# Authentication
NEXTAUTH_SECRET=your_32_character_secret
NEXTAUTH_URL=https://your-domain.com

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key

# Redis
REDIS_PASSWORD=your_redis_password

# Optional: Email
RESEND_API_KEY=your_resend_api_key

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Optional Services

Enable optional services using Docker Compose profiles:

```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Start with Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up -d

# Start with Traefik reverse proxy
docker-compose -f docker-compose.prod.yml --profile traefik up -d
```

## Architecture

### Development Stack

- **App**: Next.js development server with hot reload
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Email**: MailHog for testing
- **Admin**: Adminer for database management

### Production Stack

- **App**: Next.js production build
- **Database**: PostgreSQL 15 with optimizations
- **Cache**: Redis 7 with persistence
- **Reverse Proxy**: Nginx or Traefik
- **Monitoring**: Prometheus, Grafana, Loki (optional)
- **Backup**: Automated database backups

## Volumes and Data Persistence

### Development
- `postgres_dev_data`: Development database data
- `redis_dev_data`: Development Redis data

### Production
- `postgres_data`: Production database data
- `redis_data`: Production Redis data with AOF persistence
- `prometheus_data`: Monitoring metrics data
- `grafana_data`: Grafana configuration and dashboards
- `loki_data`: Log aggregation data
- `traefik_data`: SSL certificates and configuration

## Networking

### Development Network
- `ai-qualifier-dev-network`: Bridge network for development services

### Production Network
- `ai-qualifier-network`: Bridge network with subnet 172.20.0.0/16

## Health Checks

All services include health checks:

- **App**: HTTP health endpoint (`/api/health`)
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping command
- **Nginx**: Process check

## Security Considerations

### Production Security Features

1. **Non-root containers**: All containers run as non-root users
2. **Security headers**: Comprehensive HTTP security headers
3. **SSL/TLS**: Automatic HTTPS with Let's Encrypt (Traefik) or manual certificates (Nginx)
4. **Rate limiting**: API and authentication endpoint protection
5. **Network isolation**: Services communicate through dedicated network
6. **Secrets management**: Environment variables for sensitive data

### Database Security

- Application-specific database user with limited privileges
- Connection pooling and timeout configuration
- Backup encryption (optional)
- SSL connections in production

## Monitoring and Logging

### Metrics (Prometheus)
- Application performance metrics
- Database connection pools
- Redis cache hit rates
- HTTP request metrics

### Dashboards (Grafana)
- Application performance dashboard
- Infrastructure monitoring
- Business metrics

### Logging (Loki)
- Application logs
- Access logs
- Error tracking
- Log aggregation and search

## Backup Strategy

### Automated Backups
- Daily database backups
- 30-day retention by default
- Backup validation
- Optional cloud storage upload (S3)

### Manual Backup
```bash
# Create immediate backup
./docker.sh backup

# Restore from backup
./docker.sh restore backups/ai_qualifier_backup_20251019_140000.sql
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3000
   # Change ports in docker-compose files if needed
   ```

2. **Permission issues**
   ```bash
   # Make scripts executable
   chmod +x docker.sh scripts/*.sh
   ```

3. **Out of disk space**
   ```bash
   # Clean up Docker resources
   ./docker.sh cleanup
   docker system prune -a
   ```

4. **Database connection issues**
   ```bash
   # Check database logs
   ./docker.sh prod:logs --service database
   # Verify environment variables
   ```

### Log Analysis

```bash
# View specific service logs
./docker.sh prod:logs --service app --follow

# Check all services
./docker.sh status

# Health check
./docker.sh health
```

## Performance Tuning

### Database Optimization
- Connection pooling configured
- Query optimization settings
- Memory allocation tuning

### Application Optimization
- Next.js standalone output
- Image optimization
- Static asset caching

### Nginx Optimization
- Gzip compression
- Static file caching
- Connection keepalive
- Rate limiting

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- Redis clustering
- CDN integration

### Vertical Scaling
- Resource limits in docker-compose
- Database memory tuning
- Application worker processes

## Development Workflow

1. **Start development environment**
   ```bash
   ./docker.sh dev:start
   ```

2. **Make code changes** (hot reload enabled)

3. **Run tests**
   ```bash
   docker-compose -f docker-compose.dev.yml exec app npm test
   ```

4. **View logs**
   ```bash
   ./docker.sh dev:logs --follow
   ```

5. **Access database for debugging**
   ```bash
   ./docker.sh dev:db
   ```

## Production Deployment

1. **Prepare environment**
   ```bash
   cp .env.production.example .env.production.local
   # Configure production variables
   ```

2. **Deploy**
   ```bash
   ./docker.sh prod:deploy
   ```

3. **Monitor**
   ```bash
   ./docker.sh monitoring:start
   # Access Grafana at http://localhost:3001
   ```

4. **Backup**
   ```bash
   ./docker.sh backup
   ```

## Support

For issues related to Docker setup:
1. Check this documentation
2. Review Docker logs
3. Verify environment configuration
4. Check resource availability (CPU, memory, disk)

---

**Note**: Always test thoroughly in a development environment before deploying to production.