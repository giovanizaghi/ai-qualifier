# GitHub Actions Secrets Setup Guide

## Required Secrets for AI Qualifier Deployment

### Vercel Integration Secrets

Based on your project configuration, add these **exact values** to your GitHub repository secrets:

#### 1. VERCEL_TOKEN
- Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
- Click "Create Token"
- Name: `GitHub Actions - AI Qualifier`
- Scope: Full Account
- **Copy the token value to GitHub secrets as `VERCEL_TOKEN`**

#### 2. ORG_ID
```
team_Oy0ewr8tQrstfa711QXtrXLF
```

#### 3. PROJECT_ID  
```
prj_xt8kGsOfMwTkLir8kSju4l7xUF36
```

### Application Environment Variables

#### 4. DATABASE_URL
Your PostgreSQL connection string (example format):
```
postgresql://username:password@host:port/database?sslmode=require
```

#### 5. NEXTAUTH_SECRET
Generate a secure random string:
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

#### 6. NEXTAUTH_URL
Your production domain (will be provided after first Vercel deployment):
```
https://your-app-name.vercel.app
```

#### 7. OPENAI_API_KEY
Your OpenAI API key:
```
sk-your-openai-api-key-here
```

## How to Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/giovanizaghi/ai-qualifier
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one:

### Add These Secrets:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `VERCEL_TOKEN` | (Generate from Vercel) | [Vercel Tokens](https://vercel.com/account/tokens) |
| `ORG_ID` | `team_Oy0ewr8tQrstfa711QXtrXLF` | Already provided above |
| `PROJECT_ID` | `prj_xt8kGsOfMwTkLir8kSju4l7xUF36` | Already provided above |
| `DATABASE_URL` | Your PostgreSQL URL | Your database provider |
| `NEXTAUTH_SECRET` | Generate random string | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your domain | Will get after deployment |
| `OPENAI_API_KEY` | Your OpenAI key | [OpenAI Platform](https://platform.openai.com/api-keys) |

## Verification

After adding all secrets, they should look like this in GitHub:
- ✅ VERCEL_TOKEN
- ✅ ORG_ID  
- ✅ PROJECT_ID
- ✅ DATABASE_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL
- ✅ OPENAI_API_KEY

## Next Steps

1. **Add all secrets to GitHub** (follow steps above)
2. **Make a test commit** to trigger the CI/CD pipeline
3. **Monitor the GitHub Actions workflow** in the Actions tab
4. **Verify deployment** works correctly

## Quick Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Test local deployment
npm run deploy:preview

# Deploy to production manually
npm run deploy
```

Your project is now ready for automated CI/CD! 🚀