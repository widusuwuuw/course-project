# 健康档案架构改造总结

## 改造背景

**问题**：旧设计中，AI报告基于单次LabReport生成，无法看到用户完整的健康画像。
- 用户1月提交血糖、血脂 → LabReport #1
- 用户2月提交尿酸 → LabReport #2
- AI只能看到LabReport #2（只有尿酸），看不到血糖、血脂历史数据

**解决方案**：引入 `UserHealthProfile` 健康档案卡表，实现增量更新存储模式。

---

## 架构设计

**核心指标**：46项健康指标（血常规11项 + 肝功能9项 + 肾功能8项 + 血脂7项 + 血糖5项 + 电解质6项）

### 双表架构

```
┌─────────────────────────────────────────────────────────┐
│                     用户提交检测数据                       │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ↓                         ↓
  ┌──────────────┐         ┌──────────────────┐
  │  LabReport   │         │ UserHealthProfile │
  │  (历史档案)   │         │   (健康档案卡)     │
  └──────────────┘         └──────────────────┘
         │                         │
         ↓                         ↓
  ┌──────────────┐         ┌──────────────────┐
  │ • 完整快照    │         │ • 增量更新        │
  │ • 时间戳记录  │         │ • 最新值存储      │
  │ • 趋势分析    │         │ • AI报告来源      │
  └──────────────┘         └──────────────────┘
```

### 表结构

#### 1. UserHealthProfile (健康档案卡)

```python
class UserHealthProfile(Base):
    """
    用户健康档案卡 - 每个用户一条记录
    
    设计理念：
    - 增量更新：只更新本次提交的指标，保留未提交的历史值
    - 每个指标都有独立的 updated_at 时间戳
    - AI报告基于此表生成完整健康画像
    """
    
    # 基础信息
    id, user_id, gender
    
    # 46个健康指标 (每个指标2个字段)
    wbc, wbc_updated_at              # 白细胞
    rbc, rbc_updated_at              # 红细胞
    ...
    uric_acid, uric_acid_updated_at  # 尿酸
    
    # AI报告
    ai_comprehensive_report          # AI综合报告
    ai_report_generated_at           # 报告生成时间
    
    # 元数据
    total_metrics_count              # 已录入指标数
    last_updated_at                  # 最后更新时间
```

**指标分类**：
- 血常规：11项 (wbc, rbc, hgb, plt等)
- 肝功能：9项 (alt, ast, alp, ggt等)
- 肾功能：8项 (crea, bun, uric_acid等)
- 血脂：7项 (tc, tg, hdl_c, ldl_c等)
- 血糖：5项 (glu, hba1c等)
- 电解质：6项 (na, k, cl, ca, p, mg)

#### 2. LabReport (历史档案 - 保持不变)

```python
class LabReport(Base):
    """实验室检测报告 - 历史快照"""
    id, user_id, report_date
    total_metrics, abnormal_metrics
    overall_status, overall_risk_level
    summary, recommendations
    category
```

作用：保留每次检查的完整快照，用于趋势分析。

---

## 数据流程

### 1. 用户提交检测数据

```python
POST /api/v1/lab/analyze

Request:
{
  "metrics": [
    {"name": "uric_acid", "value": 420}
  ],
  "gender": "male",
  "category": "kidney"
}
```

**后端处理（双写）**：

```python
# Step 1: 规则引擎分析
analysis_result = rule_engine.evaluate(metrics_dict, gender)

# Step 2: 保存历史档案
lab_report = LabReport(...)
db.add(lab_report)

# Step 3: 增量更新健康档案
profile = db.query(UserHealthProfile).filter(user_id=...).first()
if not profile:
    profile = UserHealthProfile(user_id=...)
    db.add(profile)

profile.update_metrics(metrics_dict)  # 只更新本次提交的指标
db.commit()
```

**增量更新逻辑**：

```python
def update_metrics(self, metrics: dict):
    """增量更新指标值"""
    for key, value in metrics.items():
        if key in self.METRIC_KEYS:
            setattr(self, key, value)  # 更新指标值
            setattr(self, f"{key}_updated_at", datetime.utcnow())  # 更新时间戳
    
    self.total_metrics_count = len(self.get_metrics_for_analysis())
```

### 2. 用户请求AI报告

```python
POST /api/v1/lab/ai-body-report
```

**新流程**：

```python
# Step 1: 从健康档案读取完整46项指标
profile = db.query(UserHealthProfile).filter(user_id=...).first()
metrics_for_analysis = profile.get_metrics_for_analysis()  # 所有非空指标

# Step 2: 规则引擎分析全部指标
analysis_result = rule_engine.evaluate(metrics_for_analysis, gender)

# Step 3: 构建AI提示词（包含完整健康画像）
ai_prompt = f"""
【用户完整健康档案】
- 已录入指标: {len(metrics_for_analysis)}项
- 血常规: wbc=5.5, rbc=4.5...
- 肝功能: alt=30, ast=25...
- 肾功能: uric_acid=420...
...

【医学规则引擎分析结果】
{analysis_result}

请基于以上完整健康档案生成综合报告...
"""

# Step 4: 调用DeepSeek生成AI报告
ai_report = call_deepseek_api(ai_prompt)

# Step 5: 保存到健康档案
profile.ai_comprehensive_report = ai_report
profile.ai_report_generated_at = datetime.utcnow()
db.commit()
```

---

## 验证结果

### 测试场景

**第1次提交**：血糖 + 血脂
```
glu: 5.5
tc: 4.2
tg: 1.5
```

