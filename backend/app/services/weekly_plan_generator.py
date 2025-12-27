"""
周计划生成服务 - 基于月度计划+用户偏好生成具体执行计划

架构设计：
1. 读取月度计划（运动框架+饮食框架+医学约束）
2. 读取用户偏好（时间段、强度、禁忌等）
3. 将运动分配到7天（考虑休息日、工作强度）
4. 将食材组合成每日三餐
5. AI生成每日小贴士（可选）

流程：
月度计划 + 用户偏好 → 运动分配算法 → 饮食分配算法 → AI润色 → 周计划
"""

import json
import logging
import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import asdict

from .deepseek_client import generate_answer, is_enabled as deepseek_enabled
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
        user_adjustments: Optional[Dict] = None
    ) -> Dict:
        """
        生成周计划
        
        Args:
            monthly_plan: 月度计划数据
            user_preferences: 用户偏好设置
            week_number: 当月第几周（1-5）
            week_start_date: 周一日期
            user_adjustments: 用户对某些天的微调请求
            
        Returns:
            Dict: 周计划数据
        """
        logger.info(f"开始生成第 {week_number} 周计划")
        
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
            
            # 生成当天饮食计划
            diet_plan = self._generate_day_diet(
                day=day,
                diet_framework=diet_framework,
                user_preferences=user_preferences,
                medical_constraints=medical_constraints,
                is_rest_day=is_rest_day
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
        
        # 构建周运动安排表（按时段分组）
        weekly_schedule = self._build_weekly_exercise_schedule_by_timeslot(selected_exercises)
        
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
                
                # 计算运动时长
                suggested_duration = ex.get("duration_minutes", ex.get("duration", 30))
                actual_duration = min(suggested_duration, available_time)
                
                # 计算卡路里
                met = ex.get("met_value", 4.0)
                calories = int(met * 70 * actual_duration / 60)
                
                # 生成替代方案
                alternatives = self._generate_alternatives(ex, selected_exercises)
                
                exercise_item = {
                    "exercise_id": ex_id,
                    "name": ex_name,
                    "duration": actual_duration,
                    "intensity": target_intensity,
                    "calories_target": calories,
                    "time_slot": time_slot,
                    "execution_guide": self._get_execution_guide(ex_id),
                    "alternatives": alternatives
                }
                
                exercises_for_day.append(exercise_item)
                logger.info(f"  [{day}] {time_slot}: {ex_name} ({actual_duration}分钟)")
        
        return exercises_for_day
    
    def _build_weekly_exercise_schedule_by_timeslot(self, exercises: List[Dict]) -> Dict[str, Dict[str, List[Dict]]]:
        """
        根据运动频次和建议时段构建周运动安排表
        
        返回结构：
        {
            "monday": {"早晨": [ex1], "下午": [ex2], "晚上": []},
            "tuesday": {...},
            ...
        }
        
        分配算法：
        1. 按时段分组运动
        2. 每个时段的运动按频次分配到一周
        3. 同一时段的多个运动交错分配
        """
        # 初始化
        schedule = {
            day: {"早晨": [], "下午": [], "晚上": []}
            for day in WEEKDAYS
        }
        
        # 按时段分组
        exercises_by_time = {"早晨": [], "下午": [], "晚上": []}
        
        for ex in exercises:
            best_time = ex.get("best_time", "下午")
            if "早" in str(best_time):
                exercises_by_time["早晨"].append(ex)
            elif "晚" in str(best_time):
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
    
    def _generate_day_diet(
        self,
        day: str,
        diet_framework: Dict,
        user_preferences: Dict,
        medical_constraints: Dict,
        is_rest_day: bool
    ) -> Dict:
        """生成当天饮食计划"""
        
        # 从月度计划获取推荐食材
        recommended_foods = diet_framework.get("recommended_foods", [])
        foods_to_avoid = diet_framework.get("foods_to_avoid", [])
        principles = diet_framework.get("principles", [])
        
        # 用户禁忌
        user_forbidden = user_preferences.get("forbidden_foods", [])
        user_allergens = user_preferences.get("allergens", [])
        
        # 合并禁忌
        all_forbidden = set(foods_to_avoid + user_forbidden + user_allergens)
        
        # 过滤可用食材
        available_foods = []
        for food in recommended_foods:
            food_name = food.get("name", "")
            food_id = food.get("food_id", food.get("id", ""))
            if food_name not in all_forbidden and food_id not in all_forbidden:
                available_foods.append(food)
        
        # 如果没有推荐食材，使用默认
        if not available_foods:
            available_foods = self._get_default_foods()
        
        # 按类别分组
        grains = [f for f in available_foods if f.get("category") in ["grains", "谷物", "主食"]]
        proteins = [f for f in available_foods if f.get("category") in ["protein", "proteins", "蛋白质", "肉类"]]
        vegetables = [f for f in available_foods if f.get("category") in ["vegetables", "蔬菜"]]
        fruits = [f for f in available_foods if f.get("category") in ["fruits", "水果"]]
        
        # 如果分类不足，补充默认
        if not grains:
            grains = [{"food_id": "brown_rice", "name": "糙米", "category": "grains"}]
        if not proteins:
            proteins = [{"food_id": "chicken_breast", "name": "鸡胸肉", "category": "protein"}]
        if not vegetables:
            vegetables = [{"food_id": "broccoli", "name": "西兰花", "category": "vegetables"}]
        
        # 根据星期几轮换食材
        day_index = WEEKDAYS.index(day)
        
        # 计算每日卡路里目标
        base_calories = 1800  # 基础代谢
        if not is_rest_day:
            base_calories += 200  # 运动日增加
        
        # 餐食比例
        meal_structure = diet_framework.get("meal_structure", {
            "breakfast_ratio": 0.3,
            "lunch_ratio": 0.4,
            "dinner_ratio": 0.25
        })
        
        breakfast_cal = int(base_calories * meal_structure.get("breakfast_ratio", 0.3))
        lunch_cal = int(base_calories * meal_structure.get("lunch_ratio", 0.4))
        dinner_cal = int(base_calories * meal_structure.get("dinner_ratio", 0.25))
        snack_cal = base_calories - breakfast_cal - lunch_cal - dinner_cal
        
        return {
            "calories_target": base_calories,
            "breakfast": {
                "foods": self._select_meal_foods(grains, proteins, vegetables, fruits, "breakfast", day_index),
                "calories": breakfast_cal
            },
            "lunch": {
                "foods": self._select_meal_foods(grains, proteins, vegetables, fruits, "lunch", day_index),
                "calories": lunch_cal
            },
            "dinner": {
                "foods": self._select_meal_foods(grains, proteins, vegetables, fruits, "dinner", day_index),
                "calories": dinner_cal
            },
            "snacks": {
                "foods": self._select_snacks(fruits, day_index),
                "calories": snack_cal
            },
            "hydration_goal": diet_framework.get("hydration_goal", "2000ml")
        }
    
    def _get_default_foods(self) -> List[Dict]:
        """获取默认食材列表"""
        return [
            {"food_id": "brown_rice", "name": "糙米", "category": "grains"},
            {"food_id": "oatmeal", "name": "燕麦", "category": "grains"},
            {"food_id": "chicken_breast", "name": "鸡胸肉", "category": "protein"},
            {"food_id": "egg", "name": "鸡蛋", "category": "protein"},
            {"food_id": "salmon", "name": "三文鱼", "category": "protein"},
            {"food_id": "broccoli", "name": "西兰花", "category": "vegetables"},
            {"food_id": "spinach", "name": "菠菜", "category": "vegetables"},
            {"food_id": "tomato", "name": "番茄", "category": "vegetables"},
            {"food_id": "apple", "name": "苹果", "category": "fruits"},
            {"food_id": "banana", "name": "香蕉", "category": "fruits"}
        ]
    
    def _select_meal_foods(
        self,
        grains: List,
        proteins: List,
        vegetables: List,
        fruits: List,
        meal_type: str,
        day_index: int
    ) -> List[Dict]:
        """选择一餐的食材"""
        foods = []
        
        # 早餐
        if meal_type == "breakfast":
            if grains:
                grain = grains[day_index % len(grains)]
                foods.append({"food_id": grain.get("food_id", grain.get("id", "")), "name": grain.get("name"), "portion": "50g"})
            if proteins:
                protein = proteins[(day_index + 1) % len(proteins)]
                foods.append({"food_id": protein.get("food_id", protein.get("id", "")), "name": protein.get("name"), "portion": "1份"})
            foods.append({"food_id": "milk", "name": "牛奶", "portion": "250ml"})
        
        # 午餐
        elif meal_type == "lunch":
            if grains:
                grain = grains[(day_index + 1) % len(grains)]
                foods.append({"food_id": grain.get("food_id", grain.get("id", "")), "name": grain.get("name"), "portion": "150g"})
            if proteins:
                protein = proteins[day_index % len(proteins)]
                foods.append({"food_id": protein.get("food_id", protein.get("id", "")), "name": protein.get("name"), "portion": "100g"})
            if vegetables:
                veg = vegetables[day_index % len(vegetables)]
                foods.append({"food_id": veg.get("food_id", veg.get("id", "")), "name": veg.get("name"), "portion": "150g"})
        
        # 晚餐
        elif meal_type == "dinner":
            if grains:
                grain = grains[(day_index + 2) % len(grains)]
                foods.append({"food_id": grain.get("food_id", grain.get("id", "")), "name": grain.get("name"), "portion": "100g"})
            if proteins:
                protein = proteins[(day_index + 2) % len(proteins)]
                foods.append({"food_id": protein.get("food_id", protein.get("id", "")), "name": protein.get("name"), "portion": "80g"})
            if vegetables:
                veg1 = vegetables[(day_index + 1) % len(vegetables)]
                foods.append({"food_id": veg1.get("food_id", veg1.get("id", "")), "name": veg1.get("name"), "portion": "100g"})
                if len(vegetables) > 1:
                    veg2 = vegetables[(day_index + 2) % len(vegetables)]
                    foods.append({"food_id": veg2.get("food_id", veg2.get("id", "")), "name": veg2.get("name"), "portion": "100g"})
        
        return foods
    
    def _select_snacks(self, fruits: List, day_index: int) -> List[Dict]:
        """选择零食/加餐"""
        snacks = []
        if fruits:
            fruit = fruits[day_index % len(fruits)]
            snacks.append({"food_id": fruit.get("food_id", fruit.get("id", "")), "name": fruit.get("name"), "portion": "1个"})
        snacks.append({"food_id": "nuts", "name": "坚果", "portion": "一小把"})
        return snacks
    
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
    user_adjustments: Optional[Dict] = None
) -> Dict:
    """
    生成周计划的便捷函数
    """
    return weekly_plan_generator.generate_weekly_plan(
        monthly_plan=monthly_plan,
        user_preferences=user_preferences,
        week_number=week_number,
        week_start_date=week_start_date,
        user_adjustments=user_adjustments
    )
