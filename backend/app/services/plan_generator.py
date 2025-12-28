"""
月度计划生成服务 - 基于三层围栏架构

架构设计：
第一层围栏：规则引擎 - 分析健康指标，提取医学约束
第二层围栏：元数据库过滤 - 从运动库/食材库筛选合适选项
第三层围栏：AI在有限选项内组合 - 按JSON Schema生成结构化计划

流程：
1. 从UserHealthProfile获取完整健康指标
2. 调用规则引擎分析，提取医学约束
3. 从元数据库筛选合适的运动和食材
4. 构建围栏式提示词，要求AI按Schema输出JSON
5. 后端校验AI输出，确保只使用允许的选项
6. 存储到MonthlyPlan表
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import asdict

from .rule_engine import MedicalRuleEngine
from .deepseek_client import generate_answer, is_enabled as deepseek_enabled
from ..data.exercise_database import (
    EXERCISE_DATABASE,
    ExerciseResource,
    ExerciseCategory,
    IntensityLevel,
    ImpactLevel,
    MEDICAL_CONDITIONS_DATABASE
)
from ..data.food_ingredients_data import CORE_FOODS_DATA
from ..data.food_database import FoodResource, GlycemicIndex

logger = logging.getLogger(__name__)

# 强度级别映射
INTENSITY_LEVELS = {
    "light": 1,
    "moderate": 2,
    "vigorous": 3
}


class PlanGenerator:
    """月度计划生成器"""
    
    def __init__(self):
        self.rule_engine = MedicalRuleEngine()
    
    def extract_medical_constraints(self, rule_result: Dict) -> Dict:
        """
        从规则引擎结果中提取医学约束
        
        Args:
            rule_result: 规则引擎分析结果
            
        Returns:
            Dict: 医学约束，包括禁忌症、最大强度、监测指标等
        """
        constraints = {
            "forbidden_conditions": [],  # 禁忌条件列表
            "max_intensity": "vigorous",  # 默认允许高强度
            "monitoring_metrics": [],  # 需要监测的指标
            "dietary_restrictions": [],  # 饮食限制
            "risk_factors": [],  # 风险因素
            "priority_improvements": []  # 优先改善领域
        }
        
        individual_results = rule_result.get("individual_results", [])
        composite_results = rule_result.get("composite_results", [])
        
        # 分析异常指标
        for result in individual_results:
            if result.get("status") == "abnormal":
                metric_name = result.get("metric_name", "")
                risk_level = result.get("risk_level", "low")
                recommendations = result.get("recommendations", [])
                
                # 添加到监测指标
                constraints["monitoring_metrics"].append({
                    "name": metric_name,
                    "current_value": result.get("value"),
                    "risk_level": risk_level
                })
                
                # 添加到优先改善领域
                if risk_level in ["moderate", "high", "very_high", "critical"]:
                    constraints["priority_improvements"].append({
                        "metric": metric_name,
                        "risk_level": risk_level,
                        "recommendations": recommendations
                    })
                
                # 根据异常指标提取约束
                metric_key = result.get("metric_key", "")
                self._add_constraints_for_metric(constraints, metric_key, risk_level)
        
        # 分析复合规则结果
        for result in composite_results:
            risk_level = result.get("risk_level", "low")
            if risk_level in ["high", "very_high", "critical"]:
                constraints["risk_factors"].append({
                    "name": result.get("rule_name", ""),
                    "category": result.get("rule_category", ""),
                    "risk_level": risk_level
                })
                
                # 高风险时降低运动强度上限
                if risk_level in ["very_high", "critical"]:
                    constraints["max_intensity"] = "light"
                elif risk_level == "high" and constraints["max_intensity"] == "vigorous":
                    constraints["max_intensity"] = "moderate"
        
        return constraints
    
    def _add_constraints_for_metric(self, constraints: Dict, metric_key: str, risk_level: str):
        """根据异常指标添加具体约束"""
        
        # 血糖相关
        if metric_key in ["glu", "hba1c", "fasting_insulin", "homa_ir"]:
            constraints["forbidden_conditions"].append("糖尿病相关")
            constraints["dietary_restrictions"].append("控制糖分摄入")
            constraints["dietary_restrictions"].append("避免高GI食物")
        
        # 血脂相关
        if metric_key in ["tc", "tg", "ldl_c"]:
            constraints["dietary_restrictions"].append("控制脂肪摄入")
            constraints["dietary_restrictions"].append("避免高饱和脂肪食物")
        
        # 尿酸相关
        if metric_key == "uric_acid":
            constraints["forbidden_conditions"].append("高尿酸")
            constraints["dietary_restrictions"].append("低嘌呤饮食")
            constraints["dietary_restrictions"].append("避免海鲜和动物内脏")
        
        # 肾功能相关
        if metric_key in ["crea", "bun", "urea", "egfr"]:
            constraints["dietary_restrictions"].append("控制蛋白质摄入")
            if risk_level in ["high", "very_high"]:
                constraints["max_intensity"] = "moderate"
        
        # 肝功能相关
        if metric_key in ["alt", "ast", "ggt"]:
            constraints["dietary_restrictions"].append("避免酒精")
            constraints["dietary_restrictions"].append("清淡饮食")
        
        # 血压相关（如果有高血压风险因素）
        if "高血压" in str(constraints.get("risk_factors", [])):
            constraints["forbidden_conditions"].append("高血压")
            if constraints["max_intensity"] == "vigorous":
                constraints["max_intensity"] = "moderate"
    
    def filter_exercises(self, medical_constraints: Dict, user_preferences: Optional[Dict] = None) -> List[Dict]:
        """
        从运动元数据库筛选合适的运动
        
        Args:
            medical_constraints: 医学约束
            user_preferences: 用户偏好（可选）
            
        Returns:
            List[Dict]: 筛选后的运动列表（简化格式）
        """
        suitable_exercises = []
        max_intensity = medical_constraints.get("max_intensity", "vigorous")
        forbidden_conditions = medical_constraints.get("forbidden_conditions", [])
        
        for exercise in EXERCISE_DATABASE:
            # 检查强度是否在允许范围
            exercise_intensity = exercise.intensity.value
            if INTENSITY_LEVELS.get(exercise_intensity, 0) > INTENSITY_LEVELS.get(max_intensity, 3):
                continue
            
            # 检查是否有禁忌症冲突
            has_contraindication = False
            for forbidden in forbidden_conditions:
                # 检查运动的禁忌症是否包含相关条件
                for contra in exercise.medical_tags.contraindications:
                    if forbidden in contra or contra in forbidden:
                        has_contraindication = True
                        break
                if has_contraindication:
                    break
            
            # 特殊检查：高血压禁忌
            if "高血压" in forbidden_conditions:
                if exercise.intensity == IntensityLevel.VIGOROUS:
                    continue
                if "高血压" in exercise.medical_tags.contraindications:
                    continue
            
            # 特殊检查：心脏病禁忌
            if "心脏病" in str(forbidden_conditions):
                if exercise.intensity == IntensityLevel.VIGOROUS:
                    continue
                if exercise.medical_tags.monitoring_required:
                    continue
            
            if has_contraindication:
                continue
            
            # 通过筛选，添加到结果
            exercise_dict = {
                "id": exercise.id,
                "name": exercise.name,
                "category": exercise.category.value,
                "met_value": exercise.met_value,
                "intensity": exercise.intensity.value,
                "duration": exercise.duration,
                "calorie_burn": exercise.calorie_burn,
                "suitable_conditions": exercise.medical_tags.suitable_conditions,
                "impact_level": exercise.medical_tags.impact_level.value,
                "equipment": exercise.requirements.equipment,
                "space_required": exercise.requirements.space_required
            }
            
            # 如果有用户偏好，标记优先级
            if user_preferences:
                preferred_types = user_preferences.get("preferred_exercises", [])
                if exercise.id in preferred_types or exercise.name in preferred_types:
                    exercise_dict["priority"] = "high"
            
            suitable_exercises.append(exercise_dict)
        
        return suitable_exercises
    
    def filter_foods(self, medical_constraints: Dict, user_preferences: Optional[Dict] = None) -> List[Dict]:
        """
        从食材元数据库筛选合适的食材
        
        Args:
            medical_constraints: 医学约束
            user_preferences: 用户偏好（可选）
            
        Returns:
            List[Dict]: 筛选后的食材列表（简化格式）
        """
        suitable_foods = []
        dietary_restrictions = medical_constraints.get("dietary_restrictions", [])
        forbidden_conditions = medical_constraints.get("forbidden_conditions", [])
        
        for food in CORE_FOODS_DATA:
            # 检查禁忌症冲突
            has_contraindication = False
            for contra in food.medical_tags.contraindications:
                for restriction in dietary_restrictions:
                    if restriction in contra or contra in restriction:
                        has_contraindication = True
                        break
                if has_contraindication:
                    break
            
            if has_contraindication:
                continue
            
            # 特殊检查：血糖控制
            if "控制糖分摄入" in dietary_restrictions or "避免高GI食物" in dietary_restrictions:
                if food.medical_tags.glycemic_index == GlycemicIndex.HIGH:
                    continue
            
            # 特殊检查：低嘌呤饮食
            if "低嘌呤饮食" in dietary_restrictions:
                # 排除高嘌呤食物（海鲜类等）
                high_purine_keywords = ["海鲜", "内脏", "贝类", "虾", "蟹"]
                if any(keyword in food.name for keyword in high_purine_keywords):
                    continue
            
            # 检查用户过敏原
            if user_preferences:
                user_allergens = user_preferences.get("allergens", [])
                food_allergens = [a.value if hasattr(a, 'value') else str(a) for a in food.medical_tags.allergens]
                if any(allergen in food_allergens for allergen in user_allergens):
                    continue
                
                # 检查禁忌食材
                forbidden_foods = user_preferences.get("forbidden_foods", [])
                if food.name in forbidden_foods or food.id in forbidden_foods:
                    continue
            
            # 通过筛选，添加到结果
            food_dict = {
                "id": food.id,
                "name": food.name,
                "category": food.category.value,
                "calories": food.nutrients.calories,
                "protein": food.nutrients.protein,
                "carbs": food.nutrients.carbs,
                "fat": food.nutrients.fat,
                "fiber": food.nutrients.fiber,
                "glycemic_index": food.medical_tags.glycemic_index.value,
                "suitable_conditions": food.medical_tags.suitable_conditions
            }
            
            suitable_foods.append(food_dict)
        
        return suitable_foods
    
    def build_prompt(
        self,
        rule_result: Dict,
        medical_constraints: Dict,
        suitable_exercises: List[Dict],
        suitable_foods: List[Dict],
        user_preferences: Optional[Dict] = None
    ) -> str:
        """
        构建围栏式提示词
        
        Args:
            rule_result: 规则引擎分析结果
            medical_constraints: 医学约束
            suitable_exercises: 筛选后的运动列表
            suitable_foods: 筛选后的食材列表
            user_preferences: 用户偏好
            
        Returns:
            str: 提示词
        """
        prompt = f"""你是专业的健康教练AI。请基于以下医学分析结果，为用户生成一份为期1个月的健康改善计划。

