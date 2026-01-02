"""
饮食记录路由 - 记录和查询用户实际饮食摄入

功能：
1. 记录每餐实际饮食
2. 标记计划餐食完成状态
3. 添加自定义食物
4. 查询每日/每周饮食统计
5. 与计划对比分析
"""

import json
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..db import get_db
from ..auth import get_current_user
from ..models import User, WeeklyPlan, DietLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diet-logs", tags=["饮食记录"])


# ============ 请求/响应模型 ============

class FoodItem(BaseModel):
    """食物项"""
    food_id: str
    name: str
    portion: str = ""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    from_plan: bool = True
    completed: bool = True


class LogMealRequest(BaseModel):
    """记录餐食请求"""
    log_date: str = Field(..., description="日期 YYYY-MM-DD")
    meal_type: str = Field(..., description="餐次: breakfast/lunch/dinner/snacks")
    foods: List[FoodItem] = Field(default=[], description="食物列表")
    notes: Optional[str] = None


class MarkPlanMealRequest(BaseModel):
    """标记计划餐食完成"""
    log_date: str = Field(..., description="日期 YYYY-MM-DD")
    meal_type: str = Field(..., description="餐次: breakfast/lunch/dinner/snacks")
    completed_food_ids: List[str] = Field(default=[], description="完成的食物ID列表")
    notes: Optional[str] = None


class AddCustomFoodRequest(BaseModel):
    """添加自定义食物"""
    log_date: str
    meal_type: str
    name: str
    portion: str = ""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class DietLogResponse(BaseModel):
    """饮食记录响应"""
    id: int
    log_date: str
    meal_type: str
    foods: List[dict]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    planned_calories: Optional[float]
    calorie_difference: Optional[float]
    adherence_score: Optional[float]
    notes: Optional[str]


class DailySummaryResponse(BaseModel):
    """每日摘要响应"""
    date: str
    meals: dict
    totals: dict
    planned_totals: dict
    adherence_score: float
    exercise_calories: float = 0  # 运动消耗
    net_calories: float = 0  # 净摄入 = 摄入 - 消耗


# ============ 辅助函数 ============

def get_weekday_from_date(d: date) -> str:
    """从日期获取星期几"""
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return weekdays[d.weekday()]


def get_plan_meal_data(weekly_plan: WeeklyPlan, log_date: date, meal_type: str) -> dict:
    """从周计划获取指定餐次的计划数据"""
    if not weekly_plan or not weekly_plan.daily_plans:
        return {}
    
    weekday = get_weekday_from_date(log_date)
    daily_plans = json.loads(weekly_plan.daily_plans)
    day_plan = daily_plans.get(weekday, {})
    diet = day_plan.get("diet", {})
    
    return diet.get(meal_type, {})


# ============ API 端点 ============

