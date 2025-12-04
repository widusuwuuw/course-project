from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Union
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from ..services.rule_engine import MedicalRuleEngine
from ..models import LabReport, LabResult, User
from ..db import get_db
from fastapi.security import OAuth2PasswordBearer

# 创建可选的OAuth2 scheme
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/lab", tags=["laboratory"])

# 初始化规则引擎
try:
    rule_engine = MedicalRuleEngine()
    logger.info("[SUCCESS] 医学规则引擎初始化成功")
except Exception as e:
    logger.error(f"[ERROR] 医学规则引擎初始化失败: {e}")
    rule_engine = None


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """可选的用户认证依赖，如果没有token则返回None"""
    if not token:
        return None

    try:
        from jose import jwt, JWTError
        from ..security import SECRET_KEY, ALGORITHM

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None

        user = db.query(User).filter(User.email == email).first()
        return user
    except (JWTError, Exception):
        return None


class LabMetric(BaseModel):
    """实验室检测指标模型"""
    name: str = Field(..., description="指标名称", example="uric_acid")
    value: float = Field(..., description="检测值", example=450.5)
    unit: Optional[str] = Field(None, description="单位", example="μmol/L")


class LabAnalysisRequest(BaseModel):
    """实验室分析请求模型"""
    metrics: List[LabMetric] = Field(..., description="检测指标列表")
    gender: Optional[str] = Field("default", description="性别", pattern="^(male|female|default)$")
    patient_info: Optional[Dict] = Field(None, description="患者信息")


class LabAnalysisResponse(BaseModel):
    """实验室分析响应模型"""
    success: bool = Field(..., description="分析是否成功")
    message: str = Field(..., description="响应消息")
    data: Optional[Dict] = Field(None, description="分析结果数据")


class MetricInfo(BaseModel):
    """指标信息响应模型"""
    name: str = Field(..., description="指标名称")
    name_en: str = Field(..., description="英文名称")
    unit: str = Field(..., description="单位")
    description: str = Field(..., description="描述")
    normal_range: Optional[List[float]] = Field(None, description="正常范围")


@router.post("/analyze", response_model=LabAnalysisResponse)
async def analyze_lab_results(
    request: LabAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)  # 可选认证，允许匿名使用
):
    """
    分析实验室检测结果

    Args:
        request: 包含检测指标和分析参数的请求

    Returns:
        LabAnalysisResponse: 分析结果

    Raises:
        HTTPException: 当规则引擎未初始化或分析失败时
    """
    if rule_engine is None:
        raise HTTPException(
            status_code=503,
            detail="医学规则引擎未初始化，服务暂时不可用"
        )

    try:
        # 将请求数据转换为规则引擎需要的格式
        metrics_dict = {}
        for metric in request.metrics:
            metrics_dict[metric.name] = metric.value

        logger.info(f"🔍 开始分析 {len(metrics_dict)} 项检测指标: {list(metrics_dict.keys())}")
        logger.info(f"👤 性别: {request.gender}")

        # 执行分析
        analysis_result = rule_engine.evaluate(metrics_dict, request.gender)

        logger.info(f"✅ 分析完成 - 整体状态: {analysis_result['overall_assessment']['overall_status']}")
        logger.info(f"⚠️  异常指标数量: {analysis_result['overall_assessment']['abnormal_metrics']}")

        # 【新增】保存分析结果到数据库
        if current_user:
            try:
                logger.info(f"💾 保存检测报告到数据库 - 用户ID: {current_user.id}")

                # 创建实验室报告
                lab_report = LabReport(
                    user_id=current_user.id,
                    title="健康检测报告",
                    report_date=datetime.utcnow(),
                    gender=request.gender,
                    total_metrics=analysis_result['overall_assessment']['total_metrics'],
                    abnormal_metrics=analysis_result['overall_assessment']['abnormal_metrics'],
                    overall_status=analysis_result['overall_assessment']['overall_status'],
                    overall_risk_level=analysis_result['overall_assessment']['overall_risk_level'],
                    summary=analysis_result['overall_assessment']['summary'],
                    created_at=datetime.utcnow()
                )
                db.add(lab_report)
                db.flush()  # 获取 report.id

                # 保存每个检测结果的详情
                for result in analysis_result.get('individual_results', []):
                    # 提取正常范围
                    normal_range = None
                    if result.get('normal_range') and len(result['normal_range']) == 2:
                        normal_range = result['normal_range']

                    lab_result = LabResult(
                        report_id=lab_report.id,
                        metric_name=result.get('metric_name', ''),
                        metric_name_en=result.get('metric_name_en', ''),
                        metric_key=request.metrics[0].name if len(request.metrics) == 1 else '',  # 简化处理
                        value=result.get('value', 0),
                        unit=result.get('unit', ''),
                        status=result.get('status', 'unknown'),
                        risk_level=result.get('risk_level', 'unknown'),
                        abnormal_tag=result.get('abnormal_tag'),
                        message=result.get('message', ''),
                        normal_range_min=normal_range[0] if normal_range else None,
                        normal_range_max=normal_range[1] if normal_range else None,
                        created_at=datetime.utcnow()
                    )
                    db.add(lab_result)

                db.commit()
                logger.info(f"✅ 检测报告保存成功 - 报告ID: {lab_report.id}")

            except Exception as db_error:
                logger.error(f"[ERROR] 保存检测报告失败: {str(db_error)}")
                db.rollback()
                # 不影响API响应，继续返回分析结果

        return LabAnalysisResponse(
            success=True,
            message="分析完成",
            data=analysis_result
        )

    except Exception as e:
        logger.error(f"[ERROR] 分析过程中发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"分析失败: {str(e)}"
        )