## 重要约束
1. 你必须严格按照下方的JSON Schema格式输出
2. 运动计划只能从"可选运动列表"中选择（使用exercise_id字段）
3. 饮食建议只能从"可选食材列表"中选择（使用food_id字段）
4. 不得自行添加列表外的任何项目
5. 必须遵守医学约束中的所有禁忌

## 医学分析摘要
- 总体状态：{rule_result.get('overall_assessment', {}).get('overall_status', '未知')}
- 风险等级：{rule_result.get('overall_assessment', {}).get('overall_risk_level', '未知')}
- 异常指标数：{rule_result.get('overall_assessment', {}).get('abnormal_metrics', 0)}

## 医学约束（必须严格遵守）
- 最大允许运动强度：{medical_constraints.get('max_intensity', 'moderate')}
- 饮食限制：{json.dumps(medical_constraints.get('dietary_restrictions', []), ensure_ascii=False)}
- 优先改善领域：{json.dumps([p.get('metric') for p in medical_constraints.get('priority_improvements', [])], ensure_ascii=False)}
- 需监测指标：{json.dumps([m.get('name') for m in medical_constraints.get('monitoring_metrics', [])], ensure_ascii=False)}

## 可选运动列表（只能从中选择）
{json.dumps(suitable_exercises, ensure_ascii=False, indent=2)}

