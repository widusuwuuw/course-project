"""
周计划API - 基于月度计划生成每周具体执行计划
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import json

from ..db import get_db
from ..auth import get_current_user
from ..models import User, MonthlyPlan, WeeklyPlan, UserPreferences, UserHealthProfile
from ..services.weekly_plan_generator import generate_weekly_plan

router = APIRouter(prefix="/api/v1/weekly-plans", tags=["周计划"])


# ============ Pydantic 模型 ============

class DayAdjustment(BaseModel):
    """每日调整请求"""
    reduce_exercise: bool = Field(default=False, description="减少运动量")
    skip_exercise: bool = Field(default=False, description="跳过运动")
    custom_note: Optional[str] = Field(default=None, description="自定义备注")


class WeeklyPlanGenerateRequest(BaseModel):
    """生成周计划请求"""
    monthly_plan_id: int = Field(..., description="月度计划ID")
    week_number: int = Field(..., ge=1, le=5, description="月内第几周")
    week_start_date: Optional[str] = Field(default=None, description="周一日期 (YYYY-MM-DD)")
    adjustments: Optional[Dict[str, DayAdjustment]] = Field(
        default=None, 
        description="每日调整 (key: monday/tuesday/...)"
    )


class DayCompletionUpdate(BaseModel):
    """更新完成状态"""
    exercise_completed: Optional[bool] = Field(default=None, description="运动是否完成")
    diet_adherence: Optional[int] = Field(default=None, ge=0, le=100, description="饮食遵守程度 0-100")
    notes: Optional[str] = Field(default=None, description="备注")


class WeeklyPlanAdjustRequest(BaseModel):
    """调整周计划请求"""
    day: str = Field(..., description="要调整的日期 (monday/tuesday/...)")
    adjustment_type: str = Field(..., description="调整类型: reduce_exercise/skip_exercise/change_exercise/change_diet")
    new_exercise_id: Optional[str] = Field(default=None, description="替换的运动ID")
    custom_note: Optional[str] = Field(default=None, description="调整说明")


class ExerciseItem(BaseModel):
    """运动项"""
    exercise_id: str
    name: str
    duration: int
    intensity: str
    calories_target: int
    time_slot: str
    execution_guide: str
    alternatives: List[Dict[str, str]]


class MealItem(BaseModel):
    """餐食项"""
    foods: List[Dict[str, str]]
    calories: int


class DietPlan(BaseModel):
    """饮食计划"""
    calories_target: int
    breakfast: MealItem
    lunch: MealItem
    dinner: MealItem
    snacks: MealItem
    hydration_goal: str


class DailyPlan(BaseModel):
    """每日计划"""
    date: str
    day_name: str
    is_rest_day: bool
    exercise: Optional[ExerciseItem]
    diet: DietPlan
    tips: str


class WeeklyPlanResponse(BaseModel):
    """周计划响应"""
    id: int
    user_id: int
    monthly_plan_id: Optional[int] = None  # 月度计划可能被删除
    week_number: int
    week_start_date: str
    week_end_date: str
    week_theme: Optional[str] = None
    daily_plans: Dict[str, Any]
    ai_weekly_summary: str = ""
    completion_status: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


# ============ API 端点 ============

@router.post("/generate", response_model=WeeklyPlanResponse)
async def generate_weekly_plan_endpoint(
    request: WeeklyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    生成周计划
    
    基于月度计划和用户偏好，生成详细的每周执行计划
    """
    # 1. 获取月度计划
    monthly_plan = db.query(MonthlyPlan).filter(
        MonthlyPlan.id == request.monthly_plan_id,
        MonthlyPlan.user_id == current_user.id
    ).first()
    
    if not monthly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月度计划不存在或无权访问"
        )
    
    # 2. 获取用户偏好
    user_prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    user_preferences_dict = user_prefs.to_dict() if user_prefs else {}
    
    # 2.5 获取用户健康档案（用于个性化饮食）
    health_profile = db.query(UserHealthProfile).filter(
        UserHealthProfile.user_id == current_user.id
    ).first()
    
    health_metrics = None
    user_gender = "male"
    if health_profile:
        health_metrics = health_profile.get_metrics_for_analysis()
        # 从用户信息获取性别（如果有）
        if hasattr(current_user, 'gender') and current_user.gender:
            user_gender = current_user.gender
    
    # 3. 获取月度计划内容（使用 get_plan_as_dict 方法）
    monthly_plan_content = monthly_plan.get_plan_as_dict()
    
    # 4. 解析周开始日期
    week_start = None
    if request.week_start_date:
        try:
            week_start = datetime.strptime(request.week_start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的日期格式，请使用 YYYY-MM-DD"
            )
    
    # 5. 解析调整请求
    adjustments_dict = {}
    if request.adjustments:
        for day, adj in request.adjustments.items():
            adjustments_dict[day] = adj.dict()
    
    # 6. 调用生成服务（传入健康档案）
    try:
        weekly_plan_data = generate_weekly_plan(
            monthly_plan=monthly_plan_content,
            user_preferences=user_preferences_dict,
            week_number=request.week_number,
            week_start_date=week_start,
            user_adjustments=adjustments_dict,
            health_metrics=health_metrics,
            user_gender=user_gender
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成周计划失败: {str(e)}"
        )
    
    # 7. 检查是否已存在相同周的计划
    # 首先按日期范围查找（可能是旧月度计划生成的）
    week_start_date = datetime.strptime(weekly_plan_data["week_start_date"], "%Y-%m-%d").date()
    week_end_date = datetime.strptime(weekly_plan_data["week_end_date"], "%Y-%m-%d").date()
    
    existing = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.week_start_date == week_start_date,
        WeeklyPlan.week_end_date == week_end_date
    ).first()
    
    # 如果没找到，再按旧逻辑查找（同一月度计划的同一周）
    if not existing:
        existing = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == current_user.id,
            WeeklyPlan.monthly_plan_id == request.monthly_plan_id,
            WeeklyPlan.week_number == request.week_number
        ).first()
    
    # 转换数据为JSON字符串（模型中是Text类型）
    daily_plans_json = json.dumps(weekly_plan_data.get("daily_plans", {}), ensure_ascii=False)
    user_adjustments_json = json.dumps(weekly_plan_data.get("user_adjustments", {}), ensure_ascii=False)
    
    if existing:
        # 更新已有计划（包括月度计划ID，以便支持从新月度计划更新）
        existing.monthly_plan_id = request.monthly_plan_id  # 更新关联的月度计划
        existing.week_number = request.week_number
        existing.week_start_date = datetime.strptime(weekly_plan_data["week_start_date"], "%Y-%m-%d")
        existing.week_end_date = datetime.strptime(weekly_plan_data["week_end_date"], "%Y-%m-%d")
        existing.daily_plans = daily_plans_json
        existing.ai_weekly_summary = weekly_plan_data.get("ai_weekly_summary", "")
        existing.user_adjustments = user_adjustments_json
        existing.week_theme = weekly_plan_data.get("week_theme", "")
        existing.generation_status = "completed"
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        weekly_plan_record = existing
    else:
        # 创建新计划
        weekly_plan_record = WeeklyPlan(
            user_id=current_user.id,
            monthly_plan_id=request.monthly_plan_id,
            week_number=request.week_number,
            week_start_date=datetime.strptime(weekly_plan_data["week_start_date"], "%Y-%m-%d"),
            week_end_date=datetime.strptime(weekly_plan_data["week_end_date"], "%Y-%m-%d"),
            week_theme=weekly_plan_data.get("week_theme", ""),
            daily_plans=daily_plans_json,
            ai_weekly_summary=weekly_plan_data.get("ai_weekly_summary", ""),
            user_adjustments=user_adjustments_json,
            completion_status=json.dumps({}, ensure_ascii=False),
            generation_status="completed"
        )
        db.add(weekly_plan_record)
        db.commit()
        db.refresh(weekly_plan_record)
    
    # 解析JSON字段用于响应
    daily_plans_dict = json.loads(weekly_plan_record.daily_plans) if weekly_plan_record.daily_plans else {}
    completion_status_dict = json.loads(weekly_plan_record.completion_status) if weekly_plan_record.completion_status else {}
    
    return WeeklyPlanResponse(
        id=weekly_plan_record.id,
        user_id=weekly_plan_record.user_id,
        monthly_plan_id=weekly_plan_record.monthly_plan_id,
        week_number=weekly_plan_record.week_number,
        week_start_date=weekly_plan_record.week_start_date.strftime("%Y-%m-%d"),
        week_end_date=weekly_plan_record.week_end_date.strftime("%Y-%m-%d"),
        week_theme=weekly_plan_record.week_theme or "",
        daily_plans=daily_plans_dict,
        ai_weekly_summary=weekly_plan_record.ai_weekly_summary or "",
        completion_status=completion_status_dict,
        created_at=weekly_plan_record.created_at,
        updated_at=weekly_plan_record.updated_at
    )


