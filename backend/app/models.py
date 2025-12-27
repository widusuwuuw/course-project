from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    gender = Column(String(10), nullable=True, default="default")  # male, female, other, default
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")


class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(50), nullable=False, default="weight")
    value1 = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    logged_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="logs")


class LabReport(Base):
    """实验室检测报告主表"""
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # 允许匿名用户
    title = Column(String(255), nullable=False, default="健康检测报告")
    report_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    gender = Column(String(10), nullable=False, default="default")
    total_metrics = Column(Integer, nullable=False, default=0)
    abnormal_metrics = Column(Integer, nullable=False, default=0)
    overall_status = Column(String(20), nullable=False, default="unknown")
    overall_risk_level = Column(String(20), nullable=False, default="unknown")
    summary = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)  # 健康建议（JSON格式）
    category = Column(String(50), nullable=False, default="comprehensive")  # 检测类别
    ai_body_report = Column(Text, nullable=True)  # AI体质报告
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关联检测结果
    results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")


class LabResult(Base):
    """实验室检测结果详情表"""
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("lab_reports.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(String(255), nullable=False)  # 中文名称
    metric_name_en = Column(String(255), nullable=False)  # 英文名称
    metric_key = Column(String(50), nullable=False)  # 规则引擎中的键名
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="unknown")  # normal/abnormal
    risk_level = Column(String(20), nullable=False, default="unknown")
    abnormal_tag = Column(String(100), nullable=True)  # 异常标签
    message = Column(Text, nullable=True)  # 分析消息
    normal_range_min = Column(Float, nullable=True)
    normal_range_max = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关联报告
    report = relationship("LabReport", back_populates="results")