## 可选食材列表（只能从中选择）
{json.dumps(suitable_foods, ensure_ascii=False, indent=2)}

## 用户偏好
{json.dumps(user_preferences, ensure_ascii=False, indent=2) if user_preferences else '无特殊偏好'}

## 要求输出的JSON Schema
请严格按照以下格式输出，不要添加任何其他内容：

【重要】运动选择要求：
1. 必须从可选列表中选择至少5-7种不同的运动
2. 运动类型要多样化，尽量覆盖：有氧运动(2-3种)、力量训练(1-2种)、柔韧性/传统运动(1-2种)
3. 这样可以让用户每天有不同的运动体验，避免单调

```json
{{
  "month_goal": {{
    "primary_target": "本月主要改善目标（一句话描述）",
    "target_metrics": [
      {{
        "name": "指标名称",
        "improvement_direction": "降低/提高/稳定",
        "priority": "high/medium/low"
      }}
    ],
    "success_criteria": "月末评估标准"
  }},
  "exercise_framework": {{
    "weekly_frequency": 5,
    "intensity_range": ["light", "moderate"],
    "selected_exercises": [
      {{
        "exercise_id": "运动ID（必须来自可选列表）",
        "name": "运动名称",
        "category": "运动类别（有氧运动/力量训练/柔韧性训练/传统中式）",
        "frequency_per_week": 2,
        "duration_minutes": 30,
        "best_time": "早晨/下午/晚上",
        "best_days": ["monday", "thursday"]
      }}
    ],
    "rest_days": ["周日"],
    "progression_note": "强度递进说明"
  }},
  "diet_framework": {{
    "principles": ["原则1", "原则2"],
    "recommended_foods": [
      {{
        "food_id": "食材ID（必须来自可选列表）",
        "name": "食材名称",
        "category": "类别",
        "frequency": "每日/每周3次/适量",
        "serving_suggestion": "建议食用方式"
      }}
    ],
    "meal_structure": {{
      "breakfast_ratio": 0.3,
      "lunch_ratio": 0.4,
      "dinner_ratio": 0.3
    }},
    "foods_to_avoid": ["避免食物1", "避免食物2"],
    "hydration_goal": "每日饮水目标"
  }},
  "weekly_themes": [
    {{
      "week": 1,
      "theme": "适应期",
      "focus": "本周重点",
      "exercise_intensity": "low/moderate",
      "diet_focus": "饮食重点"
    }},
    {{
      "week": 2,
      "theme": "提升期",
      "focus": "本周重点",
      "exercise_intensity": "moderate",
      "diet_focus": "饮食重点"
    }},
    {{
      "week": 3,
      "theme": "巩固期",
      "focus": "本周重点",
      "exercise_intensity": "moderate",
      "diet_focus": "饮食重点"
    }},
    {{
      "week": 4,
      "theme": "评估期",
      "focus": "本周重点",
      "exercise_intensity": "moderate",
      "diet_focus": "饮食重点"
    }}
  ],
  "medical_constraints_applied": {{
    "forbidden_exercises": ["禁忌运动"],
    "forbidden_foods": ["禁忌食物"],
    "monitoring_reminders": ["监测提醒1", "监测提醒2"]
  }},
  "ai_interpretation": "简短的计划解读，说明为什么这样安排，不超过200字"
}}
```

