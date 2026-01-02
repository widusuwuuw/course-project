import sqlite3
import json

conn = sqlite3.connect('dev.db')
cursor = conn.cursor()
cursor.execute('SELECT id, daily_plans FROM weekly_plans WHERE user_id=6 ORDER BY id DESC LIMIT 1')
row = cursor.fetchone()

if row:
    plan_id, daily_plans_json = row
    print(f"Plan ID: {plan_id}")
    
    daily_plans = json.loads(daily_plans_json)
    
    # 检查周一的数据
    monday = daily_plans.get('monday', {})
    print(f"\nMonday is_rest_day: {monday.get('is_rest_day')}")
    
    exercises = monday.get('exercises', [])
    print(f"Monday exercises count: {len(exercises)}")
    
    if exercises:
        print("\nFirst exercise:")
        print(json.dumps(exercises[0], indent=2, ensure_ascii=False))
    
    # 检查周五的数据（你说有3个运动）
    friday = daily_plans.get('friday', {})
    friday_exercises = friday.get('exercises', [])
    print(f"\n\nFriday exercises count: {len(friday_exercises)}")
    if friday_exercises:
        print("\nFriday exercises:")
        for i, ex in enumerate(friday_exercises, 1):
            has_calories = 'calories_target' in ex
            print(f"{i}. {ex.get('name')} - duration: {ex.get('duration')}min, has_calories_target: {has_calories}")
            if has_calories:
                print(f"   calories_target: {ex.get('calories_target')}")
else:
    print("No weekly plan found")

conn.close()
