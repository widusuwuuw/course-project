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
from ..models import User, MonthlyPlan, WeeklyPlan, UserPreferences
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
    
    # 6. 调用生成服务
    try:
        weekly_plan_data = generate_weekly_plan(
            monthly_plan=monthly_plan_content,
            user_preferences=user_preferences_dict,
            week_number=request.week_number,
            week_start_date=week_start,
            user_adjustments=adjustments_dict
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
            # TODO: 从运动数据库获取新运动信息
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


@router.post("/{plan_id}/ai-adjust")
async def ai_adjust_weekly_plan(
    plan_id: int,
    request: AIAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    使用AI根据用户自然语言需求调整周计划
    
    示例请求：
    - "周二晚上太忙，把运动改到早上"
    - "把周四的太极拳换成八段锦"
    - "周三我想休息，跳过运动"
    - "把周一早晨的运动调到下午"
    """
    from ..services.deepseek_client import generate_answer
    from ..data.exercise_database import get_all_exercises
    
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
    
    # 3. 构建当前计划摘要和可用运动列表
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
    """替换运动"""
    old_name = details.get("exercise_name")
    new_name = details.get("new_exercise_name")
    
    if not new_name:
        return ""
    
    exercises = day_plan.get("exercises", [])
    
    for ex in exercises:
        if old_name and ex.get("name") != old_name:
            continue
        old = ex.get("name")
        ex["name"] = new_name
        # 更新exercise_id为简化版本
        ex["exercise_id"] = new_name.lower().replace(" ", "_")
        return f"将{old}替换为{new_name}"
    
    # 同步更新单个exercise字段
    if day_plan.get("exercise"):
        if not old_name or day_plan["exercise"].get("name") == old_name:
            old = day_plan["exercise"].get("name")
            day_plan["exercise"]["name"] = new_name
            day_plan["exercise"]["exercise_id"] = new_name.lower().replace(" ", "_")
            return f"将{old}替换为{new_name}"
    
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
    # 计算卡路里：calorie_burn是每小时消耗，需要按时长比例计算
    calories = int((exercise_data.calorie_burn if exercise_data else 400) * duration / 60)
    
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
