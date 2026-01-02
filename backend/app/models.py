from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean, Table, JSON, UniqueConstraint
from sqlalchemy.orm import relationship

from .db import Base

# Association Table for Post and Tag (Many-to-Many)
post_tags = Table('post_tags', Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id', ondelete="CASCADE"), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    gender = Column(String(10), nullable=True, default="default")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")
    
    # Relationships for Community feature
    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="owner", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="owner", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    image_urls = Column(JSON, nullable=True) # Storing a list of image URLs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    
    posts = relationship("Post", secondary=post_tags, back_populates="tags")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    owner = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

    __table_args__ = (UniqueConstraint('owner_id', 'post_id', name='_owner_post_uc'),)


class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(50), nullable=False, default="weight")
    value1 = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="logs")


class LabReport(Base):
    """实验室检测报告主表"""
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False, default="健康检测报告")
    report_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    gender = Column(String(10), nullable=False, default="default")
    total_metrics = Column(Integer, nullable=False, default=0)
    abnormal_metrics = Column(Integer, nullable=False, default=0)
    overall_status = Column(String(20), nullable=False, default="unknown")
    overall_risk_level = Column(String(20), nullable=False, default="unknown")
    summary = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="comprehensive")
    ai_body_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")


class LabResult(Base):
    """实验室检测结果详情表"""
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("lab_reports.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(String(255), nullable=False)
    metric_name_en = Column(String(255), nullable=False)
    metric_key = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="unknown")
    risk_level = Column(String(20), nullable=False, default="unknown")
    abnormal_tag = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    normal_range_min = Column(Float, nullable=True)
    normal_range_max = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("LabReport", back_populates="results")


