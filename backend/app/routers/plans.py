"""
月度计划 API 路由

提供月度健康计划的生成、获取、更新等接口
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any
import logging
import json
from datetime import datetime
from sqlalchemy.orm import Session

from ..services.plan_generator import generate_monthly_plan
from ..services.rule_engine import MedicalRuleEngine
from ..models import User, UserHealthProfile, MonthlyPlan
from ..db import get_db
from ..deps import get_current_user

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])

# 初始化规则引擎
try:
    rule_engine = MedicalRuleEngine()
    logger.info("[SUCCESS] 规则引擎初始化成功")
except Exception as e:
    logger.error(f"[ERROR] 规则引擎初始化失败: {e}")
    rule_engine = None


# ========== 请求/响应模型 ==========

class GeneratePlanRequest(BaseModel):
    """生成月度计划请求"""
    plan_month: Optional[str] = Field(None, description="计划月份，格式YYYY-MM，默认当月")
    user_preferences: Optional[Dict] = Field(None, description="用户偏好设置")


class GeneratePlanResponse(BaseModel):
    """生成月度计划响应"""
    success: bool
    message: str
    data: Optional[Dict] = None


class MonthlyPlanResponse(BaseModel):
    """月度计划响应"""
    success: bool
    message: str
    data: Optional[Dict] = None


# ========== API 端点 ==========

@router.post("/monthly/generate", response_model=GeneratePlanResponse)
async def generate_monthly_plan_api(
    request: GeneratePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    生成月度健康计划
    
    基于用户的健康档案（UserHealthProfile）和规则引擎分析，
    生成个性化的月度运动和饮食计划。
    
    流程：
    1. 获取用户健康档案
    2. 规则引擎分析健康指标
    3. 从元数据库筛选合适的运动和食材
    4. AI生成结构化计划
    5. 后端校验并存储
    """
    try:
        # 1. 获取用户健康档案
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()
        
        if not health_profile:
            return GeneratePlanResponse(
                success=False,
                message="请先提交体检数据，建立健康档案后再生成计划",
                data=None
            )
        
        # 获取健康指标
        health_metrics = health_profile.get_metrics_for_analysis()
        
        if not health_metrics:
            return GeneratePlanResponse(
                success=False,
                message="健康档案中没有有效的体检数据，请先提交体检报告",
                data=None
            )
        
        logger.info(f"用户 {current_user.id} 开始生成月度计划，指标数量: {len(health_metrics)}")
        
        # 2. 确定计划月份
        plan_month = request.plan_month
        if not plan_month:
            plan_month = datetime.utcnow().strftime("%Y-%m")
        
        # 3. 检查是否已有该月计划
        existing_plan = db.query(MonthlyPlan).filter(
            MonthlyPlan.user_id == current_user.id,
            MonthlyPlan.plan_month == plan_month,
            MonthlyPlan.is_active == True
        ).first()
        
        if existing_plan:
            # 返回已有计划
            return GeneratePlanResponse(
                success=True,
                message=f"{plan_month} 月度计划已存在，如需重新生成请先删除旧计划",
                data=existing_plan.get_plan_as_dict()
            )
        
        # 4. 生成新计划
        gender = health_profile.gender or current_user.gender or "default"
        user_preferences = request.user_preferences
        
        plan_result = generate_monthly_plan(
            health_metrics=health_metrics,
            gender=gender,
            user_preferences=user_preferences
        )
        
        # 5. 存储计划
        new_plan = MonthlyPlan(
            user_id=current_user.id,
            plan_month=plan_month,
            plan_title=f"{plan_month} 月度健康改善计划",
            month_goal=json.dumps(plan_result.get("month_goal", {}), ensure_ascii=False),
            exercise_framework=json.dumps(plan_result.get("exercise_framework", {}), ensure_ascii=False),
            diet_framework=json.dumps(plan_result.get("diet_framework", {}), ensure_ascii=False),
            medical_constraints=json.dumps(plan_result.get("medical_constraints_applied", {}), ensure_ascii=False),
            weekly_themes=json.dumps(plan_result.get("weekly_themes", []), ensure_ascii=False),
            ai_interpretation=plan_result.get("ai_interpretation", ""),
            rule_engine_input=json.dumps(plan_result.get("_meta", {}).get("rule_engine_input", {}), ensure_ascii=False),
            rule_engine_output=json.dumps(plan_result.get("_meta", {}).get("rule_engine_output_summary", {}), ensure_ascii=False),
            generation_status="completed",
            is_active=True
        )
        
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        
        logger.info(f"用户 {current_user.id} 月度计划生成成功，ID: {new_plan.id}")
        
        return GeneratePlanResponse(
            success=True,
            message="月度计划生成成功",
            data=new_plan.get_plan_as_dict()
        )
        
    except Exception as e:
        logger.error(f"生成月度计划失败: {e}")
        db.rollback()
        return GeneratePlanResponse(
            success=False,
            message=f"生成计划时发生错误: {str(e)}",
            data=None
        )


