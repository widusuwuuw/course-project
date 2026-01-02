"""
营养追踪路由 v2
支持动态目标计算、推荐菜单、智能反馈
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
import json
import math

from ..db import get_db
from ..models import User, WeeklyPlan, UserPreferences
from ..deps import get_current_user

router = APIRouter(prefix="/api/v1/nutrition", tags=["nutrition"])


# ============ Pydantic 模型 ============

class FoodRecordCreate(BaseModel):
    """创建食物记录"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    meal_type: str = Field(..., description="breakfast/lunch/dinner/snack")
    food_name: str = Field(..., min_length=1, max_length=100)
    serving_size: Optional[str] = None
    quantity: float = Field(1, ge=0.1, le=100)
    calories: float = Field(0, ge=0)
    protein: float = Field(0, ge=0)
    carbs: float = Field(0, ge=0)
    fat: float = Field(0, ge=0)
    fiber: float = Field(0, ge=0)
    sodium: float = Field(0, ge=0)
    source_type: str = Field("manual", description="manual/recommended/database")
    food_ingredient_id: Optional[str] = None
    notes: Optional[str] = None


class FoodRecordResponse(BaseModel):
    """食物记录响应"""
    id: int
    date: str
    meal_type: str
    food_name: str
    serving_size: Optional[str]
    quantity: float
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sodium: float
    source_type: str
    notes: Optional[str]


class NutritionTarget(BaseModel):
    """营养目标"""
    calories: int
    protein: int
    carbs: int
    fat: int
    fiber: int = 25
    sodium_max: int = 2300
    calculation_details: Optional[Dict[str, Any]] = None


class DailyNutritionResponse(BaseModel):
    """每日营养响应"""
    date: str
    target: NutritionTarget
    actual: Dict[str, float]
    progress: Dict[str, float]
    exercise_burned: float
    meals: Dict[str, List[Dict]]
    tips: List[str]
    recommended_menu: Optional[Dict] = None


class NutritionGoalUpdate(BaseModel):
    """更新营养目标"""
    daily_calories: Optional[int] = Field(None, ge=1000, le=5000)
    daily_protein: Optional[int] = Field(None, ge=30, le=300)
    daily_carbs: Optional[int] = Field(None, ge=50, le=500)
    daily_fat: Optional[int] = Field(None, ge=20, le=200)
    calorie_calculation_mode: Optional[str] = Field(None, description="auto/manual")


# ============ 工具函数 ============

def calculate_bmr(gender: str, weight: float, height: float, age: int) -> float:
    """计算基础代谢率 (Mifflin-St Jeor公式)"""
    if gender == "male":
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:
        return 10 * weight + 6.25 * height - 5 * age - 161


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """计算每日总能量消耗"""
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    return bmr * multipliers.get(activity_level, 1.2)


def work_intensity_to_activity(work_intensity: str) -> str:
    """将工作强度映射到活动水平"""
    mapping = {
        "久坐办公": "sedentary",
        "站立工作": "light",
        "体力劳动": "active",
        "混合": "moderate"
    }
    return mapping.get(work_intensity, "sedentary")


def calculate_macro_targets(calories: int, health_goal: str) -> Dict[str, int]:
    """根据热量和健康目标计算宏量营养素目标"""
    if health_goal == "增肌":
        protein = int(calories * 0.30 / 4)
        carbs = int(calories * 0.45 / 4)
        fat = int(calories * 0.25 / 9)
    elif health_goal == "减重":
        protein = int(calories * 0.35 / 4)
        carbs = int(calories * 0.35 / 4)
        fat = int(calories * 0.30 / 9)
    else:
        protein = int(calories * 0.25 / 4)
        carbs = int(calories * 0.50 / 4)
        fat = int(calories * 0.25 / 9)
    
    return {"protein": protein, "carbs": carbs, "fat": fat}


def get_exercise_calories_for_date(db: Session, user_id: int, target_date: date) -> float:
    """获取某天的运动消耗卡路里"""
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user_id,
        WeeklyPlan.week_start_date <= target_date,
        WeeklyPlan.week_end_date >= target_date
    ).order_by(WeeklyPlan.updated_at.desc()).first()
    
    if not weekly_plan:
        return 0
    
    weekday_map = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    weekday = weekday_map[target_date.weekday()]
    
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    day_plan = daily_plans.get(weekday, {})
    
    if day_plan.get("is_rest_day"):
        return 0
    
    total_calories = 0
    exercises = day_plan.get("exercises", [])
    for ex in exercises:
        total_calories += ex.get("calories_target", 0)
    
    if not exercises and day_plan.get("exercise"):
        total_calories = day_plan["exercise"].get("calories_target", 0)
    
    return total_calories


