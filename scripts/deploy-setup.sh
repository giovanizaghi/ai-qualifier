#!/bin/bash

# AI Qualifier - Quick Deployment Setup Script
# This script helps set up the deployment environment quickly

set -e

echo "🚀 AI Qualifier - Deployment Setup"
echo "=================================="

# Check if Vercel CLI is available
if ! npx vercel --version &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install vercel --save-dev
else
    echo "✅ Vercel CLI already available"
fi

# Login to Vercel
echo "🔐 Logging in to Vercel..."
npx vercel login

# Link the project
echo "🔗 Linking project to Vercel..."
npx vercel link

# Set environment variables
echo "🌍 Setting up environment variables..."
echo "Please provide the following environment variables:"

read -p "DATABASE_URL: " DATABASE_URL
npx vercel env add DATABASE_URL <<< "$DATABASE_URL"

read -p "NEXTAUTH_SECRET (leave empty to generate): " NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
fi
npx vercel env add NEXTAUTH_SECRET <<< "$NEXTAUTH_SECRET"

read -p "NEXTAUTH_URL (your domain): " NEXTAUTH_URL
npx vercel env add NEXTAUTH_URL <<< "$NEXTAUTH_URL"

read -p "OPENAI_API_KEY: " OPENAI_API_KEY
npx vercel env add OPENAI_API_KEY <<< "$OPENAI_API_KEY"

echo "✅ Environment variables configured"

# Deploy to production
echo "🚀 Deploying to production..."
npx vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo "Your application is now live at: $NEXTAUTH_URL"
echo ""
echo "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Set up GitHub Actions secrets (see DEPLOYMENT.md)"
echo "3. Push to main branch to trigger automated deployments"