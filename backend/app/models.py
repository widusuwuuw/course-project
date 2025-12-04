from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
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