def get_recommended_menu_for_date(db: Session, user_id: int, target_date: date) -> Optional[Dict]:
    """从周计划获取某天的推荐菜单"""
    weekly_plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user_id,
        WeeklyPlan.week_start_date <= target_date,
        WeeklyPlan.week_end_date >= target_date
    ).order_by(WeeklyPlan.updated_at.desc()).first()
    
    if not weekly_plan:
        return None
    
    weekday_map = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    weekday = weekday_map[target_date.weekday()]
    
    daily_plans = json.loads(weekly_plan.daily_plans) if weekly_plan.daily_plans else {}
    day_plan = daily_plans.get(weekday, {})
    
    return day_plan.get("diet")


def generate_nutrition_tips(actual: Dict, target: NutritionTarget, medical_restrictions: Dict = None) -> List[str]:
    """生成营养建议提示"""
    tips = []
    
    cal_ratio = actual["calories"] / target.calories if target.calories > 0 else 0
    if cal_ratio < 0.3:
        tips.append("今日热量摄入较少，注意保证基本能量供应")
    elif cal_ratio > 1.1:
        tips.append("今日热量已超标，晚餐建议选择低热量食物")
    
    protein_ratio = actual["protein"] / target.protein if target.protein > 0 else 0
    if protein_ratio < 0.5:
        tips.append("蛋白质摄入不足，建议增加鸡蛋、鸡胸肉或豆腐")
    
    carbs_ratio = actual["carbs"] / target.carbs if target.carbs > 0 else 0
    if carbs_ratio > 1.2:
        tips.append("碳水化合物偏高，可减少主食摄入")
    
    if actual["fiber"] < 15:
        tips.append("膳食纤维偏低，建议多吃蔬菜水果")
    
    if actual["sodium"] > 2000:
        tips.append("钠摄入偏高，注意减少盐分摄入")
    
    if medical_restrictions:
        if medical_restrictions.get("low_gi"):
            tips.append("建议选择低GI食物，控制血糖波动")
        if medical_restrictions.get("low_fat"):
            tips.append("建议选择清蒸、水煮等低脂烹饪方式")
        if medical_restrictions.get("low_purine"):
            tips.append("注意避免高嘌呤食物如海鲜、内脏")
    
    return tips if tips else ["今日饮食均衡，继续保持！"]


# ============ API 路由 ============

