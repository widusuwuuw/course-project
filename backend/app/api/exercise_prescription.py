"""
运动处方API - 提供个性化运动处方服务
集成医学规则引擎和运动元数据库
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ..db import get_db
from ..auth import get_current_user
from ..models import User
from ..services.exercise_prescription_service import (
    exercise_prescription_service,
    UserMedicalProfile,
    ExercisePrescription,
    WeeklyPlan
)
from ..data.exercise_database import (
    get_all_exercises,
    get_exercises_by_category,
    search_exercises,
    ExerciseCategory,
    IntensityLevel
)

router = APIRouter(prefix="/exercise-prescription", tags=["运动处方"])

# Pydantic模型定义
class UserProfileInput(BaseModel):
    """用户档案输入"""
    age: int = Field(..., ge=1, le=120, description="年龄")
    gender: str = Field(..., pattern="^(男|女)$", description="性别")
    weight: float = Field(..., ge=20, le=300, description="体重(kg)")
    height: float = Field(..., ge=100, le=250, description="身高(cm)")
    medical_conditions: List[str] = Field(default_factory=list, description="医学状况")
    medications: List[str] = Field(default_factory=list, description="当前用药")
    allergies: List[str] = Field(default_factory=list, description="过敏史")
    fitness_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$", description="健康水平")
    previous_injuries: List[str] = Field(default_factory=list, description="既往伤病史")
    preferences: dict = Field(default_factory=dict, description="个人偏好")

class PrescriptionRequest(BaseModel):
    """运动处方请求"""
    user_profile: UserProfileInput
    goals: List[str] = Field(..., description="运动目标")
    available_days: List[str] = Field(default=["monday", "wednesday", "friday"], description="可用运动日")
    preferred_duration: int = Field(default=30, ge=10, le=120, description="偏好运动时长(分钟)")

class ExerciseInfo(BaseModel):
    """运动信息"""
    id: str
    name: str
    category: str
    met_value: float
    intensity: str
    duration: int
    calorie_burn: int
    medical_tags: dict
    requirements: dict
    details: dict

class PrescriptionResponse(BaseModel):
    """运动处方响应"""
    prescription_id: str
    user_id: int
    created_date: datetime
    valid_until: datetime
    weekly_plan: WeeklyPlan
    medical_constraints: List[str]
    safety_notes: List[str]
    total_weekly_duration: int
    estimated_weekly_calories: int
    goals_achieved: List[str]

@router.post("/generate", response_model=PrescriptionResponse)
async def generate_prescription(
    request: PrescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    生成个性化运动处方

    基于用户的医学状况、健康水平和目标，生成安全的个性化运动处方
    """
    try:
        # 转换用户档案
        user_profile = UserMedicalProfile(
            user_id=current_user.id,
            age=request.user_profile.age,
            gender=request.user_profile.gender,
            weight=request.user_profile.weight,
            height=request.user_profile.height,
            medical_conditions=request.user_profile.medical_conditions,
            medications=request.user_profile.medications,
            allergies=request.user_profile.allergies,
            fitness_level=request.user_profile.fitness_level,
            previous_injuries=request.user_profile.previous_injuries,
            preferences=request.user_profile.preferences
        )

        # 生成运动处方
        prescription = exercise_prescription_service.generate_weekly_prescription(
            user_profile=user_profile,
            goals=request.goals,
            available_days=request.available_days,
            preferred_duration=request.preferred_duration
        )

        return prescription

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成运动处方失败: {str(e)}"
        )

