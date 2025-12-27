# Omnihealth 项目开发报告

## 一、开发目标与设计思路

### 1.1 项目定位

**Omnihealth** 是一款面向普通大众的**AI个性化健康教练应用**，核心定位为：

> "基于专业医学引擎的个人健康助手" —— 通过 AI 分析用户体检数据，提供个性化的运动、饮食和生活方式建议。

### 1.2 核心设计思想：两层数据架构

AI教练系统基于**两层数据**进行个性化计划生成：

```
┌─────────────────────────────────────────────────────────────┐
│                    一级数据（长期/主要）                      │
│              来源：医学体检报告（权威、稳定）                  │
├─────────────────────────────────────────────────────────────┤
│  UserHealthProfile 表                                        │
│  • 46项健康指标（血常规11 + 肝功能9 + 肾功能8 + 血脂7 +      │
│    血糖5 + 电解质6）                                         │
│  • 增量更新机制：每次只更新提交的指标，保留历史值             │
│  • 每个指标独立时间戳：记录最后更新时间                       │
│  • 更新频率：数月一次（随体检周期）                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      医学规则引擎分析          │
              │  • 异常指标识别                │
              │  • 风险等级评估                │
              │  • 医学禁忌/约束提取           │
              └───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    二级数据（短期/次要）                      │
│              来源：用户手动输入（个性化、可变）               │
├─────────────────────────────────────────────────────────────┤
│  UserPreferences 表（待实现）                                │
│  • 饮食偏好：口味、菜系、过敏原、禁忌食材                    │
│  • 运动偏好：类型、频率、时长、强度、时间段                  │
│  • 生活习惯：作息、工作性质、压力水平                        │
│  • 更新频率：用户随时可调整                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      AI个性化计划生成          │
              │  （结合一级+二级数据）          │
              └───────────────────────────────┘
```

### 1.3 AI教练计划层次结构

```
长期计划（1个月）
    ├── 本月健康改善目标（如：血糖从6.5降到6.0）
    ├── 本月重点改善领域优先级排序
    ├── 本月医学约束/禁忌提醒
    └── 月末评估标准

周计划（每周生成）
    ├── 本周7天运动安排（运动类型、时长、强度）
    ├── 本周饮食重点（推荐食材、避免食材）
    └── 本周习惯养成任务

日计划（每天可调整）
    ├── 今日三餐具体建议
    ├── 今日运动项目（含替代方案）
    └── 今日生活提醒
```

### 1.4 技术架构：神经符号AI（Neuro-Symbolic AI）

系统采用**规则引擎 + LLM**的混合架构：

```
用户体检数据
      │
      ▼
┌─────────────────┐     
│  医学规则引擎    │◄── rules.json（46条规则，性别特定阈值）
│  (符号推理)      │
│  • 阈值判断      │
│  • 风险分级      │
│  • 医学约束提取  │
└─────────────────┘
      │
      │ 结构化分析结果
      ▼
┌─────────────────┐
│  DeepSeek LLM   │◄── 围栏式提示词（严格约束）
│  (神经生成)      │
│  • 自然语言报告  │
│  • 个性化建议    │
│  • 计划生成      │
└─────────────────┘
```

**设计原理**：
- **规则引擎**：确保医学准确性，避免AI产生不安全的建议
- **LLM**：生成自然语言报告，提供用户友好的表达
- **围栏式提示词**：限制AI只能基于规则引擎结果生成内容，不能凭空推断

---

## 二、当前项目架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| **后端** | Python 3.10+ / FastAPI 0.110+ / SQLAlchemy 2.0+ |
| **数据库** | PostgreSQL |
| **AI服务** | DeepSeek API（deepseek-chat模型） |
| **前端** | React Native 0.74.5 / Expo ~51.0.10 / TypeScript 5.3.3 |
| **UI框架** | NativeWind 4.2.1（Tailwind CSS for RN） |
| **导航** | React Navigation（Stack + Bottom Tabs） |

### 2.2 目录结构

