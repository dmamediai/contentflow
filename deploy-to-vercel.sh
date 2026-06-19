#!/bin/bash

# ContentFlow - Vercel Deployment Script
# This script deploys both frontend and backend to Vercel

set -e

echo "🚀 ContentFlow - Vercel Deployment"
echo "=================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if authenticated
echo "🔐 Checking Vercel authentication..."
vercel whoami || {
    echo "⏳ Please authenticate with Vercel..."
    vercel login
}

echo ""
echo "📦 Deploying Frontend (apps/web)..."
echo "=================================="

cd apps/web
vercel --prod \
  --env-file ../../.env.production \
  --name "contentflow-web" \
  --regions "sfo1,iad1,lhr1" \
  --confirm

FRONTEND_URL=$(vercel url --prod)
echo "✅ Frontend deployed: $FRONTEND_URL"

cd ../..

echo ""
echo "📦 Deploying Backend (apps/api)..."
echo "=================================="

cd apps/api
vercel --prod \
  --env-file ../../.env.production \
  --name "contentflow-api" \
  --regions "sfo1,iad1,lhr1" \
  --confirm

BACKEND_URL=$(vercel url --prod)
echo "✅ Backend deployed: $BACKEND_URL"

cd ../..

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Test the frontend: $FRONTEND_URL"
echo "2. Test the backend: $BACKEND_URL/health"
echo "3. Monitor in Vercel dashboard"
echo ""