**第2次提交**：只提交尿酸（不提交血糖、血脂）
```
uric_acid: 420
```

### 验证结果 ✅

```
当前档案中的指标:
  - uric_acid: 420.0 (更新于: 2025-12-17 02:57:26)  ✅ 新增
  - tc: 4.2 (更新于: 2025-12-17 02:57:24)          ✅ 保留
  - tg: 1.5 (更新于: 2025-12-17 02:57:24)          ✅ 保留
  - glu: 5.5 (更新于: 2025-12-17 02:57:24)         ✅ 保留

总计已录入 4 项指标
```

**关键验证点**：
1. ✅ 增量更新：第2次提交只更新尿酸，血糖、血脂保留
2. ✅ 时间戳独立：每个指标有独立更新时间
3. ✅ 数据持久化：重启后数据不丢失

---

## 改造文件清单

### 1. 模型层
- [backend/app/models.py](backend/app/models.py)
  - 新增 `UserHealthProfile` 类（230行代码）
  - 包含46个指标字段 + 46个时间戳字段
  - 提供 `get_all_metrics()`, `update_metrics()` 辅助方法

### 2. 路由层
- [backend/app/routers/lab.py](backend/app/routers/lab.py)
  - `analyze_lab_results()`: 添加双写逻辑（第130-165行）
  - `generate_ai_body_report()`: 完全重写（第478-750行）
    - 从 UserHealthProfile 读取完整数据
    - 调用规则引擎分析全部指标
    - 生成综合健康报告

### 3. 数据库迁移
- [backend/update_health_profile_schema.py](backend/update_health_profile_schema.py)
  - 创建 `user_health_profiles` 表
  - 验证表结构完整性

### 4. 测试脚本
- [backend/test_incremental_update.py](backend/test_incremental_update.py)
  - 验证增量更新逻辑
  - 验证时间戳机制

---

## 核心优势

### 1. 完整健康画像
- **旧设计**：AI只能看到最近一次LabReport的指标
- **新设计**：AI能看到用户所有46项指标的最新值

### 2. 增量更新
- **旧设计**：每次提交独立，数据割裂
- **新设计**：自动保留历史值，只更新本次提交的指标

### 3. 时间追溯
- **每个指标独立时间戳**：能看到"血糖是3个月前测的，尿酸是昨天测的"
- **趋势分析保留**：LabReport保存完整历史快照

### 4. 灵活性
- 用户可以分多次录入不同指标
- 不必等到做完全套检查才能生成AI报告
- AI报告始终基于最新完整数据

---

## 使用示例

### ���景：用户分3次录入体检数据

**2024年1月10日 - 全套体检**
```python
POST /api/v1/lab/analyze
{
  "metrics": [
    {"name": "wbc", "value": 5.5},
    {"name": "rbc", "value": 4.5},
    ...  # 46项全部指标
  ]
}
```
→ 健康档案更新：46项全部录入

**2024年2月15日 - 只查血糖**
```python
POST /api/v1/lab/analyze
{
  "metrics": [
    {"name": "glu", "value": 5.8}
  ]
}
```
→ 健康档案更新：glu=5.8（其他46项保持1月10日的值）

**2024年3月20日 - 只查尿酸**
```python
POST /api/v1/lab/analyze
{
  "metrics": [
    {"name": "uric_acid", "value": 420}
  ]
}
```
→ 健康档案更新：uric_acid=420（其他45项保持历史值）

**任何时候生成AI报告**：
```python
POST /api/v1/lab/ai-body-report
```
→ AI看到完整46项指标：
- wbc=5.5 (1月10日)
- glu=5.8 (2月15日)  ← 最新血糖
- uric_acid=420 (3月20日)  ← 最新尿酸
- ...

---

## 后续扩展

### 1. 趋势分析API
```python
GET /api/v1/lab/trends?metric=glu

Response:
{
  "metric": "glu",
  "data_points": [
    {"date": "2024-01-10", "value": 6.5},
    {"date": "2024-02-15", "value": 5.8},
    {"date": "2024-03-20", "value": 5.2}
  ],
  "trend": "improving"
}
```

### 2. AI个性化教练
- **长期计划**：基于 UserHealthProfile 完整画像
- **周期性计划**：结合 LabReport 趋势分析
- **实时调整**：根据用户短期反馈微调

### 3. 健康档案导出
```python
GET /api/v1/health-profile/export

Response: PDF完整健康档案
- 46项指标一览表
- 每项指标最后更新时间
- 历史趋势图表
- AI综合报告
```

---

## 技术要点

### 1. ORM关系映射
```python
User.health_profile → UserHealthProfile (一对一)
User.logs → HealthLog[] (一对多)
LabReport.results → LabResult[] (一对多)
```

### 2. 数据完整性
- `user_id` 外键约束 + `unique=True` 保证一对一
- `CASCADE DELETE` 保证用户删除时自动删除档案

### 3. 性能优化
- 单表查询：`db.query(UserHealthProfile).filter(user_id=...).first()`
- 避免JOIN：所有指标在同一行，无需关联查询

---

## 总结

✅ **改造完成**：
1. 新增 UserHealthProfile 表（100列）
2. 实现增量更新逻辑（保留历史值）
3. 重写AI报告生成（基于完整画像）
4. 数据库迁移成功
5. 测试验证通过

✅ **关键改进**：
- AI从"盲人摸象"变为"全局视角"
- 用户可分多次录入，体验更灵活
- 保留完整历史，支持趋势分析

✅ **向下兼容**：
- LabReport保留，历史数据不影响
- 前端无需改动，后端透明升级