@router.get("/daily/{date_str}", response_model=DailyNutritionResponse)
async def get_daily_nutrition(
    date_str: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取某天的营养数据（含动态目标计算）"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的日期格式")
    
    # 1. 获取用户偏好和自定义目标
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    result = db.execute(text(
        "SELECT * FROM nutrition_goals WHERE user_id = :user_id"
    ), {"user_id": current_user.id}).fetchone()
    
    custom_goals = None
    calorie_mode = "auto"
    medical_restrictions = {}
    
    if result:
        custom_goals = dict(result._mapping)
        calorie_mode = custom_goals.get("calorie_calculation_mode", "auto")
        if custom_goals.get("medical_restrictions"):
            try:
                medical_restrictions = json.loads(custom_goals["medical_restrictions"])
            except:
                pass
    
    # 2. 计算目标
    calculation_details = {}
    
    if calorie_mode == "manual" and custom_goals:
        target_calories = custom_goals.get("daily_calories", 2000)
        target_protein = custom_goals.get("daily_protein", 150)
        target_carbs = custom_goals.get("daily_carbs", 250)
        target_fat = custom_goals.get("daily_fat", 65)
        calculation_details["mode"] = "manual"
    else:
        weight = 65.0
        height = 170.0
        age = 25
        gender = current_user.gender if current_user.gender in ["male", "female"] else "male"
        activity_level = "sedentary"
        health_goal = "保持健康"
        
        if prefs:
            prefs_dict = prefs.to_dict()
            if prefs_dict.get("target_weight"):
                weight = prefs_dict["target_weight"]
            if prefs_dict.get("work_intensity"):
                activity_level = work_intensity_to_activity(prefs_dict["work_intensity"])
            if prefs_dict.get("health_goal"):
                health_goal = prefs_dict["health_goal"]
        
        bmr = calculate_bmr(gender, weight, height, age)
        tdee = calculate_tdee(bmr, activity_level)
        exercise_calories = get_exercise_calories_for_date(db, current_user.id, target_date)
        
        if health_goal == "减重":
            target_calories = int(tdee - 500 + exercise_calories)
        elif health_goal == "增肌":
            target_calories = int(tdee + 300 + exercise_calories)
        else:
            target_calories = int(tdee + exercise_calories)
        
        macros = calculate_macro_targets(target_calories, health_goal)
        target_protein = macros["protein"]
        target_carbs = macros["carbs"]
        target_fat = macros["fat"]
        
        calculation_details = {
            "mode": "auto",
            "bmr": round(bmr, 1),
            "tdee": round(tdee, 1),
            "exercise_calories": exercise_calories,
            "health_goal": health_goal,
            "activity_level": activity_level
        }
    
    target = NutritionTarget(
        calories=target_calories,
        protein=target_protein,
        carbs=target_carbs,
        fat=target_fat,
        calculation_details=calculation_details
    )
    
    # 3. 查询当天的食物记录
    records = db.execute(text("""
        SELECT * FROM food_records 
        WHERE user_id = :user_id AND date = :date
        ORDER BY created_at
    """), {"user_id": current_user.id, "date": date_str}).fetchall()
    
    meals = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    actual = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sodium": 0}
    
    for record in records:
        r = dict(record._mapping)
        food_data = {
            "id": r["id"],
            "food_name": r["food_name"],
            "serving_size": r["serving_size"],
            "quantity": r["quantity"],
            "calories": r["calories"],
            "protein": r["protein"],
            "carbs": r["carbs"],
            "fat": r["fat"],
            "source_type": r["source_type"]
        }
        meals[r["meal_type"]].append(food_data)
        
        actual["calories"] += r["calories"] * r["quantity"]
        actual["protein"] += r["protein"] * r["quantity"]
        actual["carbs"] += r["carbs"] * r["quantity"]
        actual["fat"] += r["fat"] * r["quantity"]
        actual["fiber"] += r["fiber"] * r["quantity"]
        actual["sodium"] += r["sodium"] * r["quantity"]
    
    progress = {
        "calories": min(100, round(actual["calories"] / target.calories * 100, 1)) if target.calories > 0 else 0,
        "protein": min(100, round(actual["protein"] / target.protein * 100, 1)) if target.protein > 0 else 0,
        "carbs": min(100, round(actual["carbs"] / target.carbs * 100, 1)) if target.carbs > 0 else 0,
        "fat": min(100, round(actual["fat"] / target.fat * 100, 1)) if target.fat > 0 else 0,
    }
    
    exercise_burned = get_exercise_calories_for_date(db, current_user.id, target_date)
    recommended_menu = get_recommended_menu_for_date(db, current_user.id, target_date)
    tips = generate_nutrition_tips(actual, target, medical_restrictions)
    
    return DailyNutritionResponse(
        date=date_str,
        target=target,
        actual=actual,
        progress=progress,
        exercise_burned=exercise_burned,
        meals=meals,
        tips=tips,
        recommended_menu=recommended_menu
    )