@router.get("/current", response_model=WeeklyPlanResponse)
async def get_current_weekly_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前周计划
    
    自动计算当前是月内第几周，返回对应的周计划
    """
    today = datetime.now().date()
    
    # 计算本周一
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    # 查找包含今天的周计划（按更新时间降序，获取最新的）
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.week_start_date <= today,
        WeeklyPlan.week_end_date >= today
    ).order_by(WeeklyPlan.updated_at.desc()).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当前周没有计划，请先生成周计划"
        )
    
    # 解析JSON字段
    daily_plans_dict = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    completion_status_dict = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
    
    return WeeklyPlanResponse(
        id=weekly_plan.id,
        user_id=weekly_plan.user_id,
        monthly_plan_id=weekly_plan.monthly_plan_id,
        week_number=weekly_plan.week_number,
        week_start_date=weekly_plan.week_start_date.strftime("%Y-%m-%d"),
        week_end_date=weekly_plan.week_end_date.strftime("%Y-%m-%d"),
        week_theme=weekly_plan.week_theme or "",
        daily_plans=daily_plans_dict,
        ai_weekly_summary=weekly_plan.ai_weekly_summary or "",
        completion_status=completion_status_dict,
        created_at=weekly_plan.created_at,
        updated_at=weekly_plan.updated_at
    )


@router.post("/current/refresh-diet-link")
async def refresh_current_plan_diet_link(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    刷新当前周计划的运动-饮食联动数据
    
    用于旧版周计划升级，添加 exercise_diet_link 字段
    """
    from ..services.weekly_plan_generator import WeeklyPlanGenerator
    
    today = datetime.now().date()
    
    # 查找当前周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.week_start_date <= today,
        WeeklyPlan.week_end_date >= today
    ).order_by(WeeklyPlan.updated_at.desc()).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当前周没有计划"
        )
    
    generator = WeeklyPlanGenerator()
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    updated_days = []
    
    for day, day_data in daily_plans.items():
        exercises = day_data.get("exercises", [])
        diet = day_data.get("diet", {})
        
        # 分析运动
        analysis = generator._analyze_exercise_for_diet(exercises)
        
        if analysis["total_calories"] > 0:
            # 添加或更新联动数据
            diet["exercise_diet_link"] = {
                "exercise_calories": analysis["total_calories"],
                "calorie_adjustment": int(analysis["total_calories"] * 0.8),
                "has_strength_training": analysis["has_strength_training"],
                "is_high_intensity": analysis["is_high_intensity"],
                "primary_time_slot": analysis["primary_time_slot"],
                "post_exercise_tips": analysis["post_exercise_tips"]
            }
            day_data["diet"] = diet
            updated_days.append(day)
        else:
            # 休息日：移除联动数据（如果有）
            if "exercise_diet_link" in diet:
                del diet["exercise_diet_link"]
                day_data["diet"] = diet
    
    # 保存更新
    weekly_plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)
    db.commit()
    
    return {
        "message": "运动-饮食联动数据已刷新",
        "updated_days": updated_days,
        "plan_id": weekly_plan.id
    }


@router.get("/today")
async def get_today_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取今日计划
    
    返回当天的运动和饮食计划
    """
    today = datetime.now().date()
    weekday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][today.weekday()]
    
    # 查找当前周计划（按更新时间降序，获取最新的）
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.week_start_date <= today,
        WeeklyPlan.week_end_date >= today
    ).order_by(WeeklyPlan.updated_at.desc()).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="当前周没有计划"
        )
    
    # 解析JSON字段
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    today_plan = daily_plans.get(weekday)
    
    if not today_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="今日计划不存在"
        )
    
    # 获取今日完成状态
    completion_status = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
    today_completion = completion_status.get(weekday, {})
    
    return {
        "date": today.strftime("%Y-%m-%d"),
        "day_name": today_plan.get("day_name", ""),
        "weekday": weekday,
        "is_rest_day": today_plan.get("is_rest_day", False),
        "exercise": today_plan.get("exercise"),
        "diet": today_plan.get("diet"),
        "tips": today_plan.get("tips", ""),
        "completion": {
            "exercise_completed": today_completion.get("exercise_completed", False),
            "diet_adherence": today_completion.get("diet_adherence", 0),
            "notes": today_completion.get("notes", "")
        }
    }


@router.get("/{plan_id}", response_model=WeeklyPlanResponse)
async def get_weekly_plan_by_id(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    根据ID获取周计划
    """
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="周计划不存在或无权访问"
        )
    
    # 解析JSON字段
    daily_plans_dict = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    completion_status_dict = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
    
    return WeeklyPlanResponse(
        id=weekly_plan.id,
        user_id=weekly_plan.user_id,
        monthly_plan_id=weekly_plan.monthly_plan_id,
        week_number=weekly_plan.week_number,
        week_start_date=weekly_plan.week_start_date.strftime("%Y-%m-%d"),
        week_end_date=weekly_plan.week_end_date.strftime("%Y-%m-%d"),
        week_theme=weekly_plan.week_theme or "",
        daily_plans=daily_plans_dict,
        ai_weekly_summary=weekly_plan.ai_weekly_summary or "",
        completion_status=completion_status_dict,
        created_at=weekly_plan.created_at,
        updated_at=weekly_plan.updated_at
    )


