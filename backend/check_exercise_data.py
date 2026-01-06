"""检查运动数据结构"""
import sqlite3
import json

conn = sqlite3.connect('../dev.db')
cursor = conn.cursor()
cursor.execute('SELECT daily_plans FROM weekly_plans LIMIT 1')
plan = cursor.fetchone()
daily_plans = json.loads(plan[0]) if plan else {}

print("=== 各天运动情况 ===")
for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
    day_data = daily_plans.get(day)
    if day_data:
        exercise = day_data.get('exercise')
        is_rest = day_data.get('is_rest_day', False)
        if exercise:
            name = exercise.get('name')
            cal_target = exercise.get('calories_target')
            cal_burn = exercise.get('calories_burn')
            duration = exercise.get('duration')
            print(f"{day}: {name}")
            print(f"  - calories_target: {cal_target}")
            print(f"  - calories_burn: {cal_burn}")
            print(f"  - duration: {duration}")
        else:
            print(f"{day}: 无运动 (is_rest_day={is_rest})")

conn.close()
