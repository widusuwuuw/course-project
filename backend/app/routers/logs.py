"""
用户记录API - 饮食记录和运动记录

功能：
1. 饮食记录 CRUD
2. 运动记录 CRUD  
3. 获取课程列表
4. 统计对比数据
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import Optional, List
import json

from ..db import get_db
from ..deps import get_current_user
from ..models import User, DietLog, ExerciseLog, WeeklyPlan
from ..data.course_database import (
    get_all_courses,
    get_courses_by_category as get_courses_by_cat,
    get_course_by_id,
    search_courses,
    get_category_stats,
    get_all_categories,
    CourseResource
)
from ..data.food_ingredients_data import CORE_FOODS_DATA


def course_to_dict(course: CourseResource) -> dict:
    """将课程对象转换为字典"""
    return {
        "id": course.id,
        "exercise_id": course.exercise_id,
        "category": course.category,
        "title": course.title,
        "instructor": course.instructor,
        "duration": course.duration,
        "calories": course.calories,
        "difficulty": course.difficulty.value,
        "cover_image": course.cover_image,
        "description": course.description,
        "tags": course.tags,
        "rating": course.rating,
        "students": course.students,
        "is_free": course.is_free,
        "price": course.price
    }


def get_all_courses_dict() -> list:
    """获取所有课程的字典列表"""
    return [course_to_dict(c) for c in get_all_courses()]

router = APIRouter(prefix="/logs", tags=["用户记录"])


# ========== 课程相关API ==========

@router.get("/courses")
def get_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    free_only: bool = False
):
    """获取运动课程列表"""
    courses = get_all_courses_dict()
    
    # 按分类筛选
    if category and category != "全部":
        courses = [c for c in courses if c["category"] == category]
    
    # 按难度筛选
    if difficulty:
        courses = [c for c in courses if c["difficulty"] == difficulty]
    
    # 搜索
    if search:
        search_lower = search.lower()
        courses = [c for c in courses if 
                   search_lower in c["title"].lower() or
                   search_lower in c["description"].lower() or
                   any(search_lower in tag.lower() for tag in c["tags"])]
    
    # 免费课程
    if free_only:
        courses = [c for c in courses if c["is_free"]]
    
    return {
        "courses": courses,
        "total": len(courses)
    }


@router.get("/courses/{course_id}")
def get_course_detail(course_id: str):
    """获取课程详情"""
    course = get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course_to_dict(course)


@router.get("/courses/categories/stats")
def get_courses_categories_stats():
    """获取课程分类统计"""
    return get_category_stats()


# ========== 食物数据API ==========

@router.get("/foods")
def get_foods(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """获取饮食元数据库的食物列表（用于记录时选择）"""
    foods = []
    
    for food in CORE_FOODS_DATA:
        # 获取分类的中文名称
        category_name = food.category.value if hasattr(food.category, 'value') else str(food.category)
        
        food_item = {
            "id": food.id,
            "name": food.name,
            "category": category_name,
            "default_portion": "100g",
            "calories": food.nutrients.calories,
            "protein": food.nutrients.protein,
            "carbs": food.nutrients.carbs,
            "fat": food.nutrients.fat,
            "fiber": food.nutrients.fiber,
            "description": food.details.description if food.details else ""
        }
        
        # 按分类筛选
        if category and category_name != category:
            continue
        
        # 搜索
        if search:
            search_lower = search.lower()
            if (search_lower not in food_item["name"].lower() and
                search_lower not in category_name.lower() and
                search_lower not in food_item.get("description", "").lower()):
                continue
        
        foods.append(food_item)
    
    return {
        "foods": foods,
        "total": len(foods),
        "categories": get_food_categories()
    }


def get_food_categories():
    """获取所有食物分类及数量"""
    from ..data.food_database import FoodCategory
    
    category_counts = {}
    for food in CORE_FOODS_DATA:
        cat_name = food.category.value if hasattr(food.category, 'value') else str(food.category)
        category_counts[cat_name] = category_counts.get(cat_name, 0) + 1
    
    return [
        {"key": cat.name.lower(), "name": cat.value, "count": category_counts.get(cat.value, 0)}
        for cat in FoodCategory
    ]


# ========== 饮食记录API ==========

@router.post("/diet")
def create_diet_log(
    log_date: str,  # 格式: "2024-01-15"
    meal_type: str,  # breakfast/lunch/dinner/snacks
    foods: List[dict] = [],  # 食物列表，默认为空列表
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建饮食记录
    
    foods格式:
    [
        {
            "food_id": "rice_white",
            "name": "白米饭",
            "portion": "150g",
            "calories": 174,
            "protein": 3.9,
            "carbs": 38.4,
            "fat": 0.5
        }
    ]
    """
    # 调试日志
    print(f"[饮食记录API] 接收到请求: log_date={log_date}, meal_type={meal_type}, foods数量={len(foods) if foods else 0}, foods内容={foods}")
    
    # 解析日期
    try:
        date_obj = datetime.strptime(log_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD")
    
    # 验证餐次
    valid_meals = ["breakfast", "lunch", "dinner", "snacks"]
    if meal_type not in valid_meals:
        raise HTTPException(status_code=400, detail=f"餐次必须是: {valid_meals}")
    
    # 查找当前周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True
    ).first()
    
    # 计算计划的卡路里（如果有周计划）
    planned_calories = None
    if weekly_plan:
        day_name = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][date_obj.weekday()]
        day_plan = weekly_plan.get_day_plan(day_name)
        if day_plan and "diet" in day_plan:
            diet_plan = day_plan["diet"]
            meal_plan = diet_plan.get(meal_type, {})
            if isinstance(meal_plan, dict):
                planned_calories = meal_plan.get("total_calories", 0)
            elif isinstance(meal_plan, list):
                planned_calories = sum(item.get("calories", 0) for item in meal_plan)
    
    # 检查是否已存在该日期该餐次的记录
    existing_log = db.query(DietLog).filter(
        and_(
            DietLog.user_id == current_user.id,
            func.date(DietLog.log_date) == date_obj.date(),
            DietLog.meal_type == meal_type
        )
    ).first()
    
    # 如果foods为空且存在记录，则删除该记录
    if not foods or len(foods) == 0:
        if existing_log:
            print(f"[删除饮食记录] 用户 {current_user.id}, 日期 {log_date}, 餐次 {meal_type}, 记录ID {existing_log.id}")
            db.delete(existing_log)
            db.commit()
            print(f"[删除饮食记录] 删除成功")
            return {
                "message": "饮食记录已删除",
                "deleted": True
            }
        else:
            print(f"[删除饮食记录] 无记录可删除 - 用户 {current_user.id}, 日期 {log_date}, 餐次 {meal_type}")
            return {
                "message": "无记录可删除",
                "deleted": False
            }
    
    if existing_log:
        # 更新现有记录
        existing_log.foods = json.dumps(foods, ensure_ascii=False)
        existing_log.planned_calories = planned_calories
        existing_log.notes = notes
        existing_log.calculate_totals()
        db.commit()
        db.refresh(existing_log)
        return {
            "message": "饮食记录已更新",
            "log_id": existing_log.id,
            "total_calories": existing_log.total_calories,
            "planned_calories": existing_log.planned_calories,
            "adherence_score": existing_log.adherence_score
        }
    
    # 创建新记录
    diet_log = DietLog(
        user_id=current_user.id,
        weekly_plan_id=weekly_plan.id if weekly_plan else None,
        log_date=date_obj,
        meal_type=meal_type,
        foods=json.dumps(foods, ensure_ascii=False),
        planned_calories=planned_calories,
        notes=notes
    )
    diet_log.calculate_totals()
    
    db.add(diet_log)
    db.commit()
    db.refresh(diet_log)
    
    return {
        "message": "饮食记录已创建",
        "log_id": diet_log.id,
        "total_calories": diet_log.total_calories,
        "planned_calories": diet_log.planned_calories,
        "adherence_score": diet_log.adherence_score
    }


