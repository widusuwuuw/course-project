"""
运动处方服务 - 基于医学元数据的个性化运动处方生成
整合医学规则引擎，实现约束驱动的运动推荐
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging

from ..data.exercise_database import (
    ExerciseResource,
    ExerciseCategory,
    IntensityLevel,
    ImpactLevel,
    DifficultyLevel,
    MEDICAL_CONDITIONS_DATABASE,
    get_all_exercises,
    get_exercises_by_category,
    get_exercises_by_intensity,
    get_medical_condition_info
)
from ..models import User, HealthLog

logger = logging.getLogger(__name__)

class UserMedicalProfile(BaseModel):
    """用户医学档案"""
    user_id: int
    age: int
    gender: str
    weight: float  # kg
    height: float  # cm
    medical_conditions: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    fitness_level: str = "beginner"  # beginner, intermediate, advanced
    previous_injuries: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)

class WeeklyPlan(BaseModel):
    """周运动计划"""
    monday: Dict[str, Any] = Field(default_factory=dict)
    tuesday: Dict[str, Any] = Field(default_factory=dict)
    wednesday: Dict[str, Any] = Field(default_factory=dict)
    thursday: Dict[str, Any] = Field(default_factory=dict)
    friday: Dict[str, Any] = Field(default_factory=dict)
    saturday: Dict[str, Any] = Field(default_factory=dict)
    sunday: Dict[str, Any] = Field(default_factory=dict)

class DailyExerciseSession(BaseModel):
    """每日运动会话"""
    exercise_id: str
    exercise_name: str
    duration: int  # 分钟
    intensity: IntensityLevel
    sets: Optional[int] = None
    reps: Optional[int] = None
    rest_time: Optional[int] = None  # 休息时间（秒）
    modifications: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class ExercisePrescription(BaseModel):
    """运动处方"""
    prescription_id: str
    user_id: int
    created_date: datetime = Field(default_factory=datetime.now)
    valid_until: datetime
    weekly_plan: WeeklyPlan
    medical_constraints: List[str] = Field(default_factory=list)
    safety_notes: List[str] = Field(default_factory=list)
    goals_achieved: List[str] = Field(default_factory=list)
    total_weekly_duration: int  # 周总时长（分钟）
    estimated_weekly_calories: int  # 估算周卡路里消耗

class ExercisePrescriptionService:
    """运动处方服务主类"""

    def __init__(self):
        self.exercise_database = get_all_exercises()
        self.medical_conditions = MEDICAL_CONDITIONS_DATABASE

    def generate_weekly_prescription(
        self,
        user_profile: UserMedicalProfile,
        goals: List[str],
        available_days: List[str] = None,
        preferred_duration: int = 30
    ) -> ExercisePrescription:
        """
        生成个性化周运动处方

        Args:
            user_profile: 用户医学档案
            goals: 用户目标（如：减脂、增肌、健康改善等）
            available_days: 可用运动日（如：monday, wednesday, friday）
            preferred_duration: 偏好的单次运动时长（分钟）

        Returns:
            个性化运动处方
        """

        logger.info(f"为用户 {user_profile.user_id} 生成运动处方")

        # 第1步：医学约束过滤
        safe_exercises = self._filter_by_medical_constraints(user_profile)

        # 第2步：基于目标和适合度评分
        scored_exercises = self._score_exercises_for_user(safe_exercises, user_profile, goals)

        # 第3步：生成分日计划
        weekly_plan = self._create_weekly_plan(
            scored_exercises,
            user_profile,
            goals,
            available_days or ['monday', 'wednesday', 'friday'],
            preferred_duration
        )

        # 第4步：生成安全提醒
        safety_notes = self._generate_safety_notes(user_profile, weekly_plan)

        # 计算总时长和卡路里
        total_duration, total_calories = self._calculate_weekly_metrics(weekly_plan, user_profile)

        prescription_id = f"RX_{user_profile.user_id}_{datetime.now().strftime('%Y%m%d')}"

        return ExercisePrescription(
            prescription_id=prescription_id,
            user_id=user_profile.user_id,
            valid_until=datetime.now() + timedelta(days=90),
            weekly_plan=weekly_plan,
            medical_constraints=self._get_medical_constraints(user_profile),
            safety_notes=safety_notes,
            total_weekly_duration=total_duration,
            estimated_weekly_calories=total_calories
        )

    def _filter_by_medical_constraints(self, user_profile: UserMedicalProfile) -> List[ExerciseResource]:
        """基于医学约束过滤运动"""

        safe_exercises = []

        for exercise in self.exercise_database:
            is_safe = True
            reasons = []

            # 检查医学条件禁忌症
            for condition in user_profile.medical_conditions:
                condition_info = self.medical_conditions.get(condition)
                if condition_info:
                    absolute_contraindications = condition_info.get('absolute_contraindications', [])
                    for contraindication in absolute_contraindications:
                        if self._check_contraindication_match(exercise, contraindication):
                            is_safe = False
                            reasons.append(f"{condition}: {contraindication}")
                            break

            # 检查年龄相关约束
            if user_profile.age >= 65:
                high_impact_exercises = [ex for ex in [exercise] if ex.medical_tags.impact_level == ImpactLevel.HIGH]
                if high_impact_exercises:
                    is_safe = False
                    reasons.append("老年人避免高冲击运动")

            # 检查既往伤病史
            for injury in user_profile.previous_injuries:
                if self._check_injury_contraindication(exercise, injury):
                    is_safe = False
                    reasons.append(f"伤病史: {injury}")

            if is_safe:
                safe_exercises.append(exercise)
            else:
                logger.info(f"运动 {exercise.name} 被排除: {', '.join(reasons)}")

        return safe_exercises

    def _score_exercises_for_user(
        self,
        exercises: List[ExerciseResource],
        user_profile: UserMedicalProfile,
        goals: List[str]
    ) -> List[Tuple[ExerciseResource, float]]:
        """为用户评分运动资源"""

        scored_exercises = []

        for exercise in exercises:
            score = 0.0

            # 基础分数
            score += 10.0

            # 适合度加分
            suitable_bonus = self._calculate_suitability_bonus(exercise, user_profile, goals)
            score += suitable_bonus

            # 难度匹配
            difficulty_match = self._calculate_difficulty_match(exercise, user_profile)
            score += difficulty_match

            # 设备可用性
            equipment_bonus = self._calculate_equipment_bonus(exercise, user_profile)
            score += equipment_bonus

            scored_exercises.append((exercise, score))

        # 按分数排序
        return sorted(scored_exercises, key=lambda x: x[1], reverse=True)

    def _calculate_suitability_bonus(
        self,
        exercise: ExerciseResource,
        user_profile: UserMedicalProfile,
        goals: List[str]
    ) -> float:
        """计算适合度加分"""

        bonus = 0.0

        # 检查适合条件匹配
        for condition in user_profile.medical_conditions:
            condition_info = self.medical_conditions.get(condition)
            if condition_info:
                recommended = condition_info.get('recommended_activities', [])
                for rec_activity in recommended:
                    if rec_activity.lower() in exercise.name.lower() or \
                       exercise.category.value in rec_activity:
                        bonus += 15.0
                        break

        # 基于目标加分
        if '减脂' in goals and exercise.intensity in [IntensityLevel.MODERATE, IntensityLevel.VIGOROUS]:
            bonus += 10.0

        if '增肌' in goals and exercise.category == ExerciseCategory.STRENGTH:
            bonus += 10.0

        if '柔韧性' in goals and exercise.category == ExerciseCategory.FLEXIBILITY:
            bonus += 10.0

        if '平衡' in goals and exercise.category == ExerciseCategory.TRADITIONAL_CHINESE:
            bonus += 10.0

        return bonus

    def _calculate_difficulty_match(self, exercise: ExerciseResource, user_profile: UserMedicalProfile) -> float:
        """计算难度匹配分数"""

        fitness_level_map = {
            'beginner': DifficultyLevel.BEGINNER,
            'intermediate': DifficultyLevel.INTERMEDIATE,
            'advanced': DifficultyLevel.ADVANCED
        }

        user_level = fitness_level_map.get(user_profile.fitness_level, DifficultyLevel.BEGINNER)

        if exercise.requirements.difficulty_level == user_level:
            return 10.0
        elif abs(exercise.requirements.difficulty_level.value - user_level.value) == 1:
            return 5.0
        else:
            return -5.0

    def _calculate_equipment_bonus(self, exercise: ExerciseResource, user_profile: UserMedicalProfile) -> float:
        """计算设备可用性加分"""

        if not exercise.requirements.equipment:
            return 5.0  # 无设备运动加分

        # 假设用户有基础设备
        available_equipment = user_profile.preferences.get('available_equipment', ['瑜伽垫', '跑鞋'])

        if all(eq in available_equipment for eq in exercise.requirements.equipment):
            return 3.0
        else:
            return -2.0

    def _create_weekly_plan(
        self,
        scored_exercises: List[Tuple[ExerciseResource, float]],
        user_profile: UserMedicalProfile,
        goals: List[str],
        available_days: List[str],
        preferred_duration: int
    ) -> WeeklyPlan:
        """创建周运动计划"""

        weekly_plan = WeeklyPlan()

        # 选择前几项高分运动
        selected_exercises = [ex[0] for ex in scored_exercises[:8]]

        for i, day in enumerate(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
            if day not in available_days:
                continue

            # 选择当天的运动
            exercise = selected_exercises[i % len(selected_exercises)]

            # 创建运动会话
            session = self._create_daily_session(exercise, user_profile, preferred_duration, goals)

            weekly_plan.__setattr__(day, {
                'primary_exercise': session.dict(),
                'total_duration': session.duration,
                'estimated_calories': self._estimate_calories(session, user_profile)
            })

        return weekly_plan

    def _create_daily_session(
        self,
        exercise: ExerciseResource,
        user_profile: UserMedicalProfile,
        preferred_duration: int,
        goals: List[str]
    ) -> DailyExerciseSession:
        """创建每日运动会话"""

        # 调整时长
        actual_duration = min(preferred_duration, exercise.duration)

        # 确定组数和次数
        sets, reps = self._determine_sets_reps(exercise, user_profile, actual_duration)

        # 选择调整方式
        modifications = []
        if user_profile.fitness_level == 'beginner' and exercise.requirements.difficulty_level > 1:
            modifications = exercise.details.modifications.easier[:2]
        elif user_profile.fitness_level == 'advanced' and exercise.requirements.difficulty_level < 3:
            modifications = exercise.details.modifications.harder[:2]

        return DailyExerciseSession(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            duration=actual_duration,
            intensity=exercise.intensity,
            sets=sets,
            reps=reps,
            rest_time=self._determine_rest_time(exercise, user_profile),
            modifications=modifications,
            notes=f"基于{exercise.category.value}的个性化训练"
        )

    def _determine_sets_reps(
        self,
        exercise: ExerciseResource,
        user_profile: UserMedicalProfile,
        duration: int
    ) -> Tuple[Optional[int], Optional[int]]:
        """确定组数和次数"""

        if exercise.category == ExerciseCategory.STRENGTH:
            # 力量训练：组数x次数
            if user_profile.fitness_level == 'beginner':
                return 2, 10
            elif user_profile.fitness_level == 'intermediate':
                return 3, 12
            else:
                return 4, 15

        elif exercise.category in [ExerciseCategory.HIIT, ExerciseCategory.FUNCTIONAL]:
            # HIIT和功能性：重复次数
            rounds = max(1, duration // 2)  # 每2分钟一轮
            return rounds, None

        else:
            # 有氧和柔韧性：不需要组数次数
            return None, None

    def _determine_rest_time(self, exercise: ExerciseResource, user_profile: UserMedicalProfile) -> Optional[int]:
        """确定休息时间"""

        if exercise.category == ExerciseCategory.STRENGTH:
            if user_profile.fitness_level == 'beginner':
                return 90
            elif user_profile.fitness_level == 'intermediate':
                return 60
            else:
                return 45

        elif exercise.category == ExerciseCategory.HIIT:
            return 10  # Tabata风格

        else:
            return None

    def _generate_safety_notes(self, user_profile: UserMedicalProfile, weekly_plan: WeeklyPlan) -> List[str]:
        """生成安全提醒"""

        safety_notes = []

        # 通用安全提醒
        safety_notes.extend([
            "运动前进行5-10分钟热身",
            "运动后进行拉伸放松",
            "保持充足水分补充",
            "如有不适应立即停止运动"
        ])

        # 基于医学条件的特殊提醒
        for condition in user_profile.medical_conditions:
            condition_info = self.medical_conditions.get(condition)
            if condition_info:
                precautions = condition_info.get('precautions', [])
                safety_notes.extend(precautions)

        # 基于年龄的提醒
        if user_profile.age >= 65:
            safety_notes.extend([
                "注意预防跌倒",
                "避免过度疲劳",
                "建议有人陪伴运动"
            ])

        return list(set(safety_notes))  # 去重

    def _calculate_weekly_metrics(self, weekly_plan: WeeklyPlan, user_profile: UserMedicalProfile) -> Tuple[int, int]:
        """计算周总时长和卡路里"""

        total_duration = 0
        total_calories = 0

        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            day_plan = getattr(weekly_plan, day, {})
            if day_plan:
                total_duration += day_plan.get('total_duration', 0)
                total_calories += day_plan.get('estimated_calories', 0)

        return total_duration, total_calories

    def _estimate_calories(self, session: DailyExerciseSession, user_profile: UserMedicalProfile) -> int:
        """估算卡路里消耗"""

        # 找到对应的运动资源
        exercise = next((ex for ex in self.exercise_database if ex.id == session.exercise_id), None)
        if not exercise:
            return 0

        # 基础卡路里消耗（每小时）
        base_calories = exercise.calorie_burn

        # 根据体重调整（基础按70kg计算）
        weight_adjustment = user_profile.weight / 70.0

        # 根据时长调整
        duration_adjustment = session.duration / 60.0

        return int(base_calories * weight_adjustment * duration_adjustment)

    def _get_medical_constraints(self, user_profile: UserMedicalProfile) -> List[str]:
        """获取医学约束"""

        constraints = []

        for condition in user_profile.medical_conditions:
            condition_info = self.medical_conditions.get(condition)
            if condition_info:
                absolute_contraindications = condition_info.get('absolute_contraindications', [])
                constraints.extend(absolute_contraindications)

        return list(set(constraints))

    def _check_contraindication_match(self, exercise: ExerciseResource, contraindication: str) -> bool:
        """检查禁忌症匹配"""

        contraindication_lower = contraindication.lower()

        # 直接匹配运动名称
        if contraindication_lower in exercise.name.lower():
            return True

        # 匹配类别
        if contraindication_lower in exercise.category.value.lower():
            return True

        # 匹配冲击等级
        if '冲击' in contraindication_lower and exercise.medical_tags.impact_level.value == 'high':
            return True

        # 匹配强度
        if '高强度' in contraindication_lower and exercise.intensity.value == 'vigorous':
            return True

        return False

    def _check_injury_contraindication(self, exercise: ExerciseResource, injury: str) -> bool:
        """检查伤病史禁忌症"""

        injury_lower = injury.lower()

        # 关节相关伤病史
        if '膝' in injury_lower or '关节' in injury_lower:
            high_impact = exercise.medical_tags.impact_level == ImpactLevel.HIGH
            high_intensity = exercise.intensity == IntensityLevel.VIGOROUS
            return high_impact or high_intensity

        # 腰部相关伤病史
        if '腰' in injury_lower or '背' in injury_lower:
            # 需要弯腰或对腰部压力大的动作
            problematic_exercises = ['深蹲', '俯卧撑', '波比跳']
            return any(prob in exercise.name for prob in problematic_exercises)

        return False

# 全局服务实例
exercise_prescription_service = ExercisePrescriptionService()