class UserHealthProfile(Base):
    """
    用户健康档案卡 - 存储用户46项健康指标的最新值
    
    设计理念：
    - 每个用户只有一条记录（一对一关系）
    - 增量更新：只更新本次提交的指标，保留未提交的历史值
    - 每个指标都有独立的updated_at时间戳，记录该指标最后更新时间
    - AI报告基于此表生成完整健康画像分析
    
    指标分类（共46项）：
    - 血常规：11项
    - 肝功能：9项
    - 肾功能：8项（含尿酸）
    - 血脂：7项
    - 血糖：5项
    - 电解质：6项
    """
    __tablename__ = "user_health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    gender = Column(String(10), nullable=True, default="default")  # male, female, default
    
    # ========== 血常规指标 (11项) ==========
    wbc = Column(Float, nullable=True)  # 白细胞计数
    wbc_updated_at = Column(DateTime, nullable=True)
    rbc = Column(Float, nullable=True)  # 红细胞计数
    rbc_updated_at = Column(DateTime, nullable=True)
    hgb = Column(Float, nullable=True)  # 血红蛋白
    hgb_updated_at = Column(DateTime, nullable=True)
    plt = Column(Float, nullable=True)  # 血小板计数
    plt_updated_at = Column(DateTime, nullable=True)
    neut_per = Column(Float, nullable=True)  # 中性粒细胞百分比
    neut_per_updated_at = Column(DateTime, nullable=True)
    lymp_per = Column(Float, nullable=True)  # 淋巴细胞百分比
    lymp_per_updated_at = Column(DateTime, nullable=True)
    mono_per = Column(Float, nullable=True)  # 单核细胞百分比
    mono_per_updated_at = Column(DateTime, nullable=True)
    hct = Column(Float, nullable=True)  # 红细胞压积
    hct_updated_at = Column(DateTime, nullable=True)
    mcv = Column(Float, nullable=True)  # 红细胞平均体积
    mcv_updated_at = Column(DateTime, nullable=True)
    mch = Column(Float, nullable=True)  # 红细胞平均血红蛋白含量
    mch_updated_at = Column(DateTime, nullable=True)
    mchc = Column(Float, nullable=True)  # 红细胞平均血红蛋白浓度
    mchc_updated_at = Column(DateTime, nullable=True)
    
    # ========== 肝功能指标 (9项) ==========
    alt = Column(Float, nullable=True)  # 谷丙转氨酶
    alt_updated_at = Column(DateTime, nullable=True)
    ast = Column(Float, nullable=True)  # 谷草转氨酶
    ast_updated_at = Column(DateTime, nullable=True)
    alp = Column(Float, nullable=True)  # 碱性磷酸酶
    alp_updated_at = Column(DateTime, nullable=True)
    ggt = Column(Float, nullable=True)  # γ-谷氨酰转肽酶
    ggt_updated_at = Column(DateTime, nullable=True)
    tbil = Column(Float, nullable=True)  # 总胆红素
    tbil_updated_at = Column(DateTime, nullable=True)
    dbil = Column(Float, nullable=True)  # 直接胆红素
    dbil_updated_at = Column(DateTime, nullable=True)
    tp = Column(Float, nullable=True)  # 总蛋白
    tp_updated_at = Column(DateTime, nullable=True)
    alb = Column(Float, nullable=True)  # 白蛋白
    alb_updated_at = Column(DateTime, nullable=True)
    glb = Column(Float, nullable=True)  # 球蛋白
    glb_updated_at = Column(DateTime, nullable=True)
    
    # ========== 肾功能指标 (8项) ==========
    crea = Column(Float, nullable=True)  # 肌酐
    crea_updated_at = Column(DateTime, nullable=True)
    bun = Column(Float, nullable=True)  # 尿素氮
    bun_updated_at = Column(DateTime, nullable=True)
    urea = Column(Float, nullable=True)  # 尿素
    urea_updated_at = Column(DateTime, nullable=True)
    uric_acid = Column(Float, nullable=True)  # 尿酸
    uric_acid_updated_at = Column(DateTime, nullable=True)
    cysc = Column(Float, nullable=True)  # 胱抑素C
    cysc_updated_at = Column(DateTime, nullable=True)
    egfr = Column(Float, nullable=True)  # 肾小球滤过率
    egfr_updated_at = Column(DateTime, nullable=True)
    microalb = Column(Float, nullable=True)  # 尿微量白蛋白
    microalb_updated_at = Column(DateTime, nullable=True)
    upcr = Column(Float, nullable=True)  # 尿蛋白/肌酐比值
    upcr_updated_at = Column(DateTime, nullable=True)
    
    # ========== 血脂指标 (7项) ==========
    tc = Column(Float, nullable=True)  # 总胆固醇
    tc_updated_at = Column(DateTime, nullable=True)
    tg = Column(Float, nullable=True)  # 甘油三酯
    tg_updated_at = Column(DateTime, nullable=True)
    hdl_c = Column(Float, nullable=True)  # 高密度脂蛋白胆固醇
    hdl_c_updated_at = Column(DateTime, nullable=True)
    ldl_c = Column(Float, nullable=True)  # 低密度脂蛋白胆固醇
    ldl_c_updated_at = Column(DateTime, nullable=True)
    vldl_c = Column(Float, nullable=True)  # 极低密度脂蛋白胆固醇
    vldl_c_updated_at = Column(DateTime, nullable=True)
    apolipoprotein_a = Column(Float, nullable=True)  # 载脂蛋白A
    apolipoprotein_a_updated_at = Column(DateTime, nullable=True)
    apolipoprotein_b = Column(Float, nullable=True)  # 载脂蛋白B
    apolipoprotein_b_updated_at = Column(DateTime, nullable=True)
    
    # ========== 血糖指标 (5项) ==========
    glu = Column(Float, nullable=True)  # 空腹血糖
    glu_updated_at = Column(DateTime, nullable=True)
    hba1c = Column(Float, nullable=True)  # 糖化血红蛋白
    hba1c_updated_at = Column(DateTime, nullable=True)
    fasting_insulin = Column(Float, nullable=True)  # 空腹胰岛素
    fasting_insulin_updated_at = Column(DateTime, nullable=True)
    c_peptide = Column(Float, nullable=True)  # C肽
    c_peptide_updated_at = Column(DateTime, nullable=True)
    homa_ir = Column(Float, nullable=True)  # 胰岛素抵抗指数
    homa_ir_updated_at = Column(DateTime, nullable=True)
    
    # ========== 电解质指标 (6项) ==========
    na = Column(Float, nullable=True)  # 钠
    na_updated_at = Column(DateTime, nullable=True)
    k = Column(Float, nullable=True)  # 钾
    k_updated_at = Column(DateTime, nullable=True)
    cl = Column(Float, nullable=True)  # 氯
    cl_updated_at = Column(DateTime, nullable=True)
    ca = Column(Float, nullable=True)  # 钙
    ca_updated_at = Column(DateTime, nullable=True)
    p = Column(Float, nullable=True)  # 磷
    p_updated_at = Column(DateTime, nullable=True)
    mg = Column(Float, nullable=True)  # 镁
    mg_updated_at = Column(DateTime, nullable=True)
    
    # ========== 档案元数据 ==========
    ai_comprehensive_report = Column(Text, nullable=True)  # AI综合健康报告（基于完整画像）
    ai_report_generated_at = Column(DateTime, nullable=True)  # AI报告生成时间
    total_metrics_count = Column(Integer, default=0)  # 已录入指标总数
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 档案最后更新时间
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关联用户
    user = relationship("User", backref="health_profile")
    
    # ========== 辅助方法 ==========
    
    # 所有指标key列表（与rules.json保持一致）
    METRIC_KEYS = [
        # 血常规
        'wbc', 'rbc', 'hgb', 'plt', 'neut_per', 'lymp_per', 'mono_per', 'hct', 'mcv', 'mch', 'mchc',
        # 肝功能
        'alt', 'ast', 'alp', 'ggt', 'tbil', 'dbil', 'tp', 'alb', 'glb',
        # 肾功能
        'crea', 'bun', 'urea', 'uric_acid', 'cysc', 'egfr', 'microalb', 'upcr',
        # 血脂
        'tc', 'tg', 'hdl_c', 'ldl_c', 'vldl_c', 'apolipoprotein_a', 'apolipoprotein_b',
        # 血糖
        'glu', 'hba1c', 'fasting_insulin', 'c_peptide', 'homa_ir',
        # 电解质
        'na', 'k', 'cl', 'ca', 'p', 'mg'
    ]
    
    def get_all_metrics(self) -> dict:
        """
        获取所有非空指标及其值和更新时间
        
        Returns:
            dict: {metric_key: {'value': float, 'updated_at': datetime}}
        """
        metrics = {}
        for key in self.METRIC_KEYS:
            value = getattr(self, key, None)
            if value is not None:
                updated_at = getattr(self, f"{key}_updated_at", None)
                metrics[key] = {
                    'value': value,
                    'updated_at': updated_at
                }
        return metrics
    
    def get_metrics_for_analysis(self) -> dict:
        """
        获取用于规则引擎分析的指标数据
        
        Returns:
            dict: {metric_key: value} 只包含非空指标
        """
        return {key: getattr(self, key) for key in self.METRIC_KEYS if getattr(self, key, None) is not None}
    
    def update_metrics(self, metrics: dict, update_time=None):
        """
        增量更新指标值
        
        Args:
            metrics: {metric_key: value} 要更新的指标
            update_time: 更新时间，默认为当前时间
        """
        if update_time is None:
            update_time = datetime.utcnow()
        
        count = 0
        for key, value in metrics.items():
            if key in self.METRIC_KEYS and value is not None:
                setattr(self, key, value)
                setattr(self, f"{key}_updated_at", update_time)
                count += 1
        
        # 更新已录入指标总数
        self.total_metrics_count = len(self.get_metrics_for_analysis())