@router.post("/log", response_model=DietLogResponse)
async def log_meal(
    request: LogMealRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    记录一餐饮食
    
    完整记录用户某餐实际吃了什么，包括：
    - 来自计划的食物（标记完成）
    - 自定义添加的食物
    """
    try:
        log_date = datetime.strptime(request.log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的日期格式，请使用 YYYY-MM-DD"
        )
    
    if request.meal_type not in ["breakfast", "lunch", "dinner", "snacks"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的餐次，应为 breakfast/lunch/dinner/snacks"
        )
    
    # 获取当前周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True,
        WeeklyPlan.week_start_date <= log_date,
        WeeklyPlan.week_end_date >= log_date
    ).first()
    
    # 获取计划的卡路里
    planned_calories = None
    if weekly_plan:
        plan_meal = get_plan_meal_data(weekly_plan, log_date, request.meal_type)
        planned_calories = plan_meal.get("calories", 0)
    
    # 检查是否已有记录
    existing = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) == log_date,
        DietLog.meal_type == request.meal_type
    ).first()
    
    foods_json = json.dumps([f.dict() for f in request.foods], ensure_ascii=False)
    
    if existing:
        # 更新已有记录
        existing.foods = foods_json
        existing.planned_calories = planned_calories
        existing.notes = request.notes
        existing.calculate_totals()
        db.commit()
        db.refresh(existing)
        diet_log = existing
    else:
        # 创建新记录
        diet_log = DietLog(
            user_id=current_user.id,
            weekly_plan_id=weekly_plan.id if weekly_plan else None,
            log_date=datetime.combine(log_date, datetime.min.time()),
            meal_type=request.meal_type,
            foods=foods_json,
            planned_calories=planned_calories,
            notes=request.notes
        )
        diet_log.calculate_totals()
        db.add(diet_log)
        db.commit()
        db.refresh(diet_log)
    
    logger.info(f"用户 {current_user.id} 记录 {request.log_date} {request.meal_type}: {diet_log.total_calories}kcal")
    
    return DietLogResponse(
        id=diet_log.id,
        log_date=log_date.strftime("%Y-%m-%d"),
        meal_type=diet_log.meal_type,
        foods=diet_log.get_foods_list(),
        total_calories=diet_log.total_calories or 0,
        total_protein=diet_log.total_protein or 0,
        total_carbs=diet_log.total_carbs or 0,
        total_fat=diet_log.total_fat or 0,
        planned_calories=diet_log.planned_calories,
        calorie_difference=diet_log.calorie_difference,
        adherence_score=diet_log.adherence_score,
        notes=diet_log.notes
    )


@router.post("/mark-plan-meal")
async def mark_plan_meal_completed(
    request: MarkPlanMealRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    快速标记计划餐食完成
    
    从计划中获取餐食信息，根据用户选择的完成项自动创建记录
    """
    try:
        log_date = datetime.strptime(request.log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的日期格式"
        )
    
    # 获取当前周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True,
        WeeklyPlan.week_start_date <= log_date,
        WeeklyPlan.week_end_date >= log_date
    ).first()
    
    if not weekly_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到当前周计划"
        )
    
    # 获取计划餐食
    plan_meal = get_plan_meal_data(weekly_plan, log_date, request.meal_type)
    if not plan_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该餐次的计划"
        )
    
    plan_foods = plan_meal.get("foods", [])
    
    # 构建食物列表，标记完成状态
    foods = []
    for pf in plan_foods:
        food_id = pf.get("food_id", "")
        completed = food_id in request.completed_food_ids or len(request.completed_food_ids) == 0
        foods.append({
            "food_id": food_id,
            "name": pf.get("name", ""),
            "portion": pf.get("portion", ""),
            "calories": pf.get("calories", 0),
            "protein": pf.get("protein", 0),
            "carbs": pf.get("carbs", 0),
            "fat": pf.get("fat", 0),
            "from_plan": True,
            "completed": completed
        })
    
    # 创建或更新记录
    existing = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) == log_date,
        DietLog.meal_type == request.meal_type
    ).first()
    
    foods_json = json.dumps(foods, ensure_ascii=False)
    planned_calories = plan_meal.get("calories", 0)
    
    if existing:
        existing.foods = foods_json
        existing.planned_calories = planned_calories
        existing.notes = request.notes
        existing.calculate_totals()
        db.commit()
        diet_log = existing
    else:
        diet_log = DietLog(
            user_id=current_user.id,
            weekly_plan_id=weekly_plan.id,
            log_date=datetime.combine(log_date, datetime.min.time()),
            meal_type=request.meal_type,
            foods=foods_json,
            planned_calories=planned_calories,
            notes=request.notes
        )
        diet_log.calculate_totals()
        db.add(diet_log)
        db.commit()
    
    # 更新周计划完成状态
    weekday = get_weekday_from_date(log_date)
    completion = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
    if weekday not in completion:
        completion[weekday] = {}
    if "meals_followed" not in completion[weekday]:
        completion[weekday]["meals_followed"] = {}
    
    all_completed = all(f.get("completed", False) for f in foods)
    completion[weekday]["meals_followed"][request.meal_type] = all_completed
    weekly_plan.completion_status = json.dumps(completion, ensure_ascii=False)
    db.commit()
    
    return {
        "message": "餐食记录已更新",
        "meal_type": request.meal_type,
        "total_calories": diet_log.total_calories,
        "adherence_score": diet_log.adherence_score
    }


