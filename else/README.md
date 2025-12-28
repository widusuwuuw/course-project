# Omnihealth — Sprint 1 后端快速起步

本目录包含后端 FastAPI 最小可运行骨架（注册/登录/JWT、体重日志）。

## 运行要求

- Python 3.10+
- Windows PowerShell（命令如下即为 PowerShell 语法）

## 快速开始（本地开发，默认 SQLite）

```powershell
Push-Location "c:\Users\29845\else\Desktop\course-project"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

# 可选：复制环境变量模板（若你需要 PostgreSQL 或修改 SECRET_KEY）
Copy-Item backend\.env.example backend\.env -Force

# 运行 API (http://127.0.0.1:8000/docs)
uvicorn app.main:app --reload --app-dir backend
```

默认使用 `sqlite:///./dev.db`，数据库文件会在 `backend` 目录下生成。若要使用 PostgreSQL，将 `.env.example` 复制为 `.env` 并设置 `DATABASE_URL`，例如：

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/omnihealth
```

## 运行测试

```powershell
Push-Location "c:\Users\29845\else\Desktop\course-project"
.\.venv\Scripts\Activate.ps1
pytest -q backend\tests
```

## 已实现的 API（Sprint 1 范围）

- `POST /register`：注册（email + password）
- `POST /login`：登录（OAuth2PasswordRequestForm：username=email, password）→ 返回 `access_token`
- `GET /health-logs/`：获取当前用户的体重日志（需 `Authorization: Bearer <token>`）
- `POST /health-logs/`：新增体重记录（同上鉴权）

访问 Swagger 文档：`http://127.0.0.1:8000/docs`

## 工程决策

- 后端框架：FastAPI（契合 pydantic v2、内置交互文档、类型驱动）
- 数据库：开发环境默认 SQLite，生产建议 PostgreSQL（已支持 `psycopg`）
- 鉴权：JWT（HS256）
- 测试：pytest + TestClient（无需启动服务器）

## 下一步（前端与更多后端）

- 前端：已初始化 Expo + RN + TypeScript，完成登录/注册/日志最小页面（见 frontend 目录）
- 后端：补充趋势接口与规则引擎雏形（Sprint 3）

## 前端（Expo）运行

```powershell
Push-Location "c:\Users\29845\else\Desktop\course-project\frontend"
npm install
npx expo start
```

- 若在真机演示，请将 `frontend/src/config.ts` 中的 `API_BASE_URL` 改为你电脑的局域网 IP（例如 `http://192.168.1.100:8000`），并确保后端已启动且同网段可访问。
- 在 Expo DevTools 中选择平台（Android/iOS/Web）。Web 模式在 `http://127.0.0.1:8000` 可用时通常可直接联通。