@router.get("/exercises", response_model=List[ExerciseInfo])
async def get_exercises(
    category: Optional[str] = None,
    intensity: Optional[str] = None,
    search: Optional[str] = None
):
    """
    获取运动资源列表

    - category: 运动类别过滤
    - intensity: 强度过滤
    - search: 关键词搜索
    """
    try:
        exercises = get_all_exercises()

        # 类别过滤
        if category:
            try:
                cat_enum = ExerciseCategory(category)
                exercises = [ex for ex in exercises if ex.category == cat_enum]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"无效的运动类别: {category}"
                )

        # 强度过滤
        if intensity:
            try:
                intensity_enum = IntensityLevel(intensity)
                exercises = [ex for ex in exercises if ex.intensity == intensity_enum]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"无效的强度等级: {intensity}"
                )

        # 关键词搜索
        if search:
            keywords = search.split()
            exercises = search_exercises(keywords)

        # 转换为响应模型
        exercise_infos = []
        for ex in exercises:
            exercise_info = ExerciseInfo(
                id=ex.id,
                name=ex.name,
                category=ex.category.value,
                met_value=ex.met_value,
                intensity=ex.intensity.value,
                duration=ex.duration,
                calorie_burn=ex.calorie_burn,
                medical_tags={
                    "contraindications": ex.medical_tags.contraindications,
                    "suitable_conditions": ex.medical_tags.suitable_conditions,
                    "monitoring_required": ex.medical_tags.monitoring_required,
                    "impact_level": ex.medical_tags.impact_level.value
                },
                requirements={
                    "equipment": ex.requirements.equipment,
                    "space_required": ex.requirements.space_required,
                    "difficulty_level": ex.requirements.difficulty_level.value,
                    "learning_curve": ex.requirements.learning_curve.value
                },
                details={
                    "description": ex.details.description,
                    "benefits": ex.details.benefits,
                    "proper_form": ex.details.proper_form,
                    "common_mistakes": ex.details.common_mistakes,
                    "modifications": {
                        "easier": ex.details.modifications.easier,
                        "harder": ex.details.modifications.harder
                    }
                }
            )
            exercise_infos.append(exercise_info)

        return exercise_infos

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取运动资源失败: {str(e)}"
        )

@router.get("/categories")
async def get_exercise_categories():
    """获取所有运动类别"""
    return {
        "categories": [
            {
                "value": cat.value,
                "label": cat.value,
                "description": f"{cat.value}相关运动"
            }
            for cat in ExerciseCategory
        ]
    }

@router.get("/medical-conditions")
async def get_medical_conditions():
    """获取支持的医学条件列表"""
    from ..services.exercise_prescription_service import MEDICAL_CONDITIONS_DATABASE

    conditions = {}
    for condition, info in MEDICAL_CONDITIONS_DATABASE.items():
        conditions[condition] = {
            "absolute_contraindications": info.get('absolute_contraindications', []),
            "recommended_activities": info.get('recommended_activities', []),
            "max_met_value": info.get('max_met_value'),
            "monitoring_required": info.get('monitoring_required', False),
            "precautions": info.get('precautions', [])
        }

    return conditions

@router.get("/prescription/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取指定的运动处方
    """
    # TODO: 实现处方的持久化存储和检索
    # 目前可以返回处方ID的基本信息
    return {
        "prescription_id": prescription_id,
        "user_id": current_user.id,
        "message": "处方详情功能正在开发中"
    }

@router.post("/adjust")
async def adjust_prescription(
    prescription_id: str,
    adjustment_feedback: str,
    target_days: List[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    基于用户反馈调整运动处方

    - prescription_id: 处方ID
    - adjustment_feedback: 用户反馈（自然语言）
    - target_days: 需要调整的日期（可选）
    """
    try:
        # TODO: 实现基于反馈的处方调整逻辑
        # 这里可以调用AI服务进行智能调整

        return {
            "status": "success",
            "message": "处方调整功能正在开发中",
            "feedback": adjustment_feedback,
            "target_days": target_days or []
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"调整处方失败: {str(e)}"
        )

@router.get("/safety-check")
async def safety_check(
    exercise_ids: List[str],
    user_conditions: List[str] = None
):
    """
    运动安全性检查

    - exercise_ids: 运动ID列表
    - user_conditions: 用户医学状况（可选）
    """
    try:
        exercises = get_all_exercises()
        safety_results = []

        for exercise_id in exercise_ids:
            exercise = next((ex for ex in exercises if ex.id == exercise_id), None)
            if not exercise:
                safety_results.append({
                    "exercise_id": exercise_id,
                    "status": "not_found",
                    "message": "运动不存在"
                })
                continue

            # 检查安全性
            is_safe = True
            warnings = []

            if user_conditions:
                for condition in user_conditions:
                    # 检查禁忌症
                    for contraindication in exercise.medical_tags.contraindications:
                        if contraindication.lower() in condition.lower():
                            is_safe = False
                            warnings.append(f"与{condition}存在禁忌: {contraindication}")

            safety_results.append({
                "exercise_id": exercise_id,
                "exercise_name": exercise.name,
                "status": "safe" if is_safe else "unsafe",
                "warnings": warnings,
                "monitoring_required": exercise.medical_tags.monitoring_required
            })

        return {
            "results": safety_results,
            "overall_safe": all(result["status"] == "safe" for result in safety_results)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"安全性检查失败: {str(e)}"
        )