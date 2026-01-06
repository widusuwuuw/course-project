"""
在服务器上运行此脚本检查周计划数据
cd /opt/omnihealth/backend && python3 check_diet_target.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import User, WeeklyPlan
import json
from datetime import datetime

db = SessionLocal()

# 获取今天的星期几
today = datetime.now().date()
weekday_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
weekday = weekday_names[today.weekday()]

print("=" * 60)
print(f"检查今日({today}, {weekday})饮食目标")
print("=" * 60)

# 列出所有用户和他们的周计划
users = db.query(User).all()
print(f"\n共有 {len(users)} 个用户")

for user in users:
    print(f"\n{'='*40}")
    print(f"用户: {user.email} (ID: {user.id})")
    
    # 查找当前周计划
    plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.user_id == user.id,
        WeeklyPlan.week_start_date <= today,
        WeeklyPlan.week_end_date >= today
    ).first()
    
    # 如果没有当前周计划，找最近的
    if not plan:
        plan = db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == user.id
        ).order_by(WeeklyPlan.week_start_date.desc()).first()
    
    if not plan:
        print("  没有周计划")
        continue
    
    print(f"  周计划ID: {plan.id}")
    print(f"  周期: {plan.week_start_date} - {plan.week_end_date}")
    
    daily_plans = json.loads(plan.daily_plans) if plan.daily_plans else {}
    today_plan = daily_plans.get(weekday)
    
    if not today_plan:
        print(f"  今天({weekday})没有计划")
        # 显示有哪些天
        print(f"  可用的天: {list(daily_plans.keys())}")
        continue
    
    print(f"\n  === 今日({weekday})计划 ===")
    
    diet = today_plan.get('diet')
    if diet:
        # ★关键字段★
        calories_target = diet.get('calories_target')
        print(f"\n  ★★★ diet.calories_target = {calories_target} kcal ★★★")
        
        # 每日总计
        daily_totals = diet.get('daily_totals')
        if daily_totals:
            print(f"  daily_totals.calories = {daily_totals.get('calories')}")
        
        # 各餐
        print(f"\n  各餐热量:")
        total_meal_cal = 0
        for meal in ['breakfast', 'lunch', 'dinner', 'snacks']:
            m = diet.get(meal)
            if m:
                cal = m.get('calories', 0)
                total_meal_cal += cal
                print(f"    {meal}: {cal} kcal")
        print(f"  累加各餐: {total_meal_cal} kcal")
    else:
        print("  没有饮食数据")
    
    exercise = today_plan.get('exercise')
    if exercise:
        print(f"\n  运动: {exercise.get('name')}")
        print(f"  exercise.calories_target = {exercise.get('calories_target')}")
    else:
        is_rest = today_plan.get('is_rest_day', False)
        print(f"\n  运动: 无 (休息日: {is_rest})")

db.close()
print("\n检查完成")
