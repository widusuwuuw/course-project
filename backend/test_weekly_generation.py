"""测试新的周计划生成 - 模拟完整流程"""
from app.services.weekly_plan_generator import WeeklyPlanGenerator
import json
from datetime import datetime, timedelta

gen = WeeklyPlanGenerator()

# 模拟一个只有1种运动的月度计划（旧数据场景）
monthly_plan = {
    "exercise_framework": {
        "weekly_frequency": 5,
        "intensity_range": ["light"],
        "selected_exercises": [
            {
                "exercise_id": "baduanjin",
                "name": "八段锦",
                "category": "传统中式",
                "frequency_per_week": 5,
                "duration_minutes": 12
            }
        ],
        "rest_days": ["sunday"]
    },
    "diet_framework": {
        "recommended_foods": [],
        "foods_to_avoid": [],
        "principles": []
    },
    "medical_constraints": {
        "max_intensity": "moderate",
        "forbidden_conditions": []
    }
}

# 用户偏好
user_preferences = {}

# 生成周计划
week_start = datetime.now() - timedelta(days=datetime.now().weekday())  # 本周一

result = gen.generate_weekly_plan(
    monthly_plan=monthly_plan,
    user_preferences=user_preferences,
    week_number=3,
    week_start_date=week_start
)

print("=" * 60)
print("新生成的周计划 - 运动多样性测试")
print("=" * 60)

days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

for day, name in zip(days, day_names):
    plan = result['daily_plans'].get(day, {})
    exercise = plan.get('exercise')
    if exercise:
        print(f"{name}: {exercise.get('name')} ({exercise.get('duration')}分钟) - {exercise.get('execution_guide', '')[:30]}...")
    else:
        print(f"{name}: 休息日")

print("\n替代运动方案示例 (周一):")
monday_ex = result['daily_plans'].get('monday', {}).get('exercise', {})
for alt in monday_ex.get('alternatives', []):
    print(f"  - {alt.get('name')}")
