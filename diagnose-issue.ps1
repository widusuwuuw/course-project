# Diagnostic script for startup issues
Write-Host "======================================" -ForegroundColor Yellow
Write-Host " Omnihealth Startup Diagnostic" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "1. Node.js Check:" -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Node.js not found in PATH" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Node.js not found" -ForegroundColor Red
    Write-Host "   Solution: Install Node.js from https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host ""

# Check npm
Write-Host "2. npm Check:" -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] npm found: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] npm not found in PATH" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] npm not found" -ForegroundColor Red
}

Write-Host ""

# Check Python
Write-Host "3. Python Check:" -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   [OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Python not found" -ForegroundColor Red
}

Write-Host ""

# Check Virtual Environment
Write-Host "4. Virtual Environment Check:" -ForegroundColor Cyan
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "   [OK] Virtual environment exists" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Virtual environment not found" -ForegroundColor Yellow
    Write-Host "   Solution: Run 'python -m venv .venv'" -ForegroundColor Yellow
}

Write-Host ""

# Check Backend Service
Write-Host "5. Backend Service Check:" -ForegroundColor Cyan
try {
    $backendTest = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Backend service is running" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Backend service is not running" -ForegroundColor Red
    Write-Host "   Solution: Run .\start-backend.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Frontend Dependencies
Write-Host "6. Frontend Dependencies Check:" -ForegroundColor Cyan
if (Test-Path "frontend\node_modules") {
    Write-Host "   [OK] node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   [WARN] node_modules not found" -ForegroundColor Yellow
    Write-Host "   Solution: Run 'cd frontend && npm install'" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Yellow
Write-Host " Summary" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "If Node.js is not installed:" -ForegroundColor White
Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor Cyan
Write-Host "  2. Install Node.js (includes npm)" -ForegroundColor Cyan
Write-Host "  3. Restart PowerShell/terminal" -ForegroundColor Cyan
Write-Host "  4. Run .\start-frontend.ps1 again" -ForegroundColor Cyan
Write-Host ""


