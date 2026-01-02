"""
用户偏好设置 API 路由

提供用户偏好的 CRUD 接口，包括：
- 饮食偏好（口味、过敏原、禁忌食材等）
- 运动偏好（喜好运动类型、频率、时长等）
- 生活习惯（作息、工作强度、压力水平等）
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import User, UserPreferences
from ..db import get_db
from ..deps import get_current_user

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/preferences", tags=["preferences"])


# ========== 请求/响应模型 ==========

class DietPreferencesRequest(BaseModel):
    """饮食偏好请求"""
    taste_preference: Optional[str] = Field(None, description="口味偏好：清淡/适中/重口")
    cuisine_styles: Optional[List[str]] = Field(None, description="菜系偏好")
    allergens: Optional[List[str]] = Field(None, description="过敏原")
    forbidden_foods: Optional[List[str]] = Field(None, description="禁忌食材")
    cooking_skill: Optional[str] = Field(None, description="烹饪水平：新手/普通/擅长")
    meals_per_day: Optional[int] = Field(None, description="每日餐数", ge=1, le=6)


class ExercisePreferencesRequest(BaseModel):
    """运动偏好请求"""
    preferred_exercises: Optional[List[str]] = Field(None, description="喜欢的运动")
    disliked_exercises: Optional[List[str]] = Field(None, description="不喜欢的运动")
    exercise_frequency: Optional[int] = Field(None, description="每周运动次数", ge=0, le=7)
    exercise_duration: Optional[int] = Field(None, description="每次运动时长(分钟)", ge=10, le=180)
    preferred_intensity: Optional[str] = Field(None, description="偏好强度：light/moderate/vigorous")
    exercise_time_slots: Optional[List[str]] = Field(None, description="运动时段")
    has_gym_access: Optional[bool] = Field(None, description="是否有健身房")
    available_equipment: Optional[List[str]] = Field(None, description="可用器械")


class LifestylePreferencesRequest(BaseModel):
    """生活习惯请求"""
    sleep_time: Optional[str] = Field(None, description="入睡时间 HH:MM")
    wake_time: Optional[str] = Field(None, description="起床时间 HH:MM")
    work_style: Optional[str] = Field(None, description="工作类型：久坐办公/站立工作/体力劳动/混合")
    weekly_schedule: Optional[Dict[str, Any]] = Field(None, description="每周日程")
    stress_level: Optional[int] = Field(None, description="压力水平 1-5", ge=1, le=5)


class GoalPreferencesRequest(BaseModel):
    """健康目标请求"""
    primary_goal: Optional[str] = Field(None, description="主要目标：减重/增肌/保持健康/改善体质/康复训练")
    target_weight: Optional[float] = Field(None, description="目标体重(kg)")


class FullPreferencesRequest(BaseModel):
    """完整偏好设置请求"""
    # 饮食偏好
    taste_preference: Optional[str] = None
    cuisine_styles: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    forbidden_foods: Optional[List[str]] = None
    cooking_skill: Optional[str] = None
    meals_per_day: Optional[int] = None
    # 运动偏好
    preferred_exercises: Optional[List[str]] = None
    disliked_exercises: Optional[List[str]] = None
    exercise_frequency: Optional[int] = None
    exercise_duration: Optional[int] = None
    preferred_intensity: Optional[str] = None
    exercise_time_slots: Optional[List[str]] = None
    has_gym_access: Optional[bool] = None
    available_equipment: Optional[List[str]] = None
    # 生活习惯
    sleep_time: Optional[str] = None
    wake_time: Optional[str] = None
    work_style: Optional[str] = None
    weekly_schedule: Optional[Dict[str, Any]] = None
    stress_level: Optional[int] = None
    # 健康目标
    primary_goal: Optional[str] = None
    target_weight: Optional[float] = None


class PreferencesResponse(BaseModel):
    """偏好设置响应"""
    success: bool
    message: str
    data: Optional[Dict] = None


# ========== API 端点 ==========

@router.get("", response_model=PreferencesResponse)
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户的偏好设置
    
    如果用户还没有设置过偏好，返回默认值
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if preferences:
            return PreferencesResponse(
                success=True,
                message="获取偏好设置成功",
                data=preferences.to_dict()
            )
        else:
            # 返回默认值
            return PreferencesResponse(
                success=True,
                message="用户尚未设置偏好，返回默认值",
                data={
                    "user_id": current_user.id,
                    # 饮食偏好默认值
                    "taste_preference": "适中",
                    "cuisine_styles": ["中式"],
                    "allergens": [],
                    "forbidden_foods": [],
                    "cooking_skill": "普通",
                    "meals_per_day": 3,
                    # 运动偏好默认值
                    "preferred_exercises": [],
                    "disliked_exercises": [],
                    "exercise_frequency": 3,
                    "exercise_duration": 30,
                    "preferred_intensity": "moderate",
                    "exercise_time_slots": ["傍晚"],
                    "has_gym_access": False,
                    "available_equipment": [],
                    # 生活习惯默认值
                    "sleep_time": "23:00",
                    "wake_time": "07:00",
                    "work_style": "久坐办公",
                    "weekly_schedule": {},
                    "stress_level": 3,
                    # 健康目标默认值
                    "primary_goal": "保持健康",
                    "target_weight": None,
                    # 标记为未创建
                    "_is_default": True
                }
            )
    except Exception as e:
        logger.error(f"获取偏好设置失败: {e}")
        return PreferencesResponse(
            success=False,
            message=f"获取偏好设置失败: {str(e)}",
            data=None
        )


@router.post("", response_model=PreferencesResponse)
async def create_or_update_preferences(
    request: FullPreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建或更新用户偏好设置
    
    如果用户已有偏好设置，则更新；否则创建新记录
    只更新请求中包含的字段
    """
    try:
        # 查找现有记录
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            # 创建新记录
            preferences = UserPreferences(user_id=current_user.id)
            db.add(preferences)
        
        # 更新字段
        preferences.update_from_dict(request.dict(exclude_unset=True))
        
        db.commit()
        db.refresh(preferences)
        
        logger.info(f"用户 {current_user.id} 更新偏好设置成功")
        
        return PreferencesResponse(
            success=True,
            message="偏好设置保存成功",
            data=preferences.to_dict()
        )
        
    except Exception as e:
        logger.error(f"保存偏好设置失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"保存偏好设置失败: {str(e)}",
            data=None
        )