@router.get("/by-monthly/{monthly_plan_id}")
async def get_weekly_plans_by_monthly(
    monthly_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取月度计划下的所有周计划
    """
    weekly_plans = db.query(WeeklyPlan).filter(
        WeeklyPlan.monthly_plan_id == monthly_plan_id,
        WeeklyPlan.user_id == current_user.id
    ).order_by(WeeklyPlan.week_number).all()
    
    return {
        "monthly_plan_id": monthly_plan_id,
        "weekly_plans": [
            {
                "id": wp.id,
                "week_number": wp.week_number,
                "week_start_date": wp.week_start_date.strftime("%Y-%m-%d"),
                "week_end_date": wp.week_end_date.strftime("%Y-%m-%d"),
                "has_completion_data": bool(wp.completion_status)
            }
            for wp in weekly_plans
        ]
    }


@router.patch("/{plan_id}/adjust")
async def adjust_weekly_plan(
    plan_id: int,
    request: WeeklyPlanAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    调整周计划中的某一天
    """
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="周计划不存在或无权访问"
        )
    
    # 解析JSON字段
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    day_plan = daily_plans.get(request.day)
    
    if not day_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的日期: {request.day}"
        )
    
    # 根据调整类型执行调整
    if request.adjustment_type == "skip_exercise":
        day_plan["is_rest_day"] = True
        day_plan["exercise"] = None
        day_plan["tips"] = f"已调整为休息日。{request.custom_note or ''}"
    
    elif request.adjustment_type == "reduce_exercise":
        if day_plan.get("exercise"):
            day_plan["exercise"]["duration"] = max(15, day_plan["exercise"].get("duration", 30) // 2)
            day_plan["exercise"]["intensity"] = "light"
            day_plan["tips"] = f"已降低运动强度。{request.custom_note or ''}"
    
    elif request.adjustment_type == "change_exercise":
        if request.new_exercise_id and day_plan.get("exercise"):
            # 从运动数据库获取新运动信息
            try:
                from ..data.exercise_database import EXERCISE_DATABASE
                new_exercise = next((ex for ex in EXERCISE_DATABASE if ex.id == request.new_exercise_id), None)
                if new_exercise:
                    day_plan["exercise"]["exercise_id"] = request.new_exercise_id
                    day_plan["exercise"]["exercise_name"] = new_exercise.name
                    day_plan["exercise"]["duration"] = day_plan["exercise"].get("duration", new_exercise.default_duration)
                    day_plan["tips"] = f"已更换运动项目为：{new_exercise.name}。{request.custom_note or ''}"
                else:
                    day_plan["exercise"]["exercise_id"] = request.new_exercise_id
                    day_plan["tips"] = f"已更换运动项目。{request.custom_note or ''}"
            except Exception as e:
                # 如果获取失败，至少更新ID
                day_plan["exercise"]["exercise_id"] = request.new_exercise_id
                day_plan["tips"] = f"已更换运动项目。{request.custom_note or ''}"
    
    # 更新调整记录（解析JSON）
    adjustments = json.loads(weekly_plan.user_adjustments) if weekly_plan.user_adjustments else {}
    adjustments[request.day] = {
        "type": request.adjustment_type,
        "custom_note": request.custom_note,
        "adjusted_at": datetime.utcnow().isoformat()
    }
    
    # 保存更新（转为JSON字符串）
    weekly_plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)
    weekly_plan.user_adjustments = json.dumps(adjustments, ensure_ascii=False)
    weekly_plan.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "status": "success",
        "message": f"已调整{day_plan.get('day_name', request.day)}的计划",
        "adjusted_day": day_plan
    }


@router.patch("/{plan_id}/completion/{day}")
async def update_day_completion(
    plan_id: int,
    day: str,
    request: DayCompletionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新某天的完成状态
    """
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="周计划不存在或无权访问"
        )
    
    valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    if day not in valid_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的日期: {day}"
        )
    
    # 更新完成状态（解析JSON）
    completion = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
    if day not in completion:
        completion[day] = {}
    
    if request.exercise_completed is not None:
        completion[day]["exercise_completed"] = request.exercise_completed
    if request.diet_adherence is not None:
        completion[day]["diet_adherence"] = request.diet_adherence
    if request.notes is not None:
        completion[day]["notes"] = request.notes
    
    completion[day]["updated_at"] = datetime.utcnow().isoformat()
    
    # 保存为JSON字符串
    weekly_plan.completion_status = json.dumps(completion, ensure_ascii=False)
    weekly_plan.updated_at = datetime.utcnow()
    db.commit()
    
    # 计算周完成度
    exercise_completed_days = sum(1 for d in completion.values() if d.get("exercise_completed"))
    avg_diet_adherence = 0
    diet_days = [d.get("diet_adherence") for d in completion.values() if d.get("diet_adherence") is not None]
    if diet_days:
        avg_diet_adherence = sum(diet_days) / len(diet_days)
    
    return {
        "status": "success",
        "day": day,
        "completion": completion[day],
        "weekly_summary": {
            "exercise_completed_days": exercise_completed_days,
            "average_diet_adherence": round(avg_diet_adherence, 1)
        }
    }


@router.delete("/{plan_id}")
async def delete_weekly_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除周计划
    """
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="周计划不存在或无权访问"
        )
    
    db.delete(weekly_plan)
    db.commit()
    
    return {"status": "success", "message": "周计划已删除"}


# ============ AI 微调功能 ============

class AIAdjustRequest(BaseModel):
    """AI微调请求"""
    user_request: str = Field(..., description="用户的自然语言调整需求", min_length=2, max_length=500)
    adjust_type: str = Field(default="exercise", description="调整类型: exercise 或 diet")


