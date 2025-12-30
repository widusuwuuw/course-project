# Omnihealth Service Check Script
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Omnihealth Service Status Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Backend Service
Write-Host "1. Checking Backend Service (FastAPI)..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Backend service is running" -ForegroundColor Green
    Write-Host "   API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
} catch {
    Write-Host "   [FAIL] Backend service is not running" -ForegroundColor Red
    Write-Host "   Tip: Run .\start-backend.ps1 to start backend" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check Port 8000
Write-Host "2. Checking Port 8000..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "   [OK] Port 8000 is in use (backend may be running)" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Port 8000 is not in use" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check Python Processes
Write-Host "3. Checking Python Processes..." -ForegroundColor Yellow
$pythonProcesses = Get-Process | Where-Object { $_.ProcessName -like "*python*" } -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "   [OK] Found $($pythonProcesses.Count) Python process(es)" -ForegroundColor Green
    $pythonProcesses | Select-Object ProcessName, Id | Format-Table -AutoSize
} else {
    Write-Host "   [WARN] No Python processes found" -ForegroundColor Yellow
}

Write-Host ""

# 4. Check Database File
Write-Host "4. Checking Database File..." -ForegroundColor Yellow
$dbPath = "dev.db"
if (Test-Path $dbPath) {
    $dbInfo = Get-Item $dbPath
    Write-Host "   [OK] Database file exists" -ForegroundColor Green
    Write-Host "   Path: $($dbInfo.FullName)" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($dbInfo.Length / 1KB, 2)) KB" -ForegroundColor Gray
} else {
    Write-Host "   [WARN] Database file not found" -ForegroundColor Yellow
    Write-Host "   Tip: Run python backend\init_db.py to initialize" -ForegroundColor Yellow
}

Write-Host ""

# 5. Check Frontend Service
Write-Host "5. Checking Frontend Service (Expo)..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" } -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   [OK] Found Node.js process(es)" -ForegroundColor Green
    $nodeProcesses | Select-Object ProcessName, Id | Format-Table -AutoSize
} else {
    Write-Host "   [WARN] No Node.js processes found" -ForegroundColor Yellow
    Write-Host "   Tip: Run .\start-frontend.ps1 to start frontend" -ForegroundColor Yellow
}

Write-Host ""

# 6. Test API Endpoint
Write-Host "6. Testing API Endpoint..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "   [OK] API endpoint is accessible (HTTP 200)" -ForegroundColor Green
        
        try {
            $openapiResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/openapi.json" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "   [OK] OpenAPI specification accessible" -ForegroundColor Green
            Write-Host "   API Title: $($openapiResponse.info.title)" -ForegroundColor Gray
            Write-Host "   API Version: $($openapiResponse.info.version)" -ForegroundColor Gray
        } catch {
            Write-Host "   [WARN] OpenAPI spec not accessible" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   [FAIL] Cannot access API endpoint" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Check Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Access Links:" -ForegroundColor Yellow
Write-Host "   - API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "   - API ReDoc: http://127.0.0.1:8000/redoc" -ForegroundColor Cyan
Write-Host ""
