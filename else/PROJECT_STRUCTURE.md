# Omnihealth 项目文件结构完整说明

## 📁 项目根目录结构

```
course-project/
├── 📄 README.md                    # 项目快速启动说明
├── 📄 project_spec.md              # 详细项目规划文档（6周开发计划）
├── 📄 启动提示词.txt                 # 项目协作说明文档
├── 📄 启动说明.md                   # 启动步骤说明
├── 📄 design1.jpg / design2.jpg     # 设计参考图
├── 📄 HEALTH_ENGINE_TASKS.md        # 医疗引擎任务文档
├── 📄 download-images.js           # 图片下载脚本
├── 📄 reset-password.py            # 密码重置脚本
├── 📄 simple-reset.py              # 简单重置脚本
├── 📄 start-backend.ps1            # 后端启动脚本
├── 📄 start-frontend.ps1           # 前端启动脚本
├── 📄 dev.db                       # SQLite开发数据库
│
├── 📁 .claude/                     # Claude Code配置
│   └── 📄 settings.local.json      # Claude本地设置
│
├── 📁 .git/                        # Git版本控制
├── 📄 .gitignore                   # Git忽略文件
│
├── 📄 .mcp.json                    # MCP服务器配置（shadcn）
│
├── 📁 .pytest_cache/               # Pytest测试缓存
├── 📁 .venv/                       # Python虚拟环境
├── 📁 .vs/                         # Visual Studio缓存
│
├── 📁 backend/                     # 后端FastAPI应用
├── 📁 frontend/                    # 前端React Native应用
└── 📁 photos/                      # 项目图片资源
```

---

## 📁 Backend文件夹详细结构 (`/backend`)

### 🚀 核心应用文件 (`/backend/app/`)

#### **主要模块**
- **`main.py`** - FastAPI应用主入口，路由配置，CORS设置
- **`auth.py`** - 认证路由：注册、登录、JWT token生成
- **`db.py`** - 数据库连接配置和会话管理
- **`models.py`** - SQLAlchemy数据模型定义（用户、健康日志、体检报告）
- **`schemas.py`** - Pydantic数据验证模型
- **`security.py`** - JWT token处理和密码加密
- **`deps.py`** - 依赖注入：数据库会话、用户认证
- **`assistant.py`** - AI助手路由：健康问答API
- **`utils.py`** - 工具函数：健康指标处理、数据转换

#### **路由模块** (`/backend/app/routers/`)
- **`health_logs.py`** - 健康日志CRUD：体重、步数等数据记录
- **`lab.py`** - 体检分析API：实验室指标分析、规则引擎应用

#### **服务层** (`/backend/app/services/`)
- **`__init__.py`** - 服务包初始化
- **`llm_client.py`** - LLM客户端：DashScope API集成
- **`rule_engine.py`** - 医疗规则引擎：健康指标分析、异常检测

#### **测试文件** (`/backend/app/testing.py`)
- 测试工具和Mock数据

### 📊 配置和数据文件

- **`requirements.txt`** - Python依赖包列表
- **`rules.json`** - 医疗规则引擎配置：15+项健康指标阈值
- **`.env.example`** - 环境变量模板
- **`.env`** - 实际环境变量配置

### 📋 数据库文件
- **`dev.db`** - 开发用SQLite数据库
- **`dev.test.db`** - 测试数据库
- **`dev.trends.test.db`** - 趋势分析测试数据库

### 🧪 测试模块 (`/backend/tests/`)
- **`test_auth.py`** - 认证功能测试
- **`test_health_logs.py`** - 健康日志测试
- **`test_assistant.py`** - AI助手测试
- **`test_trends.py`** - 趋势分析测试

### 🔧 开发工具脚本
- **`init_db.py`** - 数据库初始化脚本
- **`check_users.py`** - 用户检查工具
- **`debug_rule_engine.py`** - 规则引擎调试工具
- **`fix_operators.py`** - 修复操作符脚本
- **`test_gender_assessment.py`** - 性别评估测试
- **`test_login.py`** - 登录测试
- **`update_gender.py`** - 性别信息更新工具

---

## 📁 Frontend文件夹详细结构 (`/frontend`)

### 📱 应用入口和配置
- **`App.tsx`** - React Native应用主入口，路由配置
- **`App.test.tsx`** - App组件测试
- **`index.js`** - 应用启动入口
- **`app.json`** - Expo应用配置
- **`package.json`** - Node.js依赖配置
- **`tsconfig.json`** - TypeScript配置
- **`tailwind.config.js`** - Tailwind CSS配置
- **`babel.config.js`** - Babel转译配置
- **`global.css`** - 全局样式文件

### 🎨 资源文件 (`/frontend/assets/`)
- **`images/`** - 应用图片资源
  - `fitness-tracking.jpg` - 健身追踪图片
  - `health-monitoring.jpg` - 健康监测图片
  - `meditation-wellness.jpg` - 冥想健康图片
  - `nutrition-management.jpg` - 营养管理图片

### 💻 源代码 (`/frontend/src/`)

#### **API层** (`/frontend/src/api/`)
- **`client.ts`** - API客户端配置，请求拦截器

#### **组件库** (`/frontend/src/components/`)

##### **核心组件**
- **`Button.tsx`** - 通用按钮组件
- **`HealthCard.tsx`** - 健康数据卡片
- **`HealthChart.tsx`** - 健康数据图表
- **`HealthIcon.tsx`** - 健康图标组件
- **`AchievementBadge.tsx`** - 成就徽章
- **`GradientBackground.tsx`** - 渐变背景
- **`HealthCheckIn.tsx`** - 健康打卡
- **`FamilyHealthCare.tsx`** - 家庭医疗保健