请直接输出JSON，不要包含```json标记或其他文字说明。"""
        
        return prompt
    
    def validate_plan(
        self,
        plan: Dict,
        allowed_exercises: List[Dict],
        allowed_foods: List[Dict]
    ) -> Dict:
        """
        校验AI生成的计划，确保只使用允许的选项
        
        Args:
            plan: AI生成的计划
            allowed_exercises: 允许的运动列表
            allowed_foods: 允许的食材列表
            
        Returns:
            Dict: 校验并修正后的计划
        """
        allowed_exercise_ids = {e["id"] for e in allowed_exercises}
        allowed_food_ids = {f["id"] for f in allowed_foods}
        
        # 校验运动选择
        if "exercise_framework" in plan and "selected_exercises" in plan["exercise_framework"]:
            valid_exercises = []
            for exercise in plan["exercise_framework"]["selected_exercises"]:
                exercise_id = exercise.get("exercise_id")
                if exercise_id in allowed_exercise_ids:
                    valid_exercises.append(exercise)
                else:
                    logger.warning(f"移除不允许的运动: {exercise_id}")
            plan["exercise_framework"]["selected_exercises"] = valid_exercises
        
        # 校验食材选择
        if "diet_framework" in plan and "recommended_foods" in plan["diet_framework"]:
            valid_foods = []
            for food in plan["diet_framework"]["recommended_foods"]:
                food_id = food.get("food_id")
                if food_id in allowed_food_ids:
                    valid_foods.append(food)
                else:
                    logger.warning(f"移除不允许的食材: {food_id}")
            plan["diet_framework"]["recommended_foods"] = valid_foods
        
        return plan
    
    def generate_monthly_plan(
        self,
        health_metrics: Dict,
        gender: str = "default",
        user_preferences: Optional[Dict] = None
    ) -> Dict:
        """
        生成月度健康计划
        
        Args:
            health_metrics: 用户健康指标 {metric_key: value}
            gender: 性别
            user_preferences: 用户偏好
            
        Returns:
            Dict: 完整的月度计划
        """
        logger.info(f"开始生成月度计划，指标数量: {len(health_metrics)}")
        
        # 第一步：规则引擎分析
        rule_result = self.rule_engine.evaluate(health_metrics, gender)
        logger.info(f"规则引擎分析完成，异常指标: {rule_result.get('overall_assessment', {}).get('abnormal_metrics', 0)}")
        
        # 第二步：提取医学约束
        medical_constraints = self.extract_medical_constraints(rule_result)
        logger.info(f"医学约束提取完成，最大强度: {medical_constraints.get('max_intensity')}")
        
        # 第三步：从元数据库筛选
        suitable_exercises = self.filter_exercises(medical_constraints, user_preferences)
        suitable_foods = self.filter_foods(medical_constraints, user_preferences)
        logger.info(f"筛选完成，可用运动: {len(suitable_exercises)}，可用食材: {len(suitable_foods)}")
        
        # 第四步：构建提示词并调用AI
        if not deepseek_enabled():
            logger.error("DeepSeek API 未配置")
            return self._generate_fallback_plan(medical_constraints, suitable_exercises, suitable_foods)
        
        prompt = self.build_prompt(
            rule_result,
            medical_constraints,
            suitable_exercises,
            suitable_foods,
            user_preferences
        )
        
        try:
            system_prompt = "你是专业的健康教练AI，擅长根据用户的健康状况制定个性化的运动和饮食计划。请严格按照要求的JSON格式输出。"
            response = generate_answer(prompt, system_prompt)
            
            # 解析JSON
            # 清理可能的markdown标记
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            plan = json.loads(response)
            logger.info("AI计划生成成功")
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}")
            return self._generate_fallback_plan(medical_constraints, suitable_exercises, suitable_foods)
        except Exception as e:
            logger.error(f"AI调用失败: {e}")
            return self._generate_fallback_plan(medical_constraints, suitable_exercises, suitable_foods)
        
        # 第五步：后端校验
        validated_plan = self.validate_plan(plan, suitable_exercises, suitable_foods)
        
        # 添加元数据
        validated_plan["_meta"] = {
            "generated_at": datetime.utcnow().isoformat(),
            "rule_engine_input": health_metrics,
            "rule_engine_output_summary": {
                "total_metrics": rule_result.get("overall_assessment", {}).get("total_metrics", 0),
                "abnormal_metrics": rule_result.get("overall_assessment", {}).get("abnormal_metrics", 0),
                "overall_status": rule_result.get("overall_assessment", {}).get("overall_status", "unknown"),
                "overall_risk_level": rule_result.get("overall_assessment", {}).get("overall_risk_level", "unknown")
            },
            "medical_constraints": medical_constraints,
            "available_exercises_count": len(suitable_exercises),
            "available_foods_count": len(suitable_foods)
        }
        
        return validated_plan
    
    def _generate_fallback_plan(
        self,
        medical_constraints: Dict,
        suitable_exercises: List[Dict],
        suitable_foods: List[Dict]
    ) -> Dict:
        """
        生成备用计划（当AI不可用时）
        
        Args:
            medical_constraints: 医学约束
            suitable_exercises: 可用运动
            suitable_foods: 可用食材
            
        Returns:
            Dict: 基础计划
        """
        # 选择前3个运动
        selected_exercises = suitable_exercises[:3] if len(suitable_exercises) >= 3 else suitable_exercises
        selected_foods = suitable_foods[:5] if len(suitable_foods) >= 5 else suitable_foods
        
        return {
            "month_goal": {
                "primary_target": "改善整体健康状况",
                "target_metrics": [],
                "success_criteria": "坚持执行计划"
            },
            "exercise_framework": {
                "weekly_frequency": 3,
                "intensity_range": ["light", medical_constraints.get("max_intensity", "moderate")],
                "selected_exercises": [
                    {
                        "exercise_id": ex["id"],
                        "name": ex["name"],
                        "frequency_per_week": 2,
                        "duration_minutes": ex.get("duration", 30),
                        "best_time": "任意"
                    }
                    for ex in selected_exercises
                ],
                "rest_days": ["周日"],
                "progression_note": "循序渐进，根据身体反应调整"
            },
            "diet_framework": {
                "principles": medical_constraints.get("dietary_restrictions", ["均衡饮食"]),
                "recommended_foods": [
                    {
                        "food_id": food["id"],
                        "name": food["name"],
                        "category": food["category"],
                        "frequency": "适量",
                        "serving_suggestion": "根据个人情况调整"
                    }
                    for food in selected_foods
                ],
                "meal_structure": {
                    "breakfast_ratio": 0.3,
                    "lunch_ratio": 0.4,
                    "dinner_ratio": 0.3
                },
                "foods_to_avoid": [],
                "hydration_goal": "每日2000ml"
            },
            "weekly_themes": [
                {"week": 1, "theme": "适应期", "focus": "培养习惯", "exercise_intensity": "light", "diet_focus": "调整饮食结构"},
                {"week": 2, "theme": "提升期", "focus": "增加频率", "exercise_intensity": "light", "diet_focus": "坚持计划"},
                {"week": 3, "theme": "巩固期", "focus": "保持稳定", "exercise_intensity": "moderate", "diet_focus": "精细调整"},
                {"week": 4, "theme": "评估期", "focus": "总结反思", "exercise_intensity": "moderate", "diet_focus": "形成习惯"}
            ],
            "medical_constraints_applied": {
                "forbidden_exercises": [],
                "forbidden_foods": [],
                "monitoring_reminders": [m.get("name", "") for m in medical_constraints.get("monitoring_metrics", [])]
            },
            "ai_interpretation": "这是基于您的健康数据生成的基础计划。建议根据实际执行情况进行调整。请注意遵守医学约束，如有不适请及时停止并咨询医生。",
            "_meta": {
                "generated_at": datetime.utcnow().isoformat(),
                "is_fallback": True,
                "medical_constraints": medical_constraints
            }
        }


# 单例实例
plan_generator = PlanGenerator()


def generate_monthly_plan(
    health_metrics: Dict,
    gender: str = "default",
    user_preferences: Optional[Dict] = None
) -> Dict:
    """
    生成月度健康计划的便捷函数
    
    Args:
        health_metrics: 用户健康指标
        gender: 性别
        user_preferences: 用户偏好
        
    Returns:
        Dict: 月度计划
    """
    return plan_generator.generate_monthly_plan(health_metrics, gender, user_preferences)
