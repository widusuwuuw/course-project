"""查看月度计划内容"""
import json
from app.db import SessionLocal
from app.models import MonthlyPlan

db = SessionLocal()
plan = db.query(MonthlyPlan).order_by(MonthlyPlan.id.desc()).first()
if plan:
    print('=== 月度计划基本信息 ===')
    print(f'ID: {plan.id}')
    print(f'月份: {plan.plan_month}')
    print(f'标题: {plan.plan_title}')
    print(f'是否活跃: {plan.is_active}')
    print()
    
    print('=== 月度目标 ===')
    if plan.month_goal:
        month_goal = json.loads(plan.month_goal)
        print(f"主要目标: {month_goal.get('primary_target', '无')}")
        print(f"成功标准: {month_goal.get('success_criteria', '无')}")
        print(f"目标指标:")
        for t in month_goal.get('target_metrics', []):
            print(f"  - {t.get('name')} ({t.get('improvement_direction')}, {t.get('priority')})")
    print()
    
    print('=== 运动框架 ===')
    if plan.exercise_framework:
        exercise = json.loads(plan.exercise_framework)
        print(f"每周频率: {exercise.get('weekly_frequency', 0)}次")
        print(f"强度范围: {exercise.get('intensity_range', [])}")
        print(f"休息日: {exercise.get('rest_days', [])}")
        print(f"递进说明: {exercise.get('progression_note', '')}")
        print(f"选中运动数: {len(exercise.get('selected_exercises', []))}种")
        for ex in exercise.get('selected_exercises', []):
            print(f"  - {ex.get('name')} ({ex.get('category')}, {ex.get('frequency_per_week')}次/周, {ex.get('duration_minutes')}分钟, {ex.get('best_time')}, {ex.get('best_days', [])})")
    print()
    
    print('=== 饮食框架 ===')
    if plan.diet_framework:
        diet = json.loads(plan.diet_framework)
        print(f"饮食原则: {diet.get('principles', [])}")
        meal = diet.get('meal_structure', {})
        br = meal.get('breakfast_ratio', 0)
        lr = meal.get('lunch_ratio', 0)
        dr = meal.get('dinner_ratio', 0)
        print(f"三餐比例: 早{br*100:.0f}% 午{lr*100:.0f}% 晚{dr*100:.0f}%")
        print(f"每日饮水: {diet.get('hydration_goal', '未知')}")
        print(f"避免食物: {diet.get('foods_to_avoid', [])}")
        print(f"推荐食材数: {len(diet.get('recommended_foods', []))}种")
        for food in diet.get('recommended_foods', []):
            print(f"  - {food.get('name')} ({food.get('category')}, {food.get('frequency')}, {food.get('serving_suggestion', '')})")
    print()
    
    print('=== 每周主题 ===')
    if plan.weekly_themes:
        weekly_themes = json.loads(plan.weekly_themes)
        for week in weekly_themes:
            print(f"第{week.get('week')}周 [{week.get('theme')}]: {week.get('focus')} (运动:{week.get('exercise_intensity')}, 饮食:{week.get('diet_focus')})")
    print()
    
    print('=== AI 解读 ===')
    print(plan.ai_interpretation or '无')

db.close()