```
course-project/
├── backend/                          # 后端服务
│   ├── app/
│   │   ├── main.py                   # FastAPI 入口
│   │   ├── models.py                 # 数据库模型
│   │   ├── schemas.py                # Pydantic 模式
│   │   ├── db.py                     # 数据库连接
│   │   ├── auth.py                   # 认证逻辑
│   │   ├── security.py               # JWT安全
│   │   ├── assistant.py              # AI助手接口
│   │   │
│   │   ├── services/                 # 核心服务层
│   │   │   ├── rule_engine.py        # ★ 医学规则引擎
│   │   │   ├── deepseek_client.py    # DeepSeek API客户端
│   │   │   ├── llm_client.py         # LLM通用接口
│   │   │   └── exercise_prescription_service.py
│   │   │
│   │   ├── data/                     # 元数据库
│   │   │   ├── exercise_database.py  # ★ 运动数据库（20种运动）
│   │   │   ├── food_database.py      # 食材数据结构定义
│   │   │   └── food_ingredients_data.py  # ★ 营养数据库（23种食材）
│   │   │
│   │   ├── routers/                  # API路由
│   │   │   ├── lab.py                # ★ 体检分析API
│   │   │   └── health_logs.py        # 健康日志API
│   │   │
│   │   └── api/
│   │       └── exercise_prescription.py  # 运动处方API
│   │
│   ├── rules.json                    # ★ 46条医学规则配置
│   ├── requirements.txt              # Python依赖
│   └── *.py                          # 各类辅助脚本
│
├── frontend/                         # 前端应用
│   ├── App.tsx                       # 应用入口
│   ├── src/
│   │   ├── config.ts                 # 配置（API地址等）
│   │   ├── api/
│   │   │   └── client.ts             # API客户端封装
│   │   │
│   │   ├── screens/                  # 页面组件
│   │   │   ├── LoginScreen.tsx       # 登录页
│   │   │   ├── RegisterScreen.tsx    # 注册页
│   │   │   ├── AssistantScreen.tsx   # AI助手页
│   │   │   ├── HealthLogsScreen.tsx  # 健康日志页
│   │   │   ├── HealthTrackerDashboard.tsx  # 首页仪表盘
│   │   │   └── main/                 # 主要功能页
│   │   │       └── LabAnalysisScreen.tsx  # ★ 体检分析页
│   │   │
│   │   ├── components/               # 可复用组件
│   │   └── contexts/                 # React Context
│   │
│   └── package.json                  # 前端依赖
│
└── else/                             # 项目文档
    ├── project_spec.md               # 项目规格说明
    ├── FUNCTION_CLARITY.md           # 功能定位梳理
    └── *.md                          # 其他设计文档
```

---

## 三、核心模块详解

### 3.1 数据库模型 (`backend/app/models.py`)

```python
# 用户表
class User:
    id, email, password_hash, gender, created_at

# 健康日志表（日常记录）
class HealthLog:
    id, user_id, metric_type, value1, unit, logged_at

# 体检报告表（历史档案 - 每次提交创建新记录）
class LabReport:
    id, user_id, report_date, gender
    total_metrics, abnormal_metrics
    overall_status, overall_risk_level
    summary, recommendations, category
    ai_body_report  # AI生成的报告

# 体检结果详情表（关联LabReport）
class LabResult:
    id, report_id
    metric_key, metric_name, metric_name_en
    value, unit, status, risk_level
    normal_range_min, normal_range_max, message

# ★ 用户健康档案卡（最新值汇总 - 每用户一条，增量更新）
class UserHealthProfile:
    id, user_id, gender
    
    # 46项健康指标（每项2个字段：值 + 更新时间）
    wbc, wbc_updated_at              # 白细胞
    rbc, rbc_updated_at              # 红细胞
    ...
    uric_acid, uric_acid_updated_at  # 尿酸
    ...
    
    # AI综合报告
    ai_comprehensive_report          # 基于完整画像生成
    ai_report_generated_at
    
    # 辅助方法
    def get_metrics_for_analysis() -> dict   # 获取所有非空指标
    def update_metrics(metrics: dict)        # 增量更新
```

**关键设计**：
- `LabReport` + `LabResult`：历史快照，用于趋势分析
- `UserHealthProfile`：最新状态，AI报告基于此生成
- 双写机制：每次提交同时写入两处

### 3.2 医学规则引擎 (`backend/app/services/rule_engine.py`)

```python
class MedicalRuleEngine:
    """
    基于rules.json的医学规则评估引擎
    """
    
    def evaluate(metrics: dict, gender: str) -> dict:
        """
        评估所有指标
        
        返回:
        {
            "overall_assessment": {
                "total_metrics": 46,
                "abnormal_metrics": 3,
                "overall_status": "abnormal",
                "overall_risk_level": "moderate",
                "summary": "..."
            },
            "individual_results": [
                {
                    "metric_key": "uric_acid",
                    "metric_name": "尿酸",
                    "value": 450,
                    "status": "abnormal",
                    "risk_level": "moderate",
                    "message": "尿酸偏高，可能导致痛风风险",
                    "recommendations": ["减少高嘌呤食物...", ...]
                },
                ...
            ],
            "composite_results": [...],  # 复合规则（如代谢综合征）
            "all_recommendations": [...]  # 汇总建议
        }
        """
    
    def evaluate_single_metric(metric_name: str, value: float, gender: str) -> dict:
        """评估单个指标，返回状态/风险/建议"""
    
    def evaluate_composite_rules(metrics: dict, gender: str) -> list:
        """评估复合规则（跨多指标联合判断）"""
```

