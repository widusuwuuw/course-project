"""
周计划生成服务 - 基于月度计划+用户偏好生成具体执行计划

架构设计：
1. 读取月度计划（运动框架+饮食框架+医学约束）
2. 读取用户偏好（时间段、强度、禁忌等）
3. 读取用户健康档案（联动饮食限制）
4. 将运动分配到7天（考虑休息日、工作强度）
5. 将食材组合成每日三餐（考虑健康限制）
6. AI生成每日小贴士（可选）

流程：
月度计划 + 用户偏好 + 健康档案 → 运动分配算法 → 饮食分配算法 → AI润色 → 周计划
"""

import json
import logging
import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import asdict

from .deepseek_client import generate_answer, is_enabled as deepseek_enabled
from .health_diet_service import (
    analyze_health_profile, 
    filter_foods_by_health,
    get_diet_advice_for_user,
    should_use_low_gi,
    DietaryRestriction
)
from ..data.exercise_database import EXERCISE_DATABASE
from ..data.food_ingredients_data import CORE_FOODS_DATA

logger = logging.getLogger(__name__)

# 星期映射
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
WEEKDAY_NAMES = {
    "monday": "周一",
    "tuesday": "周二", 
    "wednesday": "周三",
    "thursday": "周四",
    "friday": "周五",
    "saturday": "周六",
    "sunday": "周日"
}

# 默认工作强度（如果用户没有设置）
DEFAULT_WEEKLY_SCHEDULE = {
    "monday": {"work_intensity": "medium", "available_time": 45},
    "tuesday": {"work_intensity": "medium", "available_time": 45},
    "wednesday": {"work_intensity": "medium", "available_time": 45},
    "thursday": {"work_intensity": "medium", "available_time": 45},
    "friday": {"work_intensity": "medium", "available_time": 45},
    "saturday": {"work_intensity": "low", "available_time": 90},
    "sunday": {"work_intensity": "low", "available_time": 90}
}