class MonthlyPlan(Base):
    """
    月度健康计划表 - 存储AI生成的结构化月计划
    
    设计理念：
    - 存储JSON格式的结构化计划（便于前端解析和后端校验）
    - 关联用户健康档案，基于规则引擎约束生成
    - 支持按月存储历史计划
    
    计划内容：
    - 月度目标（改善指标、优先级）
    - 运动框架（从元数据库筛选的运动ID、频次、强度）
    - 饮食框架（从元数据库筛选的食材ID、原则）
    - 医学约束（禁忌清单、监测指标）
    - AI解读（简短说明）
    """
    __tablename__ = "monthly_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 计划基本信息
    plan_month = Column(String(7), nullable=False)  # 格式：YYYY-MM
    plan_title = Column(String(255), nullable=False, default="月度健康改善计划")
    
    # 结构化计划内容（JSON格式）
    month_goal = Column(Text, nullable=True)  # JSON: 月度目标
    exercise_framework = Column(Text, nullable=True)  # JSON: 运动框架
    diet_framework = Column(Text, nullable=True)  # JSON: 饮食框架
    medical_constraints = Column(Text, nullable=True)  # JSON: 医学约束
    weekly_themes = Column(Text, nullable=True)  # JSON: 四周主题
    
    # AI解读
    ai_interpretation = Column(Text, nullable=True)  # AI简短解读（不超过200字）
    
    # 规则引擎输入快照（用于审计和复现）
    rule_engine_input = Column(Text, nullable=True)  # JSON: 生成时的健康指标快照
    rule_engine_output = Column(Text, nullable=True)  # JSON: 规则引擎分析结果
    
    # 元数据
    generation_status = Column(String(20), nullable=False, default="pending")  # pending, generating, completed, failed
    is_active = Column(Boolean, default=True)  # 是否为当前活跃计划
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联用户
    user = relationship("User", backref="monthly_plans")
    
    def get_plan_as_dict(self) -> dict:
        """
        将计划转换为完整的字典格式
        """
        import json
        return {
            "id": self.id,
            "plan_month": self.plan_month,
            "plan_title": self.plan_title,
            "month_goal": json.loads(self.month_goal) if self.month_goal else None,
            "exercise_framework": json.loads(self.exercise_framework) if self.exercise_framework else None,
            "diet_framework": json.loads(self.diet_framework) if self.diet_framework else None,
            "medical_constraints": json.loads(self.medical_constraints) if self.medical_constraints else None,
            "weekly_themes": json.loads(self.weekly_themes) if self.weekly_themes else None,
            "ai_interpretation": self.ai_interpretation,
            "generation_status": self.generation_status,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserPreferences(Base):
    """
    用户偏好设置表 - 二级数据（短期/可调整）
    
    作用：
    - 存储用户的个性化偏好（饮食、运动、生活习惯）
    - 周计划生成时与月度计划结合
    - 日计划微调时参考
    
    设计原则：
    - 每个用户只有一条记录（一对一关系）
    - 所有偏好字段都是可选的（允许部分填写）
    - JSON字段支持复杂的嵌套数据
    """
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # ===== 饮食偏好 =====
    taste_preference = Column(String(20), nullable=True)  # 清淡/适中/重口
    cuisine_styles = Column(Text, nullable=True)  # JSON: ["中式", "西式", "日式"]
    allergens = Column(Text, nullable=True)  # JSON: ["海鲜", "花生", "乳制品"]
    forbidden_foods = Column(Text, nullable=True)  # JSON: ["猪肉", "牛肉"] 用户主观不吃的
    cooking_skill = Column(String(20), nullable=True)  # 新手/普通/擅长
    meals_per_day = Column(Integer, nullable=True, default=3)  # 每日餐数
    
    # ===== 运动偏好 =====
    preferred_exercises = Column(Text, nullable=True)  # JSON: ["快走", "游泳", "瑜伽"]
    disliked_exercises = Column(Text, nullable=True)  # JSON: ["跑步", "HIIT"]
    exercise_frequency = Column(Integer, nullable=True, default=3)  # 期望每周运动次数
    exercise_duration = Column(Integer, nullable=True, default=30)  # 期望每次运动时长（分钟）
    preferred_intensity = Column(String(20), nullable=True, default="moderate")  # light/moderate/vigorous
    exercise_time_slots = Column(Text, nullable=True)  # JSON: ["早晨", "傍晚"]
    has_gym_access = Column(Boolean, nullable=True, default=False)  # 是否能去健身房
    available_equipment = Column(Text, nullable=True)  # JSON: ["哑铃", "瑜伽垫", "跳绳"]
    
    # ===== 生活习惯 =====
    sleep_time = Column(String(10), nullable=True)  # "23:00"
    wake_time = Column(String(10), nullable=True)  # "07:00"
    work_style = Column(String(20), nullable=True)  # 久坐办公/站立工作/体力劳动/混合
    weekly_schedule = Column(Text, nullable=True)  # JSON: 每周日程安排
    """
    weekly_schedule 结构示例：
    {
        "monday": {"work_intensity": "high", "available_time": 30},
        "tuesday": {"work_intensity": "medium", "available_time": 60},
        "wednesday": {"work_intensity": "high", "available_time": 30},
        "thursday": {"work_intensity": "medium", "available_time": 45},
        "friday": {"work_intensity": "high", "available_time": 30},
        "saturday": {"work_intensity": "low", "available_time": 90},
        "sunday": {"work_intensity": "low", "available_time": 90}
    }
    """
    stress_level = Column(Integer, nullable=True)  # 1-5，压力水平
    
    # ===== 健康目标 =====
    primary_goal = Column(String(50), nullable=True)  # 减重/增肌/保持健康/改善体质/康复训练
    target_weight = Column(Float, nullable=True)  # 目标体重(kg)
    
    # ===== 元数据 =====
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联用户
    user = relationship("User", backref="preferences")
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            # 饮食偏好
            "taste_preference": self.taste_preference,
            "cuisine_styles": json.loads(self.cuisine_styles) if self.cuisine_styles else [],
            "allergens": json.loads(self.allergens) if self.allergens else [],
            "forbidden_foods": json.loads(self.forbidden_foods) if self.forbidden_foods else [],
            "cooking_skill": self.cooking_skill,
            "meals_per_day": self.meals_per_day,
            # 运动偏好
            "preferred_exercises": json.loads(self.preferred_exercises) if self.preferred_exercises else [],
            "disliked_exercises": json.loads(self.disliked_exercises) if self.disliked_exercises else [],
            "exercise_frequency": self.exercise_frequency,
            "exercise_duration": self.exercise_duration,
            "preferred_intensity": self.preferred_intensity,
            "exercise_time_slots": json.loads(self.exercise_time_slots) if self.exercise_time_slots else [],
            "has_gym_access": self.has_gym_access,
            "available_equipment": json.loads(self.available_equipment) if self.available_equipment else [],
            # 生活习惯
            "sleep_time": self.sleep_time,
            "wake_time": self.wake_time,
            "work_style": self.work_style,
            "weekly_schedule": json.loads(self.weekly_schedule) if self.weekly_schedule else {},
            "stress_level": self.stress_level,
            # 健康目标
            "primary_goal": self.primary_goal,
            "target_weight": self.target_weight,
            # 元数据
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_from_dict(self, data: dict):
        """从字典更新偏好设置"""
        import json
        
        # 饮食偏好
        if "taste_preference" in data:
            self.taste_preference = data["taste_preference"]
        if "cuisine_styles" in data:
            self.cuisine_styles = json.dumps(data["cuisine_styles"], ensure_ascii=False) if data["cuisine_styles"] else None
        if "allergens" in data:
            self.allergens = json.dumps(data["allergens"], ensure_ascii=False) if data["allergens"] else None
        if "forbidden_foods" in data:
            self.forbidden_foods = json.dumps(data["forbidden_foods"], ensure_ascii=False) if data["forbidden_foods"] else None
        if "cooking_skill" in data:
            self.cooking_skill = data["cooking_skill"]
        if "meals_per_day" in data:
            self.meals_per_day = data["meals_per_day"]
        
        # 运动偏好
        if "preferred_exercises" in data:
            self.preferred_exercises = json.dumps(data["preferred_exercises"], ensure_ascii=False) if data["preferred_exercises"] else None
        if "disliked_exercises" in data:
            self.disliked_exercises = json.dumps(data["disliked_exercises"], ensure_ascii=False) if data["disliked_exercises"] else None
        if "exercise_frequency" in data:
            self.exercise_frequency = data["exercise_frequency"]
        if "exercise_duration" in data:
            self.exercise_duration = data["exercise_duration"]
        if "preferred_intensity" in data:
            self.preferred_intensity = data["preferred_intensity"]
        if "exercise_time_slots" in data:
            self.exercise_time_slots = json.dumps(data["exercise_time_slots"], ensure_ascii=False) if data["exercise_time_slots"] else None
        if "has_gym_access" in data:
            self.has_gym_access = data["has_gym_access"]
        if "available_equipment" in data:
            self.available_equipment = json.dumps(data["available_equipment"], ensure_ascii=False) if data["available_equipment"] else None
        
        # 生活习惯
        if "sleep_time" in data:
            self.sleep_time = data["sleep_time"]
        if "wake_time" in data:
            self.wake_time = data["wake_time"]
        if "work_style" in data:
            self.work_style = data["work_style"]
        if "weekly_schedule" in data:
            self.weekly_schedule = json.dumps(data["weekly_schedule"], ensure_ascii=False) if data["weekly_schedule"] else None
        if "stress_level" in data:
            self.stress_level = data["stress_level"]
        
        # 健康目标
        if "primary_goal" in data:
            self.primary_goal = data["primary_goal"]
        if "target_weight" in data:
            self.target_weight = data["target_weight"]


class WeeklyPlan(Base):
    """
    周计划表 - 基于月度计划+用户偏好生成的具体执行计划
    
    设计理念：
    - 具体到每天的运动安排和饮食推荐
    - 支持用户微调（如调低某天强度）
    - 记录执行完成情况
    
    数据结构：
    - daily_plans: 7天的详细计划（JSON）
    - user_adjustments: 用户的微调请求
    - completion_status: 完成情况记录
    """
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    monthly_plan_id = Column(Integer, ForeignKey("monthly_plans.id", ondelete="SET NULL"), nullable=True)
    
    # 周信息
    week_number = Column(Integer, nullable=False)  # 当月第几周（1-5）
    week_start_date = Column(DateTime, nullable=False)  # 周一日期
    week_end_date = Column(DateTime, nullable=False)  # 周日日期
    week_theme = Column(String(100), nullable=True)  # 本周主题（从月度计划继承）
    
    # 7天计划（JSON格式）
    daily_plans = Column(Text, nullable=True)
    """
    daily_plans 结构：
    {
        "monday": {
            "date": "2025-12-16",
            "is_rest_day": false,
            "exercise": {
                "exercise_id": "brisk_walking",
                "name": "快走",
                "duration": 30,
                "intensity": "moderate",
                "calories_target": 150,
                "time_slot": "傍晚",
                "execution_guide": "保持每分钟100-120步的速度",
                "alternatives": [
                    {"exercise_id": "cycling", "name": "骑行"},
                    {"exercise_id": "swimming", "name": "游泳"}
                ]
            },
            "diet": {
                "calories_target": 1800,
                "breakfast": {
                    "foods": [
                        {"food_id": "oatmeal", "name": "燕麦", "portion": "50g"},
                        {"food_id": "egg", "name": "鸡蛋", "portion": "1个"}
                    ],
                    "calories": 350
                },
                "lunch": {
                    "foods": [
                        {"food_id": "brown_rice", "name": "糙米饭", "portion": "150g"},
                        {"food_id": "chicken_breast", "name": "鸡胸肉", "portion": "100g"},
                        {"food_id": "broccoli", "name": "西兰花", "portion": "100g"}
                    ],
                    "calories": 550
                },
                "dinner": {
                    "foods": [...],
                    "calories": 450
                },
                "snacks": {
                    "foods": [...],
                    "calories": 150
                }
            },
            "tips": "今天工作强度较高，运动安排已适当减轻"
        },
        "tuesday": { ... },
        ...
    }
    """
    
    # 用户调整
    user_adjustments = Column(Text, nullable=True)
    """
    user_adjustments 结构：
    {
        "tuesday": {
            "reason": "工作加班",
            "reduce_exercise": true,
            "skip_exercise": false
        },
        "friday": {
            "reason": "有应酬",
            "flexible_dinner": true
        }
    }
    """
    
    # 完成情况
    completion_status = Column(Text, nullable=True)
    """
    completion_status 结构：
    {
        "monday": {
            "exercise_completed": true,
            "exercise_actual_duration": 35,
            "meals_followed": {"breakfast": true, "lunch": true, "dinner": false},
            "notes": "晚餐外出就餐"
        },
        ...
    }
    """
    
    # AI解读
    ai_weekly_summary = Column(Text, nullable=True)  # 本周计划总结（不超过200字）
    
    # 元数据
    generation_status = Column(String(20), nullable=False, default="pending")  # pending/generating/completed/failed
    is_active = Column(Boolean, default=True)  # 是否为当前活跃计划
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联
    user = relationship("User", backref="weekly_plans")
    monthly_plan = relationship("MonthlyPlan", backref="weekly_plans")
    
    def get_plan_as_dict(self) -> dict:
        """转换为完整的字典格式"""
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "monthly_plan_id": self.monthly_plan_id,
            "week_number": self.week_number,
            "week_start_date": self.week_start_date.strftime("%Y-%m-%d") if self.week_start_date else None,
            "week_end_date": self.week_end_date.strftime("%Y-%m-%d") if self.week_end_date else None,
            "week_theme": self.week_theme,
            "daily_plans": json.loads(self.daily_plans) if self.daily_plans else {},
            "user_adjustments": json.loads(self.user_adjustments) if self.user_adjustments else {},
            "completion_status": json.loads(self.completion_status) if self.completion_status else {},
            "ai_weekly_summary": self.ai_weekly_summary,
            "generation_status": self.generation_status,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_day_plan(self, day: str) -> dict:
        """获取指定日期的计划"""
        import json
        if not self.daily_plans:
            return {}
        daily = json.loads(self.daily_plans)
        return daily.get(day.lower(), {})
    
    def update_completion(self, day: str, status: dict):
        """更新指定日期的完成情况"""
        import json
        completion = json.loads(self.completion_status) if self.completion_status else {}
        completion[day.lower()] = status
        self.completion_status = json.dumps(completion, ensure_ascii=False)
