# Deployment Guide - AI Qualifier

This guide covers the complete deployment process for the AI Qualifier application using Vercel and GitHub Actions.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Vercel Setup](#vercel-setup)
- [GitHub Actions Secrets](#github-actions-secrets)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Vercel account
- GitHub repository
- PostgreSQL database (Supabase, Neon, or similar)
- OpenAI API key

## Environment Variables

The following environment variables are required for deployment:

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### How to Generate NEXTAUTH_SECRET

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Vercel Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Your Project

```bash
# In your project directory
vercel link
```

### 4. Set Environment Variables

```bash
# Add each environment variable
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET  
vercel env add NEXTAUTH_URL
vercel env add OPENAI_API_KEY

# Verify environment variables
vercel env ls
```

### 5. Deploy

```bash
# Deploy to production
vercel --prod

# Or use npm script
npm run deploy
```

## GitHub Actions Secrets

To enable automated CI/CD, add the following secrets to your GitHub repository:

### Repository Secrets Setup

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

```bash
# Vercel Integration
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-vercel-org-id
PROJECT_ID=your-vercel-project-id

# Application Environment Variables
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=sk-your-openai-api-key
```

### How to Get Vercel Integration Values

1. **VERCEL_TOKEN**: 
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope

2. **ORG_ID** and **PROJECT_ID**:
   ```bash
   # In your project directory after linking
   cat .vercel/project.json
   ```

## Deployment Process

### Automatic Deployment (Recommended)

1. **Push to Main Branch**: 
   ```bash
   git push origin main
   ```

2. **GitHub Actions will**:
   - Install dependencies
   - Run linting
   - Execute tests
   - Build the application
   - Deploy to Vercel (if tests pass)

### Manual Deployment

```bash
# Quick deployment
npm run deploy

# Preview deployment (for testing)
npm run deploy:preview

# Local build test
npm run ci
```

### Database Migrations

```bash
# Apply database schema changes
npm run db:push

# Generate Prisma client
npm run db:generate

# Open database studio
npm run db:studio
```

## Build Configuration

The project uses the following build configuration:

### Vercel Configuration (`vercel.json`)
- Framework: Next.js
- Build command: `npm run build`
- Install command: `npm ci`
- Max function duration: 30 seconds
- Environment variables automatically injected

### GitHub Actions Configuration (`.github/workflows/ci.yml`)
- Runs on: Ubuntu latest
- Node.js version: 18
- Runs tests before deployment
- Only deploys on main branch

## Monitoring and Logs

### Vercel Dashboard
- Visit [Vercel Dashboard](https://vercel.com/dashboard)
- View deployment logs and function invocations
- Monitor performance and usage

### GitHub Actions
- Check workflow runs in the **Actions** tab
- View build logs and test results
- Monitor deployment status

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check local build
npm run build

# Common fix: clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Environment Variable Issues

```bash
# Verify variables are set
vercel env ls

# Update variables
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

#### 3. Database Connection Issues

```bash
# Test database connection
npm run db:push

# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:port/db?sslmode=require
```

#### 4. Function Timeout

- API routes have 30-second limit on Vercel
- Check function execution time
- Consider background job processing for long tasks

### Useful Commands

```bash
# View deployment logs
vercel logs

# Inspect project configuration
vercel inspect

# Remove deployment
vercel remove

# Redeploy last deployment
vercel redeploy
```

### Support

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **GitHub Actions**: https://docs.github.com/en/actions

## Production Checklist

Before deploying to production, ensure:

- [ ] All environment variables are configured
- [ ] Database is set up and accessible
- [ ] OpenAI API key is valid and has credits
- [ ] Tests are passing locally
- [ ] Build succeeds without errors
- [ ] Domain is configured (if using custom domain)
- [ ] SSL certificate is active
- [ ] Error monitoring is set up (optional)

## Post-Deployment

1. **Test the application**:
   - Authentication flow
   - Company analysis
   - ICP generation
   - Prospect qualification

2. **Monitor performance**:
   - Check Vercel analytics
   - Monitor API response times
   - Watch for errors in logs

3. **Set up alerts** (optional):
   - Configure error notifications
   - Set up uptime monitoring
   - Monitor usage limits

The deployment is now complete and the application should be accessible at your Vercel domain!