@router.get("/metrics", response_model=List[MetricInfo])
async def get_available_metrics():
    """
    获取可用的检测指标列表

    Returns:
        List[MetricInfo]: 可用指标的信息列表
    """
    if rule_engine is None:
        raise HTTPException(
            status_code=503,
            detail="医学规则引擎未初始化，服务暂时不可用"
        )

    try:
        available_metrics = rule_engine.get_available_metrics()
        metrics_info = []

        for metric_name in available_metrics:
            metric_data = rule_engine.get_metric_info(metric_name)
            if metric_data:
                # 获取默认正常范围
                gender_config = rule_engine.get_gender_specific_threshold(metric_data, "default")
                normal_range = gender_config.get("normal_range") if gender_config else None

                metrics_info.append(MetricInfo(
                    name=metric_data.get("name", metric_name),
                    name_en=metric_data.get("name_en", metric_name),
                    unit=metric_data.get("unit", ""),
                    description=metric_data.get("description", ""),
                    normal_range=normal_range
                ))

        return metrics_info

    except Exception as e:
        logger.error(f"[ERROR] 获取指标列表时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取指标列表失败: {str(e)}"
        )


@router.get("/metrics/{metric_name}")
async def get_metric_details(metric_name: str):
    """
    获取指定指标的详细信息

    Args:
        metric_name: 指标名称

    Returns:
        Dict: 指标详细信息
    """
    if rule_engine is None:
        raise HTTPException(
            status_code=503,
            detail="医学规则引擎未初始化，服务暂时不可用"
        )

    try:
        metric_info = rule_engine.get_metric_info(metric_name)

        if not metric_info:
            raise HTTPException(
                status_code=404,
                detail=f"未找到指标: {metric_name}"
            )

        # 获取性别特定的参考范围
        gender_ranges = {}
        for gender in ["male", "female", "default"]:
            gender_config = rule_engine.get_gender_specific_threshold(metric_info, gender)
            if gender_config:
                gender_ranges[gender] = {
                    "normal_range": gender_config.get("normal_range"),
                    "high_threshold": gender_config.get("high_threshold"),
                    "description": gender_config.get("description")
                }

        return {
            "metric_info": metric_info,
            "gender_specific_ranges": gender_ranges
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] 获取指标详情时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取指标详情失败: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    健康检查接口

    Returns:
        Dict: 服务健康状态
    """
    if rule_engine is None:
        return {
            "status": "unhealthy",
            "message": "医学规则引擎未初始化",
            "available_metrics": 0
        }

    try:
        available_metrics = len(rule_engine.get_available_metrics())
        return {
            "status": "healthy",
            "message": "实验室分析服务运行正常",
            "available_metrics": available_metrics,
            "rules_version": rule_engine.rules_data.get("version", "unknown")
        }
    except Exception as e:
        return {
            "status": "degraded",
            "message": f"服务部分功能异常: {str(e)}",
            "available_metrics": 0
        }