@router.post("/records", response_model=FoodRecordResponse, status_code=201)
async def create_food_record(
    record: FoodRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建食物记录"""
    valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
    if record.meal_type not in valid_meal_types:
        raise HTTPException(status_code=400, detail="无效的餐次类型")
    
    try:
        datetime.strptime(record.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的日期格式")
    
    db.execute(text("""
        INSERT INTO food_records (
            user_id, date, meal_type, food_name, serving_size, quantity,
            calories, protein, carbs, fat, fiber, sodium,
            source_type, food_ingredient_id, notes
        ) VALUES (
            :user_id, :date, :meal_type, :food_name, :serving_size, :quantity,
            :calories, :protein, :carbs, :fat, :fiber, :sodium,
            :source_type, :food_ingredient_id, :notes
        )
    """), {
        "user_id": current_user.id,
        "date": record.date,
        "meal_type": record.meal_type,
        "food_name": record.food_name,
        "serving_size": record.serving_size,
        "quantity": record.quantity,
        "calories": record.calories,
        "protein": record.protein,
        "carbs": record.carbs,
        "fat": record.fat,
        "fiber": record.fiber,
        "sodium": record.sodium,
        "source_type": record.source_type,
        "food_ingredient_id": record.food_ingredient_id,
        "notes": record.notes
    })
    db.commit()
    
    result = db.execute(text("""
        SELECT * FROM food_records 
        WHERE user_id = :user_id 
        ORDER BY id DESC LIMIT 1
    """), {"user_id": current_user.id}).fetchone()
    
    r = dict(result._mapping)
    return FoodRecordResponse(
        id=r["id"],
        date=r["date"],
        meal_type=r["meal_type"],
        food_name=r["food_name"],
        serving_size=r["serving_size"],
        quantity=r["quantity"],
        calories=r["calories"],
        protein=r["protein"],
        carbs=r["carbs"],
        fat=r["fat"],
        fiber=r["fiber"],
        sodium=r["sodium"],
        source_type=r["source_type"],
        notes=r["notes"]
    )


@router.delete("/records/{record_id}", status_code=204)
async def delete_food_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除食物记录"""
    result = db.execute(text("""
        DELETE FROM food_records 
        WHERE id = :id AND user_id = :user_id
    """), {"id": record_id, "user_id": current_user.id})
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    return None


@router.get("/goals")
async def get_nutrition_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取营养目标配置"""
    result = db.execute(text(
        "SELECT * FROM nutrition_goals WHERE user_id = :user_id"
    ), {"user_id": current_user.id}).fetchone()
    
    if result:
        r = dict(result._mapping)
        return {
            "daily_calories": r["daily_calories"],
            "daily_protein": r["daily_protein"],
            "daily_carbs": r["daily_carbs"],
            "daily_fat": r["daily_fat"],
            "daily_fiber": r["daily_fiber"],
            "daily_sodium_max": r["daily_sodium_max"],
            "calorie_calculation_mode": r["calorie_calculation_mode"]
        }
    else:
        return {
            "daily_calories": 2000,
            "daily_protein": 150,
            "daily_carbs": 250,
            "daily_fat": 65,
            "daily_fiber": 25,
            "daily_sodium_max": 2300,
            "calorie_calculation_mode": "auto"
        }


@router.put("/goals")
async def update_nutrition_goals(
    update: NutritionGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新营养目标"""
    existing = db.execute(text(
        "SELECT id FROM nutrition_goals WHERE user_id = :user_id"
    ), {"user_id": current_user.id}).fetchone()
    
    if existing:
        updates = []
        params = {"user_id": current_user.id}
        
        if update.daily_calories is not None:
            updates.append("daily_calories = :daily_calories")
            params["daily_calories"] = update.daily_calories
        if update.daily_protein is not None:
            updates.append("daily_protein = :daily_protein")
            params["daily_protein"] = update.daily_protein
        if update.daily_carbs is not None:
            updates.append("daily_carbs = :daily_carbs")
            params["daily_carbs"] = update.daily_carbs
        if update.daily_fat is not None:
            updates.append("daily_fat = :daily_fat")
            params["daily_fat"] = update.daily_fat
        if update.calorie_calculation_mode is not None:
            updates.append("calorie_calculation_mode = :calorie_calculation_mode")
            params["calorie_calculation_mode"] = update.calorie_calculation_mode
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            db.execute(text(f"""
                UPDATE nutrition_goals 
                SET {', '.join(updates)}
                WHERE user_id = :user_id
            """), params)
            db.commit()
    else:
        db.execute(text("""
            INSERT INTO nutrition_goals (
                user_id, daily_calories, daily_protein, daily_carbs, daily_fat,
                calorie_calculation_mode
            ) VALUES (
                :user_id, :daily_calories, :daily_protein, :daily_carbs, :daily_fat,
                :calorie_calculation_mode
            )
        """), {
            "user_id": current_user.id,
            "daily_calories": update.daily_calories or 2000,
            "daily_protein": update.daily_protein or 150,
            "daily_carbs": update.daily_carbs or 250,
            "daily_fat": update.daily_fat or 65,
            "calorie_calculation_mode": update.calorie_calculation_mode or "auto"
        })
        db.commit()
    
    return {"status": "success", "message": "营养目标已更新"}


@router.get("/food-database/search")
async def search_food_database(
    q: str,
    current_user: User = Depends(get_current_user)
):
    """搜索食材数据库"""
    from ..data.food_ingredients_data import CORE_FOODS_DATA
    
    results = []
    query = q.lower()
    
    for food in CORE_FOODS_DATA:
        # 检查名称或别名中是否包含查询词
        name_match = query in food.name.lower()
        alias_match = any(query in alias.lower() for alias in food.common_names) if food.common_names else False
        
        if name_match or alias_match:
            results.append({
                "id": food.id,
                "name": food.name,
                "category": food.category.value,
                "per_100g": {
                    "calories": food.nutrients.calories,
                    "protein": food.nutrients.protein,
                    "carbs": food.nutrients.carbs,
                    "fat": food.nutrients.fat,
                    "fiber": food.nutrients.fiber
                },
                "gi_level": food.medical_tags.glycemic_index.value if food.medical_tags.glycemic_index else None,
                "suitable_for": food.medical_tags.suitable_conditions
            })
    
    return {"results": results[:20]}
