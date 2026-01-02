"""测试运动-饮食联动服务"""

import sys
sys.path.insert(0, '.')

from app.services.exercise_diet_service import (
    calculate_exercise_calories,
    calculate_adjusted_calories,
    analyze_exercise_diet_balance,
    get_post_exercise_meal_suggestions
)

print("=" * 50)
print("🏃 运动-饮食联动测试")
print("=" * 50)

# 测试运动消耗计算
exercises = [
    {'name': '快走', 'duration': 30, 'calories_target': 150, 'intensity': 'moderate'},
    {'name': '八段锦', 'duration': 20, 'calories_target': 60, 'intensity': 'low'}
]
result = calculate_exercise_calories(exercises)
print('\n📊 运动消耗计算:')
print(f'  总消耗: {result["total_calories"]} kcal')
for ex in result["exercises"]:
    print(f'  - {ex["name"]}: {ex["calories"]} kcal ({ex["duration"]}分钟)')
print(f'  恢复建议: {result["recovery_suggestion"]}')

# 测试卡路里调整
adjusted = calculate_adjusted_calories(
    base_calories=2000,
    exercise_calories=210,
    goal='maintain'
)
print('\n🎯 卡路里调整:')
print(f'  基础目标: {adjusted["base_calories"]} kcal')
print(f'  运动消耗: {adjusted["exercise_calories"]} kcal')
print(f'  调整量: +{adjusted["adjustment"]} kcal')
print(f'  调整后目标: {adjusted["adjusted_target"]} kcal')
print(f'  说明: {adjusted["explanation"]}')

# 测试平衡分析
balance = analyze_exercise_diet_balance(
    daily_intake=1800,
    daily_exercise=210,
    target_calories=2000,
    goal='maintain'
)
print('\n⚖️ 能量平衡分析:')
print(f'  摄入: {balance["daily_intake"]} kcal')
print(f'  消耗: {balance["daily_exercise"]} kcal')
print(f'  净摄入: {balance["net_calories"]} kcal')
print(f'  状态: {balance["status"]}')
print(f'  消息: {balance["message"]}')
print(f'  建议: {balance["recommendation"]}')

# 测试餐食建议
suggestions = get_post_exercise_meal_suggestions(
    exercise_type='cardio',
    exercise_intensity='moderate',
    time_of_day='evening'
)
print('\n🍽️ 运动后餐食建议:')
for s in suggestions:
    print(f'  • {s}')

print('\n' + '=' * 50)
print('✅ 测试完成!')
print('=' * 50)
