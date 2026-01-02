"""查看当前的月度计划和周计划"""
from app.db import SessionLocal
from app.models import MonthlyPlan, WeeklyPlan
import json

db = SessionLocal()

# 查看月度计划
print("=" * 50)
print("月度计划")
print("=" * 50)
monthly = db.query(MonthlyPlan).filter(MonthlyPlan.is_active == True).order_by(MonthlyPlan.id.desc()).first()
if monthly:
    print(f"ID: {monthly.id}")
    print(f"月份: {monthly.plan_month}")
    print(f"标题: {monthly.plan_title}")
    
    if monthly.exercise_framework:
        ef = json.loads(monthly.exercise_framework)
        print(f"\n运动框架:")
        print(f"  每周频率: {ef.get('weekly_frequency')}")
        print(f"  强度范围: {ef.get('intensity_range')}")
        print(f"\n  选择的运动 ({len(ef.get('selected_exercises', []))}种):")
        for ex in ef.get('selected_exercises', []):
            print(f"    - {ex.get('name')} (ID: {ex.get('exercise_id')}, 类别: {ex.get('category', '未知')})")
else:
    print("没有找到活跃的月度计划")

# 查看周计划
print("\n" + "=" * 50)
print("周计划")
print("=" * 50)
weekly = db.query(WeeklyPlan).order_by(WeeklyPlan.id.desc()).first()
if weekly:
    print(f"ID: {weekly.id}")
    print(f"周数: 第{weekly.week_number}周")
    print(f"日期: {weekly.week_start_date} 至 {weekly.week_end_date}")
    
    if weekly.daily_plans:
        dp = json.loads(weekly.daily_plans)
        print(f"\n每日运动安排:")
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        for day, name in zip(days, day_names):
            if day in dp:
                exercise = dp[day].get('exercise')
                if exercise:
                    print(f"  {name}: {exercise.get('name')} ({exercise.get('duration')}分钟)")
                else:
                    print(f"  {name}: 休息日")
            else:
                print(f"  {name}: 无数据")
else:
    print("没有找到周计划")

db.close()