##### **健康追踪组件** (`/frontend/src/components/HealthTracker/`)
- **`DailyCheckIn.tsx`** - 每日打卡
- **`HealthScore.tsx`** - 健康评分

##### **现代化UI组件** (`/frontend/src/components/Web3UI/`)
- **`GlassCard.tsx`** - 玻璃态卡片
- **`NeonCard.tsx`** - 霓虹灯卡片
- **`Web3BackgroundSimple.tsx`** - 简化Web3背景
- **`Web3Progress.tsx`** - Web3进度条

##### **Shadcn UI组件** (`/frontend/src/components/ui/`)
- **`ShadcnButton.tsx`** - Shadcn风格按钮

##### **其他组件**
- **`ModernHealthCards.tsx`** - 现代健康卡片
- **`OptimizedDashboard.tsx`** - 优化仪表板
- **`PersonalizedRecommendations.tsx`** - 个性化推荐

#### **屏幕页面** (`/frontend/src/screens/`)

##### **主要功能页面**
- **`LoginScreen.tsx`** - 登录页面
- **`RegisterScreen.tsx`** - 注册页面
- **`AssistantScreen.tsx`** - AI助手页面
- **`HealthLogsScreen.tsx`** - 健康日志页面
- **`HealthTrackerDashboard.tsx`** - 健康追踪仪表板

##### **专业医疗分析页面** (`/frontend/src/screens/main/`)
- **`HomeScreen.tsx`** - 主页仪表板
- **`LabAnalysisScreen.tsx`** - 实验室分析总览
- **`BloodRoutineScreen.tsx`** - 血常规分析
- **`LiverFunctionScreen.tsx`** - 肝功能分析
- **`KidneyFunctionScreen.tsx`** - 肾功能分析
- **`LipidMetabolismScreen.tsx`** - 血脂代谢分析
- **`GlucoseMetabolismScreen.tsx`** - 葡萄糖代谢分析
- **`ElectrolyteScreen.tsx`** - 电解质分析
- **`OtherMetricsScreen.tsx`** - 其他指标分析
- **`AIAssistantScreen.tsx`** - AI助手页面

##### **生活功能页面** (`/frontend/src/screens/main/`)
- **`ProfileScreen.tsx`** - 个人资料
- **`NutritionScreen.tsx`** - 营养管理
- **`WorkoutScreen.tsx`** - 运动计划
- **`SportsTrainingScreen.tsx`** - 体育训练
- **`CommunityScreen.tsx`** - 社区功能
- **`CourseCenterScreen.tsx`** - 课程中心
- **`ShopScreen.tsx`** - 商城功能

##### **其他功能页面**
- **`AchievementsScreen.tsx`** - 成就页面

#### **类型定义** (`/frontend/src/types/`)
- **`health.ts`** - 健康数据类型定义

#### **工具函数** (`/frontend/src/utils/`)
- **`achievements.ts`** - 成就系统工具

#### **上下文管理** (`/frontend/src/contexts/`)
- **`ThemeContext.tsx`** - 主题管理上下文

### 🧪 开发和测试文件
- **`debug-background.html`** - 背景调试页面
- **`test-registration.js`** - 注册功能测试
- **`dev.db`** - 开发数据库

### 📄 文档文件
- **`MODERN_UI_SETUP.md`** - 现代化UI设置指南
- **`SHADCN_HEALTH_UI_GUIDE.md`** - Shadcn健康UI组件指南

### 🔧 备份文件 (.bak)
这些是开发过程中的备份文件，包含多个UI组件的旧版本：
- `ShadcnCard.tsx.bak`, `ShadcnButton.tsx.bak` 等UI组件备份
- `ModernDashboard.tsx.bak`, `AssistantScreenV2.tsx.bak` 等页面备份

---

## 🔌 MCP相关文件

### **MCP配置**
- **`.mcp.json`** - MCP服务器配置，包含shadcn组件库支持

### **Shadcn集成**
- **`frontend/SHADCN_HEALTH_UI_GUIDE.md`** - 详细的Shadcn UI组件使用指南
- **`frontend/src/components/ui/ShadcnButton.tsx`** - Shadcn按钮组件实现

---

## 🧹 中间迭代产生的临时文件

### **开发调试文件**
- `backend/debug_rule_engine.py` - 规则引擎调试工具
- `backend/test_*.py` - 各种测试脚本
- `frontend/debug-background.html` - 前端调试页面

### **测试数据库**
- `backend/dev.test.db`, `backend/dev.trends.test.db` - 测试专用数据库

### **备份文件** (.bak)
包含`.bak`后缀的文件都是开发过程中的版本备份，可以安全删除。

---

## 💡 项目特色功能

### **后端特色**
1. **智能医疗规则引擎** - 支持15+项健康指标自动分析
2. **AI健康助手** - 集成DashScope大语言模型
3. **JWT认证系统** - 安全的用户认证
4. **性别差异化分析** - 针对不同性别的健康标准

### **前端特色**
1. **现代化UI设计** - 玻璃态、渐变、Web3风格
2. **专业医疗界面** - 完整的体检指标分析展示
3. **Shadcn组件库** - 统一的设计语言
4. **响应式设计** - 适配不同屏幕尺寸

### **技术栈整合**
- **后端**: FastAPI + SQLAlchemy + PostgreSQL/SQLite
- **前端**: React Native + Expo + TypeScript + Tailwind CSS
- **AI**: 阿里云DashScope LLM
- **MCP**: Shadcn UI组件库集成

---

## 🚀 快速启动

1. **启动后端**: 运行 `start-backend.ps1`
2. **启动前端**: 运行 `start-frontend.ps1`
3. **访问API文档**: http://127.0.0.1:8000/docs

这个项目展现了现代全栈开发的最佳实践，结合了医疗健康领域的专业性和现代UI设计的美观性。