class UserHealthProfile(Base):
    """
    用户健康档案卡 - 存储用户46项健康指标的最新值
    """
    __tablename__ = "user_health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    gender = Column(String(10), nullable=True, default="default")
    
    # ... (rest of the original file's content)
    wbc = Column(Float, nullable=True)
    wbc_updated_at = Column(DateTime, nullable=True)
    rbc = Column(Float, nullable=True)
    rbc_updated_at = Column(DateTime, nullable=True)
    hgb = Column(Float, nullable=True)
    hgb_updated_at = Column(DateTime, nullable=True)
    plt = Column(Float, nullable=True)
    plt_updated_at = Column(DateTime, nullable=True)
    neut_per = Column(Float, nullable=True)
    neut_per_updated_at = Column(DateTime, nullable=True)
    lymp_per = Column(Float, nullable=True)
    lymp_per_updated_at = Column(DateTime, nullable=True)
    mono_per = Column(Float, nullable=True)
    mono_per_updated_at = Column(DateTime, nullable=True)
    hct = Column(Float, nullable=True)
    hct_updated_at = Column(DateTime, nullable=True)
    mcv = Column(Float, nullable=True)
    mcv_updated_at = Column(DateTime, nullable=True)
    mch = Column(Float, nullable=True)
    mch_updated_at = Column(DateTime, nullable=True)
    mchc = Column(Float, nullable=True)
    mchc_updated_at = Column(DateTime, nullable=True)
    alt = Column(Float, nullable=True)
    alt_updated_at = Column(DateTime, nullable=True)
    ast = Column(Float, nullable=True)
    ast_updated_at = Column(DateTime, nullable=True)
    alp = Column(Float, nullable=True)
    alp_updated_at = Column(DateTime, nullable=True)
    ggt = Column(Float, nullable=True)
    ggt_updated_at = Column(DateTime, nullable=True)
    tbil = Column(Float, nullable=True)
    tbil_updated_at = Column(DateTime, nullable=True)
    dbil = Column(Float, nullable=True)
    dbil_updated_at = Column(DateTime, nullable=True)
    tp = Column(Float, nullable=True)
    tp_updated_at = Column(DateTime, nullable=True)
    alb = Column(Float, nullable=True)
    alb_updated_at = Column(DateTime, nullable=True)
    glb = Column(Float, nullable=True)
    glb_updated_at = Column(DateTime, nullable=True)
    crea = Column(Float, nullable=True)
    crea_updated_at = Column(DateTime, nullable=True)
    bun = Column(Float, nullable=True)
    bun_updated_at = Column(DateTime, nullable=True)
    urea = Column(Float, nullable=True)
    urea_updated_at = Column(DateTime, nullable=True)
    uric_acid = Column(Float, nullable=True)
    uric_acid_updated_at = Column(DateTime, nullable=True)
    cysc = Column(Float, nullable=True)
    cysc_updated_at = Column(DateTime, nullable=True)
    egfr = Column(Float, nullable=True)
    egfr_updated_at = Column(DateTime, nullable=True)
    microalb = Column(Float, nullable=True)
    microalb_updated_at = Column(DateTime, nullable=True)
    upcr = Column(Float, nullable=True)
    upcr_updated_at = Column(DateTime, nullable=True)
    tc = Column(Float, nullable=True)
    tc_updated_at = Column(DateTime, nullable=True)
    tg = Column(Float, nullable=True)
    tg_updated_at = Column(DateTime, nullable=True)
    hdl_c = Column(Float, nullable=True)
    hdl_c_updated_at = Column(DateTime, nullable=True)
    ldl_c = Column(Float, nullable=True)
    ldl_c_updated_at = Column(DateTime, nullable=True)
    vldl_c = Column(Float, nullable=True)
    vldl_c_updated_at = Column(DateTime, nullable=True)
    apolipoprotein_a = Column(Float, nullable=True)
    apolipoprotein_a_updated_at = Column(DateTime, nullable=True)
    apolipoprotein_b = Column(Float, nullable=True)
    apolipoprotein_b_updated_at = Column(DateTime, nullable=True)
    glu = Column(Float, nullable=True)
    glu_updated_at = Column(DateTime, nullable=True)
    hba1c = Column(Float, nullable=True)
    hba1c_updated_at = Column(DateTime, nullable=True)
    fasting_insulin = Column(Float, nullable=True)
    fasting_insulin_updated_at = Column(DateTime, nullable=True)
    c_peptide = Column(Float, nullable=True)
    c_peptide_updated_at = Column(DateTime, nullable=True)
    homa_ir = Column(Float, nullable=True)
    homa_ir_updated_at = Column(DateTime, nullable=True)
    na = Column(Float, nullable=True)
    na_updated_at = Column(DateTime, nullable=True)
    k = Column(Float, nullable=True)
    k_updated_at = Column(DateTime, nullable=True)
    cl = Column(Float, nullable=True)
    cl_updated_at = Column(DateTime, nullable=True)
    ca = Column(Float, nullable=True)
    ca_updated_at = Column(DateTime, nullable=True)
    p = Column(Float, nullable=True)
    p_updated_at = Column(DateTime, nullable=True)
    mg = Column(Float, nullable=True)
    mg_updated_at = Column(DateTime, nullable=True)
    ai_comprehensive_report = Column(Text, nullable=True)
    ai_report_generated_at = Column(DateTime, nullable=True)
    total_metrics_count = Column(Integer, default=0)
    last_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user = relationship("User", backref="health_profile")
    METRIC_KEYS = ['wbc', 'rbc', 'hgb', 'plt', 'neut_per', 'lymp_per', 'mono_per', 'hct', 'mcv', 'mch', 'mchc', 'alt', 'ast', 'alp', 'ggt', 'tbil', 'dbil', 'tp', 'alb', 'glb', 'crea', 'bun', 'urea', 'uric_acid', 'cysc', 'egfr', 'microalb', 'upcr', 'tc', 'tg', 'hdl_c', 'ldl_c', 'vldl_c', 'apolipoprotein_a', 'apolipoprotein_b', 'glu', 'hba1c', 'fasting_insulin', 'c_peptide', 'homa_ir', 'na', 'k', 'cl', 'ca', 'p', 'mg']
    def get_all_metrics(self) -> dict: return {}
    def get_metrics_for_analysis(self) -> dict: return {}
    def update_metrics(self, metrics: dict, update_time=None): pass

