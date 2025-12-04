# Omnihealth 前端启动脚本
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Omnihealth 前端服务启动" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 检查Node.js安装
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未安装Node.js，请先安装Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 检查npm安装
try {
    $npmVersion = npm --version
    Write-Host "✅ npm版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm未正确安装" -ForegroundColor Red
    exit 1
}

# 进入前端目录
Set-Location frontend

# 检查依赖安装
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 启动Expo开发服务器
Write-Host "🚀 启动Expo开发服务器..." -ForegroundColor Blue
Write-Host "API连接地址: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

npx expo start