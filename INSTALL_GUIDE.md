# Omnihealth 安装和启动指南

## 当前状态诊断

根据诊断脚本，发现以下问题：

### ✅ 正常的部分
- **后端服务 (FastAPI)**: 正在运行 ✓
- **Python**: 已安装 (Python 3.12.7) ✓
- **数据库**: 存在 ✓
- **前端依赖**: node_modules 存在 ✓

### ❌ 需要解决的问题
- **Node.js/npm**: 未安装或不在 PATH 中 ✗
- **虚拟环境**: 不存在（但后端已运行，可能不是问题）

## 解决方案

### 问题：前端无法启动

**原因**: Node.js 和 npm 未安装或不在系统 PATH 中

**解决方法**:

#### 方法1：安装 Node.js（推荐）

1. **下载 Node.js**
   - 访问: https://nodejs.org/
   - 下载 LTS 版本（推荐）
   - 或者直接下载: https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi

2. **安装 Node.js**
   - 运行下载的安装程序
   - 按照向导完成安装（默认会添加到 PATH）
   - **重要**: 确保勾选 "Add to PATH" 选项

3. **验证安装**
   ```powershell
   # 重新打开 PowerShell 或 CMD
   node --version
   npm --version
   ```

4. **启动前端服务**
   ```powershell
   .\start-frontend.ps1
   ```

#### 方法2：手动添加到 PATH（如果已安装但找不到）

1. **查找 Node.js 安装位置**
   - 常见位置：
     - `C:\Program Files\nodejs\`
     - `C:\Program Files (x86)\nodejs\`
     - `%LOCALAPPDATA%\Programs\nodejs\`

2. **添加到系统 PATH**
   - 打开 "系统属性" > "环境变量"
   - 在 "系统变量" 中找到 "Path"
   - 添加 Node.js 安装目录
   - 重启 PowerShell

#### 方法3：使用 nvm-windows（如果已安装）

如果使用 nvm (Node Version Manager)，运行：
```powershell
nvm use <version>
# 或
nvm install lts
nvm use lts
```

## 快速检查命令

运行诊断脚本检查所有组件：
```powershell
.\diagnose-issue.ps1
```

运行服务状态检查：
```powershell
.\check-services.ps1
```

## 完整启动流程

### 1. 启动后端服务
```powershell
.\start-backend.ps1
```

### 2. 启动前端服务（需要 Node.js）
```powershell
.\start-frontend.ps1
```

### 3. 访问应用
- **API 文档**: http://127.0.0.1:8000/docs
- **前端应用**: Expo 启动后会显示二维码和 URL

## 仅测试后端（无需 Node.js）

如果只需要测试后端 API，可以：
1. 后端服务已经在运行 ✓
2. 访问 http://127.0.0.1:8000/docs 查看和测试 API
3. 使用 Postman 或其他 API 工具测试接口

## 常见问题

### Q: 安装 Node.js 后仍然找不到命令？
A: 需要重新打开 PowerShell/CMD 终端，让 PATH 环境变量生效

### Q: 前端依赖已存在，还需要安装吗？
A: 如果 node_modules 已存在，通常不需要重新安装，但如果有问题可以运行：
```powershell
cd frontend
npm install
```

### Q: 后端服务无法启动？
A: 检查：
1. Python 是否安装
2. 虚拟环境是否存在（如果不存在，后端似乎也在运行，可能使用了全局 Python）
3. 端口 8000 是否被占用

## 联系支持

如果遇到其他问题，请检查：
- Python 版本: `python --version`
- Node.js 版本: `node --version` (如果已安装)
- 错误日志: 查看终端输出的错误信息