@router.get("/diet")
def get_diet_logs(
    date: Optional[str] = None,  # 单日: "2024-01-15"
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    meal_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取饮食记录"""
    query = db.query(DietLog).filter(DietLog.user_id == current_user.id)
    
    # 日期筛选 - 使用日期字符串比较避免时区问题
    if date:
        try:
            # 验证日期格式
            datetime.strptime(date, "%Y-%m-%d")
            # 使用字符串比较
            query = query.filter(func.strftime('%Y-%m-%d', DietLog.log_date) == date)
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误")
    elif start_date and end_date:
        try:
            # 验证日期格式
            datetime.strptime(start_date, "%Y-%m-%d")
            datetime.strptime(end_date, "%Y-%m-%d")
            # 使用字符串比较
            query = query.filter(
                and_(
                    func.strftime('%Y-%m-%d', DietLog.log_date) >= start_date,
                    func.strftime('%Y-%m-%d', DietLog.log_date) <= end_date
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误")
    
    # 餐次筛选
    if meal_type:
        query = query.filter(DietLog.meal_type == meal_type)
    
    logs = query.order_by(DietLog.log_date.desc()).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "log_date": log.log_date.strftime("%Y-%m-%d"),
                "meal_type": log.meal_type,
                "foods": log.get_foods_list(),
                "total_calories": log.total_calories,
                "total_protein": log.total_protein,
                "total_carbs": log.total_carbs,
                "total_fat": log.total_fat,
                "planned_calories": log.planned_calories,
                "calorie_difference": log.calorie_difference,
                "adherence_score": log.adherence_score,
                "notes": log.notes
            }
            for log in logs
        ],
        "total": len(logs)
    }


@router.delete("/diet/{log_id}")
def delete_diet_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除饮食记录"""
    log = db.query(DietLog).filter(
        and_(DietLog.id == log_id, DietLog.user_id == current_user.id)
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    db.delete(log)
    db.commit()
    return {"message": "记录已删除"}


# ========== 运动记录API ==========

from pydantic import BaseModel

class ExerciseLogRequest(BaseModel):
    """运动记录请求体"""
    log_date: str  # 格式: "2024-01-15"
    courses: List[dict]  # 完成的课程列表
    notes: Optional[str] = None
    mood: Optional[str] = None  # great/good/normal/tired

@router.post("/exercise")
def create_exercise_log(
    request: ExerciseLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建运动记录
    
    courses格式:
    [
        {
            "course_id": "hiit_intermediate_20",
            "course_title": "燃脂HIIT训练",
            "exercise_id": "hiit_tabata",
            "instructor": "张教练",
            "duration": 20,
            "difficulty": "中级",
            "calories": 220,
            "completed_at": "2024-01-15T10:30:00"
        }
    ]
    """
    # 从请求体提取参数
    log_date = request.log_date
    courses = request.courses
    notes = request.notes
    mood = request.mood
    
    # 解析日期
    try:
        date_obj = datetime.strptime(log_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD")
    
    # 查找当前周计划
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == current_user.id,
        WeeklyPlan.is_active == True
    ).first()
    
    # 计算计划的运动量（如果有周计划）
    planned_duration = None
    planned_calories = None
    if weekly_plan:
        day_name = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][date_obj.weekday()]
        day_plan = weekly_plan.get_day_plan(day_name)
        if day_plan and "exercise" in day_plan:
            exercise_plan = day_plan["exercise"]
            if isinstance(exercise_plan, list):
                planned_duration = sum(ex.get("duration", 0) for ex in exercise_plan)
                planned_calories = sum(ex.get("calories", 0) for ex in exercise_plan)
            elif isinstance(exercise_plan, dict):
                planned_duration = exercise_plan.get("total_duration", 0)
                planned_calories = exercise_plan.get("total_calories", 0)
    
    # 检查是否已存在该日期的记录
    existing_log = db.query(ExerciseLog).filter(
        and_(
            ExerciseLog.user_id == current_user.id,
            func.date(ExerciseLog.log_date) == date_obj.date()
        )
    ).first()
    
    if existing_log:
        # 更新现有记录（追加课程）
        existing_courses = existing_log.get_courses_list()
        existing_courses.extend(courses)
        existing_log.courses = json.dumps(existing_courses, ensure_ascii=False)
        existing_log.planned_duration = planned_duration
        existing_log.planned_calories = planned_calories
        existing_log.notes = notes or existing_log.notes
        existing_log.mood = mood or existing_log.mood
        existing_log.calculate_totals()
        db.commit()
        db.refresh(existing_log)
        return {
            "message": "运动记录已更新",
            "log_id": existing_log.id,
            "total_duration": existing_log.total_duration,
            "total_calories": existing_log.total_calories,
            "course_count": existing_log.course_count,
            "adherence_score": existing_log.adherence_score
        }
    
    # 创建新记录
    exercise_log = ExerciseLog(
        user_id=current_user.id,
        weekly_plan_id=weekly_plan.id if weekly_plan else None,
        log_date=date_obj,
        courses=json.dumps(courses, ensure_ascii=False),
        planned_duration=planned_duration,
        planned_calories=planned_calories,
        notes=notes,
        mood=mood
    )
    exercise_log.calculate_totals()
    
    db.add(exercise_log)
    db.commit()
    db.refresh(exercise_log)
    
    return {
        "message": "运动记录已创建",
        "log_id": exercise_log.id,
        "total_duration": exercise_log.total_duration,
        "total_calories": exercise_log.total_calories,
        "course_count": exercise_log.course_count,
        "adherence_score": exercise_log.adherence_score
    }


@router.get("/exercise")
def get_exercise_logs(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取运动记录"""
    query = db.query(ExerciseLog).filter(ExerciseLog.user_id == current_user.id)
    
    # 日期筛选
    if date:
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            query = query.filter(func.date(ExerciseLog.log_date) == date_obj.date())
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误")
    elif start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(
                and_(
                    ExerciseLog.log_date >= start,
                    ExerciseLog.log_date <= end + timedelta(days=1)
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误")
    
    logs = query.order_by(ExerciseLog.log_date.desc()).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "log_date": log.log_date.strftime("%Y-%m-%d"),
                "courses": log.get_courses_list(),
                "total_duration": log.total_duration,
                "total_calories": log.total_calories,
                "course_count": log.course_count,
                "planned_duration": log.planned_duration,
                "planned_calories": log.planned_calories,
                "duration_difference": log.duration_difference,
                "calorie_difference": log.calorie_difference,
                "adherence_score": log.adherence_score,
                "notes": log.notes,
                "mood": log.mood
            }
            for log in logs
        ],
        "total": len(logs)
    }


class ExerciseLogUpdateRequest(BaseModel):
    """运动记录更新请求体"""
    courses: List[dict]  # 完整的课程列表（包含更新后的状态）
    notes: Optional[str] = None
    mood: Optional[str] = None


@router.put("/exercise/{log_id}")
def update_exercise_log(
    log_id: int,
    request: ExerciseLogUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新运动记录（用于标记课程完成等）
    
    courses格式:
    [
        {
            "course_id": "hiit_intermediate_20",
            "course_title": "燃脂HIIT训练",
            "duration": 20,
            "calories": 220,
            "is_completed": true,
            "completed_at": "2024-01-15T10:30:00"
        }
    ]
    """
    log = db.query(ExerciseLog).filter(
        and_(ExerciseLog.id == log_id, ExerciseLog.user_id == current_user.id)
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 更新课程列表
    log.courses = json.dumps(request.courses, ensure_ascii=False)
    
    # 更新备注和心情
    if request.notes is not None:
        log.notes = request.notes
    if request.mood is not None:
        log.mood = request.mood
    
    # 重新计算总计
    log.calculate_totals()
    
    db.commit()
    db.refresh(log)
    
    return {
        "message": "运动记录已更新",
        "log_id": log.id,
        "total_duration": log.total_duration,
        "total_calories": log.total_calories,
        "course_count": log.course_count,
        "adherence_score": log.adherence_score
    }


@router.delete("/exercise/{log_id}")
def delete_exercise_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除运动记录"""
    log = db.query(ExerciseLog).filter(
        and_(ExerciseLog.id == log_id, ExerciseLog.user_id == current_user.id)
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    db.delete(log)
    db.commit()
    return {"message": "记录已删除"}


# ========== 统计对比API ==========

@router.get("/stats/daily")
def get_daily_stats(
    date: str,  # 格式: "2024-01-15"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取某天的饮食+运动统计对比"""
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式错误")
    
    # 获取该天的饮食记录
    diet_logs = db.query(DietLog).filter(
        and_(
            DietLog.user_id == current_user.id,
            func.date(DietLog.log_date) == date_obj.date()
        )
    ).all()
    
    # 获取该天的运动记录
    exercise_log = db.query(ExerciseLog).filter(
        and_(
            ExerciseLog.user_id == current_user.id,
            func.date(ExerciseLog.log_date) == date_obj.date()
        )
    ).first()
    
    # 汇总饮食数据
    diet_summary = {
        "actual": {
            "calories": sum(log.total_calories or 0 for log in diet_logs),
            "protein": sum(log.total_protein or 0 for log in diet_logs),
            "carbs": sum(log.total_carbs or 0 for log in diet_logs),
            "fat": sum(log.total_fat or 0 for log in diet_logs),
        },
        "planned": {
            "calories": sum(log.planned_calories or 0 for log in diet_logs),
        },
        "meals": {
            log.meal_type: {
                "actual_calories": log.total_calories,
                "planned_calories": log.planned_calories,
                "adherence_score": log.adherence_score,
                "foods": log.get_foods_list()
            }
            for log in diet_logs
        }
    }
    
    # 汇总运动数据
    exercise_summary = {
        "actual": {
            "duration": exercise_log.total_duration if exercise_log else 0,
            "calories": exercise_log.total_calories if exercise_log else 0,
            "course_count": exercise_log.course_count if exercise_log else 0
        },
        "planned": {
            "duration": exercise_log.planned_duration if exercise_log else 0,
            "calories": exercise_log.planned_calories if exercise_log else 0
        },
        "courses": exercise_log.get_courses_list() if exercise_log else [],
        "adherence_score": exercise_log.adherence_score if exercise_log else 0,
        "mood": exercise_log.mood if exercise_log else None
    }
    
    # 计算净卡路里（摄入 - 消耗）
    net_calories = diet_summary["actual"]["calories"] - exercise_summary["actual"]["calories"]
    
    return {
        "date": date,
        "diet": diet_summary,
        "exercise": exercise_summary,
        "net_calories": net_calories,
        "has_diet_record": len(diet_logs) > 0,
        "has_exercise_record": exercise_log is not None
    }


@router.get("/stats/weekly")
def get_weekly_stats(
    start_date: Optional[str] = None,  # 不传则默认本周
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取一周的统计对比数据（用于图表展示）
    
    智能日期选择：
    - 如果指定了start_date，使用指定日期
    - 如果没有指定，优先使用本周
    - 如果本周没有任何记录，自动查找最近有记录的一周
    """
    # 确定周的开始日期
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误")
    else:
        today = datetime.now()
        start = today - timedelta(days=today.weekday())  # 本周一
        
        # 检查本周是否有数据
        end_check = start + timedelta(days=7)
        has_diet = db.query(DietLog).filter(
            and_(
                DietLog.user_id == current_user.id,
                DietLog.log_date >= start,
                DietLog.log_date < end_check
            )
        ).first()
        
        has_exercise = db.query(ExerciseLog).filter(
            and_(
                ExerciseLog.user_id == current_user.id,
                ExerciseLog.log_date >= start,
                ExerciseLog.log_date < end_check
            )
        ).first()
        
        # 如果本周没有数据，查找最近有记录的周
        if not has_diet and not has_exercise:
            # 找最近的饮食记录
            latest_diet = db.query(DietLog).filter(
                DietLog.user_id == current_user.id
            ).order_by(DietLog.log_date.desc()).first()
            
            # 找最近的运动记录
            latest_exercise = db.query(ExerciseLog).filter(
                ExerciseLog.user_id == current_user.id
            ).order_by(ExerciseLog.log_date.desc()).first()
            
            # 选择最近的记录日期
            latest_date = None
            if latest_diet and latest_exercise:
                latest_date = max(latest_diet.log_date, latest_exercise.log_date)
            elif latest_diet:
                latest_date = latest_diet.log_date
            elif latest_exercise:
                latest_date = latest_exercise.log_date
            
            if latest_date:
                # 计算该日期所在周的周一
                start = latest_date - timedelta(days=latest_date.weekday())
    
    end = start + timedelta(days=6)  # 本周日
    
    # 获取当周的周计划（用于获取每天的计划热量）
    weekly_plan = db.query(WeeklyPlan).filter(
        and_(
            WeeklyPlan.user_id == current_user.id,
            WeeklyPlan.week_start_date >= start.date(),
            WeeklyPlan.week_start_date <= end.date()
        )
    ).first()
    
    # 解析周计划中的每日计划
    daily_plan_data = {}
    if weekly_plan and weekly_plan.daily_plans:
        try:
            daily_plans = json.loads(weekly_plan.daily_plans)
            # 建立日期到计划的映射
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            for i, day_name in enumerate(day_names):
                day_date = (start + timedelta(days=i)).date()
                if day_name in daily_plans:
                    day_plan = daily_plans[day_name]
                    diet_info = day_plan.get('diet', {})
                    exercise_info = day_plan.get('exercise', {}) or day_plan.get('exercises', [])
                    daily_plan_data[day_date] = {
                        'diet_calories_target': diet_info.get('calories_target', 2000),
                        'exercise_calories_target': exercise_info.get('calories_target', 0) if isinstance(exercise_info, dict) else sum(e.get('calories', 0) for e in exercise_info if isinstance(e, dict)),
                        'exercise_duration_target': exercise_info.get('duration', 0) if isinstance(exercise_info, dict) else sum(e.get('duration', 0) for e in exercise_info if isinstance(e, dict)),
                    }
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[get_weekly_stats] 解析周计划失败: {e}")
    
    # 获取一周的饮食记录
    diet_logs = db.query(DietLog).filter(
        and_(
            DietLog.user_id == current_user.id,
            DietLog.log_date >= start,
            DietLog.log_date <= end + timedelta(days=1)
        )
    ).all()
    
    # 获取一周的运动记录
    exercise_logs = db.query(ExerciseLog).filter(
        and_(
            ExerciseLog.user_id == current_user.id,
            ExerciseLog.log_date >= start,
            ExerciseLog.log_date <= end + timedelta(days=1)
        )
    ).all()
    
    # 按天汇总
    daily_stats = []
    
    # 汇总统计
    total_diet_adherence = 0
    total_exercise_adherence = 0
    total_planned_calories = 0
    total_actual_calories = 0
    total_meals_recorded = 0
    total_planned_duration = 0
    total_actual_duration = 0
    total_exercise_planned_calories = 0
    total_exercise_actual_calories = 0
    total_courses_completed = 0
    diet_days_count = 0
    exercise_days_count = 0
    
    for i in range(7):
        day = start + timedelta(days=i)
        day_date = day.date()
        
        # 从周计划获取当天的计划热量
        plan_for_day = daily_plan_data.get(day_date, {})
        diet_target_from_plan = plan_for_day.get('diet_calories_target', 2000)
        exercise_target_from_plan = plan_for_day.get('exercise_calories_target', 0)
        exercise_duration_from_plan = plan_for_day.get('exercise_duration_target', 0)
        
        # 该天的饮食
        day_diet_logs = [l for l in diet_logs if l.log_date.date() == day_date]
        diet_actual_cal = sum(l.total_calories or 0 for l in day_diet_logs)
        # 优先使用周计划中的目标热量
        diet_planned_cal = diet_target_from_plan
        meals_recorded = len(day_diet_logs)
        meals_planned = 3  # 默认一天三餐
        
        # 计算饮食依从率
        if diet_planned_cal > 0:
            diet_adherence = min(100, (diet_actual_cal / diet_planned_cal) * 100)
        else:
            diet_adherence = 0 if diet_actual_cal == 0 else 100
        
        if meals_recorded > 0:
            diet_days_count += 1
            total_diet_adherence += diet_adherence
        
        total_planned_calories += diet_planned_cal
        total_actual_calories += diet_actual_cal
        total_meals_recorded += meals_recorded
        
        # 该天的运动
        day_exercise_log = next((l for l in exercise_logs if l.log_date.date() == day_date), None)
        if day_exercise_log:
            exercise_actual_dur = day_exercise_log.total_duration or 0
            # 优先使用周计划中的目标
            exercise_planned_dur = exercise_duration_from_plan if exercise_duration_from_plan > 0 else (day_exercise_log.planned_duration or 30)
            exercise_actual_cal = day_exercise_log.total_calories or 0
            exercise_planned_cal = exercise_target_from_plan if exercise_target_from_plan > 0 else (day_exercise_log.planned_calories or 200)
            courses_completed = day_exercise_log.course_count or 0
            
            # 计算运动依从率
            if exercise_planned_dur > 0:
                exercise_adherence = min(100, (exercise_actual_dur / exercise_planned_dur) * 100)
            else:
                exercise_adherence = 100 if exercise_actual_dur > 0 else 0
            
            exercise_days_count += 1
            total_exercise_adherence += exercise_adherence
        else:
            exercise_actual_dur = 0
            # 使用周计划中的目标，如果没有则用默认值
            exercise_planned_dur = exercise_duration_from_plan if exercise_duration_from_plan > 0 else 0
            exercise_actual_cal = 0
            exercise_planned_cal = exercise_target_from_plan if exercise_target_from_plan > 0 else 0
            courses_completed = 0
            exercise_adherence = 0
        
        total_planned_duration += exercise_planned_dur
        total_actual_duration += exercise_actual_dur
        total_exercise_planned_calories += exercise_planned_cal
        total_exercise_actual_calories += exercise_actual_cal
        total_courses_completed += courses_completed
        
        daily_stats.append({
            "date": day.strftime("%Y-%m-%d"),
            "diet": {
                "planned_calories": diet_planned_cal,
                "actual_calories": diet_actual_cal,
                "adherence_score": round(diet_adherence, 1),
                "meals_recorded": meals_recorded,
                "meals_planned": meals_planned
            },
            "exercise": {
                "planned_duration": exercise_planned_dur,
                "actual_duration": exercise_actual_dur,
                "planned_calories": exercise_planned_cal,
                "actual_calories": exercise_actual_cal,
                "adherence_score": round(exercise_adherence, 1),
                "courses_completed": courses_completed
            }
        })
    
    # 计算平均依从率
    avg_diet_adherence = round(total_diet_adherence / diet_days_count, 1) if diet_days_count > 0 else 0
    avg_exercise_adherence = round(total_exercise_adherence / exercise_days_count, 1) if exercise_days_count > 0 else 0
    
    return {
        "week_start": start.strftime("%Y-%m-%d"),
        "week_end": end.strftime("%Y-%m-%d"),
        "daily_stats": daily_stats,
        "summary": {
            "diet": {
                "avg_adherence": avg_diet_adherence,
                "total_planned_calories": total_planned_calories,
                "total_actual_calories": total_actual_calories,
                "total_meals_recorded": total_meals_recorded
            },
            "exercise": {
                "avg_adherence": avg_exercise_adherence,
                "total_planned_duration": total_planned_duration,
                "total_actual_duration": total_actual_duration,
                "total_planned_calories": total_exercise_planned_calories,
                "total_actual_calories": total_exercise_actual_calories,
                "total_courses_completed": total_courses_completed
            }
        }
    }


# ========== AI分析API ==========

from ..services.deepseek_client import generate_answer, DeepSeekUnavailable

@router.post("/stats/ai-analysis")
async def generate_ai_analysis(
    request: dict,  # {"analysis_type": "diet" | "exercise" | "comprehensive"}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI分析用户的运动/饮食数据
    
    analysis_type:
    - diet: 分析饮食数据
    - exercise: 分析运动数据
    - comprehensive: 综合分析
    
    智能日期选择：如果最近7天没有数据，自动查找有数据的时间段
    """
    analysis_type = request.get("analysis_type", "diet")
    
    # 初始使用最近7天
    today = datetime.now()
    week_start = today - timedelta(days=6)
    
    # 获取饮食记录
    diet_logs = db.query(DietLog).filter(
        and_(
            DietLog.user_id == current_user.id,
            DietLog.log_date >= week_start,
            DietLog.log_date <= today + timedelta(days=1)
        )
    ).all()
    
    # 获取运动记录
    exercise_logs = db.query(ExerciseLog).filter(
        and_(
            ExerciseLog.user_id == current_user.id,
            ExerciseLog.log_date >= week_start,
            ExerciseLog.log_date <= today + timedelta(days=1)
        )
    ).all()
    
    # 如果没有数据，查找最近有记录的时间段
    if not diet_logs and not exercise_logs:
        # 查找最近的饮食记录
        recent_diet = db.query(DietLog).filter(
            DietLog.user_id == current_user.id
        ).order_by(DietLog.log_date.desc()).first()
        
        # 查找最近的运动记录
        recent_exercise = db.query(ExerciseLog).filter(
            ExerciseLog.user_id == current_user.id
        ).order_by(ExerciseLog.log_date.desc()).first()
        
        # 找到最近的记录日期
        recent_dates = []
        if recent_diet:
            recent_dates.append(recent_diet.log_date)
        if recent_exercise:
            recent_dates.append(recent_exercise.log_date)
        
        if recent_dates:
            most_recent = max(recent_dates)
            # 使用最近记录的那一周
            week_start = most_recent - timedelta(days=6)
            
            diet_logs = db.query(DietLog).filter(
                and_(
                    DietLog.user_id == current_user.id,
                    DietLog.log_date >= week_start,
                    DietLog.log_date <= most_recent + timedelta(days=1)
                )
            ).all()
            
            exercise_logs = db.query(ExerciseLog).filter(
                and_(
                    ExerciseLog.user_id == current_user.id,
                    ExerciseLog.log_date >= week_start,
                    ExerciseLog.log_date <= most_recent + timedelta(days=1)
                )
            ).all()
    
    # 准备数据摘要
    diet_summary = {
        "days_recorded": len(set(l.log_date.date() for l in diet_logs)),
        "total_calories": sum(l.total_calories or 0 for l in diet_logs),
        "avg_daily_calories": round(sum(l.total_calories or 0 for l in diet_logs) / max(len(set(l.log_date.date() for l in diet_logs)), 1)),
        "total_meals": len(diet_logs),
        "daily_breakdown": []
    }
    
    exercise_summary = {
        "days_recorded": len(exercise_logs),
        "total_duration": sum(l.total_duration or 0 for l in exercise_logs),
        "total_calories_burned": sum(l.total_calories or 0 for l in exercise_logs),
        "total_courses": sum(l.course_count or 0 for l in exercise_logs),
        "avg_adherence": round(sum(l.adherence_score or 0 for l in exercise_logs) / max(len(exercise_logs), 1)),
        "daily_breakdown": []
    }
    
    # 每日明细
    for i in range(7):
        day = week_start + timedelta(days=i)
        day_date = day.date()
        day_name = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][day.weekday()]
        
        # 当天饮食
        day_diet = [l for l in diet_logs if l.log_date.date() == day_date]
        if day_diet:
            diet_summary["daily_breakdown"].append({
                "date": day.strftime("%m/%d"),
                "day": day_name,
                "calories": sum(l.total_calories or 0 for l in day_diet),
                "meals": len(day_diet)
            })
        
        # 当天运动
        day_exercise = next((l for l in exercise_logs if l.log_date.date() == day_date), None)
        if day_exercise:
            exercise_summary["daily_breakdown"].append({
                "date": day.strftime("%m/%d"),
                "day": day_name,
                "duration": day_exercise.total_duration or 0,
                "calories": day_exercise.total_calories or 0,
                "courses": day_exercise.course_count or 0
            })
    
    # 构建AI提示词
    if analysis_type == "diet":
        prompt = f"""请分析以下用户最近7天的饮食数据，提供专业的健康建议：

## 饮食数据摘要
- 记录天数：{diet_summary['days_recorded']}天
- 总摄入热量：{diet_summary['total_calories']}千卡
- 日均摄入：{diet_summary['avg_daily_calories']}千卡
- 总记录餐次：{diet_summary['total_meals']}餐

## 每日明细
{json.dumps(diet_summary['daily_breakdown'], ensure_ascii=False, indent=2)}

请从以下几个方面进行分析：
1. 热量摄入评估：是否合理
2. 饮食规律性：记录频率和稳定性
3. 具体改进建议：3-5条可操作建议
4. 一句话总结

请用友好、专业的语气回复，使用emoji增加亲和力。"""
        
    elif analysis_type == "exercise":
        prompt = f"""请分析以下用户最近7天的运动数据，提供专业的健康建议：

## 运动数据摘要
- 运动天数：{exercise_summary['days_recorded']}天
- 总运动时长：{exercise_summary['total_duration']}分钟
- 总消耗热量：{exercise_summary['total_calories_burned']}千卡
- 完成课程数：{exercise_summary['total_courses']}节
- 平均执行率：{exercise_summary['avg_adherence']}%

## 每日明细
{json.dumps(exercise_summary['daily_breakdown'], ensure_ascii=False, indent=2)}

请从以下几个方面进行分析：
1. 运动量评估：是否达到健康标准
2. 运动规律性：频率和持续性
3. 执行情况：计划完成度分析
4. 具体改进建议：3-5条可操作建议
5. 一句话总结

请用友好、专业的语气回复，使用emoji增加亲和力。"""
        
    else:  # comprehensive
        net_calories = diet_summary['total_calories'] - exercise_summary['total_calories_burned']
        prompt = f"""请综合分析以下用户最近7天的饮食和运动数据，提供全面的健康建议：

## 饮食数据
- 记录天数：{diet_summary['days_recorded']}天
- 总摄入热量：{diet_summary['total_calories']}千卡
- 日均摄入：{diet_summary['avg_daily_calories']}千卡

## 运动数据
- 运动天数：{exercise_summary['days_recorded']}天
- 总运动时长：{exercise_summary['total_duration']}分钟
- 总消耗热量：{exercise_summary['total_calories_burned']}千卡
- 平均执行率：{exercise_summary['avg_adherence']}%

## 能量平衡
- 净热量：{net_calories}千卡（摄入-消耗）
- 日均净热量：{round(net_calories/7)}千卡/天

请从以下几个方面进行综合分析：
1. 能量平衡评估：摄入与消耗是否匹配用户目标
2. 饮食运动协调性：两者配合是否合理
3. 健康风险提示：需要注意的问题
4. 综合改进建议：5条可操作建议
5. 下周目标建议

请用友好、专业的语气回复，使用emoji增加亲和力。"""
    
    # 调用AI
    try:
        system_prompt = "你是一位专业的健康管理顾问和营养师，擅长分析用户的饮食和运动数据，提供个性化的健康建议。请根据数据给出专业、友好、可操作的建议。"
        ai_response = generate_answer(prompt, system_prompt)
        
        return {
            "analysis_type": analysis_type,
            "period": f"{week_start.strftime('%Y-%m-%d')} ~ {today.strftime('%Y-%m-%d')}",
            "diet_summary": diet_summary if analysis_type in ["diet", "comprehensive"] else None,
            "exercise_summary": exercise_summary if analysis_type in ["exercise", "comprehensive"] else None,
            "ai_analysis": ai_response,
            "generated_at": datetime.now().isoformat()
        }
    except DeepSeekUnavailable as e:
        raise HTTPException(status_code=503, detail=f"AI服务暂不可用: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")