class MonthlyPlan(Base):
    __tablename__ = "monthly_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_month = Column(String(7), nullable=False)
    plan_title = Column(String(255), nullable=False, default="月度健康改善计划")
    month_goal = Column(Text, nullable=True)
    exercise_framework = Column(Text, nullable=True)
    diet_framework = Column(Text, nullable=True)
    medical_constraints = Column(Text, nullable=True)
    weekly_themes = Column(Text, nullable=True)
    ai_interpretation = Column(Text, nullable=True)
    rule_engine_input = Column(Text, nullable=True)
    rule_engine_output = Column(Text, nullable=True)
    generation_status = Column(String(20), nullable=False, default="pending")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="monthly_plans")
    def get_plan_as_dict(self) -> dict: return {}

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    taste_preference = Column(String(20), nullable=True)
    cuisine_styles = Column(Text, nullable=True)
    allergens = Column(Text, nullable=True)
    forbidden_foods = Column(Text, nullable=True)
    cooking_skill = Column(String(20), nullable=True)
    meals_per_day = Column(Integer, nullable=True, default=3)
    preferred_exercises = Column(Text, nullable=True)
    disliked_exercises = Column(Text, nullable=True)
    exercise_frequency = Column(Integer, nullable=True, default=3)
    exercise_duration = Column(Integer, nullable=True, default=30)
    preferred_intensity = Column(String(20), nullable=True, default="moderate")
    exercise_time_slots = Column(Text, nullable=True)
    has_gym_access = Column(Boolean, nullable=True, default=False)
    available_equipment = Column(Text, nullable=True)
    sleep_time = Column(String(10), nullable=True)
    wake_time = Column(String(10), nullable=True)
    work_style = Column(String(20), nullable=True)
    weekly_schedule = Column(Text, nullable=True)
    stress_level = Column(Integer, nullable=True)
    primary_goal = Column(String(50), nullable=True)
    target_weight = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="preferences")
    def to_dict(self) -> dict: return {}
    def update_from_dict(self, data: dict): pass

class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    monthly_plan_id = Column(Integer, ForeignKey("monthly_plans.id", ondelete="SET NULL"), nullable=True)
    week_number = Column(Integer, nullable=False)
    week_start_date = Column(DateTime, nullable=False)
    week_end_date = Column(DateTime, nullable=False)
    week_theme = Column(String(100), nullable=True)
    daily_plans = Column(Text, nullable=True)
    user_adjustments = Column(Text, nullable=True)
    completion_status = Column(Text, nullable=True)
    ai_weekly_summary = Column(Text, nullable=True)
    generation_status = Column(String(20), nullable=False, default="pending")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="weekly_plans")
    monthly_plan = relationship("MonthlyPlan", backref="weekly_plans")
    def get_plan_as_dict(self) -> dict: return {}
    def get_day_plan(self, day: str) -> dict: return {}
    def update_completion(self, day: str, status: dict): pass

class DietLog(Base):
    __tablename__ = "diet_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weekly_plan_id = Column(Integer, ForeignKey("weekly_plans.id", ondelete="SET NULL"), nullable=True)
    log_date = Column(DateTime, nullable=False)
    meal_type = Column(String(20), nullable=False)
    foods = Column(Text, nullable=True)
    total_calories = Column(Float, default=0)
    total_protein = Column(Float, default=0)
    total_carbs = Column(Float, default=0)
    total_fat = Column(Float, default=0)
    planned_calories = Column(Float, nullable=True)
    calorie_difference = Column(Float, nullable=True)
    adherence_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="diet_logs")
    weekly_plan = relationship("WeeklyPlan", backref="diet_logs")
    def get_foods_list(self) -> list: return []
    def calculate_totals(self): pass

class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weekly_plan_id = Column(Integer, ForeignKey("weekly_plans.id", ondelete="SET NULL"), nullable=True)
    log_date = Column(DateTime, nullable=False)
    courses = Column(Text, nullable=True)
    total_duration = Column(Integer, default=0)
    total_calories = Column(Float, default=0)
    course_count = Column(Integer, default=0)
    planned_duration = Column(Integer, nullable=True)
    planned_calories = Column(Float, nullable=True)
    duration_difference = Column(Integer, nullable=True)
    calorie_difference = Column(Float, nullable=True)
    adherence_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="exercise_logs")
    weekly_plan = relationship("WeeklyPlan", backref="exercise_logs")
    def get_courses_list(self) -> list: return []
    def calculate_totals(self): pass
