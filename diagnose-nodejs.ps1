# Node.js Environment Diagnostic Script
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Node.js Environment Diagnostic" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "1. Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Node.js command failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Node.js is NOT installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION:" -ForegroundColor Yellow
    Write-Host "   1. Download and install Node.js from: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "   2. Choose the LTS version (recommended)" -ForegroundColor Cyan
    Write-Host "   3. Make sure to check 'Add to PATH' during installation" -ForegroundColor Cyan
    Write-Host "   4. Restart your terminal/PowerShell after installation" -ForegroundColor Cyan
}

Write-Host ""

# Check if npm is installed
Write-Host "2. Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] npm is installed: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] npm command failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] npm is NOT installed or not in PATH" -ForegroundColor Red
}

Write-Host ""

# Check common Node.js installation paths
Write-Host "3. Checking common Node.js installation paths..." -ForegroundColor Yellow
$commonPaths = @(
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\npm"
)

$found = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "   [FOUND] $path" -ForegroundColor Green
        $found = $true
    }
}

if (-not $found) {
    Write-Host "   [NOT FOUND] Node.js not found in common installation paths" -ForegroundColor Yellow
}

Write-Host ""

# Check PATH environment variable
Write-Host "4. Checking PATH environment variable..." -ForegroundColor Yellow
$pathEnv = $env:PATH -split ';' | Where-Object { $_ -like "*node*" }
if ($pathEnv) {
    Write-Host "   [FOUND] Node.js related paths in PATH:" -ForegroundColor Green
    $pathEnv | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   [NOT FOUND] No Node.js paths in PATH environment variable" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION:" -ForegroundColor Yellow
    Write-Host "   If Node.js is installed but not in PATH, you need to:" -ForegroundColor Cyan
    Write-Host "   1. Find where Node.js is installed" -ForegroundColor Cyan
    Write-Host "   2. Add it to PATH environment variable" -ForegroundColor Cyan
    Write-Host "   3. Restart your terminal/PowerShell" -ForegroundColor Cyan
}

Write-Host ""

# Check if we're already in frontend directory
Write-Host "5. Checking frontend directory..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    Write-Host "   [OK] Frontend directory exists" -ForegroundColor Green
    
    if (Test-Path "frontend\node_modules") {
        Write-Host "   [OK] node_modules directory exists" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] node_modules directory not found" -ForegroundColor Yellow
        Write-Host "   You need to run: cd frontend && npm install" -ForegroundColor Cyan
    }
    
    if (Test-Path "frontend\package.json") {
        Write-Host "   [OK] package.json exists" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] package.json not found" -ForegroundColor Red
    }
} else {
    Write-Host "   [FAIL] Frontend directory not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Diagnostic Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "If Node.js is NOT installed:" -ForegroundColor Yellow
Write-Host "  1. Visit: https://nodejs.org/" -ForegroundColor Cyan
Write-Host "  2. Download and install the LTS version" -ForegroundColor Cyan
Write-Host "  3. Restart your terminal/PowerShell" -ForegroundColor Cyan
Write-Host "  4. Run this script again to verify installation" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Node.js IS installed but not working:" -ForegroundColor Yellow
Write-Host "  1. Restart your terminal/PowerShell" -ForegroundColor Cyan
Write-Host "  2. Check if Node.js path is in PATH environment variable" -ForegroundColor Cyan
Write-Host "  3. Try running: node --version" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once Node.js is working, run:" -ForegroundColor Yellow
Write-Host "  .\start-frontend.ps1" -ForegroundColor Cyan
Write-Host ""

