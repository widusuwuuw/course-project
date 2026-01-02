"""查看周计划中的饮食数据"""
import json
from app.db import SessionLocal
from app.models import WeeklyPlan

db = SessionLocal()
plan = db.query(WeeklyPlan).order_by(WeeklyPlan.id.desc()).first()
if plan and plan.daily_plans:
    daily_plans = json.loads(plan.daily_plans)
    
    # 只看周一的饮食计划
    monday = daily_plans.get('monday', {})
    diet = monday.get('diet', {})
    
    print('=== 周一的饮食计划 ===')
    print(f"每日卡路里目标: {diet.get('calories_target', 0)} kcal")
    print(f"每日饮水目标: {diet.get('hydration_goal', '无')}")
    print()
    
    for meal in ['breakfast', 'lunch', 'dinner', 'snacks']:
        meal_data = diet.get(meal, {})
        print(f"【{meal}】热量: {meal_data.get('calories', 0)} kcal")
        for food in meal_data.get('foods', []):
            print(f"  - {food.get('name')} ({food.get('portion', '')})")
        print()
    
    # 看看整个周的饮食变化
    print('\n=== 一周饮食概览 ===')
    weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    for i, day in enumerate(weekdays):
        day_plan = daily_plans.get(day, {})
        day_diet = day_plan.get('diet', {})
        if day_diet:
            breakfast_foods = [f.get('name') for f in day_diet.get('breakfast', {}).get('foods', [])]
            lunch_foods = [f.get('name') for f in day_diet.get('lunch', {}).get('foods', [])]
            print(f"{day_names[i]}: 早餐[{', '.join(breakfast_foods[:2])}...] 午餐[{', '.join(lunch_foods[:2])}...]")

db.close()
