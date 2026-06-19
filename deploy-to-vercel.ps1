# ContentFlow - Vercel Deployment Script (Windows PowerShell)
# This script deploys both frontend and backend to Vercel

$ErrorActionPreference = "Stop"

Write-Host "ContentFlow - Vercel Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelExists = $null -ne (Get-Command vercel -ErrorAction SilentlyContinue)
if (-not $vercelExists) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check authentication
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
$authCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please authenticate with Vercel..." -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host "Deploying Frontend (apps/web)..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Push-Location apps/web
vercel --prod `
  --env-file "../../.env.production" `
  --name "contentflow-web" `
  --regions "sfo1,iad1,lhr1" `
  --confirm

$frontendUrl = vercel url --prod
Write-Host "Frontend deployed: $frontendUrl" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "Deploying Backend (apps/api)..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Push-Location apps/api
vercel --prod `
  --env-file "../../.env.production" `
  --name "contentflow-api" `
  --regions "sfo1,iad1,lhr1" `
  --confirm

$backendUrl = vercel url --prod
Write-Host "Backend deployed: $backendUrl" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Frontend: $frontendUrl"
Write-Host "Backend:  $backendUrl"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the frontend: $frontendUrl"
Write-Host "2. Test the backend: $backendUrl/health"
Write-Host "3. Monitor in Vercel dashboard"
Write-Host ""
