# Omnihealth 后端启动脚本
Write-Host "======================================" -ForegroundColor Green
Write-Host " Omnihealth 后端服务启动" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# 检查Python虚拟环境
if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    Write-Host "❌ 未找到Python虚拟环境，请先创建虚拟环境" -ForegroundColor Red
    Write-Host "执行: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# 激活虚拟环境
Write-Host "🔄 激活Python虚拟环境..." -ForegroundColor Blue
& .\.venv\Scripts\Activate.ps1

# 检查数据库文件
if (-not (Test-Path "backend\dev.db")) {
    Write-Host "🗄️  初始化数据库..." -ForegroundColor Blue
    python backend\init_db.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库初始化完成" -ForegroundColor Green
    } else {
        Write-Host "❌ 数据库初始化失败" -ForegroundColor Red
        exit 1
    }
}

# 启动后端服务
Write-Host "🚀 启动后端服务 (端口 8000)..." -ForegroundColor Blue
Write-Host "API文档地址: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --app-dir backend --port 8000 --host 127.0.0.1