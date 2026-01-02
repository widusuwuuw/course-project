"""
运动-饮食联动服务

功能：
1. 根据当日运动消耗动态调整卡路里目标
2. 计算净卡路里摄入 (摄入 - 消耗)
3. 提供运动后饮食建议
"""

import logging
from typing import Dict, Optional, List
from datetime import date
import json

logger = logging.getLogger(__name__)


# 基础代谢率计算（Mifflin-St Jeor 公式）
def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """
    计算基础代谢率 (BMR)
    
    Args:
        weight_kg: 体重(kg)
        height_cm: 身高(cm)
        age: 年龄
        gender: 性别 (male/female)
    
    Returns:
        BMR (kcal/day)
    """
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    
    return round(bmr, 1)


# 活动系数
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,       # 久坐不动
    "light": 1.375,         # 轻度活动
    "moderate": 1.55,       # 中度活动
    "active": 1.725,        # 高度活动
    "very_active": 1.9      # 极高活动
}


def calculate_tdee(bmr: float, activity_level: str = "moderate") -> float:
    """
    计算每日总能量消耗 (TDEE)
    
    Args:
        bmr: 基础代谢率
        activity_level: 活动水平
    
    Returns:
        TDEE (kcal/day)
    """
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
    return round(bmr * multiplier, 1)


def calculate_exercise_calories(
    exercises: List[Dict],
    user_weight_kg: float = 65
) -> Dict:
    """
    计算运动消耗卡路里
    
    Args:
        exercises: 运动列表，每个运动包含 duration, calories_target 或 intensity
        user_weight_kg: 用户体重
    
    Returns:
        {
            "total_calories": 总消耗,
            "exercises": [各运动详情],
            "recovery_suggestion": 恢复建议
        }
    """
    total_calories = 0
    exercise_details = []
    
    for ex in exercises:
        name = ex.get("name", "未知运动")
        duration = ex.get("duration", 30)
        
        # 优先使用计划中的卡路里目标
        if "calories_target" in ex and ex["calories_target"]:
            calories = ex["calories_target"]
        else:
            # 根据强度估算
            intensity = ex.get("intensity", "moderate")
            met_values = {
                "low": 3.0,
                "light": 3.5,
                "moderate": 5.0,
                "high": 7.0,
                "vigorous": 9.0
            }
            met = met_values.get(intensity, 5.0)
            # 卡路里 = MET × 体重(kg) × 时间(h)
            calories = met * user_weight_kg * (duration / 60)
        
        total_calories += calories
        exercise_details.append({
            "name": name,
            "duration": duration,
            "calories": round(calories, 1)
        })
    
    # 恢复建议
    recovery_suggestion = None
    if total_calories >= 500:
        recovery_suggestion = "高强度运动后，建议增加优质蛋白质摄入，帮助肌肉恢复"
    elif total_calories >= 300:
        recovery_suggestion = "中等运动量，注意补充水分和碳水化合物"
    elif total_calories >= 150:
        recovery_suggestion = "轻度运动后，正常饮食即可"
    
    return {
        "total_calories": round(total_calories, 1),
        "exercises": exercise_details,
        "recovery_suggestion": recovery_suggestion
    }


def calculate_adjusted_calories(
    base_calories: int,
    exercise_calories: float,
    goal: str = "maintain"
) -> Dict:
    """
    根据运动调整每日卡路里目标
    
    Args:
        base_calories: 基础目标卡路里（来自计划）
        exercise_calories: 运动消耗卡路里
        goal: 目标 (lose_weight/maintain/gain_muscle)
    
    Returns:
        {
            "adjusted_target": 调整后目标,
            "net_target": 净摄入目标,
            "adjustment": 调整量,
            "explanation": 说明
        }
    """
    # 根据目标决定是否补充运动消耗
    if goal == "lose_weight":
        # 减重：不完全补充运动消耗，制造热量缺口
        adjustment = exercise_calories * 0.3  # 只补充30%
        explanation = "减重期：适当增加摄入补充能量，但保持热量缺口"
    elif goal == "gain_muscle":
        # 增肌：完全补充运动消耗，甚至略有盈余
        adjustment = exercise_calories * 1.1  # 补充110%
        explanation = "增肌期：充分补充运动消耗，保证肌肉合成所需能量"
    else:
        # 维持：完全补充运动消耗
        adjustment = exercise_calories * 0.8  # 补充80%
        explanation = "维持期：适当补充运动消耗，保持能量平衡"
    
    adjusted_target = base_calories + adjustment
    
    return {
        "base_calories": base_calories,
        "exercise_calories": round(exercise_calories, 1),
        "adjustment": round(adjustment, 1),
        "adjusted_target": round(adjusted_target, 1),
        "net_target": base_calories,  # 净目标不变
        "explanation": explanation
    }