class WeeklyPlanGenerator:
    """周计划生成器"""
    
    def __init__(self):
        pass
    
    def generate_weekly_plan(
        self,
        monthly_plan: Dict,
        user_preferences: Optional[Dict] = None,
        week_number: int = 1,
        week_start_date: datetime = None,
        user_adjustments: Optional[Dict] = None,
        health_metrics: Optional[Dict] = None,
        user_gender: str = "male"
    ) -> Dict:
        """
        生成周计划
        
        Args:
            monthly_plan: 月度计划数据
            user_preferences: 用户偏好设置
            week_number: 当月第几周（1-5）
            week_start_date: 周一日期
            user_adjustments: 用户对某些天的微调请求
            health_metrics: 用户健康指标（用于个性化饮食）
            user_gender: 用户性别（male/female，用于健康指标阈值）
            
        Returns:
            Dict: 周计划数据
        """
        logger.info(f"开始生成第 {week_number} 周计划")
        
        # 分析健康档案，获取饮食限制
        dietary_restrictions = []
        if health_metrics:
            dietary_restrictions = analyze_health_profile(health_metrics, user_gender)
            if dietary_restrictions:
                restriction_names = [r.condition for r in dietary_restrictions]
                logger.info(f"检测到健康相关饮食限制: {restriction_names}")
        
        # 设置默认值
        if user_preferences is None:
            user_preferences = {}
        if week_start_date is None:
            # 计算本周一的日期
            today = datetime.now()
            week_start_date = today - timedelta(days=today.weekday())
        if user_adjustments is None:
            user_adjustments = {}
        
        # 1. 提取月度计划中的框架
        exercise_framework = monthly_plan.get("exercise_framework", {})
        diet_framework = monthly_plan.get("diet_framework", {})
        medical_constraints = monthly_plan.get("medical_constraints", {})
        weekly_themes = monthly_plan.get("weekly_themes", [])
        
        # 获取本周主题
        week_theme = ""
        if weekly_themes and len(weekly_themes) >= week_number:
            week_theme = weekly_themes[week_number - 1].get("theme", "")
        
        # 2. 获取用户的周日程安排
        weekly_schedule = user_preferences.get("weekly_schedule", {})
        if not weekly_schedule:
            weekly_schedule = DEFAULT_WEEKLY_SCHEDULE.copy()
        
        # 3. 生成7天计划
        daily_plans = {}
        
        for i, day in enumerate(WEEKDAYS):
            date = week_start_date + timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            # 获取当天的日程安排
            day_schedule = weekly_schedule.get(day, DEFAULT_WEEKLY_SCHEDULE.get(day, {}))
            work_intensity = day_schedule.get("work_intensity", "medium")
            available_time = day_schedule.get("available_time", 45)
            
            # 检查用户调整
            day_adjustment = user_adjustments.get(day, {})
            if day_adjustment.get("reduce_exercise"):
                available_time = min(available_time, 20)
            if day_adjustment.get("skip_exercise"):
                available_time = 0
            
            # 决定是否为休息日
            is_rest_day = self._should_be_rest_day(
                day, i, exercise_framework, user_preferences, available_time
            )
            
            # 生成当天运动计划（支持多时段多运动）
            exercises_plan = []
            exercise_plan = None  # 兼容旧版：保留单个exercise字段
            if not is_rest_day:
                exercises_plan = self._generate_day_exercises(
                    day=day,
                    exercise_framework=exercise_framework,
                    user_preferences=user_preferences,
                    available_time=available_time,
                    work_intensity=work_intensity,
                    medical_constraints=medical_constraints
                )
                # 兼容旧版：取第一个作为主运动
                if exercises_plan:
                    exercise_plan = exercises_plan[0]
            
            # 生成当天饮食计划（传入健康限制和运动计划）
            diet_plan = self._generate_day_diet(
                day=day,
                diet_framework=diet_framework,
                user_preferences=user_preferences,
                medical_constraints=medical_constraints,
                is_rest_day=is_rest_day,
                dietary_restrictions=dietary_restrictions,
                exercises_plan=exercises_plan  # 新增：传入当天运动计划
            )
            
            # 生成当天提示
            tips = self._generate_day_tips(
                day=day,
                is_rest_day=is_rest_day,
                work_intensity=work_intensity,
                exercise_plan=exercise_plan,
                day_adjustment=day_adjustment
            )
            
            daily_plans[day] = {
                "date": date_str,
                "day_name": WEEKDAY_NAMES[day],
                "is_rest_day": is_rest_day,
                "exercise": exercise_plan,  # 兼容旧版
                "exercises": exercises_plan,  # 新版：支持多个运动
                "diet": diet_plan,
                "tips": tips
            }
        
        # 4. 生成AI周计划总结（可选）
        ai_weekly_summary = self._generate_weekly_summary(
            week_number=week_number,
            week_theme=week_theme,
            daily_plans=daily_plans,
            user_preferences=user_preferences
        )
        
        return {
            "week_number": week_number,
            "week_start_date": week_start_date.strftime("%Y-%m-%d"),
            "week_end_date": (week_start_date + timedelta(days=6)).strftime("%Y-%m-%d"),
            "week_theme": week_theme,
            "daily_plans": daily_plans,
            "ai_weekly_summary": ai_weekly_summary,
            "user_adjustments": user_adjustments
        }
    
    def _should_be_rest_day(
        self,
        day: str,
        day_index: int,
        exercise_framework: Dict,
        user_preferences: Dict,
        available_time: int
    ) -> bool:
        """判断是否应该设为休息日"""
        
        # 如果可用时间太少，设为休息日
        if available_time < 15:
            return True
        
        # 获取用户期望的每周运动次数
        exercise_frequency = user_preferences.get("exercise_frequency", 
            exercise_framework.get("weekly_frequency", 4))
        
        # 计算需要多少休息日
        rest_days_needed = 7 - exercise_frequency
        
        # 从月度计划获取建议的休息日
        suggested_rest_days = exercise_framework.get("rest_days", ["sunday"])
        
        # 如果在建议的休息日列表中
        if day in suggested_rest_days:
            return True
        
        # 如果需要更多休息日，优先选择周三和周日
        if rest_days_needed >= 2 and day == "wednesday":
            return True
        
        return False
    
    def _generate_day_exercises(
        self,
        day: str,
        exercise_framework: Dict,
        user_preferences: Dict,
        available_time: int,
        work_intensity: str,
        medical_constraints: Dict
    ) -> List[Dict]:
        """
        生成当天运动计划 - 支持多时段多运动
        
        核心逻辑：
        1. 根据月度计划的运动及其best_time分配到不同时段
        2. 一天可以有多个时段的运动（早晨、下午、晚上）
        3. 严格使用月度计划的运动，不从数据库补充
        """
        # 【重要】严格从月度计划获取推荐运动列表
        selected_exercises = list(exercise_framework.get("selected_exercises", []))
        
        logger.info(f"[{day}] 月度计划推荐运动: {[ex.get('name', '') for ex in selected_exercises]}")
        
        if not selected_exercises:
            logger.warning("月度计划没有推荐运动，使用默认运动")
            default_ex = self._get_default_exercise(available_time, work_intensity)
            return [default_ex] if default_ex else []
        
        # 根据工作强度调整运动强度
        intensity_map = {
            "high": "light",
            "medium": "moderate",
            "low": "moderate"
        }
        target_intensity = intensity_map.get(work_intensity, "moderate")
        
        preferred_intensity = user_preferences.get("preferred_intensity", "moderate")
        if preferred_intensity == "light":
            target_intensity = "light"
        
        # 用户偏好
        preferred_exercises = user_preferences.get("preferred_exercises", []) or []
        disliked_exercises = user_preferences.get("disliked_exercises", []) or []
        
        # 构建周运动安排表（按时段分组，传入用户偏好）
        weekly_schedule = self._build_weekly_exercise_schedule_by_timeslot(selected_exercises, user_preferences)
        
        # 获取当天各时段的运动
        day_schedule = weekly_schedule.get(day, {})
        
        exercises_for_day = []
        time_slot_order = ["早晨", "下午", "晚上"]
        
        for time_slot in time_slot_order:
            slot_exercises = day_schedule.get(time_slot, [])
            
            for ex in slot_exercises:
                ex_name = ex.get("name", "")
                ex_id = ex.get("exercise_id", ex.get("id", ""))
                
                # 排除不喜欢的运动
                if ex_id in disliked_exercises or ex_name in disliked_exercises:
                    continue
                
                # 【修复】从运动元数据库获取真实数据
                db_exercise = self._get_exercise_from_database(ex_id)
                
                # 计算运动时长
                suggested_duration = ex.get("duration_minutes", ex.get("duration", 30))
                if db_exercise:
                    suggested_duration = db_exercise.duration
                actual_duration = min(suggested_duration, available_time)
                
                # 【修复】使用数据库中的真实MET值计算卡路里
                if db_exercise:
                    met = db_exercise.met_value
                    real_intensity = db_exercise.intensity.value
                else:
                    met = ex.get("met_value", 4.0)
                    real_intensity = ex.get("intensity", "moderate")
                
                calories = int(met * 70 * actual_duration / 60)
                
                # 生成替代方案
                alternatives = self._generate_alternatives(ex, selected_exercises)
                
                exercise_item = {
                    "exercise_id": ex_id,
                    "name": ex_name,
                    "duration": actual_duration,
                    "intensity": real_intensity,  # 【修复】使用运动本身的真实强度
                    "calories_target": calories,
                    "time_slot": time_slot,
                    "execution_guide": self._get_execution_guide(ex_id),
                    "alternatives": alternatives
                }
                
                exercises_for_day.append(exercise_item)
                logger.info(f"  [{day}] {time_slot}: {ex_name} ({actual_duration}分钟, {real_intensity}, {calories}kcal)")
        
        return exercises_for_day
    
    def _build_weekly_exercise_schedule_by_timeslot(self, exercises: List[Dict], user_preferences: Dict = None) -> Dict[str, Dict[str, List[Dict]]]:
        """
        根据运动频次和建议时段构建周运动安排表
        
        返回结构：
        {
            "monday": {"早晨": [ex1], "下午": [ex2], "晚上": []},
            "tuesday": {...},
            ...
        }
        
        分配算法：
        1. 按时段分组运动（优先考虑用户偏好时段）
        2. 每个时段的运动按频次分配到一周
        3. 同一时段的多个运动交错分配
        """
        if user_preferences is None:
            user_preferences = {}
            
        # 初始化
        schedule = {
            day: {"早晨": [], "下午": [], "晚上": []}
            for day in WEEKDAYS
        }
        
        # 按时段分组（优先使用用户偏好的时段）
        user_preferred_slots = user_preferences.get("exercise_time_slots", []) or []
        # 将用户偏好时段映射到内部时段名称
        slot_mapping = {
            "清晨": "早晨", "早晨": "早晨", "morning": "早晨",
            "上午": "早晨", "中午": "下午", "下午": "下午",
            "afternoon": "下午", "傍晚": "晚上", "晚上": "晚上",
            "evening": "晚上", "night": "晚上"
        }
        
        exercises_by_time = {"早晨": [], "下午": [], "晚上": []}
        
        for ex in exercises:
            best_time = ex.get("best_time", "下午")
            
            # 如果用户设置了偏好时段，优先考虑
            if user_preferred_slots:
                # 检查运动的最佳时段是否在用户偏好中
                ex_time_normalized = None
                for slot_key, slot_value in slot_mapping.items():
                    if slot_key in str(best_time):
                        ex_time_normalized = slot_value
                        break
                
                # 如果运动的时段不在用户偏好中，但用户有偏好，可以调整或跳过
                user_slots_normalized = [slot_mapping.get(s, s) for s in user_preferred_slots]
                if ex_time_normalized and ex_time_normalized not in user_slots_normalized:
                    # 尝试调整到用户偏好的时段
                    if user_slots_normalized:
                        best_time = user_slots_normalized[0]  # 使用第一个偏好时段
                        logger.info(f"调整运动 {ex.get('name')} 的时段到用户偏好: {best_time}")
            
            # 分配到对应时段
            if "早" in str(best_time) or "morning" in str(best_time).lower():
                exercises_by_time["早晨"].append(ex)
            elif "晚" in str(best_time) or "evening" in str(best_time).lower() or "night" in str(best_time).lower():
                exercises_by_time["晚上"].append(ex)
            else:
                exercises_by_time["下午"].append(ex)
        
        logger.info(f"按时段分组: 早晨{len(exercises_by_time['早晨'])}个, 下午{len(exercises_by_time['下午'])}个, 晚上{len(exercises_by_time['晚上'])}个")
        
        # 为每个时段分配运动到具体天数
        for time_slot, slot_exercises in exercises_by_time.items():
            if not slot_exercises:
                continue
            
            # 按频次排序（高频次优先）
            sorted_exercises = sorted(
                slot_exercises,
                key=lambda x: x.get("frequency_per_week", 1),
                reverse=True
            )
            
            for ex in sorted_exercises:
                frequency = ex.get("frequency_per_week", 1)
                ex_name = ex.get("name", "")
                
                if frequency <= 0:
                    continue
                
                # 计算分配的天数
                # 避开休息日（周三、周日），共5个运动日
                exercise_days = ["monday", "tuesday", "thursday", "friday", "saturday"]
                
                # 均匀分配
                interval = max(1, len(exercise_days) // frequency)
                
                # 根据时段选择起始偏移，避免同一天同一时段堆积
                if time_slot == "早晨":
                    start_offset = 0
                elif time_slot == "下午":
                    start_offset = 1
                else:  # 晚上
                    start_offset = 2
                
                assigned_days = []
                for i in range(frequency):
                    day_index = (start_offset + i * interval) % len(exercise_days)
                    day = exercise_days[day_index]
                    schedule[day][time_slot].append(ex)
                    assigned_days.append(day)
                
                logger.info(f"  {ex_name} ({frequency}次/周, {time_slot}) -> {assigned_days}")
        
        return schedule
    
    def _generate_day_exercise(
        self,
        day: str,
        exercise_framework: Dict,
        user_preferences: Dict,
        available_time: int,
        work_intensity: str,
        medical_constraints: Dict
    ) -> Dict:
        """生成当天运动计划 - 兼容旧版，返回单个运动"""
        exercises = self._generate_day_exercises(
            day, exercise_framework, user_preferences, 
            available_time, work_intensity, medical_constraints
        )
        return exercises[0] if exercises else self._get_default_exercise(available_time, work_intensity)
    
    def _supplement_exercises_from_database(
        self, 
        existing_exercises: List[Dict],
        medical_constraints: Dict,
        user_preferences: Dict
    ) -> List[Dict]:
        """从元数据库补充运动，确保多样性"""
        
        # 获取已有的运动ID和类别
        existing_ids = {ex.get("exercise_id", ex.get("id", "")) for ex in existing_exercises}
        existing_categories = {ex.get("category", "") for ex in existing_exercises}
        
        # 获取医学约束
        max_intensity = medical_constraints.get("max_intensity", "vigorous")
        forbidden_conditions = medical_constraints.get("forbidden_conditions", [])
        
        # 强度级别映射
        intensity_levels = {"light": 1, "moderate": 2, "vigorous": 3}
        max_intensity_level = intensity_levels.get(max_intensity, 3)
        
        # 用户偏好
        disliked = user_preferences.get("disliked_exercises", [])
        
        supplementary = []
        
        # 从元数据库筛选
        for exercise in EXERCISE_DATABASE:
            # 跳过已存在的
            if exercise.id in existing_ids:
                continue
            
            # 检查强度
            ex_intensity = exercise.intensity.value
            if intensity_levels.get(ex_intensity, 0) > max_intensity_level:
                continue
            
            # 检查禁忌症
            has_contraindication = False
            for forbidden in forbidden_conditions:
                for contra in exercise.medical_tags.contraindications:
                    if forbidden in contra or contra in forbidden:
                        has_contraindication = True
                        break
                if has_contraindication:
                    break
            
            if has_contraindication:
                continue
            
            # 检查用户不喜欢的
            if exercise.id in disliked or exercise.name in disliked:
                continue
            
            # 构建运动数据
            ex_dict = {
                "exercise_id": exercise.id,
                "name": exercise.name,
                "category": exercise.category.value,
                "met_value": exercise.met_value,
                "intensity": exercise.intensity.value,
                "duration_minutes": exercise.duration,
                "calorie_burn": exercise.calorie_burn,
                "frequency_per_week": 2
            }
            
            supplementary.append(ex_dict)
        
        # 合并：优先保留原有的，再补充新的
        result = list(existing_exercises)
        
        # 按类别补充，确保多样性
        categories_to_add = ["有氧运动", "力量训练", "柔韧性训练", "传统中式"]
        for category in categories_to_add:
            if category not in existing_categories:
                # 找到该类别的运动
                for ex in supplementary:
                    if ex.get("category") == category and ex not in result:
                        result.append(ex)
                        break
        
        # 如果还不够，继续补充
        for ex in supplementary:
            if len(result) >= 7:
                break
            if ex not in result:
                result.append(ex)
        
        return result
    
    def _categorize_exercises(self, exercises: List[Dict]) -> Dict[str, List[Dict]]:
        """按运动类型分组"""
        categorized = {
            "有氧运动": [],
            "力量训练": [],
            "柔韧性训练": [],
            "传统中式": [],
            "其他": []
        }
        
        for ex in exercises:
            category = ex.get("category", "其他")
            # 标准化类别名称
            if "有氧" in category or "AEROBIC" in category.upper():
                categorized["有氧运动"].append(ex)
            elif "力量" in category or "STRENGTH" in category.upper():
                categorized["力量训练"].append(ex)
            elif "柔韧" in category or "FLEXIBILITY" in category.upper():
                categorized["柔韧性训练"].append(ex)
            elif "中式" in category or "CHINESE" in category.upper() or "传统" in category:
                categorized["传统中式"].append(ex)
            else:
                categorized["其他"].append(ex)
        
        return categorized
    
    def _select_exercise_by_day(
        self, 
        day: str, 
        categorized: Dict[str, List[Dict]],
        user_preferences: Dict,
        preferred_exercises: List[str]
    ) -> Optional[Dict]:
        """
        根据月度计划的运动频次智能分配每天的运动
        
        核心逻辑：按照月度计划中每种运动的frequency_per_week来分配
        例如：八段锦2次/周 → 安排在周一、周四
              全身拉伸3次/周 → 安排在周二、周四、周六
        """
        # 合并所有类别的运动
        all_exercises = []
        for exercises in categorized.values():
            all_exercises.extend(exercises)
        
        if not all_exercises:
            return None
        
        # 构建运动分配表：根据每种运动的频次分配到具体天数
        exercise_schedule = self._build_weekly_exercise_schedule(all_exercises)
        
        # 获取今天应该做的运动
        day_exercises = exercise_schedule.get(day, [])
        
        if day_exercises:
            # 如果有指定的运动，优先选择用户喜欢的
            for ex in day_exercises:
                ex_id = ex.get("exercise_id", ex.get("id", ""))
                ex_name = ex.get("name", "")
                if ex_id in preferred_exercises or ex_name in preferred_exercises:
                    logger.info(f"{day}: 选择用户偏好运动 {ex_name}")
                    return ex
            
            # 否则返回第一个
            selected = day_exercises[0]
            logger.info(f"{day}: 选择运动 {selected.get('name', '')}")
            return selected
        
        # 如果当天没有分配运动，返回None（可能是休息日）
        return None
    
    def _build_weekly_exercise_schedule(self, exercises: List[Dict]) -> Dict[str, List[Dict]]:
        """
        根据运动频次构建周运动安排表
        
        算法：
        1. 按频次从高到低排序
        2. 均匀分配到一周中
        3. 避免连续两天做同一种运动
        """
        # 初始化每天的运动列表
        schedule = {day: [] for day in WEEKDAYS}
        
        # 按频次排序（高频次的先分配）
        sorted_exercises = sorted(
            exercises, 
            key=lambda x: x.get("frequency_per_week", 1), 
            reverse=True
        )
        
        logger.info(f"构建周运动安排表，共 {len(sorted_exercises)} 种运动:")
        for ex in sorted_exercises:
            logger.info(f"  - {ex.get('name')}: {ex.get('frequency_per_week', 1)}次/周, 建议时段: {ex.get('best_time', '任意')}")
        
        # 为每种运动分配天数
        for ex in sorted_exercises:
            frequency = ex.get("frequency_per_week", 1)
            ex_name = ex.get("name", "")
            
            # 计算间隔天数，尽量均匀分布
            if frequency >= 7:
                # 每天都做
                for day in WEEKDAYS:
                    schedule[day].append(ex)
            elif frequency > 0:
                # 计算最佳间隔
                interval = max(1, 7 // frequency)
                
                # 根据运动的建议时段选择起始天（使用 best_time 字段）
                best_time = ex.get("best_time", ex.get("best_time_slot", "任意"))
                if "早晨" in str(best_time) or "早" in str(best_time):
                    start_day = 0  # 周一
                elif "晚" in str(best_time):
                    start_day = 1  # 周二
                elif "下午" in str(best_time):
                    start_day = 2  # 周三
                else:
                    start_day = 3  # 周四（默认）
                
                # 分配运动日，确保均匀分布
                assigned_days = []
                for i in range(frequency):
                    day_index = (start_day + i * interval) % 7
                    day = WEEKDAYS[day_index]
                    schedule[day].append(ex)
                    assigned_days.append(day)
                
                logger.info(f"运动 {ex_name} ({frequency}次/周) 分配到: {assigned_days}")
        
        return schedule
    
    def _generate_alternatives(self, selected: Dict, all_exercises: List[Dict]) -> List[Dict]:
        """生成替代运动方案"""
        alternatives = []
        selected_id = selected.get("exercise_id", selected.get("id", ""))
        selected_category = selected.get("category", "")
        
        # 优先选择同类型的替代
        same_category = []
        different_category = []
        
        for ex in all_exercises:
            ex_id = ex.get("exercise_id", ex.get("id", ""))
            if ex_id == selected_id:
                continue
            
            if ex.get("category", "") == selected_category:
                same_category.append(ex)
            else:
                different_category.append(ex)
        
        # 添加1个同类型 + 1个不同类型
        if same_category:
            ex = same_category[0]
            alternatives.append({
                "exercise_id": ex.get("exercise_id", ex.get("id", "")),
                "name": ex.get("name", "")
            })
        
        if different_category and len(alternatives) < 2:
            ex = different_category[0]
            alternatives.append({
                "exercise_id": ex.get("exercise_id", ex.get("id", "")),
                "name": ex.get("name", "")
            })
        
        # 如果还不够，从同类型补充
        for ex in same_category[1:]:
            if len(alternatives) >= 2:
                break
            alternatives.append({
                "exercise_id": ex.get("exercise_id", ex.get("id", "")),
                "name": ex.get("name", "")
            })
        
        return alternatives
    
    def _get_default_exercise(self, available_time: int, work_intensity: str) -> Dict:
        """获取默认运动"""
        return {
            "exercise_id": "brisk_walking",
            "name": "快走",
            "duration": min(30, available_time),
            "intensity": "moderate" if work_intensity != "high" else "light",
            "calories_target": 150,
            "time_slot": "傍晚",
            "execution_guide": "保持每分钟100-120步的速度，自然摆臂",
            "alternatives": [
                {"exercise_id": "cycling", "name": "骑行"},
                {"exercise_id": "yoga", "name": "瑜伽"}
            ]
        }
    
    def _get_exercise_from_database(self, exercise_id: str):
        """
        从运动元数据库获取运动的真实数据
        
        Args:
            exercise_id: 运动ID
            
        Returns:
            ExerciseResource 或 None
        """
        for exercise in EXERCISE_DATABASE:
            if exercise.id == exercise_id:
                return exercise
        return None
    
    def _get_execution_guide(self, exercise_id: str) -> str:
        """获取运动执行指导"""
        guides = {
            # 有氧运动
            "walk_3mph": "保持每分钟100-120步的速度，自然摆臂，挺胸收腹",
            "brisk_walking": "保持每分钟100-120步的速度，自然摆臂，挺胸收腹",
            "jog_6mph": "控制配速在7-8分钟/公里，保持均匀呼吸",
            "jogging": "控制配速在7-8分钟/公里，保持均匀呼吸",
            "cycling": "调整座椅高度至腿部微弯，保持稳定踏频60-80rpm",
            "cycling_stationary": "调整座椅高度至腿部微弯，保持稳定踏频60-80rpm",
            "swimming": "注意呼吸节奏，游累了可以变换泳姿，保持节奏稳定",
            
            # 力量训练
            "squats_bodyweight": "双脚与肩同宽，下蹲时膝盖不超过脚尖，背部挺直",
            "strength_training": "注意动作标准，控制重量，宁轻勿假",
            "pushups": "身体保持一条直线，下降至胸部接近地面，匀速完成",
            "plank": "身体呈直线，核心收紧，避免塌腰或撅臀，均匀呼吸",
            "resistance_band": "控制动作速度，保持弹力带张力，配合呼吸",
            
            # 高强度间歇
            "hiit_tabata": "20秒全力运动+10秒休息，共8组，注意心率恢复",
            "hiit": "全力冲刺与休息交替，注意心率恢复",
            
            # 传统中式
            "baduanjin": "动作缓慢连贯，配合呼吸，意念集中于动作",
            "tai_chi": "动作缓慢流畅，重心稳定，呼吸自然",
            
            # 柔韧性训练
            "yoga_basic": "专注呼吸，动作缓慢，不必强求到位，量力而行",
            "yoga": "专注呼吸，动作不必强求到位，量力而行",
            "stretching_full": "每个动作保持15-30秒，感到轻微拉伸感即可，均匀呼吸",
            "stretching": "每个拉伸动作保持15-30秒，感到轻微拉伸感即可"
        }
        return guides.get(exercise_id, "按照标准动作执行，注意安全，如有不适立即停止")
    
    def _analyze_exercise_for_diet(self, exercises_plan: List[Dict]) -> Dict:
        """
        分析当天运动计划，为饮食调整提供依据
        
        返回：
        - total_calories: 总运动消耗
        - has_strength_training: 是否包含力量训练
        - is_high_intensity: 是否为高强度运动
        - primary_time_slot: 主要运动时段
        - exercise_types: 运动类型列表
        - post_exercise_tips: 运动后饮食建议
        """
        if not exercises_plan:
            return {
                "total_calories": 0,
                "has_strength_training": False,
                "is_high_intensity": False,
                "primary_time_slot": "",
                "exercise_types": [],
                "post_exercise_tips": []
            }
        
        total_calories = 0
        exercise_types = set()
        intensities = []
        time_slots = []
        
        # 力量训练关键词
        strength_keywords = ["力量", "strength", "resistance", "深蹲", "俯卧撑", "哑铃", "杠铃", "plank", "pushup", "squat"]
        # 高强度关键词
        high_intensity_keywords = ["hiit", "tabata", "高强度", "冲刺", "跑步", "jog", "run"]
        
        has_strength = False
        has_high_intensity = False
        
        for ex in exercises_plan:
            # 计算卡路里
            calories = ex.get("calories_target", 0)
            if not calories:
                # 根据时长和强度估算
                duration = ex.get("duration", 30)
                intensity = ex.get("intensity", "moderate")
                met_map = {"low": 3, "light": 3.5, "moderate": 5, "high": 7, "vigorous": 9}
                met = met_map.get(intensity, 5)
                calories = met * 65 * (duration / 60)  # 假设65kg体重
            total_calories += calories
            
            # 检查运动类型
            ex_name = ex.get("name", "").lower()
            ex_id = ex.get("exercise_id", "").lower()
            category = ex.get("category", "")
            
            exercise_types.add(category or "other")
            
            # 检查是否为力量训练
            if any(kw in ex_name or kw in ex_id for kw in strength_keywords):
                has_strength = True
            if category in ["resistance", "strength", "力量训练"]:
                has_strength = True
            
            # 检查是否为高强度
            intensity = ex.get("intensity", "moderate")
            intensities.append(intensity)
            if intensity in ["high", "vigorous"] or any(kw in ex_name or kw in ex_id for kw in high_intensity_keywords):
                has_high_intensity = True
            
            # 收集时段
            time_slot = ex.get("time_slot", "")
            if time_slot:
                time_slots.append(time_slot)
        
        # 确定主要时段（出现最多的）
        primary_time_slot = ""
        if time_slots:
            from collections import Counter
            primary_time_slot = Counter(time_slots).most_common(1)[0][0]
        
        # 生成运动后饮食建议
        post_tips = self._generate_post_exercise_tips(
            total_calories=total_calories,
            has_strength=has_strength,
            has_high_intensity=has_high_intensity,
            primary_time_slot=primary_time_slot
        )
        
        return {
            "total_calories": round(total_calories),
            "has_strength_training": has_strength,
            "is_high_intensity": has_high_intensity,
            "primary_time_slot": primary_time_slot,
            "exercise_types": list(exercise_types),
            "post_exercise_tips": post_tips
        }
    
    def _generate_post_exercise_tips(
        self, 
        total_calories: float,
        has_strength: bool,
        has_high_intensity: bool,
        primary_time_slot: str
    ) -> List[str]:
        """生成运动后饮食建议"""
        tips = []
        
        # 基础补水建议
        if total_calories > 0:
            tips.append("运动后30分钟内补充200-300ml水分")
        
        # 根据运动类型
        if has_strength:
            tips.append("力量训练后1小时内补充蛋白质，推荐鸡蛋、牛奶或鸡胸肉")
            tips.append("蛋白质与碳水比例建议1:2，帮助肌肉修复")
        
        if has_high_intensity:
            tips.append("高强度运动后补充快速吸收的碳水，如香蕉或全麦面包")
            tips.append("注意补充电解质，可适量饮用淡盐水")
        
        # 根据运动时段
        if "早" in primary_time_slot or primary_time_slot == "早晨":
            tips.append("晨练前可吃少量易消化食物，如香蕉或全麦饼干")
            tips.append("晨练后的正餐选择高蛋白+适量碳水的搭配")
        elif "晚" in primary_time_slot or primary_time_slot == "晚上":
            tips.append("晚间运动后避免大量进食，可选择清淡的蛋白质食物")
            tips.append("睡前2小时内不建议摄入高碳水食物")
        
        # 根据消耗量
        if total_calories >= 400:
            tips.append(f"今日运动消耗约{round(total_calories)}kcal，可适当增加一份加餐")
        elif total_calories >= 200:
            tips.append(f"今日运动消耗约{round(total_calories)}kcal，正常饮食即可满足恢复需求")
        
        return tips
    
    def _create_exercise_snacks(
        self,
        proteins: List,
        fruits: List,
        nuts: List,
        dairy: List,
        day_index: int,
        target_calories: int,
        exercise_analysis: Dict
    ) -> Dict:
        """
        创建运动相关的加餐
        根据运动类型推荐不同的加餐组合
        """
        foods = []
        total_cal = 0
        
        has_strength = exercise_analysis.get("has_strength_training", False)
        has_high_intensity = exercise_analysis.get("is_high_intensity", False)
        time_slot = exercise_analysis.get("primary_time_slot", "")
        
        # 力量训练后：优先蛋白质
        if has_strength:
            # 添加蛋白质类食物
            if dairy:
                item = dairy[day_index % len(dairy)]
                portion = 200  # 200ml/g
                cal = item["calories"] * portion / 100
                foods.append({
                    "food_id": item["food_id"],
                    "name": item["name"],
                    "portion": f"{portion}ml",
                    "calories": round(cal),
                    "protein": round(item["protein"] * portion / 100, 1),
                    "carbs": round(item["carbs"] * portion / 100, 1),
                    "fat": round(item["fat"] * portion / 100, 1),
                    "note": "运动后蛋白质补充"
                })
                total_cal += cal
            
            # 如果还有热量余量，添加碳水（蛋白质:碳水 = 1:2）
            if fruits and total_cal < target_calories * 0.7:
                item = fruits[(day_index + 1) % len(fruits)]
                portion = 150
                cal = item["calories"] * portion / 100
                foods.append({
                    "food_id": item["food_id"],
                    "name": item["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(item["protein"] * portion / 100, 1),
                    "carbs": round(item["carbs"] * portion / 100, 1),
                    "fat": round(item["fat"] * portion / 100, 1),
                    "note": "快速补充能量"
                })
                total_cal += cal
        
        # 高强度运动后：优先碳水
        elif has_high_intensity:
            # 水果（快速碳水）
            if fruits:
                item = fruits[day_index % len(fruits)]
                portion = 200
                cal = item["calories"] * portion / 100
                foods.append({
                    "food_id": item["food_id"],
                    "name": item["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(item["protein"] * portion / 100, 1),
                    "carbs": round(item["carbs"] * portion / 100, 1),
                    "fat": round(item["fat"] * portion / 100, 1),
                    "note": "快速补充糖原"
                })
                total_cal += cal
        
        # 普通加餐：坚果+水果
        else:
            if nuts:
                item = nuts[day_index % len(nuts)]
                portion = 20  # 坚果不宜多吃
                cal = item["calories"] * portion / 100
                foods.append({
                    "food_id": item["food_id"],
                    "name": item["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(item["protein"] * portion / 100, 1),
                    "carbs": round(item["carbs"] * portion / 100, 1),
                    "fat": round(item["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            if fruits and total_cal < target_calories * 0.8:
                item = fruits[(day_index + 2) % len(fruits)]
                portion = 100
                cal = item["calories"] * portion / 100
                foods.append({
                    "food_id": item["food_id"],
                    "name": item["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(item["protein"] * portion / 100, 1),
                    "carbs": round(item["carbs"] * portion / 100, 1),
                    "fat": round(item["fat"] * portion / 100, 1)
                })
                total_cal += cal
        
        # 计算加餐营养
        nutrition = {
            "calories": sum(f.get("calories", 0) for f in foods),
            "protein": sum(f.get("protein", 0) for f in foods),
            "carbs": sum(f.get("carbs", 0) for f in foods),
            "fat": sum(f.get("fat", 0) for f in foods)
        }
        
        return {
            "foods": foods,
            "calories": nutrition["calories"],
            "nutrition": nutrition,
            "timing": self._get_snack_timing(exercise_analysis),
            "note": "运动后加餐" if exercise_analysis.get("total_calories", 0) > 0 else "日常加餐"
        }
    
    def _get_snack_timing(self, exercise_analysis: Dict) -> str:
        """根据运动时段推荐加餐时间"""
        time_slot = exercise_analysis.get("primary_time_slot", "")
        
        if "早" in time_slot or time_slot == "早晨":
            return "上午10:00（晨练后1小时）"
        elif "下午" in time_slot:
            return "下午16:00（运动后30分钟）"
        elif "晚" in time_slot or time_slot == "晚上":
            return "晚上20:00（运动后30分钟，宜清淡）"
        else:
            return "下午15:00-16:00"

    def _generate_day_diet(
        self,
        day: str,
        diet_framework: Dict,
        user_preferences: Dict,
        medical_constraints: Dict,
        is_rest_day: bool,
        dietary_restrictions: List[DietaryRestriction] = None,
        exercises_plan: List[Dict] = None  # 新增：当天运动计划
    ) -> Dict:
        """
        生成当天饮食计划 - 从食材元数据库获取真实营养数据
        
        新增运动-饮食联动功能：
        1. 根据运动消耗调整热量目标
        2. 根据运动类型调整营养配比（力量训练增加蛋白质）
        3. 根据运动时段调整餐食分配（晨练调整早餐）
        4. 生成运动后饮食建议
        """
        
        if dietary_restrictions is None:
            dietary_restrictions = []
        
        if exercises_plan is None:
            exercises_plan = []
        
        # ========== 运动-饮食联动分析 ==========
        exercise_analysis = self._analyze_exercise_for_diet(exercises_plan)
        
        # 从月度计划获取推荐食材和禁忌
        recommended_foods = diet_framework.get("recommended_foods", [])
        foods_to_avoid = diet_framework.get("foods_to_avoid", [])
        
        # 用户禁忌
        user_forbidden = user_preferences.get("forbidden_foods", [])
        user_allergens = user_preferences.get("allergens", [])
        
        # 合并禁忌（包括月度计划、用户设置）
        all_forbidden = set(foods_to_avoid + user_forbidden + user_allergens)
        
        # 从健康限制中收集需要避免的食材
        health_foods_to_avoid = set()
        health_foods_to_prefer = set()
        health_advice_list = []
        
        for restriction in dietary_restrictions:
            health_foods_to_avoid.update(restriction.foods_to_avoid)
            health_foods_to_prefer.update(restriction.foods_to_prefer)
            if restriction.advice:
                health_advice_list.append(restriction.advice)
        
        # 从元数据库构建可用食材，按类别分组
        # 使用 filter_foods_by_health 来智能过滤和优先排序
        filtered_foods = filter_foods_by_health(CORE_FOODS_DATA, dietary_restrictions)
        
        recommended_ids = {f.get("food_id", f.get("id", "")) for f in recommended_foods}
        
        grains = []
        proteins = []
        vegetables = []
        fruits = []
        dairy = []
        nuts = []
        
        # 分类过滤后的食材
        for food in filtered_foods:
            # 跳过用户手动设置的禁忌
            if food.name in all_forbidden or food.id in all_forbidden:
                continue
                
            food_data = {
                "food_id": food.id,
                "name": food.name,
                "category": food.category.value,
                "calories": food.nutrients.calories,
                "protein": food.nutrients.protein,
                "carbs": food.nutrients.carbs,
                "fat": food.nutrients.fat,
                "fiber": food.nutrients.fiber,
                "gi_value": getattr(food, 'gi_value', None),
                "is_recommended": food.id in recommended_ids or food.name in [f.get("name") for f in recommended_foods],
                "is_health_preferred": food.name in health_foods_to_prefer
            }
            
            cat = food.category.value
            if cat == "谷物类":
                grains.append(food_data)
            elif cat == "蛋白质类":
                proteins.append(food_data)
            elif cat == "蔬菜类":
                vegetables.append(food_data)
            elif cat == "水果类":
                fruits.append(food_data)
            elif cat == "乳制品类":
                dairy.append(food_data)
            elif cat in ["坚果种子类", "豆制品类"]:
                nuts.append(food_data)
        
        # 优先排序：健康推荐 > 月度计划推荐 > 其他
        def sort_priority(x):
            if x.get("is_health_preferred"):
                return 0
            if x.get("is_recommended"):
                return 1
            return 2
        
        for lst in [grains, proteins, vegetables, fruits, dairy, nuts]:
            lst.sort(key=sort_priority)
        
        # 根据星期几轮换食材
        day_index = WEEKDAYS.index(day)
        
        # ========== 计算每日卡路里目标（考虑运动消耗）==========
        base_calories = 2000  # 基础代谢约2000
        if is_rest_day:
            base_calories -= 100  # 休息日少吃点
        
        # 【新增】根据运动消耗调整热量目标
        exercise_calories = exercise_analysis.get("total_calories", 0)
        if exercise_calories > 0:
            # 补充运动消耗的80%（维持体重），可根据用户目标调整
            calorie_adjustment = int(exercise_calories * 0.8)
            base_calories += calorie_adjustment
            logger.info(f"运动消耗 {exercise_calories}kcal，调整后热量目标：{base_calories}kcal (+{calorie_adjustment})")
        
        # 检查健康限制中是否有卡路里限制
        for restriction in dietary_restrictions:
            if restriction.nutrition_limits and "calories" in restriction.nutrition_limits:
                limit_cal = restriction.nutrition_limits["calories"]
                base_calories = min(base_calories, limit_cal)
                logger.info(f"根据{restriction.condition}限制，调整卡路里目标为 {base_calories}")
        
        # ========== 营养配比（根据运动类型调整）==========
        # 默认比例：蛋白质18% 碳水55% 脂肪27%
        protein_ratio = 0.18
        carbs_ratio = 0.55
        fat_ratio = 0.27
        
        # 【新增】力量训练日增加蛋白质比例
        if exercise_analysis.get("has_strength_training"):
            protein_ratio = 0.22  # 提高到22%
            carbs_ratio = 0.53
            fat_ratio = 0.25
            logger.info("力量训练日：提高蛋白质摄入比例至22%")
        
        # 【新增】高强度运动日增加碳水比例
        if exercise_analysis.get("is_high_intensity"):
            carbs_ratio += 0.03  # 碳水多3%
            fat_ratio -= 0.03
            logger.info("高强度运动日：增加碳水摄入比例")
        
        # ========== 餐食比例（根据运动时段调整）==========
        meal_structure = diet_framework.get("meal_structure", {
            "breakfast_ratio": 0.3,
            "lunch_ratio": 0.4,
            "dinner_ratio": 0.3
        })
        
        breakfast_ratio = meal_structure.get("breakfast_ratio", 0.3)
        lunch_ratio = meal_structure.get("lunch_ratio", 0.4)
        dinner_ratio = meal_structure.get("dinner_ratio", 0.3)
        snacks_ratio = 0.0
        
        # 【新增】根据运动时段调整餐食分配
        exercise_time_slot = exercise_analysis.get("primary_time_slot", "")
        
        if "早" in exercise_time_slot or exercise_time_slot == "早晨":
            # 晨练：早餐要轻便易消化，运动后加餐补充
            breakfast_ratio = 0.20  # 降低早餐（运动前轻食）
            snacks_ratio = 0.15     # 增加加餐（运动后补充）
            lunch_ratio = 0.35
            dinner_ratio = 0.30
            logger.info("晨练日：调整早餐比例，增加运动后加餐")
        elif "晚" in exercise_time_slot or exercise_time_slot == "晚上":
            # 晚间运动：晚餐要适量，运动后不宜大吃
            breakfast_ratio = 0.30
            lunch_ratio = 0.40
            dinner_ratio = 0.25     # 降低晚餐
            snacks_ratio = 0.05     # 少量加餐
            logger.info("晚间运动日：降低晚餐比例，避免运动后过饱")
        elif "下午" in exercise_time_slot:
            # 下午运动：午餐适量，运动后可加餐
            breakfast_ratio = 0.28
            lunch_ratio = 0.35
            snacks_ratio = 0.10     # 运动后加餐
            dinner_ratio = 0.27
            logger.info("下午运动日：调整午餐，增加运动后加餐")
        
        breakfast_cal = int(base_calories * breakfast_ratio)
        lunch_cal = int(base_calories * lunch_ratio)
        dinner_cal = int(base_calories * dinner_ratio)
        snacks_cal = int(base_calories * snacks_ratio) if snacks_ratio > 0 else 0
        
        # 生成每餐
        breakfast = self._create_meal(grains, proteins, dairy, fruits, nuts, "breakfast", day_index, breakfast_cal)
        lunch = self._create_meal(grains, proteins, vegetables, fruits, nuts, "lunch", day_index, lunch_cal)
        dinner = self._create_meal(grains, proteins, vegetables, fruits, nuts, "dinner", day_index, dinner_cal)
        
        # 【新增】根据是否有运动加餐需求生成加餐
        if snacks_cal > 0:
            snacks = self._create_exercise_snacks(
                proteins, fruits, nuts, dairy, 
                day_index, snacks_cal,
                exercise_analysis
            )
        else:
            snacks = self._create_snacks(fruits, nuts, day_index)
        
        # 计算每日总营养
        all_foods = breakfast["foods"] + lunch["foods"] + dinner["foods"] + snacks["foods"]
        daily_totals = {
            "calories": sum(f.get("calories", 0) for f in all_foods),
            "protein": sum(f.get("protein", 0) for f in all_foods),
            "carbs": sum(f.get("carbs", 0) for f in all_foods),
            "fat": sum(f.get("fat", 0) for f in all_foods),
            "fiber": sum(f.get("fiber", 0) for f in all_foods)
        }
        
        # 计算营养目标（使用动态配比，已根据运动类型调整）
        nutrition_targets = {
            "protein": round(base_calories * protein_ratio / 4),  # 蛋白质克数
            "carbs": round(base_calories * carbs_ratio / 4),      # 碳水克数
            "fat": round(base_calories * fat_ratio / 9),          # 脂肪克数
            "fiber": 25  # 推荐膳食纤维 25g/天
        }
        
        # 构建返回结果
        result = {
            "calories_target": base_calories,
            "nutrition_targets": nutrition_targets,
            "daily_totals": daily_totals,
            "breakfast": breakfast,
            "lunch": lunch,
            "dinner": dinner,
            "snacks": snacks,
            "hydration_goal": diet_framework.get("hydration_goal", "2000ml"),
            # 【新增】运动-饮食联动信息
            "exercise_diet_link": {
                "exercise_calories": exercise_analysis.get("total_calories", 0),
                "calorie_adjustment": int(exercise_analysis.get("total_calories", 0) * 0.8),
                "has_strength_training": exercise_analysis.get("has_strength_training", False),
                "is_high_intensity": exercise_analysis.get("is_high_intensity", False),
                "primary_time_slot": exercise_analysis.get("primary_time_slot", ""),
                "post_exercise_tips": exercise_analysis.get("post_exercise_tips", [])
            }
        }
        
        # 添加健康饮食建议（如果有）
        if health_advice_list:
            result["health_advice"] = health_advice_list
            result["dietary_restrictions"] = [r.condition for r in dietary_restrictions]
        
        return result
    
    def _create_meal(
        self,
        grains: List,
        proteins: List,
        side_foods: List,  # 蔬菜或乳制品
        fruits: List,
        nuts: List,
        meal_type: str,
        day_index: int,
        target_calories: int
    ) -> Dict:
        """创建一餐，包含食材和营养数据"""
        foods = []
        total_cal = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_fiber = 0
        
        # 早餐：谷物 + 蛋白质 + 乳制品 + 水果
        if meal_type == "breakfast":
            # 选谷物（轮换）
            if grains:
                grain = grains[day_index % len(grains)]
                portion = 80  # 80g
                cal = grain["calories"] * portion / 100
                foods.append({
                    "food_id": grain["food_id"],
                    "name": grain["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(grain["protein"] * portion / 100, 1),
                    "carbs": round(grain["carbs"] * portion / 100, 1),
                    "fat": round(grain["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 选蛋白质（鸡蛋轮换其他）
            if proteins:
                protein = proteins[(day_index + 1) % len(proteins)]
                portion = 50 if "蛋" in protein["name"] else 60
                cal = protein["calories"] * portion / 100
                foods.append({
                    "food_id": protein["food_id"],
                    "name": protein["name"],
                    "portion": f"{portion}g" if "蛋" not in protein["name"] else "1个",
                    "calories": round(cal),
                    "protein": round(protein["protein"] * portion / 100, 1),
                    "carbs": round(protein["carbs"] * portion / 100, 1),
                    "fat": round(protein["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 乳制品
            if side_foods:  # dairy
                dairy_item = side_foods[day_index % len(side_foods)]
                portion = 200  # 200ml/g
                cal = dairy_item["calories"] * portion / 100
                foods.append({
                    "food_id": dairy_item["food_id"],
                    "name": dairy_item["name"],
                    "portion": "200ml",
                    "calories": round(cal),
                    "protein": round(dairy_item["protein"] * portion / 100, 1),
                    "carbs": round(dairy_item["carbs"] * portion / 100, 1),
                    "fat": round(dairy_item["fat"] * portion / 100, 1)
                })
                total_cal += cal
        
        # 午餐：谷物 + 蛋白质 + 蔬菜 × 2
        elif meal_type == "lunch":
            # 主食
            if grains:
                grain = grains[(day_index + 2) % len(grains)]
                portion = 150
                cal = grain["calories"] * portion / 100
                foods.append({
                    "food_id": grain["food_id"],
                    "name": grain["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(grain["protein"] * portion / 100, 1),
                    "carbs": round(grain["carbs"] * portion / 100, 1),
                    "fat": round(grain["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 蛋白质（肉/鱼）
            if proteins:
                protein = proteins[day_index % len(proteins)]
                portion = 120
                cal = protein["calories"] * portion / 100
                foods.append({
                    "food_id": protein["food_id"],
                    "name": protein["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(protein["protein"] * portion / 100, 1),
                    "carbs": round(protein["carbs"] * portion / 100, 1),
                    "fat": round(protein["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 蔬菜1
            if side_foods:  # vegetables
                veg1 = side_foods[day_index % len(side_foods)]
                portion = 150
                cal = veg1["calories"] * portion / 100
                foods.append({
                    "food_id": veg1["food_id"],
                    "name": veg1["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(veg1["protein"] * portion / 100, 1),
                    "carbs": round(veg1["carbs"] * portion / 100, 1),
                    "fat": round(veg1["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 蔬菜2
            if len(side_foods) > 1:
                veg2 = side_foods[(day_index + 3) % len(side_foods)]
                portion = 100
                cal = veg2["calories"] * portion / 100
                foods.append({
                    "food_id": veg2["food_id"],
                    "name": veg2["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(veg2["protein"] * portion / 100, 1),
                    "carbs": round(veg2["carbs"] * portion / 100, 1),
                    "fat": round(veg2["fat"] * portion / 100, 1)
                })
                total_cal += cal
        
        # 晚餐：谷物（少量）+ 蛋白质 + 蔬菜 × 2
        elif meal_type == "dinner":
            # 主食（减量）
            if grains:
                grain = grains[(day_index + 4) % len(grains)]
                portion = 100
                cal = grain["calories"] * portion / 100
                foods.append({
                    "food_id": grain["food_id"],
                    "name": grain["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(grain["protein"] * portion / 100, 1),
                    "carbs": round(grain["carbs"] * portion / 100, 1),
                    "fat": round(grain["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 蛋白质（与午餐不同）
            if proteins:
                protein = proteins[(day_index + 2) % len(proteins)]
                portion = 100
                cal = protein["calories"] * portion / 100
                foods.append({
                    "food_id": protein["food_id"],
                    "name": protein["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(protein["protein"] * portion / 100, 1),
                    "carbs": round(protein["carbs"] * portion / 100, 1),
                    "fat": round(protein["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            # 蔬菜（与午餐不同）
            if side_foods:
                veg1 = side_foods[(day_index + 1) % len(side_foods)]
                portion = 150
                cal = veg1["calories"] * portion / 100
                foods.append({
                    "food_id": veg1["food_id"],
                    "name": veg1["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(veg1["protein"] * portion / 100, 1),
                    "carbs": round(veg1["carbs"] * portion / 100, 1),
                    "fat": round(veg1["fat"] * portion / 100, 1)
                })
                total_cal += cal
            
            if len(side_foods) > 2:
                veg2 = side_foods[(day_index + 5) % len(side_foods)]
                portion = 100
                cal = veg2["calories"] * portion / 100
                foods.append({
                    "food_id": veg2["food_id"],
                    "name": veg2["name"],
                    "portion": f"{portion}g",
                    "calories": round(cal),
                    "protein": round(veg2["protein"] * portion / 100, 1),
                    "carbs": round(veg2["carbs"] * portion / 100, 1),
                    "fat": round(veg2["fat"] * portion / 100, 1)
                })
                total_cal += cal
        
        # 计算总营养
        meal_totals = {
            "calories": sum(f.get("calories", 0) for f in foods),
            "protein": round(sum(f.get("protein", 0) for f in foods), 1),
            "carbs": round(sum(f.get("carbs", 0) for f in foods), 1),
            "fat": round(sum(f.get("fat", 0) for f in foods), 1)
        }
        
        return {
            "foods": foods,
            "calories": meal_totals["calories"],
            "nutrition": meal_totals
        }
    
    def _create_snacks(self, fruits: List, nuts: List, day_index: int) -> Dict:
        """创建加餐/零食"""
        foods = []
        
        # 水果
        if fruits:
            fruit = fruits[day_index % len(fruits)]
            portion = 150  # 约一个中等水果
            cal = fruit["calories"] * portion / 100
            foods.append({
                "food_id": fruit["food_id"],
                "name": fruit["name"],
                "portion": "1个",
                "calories": round(cal),
                "protein": round(fruit["protein"] * portion / 100, 1),
                "carbs": round(fruit["carbs"] * portion / 100, 1),
                "fat": round(fruit["fat"] * portion / 100, 1)
            })
        
        # 坚果
        if nuts:
            nut = nuts[(day_index + 1) % len(nuts)]
            portion = 20  # 一小把约20g
            cal = nut["calories"] * portion / 100
            foods.append({
                "food_id": nut["food_id"],
                "name": nut["name"],
                "portion": "一小把(20g)",
                "calories": round(cal),
                "protein": round(nut["protein"] * portion / 100, 1),
                "carbs": round(nut["carbs"] * portion / 100, 1),
                "fat": round(nut["fat"] * portion / 100, 1)
            })
        
        meal_totals = {
            "calories": sum(f.get("calories", 0) for f in foods),
            "protein": round(sum(f.get("protein", 0) for f in foods), 1),
            "carbs": round(sum(f.get("carbs", 0) for f in foods), 1),
            "fat": round(sum(f.get("fat", 0) for f in foods), 1)
        }
        
        return {
            "foods": foods,
            "calories": meal_totals["calories"],
            "nutrition": meal_totals
        }
    
    def _generate_day_tips(
        self,
        day: str,
        is_rest_day: bool,
        work_intensity: str,
        exercise_plan: Optional[Dict],
        day_adjustment: Dict
    ) -> str:
        """生成当天小贴士"""
        tips = []
        
        if is_rest_day:
            tips.append("今天是休息日，让身体充分恢复")
            tips.append("可以做些轻度拉伸或散步")
        else:
            if work_intensity == "high":
                tips.append("今天工作强度较高，运动安排已适当减轻")
            if exercise_plan:
                tips.append(f"建议{exercise_plan.get('time_slot', '傍晚')}进行{exercise_plan.get('name', '运动')}")
        
        if day_adjustment.get("reduce_exercise"):
            tips.append(f"根据您的调整，已减少今日运动量")
        
        # 根据星期几添加特定提示
        if day == "monday":
            tips.append("新的一周开始，保持积极心态！")
        elif day == "wednesday":
            tips.append("周中了，坚持就是胜利！")
        elif day == "friday":
            tips.append("周末将至，继续保持健康习惯")
        elif day in ["saturday", "sunday"]:
            tips.append("周末可以适当放松，但别忘了健康饮食")
        
        return "；".join(tips) if tips else "保持健康的生活方式，加油！"
    
    def _generate_weekly_summary(
        self,
        week_number: int,
        week_theme: str,
        daily_plans: Dict,
        user_preferences: Dict
    ) -> str:
        """生成周计划总结 - 使用AI生成个性化建议"""
        
        # 统计本周运动情况
        exercise_days = sum(1 for day in daily_plans.values() if not day.get("is_rest_day"))
        rest_days = 7 - exercise_days
        
        total_exercise_time = sum(
            day.get("exercise", {}).get("duration", 0) 
            for day in daily_plans.values() 
            if day.get("exercise")
        )
        
        total_calories_burn = sum(
            day.get("exercise", {}).get("calories_target", 0)
            for day in daily_plans.values()
            if day.get("exercise")
        )
        
        # 收集本周运动种类
        exercise_names = []
        for day_name, day_plan in daily_plans.items():
            if day_plan.get("exercise") and not day_plan.get("is_rest_day"):
                exercise_names.append(f"{WEEKDAY_NAMES.get(day_name, day_name)}: {day_plan['exercise'].get('name', '运动')}")
        
        # 尝试使用AI生成个性化总结
        if deepseek_enabled():
            try:
                logger.info("使用DeepSeek AI生成周计划总结...")
                
                goal = user_preferences.get("primary_goal", "保持健康")
                
                prompt = f"""你是一位专业的健身教练和营养师。请根据以下用户的周运动计划，生成一段简短但富有激励性的周计划总结（100-150字）。

用户目标：{goal}
本周主题：{week_theme or '健康生活'}
运动安排：{exercise_days}天运动、{rest_days}天休息
总运动时长：{total_exercise_time}分钟
预计消耗：{total_calories_burn}千卡
具体安排：
{chr(10).join(exercise_names)}

要求：
1. 语气亲切、专业、有激励性
2. 针对用户目标给出具体建议
3. 提及本周的运动亮点和注意事项
4. 不要使用markdown格式，直接输出纯文本"""

                system_prompt = "你是一位专业的健身教练，善于用简洁有力的语言激励用户坚持运动。"
                
                ai_summary = generate_answer(prompt, system_prompt)
                logger.info(f"AI生成周总结成功: {ai_summary[:50]}...")
                return ai_summary
                
            except Exception as e:
                logger.warning(f"AI生成周总结失败，使用默认模板: {e}")
        
        # 降级：使用模板生成简短总结
        summary_parts = []
        
        if week_theme:
            summary_parts.append(f"本周主题：{week_theme}")
        
        summary_parts.append(f"本周安排{exercise_days}天运动、{rest_days}天休息")
        summary_parts.append(f"预计运动总时长{total_exercise_time}分钟")
        summary_parts.append(f"预计消耗{total_calories_burn}千卡")
        
        goal = user_preferences.get("primary_goal", "保持健康")
        if goal == "减重":
            summary_parts.append("配合低卡饮食，助您达成减重目标")
        elif goal == "增肌":
            summary_parts.append("注意蛋白质摄入，促进肌肉生长")
        else:
            summary_parts.append("均衡饮食，保持健康状态")
        
        return "。".join(summary_parts) + "。"


# 创建单例
weekly_plan_generator = WeeklyPlanGenerator()


def generate_weekly_plan(
    monthly_plan: Dict,
    user_preferences: Optional[Dict] = None,
    week_number: int = 1,
    week_start_date: datetime = None,
    user_adjustments: Optional[Dict] = None,
    health_metrics: Optional[Dict] = None,
    user_gender: str = "male"
) -> Dict:
    """
    生成周计划的便捷函数
    
    Args:
        monthly_plan: 月度计划数据
        user_preferences: 用户偏好设置
        week_number: 当月第几周（1-5）
        week_start_date: 周一日期
        user_adjustments: 用户对某些天的微调请求
        health_metrics: 用户健康指标（用于个性化饮食）
        user_gender: 用户性别（male/female）
    """
    return weekly_plan_generator.generate_weekly_plan(
        monthly_plan=monthly_plan,
        user_preferences=user_preferences,
        week_number=week_number,
        week_start_date=week_start_date,
        user_adjustments=user_adjustments,
        health_metrics=health_metrics,
        user_gender=user_gender
    )
