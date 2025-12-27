from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Union
import logging
import json
from datetime import datetime
from sqlalchemy.orm import Session

from ..services.rule_engine import MedicalRuleEngine
from ..models import LabReport, LabResult, User, UserHealthProfile
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
    category: Optional[str] = Field("comprehensive", description="检测类别")  # blood-routine, liver-function, etc.


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

                # 保存健康建议为JSON格式
                recommendations_json = json.dumps(analysis_result.get('all_recommendations', []), ensure_ascii=False)

                # ========== 1. 创建历史档案（LabReport）==========
                lab_report = LabReport(
                    user_id=current_user.id,
                    title=f"健康检测报告 - {request.category}",
                    report_date=datetime.utcnow(),
                    gender=request.gender,
                    total_metrics=analysis_result['overall_assessment']['total_metrics'],
                    abnormal_metrics=analysis_result['overall_assessment']['abnormal_metrics'],
                    overall_status=analysis_result['overall_assessment']['overall_status'],
                    overall_risk_level=analysis_result['overall_assessment']['overall_risk_level'],
                    summary=analysis_result['overall_assessment']['summary'],
                    recommendations=recommendations_json,
                    category=request.category,
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

                # ========== 2. 增量更新健康档案卡（UserHealthProfile）==========
                # 获取或创建用户健康档案
                health_profile = db.query(UserHealthProfile).filter(
                    UserHealthProfile.user_id == current_user.id
                ).first()
                
                if not health_profile:
                    # 首次创建健康档案
                    health_profile = UserHealthProfile(
                        user_id=current_user.id,
                        gender=request.gender
                    )
                    db.add(health_profile)
                    logger.info(f"📋 为用户创建新的健康档案卡")
                else:
                    # 更新性别（如果提供）
                    if request.gender and request.gender != 'default':
                        health_profile.gender = request.gender
                
                # 增量更新指标值（只更新本次提交的指标，保留其他指标的历史值）
                health_profile.update_metrics(metrics_dict)
                logger.info(f"📊 增量更新健康档案: {list(metrics_dict.keys())}")
                logger.info(f"📈 档案卡当前已录入指标数: {health_profile.total_metrics_count}")

                db.commit()
                logger.info(f"✅ 检测报告保存成功 - 报告ID: {lab_report.id}")
                logger.info(f"✅ 健康档案更新成功 - 档案ID: {health_profile.id}")

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


class ReportHistoryResponse(BaseModel):
    """报告历史响应模型"""
    success: bool = Field(..., description="获取是否成功")
    total_reports: int = Field(..., description="总报告数")
    reports: List[Dict] = Field(..., description="报告列表")


@router.get("/reports", response_model=ReportHistoryResponse)
async def get_user_reports(
    limit: int = 10,
    offset: int = 0,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    获取用户的检测报告历史

    Args:
        limit: 返回报告数量限制
        offset: 偏移量
        category: 检测类别过滤
        current_user: 当前用户

    Returns:
        ReportHistoryResponse: 用户历史报告
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="需要登录才能查看历史报告"
        )

    try:
        # 构建查询
        query = db.query(LabReport).filter(LabReport.user_id == current_user.id)

        if category:
            query = query.filter(LabReport.category == category)

        # 按时间倒序排列
        query = query.order_by(LabReport.report_date.desc())

        # 获取总数
        total = query.count()

        # 分页获取报告
        reports = query.offset(offset).limit(limit).all()

        # 转换为响应格式
        report_data = []
        for report in reports:
            # 解析健康建议
            recommendations = []
            if report.recommendations:
                try:
                    recommendations = json.loads(report.recommendations)
                except json.JSONDecodeError:
                    recommendations = []

            report_data.append({
                "id": report.id,
                "title": report.title,
                "category": report.category,
                "report_date": report.report_date.isoformat(),
                "total_metrics": report.total_metrics,
                "abnormal_metrics": report.abnormal_metrics,
                "overall_status": report.overall_status,
                "overall_risk_level": report.overall_risk_level,
                "summary": report.summary,
                "recommendations": recommendations,
                "has_ai_report": bool(report.ai_body_report)
            })

        return ReportHistoryResponse(
            success=True,
            total_reports=total,
            reports=report_data
        )

    except Exception as e:
        logger.error(f"[ERROR] 获取用户报告历史失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取报告历史失败: {str(e)}"
        )


class AIBodyReportRequest(BaseModel):
    """AI体质报告生成请求"""
    days_range: Optional[int] = Field(30, description="分析天数范围")


class AIBodyReportResponse(BaseModel):
    """AI体质报告响应"""
    success: bool = Field(..., description="生成是否成功")
    ai_report: str = Field(..., description="AI体质报告内容")


@router.get("/debug-deepseek")
async def debug_deepseek():
    """调试DeepSeek配置的简单接口"""
    try:
        from ..services.deepseek_client import generate_answer, is_enabled
        from ..services.deepseek_client import API_KEY, openai
        import os

        return {
            "openai_available": True,
            "api_key_set": bool(os.getenv("DEEPSEEK_API_KEY")),
            "api_key_prefix": os.getenv("DEEPSEEK_API_KEY", "")[:10] + "..." if os.getenv("DEEPSEEK_API_KEY") else "Not set",
            "model": os.getenv("DEEPSEEK_MODEL", "Not set"),
            "module_api_key": bool(API_KEY),
            "module_api_key_prefix": API_KEY[:10] + "..." if API_KEY else "Not set",
            "module_openai": bool(openai),
            "is_enabled": is_enabled()
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "openai_available": False,
            "api_key_set": bool(os.getenv("DEEPSEEK_API_KEY")),
            "api_key_prefix": os.getenv("DEEPSEEK_API_KEY", "")[:10] + "..." if os.getenv("DEEPSEEK_API_KEY") else "Not set",
            "model": os.getenv("DEEPSEEK_MODEL", "Not set"),
            "is_enabled": False
        }


@router.post("/ai-body-report", response_model=AIBodyReportResponse)
async def generate_ai_body_report(
    request: AIBodyReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    生成AI综合健康报告
    
    【重要改进】
    - 从 UserHealthProfile 读取用户完整的46项健康指标最新值
    - 调用医学规则引擎对全部指标进行分析
    - 基于完整健康画像生成综合报告
    
    Args:
        request: AI报告生成请求
        db: 数据库会话
        current_user: 当前用户

    Returns:
        AIBodyReportResponse: AI综合健康报告
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="需要登录才能生成AI体质报告"
        )

    try:
        # ========== 1. 从 UserHealthProfile 获取完整健康档案 ==========
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()

        if not health_profile:
            raise HTTPException(
                status_code=404,
                detail="没有找到健康档案，请先录入体检数据"
            )

        # 获取所有非空指标
        metrics_for_analysis = health_profile.get_metrics_for_analysis()
        all_metrics_with_time = health_profile.get_all_metrics()
        
        if not metrics_for_analysis:
            raise HTTPException(
                status_code=404,
                detail="健康档案中没有检测数据，请先录入体检指标"
            )

        logger.info(f"📋 读取健康档案 - 用户ID: {current_user.id}")
        logger.info(f"📊 已录入指标数: {len(metrics_for_analysis)}")

        # ========== 2. 调用医学规则引擎分析全部指标 ==========
        gender = health_profile.gender or 'default'
        logger.info(f"🔍 规则引擎开始分析 {len(metrics_for_analysis)} 项指标...")
        
        analysis_result = rule_engine.evaluate(metrics_for_analysis, gender)
        
        logger.info(f"✅ 规则引擎分析完成")
        logger.info(f"   整体状态: {analysis_result['overall_assessment']['overall_status']}")
        logger.info(f"   异常指标: {analysis_result['overall_assessment']['abnormal_metrics']}")
        logger.info(f"   风险等级: {analysis_result['overall_assessment']['overall_risk_level']}")

        # ========== 3. 整合分析结果构建提示词 ==========
        health_summary = []
        
        # 档案概览
        health_summary.append(f"""
【健康档案概览】
- 已录入指标总数: {len(metrics_for_analysis)}项
- 整体健康状态: {analysis_result['overall_assessment']['overall_status']}
- 异常指标数量: {analysis_result['overall_assessment']['abnormal_metrics']}项
- 综合风险等级: {analysis_result['overall_assessment']['overall_risk_level']}
""")

        # 医学规则引擎总结
        if analysis_result['overall_assessment'].get('summary'):
            health_summary.append(f"【医学规则引擎综合评估】\n{analysis_result['overall_assessment']['summary']}")

        # 按类别组织指标详情
        categories = {
            '血常规': ['wbc', 'rbc', 'hgb', 'plt', 'neut_per', 'lymp_per', 'mono_per', 'hct', 'mcv', 'mch', 'mchc'],
            '肝功能': ['alt', 'ast', 'alp', 'ggt', 'tbil', 'dbil', 'tp', 'alb', 'glb'],
            '肾功能': ['crea', 'bun', 'urea', 'uric_acid', 'cysc', 'egfr', 'microalb', 'upcr'],
            '血脂': ['tc', 'tg', 'hdl_c', 'ldl_c', 'vldl_c', 'apolipoprotein_a', 'apolipoprotein_b'],
            '血糖': ['glu', 'hba1c', 'fasting_insulin', 'c_peptide', 'homa_ir'],
            '电解质': ['na', 'k', 'cl', 'ca', 'p', 'mg']
        }
        
        # 构建指标结果映射（通过metric_key快速查找）
        individual_results = {r.get('metric_key', ''): r for r in analysis_result.get('individual_results', [])}
        
        health_summary.append("\n【各系统检测指标详情】")
        
        for category_name, metric_keys in categories.items():
            category_metrics = []
            for key in metric_keys:
                if key in metrics_for_analysis:
                    result = individual_results.get(key, {})
                    value = metrics_for_analysis[key]
                    metric_info = all_metrics_with_time.get(key, {})
                    updated_at = metric_info.get('updated_at')
                    
                    # 获取指标中文名和状态
                    metric_name = result.get('metric_name', key)
                    unit = result.get('unit', '')
                    status = result.get('status', 'unknown')
                    status_text = "正常" if status == "normal" else "异常"
                    message = result.get('message', '')
                    
                    # 格式化更新时间
                    time_str = ""
                    if updated_at:
                        time_str = f" (更新于: {updated_at.strftime('%Y-%m-%d')})"
                    
                    line = f"  - {metric_name}: {value} {unit} [{status_text}]{time_str}"
                    if message and status != "normal":
                        line += f"\n    → {message}"
                    category_metrics.append(line)
            
            if category_metrics:
                health_summary.append(f"\n▸ {category_name} ({len(category_metrics)}项):")
                health_summary.extend(category_metrics)
            else:
                health_summary.append(f"\n▸ {category_name}: 暂无数据")

        # 医学规则引擎健康建议
        all_recommendations = analysis_result.get('all_recommendations', [])
        if all_recommendations:
            health_summary.append(f"\n【医学规则引擎健康建议】")
            for i, rec in enumerate(all_recommendations, 1):
                health_summary.append(f"  {i}. {rec}")

        # 确定性别称呼
        gender_text = "男性" if gender == "male" else "女性" if gender == "female" else "用户"

        # ========== 4. 构建AI提示词（围栏式设计）==========
        ai_prompt = f"""
你是一位资深的健康管理师和临床医学分析师。请严格基于以下【用户完整健康档案】和【医学规则引擎分析结果】，为该{gender_text}用户生成一份专业、全面的个性化健康分析报告。

【重要说明】
- 以下是用户健康档案中所有已录入指标的最新值
- 每个指标都标注了最后更新时间，部分指标可能更新较早
- 医学规则引擎已对所有指标进行了专业分析，请参考其结论和建议

【重要约束 - 请严格遵守】
1. 只分析下方提供的指标数据，不要假设用户有其他检测结果
2. 不要在报告开头生成"报告对象"、"分析周期"、"报告生成日期"等元信息
3. 直接从"一、健康状况总体评估"开始撰写报告
4. 所有分析必须基于医学规则引擎的结论，不要凭空推断
5. 对于"暂无数据"的系统，简要说明"该系统暂未录入检测数据"

【用户完整健康档案 - 医学规则引擎分析结果】
用户性别: {gender_text}
{"".join(health_summary)}

【报告结构要求 - 请严格按此结构撰写】

# 综合健康分析报告

## 一、健康状况总体评估

### 1.1 档案概览
（总结已录入的指标数量、覆盖的检测系统、整体健康状态）

### 1.2 健康风险分层
（根据规则引擎分析结果，将风险因素分为高/中/低三级详细说明）

### 1.3 重点关注指标
（列出需要重点关注的异常指标，说明其临床意义）

## 二、各系统详细分析

### 2.1 血液系统
（分析血常规指标，评估造血功能、免疫状态等）

### 2.2 肝脏功能
（分析肝功能指标，评估肝脏健康状况）

### 2.3 肾脏功能
（分析肾功能指标，评估肾脏健康状况）

### 2.4 代谢系统
（分析血脂、血糖指标，评估代谢健康状况）

### 2.5 电解质平衡
（分析电解质指标，评估内环境稳定性）

## 三、综合健康建议

### 3.1 饮食调理方案
（基于异常指标给出具体的饮食建议，包括推荐食物和禁忌食物）

### 3.2 运动处方建议
（根据健康状况给出适合的运动类型、强度和频率建议）

### 3.3 生活方式调整
（作息、压力管理、戒烟限酒等方面的建议）

### 3.4 复查与随访计划
（建议复查的项目、频率，以及是否需要专科就诊）

## 四、温馨提示

（免责声明：本报告基于您的健康档案数据生成，仅供健康参考，不能替代医生诊断。如有不适或指标严重异常，请及时就医。）

【撰写要求】
1. 语言专业但通俗易懂，让普通用户能够理解
2. 建议要具体、可操作，避免泛泛而谈
3. 保持客观，不要过度渲染病情严重性
4. 对于正常指标也要给出健康维护建议
5. 全文控制在2000-3000字左右
"""

        # 直接调用DeepSeek API生成AI报告
        logger.info("正在调用DeepSeek API生成AI报告...")
        try:
            import requests
            import os
            from dotenv import load_dotenv

            # 确保环境变量加载
            load_dotenv(override=True)

            api_key = os.getenv("DEEPSEEK_API_KEY") or "sk-22872ac162944973b31d3541b409a562"
            model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

            logger.info(f"DeepSeek API配置: API_KEY={api_key[:10]}..., MODEL={model}")

            # 调用DeepSeek API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            data = {
                "model": model,
                "messages": [
                    {"role": "user", "content": ai_prompt}
                ],
                "temperature": 0.3,
                "stream": False
            }

            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers=headers,
                json=data,
                timeout=120
            )

            response.raise_for_status()
            result = response.json()
            ai_report = result["choices"][0]["message"]["content"].strip()
            logger.info(f"AI报告生成成功，长度: {len(ai_report)} 字符")

        except Exception as e:
            logger.error(f"DeepSeek API调用失败: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"生成AI体质报告失败: {str(e)}"
            )

        # ========== 5. 保存AI报告到健康档案 ==========
        health_profile.ai_comprehensive_report = ai_report
        health_profile.ai_report_generated_at = datetime.utcnow()
        db.commit()
        logger.info(f"✅ AI综合报告已保存到健康档案 - 档案ID: {health_profile.id}")

        return AIBodyReportResponse(
            success=True,
            ai_report=ai_report
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] 生成AI体质报告失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"生成AI体质报告失败: {str(e)}"
        )