@router.get("/monthly/current", response_model=MonthlyPlanResponse)
async def get_current_monthly_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取当前月度计划
    
    智能返回逻辑：
    1. 优先返回当前月份的活跃计划
    2. 如果没有，返回用户最近的活跃计划
    3. 确保演示时无论什么日期都能显示数据
    """
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # 优先查找当前月份的活跃计划
        plan = db.query(MonthlyPlan).filter(
            MonthlyPlan.user_id == current_user.id,
            MonthlyPlan.plan_month == current_month,
            MonthlyPlan.is_active == True
        ).first()
        
        # 如果当前月没有，查找最近的活跃计划
        if not plan:
            plan = db.query(MonthlyPlan).filter(
                MonthlyPlan.user_id == current_user.id,
                MonthlyPlan.is_active == True
            ).order_by(MonthlyPlan.created_at.desc()).first()
        
        # 如果还没有活跃的，查找任意一个已完成的计划
        if not plan:
            plan = db.query(MonthlyPlan).filter(
                MonthlyPlan.user_id == current_user.id,
                MonthlyPlan.generation_status == "completed"
            ).order_by(MonthlyPlan.created_at.desc()).first()
        
        if not plan:
            return MonthlyPlanResponse(
                success=False,
                message="当前月份没有活跃的计划，请先生成计划",
                data=None
            )
        
        return MonthlyPlanResponse(
            success=True,
            message="获取成功",
            data=plan.get_plan_as_dict()
        )
        
    except Exception as e:
        logger.error(f"获取月度计划失败: {e}")
        return MonthlyPlanResponse(
            success=False,
            message=f"获取计划失败: {str(e)}",
            data=None
        )


@router.get("/monthly/{plan_month}", response_model=MonthlyPlanResponse)
async def get_monthly_plan_by_month(
    plan_month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取指定月份的计划
    
    Args:
        plan_month: 月份，格式 YYYY-MM
    """
    try:
        plan = db.query(MonthlyPlan).filter(
            MonthlyPlan.user_id == current_user.id,
            MonthlyPlan.plan_month == plan_month
        ).first()
        
        if not plan:
            return MonthlyPlanResponse(
                success=False,
                message=f"未找到 {plan_month} 的计划",
                data=None
            )
        
        return MonthlyPlanResponse(
            success=True,
            message="获取成功",
            data=plan.get_plan_as_dict()
        )
        
    except Exception as e:
        logger.error(f"获取月度计划失败: {e}")
        return MonthlyPlanResponse(
            success=False,
            message=f"获取计划失败: {str(e)}",
            data=None
        )