@router.post("/add-custom-food")
async def add_custom_food(
    request: AddCustomFoodRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    添加自定义食物到某餐记录
    
    用于记录计划外的食物摄入
    """
    try:
        log_date = datetime.strptime(request.log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的日期格式")
    
    # 获取已有记录
    existing = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) == log_date,
        DietLog.meal_type == request.meal_type
    ).first()
    
    custom_food = {
        "food_id": f"custom_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "name": request.name,
        "portion": request.portion,
        "calories": request.calories,
        "protein": request.protein,
        "carbs": request.carbs,
        "fat": request.fat,
        "from_plan": False,
        "completed": True
    }
    
    if existing:
        foods = existing.get_foods_list()
        foods.append(custom_food)
        existing.foods = json.dumps(foods, ensure_ascii=False)
        existing.calculate_totals()
        db.commit()
    else:
        # 获取周计划获取 planned_calories
        weekly_plan = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == current_user.id,
            WeeklyPlan.is_active == True,
            WeeklyPlan.week_start_date <= log_date,
            WeeklyPlan.week_end_date >= log_date
        ).first()
        
        planned_calories = None
        if weekly_plan:
            plan_meal = get_plan_meal_data(weekly_plan, log_date, request.meal_type)
            planned_calories = plan_meal.get("calories", 0)
        
        diet_log = DietLog(
            user_id=current_user.id,
            weekly_plan_id=weekly_plan.id if weekly_plan else None,
            log_date=datetime.combine(log_date, datetime.min.time()),
            meal_type=request.meal_type,
            foods=json.dumps([custom_food], ensure_ascii=False),
            planned_calories=planned_calories
        )
        diet_log.calculate_totals()
        db.add(diet_log)
        db.commit()
    
    return {"message": "自定义食物已添加", "food": custom_food}


@router.get("/daily/{log_date}", response_model=DailySummaryResponse)
async def get_daily_summary(
    log_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取某天的饮食摘要
    
    包括各餐记录、营养总计、与计划对比
    """
    try:
        date_obj = datetime.strptime(log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的日期格式")
    
    # 获取当天所有记录
    logs = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) == date_obj
    ).all()
    
    # 获取周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True,
        WeeklyPlan.week_start_date <= date_obj,
        WeeklyPlan.week_end_date >= date_obj
    ).first()
    
    # 构建餐食数据
    meals = {}
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    planned_totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    
    for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
        log = next((l for l in logs if l.meal_type == meal_type), None)
        plan_meal = get_plan_meal_data(weekly_plan, date_obj, meal_type) if weekly_plan else {}
        
        if log:
            meals[meal_type] = {
                "logged": True,
                "foods": log.get_foods_list(),
                "calories": log.total_calories or 0,
                "protein": log.total_protein or 0,
                "carbs": log.total_carbs or 0,
                "fat": log.total_fat or 0,
                "planned_calories": log.planned_calories or 0,
                "adherence_score": log.adherence_score
            }
            totals["calories"] += log.total_calories or 0
            totals["protein"] += log.total_protein or 0
            totals["carbs"] += log.total_carbs or 0
            totals["fat"] += log.total_fat or 0
        else:
            meals[meal_type] = {
                "logged": False,
                "foods": plan_meal.get("foods", []),
                "planned_calories": plan_meal.get("calories", 0)
            }
        
        planned_totals["calories"] += plan_meal.get("calories", 0)
    
    # 计算整体遵循度
    adherence_score = 0
    if planned_totals["calories"] > 0 and totals["calories"] > 0:
        deviation = abs(totals["calories"] - planned_totals["calories"]) / planned_totals["calories"]
        adherence_score = max(0, 100 - deviation * 100)
    
    # 获取运动消耗（从周计划完成记录）
    exercise_calories = 0
    if weekly_plan:
        weekday = get_weekday_from_date(date_obj)
        day_plan = weekly_plan.get_day_plan(weekday)
        exercise = day_plan.get("exercise") or {}
        
        # 检查是否完成运动
        completion = json.loads(weekly_plan.completion_status) if weekly_plan.completion_status else {}
        day_completion = completion.get(weekday, {})
        if day_completion.get("exercise_completed", False):
            exercise_calories = exercise.get("calories_target", 0)
    
    return DailySummaryResponse(
        date=log_date,
        meals=meals,
        totals=totals,
        planned_totals=planned_totals,
        adherence_score=round(adherence_score, 1),
        exercise_calories=exercise_calories,
        net_calories=totals["calories"] - exercise_calories
    )