def get_post_exercise_meal_suggestions(
    exercise_type: str,
    exercise_intensity: str,
    time_of_day: str
) -> List[str]:
    """
    根据运动类型和时间提供餐食建议
    
    Args:
        exercise_type: 运动类型 (cardio/strength/flexibility/mixed)
        exercise_intensity: 强度
        time_of_day: 时间 (morning/afternoon/evening)
    
    Returns:
        建议列表
    """
    suggestions = []
    
    # 基础建议
    suggestions.append("运动后30分钟内补充水分和少量碳水")
    
    # 根据运动类型
    if exercise_type in ["strength", "resistance"]:
        suggestions.append("力量训练后，建议摄入蛋白质帮助肌肉修复")
        suggestions.append("推荐：鸡蛋、鸡胸肉、牛奶、豆制品")
    elif exercise_type in ["cardio", "aerobic"]:
        suggestions.append("有氧运动后，注意补充流失的电解质")
        suggestions.append("推荐：香蕉、橙子、全麦面包")
    elif exercise_type in ["flexibility", "yoga"]:
        suggestions.append("拉伸运动后，清淡饮食即可")
    
    # 根据时间
    if time_of_day == "morning":
        suggestions.append("晨练后宜选择消化快的早餐，避免过于油腻")
    elif time_of_day == "evening":
        suggestions.append("晚间运动后避免大量进食，可选择轻食或水果")
    
    # 根据强度
    if exercise_intensity in ["high", "vigorous"]:
        suggestions.append("高强度运动后，可适当增加一餐加餐")
    
    return suggestions


def analyze_exercise_diet_balance(
    daily_intake: float,
    daily_exercise: float,
    target_calories: int,
    goal: str = "maintain"
) -> Dict:
    """
    分析运动与饮食的平衡状态
    
    Returns:
        {
            "net_calories": 净摄入,
            "status": 状态 (deficit/balanced/surplus),
            "message": 分析消息,
            "recommendation": 建议
        }
    """
    net_calories = daily_intake - daily_exercise
    
    # 计算与目标的差距
    if goal == "lose_weight":
        ideal_net = target_calories - 300  # 减重需要300卡缺口
    elif goal == "gain_muscle":
        ideal_net = target_calories + 200  # 增肌需要200卡盈余
    else:
        ideal_net = target_calories
    
    difference = net_calories - ideal_net
    
    if difference < -200:
        status = "deficit"
        message = f"今日热量缺口较大({abs(round(difference))}kcal)，可能影响基础代谢"
        if goal == "lose_weight":
            recommendation = "减重期也需要保证基础能量供给，建议增加一份健康加餐"
        else:
            recommendation = "建议增加碳水和蛋白质摄入，避免能量不足"
    elif difference > 200:
        status = "surplus"
        message = f"今日热量盈余{round(difference)}kcal"
        if goal == "gain_muscle":
            recommendation = "增肌期热量盈余正常，注意蛋白质摄入比例"
        else:
            recommendation = "建议增加运动量或适当控制下一餐摄入"
    else:
        status = "balanced"
        message = "今日能量收支基本平衡"
        recommendation = "继续保持良好的饮食运动习惯！"
    
    return {
        "daily_intake": round(daily_intake, 1),
        "daily_exercise": round(daily_exercise, 1),
        "net_calories": round(net_calories, 1),
        "target_net": ideal_net,
        "difference": round(difference, 1),
        "status": status,
        "message": message,
        "recommendation": recommendation
    }
