# Quick Deployment Guide

## Option 1: Automated Setup (Recommended)

Run the setup script to configure everything automatically:

```bash
./scripts/deploy-setup.sh
```

This script will:
- Install Vercel CLI
- Login to Vercel
- Link your project
- Set up environment variables
- Deploy to production

## Option 2: Manual Setup

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel login
vercel link
vercel --prod
```

### 3. Set Environment Variables
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL  
vercel env add OPENAI_API_KEY
```

## GitHub Actions Setup

Add these secrets to your GitHub repository:
- `VERCEL_TOKEN`
- `ORG_ID` 
- `PROJECT_ID`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`

## Available Scripts

```bash
npm run deploy          # Deploy to production
npm run deploy:preview  # Deploy preview
npm run ci             # Run full CI pipeline locally
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).