@router.get("/weekly-stats")
async def get_weekly_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取饮食统计（智能日期选择）
    
    返回每日摄入、计划对比、遵循度趋势
    如果本周没有数据，自动查找最近有数据的一周
    """
    # 计算本周日期范围
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    # 获取本周所有记录
    logs = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) >= week_start,
        func.date(DietLog.log_date) <= week_end
    ).all()
    
    # 如果本周没有记录，查找最近有记录的日期并使用那一周
    if not logs:
        most_recent_log = db.query(DietLog).filter(
            DietLog.user_id == current_user.id
        ).order_by(DietLog.log_date.desc()).first()
        
        if most_recent_log:
            recent_date = most_recent_log.log_date.date() if hasattr(most_recent_log.log_date, 'date') else most_recent_log.log_date
            week_start = recent_date - timedelta(days=recent_date.weekday())
            week_end = week_start + timedelta(days=6)
            logs = db.query(DietLog).filter(
                DietLog.user_id == current_user.id,
                func.date(DietLog.log_date) >= week_start,
                func.date(DietLog.log_date) <= week_end
            ).all()
    
    # 获取周计划（优先当前活跃的，否则获取最近的）
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True
    ).order_by(WeeklyPlan.week_start_date.desc()).first()
    
    # 按日期汇总
    daily_stats = []
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    weekday_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    for i, weekday in enumerate(weekdays):
        day_date = week_start + timedelta(days=i)
        day_logs = [l for l in logs if l.log_date.date() == day_date]
        
        actual_calories = sum(l.total_calories or 0 for l in day_logs)
        
        # 获取计划卡路里
        planned_calories = 0
        if weekly_plan:
            day_plan = weekly_plan.get_day_plan(weekday)
            diet = day_plan.get("diet", {})
            planned_calories = diet.get("calories_target", 2000)
        
        daily_stats.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "day_name": weekday_names[i],
            "actual_calories": round(actual_calories, 1),
            "planned_calories": planned_calories,
            "logged_meals": len(day_logs),
            "is_today": day_date == today,
            "is_future": day_date > today
        })
    
    # 计算周统计
    total_actual = sum(d["actual_calories"] for d in daily_stats if not d["is_future"])
    total_planned = sum(d["planned_calories"] for d in daily_stats if not d["is_future"])
    avg_adherence = 0
    if total_planned > 0:
        avg_adherence = max(0, 100 - abs(total_actual - total_planned) / total_planned * 100)
    
    return {
        "week_start": week_start.strftime("%Y-%m-%d"),
        "week_end": week_end.strftime("%Y-%m-%d"),
        "daily_stats": daily_stats,
        "summary": {
            "total_calories_actual": round(total_actual, 1),
            "total_calories_planned": total_planned,
            "average_adherence": round(avg_adherence, 1),
            "logged_days": sum(1 for d in daily_stats if d["logged_meals"] > 0)
        }
    }


@router.get("/exercise-diet-balance/{log_date}")
async def get_exercise_diet_balance(
    log_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取某天的运动-饮食平衡分析
    
    返回：
    - 运动消耗
    - 饮食摄入
    - 净卡路里
    - 调整后的目标
    - 平衡状态分析
    """
    from ..services.exercise_diet_service import (
        calculate_exercise_calories,
        calculate_adjusted_calories,
        analyze_exercise_diet_balance,
        get_post_exercise_meal_suggestions
    )
    
    try:
        date_obj = datetime.strptime(log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的日期格式")
    
    # 获取周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True,
        WeeklyPlan.week_start_date <= date_obj,
        WeeklyPlan.week_end_date >= date_obj
    ).first()
    
    if not weekly_plan:
        raise HTTPException(status_code=404, detail="未找到当前周计划")
    
    weekday = get_weekday_from_date(date_obj)
    day_plan = weekly_plan.get_day_plan(weekday)
    
    # 获取运动数据
    exercises = day_plan.get("exercises", [])
    if not exercises and day_plan.get("exercise"):
        exercises = [day_plan["exercise"]]
    
    # 计算运动消耗
    exercise_result = calculate_exercise_calories(exercises, user_weight_kg=65)
    exercise_calories = exercise_result["total_calories"]
    
    # 获取饮食摄入
    diet_logs = db.query(DietLog).filter(
        DietLog.user_id == current_user.id,
        func.date(DietLog.log_date) == date_obj
    ).all()
    
    total_intake = sum(l.total_calories or 0 for l in diet_logs)
    
    # 获取基础目标
    diet = day_plan.get("diet", {})
    base_calories = diet.get("calories_target", 2000)
    
    # 计算调整后的目标
    adjusted = calculate_adjusted_calories(
        base_calories=base_calories,
        exercise_calories=exercise_calories,
        goal="maintain"  # TODO: 从用户偏好获取目标
    )
    
    # 分析平衡状态
    balance = analyze_exercise_diet_balance(
        daily_intake=total_intake,
        daily_exercise=exercise_calories,
        target_calories=base_calories,
        goal="maintain"
    )
    
    # 获取运动后饮食建议
    meal_suggestions = []
    if exercises:
        exercise_type = "cardio"  # 默认
        exercise_intensity = exercises[0].get("intensity", "moderate") if exercises else "moderate"
        time_slot = exercises[0].get("time_slot", "下午") if exercises else "下午"
        
        # 转换时间
        time_of_day = "afternoon"
        if "早" in time_slot or "晨" in time_slot:
            time_of_day = "morning"
        elif "晚" in time_slot:
            time_of_day = "evening"
        
        meal_suggestions = get_post_exercise_meal_suggestions(
            exercise_type=exercise_type,
            exercise_intensity=exercise_intensity,
            time_of_day=time_of_day
        )
    
    return {
        "date": log_date,
        "exercise": {
            "exercises": exercise_result["exercises"],
            "total_calories": exercise_calories,
            "recovery_suggestion": exercise_result["recovery_suggestion"]
        },
        "diet": {
            "total_intake": round(total_intake, 1),
            "logged_meals": len(diet_logs),
            "base_target": base_calories
        },
        "adjusted_target": adjusted,
        "balance": balance,
        "meal_suggestions": meal_suggestions
    }