@router.get("/monthly/history", response_model=MonthlyPlanResponse)
async def get_plan_history(
    limit: int = Query(default=6, le=12, description="返回数量限制"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取历史计划列表
    
    返回用户的历史月度计划（简要信息）
    """
    try:
        plans = db.query(MonthlyPlan).filter(
            MonthlyPlan.user_id == current_user.id
        ).order_by(MonthlyPlan.plan_month.desc()).limit(limit).all()
        
        history = []
        for plan in plans:
            history.append({
                "id": plan.id,
                "plan_month": plan.plan_month,
                "plan_title": plan.plan_title,
                "generation_status": plan.generation_status,
                "is_active": plan.is_active,
                "created_at": plan.created_at.isoformat() if plan.created_at else None
            })
        
        return MonthlyPlanResponse(
            success=True,
            message="获取成功",
            data={"history": history, "total": len(history)}
        )
        
    except Exception as e:
        logger.error(f"获取计划历史失败: {e}")
        return MonthlyPlanResponse(
            success=False,
            message=f"获取历史失败: {str(e)}",
            data=None
        )


@router.delete("/monthly/{plan_id}")
async def delete_monthly_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除月度计划
    
    只能删除自己的计划
    """
    try:
        plan = db.query(MonthlyPlan).filter(
            MonthlyPlan.id == plan_id,
            MonthlyPlan.user_id == current_user.id
        ).first()
        
        if not plan:
            raise HTTPException(status_code=404, detail="计划不存在或无权删除")
        
        db.delete(plan)
        db.commit()
        
        return {"success": True, "message": "计划已删除"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除计划失败: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")


@router.post("/monthly/{plan_id}/regenerate", response_model=GeneratePlanResponse)
async def regenerate_monthly_plan(
    plan_id: int,
    request: GeneratePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    重新生成月度计划
    
    删除旧计划并生成新计划
    """
    try:
        # 查找并删除旧计划
        old_plan = db.query(MonthlyPlan).filter(
            MonthlyPlan.id == plan_id,
            MonthlyPlan.user_id == current_user.id
        ).first()
        
        if not old_plan:
            raise HTTPException(status_code=404, detail="计划不存在或无权操作")
        
        plan_month = old_plan.plan_month
        db.delete(old_plan)
        db.commit()
        
        # 生成新计划
        request.plan_month = plan_month
        return await generate_monthly_plan_api(request, db, current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重新生成计划失败: {e}")
        db.rollback()
        return GeneratePlanResponse(
            success=False,
            message=f"重新生成失败: {str(e)}",
            data=None
        )


# ========== 辅助 API ==========

@router.get("/exercises/available")
async def get_available_exercises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户可用的运动列表
    
    基于用户健康档案筛选后的运动
    """
    try:
        from ..services.plan_generator import plan_generator
        
        # 获取健康档案
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()
        
        if not health_profile:
            # 没有健康档案，返回所有运动
            from ..data.exercise_database import EXERCISE_DATABASE
            exercises = [
                {
                    "id": ex.id,
                    "name": ex.name,
                    "category": ex.category.value,
                    "intensity": ex.intensity.value,
                    "met_value": ex.met_value,
                    "duration": ex.duration
                }
                for ex in EXERCISE_DATABASE
            ]
            return {"success": True, "data": exercises, "filtered": False}
        
        # 分析并筛选
        health_metrics = health_profile.get_metrics_for_analysis()
        gender = health_profile.gender or current_user.gender or "default"
        
        rule_result = rule_engine.evaluate(health_metrics, gender)
        medical_constraints = plan_generator.extract_medical_constraints(rule_result)
        suitable_exercises = plan_generator.filter_exercises(medical_constraints)
        
        return {
            "success": True,
            "data": suitable_exercises,
            "filtered": True,
            "constraints": {
                "max_intensity": medical_constraints.get("max_intensity"),
                "forbidden_conditions": medical_constraints.get("forbidden_conditions", [])
            }
        }
        
    except Exception as e:
        logger.error(f"获取可用运动失败: {e}")
        return {"success": False, "message": str(e), "data": []}


@router.get("/foods/available")
async def get_available_foods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户可用的食材列表
    
    基于用户健康档案筛选后的食材
    """
    try:
        from ..services.plan_generator import plan_generator
        
        # 获取健康档案
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()
        
        if not health_profile:
            # 没有健康档案，返回所有食材
            from ..data.food_ingredients_data import CORE_FOODS_DATA
            foods = [
                {
                    "id": food.id,
                    "name": food.name,
                    "category": food.category.value,
                    "calories": food.nutrients.calories,
                    "protein": food.nutrients.protein
                }
                for food in CORE_FOODS_DATA
            ]
            return {"success": True, "data": foods, "filtered": False}
        
        # 分析并筛选
        health_metrics = health_profile.get_metrics_for_analysis()
        gender = health_profile.gender or current_user.gender or "default"
        
        rule_result = rule_engine.evaluate(health_metrics, gender)
        medical_constraints = plan_generator.extract_medical_constraints(rule_result)
        suitable_foods = plan_generator.filter_foods(medical_constraints)
        
        return {
            "success": True,
            "data": suitable_foods,
            "filtered": True,
            "constraints": {
                "dietary_restrictions": medical_constraints.get("dietary_restrictions", [])
            }
        }
        
    except Exception as e:
        logger.error(f"获取可用食材失败: {e}")
        return {"success": False, "message": str(e), "data": []}