@router.post("/{plan_id}/ai-adjust")
async def ai_adjust_weekly_plan(
    plan_id: int,
    request: AIAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    使用AI根据用户自然语言需求调整周计划
    
    示例运动调整请求：
    - "周二晚上太忙，把运动改到早上"
    - "把周四的太极拳换成八段锦"
    
    示例饮食调整请求：
    - "把周三的早餐换成清淡点的"
    - "周末减少碳水摄入"
    - "周一午餐不想吃米饭"
    """
    from ..services.deepseek_client import generate_answer
    from ..data.exercise_database import get_all_exercises
    from ..data.food_ingredients_data import CORE_FOODS_DATA
    
    # 1. 获取周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.id == plan_id,
        WeeklyPlan.user_id == current_user.id
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="周计划不存在或无权访问"
        )
    
    # 2. 解析当前计划
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    
    # 3. 根据调整类型选择不同处理逻辑
    if request.adjust_type == "diet":
        return await _ai_adjust_diet_plan(
            weekly_plan, daily_plans, request.user_request, db, generate_answer, CORE_FOODS_DATA
        )
    
    # 4. 默认处理运动调整
    # 构建当前计划摘要和可用运动列表
    plan_summary = _build_plan_summary(daily_plans)
    
    # 获取可用运动列表
    all_exercises = get_all_exercises()
    exercise_list = "\n".join([f"- {ex.name}（{ex.category.value}，{ex.intensity.value}强度，{ex.duration}分钟）" for ex in all_exercises])
    
    # 4. 使用AI解析用户需求并生成调整方案
    
    system_prompt = """你是一个健康计划调整助手。用户会告诉你他们想对周计划做的调整。
你需要理解用户的需求，然后输出一个JSON格式的调整指令。

当前周计划：
""" + plan_summary + """

可用的运动项目（请从以下列表中选择）：
""" + exercise_list + """

输出格式必须是以下JSON（不要包含任何其他文字）：
{
    "understood": true,
    "adjustments": [
        {
            "day": "monday/tuesday/wednesday/thursday/friday/saturday/sunday",
            "action": "change_time/swap_exercise/skip_day/add_exercise/remove_exercise/move_exercise",
            "details": {
                "from_time_slot": "早晨/下午/晚上",  // 可选
                "to_time_slot": "早晨/下午/晚上",    // 可选
                "exercise_name": "运动名称",         // 可选
                "new_exercise_name": "新运动名称",   // 可选
                "target_day": "monday/tuesday/..."   // move_exercise时必填，目标日期
            }
        }
    ],
    "explanation": "简短解释你将要做的调整"
}

action类型说明：
- change_time: 修改某天运动的时间段（早晨/下午/晚上）
- swap_exercise: 替换某个运动为另一个运动（需要exercise_name和new_exercise_name）
- skip_day: 将某天设为休息日
- add_exercise: 向某天添加运动（必须从可用运动列表中选择！new_exercise_name填运动名称，to_time_slot填时间段）
- remove_exercise: 从某天移除某个运动（exercise_name填要移除的运动名称）
- move_exercise: 将运动从一天移动到另一天（需要指定target_day）

重要提示：
- 如果用户说"添加一些运动"而没有指定具体运动，你需要根据当天情况从可用运动列表中选择1-2个合适的运动
- 如果用户要把运动从A天移到B天，应该使用move_exercise，设置day为源日期，target_day为目标日期
- 添加运动时，new_exercise_name必须是可用运动列表中的运动名称！

如果无法理解用户需求，返回：
{
    "understood": false,
    "error": "无法理解的原因"
}

注意：
- day必须是英文星期（monday到sunday）
- 时间段只能是：早晨、下午、晚上
- 只输出JSON，不要有其他内容"""

    user_prompt = f"用户需求：{request.user_request}"
    
    try:
        # 使用 generate_answer 函数调用 DeepSeek API
        ai_response = generate_answer(
            question=user_prompt,
            system_prompt=system_prompt
        )
        
        # 解析AI响应
        response_text = ai_response.strip()
        # 移除可能的markdown代码块标记
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        adjustment_plan = json.loads(response_text)
        
        print(f"[AI调整] 用户需求: {request.user_request}")
        print(f"[AI调整] AI解析结果: {json.dumps(adjustment_plan, ensure_ascii=False, indent=2)}")
        
        if not adjustment_plan.get("understood", False):
            return {
                "status": "error",
                "message": adjustment_plan.get("error", "无法理解您的需求，请尝试更具体的描述")
            }
        
        # 5. 执行调整
        changes_made = []
        for adj in adjustment_plan.get("adjustments", []):
            day = adj.get("day")
            action = adj.get("action")
            details = adj.get("details", {})
            
            print(f"[AI调整] 执行动作: day={day}, action={action}, details={details}")
            
            if day not in daily_plans:
                continue
            
            day_plan = daily_plans[day]
            
            if action == "change_time":
                # 修改运动时间段
                changes = _change_exercise_time(day_plan, details)
                if changes:
                    changes_made.append(f"{_day_to_chinese(day)}：{changes}")
                    
            elif action == "swap_exercise":
                # 替换运动
                changes = _swap_exercise(day_plan, details)
                if changes:
                    changes_made.append(f"{_day_to_chinese(day)}：{changes}")
                    
            elif action == "skip_day":
                # 设为休息日
                day_plan["is_rest_day"] = True
                day_plan["exercises"] = []
                if day_plan.get("exercise"):
                    day_plan["exercise"] = None
                changes_made.append(f"{_day_to_chinese(day)}：设为休息日")
            
            elif action == "add_exercise":
                # 添加运动
                changes = _add_exercise(day_plan, details, all_exercises)
                if changes:
                    changes_made.append(f"{_day_to_chinese(day)}：{changes}")
                    
            elif action == "remove_exercise":
                # 移除特定运动
                changes = _remove_exercise(day_plan, details)
                if changes:
                    changes_made.append(f"{_day_to_chinese(day)}：{changes}")
            
            elif action == "move_exercise":
                # 将运动从一天移动到另一天
                target_day = details.get("target_day")
                if target_day and target_day in daily_plans:
                    print(f"[AI调整] 移动运动: 从{day}到{target_day}")
                    changes = _move_exercise(day_plan, daily_plans[target_day], details)
                    if changes:
                        changes_made.append(changes)
                        print(f"[AI调整] 移动成功: {changes}")
                    else:
                        print(f"[AI调整] 移动失败: 没有找到要移动的运动")
                else:
                    print(f"[AI调整] 移动失败: target_day={target_day}, 是否在daily_plans中={target_day in daily_plans if target_day else False}")
        
        # 6. 保存更新
        weekly_plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)
        weekly_plan.updated_at = datetime.utcnow()
        
        print(f"[AI调整] 保存更新后的daily_plans:")
        for day_key, day_data in daily_plans.items():
            ex_count = len(day_data.get("exercises", []))
            is_rest = day_data.get("is_rest_day", False)
            print(f"  {day_key}: {ex_count} exercises, is_rest_day={is_rest}")
        
        # 记录调整历史
        user_adjustments = json.loads(weekly_plan.user_adjustments) if weekly_plan.user_adjustments else {}
        if "history" not in user_adjustments:
            user_adjustments["history"] = []
        user_adjustments["history"].append({
            "timestamp": datetime.now().isoformat(),
            "request": request.user_request,
            "changes": changes_made
        })
        weekly_plan.user_adjustments = json.dumps(user_adjustments, ensure_ascii=False)
        
        db.commit()
        
        return {
            "status": "success",
            "message": "计划已调整",
            "explanation": adjustment_plan.get("explanation", ""),
            "changes": changes_made,
            "updated_plan": daily_plans
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": "error", 
            "message": f"AI响应解析失败，请重试。错误: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"调整失败: {str(e)}"
        }


def _build_plan_summary(daily_plans: dict) -> str:
    """构建计划摘要供AI理解"""
    day_names = {
        "monday": "周一", "tuesday": "周二", "wednesday": "周三",
        "thursday": "周四", "friday": "周五", "saturday": "周六", "sunday": "周日"
    }
    
    lines = []
    for day, plan in daily_plans.items():
        day_cn = day_names.get(day, day)
        if plan.get("is_rest_day"):
            lines.append(f"{day_cn}: 休息日")
        else:
            exercises = plan.get("exercises", [])
            if not exercises and plan.get("exercise"):
                exercises = [plan.get("exercise")]
            
            if exercises:
                ex_list = []
                for ex in exercises:
                    name = ex.get("name", "未知")
                    time_slot = ex.get("time_slot", "")
                    duration = ex.get("duration", 0)
                    ex_list.append(f"{name}({time_slot}, {duration}分钟)")
                lines.append(f"{day_cn}: {', '.join(ex_list)}")
            else:
                lines.append(f"{day_cn}: 无运动安排")
    
    return "\n".join(lines)


def _day_to_chinese(day: str) -> str:
    """英文星期转中文"""
    mapping = {
        "monday": "周一", "tuesday": "周二", "wednesday": "周三",
        "thursday": "周四", "friday": "周五", "saturday": "周六", "sunday": "周日"
    }
    return mapping.get(day, day)


def _change_exercise_time(day_plan: dict, details: dict) -> str:
    """修改运动时间段"""
    from_slot = details.get("from_time_slot")
    to_slot = details.get("to_time_slot")
    
    if not to_slot:
        return ""
    
    exercises = day_plan.get("exercises", [])
    changed = []
    
    for ex in exercises:
        # 如果指定了from_slot，只修改匹配的；否则修改所有
        if from_slot and ex.get("time_slot") != from_slot:
            continue
        old_slot = ex.get("time_slot")
        ex["time_slot"] = to_slot
        changed.append(f"{ex.get('name')}从{old_slot}调整到{to_slot}")
    
    # 同步更新单个exercise字段（兼容旧版）
    if day_plan.get("exercise") and (not from_slot or day_plan["exercise"].get("time_slot") == from_slot):
        day_plan["exercise"]["time_slot"] = to_slot
    
    return "，".join(changed) if changed else ""


def _swap_exercise(day_plan: dict, details: dict) -> str:
    """替换运动 - 从数据库获取新运动的完整数据"""
    from ..data.exercise_database import EXERCISE_DATABASE
    
    old_name = details.get("exercise_name")
    new_name = details.get("new_exercise_name")
    
    if not new_name:
        return ""
    
    # 从运动数据库查找新运动的完整数据
    new_exercise_data = None
    for ex in EXERCISE_DATABASE:
        if ex.name == new_name or new_name in ex.name or ex.name in new_name:
            new_exercise_data = ex
            break
    
    exercises = day_plan.get("exercises", [])
    
    for ex in exercises:
        if old_name and ex.get("name") != old_name:
            continue
        old = ex.get("name")
        
        # 更新所有字段
        ex["name"] = new_exercise_data.name if new_exercise_data else new_name
        ex["exercise_id"] = new_exercise_data.id if new_exercise_data else new_name.lower().replace(" ", "_")
        
        if new_exercise_data:
            # 从数据库获取真实数据
            ex["intensity"] = new_exercise_data.intensity.value
            ex["duration"] = new_exercise_data.duration
            # 计算卡路里：MET * 体重(70kg) * 时长(分钟) / 60
            ex["calories_target"] = int(new_exercise_data.met_value * 70 * new_exercise_data.duration / 60)
        
        return f"将{old}替换为{ex['name']}（{ex.get('intensity', 'moderate')}强度，{ex.get('duration', 30)}分钟，{ex.get('calories_target', 0)}千卡）"
    
    # 同步更新单个exercise字段（兼容旧版）
    if day_plan.get("exercise"):
        if not old_name or day_plan["exercise"].get("name") == old_name:
            old = day_plan["exercise"].get("name")
            day_plan["exercise"]["name"] = new_exercise_data.name if new_exercise_data else new_name
            day_plan["exercise"]["exercise_id"] = new_exercise_data.id if new_exercise_data else new_name.lower().replace(" ", "_")
            
            if new_exercise_data:
                day_plan["exercise"]["intensity"] = new_exercise_data.intensity.value
                day_plan["exercise"]["duration"] = new_exercise_data.duration
                day_plan["exercise"]["calories_target"] = int(new_exercise_data.met_value * 70 * new_exercise_data.duration / 60)
            
            return f"将{old}替换为{day_plan['exercise']['name']}"
    
    return ""


def _add_exercise(day_plan: dict, details: dict, all_exercises: list) -> str:
    """向某天添加运动"""
    new_exercise_name = details.get("new_exercise_name")
    time_slot = details.get("to_time_slot", "晚上")  # 默认晚上
    
    if not new_exercise_name:
        return ""
    
    # 从运动数据库中查找对应的运动
    exercise_data = None
    for ex in all_exercises:
        if ex.name == new_exercise_name:
            exercise_data = ex
            break
    
    if not exercise_data:
        # 如果找不到精确匹配，尝试模糊匹配
        for ex in all_exercises:
            if new_exercise_name in ex.name or ex.name in new_exercise_name:
                exercise_data = ex
                break
    
    # 构建新的运动条目
    duration = exercise_data.duration if exercise_data else 30
    # 【修复】使用 MET 值计算卡路里：MET * 体重(70kg) * 时长(分钟) / 60
    if exercise_data:
        calories = int(exercise_data.met_value * 70 * duration / 60)
    else:
        calories = int(4.0 * 70 * duration / 60)  # 默认 MET=4.0
    
    new_exercise = {
        "exercise_id": exercise_data.id if exercise_data else new_exercise_name.lower().replace(" ", "_"),
        "name": exercise_data.name if exercise_data else new_exercise_name,
        "time_slot": time_slot,
        "duration": duration,
        "intensity": exercise_data.intensity.value if exercise_data else "moderate",
        "category": exercise_data.category.value if exercise_data else "有氧运动",
        "calories_target": calories
    }
    
    # 添加到exercises数组
    if "exercises" not in day_plan:
        day_plan["exercises"] = []
    
    day_plan["exercises"].append(new_exercise)
    
    # 取消休息日标记
    day_plan["is_rest_day"] = False
    
    # 同步更新单个exercise字段（兼容旧版）
    if not day_plan.get("exercise"):
        day_plan["exercise"] = new_exercise
    
    return f"添加了{new_exercise['name']}（{time_slot}，{new_exercise['duration']}分钟）"


def _remove_exercise(day_plan: dict, details: dict) -> str:
    """移除特定运动"""
    exercise_name = details.get("exercise_name")
    
    if not exercise_name:
        return ""
    
    exercises = day_plan.get("exercises", [])
    original_count = len(exercises)
    
    day_plan["exercises"] = [ex for ex in exercises if ex.get("name") != exercise_name]
    
    if len(day_plan["exercises"]) < original_count:
        # 如果移除后没有运动了，设为休息日
        if len(day_plan["exercises"]) == 0:
            day_plan["is_rest_day"] = True
            day_plan["exercise"] = None
        return f"移除了{exercise_name}"
    
    return ""


def _move_exercise(from_day_plan: dict, to_day_plan: dict, details: dict) -> str:
    """将运动从一天移动到另一天"""
    exercise_name = details.get("exercise_name")
    target_day = details.get("target_day")
    to_time_slot = details.get("to_time_slot")  # 可选：指定目标时间段
    
    from_exercises = from_day_plan.get("exercises", [])
    
    # 找到要移动的运动
    exercises_to_move = []
    remaining_exercises = []
    
    for ex in from_exercises:
        # 如果指定了运动名称，只移动指定的；否则移动所有
        if exercise_name and ex.get("name") != exercise_name:
            remaining_exercises.append(ex)
        else:
            exercises_to_move.append(ex.copy())
    
    if not exercises_to_move:
        # 没有找到要移动的运动，尝试移动所有运动
        if not exercise_name and from_exercises:
            exercises_to_move = [ex.copy() for ex in from_exercises]
            remaining_exercises = []
        else:
            return ""
    
    # 更新源日期
    from_day_plan["exercises"] = remaining_exercises
    if len(remaining_exercises) == 0:
        from_day_plan["is_rest_day"] = True
        from_day_plan["exercise"] = None
    
    # 添加到目标日期
    to_exercises = to_day_plan.get("exercises", [])
    for ex in exercises_to_move:
        # 如果指定了目标时间段，更新时间段
        if to_time_slot:
            ex["time_slot"] = to_time_slot
        to_exercises.append(ex)
    
    to_day_plan["exercises"] = to_exercises
    to_day_plan["is_rest_day"] = False
    
    # 同步更新单个exercise字段（兼容旧版）
    if len(to_exercises) > 0:
        to_day_plan["exercise"] = to_exercises[0]
    
    # 构建变更描述
    moved_names = [ex.get("name", "未知") for ex in exercises_to_move]
    day_names = {
        "monday": "周一", "tuesday": "周二", "wednesday": "周三",
        "thursday": "周四", "friday": "周五", "saturday": "周六", "sunday": "周日"
    }
    target_day_cn = day_names.get(target_day, target_day)
    
    return f"将{', '.join(moved_names)}移动到{target_day_cn}"


# ============ 饮食 AI 微调功能 ============

async def _ai_adjust_diet_plan(
    weekly_plan, 
    daily_plans: dict, 
    user_request: str, 
    db,
    generate_answer,
    foods_data
):
    """
    AI饮食计划调整处理 - 智能自由调整模式
    
    AI可以自由组合多种操作来满足用户的抽象需求
    """
    
    # 1. 构建当前饮食计划摘要（更详细）
    diet_summary = _build_detailed_diet_summary(daily_plans)
    
    # 2. 构建可用食材列表（带营养信息）
    food_list = _build_foods_with_nutrition(foods_data)
    
    # 3. 构建智能AI提示
    system_prompt = """你是一个专业的营养师AI助手。用户会用自然语言描述他们想对饮食计划做的调整。
你需要深入理解用户的意图，然后自由地组合多种操作来实现用户的目标。

【当前周饮食计划】
""" + diet_summary + """

【可用食材库】（包含营养信息，每100g）
""" + food_list + """

【你的任务】
根据用户的需求，输出一个JSON格式的调整方案。你可以自由组合以下操作：

{
    "understood": true,
    "reasoning": "你对用户需求的理解和调整思路",
    "adjustments": [
        {
            "day": "saturday",
            "meal_type": "breakfast/lunch/dinner/snacks",
            "operation": "add/remove/replace",
            "food_name": "要操作的食物名称（remove/replace时需要）",
            "new_food": {
                "name": "新食物名称",
                "portion": "份量如100g/150g/200ml"
            }
        }
    ],
    "explanation": "对用户的简短回复，说明做了什么调整"
}

【操作说明】
- add: 向某餐添加食物（只需new_food）
- remove: 从某餐移除食物（只需food_name）
- replace: 替换食物（需要food_name和new_food）

【智能调整指南】
1. "丰盛一点" → 添加2-3种食物，增加蛋白质和碳水，可以加肉类、主食
2. "清淡一点" → 移除油腻/高热量食物，或替换为蔬菜、豆制品
3. "健康一点" → 增加蔬菜、水果，减少高脂肪食物
4. "高蛋白" → 添加鸡蛋、鸡胸肉、牛肉、豆腐等
5. "低碳水" → 移除或减少米饭、面条等主食
6. "加点xxx" → 直接添加用户说的食物
7. "不要xxx" → 移除用户说的食物

【重要规则】
- day必须是英文: monday/tuesday/wednesday/thursday/friday/saturday/sunday
- meal_type必须是: breakfast/lunch/dinner/snacks
- 新食物必须从可用食材库中选择
- 可以一次执行多个操作，比如同时添加3种食物
- 份量根据食物类型合理设置（肉类100-150g，蔬菜150-200g，水果100-150g）

如果无法理解，返回：{"understood": false, "error": "原因"}

只输出JSON，不要其他内容。"""

    user_prompt = f"用户需求：{user_request}"
    
    try:
        # 使用 generate_answer 函数调用 DeepSeek API
        ai_response = generate_answer(
            question=user_prompt,
            system_prompt=system_prompt
        )
        
        # 解析AI响应
        response_text = ai_response.strip()
        # 移除可能的markdown代码块标记
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        adjustment_plan = json.loads(response_text)
        
        print(f"[AI饮食调整] 用户需求: {user_request}")
        print(f"[AI饮食调整] AI解析结果: {json.dumps(adjustment_plan, ensure_ascii=False, indent=2)}")
        
        if not adjustment_plan.get("understood", False):
            return {
                "status": "error",
                "message": adjustment_plan.get("error", "无法理解您的饮食调整需求，请尝试更具体的描述")
            }
        
        # 4. 执行饮食调整（新的自由格式）
        changes_made = []
        for adj in adjustment_plan.get("adjustments", []):
            day = adj.get("day")
            meal_type = adj.get("meal_type")
            operation = adj.get("operation")
            food_name = adj.get("food_name")
            new_food = adj.get("new_food", {})
            
            print(f"[AI饮食调整] 执行: day={day}, meal={meal_type}, op={operation}, food={food_name}, new={new_food}")
            
            if day not in daily_plans:
                print(f"[AI饮食调整] 跳过: {day} 不在计划中")
                continue
            
            day_plan = daily_plans[day]
            diet = day_plan.get("diet", {})
            
            if not diet:
                diet = {}
            
            meal = diet.get(meal_type, {"foods": [], "calories": 0})
            foods = meal.get("foods", [])
            
            if operation == "add":
                # 添加食物
                new_food_name = new_food.get("name")
                portion = new_food.get("portion", "100g")
                
                # 查找食物数据
                food_data = _find_food_by_name(new_food_name, foods_data)
                if food_data:
                    portion_num = _parse_portion(portion)
                    new_item = {
                        "food_id": food_data.id,
                        "name": food_data.name,
                        "portion": portion,
                        "calories": round(food_data.nutrients.calories * portion_num / 100),
                        "protein": round(food_data.nutrients.protein * portion_num / 100, 1),
                        "carbs": round(food_data.nutrients.carbs * portion_num / 100, 1),
                        "fat": round(food_data.nutrients.fat * portion_num / 100, 1)
                    }
                    foods.append(new_item)
                    changes_made.append(f"{_day_to_chinese(day)}{_meal_to_chinese(meal_type)}添加{food_data.name}")
                    print(f"[AI饮食调整] 添加成功: {food_data.name}")
                else:
                    print(f"[AI饮食调整] 未找到食物: {new_food_name}")
                    
            elif operation == "remove":
                # 移除食物
                original_len = len(foods)
                removed_name = None
                new_foods = []
                for f in foods:
                    f_name = f.get("name", "")
                    if _food_name_match(f_name, food_name):
                        removed_name = f_name
                    else:
                        new_foods.append(f)
                foods = new_foods
                if removed_name:
                    changes_made.append(f"{_day_to_chinese(day)}{_meal_to_chinese(meal_type)}移除{removed_name}")
                    print(f"[AI饮食调整] 移除成功: {removed_name}")
                    
            elif operation == "replace":
                # 替换食物
                new_food_name = new_food.get("name")
                portion = new_food.get("portion", "100g")
                
                food_data = _find_food_by_name(new_food_name, foods_data)
                if food_data:
                    replaced = False
                    for i, f in enumerate(foods):
                        if _food_name_match(f.get("name", ""), food_name):
                            old_name = f.get("name")
                            portion_num = _parse_portion(portion)
                            foods[i] = {
                                "food_id": food_data.id,
                                "name": food_data.name,
                                "portion": portion,
                                "calories": round(food_data.nutrients.calories * portion_num / 100),
                                "protein": round(food_data.nutrients.protein * portion_num / 100, 1),
                                "carbs": round(food_data.nutrients.carbs * portion_num / 100, 1),
                                "fat": round(food_data.nutrients.fat * portion_num / 100, 1)
                            }
                            changes_made.append(f"{_day_to_chinese(day)}{_meal_to_chinese(meal_type)}{old_name}→{food_data.name}")
                            replaced = True
                            print(f"[AI饮食调整] 替换成功: {old_name} -> {food_data.name}")
                            break
                    if not replaced:
                        print(f"[AI饮食调整] 替换失败: 未找到{food_name}")
            
            # 更新餐食
            meal["foods"] = foods
            meal["calories"] = sum(f.get("calories", 0) for f in foods)
            diet[meal_type] = meal
            day_plan["diet"] = diet
        
        # 5. 保存更新
        weekly_plan.daily_plans = json.dumps(daily_plans, ensure_ascii=False)
        weekly_plan.updated_at = datetime.utcnow()
        
        # 记录调整历史
        user_adjustments = json.loads(weekly_plan.user_adjustments) if weekly_plan.user_adjustments else {}
        if "history" not in user_adjustments:
            user_adjustments["history"] = []
        user_adjustments["history"].append({
            "timestamp": datetime.now().isoformat(),
            "type": "diet",
            "request": user_request,
            "changes": changes_made
        })
        weekly_plan.user_adjustments = json.dumps(user_adjustments, ensure_ascii=False)
        
        db.commit()
        
        return {
            "status": "success",
            "message": "饮食计划已调整",
            "explanation": adjustment_plan.get("explanation", ""),
            "changes": changes_made,
            "updated_plan": daily_plans
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": "error", 
            "message": f"AI响应解析失败，请重试。错误: {str(e)}"
        }
    except Exception as e:
        print(f"[AI饮食调整] 异常: {str(e)}")
        return {
            "status": "error",
            "message": f"饮食调整失败: {str(e)}"
        }


def _find_food_by_name(name: str, foods_data) -> any:
    """根据名称查找食物（支持模糊匹配）"""
    if not name:
        return None
    
    # 精确匹配
    for food in foods_data:
        if food.name == name:
            return food
    
    # 模糊匹配
    for food in foods_data:
        if name in food.name or food.name in name:
            return food
    
    return None


def _food_name_match(name1: str, name2: str) -> bool:
    """检查两个食物名称是否匹配（模糊匹配）"""
    if not name1 or not name2:
        return False
    return name1 == name2 or name1 in name2 or name2 in name1


def _parse_portion(portion_str: str) -> int:
    """解析份量字符串，返回克数"""
    if not portion_str:
        return 100
    try:
        # 提取数字
        num = int(''.join(filter(str.isdigit, portion_str)))
        return num if num > 0 else 100
    except:
        return 100


def _build_detailed_diet_summary(daily_plans: dict) -> str:
    """构建详细的饮食计划摘要"""
    day_names = {
        "monday": "周一", "tuesday": "周二", "wednesday": "周三",
        "thursday": "周四", "friday": "周五", "saturday": "周六", "sunday": "周日"
    }
    
    lines = []
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
        plan = daily_plans.get(day, {})
        day_cn = day_names.get(day, day)
        diet = plan.get("diet", {})
        
        if not diet:
            lines.append(f"【{day_cn}({day})】无饮食计划")
            continue
        
        lines.append(f"【{day_cn}({day})】")
        for meal_type, meal_cn in [("breakfast", "早餐"), ("lunch", "午餐"), ("dinner", "晚餐"), ("snacks", "加餐")]:
            meal = diet.get(meal_type, {})
            foods = meal.get("foods", [])
            if foods:
                food_details = []
                for f in foods:
                    name = f.get("name", "")
                    cal = f.get("calories", 0)
                    food_details.append(f"{name}({cal}kcal)")
                lines.append(f"  {meal_cn}: {', '.join(food_details)}")
    
    return "\n".join(lines)


def _build_foods_with_nutrition(foods_data) -> str:
    """构建带营养信息的食材列表"""
    categories = {}
    for food in foods_data:
        cat = food.category.value
        if cat not in categories:
            categories[cat] = []
        info = f"{food.name}(热量{food.nutrients.calories}kcal,蛋白质{food.nutrients.protein}g)"
        categories[cat].append(info)
    
    lines = []
    for cat, foods in categories.items():
        lines.append(f"【{cat}】")
        lines.append(", ".join(foods[:15]))  # 每类最多15个
    
    return "\n".join(lines)


def _build_diet_summary(daily_plans: dict) -> str:
    """构建饮食计划摘要供AI理解"""
    day_names = {
        "monday": "周一", "tuesday": "周二", "wednesday": "周三",
        "thursday": "周四", "friday": "周五", "saturday": "周六", "sunday": "周日"
    }
    
    lines = []
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
        plan = daily_plans.get(day, {})
        day_cn = day_names.get(day, day)
        diet = plan.get("diet", {})
        
        if not diet:
            lines.append(f"{day_cn}: 无饮食计划")
            continue
        
        meals = []
        for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
            meal = diet.get(meal_type, {})
            foods = meal.get("foods", [])
            if foods:
                food_names = [f.get("name", "") for f in foods[:3]]  # 最多显示3个
                meal_cn = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐", "snacks": "加餐"}.get(meal_type, meal_type)
                meals.append(f"{meal_cn}:{','.join(food_names)}")
        
        if meals:
            lines.append(f"{day_cn}: {'; '.join(meals)}")
        else:
            lines.append(f"{day_cn}: 无详细饮食安排")
    
    return "\n".join(lines)


def _build_available_foods_list(foods_data) -> str:
    """构建可用食材列表"""
    # 按类别分组
    categories = {}
    for food in foods_data:
        cat = food.category.value
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(food.name)
    
    lines = []
    for cat, foods in categories.items():
        foods_str = ", ".join(foods[:10])  # 每类最多显示10个
        if len(foods) > 10:
            foods_str += f"等共{len(foods)}种"
        lines.append(f"【{cat}】{foods_str}")
    
    return "\n".join(lines)


def _meal_to_chinese(meal_type: str) -> str:
    """餐类型转中文"""
    mapping = {
        "breakfast": "早餐",
        "lunch": "午餐", 
        "dinner": "晚餐",
        "snacks": "加餐"
    }
    return mapping.get(meal_type, meal_type)


def _swap_diet_food(diet: dict, details: dict, foods_data) -> str:
    """替换饮食中的食物"""
    meal_type = details.get("meal_type")
    food_name = details.get("food_name")
    new_food_name = details.get("new_food_name")
    
    if not meal_type or not food_name or not new_food_name:
        return ""
    
    meal = diet.get(meal_type, {})
    foods = meal.get("foods", [])
    
    # 查找新食物的营养数据
    new_food_data = None
    for food in foods_data:
        if food.name == new_food_name:
            new_food_data = food
            break
    
    if not new_food_data:
        print(f"[AI饮食调整] 未找到食物: {new_food_name}")
        return ""
    
    # 替换食物
    replaced = False
    for i, food in enumerate(foods):
        if food.get("name") == food_name:
            # 保留原来的份量比例
            old_portion = food.get("portion", "100g")
            portion_num = 100
            try:
                portion_num = int(''.join(filter(str.isdigit, old_portion))) or 100
            except:
                portion_num = 100
            
            # 计算新食物的营养
            foods[i] = {
                "food_id": new_food_data.id,
                "name": new_food_data.name,
                "portion": old_portion,
                "calories": round(new_food_data.nutrients.calories * portion_num / 100),
                "protein": round(new_food_data.nutrients.protein * portion_num / 100, 1),
                "carbs": round(new_food_data.nutrients.carbs * portion_num / 100, 1),
                "fat": round(new_food_data.nutrients.fat * portion_num / 100, 1)
            }
            replaced = True
            break
    
    if replaced:
        # 重新计算该餐的总热量
        total_cal = sum(f.get("calories", 0) for f in foods)
        meal["calories"] = total_cal
        diet[meal_type] = meal
        return f"将{_meal_to_chinese(meal_type)}的{food_name}换成{new_food_name}"
    
    return ""


def _adjust_diet_style(diet: dict, details: dict, foods_data) -> str:
    """调整饮食风格"""
    meal_type = details.get("meal_type")
    style = details.get("style", "")
    
    if not meal_type:
        print(f"[调整风格] 缺少meal_type")
        return ""
    
    meal = diet.get(meal_type, {})
    foods = meal.get("foods", [])
    
    if not foods:
        print(f"[调整风格] {meal_type}没有食物")
        return ""
    
    changes = []
    print(f"[调整风格] 调整{meal_type}为{style}风格，当前食物: {[f.get('name') for f in foods]}")
    
    if "清淡" in style:
        # 清淡风格策略：
        # 1. 移除高热量食物（>150卡）
        # 2. 替换油腻食物为清淡替代
        # 3. 如果没有高热量食物，移除份量最大的一个
        
        high_cal_foods = [(i, f) for i, f in enumerate(foods) if f.get("calories", 0) > 150]
        
        if high_cal_foods:
            # 移除热量最高的食物
            high_cal_foods.sort(key=lambda x: x[1].get("calories", 0), reverse=True)
            idx, removed_food = high_cal_foods[0]
            removed_name = removed_food.get("name")
            foods.pop(idx)
            changes.append(f"移除{removed_name}(高热量)")
            print(f"[调整风格] 移除高热量食物: {removed_name}")
        else:
            # 没有高热量食物，尝试替换为更清淡的选择
            # 查找可以替换的食物（优先替换肉类为蔬菜/豆制品）
            replaced = False
            for i, food in enumerate(foods):
                food_name = food.get("name", "")
                # 检查是否是肉类
                if any(meat in food_name for meat in ["肉", "鸡", "鸭", "鱼", "虾", "牛", "猪", "羊"]):
                    # 替换为豆腐
                    for new_food in foods_data:
                        if "豆腐" in new_food.name:
                            old_name = food.get("name")
                            foods[i] = {
                                "food_id": new_food.id,
                                "name": new_food.name,
                                "portion": "100g",
                                "calories": round(new_food.nutrients.calories),
                                "protein": round(new_food.nutrients.protein, 1),
                                "carbs": round(new_food.nutrients.carbs, 1),
                                "fat": round(new_food.nutrients.fat, 1)
                            }
                            changes.append(f"{old_name}→{new_food.name}")
                            replaced = True
                            print(f"[调整风格] 替换肉类: {old_name} -> {new_food.name}")
                            break
                if replaced:
                    break
            
            # 如果还是没有变化，移除一个食物让份量变少
            if not replaced and len(foods) > 1:
                removed = foods.pop()
                changes.append(f"减少份量(移除{removed.get('name')})")
                print(f"[调整风格] 减少份量，移除: {removed.get('name')}")
    
    elif "高蛋白" in style:
        # 高蛋白风格：增加蛋白质食物
        for new_food in foods_data:
            if new_food.category.value == "蛋白质类" and new_food.nutrients.protein > 15:
                foods.append({
                    "food_id": new_food.id,
                    "name": new_food.name,
                    "portion": "100g",
                    "calories": round(new_food.nutrients.calories),
                    "protein": round(new_food.nutrients.protein, 1),
                    "carbs": round(new_food.nutrients.carbs, 1),
                    "fat": round(new_food.nutrients.fat, 1)
                })
                changes.append(f"添加{new_food.name}")
                break
    
    if changes:
        # 重新计算该餐的总热量
        total_cal = sum(f.get("calories", 0) for f in foods)
        meal["foods"] = foods
        meal["calories"] = total_cal
        diet[meal_type] = meal
        return f"{_meal_to_chinese(meal_type)}调整为{style}风格: {', '.join(changes)}"
    
    return ""


def _adjust_diet_nutrition(diet: dict, details: dict, foods_data) -> str:
    """调整营养配比"""
    nutrition_type = details.get("nutrition_type")
    adjustment = details.get("adjustment")
    meal_type = details.get("meal_type", "lunch")  # 默认调整午餐
    
    if not nutrition_type or not adjustment:
        return ""
    
    meal = diet.get(meal_type, {})
    foods = meal.get("foods", [])
    
    if not foods:
        return ""
    
    changes = []
    
    if adjustment == "decrease":
        if nutrition_type == "carbs":
            # 减少碳水：替换谷物类食物
            for i, food in enumerate(foods):
                if food.get("carbs", 0) > 30:
                    # 查找低碳水替代（蔬菜或蛋白质）
                    for new_food in foods_data:
                        if new_food.category.value in ["蔬菜类", "蛋白质类"] and new_food.nutrients.carbs < 10:
                            old_name = food.get("name")
                            foods[i] = {
                                "food_id": new_food.id,
                                "name": new_food.name,
                                "portion": "120g",
                                "calories": round(new_food.nutrients.calories * 1.2),
                                "protein": round(new_food.nutrients.protein * 1.2, 1),
                                "carbs": round(new_food.nutrients.carbs * 1.2, 1),
                                "fat": round(new_food.nutrients.fat * 1.2, 1)
                            }
                            changes.append(f"{old_name}→{new_food.name}")
                            break
                    break  # 只替换一个
    
    elif adjustment == "increase":
        if nutrition_type == "protein":
            # 增加蛋白质：添加高蛋白食物
            for new_food in foods_data:
                if new_food.category.value == "蛋白质类" and new_food.nutrients.protein > 15:
                    # 检查是否已有此食物
                    if not any(f.get("name") == new_food.name for f in foods):
                        foods.append({
                            "food_id": new_food.id,
                            "name": new_food.name,
                            "portion": "80g",
                            "calories": round(new_food.nutrients.calories * 0.8),
                            "protein": round(new_food.nutrients.protein * 0.8, 1),
                            "carbs": round(new_food.nutrients.carbs * 0.8, 1),
                            "fat": round(new_food.nutrients.fat * 0.8, 1)
                        })
                        changes.append(f"添加{new_food.name}")
                        break
    
    if changes:
        # 重新计算该餐的总热量
        total_cal = sum(f.get("calories", 0) for f in foods)
        meal["foods"] = foods
        meal["calories"] = total_cal
        diet[meal_type] = meal
        nutrition_cn = {"protein": "蛋白质", "carbs": "碳水", "fat": "脂肪"}.get(nutrition_type, nutrition_type)
        adjust_cn = {"increase": "增加", "decrease": "减少"}.get(adjustment, adjustment)
        return f"{_meal_to_chinese(meal_type)}{adjust_cn}{nutrition_cn}: {', '.join(changes)}"
    
    return ""


def _add_diet_food(diet: dict, details: dict, foods_data) -> str:
    """向饮食中添加食物"""
    meal_type = details.get("meal_type")
    new_food_name = details.get("new_food_name")
    portion_str = details.get("portion", "100g")
    
    if not meal_type or not new_food_name:
        print(f"[添加食物] 缺少参数: meal_type={meal_type}, new_food_name={new_food_name}")
        return ""
    
    # 查找食物数据
    new_food_data = None
    for food in foods_data:
        if food.name == new_food_name or new_food_name in food.name or food.name in new_food_name:
            new_food_data = food
            break
    
    if not new_food_data:
        print(f"[添加食物] 未找到食物: {new_food_name}")
        return ""
    
    meal = diet.get(meal_type, {})
    if not meal:
        meal = {"foods": [], "calories": 0}
    foods = meal.get("foods", [])
    
    # 检查是否已存在该食物
    for f in foods:
        if f.get("name") == new_food_data.name:
            print(f"[添加食物] {new_food_data.name}已存在于{meal_type}中")
            return ""
    
    # 解析份量
    try:
        portion_num = int(''.join(filter(str.isdigit, portion_str))) or 100
    except:
        portion_num = 100
    
    # 添加食物
    new_food_item = {
        "food_id": new_food_data.id,
        "name": new_food_data.name,
        "portion": portion_str,
        "calories": round(new_food_data.nutrients.calories * portion_num / 100),
        "protein": round(new_food_data.nutrients.protein * portion_num / 100, 1),
        "carbs": round(new_food_data.nutrients.carbs * portion_num / 100, 1),
        "fat": round(new_food_data.nutrients.fat * portion_num / 100, 1)
    }
    foods.append(new_food_item)
    
    # 更新餐食
    meal["foods"] = foods
    meal["calories"] = sum(f.get("calories", 0) for f in foods)
    diet[meal_type] = meal
    
    print(f"[添加食物] 成功添加 {new_food_data.name} 到 {meal_type}")
    return f"向{_meal_to_chinese(meal_type)}添加了{new_food_data.name}({portion_str})"


def _remove_diet_food(diet: dict, details: dict) -> str:
    """从饮食中移除食物"""
    meal_type = details.get("meal_type")
    food_name = details.get("food_name")
    
    if not meal_type or not food_name:
        print(f"[移除食物] 缺少参数: meal_type={meal_type}, food_name={food_name}")
        return ""
    
    meal = diet.get(meal_type, {})
    foods = meal.get("foods", [])
    
    if not foods:
        print(f"[移除食物] {meal_type}没有食物")
        return ""
    
    # 查找并移除食物（支持模糊匹配）
    original_count = len(foods)
    removed_food_name = None
    
    new_foods = []
    for food in foods:
        current_name = food.get("name", "")
        # 模糊匹配：完全匹配、包含关系
        if current_name == food_name or food_name in current_name or current_name in food_name:
            removed_food_name = current_name
            print(f"[移除食物] 匹配成功: '{food_name}' -> '{current_name}'")
        else:
            new_foods.append(food)
    
    if removed_food_name:
        # 更新食物列表
        meal["foods"] = new_foods
        # 重新计算热量
        meal["calories"] = sum(f.get("calories", 0) for f in new_foods)
        diet[meal_type] = meal
        print(f"[移除食物] 成功移除 {removed_food_name}，剩余 {len(new_foods)} 项")
        return f"从{_meal_to_chinese(meal_type)}移除了{removed_food_name}"
    
    print(f"[移除食物] 未找到匹配的食物: '{food_name}'，当前食物: {[f.get('name') for f in foods]}")
    return ""