### 3.3 规则配置 (`backend/rules.json`)

```json
{
  "version": "2.0.0",
  "rules": {
    "uric_acid": {
      "name": "尿酸",
      "name_en": "Uric Acid",
      "unit": "μmol/L",
      "gender_specific": {
        "male": { "normal_range": [200, 420], "high_threshold": 420 },
        "female": { "normal_range": [140, 350], "high_threshold": 350 }
      },
      "conditions": [
        {
          "operator": "gt",
          "value": 420,
          "status": "abnormal",
          "risk_level": "moderate",
          "message": "尿酸偏高，可能导致痛风风险",
          "recommendations": [
            "减少高嘌呤食物摄入（动物内脏、海鲜、啤酒等）",
            "增加水分摄入，每日建议2000-3000ml",
            ...
          ]
        }
      ]
    },
    // ... 其他45项指标
  },
  "cardiovascular_composite_rules": { ... },  // 心血管复合规则
  "metabolic_syndrome_rules": { ... }          // 代谢综合征规则
}
```

### 3.4 运动元数据库 (`backend/app/data/exercise_database.py`)

```python
# 20种核心运动，基于ACSM体力活动汇编
EXERCISE_DATABASE = [
    Exercise(
        id="brisk_walking",
        name="快走",
        category=ExerciseCategory.AEROBIC,
        met_value=4.3,                    # 代谢当量
        intensity=IntensityLevel.MODERATE,
        duration_recommendation=(30, 60),  # 建议时长(分钟)
        frequency_per_week=(5, 7),         # 建议频率(次/周)
        
        medical_tags=MedicalTags(
            contraindications=["急性关节炎", "严重心脏病"],  # 禁忌症
            suitable_conditions=["高血压", "糖尿病", "肥胖"],  # 适合人群
            monitoring_required=False
        ),
        
        execution_guide=ExecutionGuide(
            warm_up="5分钟慢走热身",
            main_activity="保持每分钟100-120步的速度",
            cool_down="5分钟慢走放松"
        )
    ),
    // ... 其他19种运动
]
```

### 3.5 营养元数据库 (`backend/app/data/food_ingredients_data.py`)

```python
# 23种核心食材，基于中国食物成分表第6版 + USDA
CORE_FOODS_DATA = [
    FoodResource(
        id="spinach",
        name="菠菜",
        category=FoodCategory.VEGETABLES,
        
        nutrients=Nutrients(
            calories=23.0,
            protein=2.9, carbs=3.6, fat=0.4, fiber=2.2,
            calcium=99.0, iron=2.7, magnesium=79.0,
            vitamin_a=469.0, vitamin_c=28.1, vitamin_k=483.0,
            // ... 共26种营养素
        ),
        
        medical_tags=MedicalTags(
            contraindications=["肾结石患者", "甲状腺疾病患者"],
            suitable_conditions=["贫血", "骨质疏松", "孕妇", "高血压"],
            allergens=[],
            glycemic_index=GlycemicIndex.LOW
        ),
        
        preparation_methods=PreparationMethods(
            recommended_methods=["清炒", "焯水", "做汤"],
            nutrition_retention_tips=["快速烹饪", "不要过度加热"]
        )
    ),
    // ... 其他22种食材
]
```

### 3.6 体检分析API (`backend/app/routers/lab.py`)

**核心端点**：

```python
# 1. 提交体检数据并分析
POST /api/v1/lab/analyze
Request:
{
    "metrics": [
        {"name": "uric_acid", "value": 450},
        {"name": "glu", "value": 5.5}
    ],
    "gender": "male",
    "category": "kidney"
}
Response:
{
    "success": true,
    "data": {
        "overall_assessment": { ... },
        "individual_results": [ ... ],
        "all_recommendations": [ ... ]
    }
}
# 内部逻辑：
# 1. 调用规则引擎分析
# 2. 保存到LabReport（历史档案）
# 3. 增量更新UserHealthProfile（健康档案卡）

# 2. 生成AI综合报告
POST /api/v1/lab/ai-body-report
# 内部逻辑：
# 1. 从UserHealthProfile读取完整46项指标
# 2. 调用规则引擎分析全部指标
# 3. 构建围栏式提示词
# 4. 调用DeepSeek生成自然语言报告
# 5. 保存到UserHealthProfile.ai_comprehensive_report
```

---

## 四、当前完成状态

### ✅ 已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户认证系统 | ✅ | JWT认证，注册/登录/登出 |
| 医学规则引擎 | ✅ | 46项指标，性别特定阈值，复合规则 |
| 体检数据分析API | ✅ | 规则引擎分析 + 数据持久化 |
| UserHealthProfile | ✅ | 健康档案卡，增量更新机制 |
| AI报告生成 | ✅ | 基于完整画像，围栏式提示词 |
| 运动元数据库 | ✅ | 20种运动，医学标签，执行指导 |
| 营养元数据库 | ✅ | 23种食材，26种营养素，医学标签 |
| 前端体检分析页 | ✅ | 7大类检测，结果展示，AI报告 |