@router.patch("/diet", response_model=PreferencesResponse)
async def update_diet_preferences(
    request: DietPreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    仅更新饮食偏好
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            preferences = UserPreferences(user_id=current_user.id)
            db.add(preferences)
        
        # 只更新饮食相关字段
        data = request.dict(exclude_unset=True)
        preferences.update_from_dict(data)
        
        db.commit()
        db.refresh(preferences)
        
        return PreferencesResponse(
            success=True,
            message="饮食偏好更新成功",
            data=preferences.to_dict()
        )
        
    except Exception as e:
        logger.error(f"更新饮食偏好失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"更新饮食偏好失败: {str(e)}",
            data=None
        )


@router.patch("/exercise", response_model=PreferencesResponse)
async def update_exercise_preferences(
    request: ExercisePreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    仅更新运动偏好
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            preferences = UserPreferences(user_id=current_user.id)
            db.add(preferences)
        
        # 只更新运动相关字段
        data = request.dict(exclude_unset=True)
        preferences.update_from_dict(data)
        
        db.commit()
        db.refresh(preferences)
        
        return PreferencesResponse(
            success=True,
            message="运动偏好更新成功",
            data=preferences.to_dict()
        )
        
    except Exception as e:
        logger.error(f"更新运动偏好失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"更新运动偏好失败: {str(e)}",
            data=None
        )


@router.patch("/lifestyle", response_model=PreferencesResponse)
async def update_lifestyle_preferences(
    request: LifestylePreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    仅更新生活习惯
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            preferences = UserPreferences(user_id=current_user.id)
            db.add(preferences)
        
        # 只更新生活习惯相关字段
        data = request.dict(exclude_unset=True)
        preferences.update_from_dict(data)
        
        db.commit()
        db.refresh(preferences)
        
        return PreferencesResponse(
            success=True,
            message="生活习惯更新成功",
            data=preferences.to_dict()
        )
        
    except Exception as e:
        logger.error(f"更新生活习惯失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"更新生活习惯失败: {str(e)}",
            data=None
        )


@router.patch("/goals", response_model=PreferencesResponse)
async def update_goal_preferences(
    request: GoalPreferencesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    仅更新健康目标
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            preferences = UserPreferences(user_id=current_user.id)
            db.add(preferences)
        
        # 只更新目标相关字段
        data = request.dict(exclude_unset=True)
        preferences.update_from_dict(data)
        
        db.commit()
        db.refresh(preferences)
        
        return PreferencesResponse(
            success=True,
            message="健康目标更新成功",
            data=preferences.to_dict()
        )
        
    except Exception as e:
        logger.error(f"更新健康目标失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"更新健康目标失败: {str(e)}",
            data=None
        )


@router.delete("", response_model=PreferencesResponse)
async def reset_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    重置用户偏好设置（删除记录）
    """
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()
        
        if preferences:
            db.delete(preferences)
            db.commit()
            logger.info(f"用户 {current_user.id} 偏好设置已重置")
            return PreferencesResponse(
                success=True,
                message="偏好设置已重置",
                data=None
            )
        else:
            return PreferencesResponse(
                success=True,
                message="用户没有偏好设置记录",
                data=None
            )
        
    except Exception as e:
        logger.error(f"重置偏好设置失败: {e}")
        db.rollback()
        return PreferencesResponse(
            success=False,
            message=f"重置偏好设置失败: {str(e)}",
            data=None
        )


# ========== 辅助 API ==========

@router.get("/options/exercises")
async def get_exercise_options():
    """
    获取可选的运动列表（用于前端选择器）
    """
    from ..data.exercise_database import EXERCISE_DATABASE
    
    exercises = []
    for ex in EXERCISE_DATABASE:
        exercises.append({
            "id": ex.id,
            "name": ex.name,
            "category": ex.category.value,
            "intensity": ex.intensity.value
        })
    
    return {
        "success": True,
        "data": exercises
    }


@router.get("/options/foods")
async def get_food_options():
    """
    获取可选的食材列表（用于前端选择器）
    """
    from ..data.food_ingredients_data import CORE_FOODS_DATA
    
    foods = []
    for food in CORE_FOODS_DATA:
        foods.append({
            "id": food.id,
            "name": food.name,
            "category": food.category.value
        })
    
    return {
        "success": True,
        "data": foods
    }


@router.get("/options/allergens")
async def get_allergen_options():
    """
    获取常见过敏原列表
    """
    allergens = [
        "海鲜", "贝类", "鱼类", "虾蟹",
        "花生", "坚果", "芝麻",
        "牛奶", "乳制品", "鸡蛋",
        "小麦", "麸质", "大豆",
        "芒果", "菠萝", "桃子"
    ]
    return {
        "success": True,
        "data": allergens
    }


@router.get("/options/equipment")
async def get_equipment_options():
    """
    获取常见运动器械列表
    """
    equipment = [
        "哑铃", "杠铃", "瑜伽垫", "跳绳",
        "弹力带", "泡沫轴", "健身球",
        "跑步机", "动感单车", "椭圆机", "划船机",
        "引体向上杆", "TRX悬挂带", "壶铃"
    ]
    return {
        "success": True,
        "data": equipment
    }
