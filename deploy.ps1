# macOS Finder Style Image Bed - Deployment Script
# This script builds the frontend and copies files to root for Cloudflare Pages deployment

Write-Host "🚀 Starting deployment process for macOS Finder Style Image Bed..." -ForegroundColor Green

# Step 1: Build the frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location "front"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ".."

# Step 2: Clean old build files from root
Write-Host "🧹 Cleaning old build files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "css", "js", "index.html*", "logo*.png" -ErrorAction SilentlyContinue

# Step 3: Copy new build files to root
Write-Host "📋 Copying new build files to root..." -ForegroundColor Yellow
robocopy "front\dist" "." /E /XF "_redirects" /NFL /NDL /NJH /NJS

# Step 4: Ensure _redirects file is correct
Write-Host "🔧 Configuring redirects..." -ForegroundColor Yellow
$redirectsContent = @"
# Cloudflare Pages Redirects Configuration
# This file handles routing for the macOS Finder-style image bed

# API routes should be handled by Cloudflare Workers functions
/api/* /functions/api/:splat 200

# All other routes should serve the frontend SPA
/* /index.html 200
"@
$redirectsContent | Out-File -FilePath "_redirects" -Encoding UTF8

Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host "📤 Ready to push to GitHub for Cloudflare Pages deployment" -ForegroundColor Cyan