### ❌ 待实现

| 模块 | 优先级 | 说明 |
|------|--------|------|
| UserPreferences | P1 | 用户偏好表（二级数据） |
| 偏好设置API | P2 | CRUD接口 |
| 长期计划生成 | P3 | 1个月健康目标，基于规则引擎约束 |
| 周计划生成 | P4 | 7天运动+饮食安排，结合偏好过滤 |
| 日计划生成 | P5 | 每日具体建议 |
| 历史趋势API | P6 | 从LabReport提取指标变化趋势 |
| 前端偏好设置页 | P7 | 偏好录入界面 |
| 前端计划展示页 | P8 | 月/周/日计划展示 |

---

## 五、下一步开发重点

### 5.1 UserPreferences 模型设计

```python
class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # 饮食偏好
    taste_preference = Column(String)      # 清淡/适中/重口
    cuisine_styles = Column(JSON)          # ["中式", "西式"]
    allergens = Column(JSON)               # ["海鲜", "花生"]
    forbidden_foods = Column(JSON)         # ["猪肉", "牛肉"]
    meal_times = Column(JSON)              # {"breakfast": "07:30", ...}
    
    # 运动偏好
    preferred_exercises = Column(JSON)     # ["快走", "游泳"]
    exercise_frequency = Column(Integer)   # 次/周
    exercise_duration = Column(Integer)    # 分钟/次
    max_intensity = Column(String)         # light/moderate/vigorous
    exercise_time_slots = Column(JSON)     # ["早晨", "晚上"]
    has_equipment = Column(Boolean)        # 是否有器械
    
    # 生活习惯
    sleep_time = Column(String)            # "23:00"
    wake_time = Column(String)             # "07:00"
    work_style = Column(String)            # 久坐/站立/体力劳动
    stress_level = Column(Integer)         # 1-5
    
    updated_at = Column(DateTime)
```

### 5.2 AI计划生成流程

```
┌─────────────────────────────────────────────────────────────┐
│                      输入数据整合                            │
├─────────────────────────────────────────────────────────────┤
│  UserHealthProfile (一级)    +    UserPreferences (二级)    │
│       46项医学指标                   用户偏好设置            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    医学约束提取                              │
├─────────────────────────────────────────────────────────────┤
│  规则引擎分析 → 提取禁忌症 → 过滤运动库/食材库               │
│  例：尿酸高 → 禁忌高嘌呤食物 → 从推荐中排除海鲜             │
│  例：高血压 → 禁忌高强度运动 → 只推荐轻中度运动             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    月度计划生成                              │
├─────────────────────────────────────────────────────────────┤
│  1. 确定本月改善目标（优先处理高风险指标）                   │
│  2. 设定可量化目标（如：血糖从6.5→6.0）                     │
│  3. 生成医学约束清单（本月禁忌事项）                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    周计划生成                                │
├─────────────────────────────────────────────────────────────┤
│  运动计划：                                                  │
│    从运动库筛选 → 排除禁忌运动 → 匹配用户偏好               │
│    → 分配到7天（考虑休息日）                                │
│                                                              │
│  饮食计划：                                                  │
│    从食材库筛选 → 排除禁忌食材 → 匹配口味偏好               │
│    → 生成每日推荐食材组合                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    日计划生成                                │
├─────────────────────────────────────────────────────────────┤
│  今日运动：具体项目 + 时长 + 执行指导 + 替代方案             │
│  今日三餐：具体食材建议 + 烹饪方式 + 注意事项               │
│  今日提醒：喝水、用药、作息等                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、关键技术决策说明

### 6.1 为什么选择增量更新而非覆盖更新？

用户不可能每次都做全套46项体检。增量更新允许：
- 1月提交血糖、血脂（3项）
- 2月只提交尿酸（1项）
- AI报告仍能看到完整4项数据

### 6.2 为什么保留LabReport历史？

- 趋势分析需要历史数据（"血糖3个月下降了20%"）
- 追溯查询（"我1月份的体检结果是什么"）
- 审计留痕（医疗数据完整性）

### 6.3 为什么用规则引擎而非纯LLM？

- **安全性**：医学建议必须基于循证医学，不能让AI凭空生成
- **可解释性**：规则引擎的判断逻辑清晰透明
- **可控性**：可以精确控制阈值和建议内容
- **性能**：规则判断比API调用快

### 6.4 为什么计划周期是1个月而非更长？

- 目标更清晰，执行动力强
- 月末可评估效果并调整策略
- 纠错成本低（方向错误最多损失1个月）
- 符合用户心理预期

---

*报告生成时间：2025年12月17日*
