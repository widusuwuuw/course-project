"""测试运动补充功能"""
from app.services.weekly_plan_generator import WeeklyPlanGenerator
from app.data.exercise_database import EXERCISE_DATABASE

gen = WeeklyPlanGenerator()

# 模拟月度计划只有1种运动
existing = [{'exercise_id': 'baduanjin', 'name': '八段锦', 'category': '传统中式'}]
medical_constraints = {'max_intensity': 'moderate', 'forbidden_conditions': []}
user_preferences = {}

# 测试补充功能
result = gen._supplement_exercises_from_database(existing, medical_constraints, user_preferences)
print(f'补充后的运动数量: {len(result)}')
print('运动列表:')
for ex in result:
    print(f"  - {ex.get('name')} (类别: {ex.get('category')})")
